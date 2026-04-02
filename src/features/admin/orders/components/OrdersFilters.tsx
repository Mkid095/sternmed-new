/**
 * Orders Filters Component
 *
 * Search and filter controls for the orders page.
 * Includes text search and status dropdown filter.
 *
 * @module OrdersFilters
 */

import { Search } from 'lucide-react';
import { OrderStatusFilter } from '../hooks';

/**
 * Props for OrdersFilters component
 */
export interface OrdersFiltersProps {
  /** Current search query */
  search: string;

  /** Current status filter */
  statusFilter: OrderStatusFilter;

  /** Callback when search changes */
  onSearchChange: (search: string) => void;

  /** Callback when status filter changes */
  onStatusFilterChange: (filter: OrderStatusFilter) => void;
}

/**
 * Orders filters component
 *
 * Provides:
 * - Text input for searching by name, email, or order ID
 * - Dropdown for filtering by order status
 *
 * Responsive layout:
 * - Mobile: Stacked vertically
 * - Desktop: Side-by-side with search taking available space
 *
 * @example
 * <OrdersFilters
 *   search={search}
 *   statusFilter={statusFilter}
 *   onSearchChange={setSearch}
 *   onStatusFilterChange={setStatusFilter}
 * />
 */
export function OrdersFilters({
  search,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
}: OrdersFiltersProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col sm:flex-row gap-3">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={18}
        />
        <input
          type="text"
          placeholder="Search by name, email, or order ID..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          aria-label="Search orders"
        />
      </div>

      {/* Status Filter Dropdown */}
      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange(e.target.value as OrderStatusFilter)}
        className="px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
        aria-label="Filter by status"
      >
        <option value="all">All Statuses</option>
        <option value="pending">Pending</option>
        <option value="processing">Processing</option>
        <option value="shipped">Shipped</option>
        <option value="delivered">Delivered</option>
        <option value="cancelled">Cancelled</option>
      </select>
    </div>
  );
}
