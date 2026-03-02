import { trackErrorEvent } from "./analytics";

export class AppError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "AppError";
    this.code = code;
  }
}

export class AuthError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "AuthError";
  }
}

export class ApiError extends AppError {
  status?: number;
  constructor(message: string, status?: number, code?: string) {
    super(message, code);
    this.name = "ApiError";
    this.status = status;
  }
}

export class ValidationError extends AppError {
  details?: string[];
  constructor(message: string, details?: string[]) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
    this.details = details;
  }
}

export class NetworkError extends AppError {
  constructor(message: string) {
    super(message, "NETWORK_ERROR");
    this.name = "NetworkError";
  }
}

export class GroqError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "GroqError";
  }
}

export class SupabaseError extends AppError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = "SupabaseError";
  }
}

export const getErrorMessage = (error: unknown) => {
  if (error instanceof AppError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message || "حدث خطأ غير متوقع.";
  }
  return "حدث خطأ غير متوقع.";
};

export const handleError = (error: unknown) => {
  const message = getErrorMessage(error);
  console.error("خطأ بالتطبيق:", error);
  trackErrorEvent(error, "app");
  return message;
};
