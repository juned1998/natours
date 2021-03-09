// Importing ErrorHandler
const AppError = require(`./../utils/appError`);

// Importing Tour model
const User = require(`./../models/userModel`);

// Importing API features i.e sorting, filtering, etc
const APIFeatures = require(`./../utils/apiFeatures`);

// Importing catchAsync function
const catchAsync = require(`./../utils/catchAsync`);

const filterObj = (obj, ...allowedFields) => {
  // Create new Object
  const newObj = {};

  // iterate through field name of obj
  Object.keys(obj).forEach(el => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });

  return newObj;
};

exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user is trying to update password
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for updating password. Use /updateMyPassword',
        400
      )
    );
  }

  // 2) filter out unwanted fields from req body which are not allowed
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    runValidators: true,
    new: true
  });

  //   2) Send updatedUser to client,
  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success'
  });
});

exports.createNewUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not implemented yet'
  });
};
exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not implemented yet'
  });
};

exports.updateUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not implemented yet'
  });
};
