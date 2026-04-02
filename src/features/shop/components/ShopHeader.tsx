import { Category } from '../../../types';

interface ShopHeaderProps {
  categories: Category[];
  selectedCategory: string | null;
  productCount: number;
}

export function ShopHeader({ categories, selectedCategory, productCount }: ShopHeaderProps) {
  const categoryName = selectedCategory
    ? categories.find((c) => c.id === selectedCategory)?.name || 'Products'
    : 'All Products';

  return (
    <div className="mb-6 flex justify-between items-center border-b border-slate-200 pb-4">
      <h1 className="text-2xl font-bold text-slate-900">{categoryName}</h1>
      <span className="text-sm text-slate-500">{productCount} items</span>
    </div>
  );
}
