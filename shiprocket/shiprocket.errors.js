export class ShiprocketError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = "ShiprocketError";
    this.statusCode = statusCode;
    this.details = details;
  }
}