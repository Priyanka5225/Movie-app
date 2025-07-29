const express = require('express');
const { body, validationResult } = require('express-validator');
const Movie = require('../models/movie');
const { ensureAuthenticated, checkMovieOwnership } = require('../middleware/auth');
const router = express.Router();

// Validation rules (reusable)
const movieValidation = [
  body('title')
    .notEmpty().withMessage('Title is required')
    .custom(value => isNaN(value)).withMessage('Title cannot be only a number'),
  body('director')
    .notEmpty().withMessage('Director is required')
    .custom(value => isNaN(value)).withMessage('Director name cannot be only a number'),
  body('year')
    .notEmpty().withMessage('Year is required')
    .isInt({ min: 1888, max: new Date().getFullYear() }).withMessage('Enter a valid year'),
  body('genre').notEmpty().withMessage('Genre is required'),
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 10 }).withMessage('Rating must be between 0 and 10'),
  body('description')
    .isLength({ min: 10 }).withMessage('Description must be at least 10 characters')
];

// Show all movies
router.get('/', async (req, res) => {
  try {
    const movies = await Movie.find().populate('createdBy').lean();
    res.render('movies', { movies, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Show add movie form
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('addMovie', { movie: {}, errors: [] });
});

// Create new movie
router.post('/', ensureAuthenticated, movieValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('addMovie', {
      movie: req.body,
      errors: errors.array()
    });
  }
  try {
    await Movie.create({ ...req.body, createdBy: req.session.user._id });
    res.redirect('/movies');
  } catch (err) {
    console.error(err);
    res.status(500).render('addMovie', {
      movie: req.body,
      errors: [{ msg: 'Server error. Please try again.' }]
    });
  }
});

// Show movie details
router.get('/:id', async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id).populate('createdBy').lean();
    if (!movie) return res.status(404).send('Movie not found');
    res.render('movies/show', { movie, user: req.session.user });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

// Show edit form
router.get('/:id/edit', ensureAuthenticated, checkMovieOwnership, async (req, res) => {
  const movie = await Movie.findById(req.params.id).lean();
  res.render('movies/edit', { movie, errors: [] });
});

// Update movie
router.post('/:id/edit', ensureAuthenticated, checkMovieOwnership, movieValidation, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).render('movies/edit', {
      movie: { _id: req.params.id, ...req.body },
      errors: errors.array()
    });
  }
  try {
    await Movie.findByIdAndUpdate(req.params.id, req.body);
    res.redirect(`/movies/${req.params.id}`);
  } catch (err) {
    console.error(err);
    res.status(500).render('movies/edit', {
      movie: { _id: req.params.id, ...req.body },
      errors: [{ msg: 'Server error. Please try again.' }]
    });
  }
});

// Delete movie
router.post('/:id/delete', ensureAuthenticated, checkMovieOwnership, async (req, res) => {
  try {
    await Movie.findByIdAndDelete(req.params.id);
    res.redirect('/movies');
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});

module.exports = router;

