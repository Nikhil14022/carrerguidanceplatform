import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt: string): Promise<string> {
  const result = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a JSON-only API. You MUST respond with valid JSON and nothing else. No markdown, no explanations, no code fences. Just raw JSON."
      },
      { role: "user", content: prompt }
    ],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    response_format: { type: "json_object" },
  });
  return result.choices[0]?.message?.content || "{}";
}

async function main() {
  const prompt = `Research the following career or educational topic: "Software Engineer".
  
Return a JSON object with exactly these keys:
- "material": A comprehensive 2-3 paragraph explanation and summary of the topic.
- "topicUrls": An array of exactly 3 relevant website URLs (like articles, courses, or Wikipedia) for further reading.
- "youtubeUrls": An array of exactly 2 relevant YouTube video search URLs (e.g. https://www.youtube.com/results?search_query=...) or specific video URLs.`;

  try {
    const response = await callGroq(prompt);
    console.log("SUCCESS! Parsed JSON:", JSON.parse(response));
  } catch (error: any) {
    console.error("GROQ CALL ERROR:", error);
  }
}

main();
