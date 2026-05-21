export const getTestStatus = (req, res) => {
  res.json({
    message: 'DailyFlow backend test route works',
    status: 'success'
  });
};
