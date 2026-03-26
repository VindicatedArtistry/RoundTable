/**
 * Custom API Error class for consistent error handling across REST endpoints
 */
export class ApiError extends Error {
	public readonly statusCode: number;
	public readonly isOperational: boolean;
	public readonly context?: Record<string, any>;

	constructor(
		message: string,
		statusCode: number = 500,
		isOperational: boolean = true,
		context?: Record<string, any>
	) {
		super(message);
		this.name = 'ApiError';
		this.statusCode = statusCode;
		this.isOperational = isOperational;
		this.context = context;

		// Maintains proper stack trace for where error was thrown
		Error.captureStackTrace(this, ApiError);
	}

	/**
	 * Create a 400 Bad Request error
	 */
	static badRequest(message: string, context?: Record<string, any>): ApiError {
		return new ApiError(message, 400, true, context);
	}

	/**
	 * Create a 401 Unauthorized error
	 */
	static unauthorized(message: string = 'Unauthorized', context?: Record<string, any>): ApiError {
		return new ApiError(message, 401, true, context);
	}

	/**
	 * Create a 403 Forbidden error
	 */
	static forbidden(message: string = 'Forbidden', context?: Record<string, any>): ApiError {
		return new ApiError(message, 403, true, context);
	}

	/**
	 * Create a 404 Not Found error
	 */
	static notFound(message: string = 'Not Found', context?: Record<string, any>): ApiError {
		return new ApiError(message, 404, true, context);
	}

	/**
	 * Create a 409 Conflict error
	 */
	static conflict(message: string, context?: Record<string, any>): ApiError {
		return new ApiError(message, 409, true, context);
	}

	/**
	 * Create a 422 Unprocessable Entity error
	 */
	static unprocessableEntity(message: string, context?: Record<string, any>): ApiError {
		return new ApiError(message, 422, true, context);
	}

	/**
	 * Create a 429 Too Many Requests error
	 */
	static tooManyRequests(message: string = 'Too Many Requests', context?: Record<string, any>): ApiError {
		return new ApiError(message, 429, true, context);
	}

	/**
	 * Create a 500 Internal Server Error
	 */
	static internal(message: string = 'Internal Server Error', context?: Record<string, any>): ApiError {
		return new ApiError(message, 500, true, context);
	}

	/**
	 * Create a 502 Bad Gateway error
	 */
	static badGateway(message: string = 'Bad Gateway', context?: Record<string, any>): ApiError {
		return new ApiError(message, 502, true, context);
	}

	/**
	 * Create a 503 Service Unavailable error
	 */
	static serviceUnavailable(message: string = 'Service Unavailable', context?: Record<string, any>): ApiError {
		return new ApiError(message, 503, true, context);
	}

	/**
	 * Convert to JSON representation
	 */
	toJSON(): Record<string, any> {
		return {
			name: this.name,
			message: this.message,
			statusCode: this.statusCode,
			isOperational: this.isOperational,
			context: this.context,
			stack: this.stack
		};
	}

	/**
	 * Check if error is operational (expected) vs programming error
	 */
	static isOperational(error: Error): boolean {
		if (error instanceof ApiError) {
			return error.isOperational;
		}
		return false;
	}
}