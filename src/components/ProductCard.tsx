import React, { useState } from 'react';
import { Product } from '../types';
import { Plus, SlidersHorizontal, Flame, Clock } from 'lucide-react';
import { soundService } from '../services/sound';

interface ProductCardProps {
  product: Product;
  onQuickAdd: (product: Product) => void;
  onCustomize: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickAdd,
  onCustomize,
}) => {
  const [imgError, setImgError] = useState(false);

  const handleQuickAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundService.playItemAdded();
    onQuickAdd(product);
  };

  const handleCardClick = () => {
    soundService.playTap();
    onCustomize(product);
  };

  return (
    <article
      onClick={handleCardClick}
      className="group relative flex flex-col justify-between bg-[#19191e] hover:bg-[#202026] border border-white/10 hover:border-amber-500/40 rounded-2xl overflow-hidden transition-all duration-200 cursor-pointer shadow-lg active:scale-[0.99]"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-900 shrink-0">
        {!imgError ? (
          <img
            src={product.image}
            alt={product.name}
            onError={() => setImgError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-950 text-slate-400 p-4 text-center">
            <Flame className="w-10 h-10 text-amber-500/50 mb-1" />
            <span className="text-xs font-semibold text-slate-400">{product.name}</span>
          </div>
        )}

        {/* Subtle Scrim gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

        {/* Informative text kickers (unboxed, zero-pill discipline) */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 pointer-events-none">
          {product.isPopular && (
            <span className="text-[11px] font-bold tracking-wide uppercase text-black bg-amber-400 px-2 py-0.5 rounded shadow">
              Mais Vendido
            </span>
          )}
          {product.isNew && (
            <span className="text-[11px] font-bold tracking-wide uppercase text-white bg-emerald-600 px-2 py-0.5 rounded shadow">
              Novidade
            </span>
          )}
        </div>

        {/* Prep time info */}
        {product.preparationTime && (
          <div className="absolute bottom-2 left-2.5 flex items-center gap-1 text-[11px] text-slate-300 font-medium">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>{product.preparationTime}</span>
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-base font-bold text-white group-hover:text-amber-300 transition-colors line-clamp-1 leading-snug">
            {product.name}
          </h4>

          <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>

        {/* Price & Actions Row */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          <div>
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              A partir de
            </span>
            <span className="font-mono-numbers text-lg font-extrabold text-amber-400">
              R$ {product.price.toFixed(2).replace('.', ',')}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Customize trigger */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleCardClick();
              }}
              title="Personalizar adicionais, ponto da carne e observações"
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>

            {/* Quick Add */}
            <button
              type="button"
              onClick={handleQuickAddClick}
              className="flex items-center gap-1 px-3 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-md shadow-amber-500/10 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden sm:inline">Adicionar</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
