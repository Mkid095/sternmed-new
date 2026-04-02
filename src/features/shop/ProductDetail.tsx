/**
 * Product Detail Page
 *
 * Full product information page with image gallery, details, and add to cart.
 *
 * @module ProductDetail
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ShoppingBag, Package, Truck, Shield } from 'lucide-react';
import { api } from '../../services/api';
import { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import { useToastSuccess, useToastError } from '../shared/ui';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);

  const addItem = useCartStore((state) => state.addItem);
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData] = await Promise.all([
          api.getProducts(),
        ]);
        // Filter out draft and archived products
        const visibleProducts = productsData.filter((p) => p.status !== 'draft' && p.status !== 'archived');
        setProducts(visibleProducts);

        const foundProduct = visibleProducts.find((p) => p.id === id);
        if (foundProduct) {
          setProduct(foundProduct);
        } else {
          navigate('/shop', { replace: true });
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, navigate]);

  // Get all images for this product (main image + gallery if available)
  const productImages = product?.images?.length
    ? product.images
    : product?.imageUrl
      ? [product.imageUrl]
      : [];

  const handleAddToCart = async () => {
    if (!product || product.stock === 0) return;

    setAddingToCart(true);
    try {
      // Add item multiple times based on quantity
      for (let i = 0; i < quantity; i++) {
        addItem(product);
      }
      showSuccess(`Added ${quantity} ${product.name} to cart`);
      setQuantity(1);
    } catch (error) {
      showError('Failed to add to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  // Get related products from same category
  const relatedProducts = product
    ? products.filter((p) => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4)
    : [];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-slate-900"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-500">Product not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-4">
      {/* Back Button */}
      <button
        onClick={() => navigate('/shop')}
        className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-6"
      >
        <ChevronLeft size={16} />
        Back to Shop
      </button>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-3">
            <img
              src={productImages[selectedImageIndex] || product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>

          {/* Thumbnail Gallery */}
          {productImages.length > 1 && (
            <div className="flex gap-2">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`w-20 h-20 rounded overflow-hidden border-2 transition-all ${
                    index === selectedImageIndex
                      ? 'border-slate-900'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-semibold text-slate-900 mb-2">{product.name}</h1>

          <p className="text-2xl font-bold text-slate-900 mb-4">
            Ksh {product.price.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>

          {/* Status Badge */}
          <div className="mb-4">
            {product.status === 'coming_soon' ? (
              <p className="text-sm text-blue-600 font-semibold">
                Coming Soon
              </p>
            ) : product.stock > 0 ? (
              <p className="text-sm text-green-600">
                {product.stock} in stock
              </p>
            ) : (
              <p className="text-sm text-red-600">
                Out of stock
              </p>
            )}
          </div>

          {/* Description */}
          <div className="mb-6">
            <h2 className="text-sm font-semibold text-slate-900 mb-2">Description</h2>
            <p className="text-sm text-slate-600 leading-relaxed">{product.description}</p>
          </div>

          {/* Features */}
          <div className="mb-6 space-y-2">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Truck size={16} className="text-slate-400" />
              Fast delivery nationwide
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Shield size={16} className="text-slate-400" />
              Quality guaranteed
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Package size={16} className="text-slate-400" />
              Secure packaging
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          {product.status === 'active' && product.stock > 0 && (
            <div className="flex items-center gap-3 mt-auto">
              <div className="flex items-center border border-slate-300 rounded">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  -
                </button>
                <span className="px-4 py-2 text-sm font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="px-3 py-2 text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={addingToCart}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded font-medium transition-colors"
              >
                <ShoppingBag size={18} />
                {addingToCart ? 'Adding...' : 'Add to Cart'}
              </button>
            </div>
          )}

          {product.status === 'coming_soon' && (
            <div className="mt-auto">
              <button
                disabled
                className="w-full py-3 bg-blue-100 text-blue-700 rounded font-medium cursor-not-allowed"
              >
                Coming Soon
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {relatedProducts.map((relatedProduct) => (
              <div
                key={relatedProduct.id}
                onClick={() => navigate(`/product/${relatedProduct.id}`)}
                className="cursor-pointer"
              >
                <div className="bg-white border border-slate-200 rounded overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-square bg-slate-100">
                    <img
                      src={relatedProduct.imageUrl}
                      alt={relatedProduct.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-slate-900 line-clamp-1">{relatedProduct.name}</h3>
                    <p className="text-sm font-semibold text-slate-900 mt-1">
                      Ksh {relatedProduct.price.toLocaleString('en-KE', { minimumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
