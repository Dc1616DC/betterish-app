import { useState, useEffect } from 'react';
import { generateSmartSuggestions } from '../services/geminiService';

interface TaskInspirationProps {
  onAdd: (task: string) => void;
  onClose: () => void;
  kidStage?: string;
}

const getSeason = () => {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return "Spring";
  if (month >= 5 && month <= 7) return "Summer";
  if (month >= 8 && month <= 10) return "Fall";
  return "Winter";
};

export default function TaskInspiration({ onAdd, onClose, kidStage = "Toddler" }: TaskInspirationProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const season = getSeason();
      const result = await generateSmartSuggestions(kidStage, season, "general");
      setSuggestions(result);
      setLoading(false);
    };
    load();
  }, [kidStage]);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-end md:items-center justify-center p-4 animate-fade-in" onClick={onClose}>
      <div className="bg-dad-card w-full max-w-md rounded-3xl p-6 space-y-4 border border-dad-primary/20" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-white text-lg">Brainstorming</h3>
          <button onClick={onClose} className="text-gray-400">X</button>
        </div>
        {loading ? (
          <div className="text-center py-8 text-gray-500">Consulting the council of dads...</div>
        ) : (
          <div className="space-y-2">
            {suggestions.map((s, i) => (
              <button key={i} onClick={() => { onAdd(s); onClose(); }} className="w-full text-left p-3 bg-gray-800/50 rounded-xl hover:bg-dad-primary/20 hover:text-dad-primary transition-colors text-sm text-gray-300">
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}