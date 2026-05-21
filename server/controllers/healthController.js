export const getHealthStatus = (req, res) => {
  res.json({
    status: 'ok',
    service: 'DailyFlow API'
  });
};
