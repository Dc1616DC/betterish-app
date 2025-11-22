import React, { useState, useEffect, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ChatMessage } from '../types';
import { createDadChat, sendMessageToDadAI } from '../services/geminiService';
import { Chat } from "@google/genai";

interface ChatInterfaceProps {
  messages: ChatMessage[];
  addMessage: (msg: ChatMessage) => void;
  initialInput?: string;
  onClearInitialInput?: () => void;
  onConvertToTasks: (text: string) => Promise<number>;
  activeTaskTitle?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, addMessage, initialInput, onClearInitialInput, onConvertToTasks, activeTaskTitle }) => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [convertedIds, setConvertedIds] = useState<Set<string>>(new Set());
  const chatSessionRef = useRef<Chat | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (!chatSessionRef.current) chatSessionRef.current = createDadChat(); }, []);
  useEffect(() => { if (initialInput) { setInput(initialInput); if (onClearInitialInput) onClearInitialInput(); } }, [initialInput, onClearInitialInput]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !chatSessionRef.current) return;
    const userText = input;
    setInput('');
    setLoading(true);
    addMessage({ id: uuidv4(), role: 'user', text: userText, timestamp: Date.now() });
    const aiResponse = await sendMessageToDadAI(chatSessionRef.current, userText);
    addMessage({ id: uuidv4(), role: 'model', text: aiResponse, timestamp: Date.now() });
    setLoading(false);
  };

  const handleConvert = async (msgId: string, text: string) => {
    if (convertingId || convertedIds.has(msgId)) return;
    setConvertingId(msgId);
    const count = await onConvertToTasks(text);
    if (count > 0) setConvertedIds(prev => new Set(prev).add(msgId));
    setConvertingId(null);
  };

  return (
    <div className="flex flex-col h-full pb-20">
      <div className="p-4 border-b border-gray-800 bg-dad-card flex items-center gap-3">
          <div className="w-10 h-10 bg-dad-primary rounded-full flex items-center justify-center text-xl shadow-lg">🧔</div>
          <div>
            <h2 className="font-bold">Dad AI</h2>
            <p className="text-xs text-green-400">Online (Hiding in garage)</p>
            {activeTaskTitle && <p className="text-[10px] text-dad-muted mt-0.5">Focus: {activeTaskTitle}</p>}
          </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
             <div className={`max-w-[85%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-dad-primary text-white rounded-tr-none' : 'bg-dad-card text-gray-200 rounded-tl-none border border-gray-700'}`}>
               <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
             </div>
             {msg.role === 'model' && (
               <button onClick={() => handleConvert(msg.id, msg.text)} disabled={convertingId === msg.id || convertedIds.has(msg.id)} className={`mt-2 text-xs flex items-center gap-1 px-3 py-1.5 rounded-full border ${convertedIds.has(msg.id) ? 'bg-green-900/30 text-green-400 border-green-800' : 'bg-gray-800 text-dad-muted border-gray-700'}`}>
                 {convertingId === msg.id ? "Extracting..." : convertedIds.has(msg.id) ? "✓ Added" : activeTaskTitle ? `+ Add to "${activeTaskTitle}"` : "+ Create Tasks"}
               </button>
             )}
          </div>
        ))}
        {loading && <div className="text-gray-500 text-xs p-4">Thinking...</div>}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="p-3 bg-dad-bg border-t border-gray-800 relative">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask for help..." className="w-full bg-dad-card text-white pl-4 pr-12 py-3 rounded-full border border-gray-700 focus:border-dad-primary focus:outline-none" />
        <button type="submit" disabled={!input.trim() || loading} className="absolute right-5 top-5 bg-dad-primary text-white rounded-full w-8 h-8 flex items-center justify-center">↑</button>
      </form>
    </div>
  );
};
export default ChatInterface;