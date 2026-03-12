const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const DB_PATH = process.env.AUTH_DB_PATH || path.join(__dirname, "..", "auth.sqlite");

const db = new sqlite3.Database(DB_PATH);

function initAuthDb() {
  db.serialize(() => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`,
    );
  });
}

function signToken(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN },
  );
}

function createError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

async function signup({ name, email, password }) {
  if (!name || !email || !password) {
    throw createError(400, "name, email, and password are required");
  }

  return new Promise((resolve, reject) => {
    db.get("SELECT id FROM users WHERE email = ?", [email], async (err, row) => {
      if (err) {
        return reject(createError(500, err.message));
      }
      if (row) {
        return reject(createError(409, "User already exists"));
      }

      try {
        const passwordHash = await bcrypt.hash(password, 10);
        const now = new Date().toISOString();
        const user = {
          id: uuidv4(),
          name,
          email,
          password_hash: passwordHash,
          created_at: now,
          updated_at: now,
        };

        db.run(
          `INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [user.id, user.name, user.email, user.password_hash, user.created_at, user.updated_at],
          (insertErr) => {
            if (insertErr) {
              return reject(createError(500, insertErr.message));
            }

            const token = signToken(user);
            return resolve({
              userId: user.id,
              name: user.name,
              email: user.email,
              token,
            });
          },
        );
      } catch (hashErr) {
        return reject(createError(500, hashErr.message));
      }
    });
  });
}

async function login({ email, password }) {
  if (!email || !password) {
    throw createError(400, "email and password are required");
  }

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, name, email, password_hash FROM users WHERE email = ?",
      [email],
      async (err, row) => {
        if (err) {
          return reject(createError(500, err.message));
        }
        if (!row) {
          return reject(createError(404, "User not found"));
        }

        const isValid = await bcrypt.compare(password, row.password_hash);
        if (!isValid) {
          return reject(createError(401, "Invalid credentials"));
        }

        const token = signToken(row);
        return resolve({
          userId: row.id,
          name: row.name,
          email: row.email,
          token,
        });
      },
    );
  });
}

async function getProfile(userId) {
  if (!userId) {
    throw createError(401, "Unauthorized");
  }

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, name, email, created_at, updated_at FROM users WHERE id = ?",
      [userId],
      (err, row) => {
        if (err) {
          return reject(createError(500, err.message));
        }
        if (!row) {
          return reject(createError(404, "User not found"));
        }
        return resolve({
          userId: row.id,
          name: row.name,
          email: row.email,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        });
      },
    );
  });
}

async function updateProfile(userId, { name, email, password }) {
  if (!userId) {
    throw createError(401, "Unauthorized");
  }

  if (!name && !email && !password) {
    throw createError(400, "At least one field is required");
  }

  return new Promise((resolve, reject) => {
    const ensureEmailAvailable = (callback) => {
      if (!email) {
        return callback();
      }
      db.get("SELECT id FROM users WHERE email = ?", [email], (err, row) => {
        if (err) {
          return reject(createError(500, err.message));
        }
        if (row && row.id !== userId) {
          return reject(createError(409, "Email already in use"));
        }
        return callback();
      });
    };

    const applyUpdate = async () => {
      const updates = [];
      const params = [];

      if (name) {
        updates.push("name = ?");
        params.push(name);
      }
      if (email) {
        updates.push("email = ?");
        params.push(email);
      }
      if (password) {
        try {
          const passwordHash = await bcrypt.hash(password, 10);
          updates.push("password_hash = ?");
          params.push(passwordHash);
        } catch (hashErr) {
          return reject(createError(500, hashErr.message));
        }
      }

      const updatedAt = new Date().toISOString();
      updates.push("updated_at = ?");
      params.push(updatedAt);
      params.push(userId);

      db.run(`UPDATE users SET ${updates.join(", ")} WHERE id = ?`, params, (err) => {
        if (err) {
          return reject(createError(500, err.message));
        }
        db.get(
          "SELECT id, name, email FROM users WHERE id = ?",
          [userId],
          (fetchErr, row) => {
            if (fetchErr) {
              return reject(createError(500, fetchErr.message));
            }
            if (!row) {
              return reject(createError(404, "User not found"));
            }
            const token = signToken(row);
            return resolve({
              userId: row.id,
              name: row.name,
              email: row.email,
              token,
            });
          },
        );
      });
    };

    ensureEmailAvailable(applyUpdate);
  });
}

module.exports = {
  initAuthDb,
  signup,
  login,
  getProfile,
  updateProfile,
};
