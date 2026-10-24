/**
 * @file aiAssistService.js
 * @description AI Smart Assist service for BloodConnect.
 *
 * Calls the Google Gemini API (REST, no extra SDK dependency) to parse a
 * doctor's free-text note and extract structured blood-request fields.
 *
 * Environment variable required:
 *   GEMINI_API_KEY  — your Google AI Studio key (never sent to the frontend)
 *
 * Exported functions:
 *   parseHospitalNote(noteText)  → calls Gemini, returns raw parsed object
 *   validateAiOutput(rawJson)    → sanitises & validates the parsed object
 */

"use strict";

const https = require("https");

// ─── Allowed enum values (mirrors bloodRequestModel.js + PostRequest.jsx) ─────

const ALLOWED_BLOOD_GROUPS = new Set([
  "A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-",
]);

// Realistic ceiling: a single hospital request should never exceed this.
// If the LLM hallucinates a number above this, we force null rather than
// pass an absurd value into the form.
const MAX_UNITS = 50;

// The form and Mongoose schema use: Critical | High | Moderate | Normal.
// The system prompt uses Low/Medium/High/Critical so the LLM reasons naturally;
// validateAiOutput() remaps them to the real schema values before returning.
const URGENCY_PROMPT_TO_SCHEMA = {
  Critical: "Critical",
  High:     "High",
  Medium:   "Moderate",   // LLM "Medium"  → schema "Moderate"
  Low:      "Normal",     // LLM "Low"     → schema "Normal"
};

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a medical form-filling assistant for a hospital blood request system.
Extract the following fields from the doctor's free-text note and return ONLY a valid JSON object — no explanation, no markdown formatting, no code fences.

Fields:
- bloodGroup: one of "A+","A-","B+","B-","O+","O-","AB+","AB-". If not clearly stated, return null. Never guess.
- units: a positive integer number of units needed. If not stated, return null. Never guess.
- urgency: one of "Low","Medium","High","Critical", inferred from context (e.g. continuous bleeding, immediate surgery = Critical). If unclear, return null.
- notes: a clean, professional 1-2 sentence clinical summary rewritten from the doctor's note.

Never invent information not present in the note. If a field cannot be confidently determined, return null for it.

Output strictly as:
{"bloodGroup": string|null, "units": number|null, "urgency": string|null, "notes": string|null}`;

// ─── Gemini REST helper ───────────────────────────────────────────────────────

/**
 * Makes a POST request to the Gemini generateContent REST endpoint.
 * Uses the native `https` module — no additional npm packages required.
 *
 * @param {string} noteText - The raw doctor's note to analyse
 * @returns {Promise<string>} - The raw text content from Gemini's first candidate
 */
const callGeminiApi = (noteText) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return reject(
        new Error(
          "GEMINI_API_KEY is not set in environment variables. " +
          "Add GEMINI_API_KEY=<your-key> to backend/.env and restart the server."
        )
      );
    }

    const model = "gemini-2.5-flash"; // Fast & cost-effective; swap to gemini-2.5-pro if needed
    const path = `/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const body = JSON.stringify({
      systemInstruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [{ text: noteText }],
        },
      ],
      generationConfig: {
        temperature: 0.1,      // Low temperature → deterministic, factual output
        maxOutputTokens: 256,  // We only need a small JSON object
      },
    });

    const options = {
      hostname: "generativelanguage.googleapis.com",
      path,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        if (res.statusCode !== 200) {
          return reject(
            new Error(`Gemini API error: HTTP ${res.statusCode} — ${data}`)
          );
        }

        try {
          const parsed = JSON.parse(data);
          const text =
            parsed?.candidates?.[0]?.content?.parts?.[0]?.text ?? null;

          if (text === null) {
            return reject(
              new Error(
                "Gemini returned an empty or unexpected response structure."
              )
            );
          }

          resolve(text.trim());
        } catch {
          reject(new Error("Failed to parse Gemini API JSON envelope."));
        }
      });
    });

    req.on("error", (err) => {
      reject(new Error(`Network error calling Gemini API: ${err.message}`));
    });

    req.write(body);
    req.end();w
  });
};

// ─── Exported: parseHospitalNote ─────────────────────────────────────────────

/**
 * Sends a doctor's free-text note to the Gemini LLM and returns the raw
 * parsed object containing extracted blood-request fields.
 *
 * This function does NOT validate field values against allowed enums —
 * always call validateAiOutput() on the result before using the data.
 *
 * @param {string} noteText - The raw note typed by the hospital user
 * @returns {Promise<{ success: true, raw: object } | { success: false, error: string }>}
 *
 * @example
 * const result = await parseHospitalNote("Patient needs 2 units of O+ urgently for emergency surgery.");
 * // result.raw → { bloodGroup: "O+", units: 2, urgency: "Critical", notes: "..." }
 */
