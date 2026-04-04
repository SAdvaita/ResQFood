export const sendSuccess = (res, { statusCode = 200, message, data = null }) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    error: null
  });
};

export const sendError = (res, { statusCode = 500, message, code = "INTERNAL_SERVER_ERROR", details = null }) => {
  return res.status(statusCode).json({
    success: false,
    message,
    data: null,
    error: {
      code,
      details
    }
  });
};
