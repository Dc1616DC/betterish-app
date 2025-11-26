import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ViewState, Task, ChatMessage, UserProfile } from './types';
import { INITIAL_TASKS, KID_STAGES } from './constants';
import { generateDailyTip, extractActionsFromChat } from './services/geminiService';
import { db } from './instant.config';
import Auth from './components/Auth';
import NavBar from './components/NavBar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import ChatInterface from './components/Chat';
import Settings from './components/Settings';
import AgentPriorityModal from './components/AgentPriorityModal';
import { analyzePriorities } from './services/geminiService';
import { TaskAnalysis } from './types';

function App() {
  // Check auth state
  const { isLoading, user, error } = db.useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dad-bg flex items-center justify-center">
        <div className="text-dad-primary text-xl">Loading...</div>
      </div>
    );
  }

  if (error || !user) {
    return <Auth />;
  }

  return <AuthenticatedApp userId={user.id} />;
}

function AuthenticatedApp({ userId }: { userId: string }) {
  const [view, setView] = useState<ViewState>(ViewState.DASHBOARD);
  const [chatDraft, setChatDraft] = useState<string>('');
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  
  // Agent Modal State
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [agentAnalysis, setAgentAnalysis] = useState<TaskAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Query all data from InstantDB
  const { data, isLoading, error } = db.useQuery({
    tasks: {},
    chatMessages: {},
    userStats: {},
    userProfile: {},
    dailyTips: {},
  });

  // Extract data with defaults
  const tasks = (data?.tasks || []) as Task[];
  const chatHistory = (data?.chatMessages || []) as ChatMessage[];
  const statsArray = (data?.userStats || []) as any[];
  const profileArray = (data?.userProfile || []) as any[];
  const dailyTipsArray = (data?.dailyTips || []) as any[];

  // Get single records (first match for this user)
  const stats = statsArray[0] || { id: uuidv4(), streak: 1, tasksCompleted: 0, lastActive: Date.now(), level: 'Rookie Dad' };
  const profile = profileArray[0] || { id: uuidv4(), name: '', kidName: '', kidStage: KID_STAGES[1] };
  const dailyTip = dailyTipsArray[0] || null;

  // Initialize data on first load
  useEffect(() => {
    if (!isLoading && !initialized) {
      if (tasks.length === 0) {
        // Add initial tasks with proper UUIDs
        INITIAL_TASKS.forEach(task => {
          const taskWithUuid = { ...task, id: uuidv4() };
          db.transact(db.tx.tasks[taskWithUuid.id].update(taskWithUuid));
        });
      }

      if (statsArray.length === 0) {
        // Initialize stats
        db.transact(db.tx.userStats[stats.id].update(stats));
      }

      if (profileArray.length === 0) {
        // Initialize profile
        db.transact(db.tx.userProfile[profile.id].update(profile));
      }

      setInitialized(true);
    }
    
    // Auto-cleanup: Delete tasks completed > 24 hours ago
    if (!isLoading && tasks.length > 0) {
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const tasksToDelete = tasks.filter(t => t.completed && t.completedAt && t.completedAt < oneDayAgo);
      
      if (tasksToDelete.length > 0) {
        console.log(`Cleaning up ${tasksToDelete.length} old completed tasks`);
        tasksToDelete.forEach(t => db.transact(db.tx.tasks[t.id].delete()));
      }
    }
  }, [isLoading, initialized, tasks.length, statsArray.length, profileArray.length, stats.id, profile.id]);

  // Daily Tip Logic
  useEffect(() => {
    const checkDailyTip = async () => {
      const today = new Date().toISOString().split('T')[0];
      if (!dailyTip || dailyTip.date !== today) {
        const tipText = await generateDailyTip(profile);
        const newTip = {
          id: uuidv4(),
          date: today,
          text: tipText,
          category: 'development' as const,
          userId
        };
        db.transact(db.tx.dailyTips[newTip.id].update(newTip));
      }
    };
    if (!isLoading && dailyTipsArray.length === 0) {
      // Only run if no tips exist yet
      checkDailyTip();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, userId]);

  // Task Logic
  const addTask = (title: string, category: 'quick' | 'project' | 'survival' = 'quick') => {
    const newTask: Task = {
      id: uuidv4(),
      title,
      completed: false,
      createdAt: Date.now(),
      category
    };
    console.log('Adding task:', newTask);
    db.transact(db.tx.tasks[newTask.id].update(newTask))
      .then(() => console.log('Task added successfully'))
      .catch((error) => console.error('Error adding task:', error));
    return newTask.id;
  };

  const addProject = (title: string, subtasks: string[]) => {
    const parentId = addTask(title, 'project');
    addSubTasks(parentId, subtasks);
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    const isSubtask = !task;

    if (task && !isSubtask) {
      const isNowCompleted = !task.completed;
      // Update stats
      const newStats = {
        ...stats,
        tasksCompleted: isNowCompleted ? stats.tasksCompleted + 1 : Math.max(0, stats.tasksCompleted - 1)
      };
      db.transact(db.tx.userStats[stats.id].update(newStats));

      // Update task
      db.transact(db.tx.tasks[id].update({ 
        completed: isNowCompleted,
        completedAt: isNowCompleted ? Date.now() : undefined
      }));
    } else {
      // Handle subtask
      const parentTask = tasks.find((t: Task) => t.subtasks?.some((st: Task) => st.id === id));
      if (parentTask && parentTask.subtasks) {
        const updatedSubtasks = parentTask.subtasks.map((st: Task) =>
          st.id === id ? { ...st, completed: !st.completed } : st
        );
        db.transact(db.tx.tasks[parentTask.id].update({ subtasks: updatedSubtasks }));
      }
    }
  };

  const deleteTask = (id: string) => {
    db.transact(db.tx.tasks[id].delete());
  };

  const addSubTasks = (parentId: string, titles: string[]) => {
    const parentTask = tasks.find((t: Task) => t.id === parentId);
    if (!parentTask) return;

    const subtasks: Task[] = titles.map((title) => ({
      id: uuidv4(),
      title,
      completed: false,
      createdAt: Date.now(),
      category: 'quick'
    }));

    db.transact(
      db.tx.tasks[parentId].update({
        isBrokenDown: true,
        isExpanded: true,
        subtasks: [...(parentTask.subtasks || []), ...subtasks]
      })
    );
  };

  const toggleTaskExpansion = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      db.transact(db.tx.tasks[id].update({ isExpanded: !task.isExpanded }));
    }
  };

  const handleAskAI = (taskTitle: string, taskId?: string) => {
    setChatDraft(`I'm stuck on this task: "${taskTitle}". Any tips?`);
    setActiveTaskId(taskId || null);
    setView(ViewState.CHAT);
  };

  const handleConvertChatToTasks = async (text: string): Promise<number> => {
    const extractedData = await extractActionsFromChat(text);
    if (!extractedData || extractedData.subtasks.length === 0) return 0;

    if (activeTaskId) {
      addSubTasks(activeTaskId, extractedData.subtasks);
    } else {
      addProject(extractedData.mainTask || "New Project", extractedData.subtasks);
    }
    return extractedData.subtasks.length;
  };

  const addMessage = (msg: ChatMessage) => {
    db.transact(db.tx.chatMessages[msg.id].update(msg));
  };

  const updateProfile = (newProfile: UserProfile) => {
    db.transact(db.tx.userProfile[profile.id].update(newProfile));
  };

  const resetData = async () => {
    // Delete all user data
    tasks.forEach((task: Task) => db.transact(db.tx.tasks[task.id].delete()));
    chatHistory.forEach((msg: ChatMessage) => db.transact(db.tx.chatMessages[msg.id].delete()));
    if (dailyTip) db.transact(db.tx.dailyTips[dailyTip.id].delete());

    // Reset stats
    db.transact(db.tx.userStats[stats.id].update({
      streak: 1,
      tasksCompleted: 0,
      lastActive: Date.now(),
      level: 'Rookie Dad'
    }));
  };

  const activeTaskTitle = activeTaskId ? tasks.find(t => t.id === activeTaskId)?.title : undefined;

  const handleAgentReview = async () => {
    setIsAgentModalOpen(true);
    setIsAnalyzing(true);
    const activeTasks = tasks.filter(t => !t.completed);
    const analysis = await analyzePriorities(activeTasks);
    setAgentAnalysis(analysis);
    setIsAnalyzing(false);
  };

  const handleApplyPriorities = (priorityIds: string[], staleIdsToDelete: string[]) => {
    // 1. Handle Priorities: Move them to top (we can't reorder easily in this DB setup without a 'order' field, 
    // so for now we will tag them as 'survival' which is our de-facto high priority)
    priorityIds.forEach(id => {
      db.transact(db.tx.tasks[id].update({ category: 'survival' }));
    });

    // 2. Handle Stale: Delete or move to a "Someday" list (for now, we'll just delete as per modal text "Hide/Someday")
    // Ideally we would add a 'status' field like 'backlog', but let's just remove them to declutter for MVP
    staleIdsToDelete.forEach(id => {
      db.transact(db.tx.tasks[id].delete());
    });
  };

  const renderView = () => {
    switch (view) {
      case ViewState.DASHBOARD:
        return (
          <Dashboard
            stats={stats}
            tasks={tasks}
            dailyTip={dailyTip}
            profile={profile}
            onQuickTaskAdd={(t) => addTask(t, 'quick')}
            onNavigateToTasks={() => setView(ViewState.TASKS)}
            onAgentReview={handleAgentReview}
          />
        );
      case ViewState.TASKS:
        return (
          <TaskList
            tasks={tasks}
            toggleTask={toggleTask}
            addTask={addTask}
            deleteTask={deleteTask}
            addSubTasks={addSubTasks}
            toggleTaskExpansion={toggleTaskExpansion}
            onAskAI={handleAskAI}
            kidStage={profile.kidStage}
          />
        );
      case ViewState.CHAT:
        return (
          <ChatInterface
            messages={chatHistory}
            addMessage={addMessage}
            initialInput={chatDraft}
            onClearInitialInput={() => setChatDraft('')}
            onConvertToTasks={handleConvertChatToTasks}
            activeTaskTitle={activeTaskTitle}
          />
        );
      case ViewState.SETTINGS:
        return (
          <Settings
            stats={stats}
            profile={profile}
            updateProfile={updateProfile}
            resetData={resetData}
          />
        );
      default:
        return (
          <Dashboard
            stats={stats}
            tasks={tasks}
            dailyTip={dailyTip}
            profile={profile}
            onQuickTaskAdd={(t) => addTask(t)}
            onNavigateToTasks={() => setView(ViewState.TASKS)}
            onAgentReview={handleAgentReview}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dad-bg flex items-center justify-center">
        <div className="text-dad-primary text-xl">Loading your data...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-dad-bg flex items-center justify-center">
        <div className="text-red-400 text-xl">Error loading data: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dad-bg text-dad-text font-sans antialiased selection:bg-dad-primary selection:text-white">
      <div className="max-w-md mx-auto min-h-screen bg-dad-bg border-x border-gray-800 relative shadow-2xl">
        {renderView()}
      </div>
      <NavBar currentView={view} setView={setView} />
      
      <AgentPriorityModal 
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        tasks={tasks}
        analysis={agentAnalysis}
        isLoading={isAnalyzing}
        onApplyPriorities={handleApplyPriorities}
      />
    </div>
  );
}

export default App;
