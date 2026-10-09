import React from 'react';
import { OrderItem } from '../types';
import { X, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Utensils } from 'lucide-react';
import { soundService } from '../services/sound';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: OrderItem[];
  onUpdateQuantity: (cartItemId: string, newQuantity: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
  diningOption: 'comer_no_local' | 'para_levar';
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  diningOption,
}) => {
  if (!isOpen) return null;

  const total = items.reduce((acc, curr) => acc + curr.subtotal, 0);
  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl h-full bg-[#16161a] border-l border-white/10 shadow-2xl flex flex-col justify-between overflow-hidden text-slate-100">
        {/* Drawer Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#121215] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Seu Pedido
              </h3>
              <p className="text-xs text-slate-400">
                {itemCount} {itemCount === 1 ? 'item selecionado' : 'itens selecionados'} • {diningOption === 'comer_no_local' ? 'Comer no Local' : 'Para Levar'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={() => {
                  soundService.playTap();
                  if (confirm('Tem certeza que deseja limpar todo o pedido?')) {
                    onClearCart();
                  }
                }}
                className="px-3 py-1.5 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                Limpar
              </button>
            )}

            <button
              onClick={() => {
                soundService.playTap();
                onClose();
              }}
              aria-label="Continuar comprando"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 divide-y divide-white/5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-3">
                <Utensils className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-base font-bold text-white">Seu pedido está vazio</p>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Toque nos hambúrgueres e acompanhamentos do cardápio para adicioná-los.
              </p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.cartItemId} className="pt-4 first:pt-0 flex gap-3 sm:gap-4 items-start">
                {/* Product thumbnail */}
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0">
                  <img
                    src={item.image}
                    alt={item.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm sm:text-base font-bold text-white leading-tight">
                      {item.name}
                    </h4>
                    <span className="font-mono-numbers text-sm sm:text-base font-black text-amber-400 shrink-0">
                      R$ {item.subtotal.toFixed(2).replace('.', ',')}
                    </span>
                  </div>

                  {/* Customization Details */}
                  <div className="mt-1 space-y-0.5 text-xs text-slate-400">
                    {item.customization.meatDoneness && (
                      <p className="text-amber-400/90 font-medium">
                        • Ponto: {item.customization.meatDoneness}
                      </p>
                    )}
                    {item.customization.extras && item.customization.extras.length > 0 && (
                      <p className="text-slate-300">
                        • Extras: {item.customization.extras.map((e) => e.name).join(', ')}
                      </p>
                    )}
                    {item.customization.removals && item.customization.removals.length > 0 && (
                      <p className="text-red-400/80">
                        • Removido: {item.customization.removals.join(', ')}
                      </p>
                    )}
                    {item.customization.notes && (
                      <p className="text-slate-400 italic">
                        • Obs: &quot;{item.customization.notes}&quot;
                      </p>
                    )}
                  </div>

                  {/* Quantity Stepper & Remove */}
                  <div className="mt-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1">
                      <button
                        onClick={() => {
                          soundService.playTick();
                          if (item.quantity > 1) {
                            onUpdateQuantity(item.cartItemId, item.quantity - 1);
                          } else {
                            onRemoveItem(item.cartItemId);
                          }
                        }}
                        aria-label="Diminuir"
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>

                      <span className="font-mono-numbers text-xs font-bold px-2">
                        {item.quantity}
                      </span>

                      <button
                        onClick={() => {
                          soundService.playTick();
                          onUpdateQuantity(item.cartItemId, item.quantity + 1);
                        }}
                        aria-label="Aumentar"
                        className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        soundService.playTap();
                        onRemoveItem(item.cartItemId);
                      }}
                      aria-label="Remover item"
                      className="text-xs text-slate-400 hover:text-red-400 p-1 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Excluir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer with Subtotal & Proceed */}
        {items.length > 0 && (
          <div className="p-6 bg-[#121215] border-t border-white/10 space-y-4 shrink-0">
            {/* Totals Breakdown */}
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Subtotal dos itens</span>
                <span className="font-mono-numbers text-slate-300">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
              <div className="flex justify-between text-slate-400 text-xs">
                <span>Taxa de serviço totem</span>
                <span className="text-emerald-400 font-semibold">Grátis (R$ 0,00)</span>
              </div>
              <div className="pt-2 border-t border-white/10 flex justify-between items-baseline">
                <span className="text-base font-extrabold text-white uppercase tracking-tight">
                  Valor Total
                </span>
                <span className="font-mono-numbers text-2xl font-black text-amber-400">
                  R$ {total.toFixed(2).replace('.', ',')}
                </span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              onClick={() => {
                soundService.playTap();
                onProceedToCheckout();
              }}
              className="w-full py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 active:scale-95 transition-all"
            >
              <span>Avançar para Pagamento</span>
              <ArrowRight className="w-5 h-5 stroke-[3]" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
