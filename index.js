const express = require('express');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
const crypto = require('crypto');

const authMiddleware = require('./authMiddleware');
const db = require('./database');
const userRoutes = require('./authenticate'); 
const control = require('./aspRoutes'); 

const app = express();

// Middleware setup (body-parser, passport, session)
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Generate a random secret key
const secretKey = crypto.randomBytes(64).toString('hex');
app.use(session({ secret: secretKey, resave: true, saveUninitialized: true }));

app.use(passport.initialize());
app.use(passport.session());

// Routs
app.use('/auth', userRoutes);
app.use('/control', control);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
