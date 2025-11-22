import React from 'react';
import { Task, TaskAnalysis } from '../types';

interface AgentPriorityModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  analysis: TaskAnalysis | null;
  isLoading: boolean;
  onApplyPriorities: (priorityIds: string[], staleIdsToDelete: string[]) => void;
}

const AgentPriorityModal: React.FC<AgentPriorityModalProps> = ({
  isOpen,
  onClose,
  tasks,
  analysis,
  isLoading,
  onApplyPriorities
}) => {
  const [selectedPriorities, setSelectedPriorities] = React.useState<string[]>([]);
  const [selectedStale, setSelectedStale] = React.useState<string[]>([]);

  // Reset selection when analysis changes
  React.useEffect(() => {
    if (analysis) {
      setSelectedPriorities(analysis.priorities.map(p => p.id));
      // For stale, we default to NOT deleting them, user must opt-in to delete/snooze
      setSelectedStale([]); 
    }
  }, [analysis]);

  if (!isOpen) return null;

  const handleSave = () => {
    onApplyPriorities(selectedPriorities, selectedStale);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-dad-card border border-dad-primary rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-dad-primary/10 p-6 border-b border-dad-primary/20">
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            🚀 Get Sh*t Done Mode
          </h2>
          <p className="text-dad-text/80 text-sm mt-1">
            I've analyzed your list. Here is the battle plan.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto space-y-8">
          
          {isLoading ? (
            <div className="text-center py-12 space-y-4">
              <div className="animate-spin text-4xl">🤔</div>
              <p className="text-dad-text">Crunching the numbers...</p>
            </div>
          ) : !analysis ? (
             <div className="text-center text-red-400">
               Analysis failed. Even robots get tired.
               <button onClick={onClose} className="block mx-auto mt-4 text-white underline">Close</button>
             </div>
          ) : (
            <>
              {/* Priorities Section */}
              {analysis.priorities.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-dad-accent font-bold uppercase text-xs tracking-wider">
                    <span>🔥 Recommended Focus</span>
                  </div>
                  <div className="space-y-2">
                    {analysis.priorities.map(item => {
                      const task = tasks.find(t => t.id === item.id);
                      if (!task) return null;
                      const isSelected = selectedPriorities.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedPriorities(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-dad-primary/20 border-dad-primary' : 'bg-gray-800/50 border-gray-700 opacity-60'}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-white">{task.title}</span>
                            {isSelected && <span className="text-dad-primary">✓</span>}
                          </div>
                          <p className="text-xs text-dad-text mt-1">💡 {item.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Stale Section */}
              {analysis.stale.length > 0 && (
                <div className="space-y-3">
                   <div className="flex items-center gap-2 text-gray-400 font-bold uppercase text-xs tracking-wider">
                    <span>🕸️ Cobweb Corner (Stale Tasks)</span>
                  </div>
                  <p className="text-xs text-gray-500">Select to move to "Someday" (Hide for now)</p>
                  <div className="space-y-2">
                    {analysis.stale.map(item => {
                      const task = tasks.find(t => t.id === item.id);
                      if (!task) return null;
                      const isSelected = selectedStale.includes(item.id);
                      return (
                        <div 
                          key={item.id}
                          onClick={() => setSelectedStale(prev => isSelected ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                          className={`p-3 rounded-xl border cursor-pointer transition-all ${isSelected ? 'bg-red-900/20 border-red-500/50' : 'bg-gray-800/50 border-gray-700'}`}
                        >
                           <div className="flex justify-between items-start">
                            <span className={`font-medium ${isSelected ? 'text-gray-400 line-through' : 'text-white'}`}>{task.title}</span>
                            {isSelected && <span className="text-red-400">🗑️</span>}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">⚠️ {item.reason}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800 flex gap-3">
          <button 
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-gray-400 hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            disabled={isLoading}
            className="flex-1 py-3 rounded-xl font-bold bg-dad-primary text-white shadow-lg shadow-dad-primary/20 active:scale-95 transition-transform disabled:opacity-50"
          >
            Apply Plan
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentPriorityModal;
