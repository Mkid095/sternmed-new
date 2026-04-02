import { Product } from '../../../types';
import { useNavigate } from 'react-router-dom';
import { ProductCard } from '../../shared/ui';

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product) => void;
  emptyMessage?: string;
}

export function ProductGrid({ products, onAddToCart, emptyMessage = 'No products found' }: ProductGridProps) {
  const navigate = useNavigate();
  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-white rounded-lg border border-slate-200">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-slate-900 font-medium">No products found</p>
            <p className="text-slate-500 text-sm mt-1">{emptyMessage}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          onClick={() => navigate(`/product/${product.id}`)}
          showStock={false}
        />
      ))}
    </div>
  );
}
