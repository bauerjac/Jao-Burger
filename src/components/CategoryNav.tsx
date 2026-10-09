import React from 'react';
import { CATEGORIES } from '../data/menu';
import { Sparkles, Flame, Beef, UtensilsCrossed, Coffee, IceCream, Droplets, LucideIcon } from 'lucide-react';
import { soundService } from '../services/sound';

interface CategoryNavProps {
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  productCounts: Record<string, number>;
}

const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Flame,
  Beef,
  UtensilsCrossed,
  Coffee,
  IceCream,
  Droplets,
};

export const CategoryNav: React.FC<CategoryNavProps> = ({
  selectedCategory,
  onSelectCategory,
  productCounts,
}) => {
  return (
    <nav className="w-full lg:w-64 bg-[#141418] border-b lg:border-b-0 lg:border-r border-white/10 shrink-0">
      {/* Horizontal on small/medium screens, vertical on large/totem screens */}
      <div className="flex lg:flex-col overflow-x-auto lg:overflow-y-auto no-scrollbar p-2.5 lg:p-4 gap-2">
        <div className="hidden lg:block mb-2 px-2 text-[11px] font-bold text-slate-400 tracking-wider uppercase">
          Categorias do Cardápio
        </div>

        {CATEGORIES.map((cat) => {
          const Icon = ICON_MAP[cat.icon] || Flame;
          const isSelected = selectedCategory === cat.id;
          const count = productCounts[cat.id] || 0;

          return (
            <button
              key={cat.id}
              onClick={() => {
                soundService.playTap();
                onSelectCategory(cat.id);
              }}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all shrink-0 lg:w-full group ${
                isSelected
                  ? 'bg-amber-500 text-black font-extrabold shadow-md shadow-amber-500/20'
                  : 'bg-white/[0.03] hover:bg-white/[0.07] text-slate-300 font-semibold border border-white/5'
              }`}
            >
              <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                  isSelected
                    ? 'bg-black/15 text-black'
                    : 'bg-white/5 text-amber-400 group-hover:scale-105'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>

              <div className="flex flex-col min-w-0 pr-1">
                <span className="text-sm whitespace-nowrap truncate leading-tight">
                  {cat.name}
                </span>
                <span
                  className={`text-[11px] font-mono-numbers mt-0.5 leading-none ${
                    isSelected ? 'text-black/70' : 'text-slate-400'
                  }`}
                >
                  {count} {count === 1 ? 'item' : 'itens'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
