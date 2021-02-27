const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter your name']
  },
  email: {
    type: String,
    unique: true,
    required: [true, 'Please enter your email address'],
    lowercase: true,
    validate: [validator.isEmail, 'Please enter a valid email address']
  },
  photo: {
    type: String
  },
  password: {
    type: String,
    required: [true, 'Please enter a password'],
    minLength: 8,

    // Disable selecting passwords by default
    select: false
  },
  passwordConfirm: {
    type: String,
    validate: {
      validator: function(val) {
        return this.password === val;
      },
      message: "Passwords didn't match"
    },
    required: [true, 'Please re-enter the password']
  },
  passwordChangedAt: Date
});

userSchema.pre('save', async function(next) {
  // Only run the function if the password was actually modified
  if (!this.isModified('password')) return next();

  //   Hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //   Delete the passwordConfirm field
  this.passwordConfirm = undefined;

  next();
});

userSchema.methods.correctPassword = async function(
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTtimestamp) {
  if (this.passwordChangedAt) {
    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    console.log(changedTimeStamp, JWTtimestamp);

    return JWTtimestamp < changedTimeStamp;
  }

  //   False means NOT CHANGED
  return false;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
