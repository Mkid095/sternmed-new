import { Package, Mail, Users, DollarSign } from 'lucide-react';
import { StatCard } from '../../../shared/ui';

interface StatsGridProps {
  stats: {
    products: number;
    emails: number;
    users: number;
  };
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Total Products"
        value={stats.products}
        icon={<Package size={24} />}
        color="blue"
      />
      <StatCard
        title="Unread Emails"
        value={stats.emails}
        icon={<Mail size={24} />}
        color="red"
      />
      <StatCard
        title="Active Users"
        value={stats.users}
        icon={<Users size={24} />}
        color="emerald"
      />
      <StatCard
        title="Revenue (Demo)"
        value="$0.00"
        icon={<DollarSign size={24} />}
        color="purple"
      />
    </div>
  );
}
