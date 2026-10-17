/**
 * Product Detail Page
 *
 * Full product information page with image gallery, details, and add to cart.
 *
 * @module ProductDetail
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ChevronRight, ShoppingBag, Package, Truck, Shield, MessageCircle } from 'lucide-react';
import { api } from '../../services/api';
import { resolveWhatsAppNumber } from '../../services/supabase/settings.service';
import { Product, SiteSettings } from '../../types';
import { generateWhatsAppLink } from '../../constants';
import { useCartStore } from '../../store/cartStore';
import { useToastSuccess, useToastError } from '../shared/ui';
import { ProductCard } from '../shared/ui';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const addItem = useCartStore((state) => state.addItem);
  const showSuccess = useToastSuccess();
  const showError = useToastError();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Categories come along because the breadcrumb needs the product's
        // category name; without it the only way back up the catalogue is
        // "Back to Shop", which drops the shopper at the top of 42 products.
        const [productsData, categories] = await Promise.all([
          api.getProducts(),
          api.getCategories().catch(() => []),
        ]);
        // Filter out draft, archived, and out-of-stock products
        const visibleProducts = productsData.filter((p) => p.status !== 'draft' && p.status !== 'archived' && p.status !== 'out_of_stock');
        setProducts(visibleProducts);

        const foundProduct = visibleProducts.find((p) => p.id === id);
        if (foundProduct) {
          setProduct(foundProduct);
          if (foundProduct.categoryId) {
            setCategoryName(
              categories.find((c) => c.id === foundProduct.categoryId)?.name ?? null,
            );
          }
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

  // Navigating between products reuses this component, so the image and
  // quantity must not carry over from the product just viewed.
  useEffect(() => {
    setSelectedImageIndex(0);
    setQuantity(1);
  }, [id]);

  // Fetch site settings for WhatsApp contact
  useEffect(() => {
    api.getSettings().then(setSettings).catch(console.error);
  }, []);

  /**
   * Open WhatsApp with an enquiry for this product.
   * Uses the admin-configured WhatsApp number, falling back to the contact phone number.
   */
  const handleEnquire = useCallback(() => {
    if (!product) return;

    const phone = resolveWhatsAppNumber(settings);
    if (!phone) {
      showError('Enquiries are temporarily unavailable. Please contact us directly.');
      return;
    }

    const message = `Hi, I'd like to enquire about: ${product.name}`;
    window.open(generateWhatsAppLink(phone, message), '_blank');
  }, [product, settings, showError]);

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
      {/*
        Breadcrumb rather than a lone "Back to Shop". It answers "where am I?"
        and gets the shopper to the sibling products, which is what they want
        next, instead of dumping them at the top of the full catalogue.
      */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-1.5 text-sm text-slate-500">
          <li>
            <Link to="/" className="transition-colors hover:text-slate-900">
              Home
            </Link>
          </li>
          <li aria-hidden="true" className="text-slate-300">
            /
          </li>
          <li>
            {categoryName ? (
              <Link
                to={`/shop?category=${product.categoryId}`}
                className="transition-colors hover:text-slate-900"
              >
                {categoryName}
              </Link>
            ) : (
              <Link to="/shop" className="transition-colors hover:text-slate-900">
                Shop
              </Link>
            )}
          </li>
          <li aria-hidden="true" className="text-slate-300">
            /
          </li>
          <li>
            <span
              aria-current="page"
              className="line-clamp-1 font-medium text-slate-900"
            >
              {product.name}
            </span>
          </li>
        </ol>
      </nav>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Images */}
        <div>
          {/* `contain` on white, matching the product cards. `cover` in a square frame
              crops the pack itself — the one thing a buyer is here to look at. */}
          <div className="aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white mb-3">
            <img
              src={productImages[selectedImageIndex] || product.imageUrl}
              alt={product.name}
              className="h-full w-full object-contain p-3"
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

          {/*
            A coming-soon product has no price to show — the Enquire button for
            that case lives at the bottom of this column, next to where Add to
            Cart sits for an available product. It used to be duplicated here
            as well, so the same action appeared twice on one page.
          */}
          {product.status !== 'coming_soon' && (
            <p className="text-2xl font-bold text-slate-900 mb-4">
              Ksh {product.price.toLocaleString('en-KE', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          )}

          {/* Status. A count is useful to an institutional buyer, so it stays — but it
              is grouped with thousands separators rather than as raw digits. */}
          <div className="mb-4">
            {product.status === 'coming_soon' ? (
              <p className="text-sm font-medium text-slate-500">
                Not yet available — enquire and we will tell you when it arrives.
              </p>
            ) : product.stock > 0 ? (
              <p className="text-sm text-emerald-600">
                In stock — {product.stock.toLocaleString('en-KE')} available
              </p>
            ) : (
              <p className="text-sm text-red-600">Out of stock</p>
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
              <div className="flex items-center rounded-lg border border-slate-300">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                  aria-label="Decrease quantity"
                  className="px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                  <span aria-hidden="true">−</span>
                </button>
                {/*
                  `aria-live` so a screen reader hears the new total when the
                  stepper is used, rather than having to go looking for it.
                */}
                <span
                  aria-live="polite"
                  className="min-w-[3ch] px-3 py-2 text-center text-sm font-medium tabular-nums"
                >
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  disabled={quantity >= product.stock}
                  aria-label="Increase quantity"
                  className="px-3 py-2 text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                >
                  <span aria-hidden="true">+</span>
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

          {/*
            Not `mt-auto` here. An available product's Add to Cart is pushed to
            the bottom to line up with a full-height image column; a coming-soon
            product has nothing below this point, so `mt-auto` dropped the only
            action on the page off the bottom of the screen.
          */}
          {product.status === 'coming_soon' && (
            <div className="mt-2">
              <button
                onClick={handleEnquire}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 py-3 font-medium text-white transition-colors hover:bg-primary-700"
              >
                <MessageCircle size={18} aria-hidden="true" />
                Enquire on WhatsApp
              </button>
              <p className="mt-2 text-xs text-slate-500">
                Opens WhatsApp with this product already named.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Related products use the shared card, so they are real links like every
          other product tile and cannot diverge from it again. */}
      {relatedProducts.length > 0 && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-slate-900">
            More from {categoryName ?? 'this category'}
          </h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                onAddToCart={() => addItem(relatedProduct)}
                to={`/product/${relatedProduct.id}`}
                showStock={false}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
