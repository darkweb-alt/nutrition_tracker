
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, UserProfile, DailyMealPlan, WeeklyMealPlan, Recipe, GroundingSource } from "../types";

// Always initialize with process.env.API_KEY as per instructions
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const recognizeFood = async (base64Image: string): Promise<Partial<FoodItem>> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image
            }
          },
          {
            text: "Analyze this food image. Identify the primary dish and its components. Estimate calories and macros (Protein, Carbs, Fat in grams). List the main ingredients clearly. If multiple items are present, provide a combined estimate."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            protein: { type: Type.NUMBER },
            carbs: { type: Type.NUMBER },
            fat: { type: Type.NUMBER },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["name", "calories", "protein", "carbs", "fat", "ingredients"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Recognition error:", error);
    throw error;
  }
};

export const getNutritionAdvice = async (message: string, profile: UserProfile, history: any[]) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        tools: [{ googleSearch: {} }],
        systemInstruction: `You are NutriLens AI, a specialized nutrition expert. Use Google Search to provide accurate, evidence-based answers. User: ${profile.name}, Goal: ${profile.goal}, Weight: ${profile.weight}kg. Be concise and actionable.`
      }
    });

    const sources: GroundingSource[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    return { text: response.text, sources };
  } catch (error) {
    console.error("Chat error:", error);
    return { text: "I'm having trouble fetching the latest nutrition data. Try asking something else!", sources: [] };
  }
};

export const generateRecipeFromItem = async (foodName: string, ingredients: string[], profile: UserProfile): Promise<Recipe> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a healthy recipe for ${foodName} using these ingredients: ${ingredients.join(', ')}. 
      Adjust for the user's goal: ${profile.goal}. Ensure the recipe is easy to follow.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            time: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["Easy", "Medium", "Hard"] },
            instructions: { type: Type.ARRAY, items: { type: Type.STRING } },
            nutritionalBenefits: { type: Type.STRING }
          },
          required: ["name", "time", "difficulty", "instructions", "nutritionalBenefits"]
        }
      }
    });

    return JSON.parse(response.text || '{}');
  } catch (error) {
    console.error("Recipe generation error:", error);
    throw error;
  }
};

export const getHealthInsight = async (stats: any, profile: UserProfile): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Based on today's consumption (${stats.calories}kcal) and user profile (${profile.goal}), give a one-sentence motivating health insight or tip for today. Be specific.`,
    });
    return response.text || "Keep up the great work on your health journey!";
  } catch {
    return "Hydration is the key to energy. Remember to drink water!";
  }
};

const mealPlanSchema = {
  type: Type.OBJECT,
  properties: {
    dayName: { type: Type.STRING },
    date: { type: Type.STRING },
    totalCalories: { type: Type.NUMBER },
    meals: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["Breakfast", "Lunch", "Dinner", "Snack"] },
          name: { type: Type.STRING },
          calories: { type: Type.NUMBER },
          ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
          macros: {
            type: Type.OBJECT,
            properties: { protein: { type: Type.NUMBER }, carbs: { type: Type.NUMBER }, fat: { type: Type.NUMBER } },
            required: ["protein", "carbs", "fat"]
          }
        },
        required: ["type", "name", "calories", "ingredients", "macros"]
      }
    }
  },
  required: ["dayName", "date", "totalCalories", "meals"]
};

export const generateMealPlan = async (profile: UserProfile): Promise<DailyMealPlan> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a daily meal plan for health goal: ${profile.goal}. Targets: ${profile.dailyGoal}kcal. Prefer authentic healthy dishes.`,
    config: { responseMimeType: "application/json", responseSchema: mealPlanSchema }
  });
  return JSON.parse(response.text || '{}');
};

export const generateWeeklyMealPlan = async (profile: UserProfile): Promise<WeeklyMealPlan> => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate a 7-day meal plan for health goal: ${profile.goal}. Daily target: ${profile.dailyGoal}kcal.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: { days: { type: Type.ARRAY, items: mealPlanSchema } },
        required: ["days"]
      }
    }
  });
  return JSON.parse(response.text || '{}');
};
