/**
 * Quick test script for aiAssistService.js
 *
 * Usage:
 *   cd backend
 *   GEMINI_API_KEY=<your-key> node test-ai-assist.js
 *
 * Or add GEMINI_API_KEY to backend/.env first, then:
 *   node -r dotenv/config test-ai-assist.js
 */

"use strict";

require("dotenv").config();

const {
  parseHospitalNote,
  validateAiOutput,
} = require("./services/aiAssistService");

// ─── Test cases ───────────────────────────────────────────────────────────────

const TEST_CASES = [
  {
    label: "Full details — should extract all 4 fields",
    note: "Patient has continuous GI bleeding and requires immediate surgery. Blood type O+. Please arrange 3 units urgently.",
  },
  {
    label: "Partial — no blood group mentioned",
    note: "Post-op patient is anaemic. We need 2 units of blood for recovery. Not time-critical.",
  },
  {
    label: "Ambiguous urgency — should return null for urgency",
    note: "Routine pre-op blood preparation for elective procedure next week. AB- preferred, 1 unit.",
  },
  {
    label: "Empty string — should return validation error",
    note: "",
  },
  {
    label: "No useful medical info — most fields should be null",
    note: "Please help.",
  },
];

// ─── Runner ───────────────────────────────────────────────────────────────────

const runTests = async () => {
  console.log("═".repeat(60));
  console.log("  BloodConnect AI Smart Assist — Service Test");
  console.log("═".repeat(60));

  for (const tc of TEST_CASES) {
    console.log(`\n▶ ${tc.label}`);
    console.log(`  Note: "${tc.note}"`);

    const parseResult = await parseHospitalNote(tc.note);

    if (!parseResult.success) {
      console.log(`  ✗ parseHospitalNote failed: ${parseResult.error}`);
      continue;
    }

    console.log("  ✓ Raw LLM output:", parseResult.raw);

    const validated = validateAiOutput(parseResult.raw);

    if (!validated.success) {
      console.log(`  ✗ validateAiOutput failed: ${validated.error}`);
    } else {
      console.log("  ✓ Validated data:", validated.data);
    }

    console.log("  " + "─".repeat(56));
  }

  console.log("\n✔ Test run complete.\n");
};

runTests().catch((err) => {
  console.error("Fatal error in test runner:", err);
  process.exit(1);
});
