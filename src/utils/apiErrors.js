class ApiError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }
}

class NotFoundError extends ApiError {
    constructor(message = 'Resource not found') {
        super(message, 404);
    }
}

class BadRequestError extends ApiError {
    constructor(message = 'Bad request') {
        super(message, 400);
    }
}

class UnauthorizedError extends ApiError {
    constructor(message = 'Unauthorized access') {
        super(message, 401);
    }
}

class ForbiddenError extends ApiError {
    constructor(message = 'Forbidden') {
        super(message, 403);
    }
}

module.exports = {
    ApiError,
    NotFoundError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
};