import { User } from '../../types';
import { LogOut } from 'lucide-react';

interface AdminUserMenuProps {
  user: User;
  onLogout: () => void;
}

export function AdminUserMenu({ user, onLogout }: AdminUserMenuProps) {
  return (
    <div className="p-3 border-t border-slate-800">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0">
          {user.name.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-white truncate">{user.name}</p>
          <p className="text-xs text-slate-400 capitalize">{user.role}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-md transition-colors"
      >
        <LogOut size={16} /> <span>Logout</span>
      </button>
    </div>
  );
}
