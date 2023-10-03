const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('./user').User; 
const authMiddleware = require('./authMiddleware');

const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');
const jwtSecretKey = secretKey;

const router = express.Router();

// User registration route
router.post('/register', async (req, res) => {
  try {
    const { fullname, username, email, password, phoneNumber } = req.body;

    if (!fullname || !username || !email || !password) {
      return res.status(400).json({ message: 'Please provide all required fields.' });
    }

    // Check if the user already exists based on username or email
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });

    if (existingUser) {
      return res.status(400).json({ message: 'User with this username or email already exists.' });
    }

    // Create a new user instance
    const newUser = new User({
      fullName: fullname,
      username: username,
      email: email,
      password: password, // No need to hash here
      phoneNumber: phoneNumber,
    });

    // Save the user to the database
    const savedUser = await newUser.save();

    // Return the user model on successful registration
    res.status(200).json({ message: 'Registration successful', user: savedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Registration failed.' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide both username and password.' });
    }

    // Check if the user exists based on the provided username
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(401).json({ message: 'User not found. Please check your username.' });
    }

    // Compare the provided password with the hashed password in the database
    const passwordMatch = await bcrypt.compare(password, user.password);
    console.log('Password match:', passwordMatch);
    console.log('--------------------------------------');

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid password. Please check your password.' });
    }

    // Generate a JWT token for the user
    const token = jwt.sign({ userId: user._id }, jwtSecretKey, { expiresIn: '65d' });

    res.status(200).json({ message: 'Login successful', token , user});
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Login failed. Please try again later.' });
  }
});

// Profile route to fetch user's profile data
router.get('/profile/:userId', async (req, res) => {
  try {
      const { userId } = req.params;
      
      // Fetch the user's profile data from the database
      const user = await User.findById(userId);

      if (!user) {
          return res.status(404).json({ message: 'User not found' });
      }

      // Send the user's profile data as a response
      res.status(200).json({ user: user });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Failed to fetch user profile' });
  }
});

// Logout route
router.get('/logout', (req, res) => {
  // Passport.js provides a `logout` method to invalidate the user's session
  req.logout();
  res.status(200).json({ message: 'Logout successful' });
});

module.exports = router;