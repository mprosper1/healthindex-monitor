# Vitals — Health Index Monitor Chatbot
SEN 221 group project (Group 41–60)

A conversational health index monitor. An AI (Google Gemini) runs the whole
conversation — asking for blood pressure, blood sugar, and pulse — then
classifies each reading against real clinical reference ranges and gives a
plain-language summary. It's not a diagnosis tool; it always says so.

## How it's built

- **Frontend** (`public/index.html`, `style.css`, `script.js`): the chat UI,
  styled like a real patient monitor, with live vital tiles that fill in as
  the conversation goes.
- **Backend** (`server.js`): a small Express server. It holds the Gemini API
  key and forwards chat requests to Gemini with a system prompt containing
  the real clinical ranges, so classification stays consistent no matter what
  the user types.

The API key never touches the browser — it only lives on the server, in a
`.env` file that is never committed or shared.

## Setup (do this once)

1. Install [Node.js](https://nodejs.org) if you don't have it (LTS version).
2. Open a terminal in this project folder and run:
   ```
   npm install
   ```
3. Copy `.env.example` to a new file named `.env`:
   ```
   cp .env.example .env
   ```
4. Open `.env` and paste in your real Gemini API key from
   [aistudio.google.com](https://aistudio.google.com):
   ```
   GEMINI_API_KEY=your_real_key_here
   ```

## Running it

```
npm start
```

Then open **http://localhost:3000** in your browser. The bot will greet you
and start asking for your readings.

## Clinical ranges used (for the report/writeup)

**Blood Pressure (mmHg)**
| Category | Systolic | Diastolic |
|---|---|---|
| Normal | < 120 | and < 80 |
| Elevated | 120–129 | and < 80 |
| High (Stage 1) | 130–139 | or 80–89 |
| High (Stage 2) | ≥ 140 | or ≥ 90 |
| Hypertensive crisis | > 180 | and/or > 120 |
| Low | < 90 | or < 60 |

**Fasting Blood Sugar (mg/dL)**
| Category | Range |
|---|---|
| Normal | < 100 |
| Prediabetes | 100–125 |
| Diabetes range | ≥ 126 |

**Pulse (bpm, resting adult)**
| Category | Range |
|---|---|
| Low (Bradycardia) | < 60 |
| Normal | 60–100 |
| High (Tachycardia) | > 100 |

## Notes for the demo

- If the lecturer asks something unexpected, the bot handles it naturally
  since Gemini runs the whole conversation — it's not following a rigid
  script.
- The vital tiles at the top light up live as readings come in; this uses
  simple pattern-matching on your typed message (e.g. detecting "120/80" as
  blood pressure) purely for the visual — the actual classification always
  comes from the AI applying the ranges above.
- Free tier note: Gemini's free API tier may use submitted prompts to improve
  Google's models. Fine for a class demo — just don't put real personal
  health data through it.
