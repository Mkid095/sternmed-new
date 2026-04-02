import { AlertTriangle, Package } from 'lucide-react';
import { Product } from '../../../../types';

interface LowStockAlertProps {
  products: Product[];
  threshold?: number;
}

export function LowStockAlert({ products, threshold = 20 }: LowStockAlertProps) {
  const lowStockProducts = products.filter((p) => p.stock < threshold);

  if (lowStockProducts.length === 0) {
    return null;
  }

  return (
    <div className="mb-4 sm:mb-6 bg-amber-50 border border-amber-200 rounded-lg p-3 sm:p-4">
      <div className="flex items-start gap-2 sm:gap-3">
        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5 sm:w-5 sm:h-5" size={18} />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm sm:text-base font-semibold text-amber-900">Low Stock Alert</h3>
          <p className="text-xs sm:text-sm text-amber-700 mt-1">
            {lowStockProducts.length} product{lowStockProducts.length > 1 ? 's' : ''} running low on stock
          </p>
          <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {lowStockProducts.slice(0, 6).map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-2 bg-white p-2 rounded-md border border-amber-100"
              >
                <Package size={14} className="text-amber-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-slate-900 truncate">{product.name}</p>
                  <p className="text-xs text-amber-600">{product.stock} left</p>
                </div>
              </div>
            ))}
          </div>
          {lowStockProducts.length > 6 && (
            <p className="text-xs text-amber-600 mt-2">
              +{lowStockProducts.length - 6} more products
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
