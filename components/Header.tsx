
import React from 'react';
import { User } from '../types.ts';
import { StethoscopeIcon, BellIcon, BellSlashIcon } from './Icons.tsx';
import { SoundControl } from './SoundControl.tsx';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  language: string;
  onLanguageChange: (lang: string) => void;
  notificationPermission: NotificationPermission;
  onRequestNotificationPermission: () => void;
}

const languages = [
  { code: 'en', name: 'English' },
  { code: 'ta', name: 'தமிழ்' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'te', name: 'తెలుగు' },
  { code: 'ml', name: 'മലയാളം' },
];

const Header: React.FC<HeaderProps> = ({ user, onLogout, language, onLanguageChange, notificationPermission, onRequestNotificationPermission }) => {
  return (
    <header className="sticky top-0 z-50 px-4 py-3">
      <div className="container mx-auto glass-panel rounded-2xl px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-xl bg-indigo-600 text-white ai-pulse">
            <StethoscopeIcon className="h-6 w-6" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">MediFlow <span className="text-indigo-600">AI</span></h1>
            <p className="text-[10px] uppercase font-bold text-indigo-500 tracking-widest leading-none">System Active</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          {user.role === 'Patient' && (
            <select
              value={language}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="bg-transparent text-sm font-semibold text-gray-700 focus:outline-none cursor-pointer"
            >
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>{lang.name}</option>
              ))}
            </select>
          )}

          <SoundControl variant="compact" />

          <button onClick={onRequestNotificationPermission} className="text-gray-500 hover:text-indigo-600 transition-colors relative">
            {notificationPermission === 'granted' ? <BellIcon className="h-5 w-5" /> : <BellSlashIcon className="h-5 w-5" />}
            {notificationPermission === 'default' && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>}
          </button>

          <div className="flex items-center gap-3 pl-6 border-l border-gray-200">
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800 leading-none">{user.name}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">{user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
