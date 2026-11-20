export class RequestError extends Error {
  constructor(statusCode, message, extra = {}) {
    super(message);
    this.name = "RequestError";
    this.statusCode = statusCode;
    this.retryAfter = extra.retryAfter;
  }
}
