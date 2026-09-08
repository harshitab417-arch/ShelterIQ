const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { checkIsFallback } = require('../config/db');
const memoryStore = require('../config/inMemoryStore');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, organization, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email and password are required.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    if (checkIsFallback()) {
      const existing = memoryStore.users.find(u => u.email === email.toLowerCase());
      if (existing) return res.status(400).json({ error: 'User with this email already exists.' });

      const newUser = {
        _id: `user_${Date.now()}`,
        name,
        email: email.toLowerCase(),
        passwordHash,
        organization: organization || 'DRDO / Research Institute',
        role: role || 'Thermal Design Engineer',
        createdAt: new Date().toISOString()
      };
      memoryStore.users.push(newUser);

      const token = jwt.sign({ id: newUser._id, email: newUser.email, name: newUser.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.json({ token, user: { id: newUser._id, name: newUser.name, email: newUser.email, organization: newUser.organization } });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) return res.status(400).json({ error: 'User with this email already exists.' });

    const user = new User({ name, email: email.toLowerCase(), passwordHash, organization, role });
    await user.save();

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, organization: user.organization } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required.' });

    if (checkIsFallback()) {
      const user = memoryStore.users.find(u => u.email === email.toLowerCase());
      if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

      const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
      return res.json({ token, user: { id: user._id, name: user.name, email: user.email, organization: user.organization } });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ error: 'Invalid credentials.' });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ error: 'Invalid credentials.' });

    const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, organization: user.organization } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  res.json({ user: req.user || { name: 'DRDO Thermal Engineer', email: 'engineer@drdo.in' } });
});

module.exports = router;
