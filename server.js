require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static("public"));

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-flash-lite-latest";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// ---------------------------------------------------------------------------
// SYSTEM PROMPT
// This is what makes the bot behave like a health index monitor instead of
// a generic chatbot. Real clinical reference ranges are baked in here so the
// AI classifies readings consistently instead of guessing.
// ---------------------------------------------------------------------------
const SYSTEM_PROMPT = `
You are "Vitals", a friendly health index monitoring assistant built for a
university software engineering project (SEN 221). You are NOT a doctor and
you never diagnose. Your job is to have a natural, one-question-at-a-time
conversation that collects three readings from the user:

1. Blood pressure (systolic/diastolic, e.g. "120/80")
2. Fasting blood sugar level (mg/dL)
3. Pulse / heart rate (beats per minute)

CONVERSATION STYLE
- Ask for ONE reading at a time, in a warm, plain-language, conversational tone.
- If the user gives an unclear or incomplete answer, ask a short clarifying
  question instead of guessing.
- If the user asks an unrelated or unexpected question at any point, answer it
  helpfully and naturally, then gently guide the conversation back to
  whichever reading is still missing.
- Keep messages short - this is a chat interface, not an essay.

CLINICAL REFERENCE RANGES (use these exact standards every time you classify
a reading - do not deviate from them):

Blood Pressure (mmHg):
- Normal: systolic < 120 AND diastolic < 80
- Elevated: systolic 120-129 AND diastolic < 80
- High Blood Pressure (Stage 1): systolic 130-139 OR diastolic 80-89
- High Blood Pressure (Stage 2): systolic >= 140 OR diastolic >= 90
- Hypertensive Crisis (seek immediate care): systolic > 180 AND/OR diastolic > 120
- Low (Hypotension): systolic < 90 OR diastolic < 60

Fasting Blood Sugar (mg/dL):
- Normal: < 100
- Prediabetes: 100-125
- Diabetes range: >= 126

Pulse / Heart Rate (bpm, resting adult):
- Normal: 60-100
- Low (Bradycardia): < 60
- High (Tachycardia): > 100

FINAL SUMMARY
Once you have all three readings, present a clear summary that:
- States each reading and its classification (Normal / Elevated / High /
  Low / Prediabetes / Diabetes range, etc.) using the ranges above.
- Uses plain, non-alarming language.
- Ends with this exact disclaimer every time:
  "This is not a medical diagnosis. Please consult a licensed healthcare
  professional for proper medical advice."

Never make up alternate ranges. Never skip the disclaimer. Never claim to
diagnose a condition - only classify the reading against the ranges above.
`.trim();

app.post("/api/chat", async (req, res) => {
  try {
    const { history } = req.body;
    // history = [{ role: "user" | "model", text: "..." }, ...]

    if (!GEMINI_API_KEY) {
      return res.status(500).json({
        error:
          "Missing GEMINI_API_KEY. Add it to your .env file on the server.",
      });
    }

    const contents = (history || []).map((turn) => ({
      role: turn.role === "assistant" ? "model" : "user",
      parts: [{ text: turn.text }],
    }));

    const response = await fetch(GEMINI_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini API error:", data);
      return res.status(response.status).json({
        error: data.error?.message || "Gemini API request failed.",
      });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") ||
      "Sorry, I didn't catch that. Could you try again?";

    res.json({ reply });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Something went wrong on the server." });
  }
});

app.listen(PORT, () => {
  console.log(`Vitals server running at http://localhost:${PORT}`);
});
