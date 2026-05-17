export interface ApiErrorOptions {
  code: string;
  message: string;
  status: number;
  details?: Record<string, unknown>;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor({ code, message, status, details }: ApiErrorOptions) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export function isApiError(value: unknown): value is ApiError {
  return value instanceof ApiError;
}
