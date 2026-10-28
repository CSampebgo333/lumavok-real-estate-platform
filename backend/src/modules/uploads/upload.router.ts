import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import type { AuthenticatedRequest } from "../../types/index.js";
import multer from "multer";
import type { RequestHandler } from "express";
import * as uploadController from "./upload.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = Router();
const authenticateHandler = authenticate as unknown as RequestHandler;
const developerOnly = authorize(
  "PROPERTY_DEVELOPER",
) as unknown as RequestHandler;

// Configure multer to use memory storage (buffer in memory, then save to disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB for images
  },
});

// POST /uploads/file — upload a single file
router.post(
  "/file",
  authenticateHandler,
  developerOnly,
  rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 100,
    keyGenerator: (req) => (req as AuthenticatedRequest).user.developerId!,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
      success: false,
      code: "RATE_LIMITED",
      message: "Upload limit reached. Try again later.",
    },
  }),
  upload.single("file"),
  uploadController.uploadFile,
);

// DELETE /uploads/:publicId — delete an uploaded file
router.delete(
  "/:publicId",
  authenticateHandler,
  developerOnly,
  uploadController.deleteUpload,
);

export default router;
