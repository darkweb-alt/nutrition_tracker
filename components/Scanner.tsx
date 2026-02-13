
import React, { useState, useRef } from 'react';
import { recognizeFood, generateRecipeFromItem } from '../services/geminiService';
import { FoodItem, UserProfile, Recipe } from '../types';

interface ScannerProps {
  profile: UserProfile;
  onFoodLogged: (item: FoodItem) => void;
  onCancel: () => void;
}

const Scanner: React.FC<ScannerProps> = ({ profile, onFoodLogged, onCancel }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<Partial<FoodItem> | null>(null);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    setIsProcessing(true);
    try {
      const base64Data = await new Promise<string>((resolve) => {
        const r = new FileReader();
        r.onload = () => resolve((r.result as string).split(',')[1]);
        r.readAsDataURL(file);
      });

      const foodData = await recognizeFood(base64Data);
      setResult(foodData);
    } catch (err) {
      alert("Failed to recognize food. Try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGetRecipe = async () => {
    if (!result?.name || !result?.ingredients) return;
    setLoadingRecipe(true);
    try {
      const r = await generateRecipeFromItem(result.name, result.ingredients, profile);
      setRecipe(r);
    } catch (err) {
      alert("Couldn't generate recipe.");
    } finally {
      setLoadingRecipe(false);
    }
  };

  const confirmLog = () => {
    if (result) {
      onFoodLogged({
        id: Date.now().toString(),
        name: result.name || 'Unknown Food',
        calories: result.calories || 0,
        protein: result.protein || 0,
        carbs: result.carbs || 0,
        fat: result.fat || 0,
        ingredients: result.ingredients || [],
        timestamp: Date.now(),
        imageUrl: previewUrl || undefined
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white dark:bg-slate-950 overflow-y-auto no-scrollbar">
      <div className="p-6 flex justify-between items-center sticky top-0 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl z-20">
        <button onClick={onCancel} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 text-slate-600 border border-slate-100 dark:border-slate-800">
          <i className="fa-solid fa-arrow-left"></i>
        </button>
        <span className="font-black text-[10px] tracking-widest uppercase text-slate-400">NutriLens Vision</span>
        <div className="w-10"></div>
      </div>

      <div className="flex-1 p-6 pb-32 space-y-8">
        {!previewUrl ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-fadeIn">
            <div className="w-48 h-48 bg-emerald-50 dark:bg-emerald-900/10 rounded-[3rem] flex items-center justify-center mb-10 border border-emerald-100 dark:border-emerald-900/20">
              <i className="fa-solid fa-camera-viewfinder text-5xl text-emerald-500"></i>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Scan Your Meal</h2>
            <p className="text-slate-500 text-sm mb-10 max-w-xs">AI will identify ingredients and calculate nutrition instantly.</p>
            <button onClick={() => fileInputRef.current?.click()} className="w-full max-w-xs bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all uppercase tracking-widest text-xs">
              Open Camera
            </button>
            <input type="file" ref={fileInputRef} onChange={handleCapture} accept="image/*" capture="environment" className="hidden" />
          </div>
        ) : (
          <div className="space-y-8 animate-fadeIn">
            <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden bg-slate-100 dark:bg-slate-900 shadow-lg">
              <img src={previewUrl} className={`w-full h-full object-cover transition-all ${isProcessing ? 'blur-sm opacity-50' : ''}`} />
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-4 border-slate-200 border-t-emerald-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest">Analyzing Nutrients...</p>
                </div>
              )}
            </div>

            {result && !isProcessing && (
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-8 shadow-sm border border-slate-50 dark:border-slate-800">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{result.name}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-emerald-500 font-black text-xl">{result.calories}</span>
                    <span className="text-slate-400 text-xs font-bold uppercase tracking-widest">Kcal</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                   <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Protein</p>
                      <p className="font-black text-slate-800 dark:text-white">{result.protein}g</p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Carbs</p>
                      <p className="font-black text-slate-800 dark:text-white">{result.carbs}g</p>
                   </div>
                   <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl text-center border border-slate-100 dark:border-slate-800">
                      <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Fat</p>
                      <p className="font-black text-slate-800 dark:text-white">{result.fat}g</p>
                   </div>
                </div>

                {recipe ? (
                  <div className="space-y-4 p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/30 animate-fadeIn">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black text-slate-900 dark:text-white">Healthy Recipe</h4>
                      <span className="text-[10px] font-black bg-emerald-500 text-white px-2 py-1 rounded-lg uppercase">{recipe.difficulty}</span>
                    </div>
                    <div className="space-y-2">
                      {recipe.instructions.map((step, idx) => (
                        <p key={idx} className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed"><span className="font-black mr-2">{idx + 1}.</span>{step}</p>
                      ))}
                    </div>
                  </div>
                ) : (
                  <button onClick={handleGetRecipe} disabled={loadingRecipe} className="w-full py-4 border-2 border-emerald-500/20 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">
                    {loadingRecipe ? <i className="fa-solid fa-circle-notch animate-spin mr-2"></i> : <i className="fa-solid fa-receipt mr-2"></i>}
                    Get Healthy Recipe
                  </button>
                )}

                <div className="flex gap-4">
                  <button onClick={() => { setPreviewUrl(null); setResult(null); setRecipe(null); }} className="flex-1 py-4 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">Retry</button>
                  <button onClick={confirmLog} className="flex-[2] py-4 bg-emerald-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all text-center">Add to Diary</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Scanner;
