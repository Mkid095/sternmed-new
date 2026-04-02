import { Clock } from 'lucide-react';

export function ActivityFeed() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Clock size={20} className="text-slate-400" />
        <h3 className="text-base sm:text-lg font-bold text-slate-900">Recent Activity</h3>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center py-8 sm:py-12 px-4 text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Clock size={28} className="text-slate-300" />
        </div>
        <p className="text-sm sm:text-base text-slate-500 font-medium mb-1">No recent activity</p>
        <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
          Activity from products, orders, and users will appear here.
        </p>
      </div>
    </div>
  );
}
