const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signinToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  // SECURITY FLAW: User can give himself Admin role
  // const newUser = await User.create(req.body);

  // WE only allow the data that we actually need to be put in the user
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm
  });

  const token = signinToken(newUser._id);

  res.status(201).json({
    status: 'success',
    token,
    data: {
      user: newUser
    }
  });
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //   1) Check email password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 404));
  }

  //   2) Check if user exist & password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !user.correctPassword(password, user.password)) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //   3) if everything is ok, send webtoken to client
  const token = signinToken(user._id);

  res.status(200).json({
    status: 'success',
    token
  });
});

// const promisifier = fn => {
//   return (...args) => {
//     return new Promise((resolve, reject) => {
//       function customCallback(err, result) {
//         if (err) {
//           reject(err);
//         } else {
//           resolve(result);
//         }
//       }
//       args.push(customCallback);
//       console.log(args);
//       fn.call(this, ...args);
//     });
//   };
// };

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  // 1) Getting token and checking if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(new AppError("You're not logged in. Please log in.", 401));
  }

  // 2) Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  // 3) Check if user still exists
  const currentUser = await User.findOne({ _id: decoded.id });

  if (!currentUser) {
    return next(new AppError("This user doesn't exist anymore", 401));
  }

  // 4) check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError(
        'This user has changed the password recently, please login again',
        401
      )
    );
  }

  // GRANT ACESS TO PROTECTED ROUTE
  req.user = currentUser;
  next();
});
