import React, { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 z-50 flex items-center gap-2.5 rounded-xl border border-amber-500/40 bg-amber-950/90 backdrop-blur-md px-3.5 py-2 text-xs font-medium text-amber-200 shadow-xl shadow-amber-950/50 animate-bounce">
      <WifiOff className="w-4 h-4 text-amber-400" />
      <span>Offline Mode — Saved chats remain accessible. AI generation requires reconnecting.</span>
    </div>
  );
};
