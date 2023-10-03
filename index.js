const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const LocalStrategy = require('passport-local').Strategy;
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const flash = require('connect-flash');
const cors = require('cors');

const db = require('./database');
const userRoutes = require('./authenticate');
const control = require('./aspRoutes');
const User = require('./user').User;
const authMiddleware = require('./authMiddleware');

const app = express();

// Middleware setup (body-parser, passport, session)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(flash());
app.use(cors());

// Generate a random secret key for session management
const secretKey = crypto.randomBytes(64).toString('hex');
app.use(session({ secret: secretKey, resave: true, saveUninitialized: true }));

// Initialize Passport.js
app.use(passport.initialize());
app.use(passport.session());

const jwtSecretKey = secretKey;

// Configure the 'passport-local' strategy for username/password authentication
passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      // Find the user by username in your database
      const user = await User.findOne({ username: username }).exec();

      if (!user) {
        // User with the provided username not found
        return done(null, false, { message: 'Incorrect username.' });
      }

      // Compare the provided password with the user's hashed password
      const isMatch = await bcrypt.compare(password, user.password);

      if (isMatch) {
        // Authentication successful
        return done(null, user);
      } else {
        // Incorrect password
        return done(null, false, { message: 'Incorrect password.' });
      }
    } catch (err) {
      return done(err);
    }
  }
));

// Serialize and deserialize user for session management
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  // Find the user by ID and return it
  User.findById(id).exec()
    .then(user => {
      done(null, user);
    })
    .catch(err => {
      done(err, null);
    });
});

// Routes
app.use('/auth', userRoutes);
app.use('/control', control);

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
