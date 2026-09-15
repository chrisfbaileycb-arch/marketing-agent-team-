import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { ArrowUpRight, Star, Flame, ImageOff } from 'lucide-react';
import Layout from '../components/Layout';
import { useApp } from '../context/AppContext';

const FALLBACK_IMAGE_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg width="1200" height="480" viewBox="0 0 1200 480" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="480" fill="#1E293B"/>
    <rect x="515" y="120" width="170" height="170" rx="44" fill="#5A64E3"/>
    <path d="M566 230V194C566 184.059 574.059 176 584 176H616C625.941 176 634 184.059 634 194V230M550 244H650C659.941 244 668 252.059 668 262V272H532V262C532 252.059 540.059 244 550 244Z" stroke="white" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="600" y="354" fill="#CBD5E1" font-family="Arial, sans-serif" font-size="28" font-weight="700" text-anchor="middle">AffiliateAgent Offer</text>
  </svg>
`)}`;

const Marketplace: React.FC = () => {
  const { offers, scoutDiscoveryFilters } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = useMemo(
    () => ['All', ...Array.from(new Set(offers.map((offer) => offer.category)))],
    [offers],
  );

  const displayedOffers = activeCategory === 'All'
    ? offers
    : offers.filter((offer) => offer.category === activeCategory);

  const handleImageError = (event: React.SyntheticEvent<HTMLImageElement>) => {
    if (event.currentTarget.src !== FALLBACK_IMAGE_URL) {
      event.currentTarget.src = FALLBACK_IMAGE_URL;
    }
  };

  return (
    <Layout>
      <div className="max-w-[1440px] mx-auto px-6 py-8 space-y-8">
        <div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Affiliate Marketplace</h1>
          <p className="text-slate-500 mt-1">
            Scout Agent is qualifying enterprise opportunities with ${scoutDiscoveryFilters.minimumPayout.toLocaleString()}–${scoutDiscoveryFilters.maximumPayout.toLocaleString()} commission potential.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveCategory(category)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                activeCategory === category
                  ? 'bg-slate-900 text-white'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedOffers.map((offer, index) => (
            <motion.div
              key={offer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-3xl border border-slate-100 overflow-hidden group cursor-pointer hover:shadow-lg transition-shadow"
            >
              <div className="relative h-36 w-full bg-slate-800 overflow-hidden">
                <img
                  src={offer.imageUrl || FALLBACK_IMAGE_URL}
                  alt={`${offer.name} offer`}
                  onError={handleImageError}
                  className="h-36 w-full object-cover rounded-t-xl bg-slate-800 transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-slate-900/10 pointer-events-none" />
                {offer.hot && (
                  <div className="absolute top-4 left-4 px-3 py-1 bg-red-500 text-white rounded-full text-[10px] font-bold uppercase flex items-center gap-1">
                    <Flame className="w-3 h-3" /> Hot Offer
                  </div>
                )}
                <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 backdrop-blur rounded-full text-[10px] font-bold uppercase">
                  {offer.category}
                </div>
              </div>

              <div className="p-6 space-y-4">
                <h3 className="font-bold text-slate-900 group-hover:text-brand-500 transition-colors">{offer.name}</h3>
                <div className="flex items-center gap-1 text-amber-500">
                  {[1, 2, 3, 4, 5].map((star) => <Star key={star} className="w-3 h-3 fill-current" />)}
                  <span className="text-xs text-slate-400 ml-1">Top Converting</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-50">
                  <div>
                    <p className="text-xs text-slate-400">Commission</p>
                    <p className="font-bold text-slate-900 text-sm">{offer.commission}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">Max Payout</p>
                    <p className="font-bold text-brand-500">${offer.payout.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">EPC</p>
                    <p className="font-bold text-slate-900">${offer.epc.toFixed(2)}</p>
                  </div>
                </div>
                <button
                  onClick={() => toast.success(`Joined "${offer.name}" offer.`)}
                  className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                >
                  Join Offer <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {displayedOffers.length === 0 && (
          <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center">
            <ImageOff className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-700">No offers available in this category.</p>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Marketplace;