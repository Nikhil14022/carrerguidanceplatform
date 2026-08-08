import Groq from "groq-sdk";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function main() {
  try {
    const list = await groq.models.list();
    console.log("Active Groq models:");
    list.data.forEach(m => {
      console.log(`- ID: ${m.id}, Owned By: ${m.owned_by}`);
    });
  } catch (error) {
    console.error("Error fetching models:", error);
  }
}

main();
