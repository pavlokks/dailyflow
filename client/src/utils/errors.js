export const getApiErrorMessage = (error, fallbackMessage) => {
  return error.response?.data?.message || fallbackMessage;
};
