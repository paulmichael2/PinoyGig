import React, { useEffect } from 'react';
import { Bell, X } from 'lucide-react';

const NotificationToast = ({ notification, onClose }) => {
  const title = notification?.type === 'message' ? 'New Message' : 'New Notification';

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!notification) return null;

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className="bg-white border-l-4 border-green-500 shadow-xl rounded-lg p-4 w-80 flex gap-3 items-start relative">
        <div className="bg-green-100 p-2 rounded-full text-green-600">
          <Bell className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm">{title}</h4>
          <p className="text-slate-600 text-xs mt-1 leading-relaxed">
            {notification.message}
          </p>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default NotificationToast;