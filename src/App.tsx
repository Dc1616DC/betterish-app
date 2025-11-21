import React, { useState, useEffect } from 'react';
import { ViewState, Task, UserStats, ChatMessage, UserProfile, DailyTip } from './types';
import { INITIAL_TASKS, KID_STAGES } from './constants';
import { generateDailyTip, extractActionsFromChat } from './services/geminiService';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import ChatInterface from './components/Chat';
import Settings from './components/Settings';

const STORAGE_KEY = 'betterish_data_v2';

function App() {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);

  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stats, setStats] = useState<UserStats>({ streak: 1, tasksCompleted: 0, lastActive: Date.now(), level: 'Rookie Dad' });
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState<string>('');

  // New State for V2
  const [profile, setProfile] = useState<UserProfile>({ name: '', kidName: '', kidStage: KID_STAGES[1] });
  const [dailyTip, setDailyTip] = useState<DailyTip | null>(null);

  // Track context for AI Chat
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  // Load Data
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      setTasks(data.tasks || INITIAL_TASKS);
      setStats(data.stats || stats);
      setChatHistory(data.chatHistory || []);
      setProfile(data.profile || { name: '', kidName: '', kidStage: KID_STAGES[1] });
      setDailyTip(data.dailyTip || null);
    } else {
      setTasks(INITIAL_TASKS);
    }
  }, []);

  // Save Data
  useEffect(() => {
    const data = { tasks, stats, chatHistory, profile, dailyTip };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [tasks, stats, chatHistory, profile, dailyTip]);

  // Daily Tip Logic
  useEffect(() => {
    const checkDailyTip = async () => {
      const today = new Date().toISOString().split('T')[0];
      if (!dailyTip || dailyTip.date !== today) {
        const tipText = await generateDailyTip(profile);
        setDailyTip({ date: today, text: tipText, category: 'development' });
      }
    };
    checkDailyTip();
  }, [profile.kidStage, dailyTip]);

  // Task Logic
  const addTask = (title: string, category: 'quick' | 'project' | 'survival' = 'quick') => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: Date.now(),
      category
    };
    setTasks(prev => [newTask, ...prev]);
    return newTask.id;
  };

  // Helper to create a project with pre-filled subtasks
  const addProject = (title: string, subtasks: string[]) => {
     const parentId = addTask(title, 'project');
     addSubTasks(parentId, subtasks);
  };

  const toggleTask = (id: string) => {
    // Find task first to avoid double-counting
    const task = tasks.find(t => t.id === id);
    const isSubtask = !task;

    if (task && !isSubtask) {
      // Update stats BEFORE updating tasks
      if (!task.completed) {
        setStats(s => ({ ...s, tasksCompleted: s.tasksCompleted + 1 }));
      } else {
        setStats(s => ({ ...s, tasksCompleted: Math.max(0, s.tasksCompleted - 1) }));
      }
    }

    // Update task state
    setTasks(prev => {
      const mainTask = prev.find(t => t.id === id);
      if (!mainTask) {
        // Check subtasks
        return prev.map(t => {
          if (t.subtasks) {
            return {
              ...t,
              subtasks: t.subtasks.map(st => st.id === id ? { ...st, completed: !st.completed } : st)
            };
          }
          return t;
        });
      }

      return prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
    });
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addSubTasks = (parentId: string, titles: string[]) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== parentId) return t;

      const subtasks: Task[] = titles.map((title, idx) => ({
        id: `${parentId}_sub_${idx}_${Date.now()}`,
        title,
        completed: false,
        createdAt: Date.now(),
        category: 'quick'
      }));

      return { ...t, isBrokenDown: true, isExpanded: true, subtasks: [...(t.subtasks || []), ...subtasks] };
    }));
  };

  const toggleTaskExpansion = (id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, isExpanded: !t.isExpanded } : t
    ));
  };

  // Ask Dad AI Logic
  const handleAskAI = (taskTitle: string, taskId?: string) => {
    setChatDraft(`I'm stuck on this task: "${taskTitle}". Any tips?`);
    setActiveTaskId(taskId || null);
    setView(ViewState.CHAT);
  };

  const handleConvertChatToTasks = async (text: string): Promise<number> => {
    const extractedData = await extractActionsFromChat(text);
    if (!extractedData || extractedData.subtasks.length === 0) return 0;

    if (activeTaskId) {
      // Context Exists: Add steps as subtasks to the active project
      addSubTasks(activeTaskId, extractedData.subtasks);
    } else {
      // No Context: Create a new "Project" task
      addProject(extractedData.mainTask || "New Project", extractedData.subtasks);
    }
    return extractedData.subtasks.length;
  };

  const addMessage = (msg: ChatMessage) => {
    setChatHistory(prev => [...prev, msg]);
  };

  const resetData = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  };

  const activeTaskTitle = activeTaskId ? tasks.find(t => t.id === activeTaskId)?.title : undefined;

  const renderView = () => {
    switch(view) {
      case ViewState.DASHBOARD:
        return <Dashboard
          stats={stats}
          tasks={tasks}
          dailyTip={dailyTip}
          profile={profile}
          onQuickTaskAdd={(t) => addTask(t, 'quick')}
          onNavigateToTasks={() => setView(ViewState.TASKS)}
        />;
      case ViewState.TASKS:
        return <TaskList
          tasks={tasks}
          toggleTask={toggleTask}
          addTask={addTask}
          deleteTask={deleteTask}
          addSubTasks={addSubTasks}
          toggleTaskExpansion={toggleTaskExpansion}
          onAskAI={handleAskAI}
          kidStage={profile.kidStage}
        />;
      case ViewState.CHAT:
        return <ChatInterface
          messages={chatHistory}
          addMessage={addMessage}
          initialInput={chatDraft}
          onClearInitialInput={() => setChatDraft('')}
          onConvertToTasks={handleConvertChatToTasks}
          activeTaskTitle={activeTaskTitle}
        />;
      case ViewState.SETTINGS:
        return <Settings
          stats={stats}
          profile={profile}
          updateProfile={setProfile}
          resetData={resetData}
        />;
      default:
        return <Dashboard
           stats={stats}
           tasks={tasks}
           dailyTip={dailyTip}
           profile={profile}
           onQuickTaskAdd={(t) => addTask(t)}
           onNavigateToTasks={() => setView(ViewState.TASKS)}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-dad-bg text-dad-text font-sans antialiased selection:bg-dad-primary selection:text-white">
      <div className="max-w-md mx-auto min-h-screen bg-dad-bg border-x border-gray-800 relative shadow-2xl">
        {renderView()}
      </div>
      <NavBar currentView={view} setView={setView} />
    </div>
  );
}

export default App;
