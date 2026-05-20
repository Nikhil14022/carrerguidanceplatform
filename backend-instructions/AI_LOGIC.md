# AI Logic Specification (Gemini API)

The platform uses a Hybrid AI-Human approach to generate high-fidelity career reports.

## 1. Input Processing
When the Admin clicks "Generate Report," the system must:
1. Aggregate all **APPROVED** `ModuleResponse` data for the client.
2. Structure the data into a clean, contextual prompt.
3. System Instructions for Gemini:
   > "You are an expert Career Psychologist. Analyze the following student assessment data spanning Personal Foundation, Skills, and Values. Provide 3 primary career directions with detailed reasoning, a strength/gap analysis, and suggested next steps."

## 2. Report Structure (JSON)
The AI should ideally return (or the backend should parse into):
- `personality_insights`: String summary.
- `career_suggestions`: Array of { title, reasoning, match_percentage }.
- `skill_gap_analysis`: List of identified improvements.

## 3. The Human Checkpoint
1. AI output is stored in the `Report` table with status `AI_GENERATED`.
2. Admin/Expert enters the editing interface.
3. They can modify AI text, add personal session notes, or swap suggested careers.
4. Marking as `FINALIZED` triggers the notification to the Client.

## 4. Error Handling
- Use exponential backoff for Gemini API calls.
- Provide a fallback "Pending Analysis" mock report if the API is unreachable.
