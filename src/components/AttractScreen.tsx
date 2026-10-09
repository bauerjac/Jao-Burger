import React from 'react';
import { Sparkles, Utensils, Volume2, VolumeX, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { soundService } from '../services/sound';
import smashHeroImg from '../assets/images/jao_double_smash_burger_1791585955060.jpg';
import baconBurgerImg from '../assets/images/jao_bacon_artisan_burger_1791585965142.jpg';
import friesImg from '../assets/images/jao_crispy_fries_truffle_1791585974040.jpg';

interface AttractScreenProps {
  onStart: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenSettings: () => void;
}

export const AttractScreen: React.FC<AttractScreenProps> = ({
  onStart,
  soundEnabled,
  onToggleSound,
  onOpenSettings,
}) => {
  const handleTouch = () => {
    soundService.playTap();
    onStart();
  };

  return (
    <div
      onClick={handleTouch}
      className="relative w-full h-full min-h-screen bg-[#0d0d0f] text-white flex flex-col justify-between overflow-hidden cursor-pointer select-none"
    >
      {/* Background ambient lighting and subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-amber-600/10 via-transparent to-black pointer-events-none" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Kiosk Bar */}
      <header className="relative z-10 flex items-center justify-between px-8 py-6 border-b border-white/10 backdrop-blur-md bg-black/30">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center font-black text-2xl text-black shadow-lg shadow-amber-500/20">
            JB
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white uppercase">
              Jão Burger
            </h1>
            <p className="text-xs text-amber-400/90 font-medium tracking-wider uppercase">
              Artesanal & Smash House
            </p>
          </div>
        </div>

        {/* Ambient controls */}
        <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={onToggleSound}
            aria-label={soundEnabled ? 'Silenciar Totem' : 'Ativar Sons'}
            className="w-11 h-11 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-slate-300 transition-colors"
          >
            {soundEnabled ? <Volume2 className="w-5 h-5 text-amber-400" /> : <VolumeX className="w-5 h-5 text-slate-400" />}
          </button>

          <button
            onClick={onOpenSettings}
            className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors"
          >
            Ajustes / Integrações
          </button>
        </div>
      </header>

      {/* Hero Showcase Center */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-8 text-center max-w-5xl mx-auto w-full">
        {/* Quality Badges */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
          <Sparkles className="w-4 h-4 text-amber-400" />
          Autoatendimento Rápido • Peça Sem Filas
        </div>

        <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl leading-tight">
          O Verdadeiro Hambúrguer <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">
            Artesanal & Smash
          </span>
        </h2>

        <p className="mt-4 text-base md:text-xl text-slate-300 max-w-2xl font-normal leading-relaxed">
          Carne fresca moída no dia, pão brioche amanteigado selado no fogo e queijo cheddar derretido de verdade.
        </p>

        {/* Mouthwatering Image Grid Showcase */}
        <div className="grid grid-cols-3 gap-4 md:gap-6 w-full max-w-3xl mt-8 mb-8">
          <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3] bg-zinc-900">
            <img
              src={smashHeroImg}
              alt="Jão Double Smash Burger"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
              <span className="text-xs md:text-sm font-bold text-white">Double Smash Clássico</span>
            </div>
          </div>

          <div className="relative group rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/10 aspect-[4/3] bg-zinc-900 scale-105">
            <img
              src={baconBurgerImg}
              alt="Jão Bacon Artesanal"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex items-end p-3">
              <span className="text-xs md:text-sm font-bold text-amber-300">Bacon Artesanal 180g</span>
            </div>
          </div>

          <div className="relative group rounded-2xl overflow-hidden border border-white/10 shadow-2xl aspect-[4/3] bg-zinc-900">
            <img
              src={friesImg}
              alt="Batata Rústica Trufada"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-3">
              <span className="text-xs md:text-sm font-bold text-white">Fritas Rústicas da Casa</span>
            </div>
          </div>
        </div>

        {/* Pulsing Touch Target */}
        <div className="mt-2 w-full max-w-md">
          <button
            onClick={handleTouch}
            className="w-full py-5 px-8 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold text-xl md:text-2xl tracking-wide flex items-center justify-center gap-4 shadow-xl shadow-amber-500/25 transition-all transform hover:-translate-y-1 active:translate-y-0 active:scale-[0.98]"
          >
            <span>TOQUE PARA INICIAR</span>
            <ArrowRight className="w-7 h-7 text-black stroke-[3]" />
          </button>
          <p className="mt-3 text-xs text-slate-400">
            Toque em qualquer lugar da tela para escolher seus produtos
          </p>
        </div>
      </main>

      {/* Footer Trust Markers */}
      <footer className="relative z-10 px-8 py-5 border-t border-white/10 bg-black/40 backdrop-blur-md flex flex-wrap items-center justify-around gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Preparo ágil de 10 a 15 minutos</span>
        </div>
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-amber-400" />
          <span>Ingredientes frescos selecionados</span>
        </div>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          <span>Pagamento seguro via Totem ou Pix</span>
        </div>
      </footer>
    </div>
  );
};
