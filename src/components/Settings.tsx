import { UserProfile, UserStats } from '../types';
import { KID_STAGES } from '../constants';
import { Save, Trash2 } from 'lucide-react';

interface SettingsProps {
  stats: UserStats;
  profile: UserProfile;
  updateProfile: (profile: UserProfile) => void;
  resetData: () => void;
}

export default function Settings({ stats, profile, updateProfile, resetData }: SettingsProps) {
  const handleChange = (field: keyof UserProfile, value: string) => {
    updateProfile({ ...profile, [field]: value });
  };

  return (
    <div className="space-y-6 p-4 pb-20 md:p-8">
      <header>
        <h2 className="text-2xl font-bold">Profile & Settings</h2>
        <p className="text-dad-muted text-sm">Customize your dad data.</p>
      </header>

      {/* Stats Summary */}
      <div className="bg-dad-card/50 p-4 rounded-xl border border-dad-secondary/10 flex justify-between text-sm">
          <div className="text-center">
              <div className="text-dad-accent font-bold text-lg">{stats.streak}</div>
              <div className="text-dad-muted text-xs">Day Streak</div>
          </div>
          <div className="text-center">
              <div className="text-dad-primary font-bold text-lg">{stats.tasksCompleted}</div>
              <div className="text-dad-muted text-xs">Missions Done</div>
          </div>
          <div className="text-center">
              <div className="text-white font-bold text-lg">{stats.level.split(' ')[0]}</div>
              <div className="text-dad-muted text-xs">Level</div>
          </div>
      </div>

      <div className="bg-dad-card p-6 rounded-xl border border-dad-secondary/20 space-y-6">
        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-dad-muted mb-2">Your Name (or Dad Name)</label>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="w-full bg-dad-bg border border-dad-secondary/30 rounded-lg p-3 text-dad-text focus:border-dad-primary focus:outline-none"
          />
        </div>

        {/* Kid Name */}
        <div>
          <label className="block text-sm font-medium text-dad-muted mb-2">Kid's Name (Oldest or Focus)</label>
          <input
            type="text"
            value={profile.kidName}
            onChange={(e) => handleChange('kidName', e.target.value)}
            className="w-full bg-dad-bg border border-dad-secondary/30 rounded-lg p-3 text-dad-text focus:border-dad-primary focus:outline-none"
          />
        </div>

        {/* Stage */}
        <div>
          <label className="block text-sm font-medium text-dad-muted mb-2">Current Stage</label>
          <select
            value={profile.kidStage}
            onChange={(e) => handleChange('kidStage', e.target.value)}
            className="w-full bg-dad-bg border border-dad-secondary/30 rounded-lg p-3 text-dad-text focus:border-dad-primary focus:outline-none appearance-none"
          >
            {KID_STAGES.map(stage => (
              <option key={stage} value={stage}>{stage}</option>
            ))}
          </select>
        </div>

        <div className="pt-4 border-t border-dad-secondary/10 space-y-4">
          <button className="w-full bg-dad-primary hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2">
            <Save size={18} />
            Auto-Saved
          </button>

          <button 
            onClick={() => {
                if(confirm("Reset all data? This cannot be undone.")) {
                    resetData();
                }
            }}
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm py-2 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <Trash2 size={14} />
            Reset All Data
          </button>
        </div>
      </div>

      <div className="text-center text-xs text-dad-muted pt-8">
        Betterish v0.2.0 • Built for dads, by a dad agent.
      </div>
    </div>
  );
}