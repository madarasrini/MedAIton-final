import React from 'react';
import { BellIcon, LockIcon } from './Icons';

interface NotificationHelpModalProps {
  onClose: () => void;
}

const NotificationHelpModal: React.FC<NotificationHelpModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg space-y-6 transform transition-all">
        <div className="text-center">
          <BellIcon className="h-10 w-10 text-indigo-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900">Enable Desktop Notifications</h3>
          <p className="text-gray-600 mt-2">
            To receive important medication reminders, please allow notifications in your browser's site settings.
          </p>
        </div>
        
        <div className="space-y-4 text-left p-4 bg-slate-50 rounded-lg border">
            <h4 className="font-semibold text-gray-800">Follow these simple steps:</h4>
            <ol className="list-decimal list-inside space-y-3 text-gray-700">
                <li>
                    Click the <LockIcon className="inline-block h-4 w-4 align-text-bottom text-gray-600" /> icon in the address bar, next to the website URL.
                </li>
                <li>
                    In the menu that appears, find the setting for <strong>Notifications</strong>.
                </li>
                <li>
                    Change the permission from "Blocked" to "<strong>Allow</strong>".
                </li>
                <li>
                    You may need to reload the page for the changes to take effect.
                </li>
            </ol>
        </div>

        <div className="flex justify-center">
          <button 
            onClick={onClose} 
            className="w-full sm:w-auto px-8 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationHelpModal;
