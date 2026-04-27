import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Product, Page } from '../types';

interface CollectionPageProps {
  category: any;
  categories: any[];
  products: Product[];
  addToCart: (p: Product) => void;
  setPage: (p: Page) => void;
  setSelectedProduct?: (p: Product) => void;
}

export default function CollectionPage({ category, categories, products, addToCart, setPage, setSelectedProduct }: CollectionPageProps) {
  const [sortOrder, setSortOrder] = useState('newest');

  // Find subcategories
  const subCategories = categories.filter(c => c.parent_id === category.id);

  // Helper to get all descendant category IDs
  const getDescendantIds = (catId: number): number[] => {
    const children = categories.filter(c => c.parent_id === catId).map(c => c.id);
    let all = [...children];
    for (const childId of children) {
      all = all.concat(getDescendantIds(childId));
    }
    return all;
  };

  const validCategoryIds = [category.id, ...getDescendantIds(category.id)];
  
  // Filter products by category or its descendants
  let filteredProducts = products.filter(p => p.category_id && validCategoryIds.includes(p.category_id));

  // Sort products
  if (sortOrder === 'price-asc') {
    filteredProducts.sort((a, b) => a.price - b.price);
  } else if (sortOrder === 'price-desc') {
    filteredProducts.sort((a, b) => b.price - a.price);
  } else {
    // Default: Newest (Assuming higher ID is newer if created_at is not mapped, but we don't have created_at mapped in Product type easily, so just keep as is or sort by ID)
    filteredProducts.sort((a, b) => b.id - a.id);
  }

  const handleSubcategoryClick = (slug: string) => {
    // Update URL and state via App.tsx logic (we need to trigger a navigation to the new collection)
    // For now we'll pass the slug via pushState, and App.tsx handles popstate or we pass a custom setPage
    window.history.pushState({}, '', `/collection/${slug}`);
    const navEvent = new PopStateEvent('popstate');
    window.dispatchEvent(navEvent);
  };

  return (
    <div className="bg-black min-h-screen pb-32">
      {/* Category Hero */}
      <div className="relative h-[40vh] md:h-[50vh] bg-[#111] overflow-hidden flex items-center justify-center">
        {category.image_url && (
          <>
            <img src={category.image_url} alt={category.name} className="absolute inset-0 w-full h-full object-cover opacity-50 grayscale" />
            <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
          </>
        )}
        <div className="relative z-10 text-center px-6">
          <span className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Collection</span>
          <h1 className="text-5xl md:text-7xl font-serif font-bold tracking-tighter text-white">{category.name.toUpperCase()}</h1>
          {category.description && <p className="text-white/50 mt-4 max-w-lg mx-auto">{category.description}</p>}
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-12 mt-16">
        
        {/* Subcategories Display */}
        {subCategories.length > 0 && (
          <div className="mb-24">
            <h3 className="text-white/40 text-[10px] font-bold tracking-[0.5em] uppercase mb-8 border-b border-white/10 pb-4">Explore Subcategories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {subCategories.map(sub => (
                <div 
                  key={sub.id} 
                  onClick={() => handleSubcategoryClick(sub.slug)}
                  className="group relative aspect-[4/3] bg-[#111] overflow-hidden rounded-xl cursor-pointer border border-white/5 hover:border-gold/30 transition-all"
                >
                  {sub.image_url ? (
                    <img src={sub.image_url} alt={sub.name} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 grayscale group-hover:grayscale-0" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white/10 bg-white/5 group-hover:bg-white/10 transition-colors">No Image</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-6 left-6 right-6">
                    <h4 className="text-white font-serif font-bold text-xl group-hover:text-gold transition-colors">{sub.name}</h4>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sorting & Filter Header */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-12 pb-4 border-b border-white/10 gap-6">
          <div className="text-white/50 text-sm font-mono">{filteredProducts.length} Products Found</div>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Sort By:</span>
            <select 
              value={sortOrder} 
              onChange={(e) => setSortOrder(e.target.value)}
              className="bg-transparent border border-white/20 text-white text-xs px-4 py-2 outline-none focus:border-gold cursor-pointer uppercase tracking-widest"
            >
              <option value="newest" className="bg-black text-white">Newest First</option>
              <option value="price-asc" className="bg-black text-white">Price: Low to High</option>
              <option value="price-desc" className="bg-black text-white">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-xl border border-white/5">
            <p className="text-white/30 text-lg mb-8 font-serif">No products available in this category yet.</p>
            <button onClick={() => setPage('shop')} className="btn-luxury">Continue Shopping</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
            {filteredProducts.map((product) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
                className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gold/30 transition-all cursor-pointer"
                onClick={() => { setSelectedProduct?.(product); setPage('product-detail'); }}>
                <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <button onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                    className="absolute bottom-0 left-0 w-full bg-gold text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    Quick Add
                  </button>
                  {product.featured ? (
                    <div className="absolute top-6 left-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-gold text-white px-3 py-1">Featured</div>
                  ) : null}
                  {(product.sale_price && product.regular_price) && Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100) > 0 && (
                    <div className="absolute top-6 right-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-gold text-white px-3 py-1">
                      {Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)}% OFF
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h4 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{product.name}</h4>
                  <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-3">{product.category}</p>
                  <div className="flex items-center gap-2">
                    {product.sale_price ? (
                        <>
                        <span className="text-gold font-bold text-sm">RS. {product.sale_price.toLocaleString()}</span>
                        <span className="text-white/30 text-xs line-through">RS. {product.regular_price?.toLocaleString()}</span>
                        </>
                    ) : (
                        <span className="text-gold font-bold text-sm">RS. {(product.regular_price || product.price).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
