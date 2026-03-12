const express = require('express');
const authService = require('../services/auth.service');

const router = express.Router();

router.post('/signup', async (req, res) => {
  try {
    const response = await authService.signup({
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    return res.json(response);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Signup failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const response = await authService.login({
      email: req.body.email,
      password: req.body.password,
    });
    return res.json(response);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Login failed' });
  }
});

module.exports = router;
