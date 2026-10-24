/**
 * @file aiAssistController.js
 * @description Controller for the AI Smart Assist feature.
 *
 * Contains the request handling, body validation, calling the AI assist
 * service, and parsing/validating the output.
 */

"use strict";

const { parseHospitalNote, validateAiOutput } = require("../services/aiAssistService");

/**
 * Accepts a free-text doctor's note and returns AI-suggested blood-request
 * field values. All fields that cannot be confidently extracted are null.
 *
 * Request body:
 *   { "note": "Patient needs 2 units of O+ for emergency surgery." }
 *
 * Success response (200):
 *   {
 *     "success": true,
 *     "data": {
 *       "bloodGroup":   "O+" | null,
 *       "units":        2    | null,
 *       "urgencyLevel": "Critical" | "High" | "Moderate" | "Normal" | null,
 *       "notes":        "string"   | null
 *     }
 *   }
 *
 * Error responses:
 *   400 — note missing or too short (< 10 chars)
 *   422 — LLM returned a response that failed field validation
 *   502 — Gemini API call failed (network / auth / quota)
 */
exports.parseBloodRequest = async (req, res) => {
  try {
    const { note } = req.body;

    // ── Input validation ───────────────────────────────────────────────────
    if (!note || typeof note !== "string" || note.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a clinical note to analyse.",
      });
    }

    if (note.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: "Please provide more detail (minimum 10 characters).",
      });
    }

    // ── Call LLM via service ───────────────────────────────────────────────
    const parseResult = await parseHospitalNote(note.trim());

    if (!parseResult.success) {
      // Gemini API failure: network error, bad API key, quota exceeded, etc.
      console.error(
        "[POST /api/ai/parse-blood-request] LLM error:",
        parseResult.error
      );
      return res.status(502).json({
        success: false,
        message:
          "AI service is temporarily unavailable. Please fill in the form manually.",
      });
    }

    // ── Validate & sanitise LLM output ────────────────────────────────────
    const validated = validateAiOutput(parseResult.raw);

    if (!validated.success) {
      // The raw JSON was structurally invalid (extremely rare after parse step)
      console.error(
        "[POST /api/ai/parse-blood-request] Validation error:",
        validated.error
      );
      return res.status(422).json({
        success: false,
        message:
          "AI returned an unexpected response format. Please fill in the form manually.",
      });
    }

    // ── Success ────────────────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      data: validated.data,
    });
  } catch (error) {
    // Catch-all for truly unexpected errors (should not normally reach here)
    console.error(
      "[POST /api/ai/parse-blood-request] Unexpected error:",
      error.message
    );
    return res.status(500).json({
      success: false,
      message: "An unexpected error occurred. Please try again.",
    });
  }
};
