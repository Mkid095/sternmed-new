import { Order, OrderStatus } from '../../../../types';
import { Eye, Phone } from 'lucide-react';

interface OrdersTableProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onStatusUpdate: (orderId: string, status: string) => void;
}

const statusColors: Record<OrderStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
};

export function OrdersTable({ orders, onSelectOrder, onStatusUpdate }: OrdersTableProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="text-xs sm:text-sm text-slate-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</div>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-4 py-3 font-medium">Order ID</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Phone</th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Items</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Payment</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {orders.map((order) => (
              <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  <span className="font-mono">{order.id.slice(0, 8)}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="text-sm font-medium text-slate-900">{order.customerName}</div>
                  <div className="text-xs text-slate-500 truncate max-w-[150px]">{order.customerEmail}</div>
                </td>
                <td className="px-4 py-3">
                  {order.customerPhone ? (
                    <a
                      href={`tel:${order.customerPhone}`}
                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      <Phone size={12} />
                      {order.customerPhone}
                    </a>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600 whitespace-nowrap">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-slate-900">
                  Ksh {order.total.toFixed(2)}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={order.status}
                    onChange={(e) => onStatusUpdate(order.id, e.target.value)}
                    className={`text-xs font-semibold px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[order.status]}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      order.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : order.paymentStatus === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onSelectOrder(order)}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                    title="View details"
                  >
                    <Eye size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-200">
        {orders.map((order) => (
          <div key={order.id} className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-slate-500">Order ID</p>
                <p className="text-sm font-mono font-medium text-slate-900">{order.id.slice(0, 8)}</p>
              </div>
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColors[order.status]}`}>
                {order.status}
              </span>
            </div>

            <div>
              <p className="text-xs text-slate-500">Customer</p>
              <p className="text-sm font-medium text-slate-900">{order.customerName}</p>
              <p className="text-xs text-slate-500">{order.customerEmail}</p>
              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                >
                  <Phone size={12} />
                  {order.customerPhone}
                </a>
              )}
            </div>

            <div className="flex justify-between">
              <div>
                <p className="text-xs text-slate-500">Date</p>
                <p className="text-xs text-slate-600">{formatDate(order.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500">Total</p>
                <p className="text-sm font-bold text-slate-900">Ksh {order.total.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">{order.items?.length || 0} item{order.items?.length !== 1 ? 's' : ''}</span>
              <button
                onClick={() => onSelectOrder(order)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <Eye size={14} />
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No orders found.
        </div>
      )}
    </div>
  );
}