const parseHospitalNote = async (noteText) => {
  try {
    if (!noteText || typeof noteText !== "string" || noteText.trim().length === 0) {
      return { success: false, error: "noteText must be a non-empty string." };
    }

    if (noteText.trim().length > 2000) {
      return {
        success: false,
        error: "noteText exceeds the 2000-character limit. Please shorten the note.",
      };
    }

    const rawText = await callGeminiApi(noteText.trim());

    // Defensively strip markdown code fences the model may add despite instructions
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      console.error(
        "[aiAssistService] JSON.parse failed. Raw LLM output:",
        rawText
      );
      return {
        success: false,
        error:
          "LLM returned a non-JSON response. Raw snippet: " +
          rawText.substring(0, 200),
      };
    }

    return { success: true, raw: parsed };
  } catch (error) {
    console.error("[aiAssistService] parseHospitalNote error:", error.message);
    return { success: false, error: error.message };
  }
};

// ─── Exported: validateAiOutput ──────────────────────────────────────────────

/**
 * Validates and sanitises the raw object returned by parseHospitalNote().
 *
 * Validation rules:
 *  - bloodGroup  → must be in the 8-value allowed set; else null
 *  - units       → must be a positive integer (>= 1); else null
 *  - urgency     → must be Low|Medium|High|Critical (prompt vocab),
 *                  then remapped to Normal|Moderate|High|Critical (schema vocab);
 *                  any other value → null
 *  - notes       → must be a non-empty string; else null
 *  - Extra keys from the LLM are silently stripped
 *
 * @param {object} rawJson - The `.raw` field from a successful parseHospitalNote() call
 * @returns {{ success: true, data: object } | { success: false, error: string }}
 *
 * @example
 * const validated = validateAiOutput({ bloodGroup: "O+", units: 2, urgency: "Critical", notes: "..." });
 * // validated.data → { bloodGroup: "O+", units: 2, urgencyLevel: "Critical", notes: "..." }
 */
const validateAiOutput = (rawJson) => {
  try {
    if (!rawJson || typeof rawJson !== "object" || Array.isArray(rawJson)) {
      return { success: false, error: "rawJson must be a non-null plain object." };
    }

    // ── bloodGroup ────────────────────────────────────────────────────────────
    let bloodGroup = null;
    if (
      typeof rawJson.bloodGroup === "string" &&
      ALLOWED_BLOOD_GROUPS.has(rawJson.bloodGroup.trim())
    ) {
      bloodGroup = rawJson.bloodGroup.trim();
    }

    // ── units ─────────────────────────────────────────────────────────────────
    let units = null;
    if (rawJson.units !== null && rawJson.units !== undefined) {
      const num = Number(rawJson.units);
      if (Number.isInteger(num) && num >= 1 && num <= MAX_UNITS) {
        units = num;
      } else if (Number.isInteger(num) && num > MAX_UNITS) {
        // Log for auditability — don't silently accept hallucinated large numbers
        console.warn(
          `[aiAssistService] units value ${num} exceeds MAX_UNITS (${MAX_UNITS}). Forcing null.`
        );
      }
    }

    // ── urgency (LLM prompt vocab → Mongoose schema vocab) ───────────────────
    // Returned as `urgencyLevel` to be drop-in compatible with form state key
    let urgencyLevel = null;
    if (typeof rawJson.urgency === "string") {
      const key = rawJson.urgency.trim();
      if (Object.prototype.hasOwnProperty.call(URGENCY_PROMPT_TO_SCHEMA, key)) {
        urgencyLevel = URGENCY_PROMPT_TO_SCHEMA[key];
      }
    }

    // ── notes ─────────────────────────────────────────────────────────────────
    let notes = null;
    if (typeof rawJson.notes === "string" && rawJson.notes.trim().length > 0) {
      notes = rawJson.notes.trim();
    }

    return {
      success: true,
      data: {
        bloodGroup,   // "A+" | "A-" | "B+" | "B-" | "O+" | "O-" | "AB+" | "AB-" | null
        units,        // positive integer | null
        urgencyLevel, // "Critical" | "High" | "Moderate" | "Normal" | null
        notes,        // string | null
      },
    };
  } catch (error) {
    console.error("[aiAssistService] validateAiOutput error:", error.message);
    return { success: false, error: error.message };
  }
};

// ─── Module exports ───────────────────────────────────────────────────────────

module.exports = {
  parseHospitalNote,
  validateAiOutput,
};
