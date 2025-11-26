import { GoogleGenAI, Chat, GenerateContentResponse, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { AI_SYSTEM_INSTRUCTION } from "../constants";
import { UserProfile } from "../types";

// FIXED: using import.meta.env.VITE_API_KEY as requested
const apiKey = import.meta.env.VITE_API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

const MODEL_NAME = 'gemini-2.0-flash';

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const createDadChat = (): Chat => {
  return ai.chats.create({
    model: MODEL_NAME,
    config: {
      systemInstruction: AI_SYSTEM_INSTRUCTION,
      temperature: 0.9, 
      maxOutputTokens: 1000,
      safetySettings,
    },
  });
};

export const sendMessageToDadAI = async (chat: Chat, message: string): Promise<string> => {
  try {
    const response: GenerateContentResponse = await chat.sendMessage({ message });
    if (response.text) return response.text;
    
    const candidate = response.candidates?.[0];
    if (candidate?.finishReason === 'MAX_TOKENS') {
         const partialText = candidate.content?.parts?.[0]?.text;
         if (partialText) return partialText + " ... [I lost my train of thought. Too tired.]";
    }
    return "The lawyers won't let me say what I really think. (System blocked it).";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error contacting Dad HQ. Check your API Key in .env file.";
  }
};

export const breakDownTaskAI = async (taskTitle: string): Promise<string[]> => {
  try {
    const prompt = `Break this task down into 3-5 extremely simple, tiny, actionable steps: "${taskTitle}". Return ONLY a JSON array of strings.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME, contents: prompt, config: { responseMimeType: "application/json", safetySettings }
    });
    const text = response.text;
    if (!text) return ["Just start somewhere."];
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (error) {
    return ["Could not break it down. Maybe just wing it?"];
  }
};

export interface ExtractedTaskData { mainTask: string; subtasks: string[]; }

export const extractActionsFromChat = async (text: string): Promise<ExtractedTaskData | null> => {
  try {
    const prompt = `Analyze advice and extract tasks. Text: "${text}". Return JSON object with "mainTask" (string) and "subtasks" (string array).`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME, contents: prompt, config: { responseMimeType: "application/json", safetySettings }
    });
    const jsonText = response.text;
    if (!jsonText) return null;
    const parsed = JSON.parse(jsonText);
    if (parsed.mainTask && Array.isArray(parsed.subtasks)) {
      return { mainTask: String(parsed.mainTask), subtasks: parsed.subtasks.map(String) };
    }
    return null;
  } catch (error) { return null; }
};

export const generateSmartSuggestions = async (kidAge: string, season: string, context: string): Promise<string[]> => {
  try {
    const prompt = `You are a "Dad Strategy Agent". The user has a child aged: ${kidAge}. It is currently ${season}.
    
    Generate 6 actionable tasks that make the dad look proactive and competent.
    
    CRITICAL PRIORITY:
    - 2 tasks MUST be specific "Unknown Unknowns" or safety milestones for this exact age (e.g., if 6mo, "Lower crib mattress"; if 3yo, "Check window locks").
    - 1 task for "Partner Appreciation" (The mental load equalizer).
    - 1 task for "Home Maintenance" (Seasonal/Safety).
    - 2 tasks for "Dad Sanity" or bonding.

    Context: ${context}.
    
    Return ONLY a JSON array of 6 strings. Keep them short, punchy, and specific.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME, contents: prompt, config: { responseMimeType: "application/json", safetySettings }
    });
    const text = response.text;
    return text ? JSON.parse(text) : [];
  } catch (error) { return ["Take a nap"]; }
};

// Fallback tips for offline/error states
const BACKUP_TIPS = [
  "You're doing better than you think. The fact you showed up today counts.",
  "That thing you keep putting off? It probably takes 5 minutes. Do it now.",
  "Text your partner something nice. Right now. Do it.",
  "Your kid won't remember if the house was clean. They'll remember you were there.",
  "Check your car's tire pressure. Seriously. It takes 2 minutes.",
  "When's the last time you called your parents? Yeah, do that.",
  "You don't have to be perfect. 'Good enough' is actually good enough.",
  "Schedule that doctor's appointment you've been avoiding.",
  "The dishes can wait. Your kid's bedtime story can't.",
  "Take 5 minutes for yourself today. Lock the bathroom door if you have to."
];

export const generateDailyTip = async (profile: UserProfile): Promise<string> => {
  try {
    const prompt = `You are a wise, tired dad giving advice to another dad with a ${profile.kidStage}.

Generate ONE "Daily Intel" tip. Choose randomly from these styles:
- 70% chance: Encouragement, wisdom, solidarity (e.g., "You're doing better than you think")
- 30% chance: Practical reminder about tasks dads forget (e.g., "Check tire pressure", "Schedule that appointment")

Rules:
- Max 2 sentences
- Personal, direct tone (like texting a friend)
- No corporate speak or generic quotes
- Be specific to the exhaustion of parenting

Return ONLY the tip text.`;
    const response = await ai.models.generateContent({
      model: MODEL_NAME, contents: prompt, config: { safetySettings }
    });
    return response.text || BACKUP_TIPS[Math.floor(Math.random() * BACKUP_TIPS.length)];
  } catch (error) {
    return BACKUP_TIPS[Math.floor(Math.random() * BACKUP_TIPS.length)];
  }
};

export const analyzePriorities = async (tasks: any[]): Promise<{ priorities: { id: string; reason: string }[]; stale: { id: string; reason: string }[] }> => {
  try {
    const simplifiedTasks = tasks.map(t => ({
      id: t.id,
      title: t.title,
      ageDays: Math.floor((Date.now() - t.createdAt) / (1000 * 60 * 60 * 24))
    }));

    const prompt = `You are a "Dad Strategy Agent". Help prioritize this to-do list.
    
Tasks: ${JSON.stringify(simplifiedTasks)}

1. Identify up to 3 "High Priority" tasks. Look for:
   - Urgent words (Call, Schedule, Fix, Deadline, Bill)
   - Health/Kids/Safety items
   - Tasks that are getting old (> 3 days) but look important.
   
2. Identify up to 3 "Stale" tasks. Look for:
   - Tasks > 7 days old
   - Vague or non-essential items ("Research x", "Think about y")
   
Return JSON ONLY:
{
  "priorities": [{ "id": "...", "reason": "Brief reason why" }],
  "stale": [{ "id": "...", "reason": "Brief reason why" }]
}`;

    const response = await ai.models.generateContent({
      model: MODEL_NAME, contents: prompt, config: { responseMimeType: "application/json", safetySettings }
    });
    
    const text = response.text;
    if (!text) return { priorities: [], stale: [] };
    return JSON.parse(text);
  } catch (error) {
    console.error("Analysis failed", error);
    return { priorities: [], stale: [] };
  }
};
