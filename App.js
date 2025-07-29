const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');          
const path = require('path');
require('dotenv').config();

const connectDB = require('../config/database');
require('../config/passport')(passport);

const authRoutes = require('./routes/auth');
const movieRoutes = require('./routes/movie');

const app = express();

// Connect to MongoDB
connectDB();

// View engine
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session (store session in MongoDB)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGO_URI
  })
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Routes
app.use('/', authRoutes);
app.use('/movies', movieRoutes);

// Home
app.get('/', (req, res) => {
  res.render('index', { user: req.session.user });
});

// 404 page
app.use((req, res) => {
  res.status(404).send('404 Not Found');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 http://localhost:${PORT}`));
