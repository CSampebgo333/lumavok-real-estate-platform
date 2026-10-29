import { test } from "node:test";
import assert from "node:assert/strict";
import type { Request, Response, NextFunction } from "express";
import { errorHandler } from "../src/middleware/errorHandler.js";

function respond(error: Error) {
  let status: number | undefined;
  let body: any;
  const response = {
    status(value: number) { status = value; return this; },
    json(value: unknown) { body = value; return this; },
  };
  errorHandler(error, {} as Request, response as unknown as Response, (() => {}) as NextFunction);
  return { status, body };
}

test("unique conflicts expose a stable code without internal field or index names", () => {
  for (const target of [["auth_user_id"], "private_index_name", undefined]) {
    const error = Object.assign(new Error("private provider detail"), {
      name: "PrismaClientKnownRequestError", code: "P2002", meta: { target },
    });
    assert.deepEqual(respond(error), {
      status: 409,
      body: { success: false, code: "CONFLICT", message: "A conflicting record already exists." },
    });
  }
});

test("invalid Prisma input and missing rows use public response contracts", () => {
  assert.equal(respond(Object.assign(new Error("internal query"), { name: "PrismaClientValidationError" })).body.code, "VALIDATION_ERROR");
  const result = respond(Object.assign(new Error("internal query"), { name: "PrismaClientKnownRequestError", code: "P2025" }));
  assert.equal(result.status, 404);
  assert.equal(result.body.code, "NOT_FOUND");
  assert.ok(!JSON.stringify(result).includes("internal query"));
});
