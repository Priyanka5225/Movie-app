const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User = require('../models/user');

// Map express-validator errors to an object
function mapErrors(errorsArray) {
  const errors = {};
  errorsArray.forEach(err => {
    const field = err.param || 'general';
    // Append error if field already has errors
    if (errors[field]) {
      if (Array.isArray(errors[field])) {
        errors[field].push(err.msg);
      } else {
        errors[field] = [errors[field], err.msg];
      }
    } else {
      errors[field] = err.msg;
    }
  });
  return errors;
}

// GET: Register Form
router.get('/register', (req, res) => {
  res.render('register', { errors: {}, formData: {} });
});

// POST: Register User with Validation
router.post(
  '/register',
  [
    body('name')
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Must be a valid email')
      .normalizeEmail(),

    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  async (req, res) => {
    const errorsResult = validationResult(req);

    console.log('Validation errors:', errorsResult.array()); // Debug

    const { name, email, password } = req.body;

    if (!errorsResult.isEmpty()) {
      const errors = mapErrors(errorsResult.array());
      return res.status(400).render('register', {
        errors,
        formData: { name, email }
      });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).render('register', {
          errors: { email: 'Email already exists' },
          formData: { name, email }
        });
      }

      const newUser = new User({ name, email, password });
      await newUser.save();
      res.redirect('/login');
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).render('register', {
        errors: { general: 'Server error. Please try again.' },
        formData: { name, email }
      });
    }
  }
);

// GET: Login Form
router.get('/login', (req, res) => {
  res.render('login', { errors: {}, email: '' });
});

// POST: Login User with Validation
router.post(
  '/login',
  [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email'),

    body('password')
      .notEmpty().withMessage('Password is required'),
  ],
  async (req, res) => {
    const errorsResult = validationResult(req);
    const { email, password } = req.body;

    if (!errorsResult.isEmpty()) {
      const errors = mapErrors(errorsResult.array());
      return res.status(400).render('login', {
        errors,
        email
      });
    }

    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user || !(await user.comparePassword(password))) {
        return res.status(400).render('login', {
          errors: { general: 'Invalid email or password' },
          email
        });
      }

      req.session.user = {
        _id: user._id.toString(),
        name: user.name,
        email: user.email
      };

      res.redirect('/');
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).render('login', {
        errors: { general: 'Unexpected server error' },
        email
      });
    }
  }
);

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;

// const express = require('express');
// const router = express.Router();
// const { body, validationResult } = require('express-validator');
// const User = require('../models/user');

// // Map express-validator errors to an object
// function mapErrors(errorsArray) {
//   const errors = {};
//   errorsArray.forEach(err => {
//     errors[err.param] = err.msg;
//   });
//   return errors;
// }

// // GET: Register Form
// router.get('/register', (req, res) => {
//   res.render('register', { errors: {}, formData: {} });
// });

// // POST: Register User with Validation
// router.post(
//   '/register',
//   [
//     body('name')
//       .notEmpty().withMessage('Name is required')
     
//       .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

//     body('email')
//       .trim()
//       .notEmpty().withMessage('Email is required')
     
//       .isEmail().withMessage('Must be a valid email')
//       .normalizeEmail(),

//     body('password')
//       .notEmpty().withMessage('Password is required')
     
//       .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
//   ],
//   async (req, res) => {
//     const errorsResult = validationResult(req);

//     console.log('Validation errors:', errorsResult.array()); // Debug

//     const { name, email, password } = req.body;

//     if (!errorsResult.isEmpty()) {
//       const errors = mapErrors(errorsResult.array());
//       return res.status(400).render('register', {
//         errors,
//         formData: { name, email }
//       });
//     }

//     try {
//       const existingUser = await User.findOne({ email });
//       if (existingUser) {
//         return res.status(400).render('register', {
//           errors: { email: 'Email already exists' },
//           formData: { name, email }
//         });
//       }

//       const newUser = new User({ name, email, password });
//       await newUser.save();
//       res.redirect('/login');
//     } catch (err) {
//       console.error('Register error:', err);
//       res.status(500).render('register', {
//         errors: { general: 'Server error. Please try again.' },
//         formData: { name, email }
//       });
//     }
//   }
// );
// // // GET: Register Form
// // router.get('/register', (req, res) => {
// //   res.render('register', { errors: {}, formData: {} });  // <-- no "auth/"
// // });

// // router.post(
// //   '/register',
// //   [
// //     body('name')
// //       .trim()
// //       .notEmpty().withMessage('Name is required')
// //       .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),

// //     body('email')
// //       .trim()
// //       .notEmpty().withMessage('Email is required')
// //       .isEmail().withMessage('Must be a valid email')
// //       .normalizeEmail(),

// //     body('password')
// //       .notEmpty().withMessage('Password is required')
// //       .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
// //   ],
// //   async (req, res) => {
// //     const errorsResult = validationResult(req);
// //     const { name, email, password } = req.body;

// //     if (!errorsResult.isEmpty()) {
// //       const errors = {};
// //       errorsResult.array().forEach(err => (errors[err.param] = err.msg));
// //       return res.status(400).render('register', {
// //         errors,
// //         formData: { name, email }
// //       });
// //     }

// //     try {
// //       const existingUser = await User.findOne({ email });
// //       if (existingUser) {
// //         return res.status(400).render('register', {
// //           errors: { email: 'Email already exists' },
// //           formData: { name, email }
// //         });
// //       }

// //       const newUser = new User({ name, email, password });
// //       await newUser.save();
// //       res.redirect('/login');
// //     } catch (err) {
// //       console.error('Register error:', err);
// //       res.status(500).render('register', {
// //         errors: { general: 'Server error. Please try again.' },
// //         formData: { name, email }
// //       });
// //     }
// //   }
// // );


// // GET: Login Form
// router.get('/login', (req, res) => {
//   res.render('login', { errors: {}, email: '' });  // <-- no "auth/"
// });

// // POST: Login User with Validation
// router.post(
//   '/login',
//   [
//     body('email')
//       .trim()
//       .notEmpty().withMessage('Email is required')
//       .isEmail().withMessage('Invalid email'),

//     body('password')
//       .notEmpty().withMessage('Password is required'),
//   ],
//   async (req, res) => {
//     const errorsResult = validationResult(req);
//     const { email, password } = req.body;

//     if (!errorsResult.isEmpty()) {
//       const errors = mapErrors(errorsResult.array());
//       return res.status(400).render('login', {  // <-- no "auth/"
//         errors,
//         email
//       });
//     }

//     try {
//       const user = await User.findOne({ email: email.toLowerCase() });
//       if (!user || !(await user.comparePassword(password))) {
//         return res.status(400).render('login', {  // <-- no "auth/"
//           errors: { general: 'Invalid email or password' },
//           email
//         });
//       }

//       req.session.user = {
//         _id: user._id.toString(),
//         name: user.name,
//         email: user.email
//       };

//       res.redirect('/');
//     } catch (err) {
//       console.error('Login error:', err);
//       res.status(500).render('login', {  // <-- no "auth/"
//         errors: { general: 'Unexpected server error' },
//         email
//       });
//     }
//   }
// );

// // Logout
// router.post('/logout', (req, res) => {
//   req.session.destroy(() => {
//     res.redirect('/login');
//   });
// });

// module.exports = router;


