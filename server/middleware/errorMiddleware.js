export const notFound = (req, res) => {
  return res.status(404).json({
    message: `Шлях незнайдений: ${req.originalUrl}`,
  });
};

export const errorHandler = (error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  return res.status(statusCode).json({
    message: error.message || 'Неочікувана серверна помилка',
  });
};
