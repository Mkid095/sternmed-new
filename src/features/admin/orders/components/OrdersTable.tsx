/**
 * Orders table.
 *
 * Opening an order
 * ----------------
 * Clicking anywhere on a row opens it. There used to be an eye icon in the
 * Actions column, which meant hunting for a 16px target in the far corner of
 * every row — the row itself looked inert.
 *
 * Two implementations, because one of them alone is not enough:
 *
 * - The `<tr>` carries `onClick` for the mouse. A row is not focusable and
 *   giving it `role="button"` would destroy the table semantics a screen reader
 *   depends on, so this is pointer-only and deliberately so.
 * - The order-id cell holds a real `<button>`. That is what keyboard and
 *   screen-reader users get, and it is the accessible name for the action.
 *
 * Interactive children (the status select, the phone link) call
 * `stopPropagation`, so changing a status never opens the order.
 *
 * Status changes
 * --------------
 * The select is optimistic — it shows the new value immediately — but the save
 * is confirmed before the row is trusted, and a failure puts the old value back
 * and says so. The underlying update used to return "success" while writing
 * nothing at all; that is now handled server-side, and the caller surfaces the
 * error instead of swallowing it.
 *
 * @module OrdersTable
 */

import { useState } from 'react';
import { clsx } from 'clsx';
import { ChevronRight, Phone } from 'lucide-react';
import type { Order, OrderStatus } from '../../../../types';
import { PaymentStatusBadge } from './OrderStatusBadge';

interface OrdersTableProps {
  orders: Order[];
  onSelectOrder: (order: Order) => void;
  onStatusUpdate: (orderId: string, status: string) => Promise<void>;
}

