import React, { useState } from 'react';
import { Product, ProductExtra, OrderItemCustomization } from '../types';
import { X, Plus, Minus, Check, Flame, MessageSquareText } from 'lucide-react';
import { soundService } from '../services/sound';

interface ProductCustomizeModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (
    product: Product,
    quantity: number,
    customization: OrderItemCustomization
  ) => void;
}

export const ProductCustomizeModal: React.FC<ProductCustomizeModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
}) => {
  if (!isOpen || !product) return null;

  const [quantity, setQuantity] = useState<number>(1);
  const [meatDoneness, setMeatDoneness] = useState<'Mal Passado' | 'Ao Ponto' | 'Bem Passado'>('Ao Ponto');
  const [selectedExtras, setSelectedExtras] = useState<ProductExtra[]>([]);
  const [selectedRemovals, setSelectedRemovals] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');

  const toggleExtra = (extra: ProductExtra) => {
    soundService.playTick();
    setSelectedExtras((prev) => {
      const exists = prev.some((e) => e.id === extra.id);
      if (exists) {
        return prev.filter((e) => e.id !== extra.id);
      } else {
        return [...prev, extra];
      }
    });
  };

  const toggleRemoval = (removal: string) => {
    soundService.playTick();
    setSelectedRemovals((prev) => {
      if (prev.includes(removal)) {
        return prev.filter((r) => r !== removal);
      } else {
        return [...prev, removal];
      }
    });
  };

  const handleIncrement = () => {
    soundService.playTick();
    setQuantity((q) => Math.min(q + 1, 20));
  };

  const handleDecrement = () => {
    soundService.playTick();
    setQuantity((q) => Math.max(q - 1, 1));
  };

  const extrasTotal = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = product.price + extrasTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    soundService.playItemAdded();
    onAddToCart(product, quantity, {
      meatDoneness: product.allowMeatDoneness ? meatDoneness : undefined,
      extras: selectedExtras,
      removals: selectedRemovals,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-[#16161b] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Modal Header with Image */}
        <div className="relative h-44 sm:h-52 w-full overflow-hidden shrink-0 bg-zinc-950">
          <img
            src={product.image}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#16161b] via-[#16161b]/60 to-black/40" />

          {/* Close button */}
          <button
            onClick={() => {
              soundService.playTap();
              onClose();
            }}
            aria-label="Fechar personalização"
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Product Title on Image */}
          <div className="absolute bottom-3 left-6 right-6">
            <span className="text-xs uppercase font-bold text-amber-400 tracking-wider">
              Personalize seu item
            </span>
            <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
              {product.name}
            </h3>
            <p className="text-xs text-slate-300 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          </div>
        </div>

        {/* Scrollable Customization Options */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Meat Doneness (if burger) */}
          {product.allowMeatDoneness && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Flame className="w-4 h-4 text-amber-400" />
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                  Ponto da Carne
                </h4>
                <span className="text-xs text-slate-400 ml-auto font-medium">Obrigatório (1)</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Mal Passado', 'Ao Ponto', 'Bem Passado'] as const).map((point) => {
                  const isChecked = meatDoneness === point;
                  return (
                    <button
                      key={point}
                      type="button"
                      onClick={() => {
                        soundService.playTick();
                        setMeatDoneness(point);
                      }}
                      className={`py-3 px-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${
                        isChecked
                          ? 'bg-amber-500/20 border-amber-500 text-white font-bold'
                          : 'bg-white/[0.03] border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-xs">{point}</span>
                      {isChecked && (
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Extras / Adicionais */}
          {product.availableExtras && product.availableExtras.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                  Turbine seu Burger (Adicionais)
                </h4>
                <span className="text-xs text-slate-400 font-medium">Opcional</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {product.availableExtras.map((extra) => {
                  const isSelected = selectedExtras.some((e) => e.id === extra.id);
                  return (
                    <button
                      key={extra.id}
                      type="button"
                      onClick={() => toggleExtra(extra)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-amber-500/15 border-amber-500 text-white font-semibold'
                          : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                            isSelected
                              ? 'bg-amber-500 border-amber-500 text-black'
                              : 'border-white/20 bg-black/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="text-xs font-medium">{extra.name}</span>
                      </div>
                      <span className="font-mono-numbers text-xs font-bold text-amber-400 shrink-0 ml-2">
                        +R$ {extra.price.toFixed(2).replace('.', ',')}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Removals / Sem cebola, etc. */}
          {product.availableRemovals && product.availableRemovals.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                  Deseja retirar algum ingrediente?
                </h4>
                <span className="text-xs text-slate-400 font-medium">Opcional</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.availableRemovals.map((rem) => {
                  const isRemoved = selectedRemovals.includes(rem);
                  return (
                    <button
                      key={rem}
                      type="button"
                      onClick={() => toggleRemoval(rem)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                        isRemoved
                          ? 'bg-red-500/20 border-red-500 text-red-300 line-through'
                          : 'bg-white/[0.03] border-white/10 text-slate-300 hover:text-white'
                      }`}
                    >
                      {rem}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen observations */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <MessageSquareText className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                Observações para a Cozinha
              </h4>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ex: Cortar o lanche ao meio, batata bem frita, embalar separado..."
              rows={2}
              maxLength={150}
              className="w-full bg-white/[0.04] border border-white/10 rounded-xl p-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors resize-none"
            />
          </div>
        </div>

        {/* Modal Bottom Sticky Action Bar */}
        <div className="p-4 sm:p-5 bg-[#121215] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          {/* Quantity Stepper */}
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-1.5 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={handleDecrement}
              disabled={quantity <= 1}
              aria-label="Diminuir quantidade"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center text-white transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>

            <span className="font-mono-numbers text-lg font-black text-white px-3 min-w-[2.5rem] text-center">
              {quantity}
            </span>

            <button
              type="button"
              onClick={handleIncrement}
              aria-label="Aumentar quantidade"
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-white transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add Button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full sm:flex-1 py-4 px-6 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-base flex items-center justify-between shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            <span>Adicionar ao Pedido</span>
            <span className="font-mono-numbers text-lg font-black">
              R$ {totalPrice.toFixed(2).replace('.', ',')}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
