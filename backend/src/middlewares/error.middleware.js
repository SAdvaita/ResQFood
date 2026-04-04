import { AppError } from "../utils/appError.util.js";
import { sendError } from "../utils/response.util.js";

export const notFoundHandler = (req, res) => {
  return sendError(res, {
    statusCode: 404,
    message: "Resource not found",
    code: "NOT_FOUND"
  });
};

export const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return sendError(res, {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      details: err.details
    });
  }

  return sendError(res, {
    statusCode: 500,
    message: "Something went wrong",
    code: "INTERNAL_SERVER_ERROR"
  });
};
