const mongoose = require('mongoose');
const fs = require('fs');

// connecting config.env
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

// reading tours data
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/data/tours-simple.json`)
);

//import Tour Model
const Tour = require(`${__dirname}/../models/tourModel`);

const importData = async () => {
  try {
    await Tour.create(tours);
    console.log('success');
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

const deleteData = async () => {
  try {
    await Tour.deleteMany();
    console.log('success');
  } catch (err) {
    console.log(err);
  }

  process.exit();
};

// Connecting to MongoDB
const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false
  })
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => console.log('Error Connecting to MongoDB' + err));

if (process.argv[2] === '--import') {
  importData();
}

if (process.argv[2] === '--delete') {
  deleteData();
}
