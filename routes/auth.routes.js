const express = require('express');
const authService = require('../services/auth.service');
const { authMiddleware } = require('../middleware/auth');

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

router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user.sub);
    return res.json(profile);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Profile fetch failed' });
  }
});

router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const response = await authService.updateProfile(req.user.sub, {
      name: req.body.name,
      email: req.body.email,
      password: req.body.password,
    });
    return res.json(response);
  } catch (error) {
    const status = error.status || 500;
    return res.status(status).json({ message: error.message || 'Profile update failed' });
  }
});

module.exports = router;
