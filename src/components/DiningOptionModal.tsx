import React from 'react';
import { Utensils, ShoppingBag, X } from 'lucide-react';
import { DiningOption } from '../types';
import { soundService } from '../services/sound';

interface DiningOptionModalProps {
  isOpen: boolean;
  onSelect: (option: DiningOption) => void;
  onCancel: () => void;
}

export const DiningOptionModal: React.FC<DiningOptionModalProps> = ({
  isOpen,
  onSelect,
  onCancel,
}) => {
  if (!isOpen) return null;

  const handleChoose = (opt: DiningOption) => {
    soundService.playTap();
    onSelect(opt);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-[#16161a] border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col items-center text-center">
        {/* Close / Back */}
        <button
          onClick={onCancel}
          aria-label="Voltar para início"
          className="absolute top-6 right-6 w-11 h-11 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
          <Utensils className="w-7 h-7" />
        </div>

        <h3 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Como deseja fazer seu pedido?
        </h3>
        <p className="mt-2 text-sm md:text-base text-slate-400 max-w-md">
          Selecione a opção desejada para que nossa equipe prepare sua embalagem com todo o cuidado.
        </p>

        {/* 2 Big Touch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full mt-8">
          <button
            onClick={() => handleChoose('comer_no_local')}
            className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] hover:from-amber-500/20 hover:to-amber-600/10 border-2 border-white/10 hover:border-amber-500/60 transition-all duration-200 text-center shadow-lg active:scale-95"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Utensils className="w-10 h-10" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-amber-300">
              Comer no Local
            </span>
            <span className="mt-1 text-xs text-slate-400">
              Bandeja servida na mesa ou no balcão
            </span>
          </button>

          <button
            onClick={() => handleChoose('para_levar')}
            className="group relative flex flex-col items-center justify-center p-8 rounded-2xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] hover:from-amber-500/20 hover:to-amber-600/10 border-2 border-white/10 hover:border-amber-500/60 transition-all duration-200 text-center shadow-lg active:scale-95"
          >
            <div className="w-20 h-20 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShoppingBag className="w-10 h-10" />
            </div>
            <span className="text-xl font-bold text-white group-hover:text-amber-300">
              Para Levar
            </span>
            <span className="mt-1 text-xs text-slate-400">
              Embalagem térmica selada para viagem
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
