const morgan = require('morgan');
const express = require('express');
const AppError = require('./utils/appError');

// Controllers
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const globalErrorHandler = require('./controllers/errorController');

// Express app
const app = express();

// 1) MIDDLEWARES
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Middleware to parse req body to json
app.use(express.json());

// TO send html pages as response
app.use(express.static(`${__dirname}/public`));

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  //   console.log(req.headers);
  next();
});

// ROUTES
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);

app.all('*', (req, res, next) => {
  const err = new Error(`Can't find ${req.originalUrl} on this server`);
  err.status = 'fail';
  err.statusCode = 404;

  // Will skip all middleware in stack till error handling middleware
  //next(error)
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

// Error Handling Middleware
app.use(globalErrorHandler);

module.exports = app;
