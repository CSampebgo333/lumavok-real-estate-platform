import { ZodError } from "zod";
import type { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/errors.js";
import type { ApiError as ApiErrorType } from "../types/index.js";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const parser = err as Error & {
    type?: string;
    status?: number;
    code?: string;
  };
  if (
    parser.type === "entity.parse.failed" ||
    parser.type === "entity.too.large" ||
    parser.type === "encoding.unsupported"
  ) {
    res
      .status(parser.type === "entity.too.large" ? 413 : 400)
      .json({
        success: false,
        code: "INVALID_BODY",
        message: "Invalid or oversized request body",
      });
    return;
  }
  if (parser.code === "LIMIT_FILE_SIZE") {
    res
      .status(413)
      .json({
        success: false,
        code: "FILE_TOO_LARGE",
        message: "File is too large",
      });
    return;
  }
  if (err instanceof ZodError) {
    res.status(400).json({
      success: false,
      message: "Validation failed",
      code: "VALIDATION_ERROR",
      errors: err.issues.map((i) => ({
        field: i.path.join("."),
        message: i.message,
      })),
    });
    return;
  }
  if (err.name === "PrismaClientValidationError") {
    res.status(400).json({
      success: false,
      message: "Invalid request",
      code: "VALIDATION_ERROR",
    });
    return;
  }
  if (err instanceof ApiError) {
    const body: ApiErrorType = {
      success: false,
      message: err.message,
    };
    if (err.code) body.code = err.code;
    if (err.errors) body.errors = err.errors;

    res.status(err.statusCode).json(body);
    return;
  }

  if (err.name === "PrismaClientKnownRequestError") {
    const prismaErr = err as unknown as {
      code: string;
      meta?: { target?: string[] };
    };

    if (prismaErr.code === "P2002") {
      res.status(409).json({
        success: false,
        message: "A conflicting record already exists.",
        code: "CONFLICT",
      });
      return;
    }

    if (prismaErr.code === "P2025") {
      res.status(404).json({
        success: false,
        message: "Resource not found.",
        code: "NOT_FOUND",
      });
      return;
    }
  }

  console.error("Unhandled API error", { name: err.name });
  res.status(500).json({
    success: false,
    message: "An internal server error occurred.",
    code: "INTERNAL_ERROR",
  });
}
