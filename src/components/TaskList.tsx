import React, { useState } from 'react';
import { Task } from '../types';
import { breakDownTaskAI } from '../services/geminiService';
import TaskInspiration from './TaskInspiration';

interface TaskListProps {
  tasks: Task[];
  toggleTask: (id: string) => void;
  addTask: (title: string) => void;
  deleteTask: (id: string) => void;
  addSubTasks: (parentId: string, subtaskTitles: string[]) => void;
  toggleTaskExpansion: (id: string) => void;
  onAskAI: (taskTitle: string, taskId: string) => void;
  kidStage?: string;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, toggleTask, addTask, deleteTask, addSubTasks, toggleTaskExpansion, onAskAI, kidStage }) => {
  const [newItem, setNewItem] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [showInspiration, setShowInspiration] = useState(false);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    addTask(newItem);
    setNewItem('');
  };

  const handleBreakdown = async (task: Task) => {
    if (task.isBrokenDown) return;
    setLoadingId(task.id);
    const steps = await breakDownTaskAI(task.title);
    addSubTasks(task.id, steps);
    setLoadingId(null);
  };

  const sortedTasks = [...tasks].sort((a, b) => {
    // 1. Completed tasks go to bottom
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    
    // 2. Survival tasks go to top (if not completed)
    if (!a.completed && !b.completed) {
        if (a.category === 'survival' && b.category !== 'survival') return -1;
        if (b.category === 'survival' && a.category !== 'survival') return 1;
    }

    // 3. Newest first
    return b.createdAt - a.createdAt;
  });

  return (
    <>
      {showInspiration && <TaskInspiration onAdd={addTask} onClose={() => setShowInspiration(false)} kidStage={kidStage} />}
      <div className="flex flex-col h-full p-6 pb-24 animate-fade-in">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">The List</h2>
          <button onClick={() => setShowInspiration(true)} className="text-xs bg-dad-card border border-dad-primary/50 text-dad-primary px-3 py-2 rounded-lg hover:bg-dad-primary hover:text-white transition-colors flex items-center gap-1 font-bold">
             <span>💡 Brainstorm</span>
           </button>
        </div>
        <div className="mb-6">
          <form onSubmit={handleAdd} className="flex gap-2">
            <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="Add something..." className="flex-1 bg-dad-card border border-gray-700 text-white rounded-xl px-4 py-4 focus:outline-none focus:border-dad-primary placeholder-gray-500 shadow-sm" />
            <button type="submit" className="bg-dad-primary text-white font-bold rounded-xl px-5 py-3 active:scale-95 transition-transform shadow-lg shadow-orange-900/20">+</button>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto -mx-2 px-2 space-y-3 pb-10">
          {sortedTasks.map(task => (
            <div key={task.id} className={`group bg-dad-card rounded-xl p-4 border transition-all shadow-sm ${task.completed ? 'border-transparent opacity-50' : task.category === 'survival' ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700 hover:border-gray-600'}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => toggleTask(task.id)}>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${task.completed ? 'bg-dad-primary border-dad-primary' : task.category === 'survival' ? 'border-red-500' : 'border-gray-500 hover:border-dad-primary'}`}>
                    {task.completed && <span className="text-white text-xs">✓</span>}
                    {!task.completed && task.category === 'survival' && <span className="text-red-500 text-[10px]">🔥</span>}
                  </div>
                  <span className={`text-base leading-tight select-none ${task.completed ? 'line-through text-dad-secondary' : 'text-white'}`}>{task.title}</span>
                </div>
                <div className="flex gap-1 ml-2 items-start">
                  {!task.completed && !task.category.includes('subtask') && (
                    <>
                      <button onClick={() => { if (task.isBrokenDown) { toggleTaskExpansion(task.id); } else { handleBreakdown(task); }}} disabled={loadingId === task.id} className="p-2 text-dad-accent hover:bg-gray-700/50 rounded disabled:opacity-50 transition-colors">
                        {loadingId === task.id ? "..." : task.isBrokenDown ? (task.isExpanded ? "▲" : "▼") : "☰"}
                      </button>
                      <button onClick={() => onAskAI(task.title, task.id)} className="p-2 text-dad-primary hover:bg-gray-700/50 rounded transition-colors">💬</button>
                    </>
                  )}
                  <button onClick={() => deleteTask(task.id)} className="p-2 text-dad-secondary hover:text-red-400 rounded transition-colors">×</button>
                </div>
              </div>
              {task.isBrokenDown && task.subtasks && task.subtasks.length > 0 && task.isExpanded && (
                <div className="mt-3 ml-9 space-y-2 pl-4 border-l-2 border-gray-700 animate-fade-in">
                  {task.subtasks.map(st => (
                     <div key={st.id} className="flex items-center gap-3 cursor-pointer" onClick={() => toggleTask(st.id)}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 ${st.completed ? 'bg-dad-secondary border-dad-secondary' : 'border-gray-600 hover:border-gray-400'}`}>
                           {st.completed && <div className="w-2 h-2 bg-white rounded-sm" />}
                        </div>
                        <span className={`text-sm select-none ${st.completed ? 'line-through text-dad-secondary' : 'text-gray-300'}`}>{st.title}</span>
                     </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
export default TaskList;