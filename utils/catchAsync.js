module.exports = fn => {
  return (req, res, next) => {
    // Rejected Promise will throw Error object,
    // next(err) will handle the Error object in globalErrorHandling middleware
    fn(req, res, next).catch(next);
  };
};
