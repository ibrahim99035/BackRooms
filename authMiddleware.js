const passport = require('passport');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const secretKey = crypto.randomBytes(64).toString('hex');
const jwtSecretKey = secretKey;

// Custom middleware to ensure user is authenticated
function ensureAuthenticated(req, res, next) {
    // Passport.js provides the `isAuthenticated` method to check if a user is authenticated
    if (req.isAuthenticated()) {
      // If the user is authenticated, allow them to access the route
      return next();
    }
  
    // If the user is not authenticated, redirect them to the login page or return an error message
    console.log(req.isAuthenticated());
    console.log(req.json);
    res.status(401).json({ message: 'Unauthorized. Please log in.' });
}
  
module.exports.ensureAuthenticated = ensureAuthenticated;
  