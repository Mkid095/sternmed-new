/**
 * Admin Orders Page
 *
 * Main order management interface for administrators.
 * Features include:
 * - Order statistics dashboard
 * - Search and filter orders
 * - View order details
 * - Update order status
 *
 * @module AdminOrders
 */

import { OrdersTable } from './components/OrdersTable';
import { OrderDetail } from './components/OrderDetail';
import { OrderStatsGrid } from './components/OrderStatsGrid';
import { OrdersFilters } from './components/OrdersFilters';
import { useOrdersManager } from './hooks';
import { Order } from '../../../types';

/**
 * Admin Orders Page Component
 *
 * Provides comprehensive order management:
 * - Statistics overview with status breakdown
 * - Search by customer name, email, or order ID
 * - Filter by order status
 * - View detailed order information
 * - Update order status
 *
 * @example
 * <Route path="/admin/orders" element={<AdminOrders />} />
 */
export default function AdminOrders() {
  // ============ State Management ============

  const {
    filteredOrders,
    selectedOrder,
    loading,
    search,
    statusFilter,
    stats,
    setSearch,
    setStatusFilter,
    setSelectedOrder,
    handleStatusUpdate,
  } = useOrdersManager();

  // ============ Render ============

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-500">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <OrdersPageHeader />

      {/* Statistics Grid */}
      <OrderStatsGrid stats={stats} />

      {/* Search and Filters */}
      <OrdersFilters
        search={search}
        statusFilter={statusFilter}
        onSearchChange={setSearch}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Orders Content */}
      <OrdersContent
        selectedOrder={selectedOrder}
        filteredOrders={filteredOrders}
        onSelectOrder={setSelectedOrder}
        onCloseDetail={() => setSelectedOrder(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  );
}

/**
 * Orders page header
 */
function OrdersPageHeader() {
  return (
    <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
      Manage Orders
    </h2>
  );
}

/**
 * Orders content area
 * Displays either order detail or orders table based on selection
 */
interface OrdersContentProps {
  selectedOrder: Order | null;
  filteredOrders: Order[];
  onSelectOrder: (order: Order) => void;
  onCloseDetail: () => void;
  onStatusUpdate: (orderId: string, status: string) => Promise<void>;
}

function OrdersContent({
  selectedOrder,
  filteredOrders,
  onSelectOrder,
  onCloseDetail,
  onStatusUpdate,
}: OrdersContentProps) {
  return (
    <>
      {selectedOrder ? (
        <OrderDetail
          order={selectedOrder}
          onClose={onCloseDetail}
          onStatusUpdate={onStatusUpdate}
        />
      ) : (
        <OrdersTable
          orders={filteredOrders}
          onSelectOrder={onSelectOrder}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </>
  );
}
