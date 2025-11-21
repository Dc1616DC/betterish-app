import React from 'react';
import { ViewState } from '../types';

interface NavBarProps {
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const NavBar: React.FC<NavBarProps> = ({ currentView, setView }) => {
  const getButtonClass = (view: ViewState) => {
    const base = "flex flex-col items-center justify-center w-full h-full transition-colors duration-200";
    return currentView === view 
      ? `${base} text-dad-primary bg-dad-card/50 border-t-2 border-dad-primary` 
      : `${base} text-dad-muted hover:text-dad-text`;
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-16 bg-dad-card border-t border-gray-800 z-50">
      <div className="flex h-full max-w-md mx-auto justify-between">
        <button onClick={() => setView(ViewState.DASHBOARD)} className={getButtonClass(ViewState.DASHBOARD)}>
          <span className="text-xl">🏠</span>
          <span className="text-[10px] mt-1 uppercase font-bold tracking-wider">Home</span>
        </button>
        <button onClick={() => setView(ViewState.TASKS)} className={getButtonClass(ViewState.TASKS)}>
          <span className="text-xl">📋</span>
          <span className="text-[10px] mt-1 uppercase font-bold tracking-wider">Tasks</span>
        </button>
        <button onClick={() => setView(ViewState.CHAT)} className={getButtonClass(ViewState.CHAT)}>
          <span className="text-xl">🧔</span>
          <span className="text-[10px] mt-1 uppercase font-bold tracking-wider">Dad AI</span>
        </button>
        <button onClick={() => setView(ViewState.SETTINGS)} className={getButtonClass(ViewState.SETTINGS)}>
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] mt-1 uppercase font-bold tracking-wider">Profile</span>
        </button>
      </div>
    </div>
  );
};
export default NavBar;
