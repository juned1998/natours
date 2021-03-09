const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const sendEmail = require('./../utils/email');
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signinToken = id => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signinToken(user.id);
  res.status(statusCode).json({
    status: 'success',
    token
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

  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  // 1) Check email password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 404));
  }

  // 2) Check if user exist & password is correct
  const user = await User.findOne({ email: email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 3) if everything is ok, send webtoken to client
  createSendToken(user, 200, res);
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

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //   roles ['admin', 'user']

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });

  //   Check if user exists
  if (!user) {
    return next(
      new AppError('User not found! please enter a correct email', 404)
    );
  }

  //   Generate password reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //send email with token
  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `Forgot password? submit patch request with new password and confirmPassword
  to ${resetURL}. Ignore this mail, if you didnt request new password`;

  try {
    await sendEmail({
      email: user.email,
      subject: `Your password reset token( valid until ${user.passwordResetExpires})`,
      message
    });

    res.status(200).json({
      status: 'success',
      message: 'Token sent to email'
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });
    return next(new AppError('Error sending the email, try again later', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // Find user based on token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is expired or not valid', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  // 3) Update changedPasswordAt property for the user( usermodel.js)
  //   Log the user in, send jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //   1) Get user from collection
  const user = await User.findById(req.user.id).select('+password');

  // 2) Check if POSted password is correct
  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('Your current password is incorrect', 401));
  }

  //   3)If so, update password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  //   4)Log user in, send JWT
  createSendToken(user, 200, res);
});
