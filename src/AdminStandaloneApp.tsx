import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { AdminPanel } from './components/admin/AdminPanel';
import { useContentProtection } from './hooks/useContentProtection';

export const AdminStandaloneApp: React.FC = () => {
  const { isDevToolsOpen } = useContentProtection({ enableDevToolsDetection: true });

  return (
    <>
      <div className={isDevToolsOpen ? 'filter blur-lg pointer-events-none select-none transition-all duration-200' : ''}>
        <AdminPanel />
      </div>
      {isDevToolsOpen && (
        <div className="fixed inset-0 z-[9999] bg-[#0B0F17]/85 backdrop-blur-md flex items-center justify-center p-6 text-center select-none">
          <div className="max-w-md bg-[#131A26] border border-[#1E293B] rounded-3xl p-6 text-white shadow-2xl space-y-2">
            <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
            <h2 className="text-lg font-black font-display">Operations Console Protected</h2>
            <p className="text-xs text-gray-300 leading-relaxed">
              Developer tools are blocked while viewing student orders and inventory. Close DevTools to continue.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminStandaloneApp;
