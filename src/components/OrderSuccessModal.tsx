import React, { useEffect, useState } from 'react';
import { Order } from '../types';
import confetti from 'canvas-confetti';
import { CheckCircle2, Printer, ArrowRight, Database, Send, Clock, AlertCircle } from 'lucide-react';
import { soundService } from '../services/sound';

interface OrderSuccessModalProps {
  order: Order | null;
  isOpen: boolean;
  onCloseAndReset: () => void;
  onOpenReceipt: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  order,
  isOpen,
  onCloseAndReset,
  onOpenReceipt,
}) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (!isOpen || !order) return;

    // Trigger confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#f59e0b', '#fbbf24', '#ffffff', '#ef4444'],
      });
    } catch {
      // Confetti fallback
    }

    setCountdown(15);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onCloseAndReset();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, order, onCloseAndReset]);

  if (!isOpen || !order) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-xl bg-[#16161b] border-2 border-amber-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center text-slate-100">
        {/* Top Success Badge */}
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 text-emerald-400 flex items-center justify-center mb-4 animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <span className="text-xs uppercase font-extrabold tracking-widest text-emerald-400">
          Pedido Confirmado & Enviado para a Cozinha
        </span>

        <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
          Obrigado, {order.customerName}!
        </h3>

        {/* Big Kiosk Ticket Pass */}
        <div className="my-6 p-6 rounded-2xl bg-zinc-950 border border-white/10 w-full flex flex-col items-center shadow-inner relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-500" />

          <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
            Sua Senha de Atendimento
          </span>

          <span className="text-5xl sm:text-6xl font-black text-amber-400 font-mono-numbers my-1 tracking-tight">
            {order.displayPassword}
          </span>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mt-1">
            <span>Código: {order.orderNumber}</span>
            <span>•</span>
            <span>{order.diningOption === 'comer_no_local' ? 'Comer no Local' : 'Para Levar'}</span>
          </div>
        </div>

        {/* Integration Status Badges (Supabase & n8n) */}
        <div className="w-full space-y-2.5 mb-6 text-left">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-1">
            Status das Integrações do Totem
          </div>

          {/* Supabase Status */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">Banco de Dados Supabase</span>
                <span className="text-[11px] text-slate-400">
                  {order.supabaseSync.status === 'sucesso' && 'Pedido e itens salvos com sucesso'}
                  {order.supabaseSync.status === 'nao_configurado' && 'Modo local (Configure URL e Anon Key no painel)'}
                  {order.supabaseSync.status === 'erro' && `Erro: ${order.supabaseSync.error?.slice(0, 45)}...`}
                </span>
              </div>
            </div>

            <div>
              {order.supabaseSync.status === 'sucesso' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Gravado
                </span>
              )}
              {order.supabaseSync.status === 'nao_configurado' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  Local
                </span>
              )}
              {order.supabaseSync.status === 'erro' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                  Pendente
                </span>
              )}
            </div>
          </div>

          {/* n8n Webhook Status */}
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/10 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold text-slate-200 block">Webhook n8n</span>
                <span className="text-[11px] text-slate-400">
                  {order.n8nSync.status === 'via_supabase' && 'Disparo automático via Supabase Database Webhook'}
                  {order.n8nSync.status === 'sucesso' && `Disparado com sucesso (HTTP ${order.n8nSync.statusCode || 200})`}
                  {order.n8nSync.status === 'nao_configurado' && 'Conecte o Supabase para disparar o webhook do n8n'}
                  {order.n8nSync.status === 'erro' && `Aviso: ${order.n8nSync.error?.slice(0, 45)}...`}
                </span>
              </div>
            </div>

            <div>
              {order.n8nSync.status === 'via_supabase' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Via Supabase
                </span>
              )}
              {order.n8nSync.status === 'sucesso' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  Disparado
                </span>
              )}
              {order.n8nSync.status === 'nao_configurado' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                  No Supabase
                </span>
              )}
              {order.n8nSync.status === 'erro' && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/40">
                  Pendente
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <button
            onClick={() => {
              soundService.playTap();
              onOpenReceipt();
            }}
            className="py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom</span>
          </button>

          <button
            onClick={() => {
              soundService.playTap();
              onCloseAndReset();
            }}
            className="py-3.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-colors"
          >
            <span>Novo Pedido</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>

        {/* Auto reset counter */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Clock className="w-3.5 h-3.5" />
          <span>Retornando à tela inicial em {countdown} segundos...</span>
        </div>
      </div>
    </div>
  );
};
