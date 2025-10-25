import React from 'react';
import { User } from '../types';
import { StethoscopeIcon, BellIcon, BellSlashIcon } from './Icons';

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
  { code: 'ta', name: 'தமிழ்' }, // Tamil
  { code: 'hi', name: 'हिन्दी' }, // Hindi
  { code: 'te', name: 'తెలుగు' }, // Telugu
  { code: 'ml', name: 'മലയാളം' }, // Malayalam
];

const Header: React.FC<HeaderProps> = ({ user, onLogout, language, onLanguageChange, notificationPermission, onRequestNotificationPermission }) => {
  const getNotificationButton = () => {
    let title = '';
    let icon = null;
    let iconColor = '';
    
    switch(notificationPermission) {
        case 'granted':
            title = 'Desktop notifications are enabled.';
            icon = <BellIcon className="h-5 w-5" />;
            iconColor = 'text-green-600';
            break;
        case 'denied':
            title = 'Notifications blocked. Click to see how to enable.';
            icon = <BellSlashIcon className="h-5 w-5" />;
            iconColor = 'text-red-600';
            break;
        default: // 'default'
            title = 'Click to enable desktop notifications.';
            icon = <BellIcon className="h-5 w-5" />;
            iconColor = 'text-gray-500';
    }

    return (
        <button
            onClick={onRequestNotificationPermission}
            title={title}
            className={`p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${iconColor}`}
        >
            {icon}
        </button>
    );
  };

  return (
    <header className="bg-white/80 backdrop-blur-sm shadow-sm sticky top-0 z-10 border-b border-slate-200">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <StethoscopeIcon className="h-8 w-8 text-indigo-600" />
            <h1 className="ml-3 text-2xl font-bold text-gray-800">MediFlow AI</h1>
          </div>
          <div className="flex items-center space-x-4">
            {user.role === 'Patient' && (
              <div>
                <select
                  value={language}
                  onChange={(e) => onLanguageChange(e.target.value)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2"
                  aria-label="Select language"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>{lang.name}</option>
                  ))}
                </select>
              </div>
            )}
            {getNotificationButton()}
            <div className="text-right">
              <p className="font-semibold text-gray-700">{user.name}</p>
              <p className="text-sm text-gray-500">{user.specialty ? `${user.role} - ${user.specialty}`: user.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
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