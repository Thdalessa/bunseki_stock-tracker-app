import { Inngest } from "inngest";

const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  throw new Error("GEMINI_API_KEY is required");
}

export const inngest = new Inngest({
  id: "bunseki",
  ai: {
    gemini: { apiKey: geminiApiKey },
  },
});
