import React, { useState, useEffect } from 'react';
import { UserStats, Task, DailyTip, UserProfile } from '../types';
import { DAD_LEVELS, CURATED_TASK_LIBRARY } from '../constants';

interface DashboardProps {
  stats: UserStats;
  tasks: Task[];
  dailyTip: DailyTip | null;
  profile: UserProfile;
  onQuickTaskAdd: (title: string) => void;
  onNavigateToTasks: () => void;
  onAgentReview: () => void;
  sortByPriority: boolean;
}

const DailyIntelModal = ({ tip, profile, onClose }: { tip: DailyTip, profile: UserProfile, onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-fade-in" onClick={onClose}>
    <div className="bg-dad-card p-6 rounded-3xl border border-dad-primary max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
       <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors">
         <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
       </button>
       <div className="w-12 h-12 bg-dad-primary/20 rounded-full flex items-center justify-center mb-4 text-2xl">💡</div>
       <h3 className="text-dad-primary font-bold uppercase tracking-widest text-xs mb-3">Daily Intel</h3>
       <p className="text-xl text-white font-medium leading-relaxed">"{tip.text}"</p>
       <div className="mt-4 pt-4 border-t border-gray-700 flex justify-between items-center">
          <span className="text-xs text-gray-500">For: {profile.kidStage}</span>
          <button onClick={onClose} className="bg-dad-primary text-white px-4 py-2 rounded-lg font-bold text-sm">Got it</button>
       </div>
    </div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ stats, tasks, dailyTip, profile, onQuickTaskAdd, onNavigateToTasks, onAgentReview, sortByPriority }) => {
  const [showIntel, setShowIntel] = useState(false);
  const [randomWins, setRandomWins] = useState<string[]>([]);

  const shuffleWins = () => {
    const allWins = CURATED_TASK_LIBRARY["Quick Wins"];
    const shuffled = [...allWins].sort(() => 0.5 - Math.random());
    setRandomWins(shuffled.slice(0, 4));
  };

  // Randomize the Quick Wins on mount
  useEffect(() => {
    shuffleWins();
  }, []);

  // Helper to get an emoji for a task
  const getEmoji = (text: string) => {
    if (text.includes("water")) return "💧";
    if (text.includes("tire")) return "🚗";
    if (text.includes("wife") || text.includes("Partner")) return "❤️";
    if (text.includes("mom") || text.includes("Call")) return "📞";
    if (text.includes("clean") || text.includes("Throw")) return "🧹";
    if (text.includes("bill")) return "💸";
    return "⚡";
  };

  const activeTaskCount = tasks.filter(t => !t.completed).length;
  const currentLevel = DAD_LEVELS.slice().reverse().find(l => stats.tasksCompleted >= l.threshold) || DAD_LEVELS[0];
  const nextLevel = DAD_LEVELS.find(l => l.threshold > stats.tasksCompleted);
  const progressToNext = nextLevel ? ((stats.tasksCompleted - currentLevel.threshold) / (nextLevel.threshold - currentLevel.threshold)) * 100 : 100;

  return (
    <div className="flex flex-col h-full p-6 pb-24 animate-fade-in space-y-8">
      {showIntel && dailyTip && <DailyIntelModal tip={dailyTip} profile={profile} onClose={() => setShowIntel(false)} />}

      <div className="flex justify-between items-start">
        <div>
          <p className="text-dad-muted text-xs uppercase tracking-wider font-bold mb-1">Status Report</p>
          <h1 className="text-2xl font-bold text-white">{currentLevel.title}</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
           <div className="bg-dad-card px-3 py-1 rounded-full border border-gray-700">
             <span className="text-xs text-dad-primary font-bold">🔥 {stats.streak} Day Streak</span>
           </div>

           {/* Intel Button - Now shows a loading state if null */}
           {dailyTip ? (
             <button
               onClick={() => setShowIntel(true)}
               className="text-[10px] bg-gray-800 hover:bg-gray-700 text-dad-accent border border-dad-accent/30 px-3 py-1 rounded-full transition-colors flex items-center gap-1 animate-pulse"
             >
               <span>💡 Intel Available</span>
             </button>
           ) : (
             <span className="text-[10px] text-gray-600 px-2 py-1">Fetching Intel...</span>
           )}
        </div>
      </div>

      <div className="bg-dad-card p-6 rounded-3xl border border-gray-700 relative overflow-hidden shadow-lg">
        <div className="flex justify-between items-end mb-4">
          <div>
            <span className="text-4xl font-bold text-white">{stats.tasksCompleted}</span>
            <span className="text-sm text-dad-muted ml-2">Total Wins</span>
          </div>
          <div className="text-2xl">🏆</div>
        </div>
        <div className="w-full bg-gray-800 h-3 rounded-full overflow-hidden">
          <div className="bg-dad-primary h-full transition-all duration-1000 ease-out" style={{ width: `${progressToNext}%` }}></div>
        </div>
        {nextLevel && (
          <p className="text-xs text-gray-500 mt-3 text-right">{nextLevel.threshold - stats.tasksCompleted} wins to next level</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
         <button onClick={onNavigateToTasks} className="bg-dad-card hover:bg-gray-800 text-white p-5 rounded-3xl border border-gray-700 transition-all active:scale-95 text-left flex flex-col justify-between h-40 group relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-6xl">📋</div>
           
           {sortByPriority && tasks.filter(t => !t.completed && t.category === 'survival').length > 0 ? (
             <div className="w-full z-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider animate-pulse">🔥 Priority</span>
                </div>
                <div className="space-y-2">
                  {tasks
                    .filter(t => !t.completed && t.category === 'survival')
                    .slice(0, 3)
                    .map(t => (
                      <div key={t.id} className="text-sm font-medium truncate flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        {t.title}
                      </div>
                    ))}
                    {tasks.filter(t => !t.completed && t.category === 'survival').length > 3 && (
                      <div className="text-xs text-gray-500 pl-3.5">...and {tasks.filter(t => !t.completed && t.category === 'survival').length - 3} more</div>
                    )}
                </div>
             </div>
           ) : (
             <>
               <div className="flex justify-between items-start z-10">
                 <span className="text-2xl group-hover:scale-110 transition-transform">📋</span>
                 {activeTaskCount > 0 && <span className="bg-dad-primary text-white text-xs font-bold px-2 py-1 rounded-full">{activeTaskCount}</span>}
               </div>
               <div className="z-10">
                 <div className="font-bold text-lg">The List</div>
                 <div className="text-xs text-gray-500">Manage the chaos</div>
               </div>
             </>
           )}
         </button>
         {activeTaskCount >= 5 ? (
           <button onClick={onAgentReview} className="bg-dad-card hover:bg-gray-800 text-white p-5 rounded-3xl border border-gray-700 transition-all active:scale-95 text-left flex flex-col justify-between h-40 group">
             <div className="flex justify-between items-start">
               <span className="text-2xl group-hover:rotate-12 transition-transform">🚀</span>
             </div>
             <div>
               <div className="font-bold text-lg">Get Sh*t Done</div>
               <div className="text-xs text-gray-500">Sort & Prioritize</div>
             </div>
           </button>
         ) : (
           <div className="bg-dad-card/50 p-5 rounded-3xl border border-gray-800 flex flex-col justify-between h-40 opacity-75">
             <span className="text-2xl">✅</span>
             <div>
               <div className="font-bold text-lg text-gray-400">Under Control</div>
               <div className="text-xs text-gray-600">Keep it up, Dad.</div>
             </div>
           </div>
         )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-4">
           <h3 className="text-dad-muted text-xs uppercase tracking-wider font-bold">Need Momentum?</h3>
           <button onClick={shuffleWins} className="text-dad-muted hover:text-white transition-colors text-xs p-1 rounded hover:bg-gray-800" title="Shuffle ideas">🔄</button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {randomWins.map(taskTitle => (
            <button
               key={taskTitle}
               onClick={() => onQuickTaskAdd(taskTitle)}
               className="p-4 bg-dad-card border border-gray-700 rounded-2xl text-sm text-gray-300 hover:border-dad-primary hover:text-white transition-all text-left flex items-center gap-3"
             >
               <span className="text-xl">{getEmoji(taskTitle)}</span>
               <span>{taskTitle}</span>
             </button>
          ))}
          {randomWins.length === 0 && (
             // Fallback if array is empty for some reason
             <button onClick={() => onQuickTaskAdd("Drink water")} className="p-4 bg-dad-card border border-gray-700 rounded-2xl text-sm text-gray-300">
               <span>💧</span> Drink water
             </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
