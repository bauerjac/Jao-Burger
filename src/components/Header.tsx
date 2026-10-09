import React from 'react';
import { ShoppingBag, Utensils, Settings, Volume2, VolumeX, RotateCcw } from 'lucide-react';
import { DiningOption } from '../types';
import { soundService } from '../services/sound';

interface HeaderProps {
  diningOption: DiningOption;
  onChangeDiningOption: () => void;
  cartItemCount: number;
  cartTotal: number;
  onOpenCart: () => void;
  onOpenSettings: () => void;
  onResetOrder: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  diningOption,
  onChangeDiningOption,
  cartItemCount,
  cartTotal,
  onOpenCart,
  onOpenSettings,
  onResetOrder,
  soundEnabled,
  onToggleSound,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 md:gap-8 px-4 sm:px-6 py-3.5 bg-[#141418]/95 backdrop-blur-md border-b border-white/10 shrink-0">
      {/* Zone 1: Brand Mark */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => {
            soundService.playTap();
            onResetOrder();
          }}
          className="flex items-center gap-2.5 text-left group"
          title="Reiniciar autoatendimento"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-xl text-black shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
            JB
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-black tracking-tight text-white uppercase block leading-none">
              Jão Burger
            </span>
            <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block mt-0.5">
              Totem #01
            </span>
          </div>
        </button>

        {/* Dining Mode Button */}
        <button
          onClick={() => {
            soundService.playTap();
            onChangeDiningOption();
          }}
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-300 transition-colors"
          title="Alterar modo de consumo"
        >
          {diningOption === 'comer_no_local' ? (
            <>
              <Utensils className="w-3.5 h-3.5 text-amber-400" />
              <span className="whitespace-nowrap">Comer Aqui</span>
            </>
          ) : (
            <>
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span className="whitespace-nowrap">Para Levar</span>
            </>
          )}
          <span className="text-[10px] text-slate-400 underline ml-0.5">alterar</span>
        </button>
      </div>

      {/* Zone 2: Middle quick utilities / restart */}
      <div className="hidden md:flex items-center gap-3 text-xs text-slate-400 shrink-0">
        <button
          onClick={() => {
            soundService.playTap();
            onResetOrder();
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          title="Cancelar e recomeçar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Cancelar e Recomeçar</span>
        </button>
      </div>

      {/* Zone 3: Primary Action (Cart Drawer Trigger & System Settings) */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Silenciar' : 'Ativar áudio'}
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
        </button>

        <button
          onClick={() => {
            soundService.playTap();
            onOpenSettings();
          }}
          aria-label="Abrir configurações e integrações"
          className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-colors"
          title="Configurações (Supabase & n8n)"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Cart Trigger */}
        <button
          onClick={() => {
            soundService.playTap();
            onOpenCart();
          }}
          className="relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95 whitespace-nowrap"
        >
          <ShoppingBag className="w-4 h-4 text-black stroke-[2.5]" />
          <span>Ver Pedido</span>
          {cartItemCount > 0 && (
            <span className="w-5 h-5 rounded-full bg-black text-amber-400 text-xs font-black flex items-center justify-center ml-0.5">
              {cartItemCount}
            </span>
          )}
          {cartTotal > 0 && (
            <span className="font-mono-numbers text-xs ml-1 font-black bg-amber-600/30 px-1.5 py-0.5 rounded text-black">
              R$ {cartTotal.toFixed(2).replace('.', ',')}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
