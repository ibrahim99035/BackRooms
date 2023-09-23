const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const User = require('./user'); 
const router = express.Router();

// User registration route
router.post('/register', (req, res) => {
  const { username, password } = req.body;
  const newUser = new User({ username, password });

  newUser.save((err, user) => { // Get the saved user model
      if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Registration failed.' });
      }

      req.login(user, (err) => {
          if (err) return res.status(500).json({ message: 'Login after registration failed.' });

          // Return the user model on successful registration
          res.status(200).json({ message: 'Registration successful', user });
      });
  });
});

// User login route
router.post('/login', passport.authenticate('local'), (req, res) => {
  // Return the user model on successful login
  res.status(200).json({ message: 'Login successful', user: req.user });
});

// User logout route
router.get('/logout', (req, res) => {
  req.logout();
  res.status(200).json({ message: 'Logout successful.' });
});

module.exports = router;
