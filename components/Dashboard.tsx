
import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { DailyStats, UserProfile } from '../types';
import { getHealthInsight } from '../services/geminiService';

interface DashboardProps {
  stats: DailyStats;
  profile: UserProfile;
  onAddWater: () => void;
  onRemoveWater: () => void;
  onUpdateProfile: (field: keyof UserProfile, value: any) => void;
  onNavigateToLog: () => void;
  onNavigateToProfile: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ stats, profile, onAddWater, onRemoveWater, onUpdateProfile, onNavigateToLog, onNavigateToProfile }) => {
  const [insight, setInsight] = useState<string>('Crunching your health data...');
  
  useEffect(() => {
    getHealthInsight(stats, profile).then(setInsight);
  }, [stats.items.length]);

  const caloriePercent = Math.min((stats.calories / profile.dailyGoal) * 100, 100);
  const waterPercent = Math.min((stats.water / 8) * 100, 100);

  const weeklyData = [
    { day: 'Mon', cal: 1850 },
    { day: 'Tue', cal: 2100 },
    { day: 'Wed', cal: 1950 },
    { day: 'Thu', cal: stats.calories },
    { day: 'Fri', cal: 1700 },
    { day: 'Sat', cal: 2200 },
    { day: 'Sun', cal: 1800 },
  ];

  return (
    <div className="tab-content space-y-6 pb-32 px-5 pt-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Hi, <span className="text-emerald-600">{profile.name}</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-xs mt-0.5">Let's reach your {profile.goal} goal.</p>
        </div>
        <button onClick={onNavigateToProfile} className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 flex items-center justify-center text-slate-400">
          <i className="fa-solid fa-user-gear text-lg"></i>
        </button>
      </header>

      {/* Insight Card */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-[2rem] p-5 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-20">
          <i className="fa-solid fa-sparkles text-4xl"></i>
        </div>
        <div className="relative z-10">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Daily Smart Insight</h4>
          <p className="text-sm font-bold leading-relaxed">{insight}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-50 dark:border-slate-800 transition-all">
        <div className="flex flex-col items-center">
          <div className="w-48 h-48 relative flex items-center justify-center">
             <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-50 dark:text-slate-800/50" />
                <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="283" strokeDashoffset={283 - (283 * caloriePercent) / 100} strokeLinecap="round" className="text-emerald-500 transition-all duration-1000 ease-out" />
             </svg>
             <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Left</span>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white">
                  {Math.max(0, profile.dailyGoal - stats.calories)}
                </h3>
                <span className="text-emerald-500 text-[10px] font-black uppercase mt-1">KCAL</span>
             </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Animated Water Card */}
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden flex flex-col items-center">
          <div 
            className="absolute bottom-0 left-0 right-0 bg-blue-500/10 transition-all duration-1000 ease-in-out"
            style={{ height: `${waterPercent}%` }}
          >
            <div className="absolute top-0 left-0 right-0 h-4 bg-blue-500/5 animate-pulse"></div>
          </div>
          
          <div className="relative z-10 w-full flex flex-col items-center">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-xl flex items-center justify-center mb-3">
              <i className="fa-solid fa-droplet text-lg"></i>
            </div>
            <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Hydration</span>
            <div className="flex items-baseline gap-1 my-2">
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">{stats.water}</h3>
              <span className="text-slate-400 text-xs">/ 8</span>
            </div>
            <div className="flex gap-2 w-full mt-2">
              <button onClick={onAddWater} className="flex-1 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                <i className="fa-solid fa-plus text-xs"></i>
              </button>
              <button onClick={onRemoveWater} className="w-10 bg-slate-50 dark:bg-slate-800 text-slate-400 h-10 rounded-xl flex items-center justify-center active:scale-95 transition-all">
                <i className="fa-solid fa-minus text-xs"></i>
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-5 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
          <span className="text-slate-400 text-[9px] font-black uppercase tracking-widest block text-center">Macros</span>
          <div className="space-y-3">
             <MacroBar label="Prot" color="bg-orange-400" value={stats.items.reduce((acc, i) => acc + (i.protein || 0), 0)} goal={profile.proteinGoal} />
             <MacroBar label="Carb" color="bg-emerald-400" value={stats.items.reduce((acc, i) => acc + (i.carbs || 0), 0)} goal={profile.carbsGoal} />
             <MacroBar label="Fat" color="bg-indigo-400" value={stats.items.reduce((acc, i) => acc + (i.fat || 0), 0)} goal={profile.fatGoal} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="h-40 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={weeklyData}>
              <defs>
                <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="day" hide />
              <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
              <Area type="monotone" dataKey="cal" stroke="#10b981" strokeWidth={3} fill="url(#colorCal)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

const MacroBar: React.FC<{ label: string; color: string; value: number; goal: number }> = ({ label, color, value, goal }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
      <span>{label}</span>
      <span className="text-slate-600 dark:text-slate-400">{Math.round(value)}g</span>
    </div>
    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
      <div className={`h-full ${color} transition-all duration-700 ease-out`} style={{ width: `${Math.min((value / goal) * 100, 100)}%` }} />
    </div>
  </div>
);

export default Dashboard;
