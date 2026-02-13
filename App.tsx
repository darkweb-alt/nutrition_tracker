
import React, { useState, useEffect, useRef } from 'react';
import { FoodItem, UserProfile, DailyStats, AppTab, HealthGoal, AuthUser, AppTheme } from './types';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import Scanner from './components/Scanner';
import MealPlanner from './components/MealPlanner';
import ChatBot from './components/ChatBot';
import Profile from './components/Profile';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.DASHBOARD);
  const [user, setUser] = useState<AuthUser>(() => {
    const saved = localStorage.getItem('nutrilens_session');
    return saved ? JSON.parse(saved) : { email: 'guest@nutrilens.ai', name: 'User' };
  });

  const [profile, setProfile] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('nutrilens_profile');
    return saved ? JSON.parse(saved) : {
      name: 'Friend',
      gender: 'Male',
      dailyGoal: 2000,
      proteinGoal: 150,
      carbsGoal: 200,
      fatGoal: 65,
      weight: 70,
      height: 175,
      age: 25,
      activityLevel: 'Moderately Active',
      goal: 'Maintain',
      allergies: [],
      preferences: [],
      waterReminderEnabled: false,
      waterReminderInterval: 60,
      theme: 'light'
    };
  });

  const [dailyStats, setDailyStats] = useState<DailyStats>(() => {
    const saved = localStorage.getItem('nutrilens_daily_stats');
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) return parsed;
    }
    return { date: today, calories: 0, water: 0, items: [] };
  });

  useEffect(() => {
    if (profile.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [profile.theme]);

  useEffect(() => {
    localStorage.setItem('nutrilens_daily_stats', JSON.stringify(dailyStats));
    localStorage.setItem('nutrilens_profile', JSON.stringify(profile));
    localStorage.setItem('nutrilens_session', JSON.stringify(user));
  }, [dailyStats, profile, user]);

  const handleAddWater = () => setDailyStats(prev => ({ ...prev, water: Math.min(8, prev.water + 1) }));
  const handleRemoveWater = () => setDailyStats(prev => ({ ...prev, water: Math.max(0, prev.water - 1) }));

  const handleFoodLogged = (item: FoodItem) => {
    setDailyStats(prev => ({
      ...prev,
      calories: prev.calories + item.calories,
      items: [...prev.items, item]
    }));
    setActiveTab(AppTab.DASHBOARD);
  };

  const updateProfileField = (field: keyof UserProfile, value: any) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleReset = () => {
    if (confirm("Reset all health data?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen pb-20 max-w-md mx-auto relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-x-hidden">
      {activeTab === AppTab.DASHBOARD && (
        <Dashboard 
          stats={dailyStats} 
          profile={profile}
          onAddWater={handleAddWater}
          onRemoveWater={handleRemoveWater}
          onUpdateProfile={updateProfileField}
          onNavigateToLog={() => setActiveTab(AppTab.LOG)}
          onNavigateToProfile={() => setActiveTab(AppTab.PROFILE)}
        />
      )}

      {activeTab === AppTab.PLANNER && <MealPlanner profile={profile} />}

      {activeTab === AppTab.SCAN && (
        <Scanner 
          profile={profile}
          onFoodLogged={handleFoodLogged} 
          onCancel={() => setActiveTab(AppTab.DASHBOARD)} 
        />
      )}

      {activeTab === AppTab.CHAT && <ChatBot profile={profile} />}

      {activeTab === AppTab.LOG && (
        <div className="tab-content p-6 pb-32">
           <header className="mb-8">
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Diary</h2>
              <p className="text-slate-500 text-sm mt-1">Your consumption history</p>
           </header>
           <div className="space-y-4">
              {dailyStats.items.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-12 text-center border border-slate-100 dark:border-slate-800">
                   <p className="text-slate-400 font-bold">Nothing logged today.</p>
                </div>
              ) : (
                dailyStats.items.slice().reverse().map(item => (
                  <div key={item.id} className="bg-white dark:bg-slate-900 p-5 rounded-[2rem] border border-slate-50 dark:border-slate-800 flex gap-4">
                     <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center overflow-hidden shrink-0">
                        {item.imageUrl ? <img src={item.imageUrl} className="w-full h-full object-cover" /> : <i className="fa-solid fa-utensils text-emerald-200"></i>}
                     </div>
                     <div className="flex-1">
                        <h4 className="font-black text-slate-800 dark:text-slate-100">{item.name}</h4>
                        <div className="flex gap-2 mt-2">
                           <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">P: {item.protein}g</span>
                           <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">C: {item.carbs}g</span>
                           <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded-lg">F: {item.fat}g</span>
                        </div>
                     </div>
                     <div className="text-right">
                        <p className="text-xl font-black text-slate-900 dark:text-white leading-none">{item.calories}</p>
                        <p className="text-[9px] text-slate-300 font-black uppercase mt-1">kcal</p>
                     </div>
                  </div>
                ))
              )}
           </div>
        </div>
      )}

      {activeTab === AppTab.PROFILE && (
        <Profile profile={profile} user={user} onUpdateProfile={updateProfileField} onLogout={handleReset} />
      )}

      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

export default App;
