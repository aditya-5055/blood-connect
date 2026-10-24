/**
 * @file aiAssistRoutes.js
 * @description Express router for the AI Smart Assist feature.
 *
 * Route:
 *   POST /api/ai/parse-blood-request
 *
 * Protected by:
 *   - JWT auth (auth middleware) — logged-in users only
 *   - isHospital role guard       — only approved hospital accounts
 *   - express-rate-limit          — 10 requests / minute per IP
 *
 * Does NOT touch MongoDB. Only returns AI-suggested field values for the
 * blood-request form; the doctor decides what to actually submit.
 */

"use strict";

const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");

const { auth, isHospital } = require("../middleware/authMiddleware");
const { parseBloodRequest } = require("../controllers/aiAssistController");

// ─── Rate limiter (AI-specific — 10 req/min per IP) ──────────────────────────

const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,    // 1-minute sliding window
  max: 10,                // max 10 requests per window per IP
  standardHeaders: true,  // return RateLimit-* headers in response
  legacyHeaders: false,
  message: {
    success: false,
    message:
      "Too many AI assist requests. Please wait a moment before trying again.",
  },
  // Skip rate-limit for non-AI routes on this router (belt-and-suspenders)
  skip: (req) => req.path !== "/parse-blood-request",
});

// ─── POST /api/ai/parse-blood-request ────────────────────────────────────────

router.post(
  "/parse-blood-request",
  aiRateLimiter,
  auth,
  isHospital,
  parseBloodRequest
);

module.exports = router;