/** Statuses the select offers, in the order an order moves through them. */
const STATUSES: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const formatDate = (dateString?: string) => {
  if (!dateString) return '—';
  return new Date(dateString).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/** Short order reference. A uuid prefix is enough to recognise, not to type. */
const shortId = (id: string) => id.slice(0, 8).toUpperCase();

export function OrdersTable({ orders, onSelectOrder, onStatusUpdate }: OrdersTableProps) {
  /** Order ids with a status save in flight, so only that row shows progress. */
  const [savingId, setSavingId] = useState<string | null>(null);
  /** Ids whose last save failed, and the value to restore. */
  const [revert, setRevert] = useState<Record<string, string>>({});

  const handleStatusChange = async (order: Order, next: string) => {
    setSavingId(order.id);
    try {
      await onStatusUpdate(order.id, next);
      // Only clear the revert marker once the server has confirmed.
      setRevert((prev) => {
        if (!(order.id in prev)) return prev;
        const { [order.id]: _removed, ...rest } = prev;
        return rest;
      });
    } catch {
      // Put the real status back. Leaving the failed value on screen is how an
      // admin ends up believing an order was dispatched when it was not.
      setRevert((prev) => ({ ...prev, [order.id]: order.status }));
    } finally {
      setSavingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white px-6 py-16 text-center">
        <p className="text-sm font-medium text-slate-700">No orders match</p>
        <p className="mt-1 text-sm text-slate-500">Try a different search or status filter.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      {/* ---------- Desktop ---------- */}
      <div className="hidden md:block">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <th scope="col" className="px-4 py-3 font-medium">Order</th>
              <th scope="col" className="px-4 py-3 font-medium">Customer</th>
              <th scope="col" className="px-4 py-3 font-medium">Placed</th>
              <th scope="col" className="px-4 py-3 font-medium">Items</th>
              <th scope="col" className="px-4 py-3 font-medium">Total</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Payment</th>
              <th scope="col" className="w-10 px-2 py-3">
                <span className="sr-only">Open</span>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {orders.map((order) => {
              const isSaving = savingId === order.id;
              const reverted = revert[order.id];
              const shownStatus = (reverted ?? order.status) as OrderStatus;

              return (
                <tr
                  key={order.id}
                  onClick={() => onSelectOrder(order)}
                  className="cursor-pointer transition-colors hover:bg-slate-50"
                >
                  <td className="px-4 py-3">
                    {/*
                      The keyboard/AT path. A whole-row hit area for the mouse
                      cannot be focusable without breaking the table semantics,
                      so this button carries it.
                    */}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); onSelectOrder(order); }}
                      className="rounded font-mono text-sm font-medium text-primary-700 transition-colors hover:text-primary-900 hover:underline"
                    >
                      {shortId(order.id)}
                      <span className="sr-only"> — open order</span>
                    </button>
                  </td>

                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-slate-900">{order.customerName}</div>
                    <a
                      href={`mailto:${order.customerEmail}`}
                      onClick={(e) => e.stopPropagation()}
                      className="block max-w-[220px] truncate text-xs text-slate-500 transition-colors hover:text-slate-900 hover:underline"
                    >
                      {order.customerEmail}
                    </a>
                    {order.customerPhone && (
                      <a
                        href={`tel:${order.customerPhone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5 inline-flex items-center gap-1 text-xs text-slate-500 transition-colors hover:text-slate-900"
                      >
                        <Phone size={11} aria-hidden="true" />
                        {order.customerPhone}
                      </a>
                    )}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    {formatDate(order.createdAt)}
                  </td>

                  <td className="px-4 py-3 text-sm text-slate-600">
                    {order.items?.length ?? 0}
                    <span className="sr-only"> items</span>
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                    Ksh {order.total.toFixed(2)}
                  </td>

                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <label className="sr-only" htmlFor={`status-${order.id}`}>
                      Status for order {shortId(order.id)}
                    </label>
                    <select
                      id={`status-${order.id}`}
                      value={shownStatus}
                      disabled={isSaving}
                      aria-busy={isSaving}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      className={clsx(
                        'w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-1.5 pl-2.5 pr-7 text-xs font-medium text-slate-800',
                        'transition-colors hover:border-slate-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/25',
                        'disabled:cursor-wait disabled:opacity-60',
                        reverted && 'border-red-300 bg-red-50 text-red-800',
                      )}
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                    {isSaving && <span className="sr-only">Saving…</span>}
                    {reverted && (
                      <span className="mt-1 block text-[11px] text-red-600">Not saved</span>
                    )}
                  </td>

                  <td className="px-4 py-3">
                    <PaymentStatusBadge status={order.paymentStatus} />
                  </td>

                  <td className="px-2 py-3 text-slate-300">
                    <ChevronRight size={16} aria-hidden="true" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ---------- Mobile ---------- */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {orders.map((order) => {
          const isSaving = savingId === order.id;
          const reverted = revert[order.id];
          const shownStatus = (reverted ?? order.status) as OrderStatus;

          return (
            <li key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() => onSelectOrder(order)}
                    className="rounded font-mono text-sm font-medium text-primary-700"
                  >
                    {shortId(order.id)}
                    <span className="sr-only"> — open order</span>
                  </button>
                  <p className="truncate text-sm font-medium text-slate-900">{order.customerName}</p>
                  <p className="truncate text-xs text-slate-500">{order.customerEmail}</p>
                </div>
                <ChevronRight size={16} aria-hidden="true" className="mt-1 flex-shrink-0 text-slate-300" />
              </div>

              <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                <div className="flex gap-1">
                  <dt>Placed</dt>
                  <dd className="text-slate-700">{formatDate(order.createdAt)}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Items</dt>
                  <dd className="text-slate-700">{order.items?.length ?? 0}</dd>
                </div>
                <div className="flex gap-1">
                  <dt>Total</dt>
                  <dd className="font-medium text-slate-900">Ksh {order.total.toFixed(2)}</dd>
                </div>
              </dl>

              <label className="sr-only" htmlFor={`status-m-${order.id}`}>
                Status for order {shortId(order.id)}
              </label>
              <select
                id={`status-m-${order.id}`}
                value={shownStatus}
                disabled={isSaving}
                aria-busy={isSaving}
                onChange={(e) => handleStatusChange(order, e.target.value)}
                className={clsx(
                  'mt-3 w-full cursor-pointer rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-7 text-sm text-slate-800',
                  'disabled:cursor-wait disabled:opacity-60',
                  reverted && 'border-red-300 bg-red-50 text-red-800',
                )}
              >
                {STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
              {reverted && <span className="mt-1 block text-[11px] text-red-600">Not saved</span>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}