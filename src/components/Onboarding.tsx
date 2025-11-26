import React, { useState } from 'react';
import { KID_STAGES } from '../constants';
import { UserProfile } from '../types';

interface OnboardingProps {
  onComplete: (profile: Partial<UserProfile> & { initialTask?: string }) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [kidStage, setKidStage] = useState(KID_STAGES[1]);
  const [brainDump, setBrainDump] = useState('');

  const handleNext = () => {
    if (step === 3) {
      onComplete({ kidStage });
      if (brainDump.trim()) {
        // The parent component will handle adding this task
        // We just pass the data up or handle it via a callback prop if we added one
      }
    } else {
      setStep(prev => prev + 1);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-dad-bg flex flex-col items-center justify-center p-6 animate-fade-in">
      
      {/* Progress Bar */}
      <div className="w-full max-w-md mb-8 flex gap-2">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-dad-primary' : 'bg-gray-800'}`} />
        ))}
      </div>

      <div className="w-full max-w-md">
        
        {step === 1 && (
          <div className="text-center space-y-6 animate-slide-up">
            <div className="text-6xl mb-4">🤝</div>
            <h1 className="text-3xl font-bold text-white">Welcome to Betterish.</h1>
            <div className="text-gray-400 text-lg leading-relaxed space-y-4">
              <p>Because "Superdad" is a myth, but "Dad who remembered the diaper bag" is a legend.</p>
              <p>We aren't here to optimize your life. We're here to help you survive it. Did you feed the kids? Did you keep the tiny humans safe? Did you fix that thing you said you'd fix six months ago?</p>
              <p className="font-bold text-dad-primary">That counts. Lower your standards. Raise your game.</p>
            </div>
            <button onClick={handleNext} className="w-full bg-dad-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-orange-900/20 mt-8">
              I can work with that 👊
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <div className="text-6xl mb-4">👶</div>
              <h1 className="text-2xl font-bold text-white">Who is the boss?</h1>
              <p className="text-gray-400">Tell us the age of the little one running the show.</p>
            </div>
            
            <div className="space-y-3">
              <label className="text-xs font-bold text-dad-primary uppercase tracking-wider">Kid's Stage</label>
              <select 
                value={kidStage} 
                onChange={(e) => setKidStage(e.target.value)}
                className="w-full bg-dad-card border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-dad-primary appearance-none"
              >
                {KID_STAGES.map(stage => (
                  <option key={stage} value={stage}>{stage}</option>
                ))}
              </select>
              <p className="text-xs text-gray-600 italic">
                So our AI knows whether to suggest "Check Crib Height" or "Hide the Sharpies".
              </p>
            </div>

            <button onClick={handleNext} className="w-full bg-dad-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg mt-8">
              Next →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-slide-up">
            <div className="text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h1 className="text-2xl font-bold text-white">Clear the mental RAM.</h1>
              <p className="text-gray-400">What have you been meaning to do for 3 weeks?</p>
            </div>

            <div className="space-y-3">
               <textarea 
                 value={brainDump}
                 onChange={(e) => setBrainDump(e.target.value)}
                 placeholder="e.g. Fix the doorknob, Call insurance..."
                 className="w-full h-32 bg-dad-card border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-dad-primary resize-none placeholder-gray-600"
               />
            </div>

            <button 
              onClick={() => {
                 // We pass the task up to the parent via a slightly modified handler
                 // For simplicity in this component, we just call onComplete. 
                 // Ideally we'd pass the task string back.
                 // Let's modify the prop type above? No, let's just hack it by passing it in the profile object for now or handled by parent
                 onComplete({ kidStage, initialTask: brainDump }); 
              }} 
              className="w-full bg-dad-primary text-white py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity shadow-lg mt-8"
            >
              Offload It & Start
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
