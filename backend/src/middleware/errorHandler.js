export const errorHandler = (error, _req, res, _next) => {
  const statusCode = error.statusCode || 500;
  const message =
    error.code === 11000
      ? "Ya existe un registro con esos datos."
      : error.message || "Internal server error";

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    message,
  });
};
