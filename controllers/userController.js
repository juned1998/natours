// Importing ErrorHandler
const AppError = require(`./../utils/appError`);

// Importing Tour model
const User = require(`./../models/userModel`);

// Importing API features i.e sorting, filtering, etc
const APIFeatures = require(`./../utils/apiFeatures`);

// Importing catchAsync function
const catchAsync = require(`./../utils/catchAsync`);

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

exports.deleteUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'not implemented yet'
  });
};
