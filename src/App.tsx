import { useState, useEffect } from 'react';
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
  const stats = statsArray[0] || { id: 'stats-' + userId, streak: 1, tasksCompleted: 0, lastActive: Date.now(), level: 'Rookie Dad' };
  const profile = profileArray[0] || { id: 'profile-' + userId, name: '', kidName: '', kidStage: KID_STAGES[1] };
  const dailyTip = dailyTipsArray[0] || null;

  // Initialize data on first load
  useEffect(() => {
    if (!isLoading && tasks.length === 0) {
      // Add initial tasks
      INITIAL_TASKS.forEach(task => {
        db.transact(db.tx.tasks[task.id].update(task));
      });
    }

    if (!isLoading && statsArray.length === 0) {
      // Initialize stats
      db.transact(db.tx.userStats[stats.id].update(stats));
    }

    if (!isLoading && profileArray.length === 0) {
      // Initialize profile
      db.transact(db.tx.userProfile[profile.id].update(profile));
    }
  }, [isLoading]);

  // Daily Tip Logic
  useEffect(() => {
    const checkDailyTip = async () => {
      const today = new Date().toISOString().split('T')[0];
      if (!dailyTip || dailyTip.date !== today) {
        const tipText = await generateDailyTip(profile);
        const newTip = {
          id: 'tip-' + today,
          date: today,
          text: tipText,
          category: 'development' as const,
          userId
        };
        db.transact(db.tx.dailyTips[newTip.id].update(newTip));
      }
    };
    if (!isLoading) checkDailyTip();
  }, [profile.kidStage, dailyTip, isLoading]);

  // Task Logic
  const addTask = (title: string, category: 'quick' | 'project' | 'survival' = 'quick') => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: Date.now(),
      category
    };
    db.transact(db.tx.tasks[newTask.id].update(newTask));
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
      // Update stats
      const newStats = {
        ...stats,
        tasksCompleted: task.completed ? Math.max(0, stats.tasksCompleted - 1) : stats.tasksCompleted + 1
      };
      db.transact(db.tx.userStats[stats.id].update(newStats));

      // Update task
      db.transact(db.tx.tasks[id].update({ completed: !task.completed }));
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
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) return;

    const subtasks: Task[] = titles.map((title, idx) => ({
      id: `${parentId}_sub_${idx}_${Date.now()}`,
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
    </div>
  );
}

export default App;
