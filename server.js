const mongoose = require('mongoose');

process.on('uncaughtException', err => {
  console.log('uncaughtException');
  console.log(err.name, err.message);
  process.exit(1);
});

// connecting config.env
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// Importing app.js
const app = require('./app');

// Connecting to MongoDB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
  });

// Starting Server
const port = process.env.PORT || 8000;
const server = app.listen(port, () => {
  console.log(`Listening to ${port}...`);
});

process.on('unhandledRejection', err => {
  console.log('Uncaught Rejection - Shutting Down');
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
