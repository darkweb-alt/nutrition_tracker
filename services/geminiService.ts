
import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem, UserProfile, DailyMealPlan, WeeklyMealPlan } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

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
            text: "Analyze this food image with high cultural awareness. Identify global and regional specialties precisely (e.g., South Indian/Tamil Nadu dishes like Dosa, Idli, Sambar, or international foods like Sushi, Tacos, etc.). Estimate total calories and list the specific main ingredients. Provide nutritional estimates for Protein, Carbs, and Fat in grams based on standard preparations of these regional dishes."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Common or traditional name of the food" },
            calories: { type: Type.NUMBER, description: "Total calorie estimate" },
            protein: { type: Type.NUMBER, description: "Estimated protein in grams" },
            carbs: { type: Type.NUMBER, description: "Estimated carbohydrates in grams" },
            fat: { type: Type.NUMBER, description: "Estimated fat in grams" },
            ingredients: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of identified ingredients, including regional spices or components"
            }
          },
          required: ["name", "calories", "ingredients", "protein", "carbs", "fat"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error recognizing food:", error);
    throw error;
  }
};

export const getNutritionAdvice = async (message: string, profile: UserProfile, chatHistory: { role: string, parts: any[] }[]) => {
  try {
    const chat = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
        systemInstruction: `You are the NutriLens AI Health Assistant. Your expertise is STRICTLY limited to food, nutrition, recipes, calorie estimation, and dietary health. 

RULES:
1. ONLY answer questions about food, nutrition, calories, and healthy eating habits.
2. If the user asks about ANY other topic (e.g., politics, coding, general trivia, weather, etc.), politely decline by saying something like: "I'm specialized only in nutrition and food. How can I help you with your diet today?"
3. Always consider the user's current profile: Name: ${profile.name}, Goal: ${profile.goal}, Calories: ${profile.dailyGoal}, Weight: ${profile.weight}kg.
4. Give concise, actionable advice.
5. If estimating calories for a specific food, provide a range and mention it's an estimate.`,
      },
    });

    // We pass the history manually in sendMessage if needed, but for simplicity we'll just send the current message
    // and rely on the chat instance or reconstruct contents. Reconstructing contents is safer for sessionless.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...chatHistory,
        { role: 'user', parts: [{ text: message }] }
      ],
      config: {
        systemInstruction: `You are the NutriLens AI Health Assistant. Your expertise is STRICTLY limited to food, nutrition, recipes, calorie estimation, and dietary health. 

RULES:
1. ONLY answer questions about food, nutrition, calories, and healthy eating habits.
2. If the user asks about ANY other topic, politely decline and steer back to nutrition.
3. Be friendly and professional.
4. User Info: ${profile.name}, Goal: ${profile.goal}, Target: ${profile.dailyGoal}kcal.`
      }
    });

    return response.text;
  } catch (error) {
    console.error("Chat error:", error);
    return "I'm having trouble connecting to the kitchen right now. Please try again later!";
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
            properties: {
              protein: { type: Type.NUMBER },
              carbs: { type: Type.NUMBER },
              fat: { type: Type.NUMBER }
            },
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
  try {
    const prompt = `STRICT REQUIREMENT: Generate a personalized daily meal plan for today consisting ONLY of authentic Indian Tamil Nadu regional cuisine (e.g., Idli, Dosa, Sambar, Rasam, Pongal, Chettinad dishes, Kootu, Poriyal, etc.).
    Do not include any other international or global cuisines.
    User Health Goal: ${profile.goal}.
    Daily Nutritional Targets: Calories: ${profile.dailyGoal}kcal, Protein: ${profile.proteinGoal}g, Carbs: ${profile.carbsGoal}g, Fat: ${profile.fatGoal}g.
    Allergies: ${profile.allergies.join(', ') || 'None'}.
    Please ensure the portion sizes and ingredients are realistic for a healthy Tamil diet.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: mealPlanSchema
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating daily plan:", error);
    throw error;
  }
};

export const generateWeeklyMealPlan = async (profile: UserProfile): Promise<WeeklyMealPlan> => {
  try {
    const prompt = `Generate a personalized 7-day meal plan (Monday to Sunday) consisting primarily of Indian Tamil Nadu specialties, while ensuring variety within the cuisine.
    The user prefers authentic Tamil Nadu food.
    Goal: ${profile.goal}. Daily Targets - Calories: ${profile.dailyGoal}kcal, Protein: ${profile.proteinGoal}g, Carbs: ${profile.carbsGoal}g, Fat: ${profile.fatGoal}g.
    Allergies: ${profile.allergies.join(', ') || 'None'}.
    Ensure each day is unique and nutritiously balanced according to the macro targets using South Indian/Tamil ingredients.`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            days: {
              type: Type.ARRAY,
              items: mealPlanSchema
            }
          },
          required: ["days"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating weekly plan:", error);
    throw error;
  }
};
