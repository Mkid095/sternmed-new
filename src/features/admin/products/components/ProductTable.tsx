import { Product, Category } from '../../../../types';
import { Edit2, Trash2, Star } from 'lucide-react';

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  searchQuery: string;
  onSearchChange: (search: string) => void;
  onToggleFeatured: (id: string, currentStatus: boolean) => void;
  onDelete: (id: string) => void;
  onEdit: (product: Product) => void;
}

export function ProductTable({ products, categories, searchQuery, onSearchChange, onToggleFeatured, onDelete, onEdit }: ProductTableProps) {
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
        <div className="text-sm text-slate-500">{filteredProducts.length} products</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <th className="px-6 py-3 font-medium">Product</th>
              <th className="px-6 py-3 font-medium">Category</th>
              <th className="px-6 py-3 font-medium">Price</th>
              <th className="px-6 py-3 font-medium">Stock</th>
              <th className="px-6 py-3 font-medium text-center">Featured</th>
              <th className="px-6 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {filteredProducts.map((product) => (
              <tr key={product.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-md overflow-hidden bg-slate-100 flex-shrink-0">
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div>
                      <div className="font-medium text-slate-900 text-sm">{product.name}</div>
                      <div className="text-xs text-slate-500 truncate w-48">{product.description}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  {categories.find((c) => c.id === product.categoryId)?.name || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-sm font-medium text-slate-900">
                  Ksh{product.price.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium Ksh{
                      product.stock > 20 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {product.stock} in stock
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onToggleFeatured(product.id, product.isFeatured)}
                    className={`p-1.5 rounded-md transition-colors Ksh{
                      product.isFeatured ? 'text-yellow-500 hover:bg-yellow-50' : 'text-slate-300 hover:text-yellow-500 hover:bg-slate-50'
                    }`}
                    title={product.isFeatured ? 'Remove from Home Page' : 'Show on Home Page'}
                  >
                    <Star size={18} fill={product.isFeatured ? 'currentColor' : 'none'} />
                  </button>
                </td>
                <td className="px-6 py-4 text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => onEdit(product)}
                      className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                      title="Edit"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => onDelete(product.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                  No products found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
