import React, { useState } from 'react';
import { OrderItem, DiningOption, PaymentMethod } from '../types';
import { X, CreditCard, QrCode, Banknote, Check, ArrowLeft, ShieldCheck, User } from 'lucide-react';
import { soundService } from '../services/sound';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBackToCart: () => void;
  items: OrderItem[];
  diningOption: DiningOption;
  onConfirmOrder: (orderDetails: {
    customerName: string;
    customerCpf?: string;
    tableNumber?: string;
    paymentMethod: PaymentMethod;
  }) => Promise<void>;
  isSubmitting: boolean;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  onBackToCart,
  items,
  diningOption,
  onConfirmOrder,
  isSubmitting,
}) => {
  if (!isOpen) return null;

  const [customerName, setCustomerName] = useState('');
  const [customerCpf, setCustomerCpf] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cartao_credito');
  const [pixSimulatedStep, setPixSimulatedStep] = useState(false);

  const total = items.reduce((acc, curr) => acc + curr.subtotal, 0);

  const handleConfirm = async () => {
    soundService.playTap();
    await onConfirmOrder({
      customerName: customerName.trim() || 'Cliente Totem',
      customerCpf: customerCpf.trim() || undefined,
      tableNumber: diningOption === 'comer_no_local' ? tableNumber.trim() || undefined : undefined,
      paymentMethod,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[95vh] bg-[#16161b] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#121215] shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                soundService.playTap();
                onBackToCart();
              }}
              className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">
                Confirmação do Pedido
              </h3>
              <p className="text-xs text-slate-400">
                Revise seus dados e selecione a forma de pagamento
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              soundService.playTap();
              onClose();
            }}
            aria-label="Fechar"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Order Recap Strip */}
          <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-400 block">Resumo dos itens</span>
              <span className="text-sm font-bold text-white">
                {items.reduce((acc, i) => acc + i.quantity, 0)} itens • {diningOption === 'comer_no_local' ? 'Comer no Local' : 'Para Levar'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block uppercase">Total a pagar</span>
              <span className="font-mono-numbers text-xl font-black text-amber-400">
                R$ {total.toFixed(2).replace('.', ',')}
              </span>
            </div>
          </div>

          {/* Customer Identification */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-amber-400" />
              <h4 className="text-sm font-bold uppercase tracking-wider text-white">
                Identificação do Cliente
              </h4>
              <span className="text-xs text-slate-400 font-medium ml-auto">Opcional</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                  Seu Nome (Para a chamada no painel)
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ex: João Silva"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                  CPF na Nota Fiscal
                </label>
                <input
                  type="text"
                  value={customerCpf}
                  onChange={(e) => setCustomerCpf(e.target.value)}
                  placeholder="000.000.000-00 (Opcional)"
                  maxLength={14}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {diningOption === 'comer_no_local' && (
                <div className="sm:col-span-2">
                  <label className="text-xs text-slate-300 block mb-1.5 font-medium">
                    Número da Mesa ou Pager (se já estiver posicionado)
                  </label>
                  <input
                    type="text"
                    value={tableNumber}
                    onChange={(e) => setTableNumber(e.target.value)}
                    placeholder="Ex: Mesa 12 ou Pager 04 (ou deixe em branco para retirar no balcão)"
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold uppercase tracking-wider text-white">
              Escolha a Forma de Pagamento
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Cartão de Crédito */}
              <button
                type="button"
                onClick={() => {
                  soundService.playTick();
                  setPaymentMethod('cartao_credito');
                  setPixSimulatedStep(false);
                }}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'cartao_credito'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    paymentMethod === 'cartao_credito'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-amber-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block">Cartão de Crédito</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Aproxime ou insira na máquina do totem
                  </span>
                </div>
              </button>

              {/* Cartão de Débito */}
              <button
                type="button"
                onClick={() => {
                  soundService.playTick();
                  setPaymentMethod('cartao_debito');
                  setPixSimulatedStep(false);
                }}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'cartao_debito'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    paymentMethod === 'cartao_debito'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-amber-400'
                  }`}
                >
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block">Cartão de Débito</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Aproxime ou insira com senha
                  </span>
                </div>
              </button>

              {/* Pix Instantâneo */}
              <button
                type="button"
                onClick={() => {
                  soundService.playTick();
                  setPaymentMethod('pix');
                  setPixSimulatedStep(true);
                }}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'pix'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    paymentMethod === 'pix'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-amber-400'
                  }`}
                >
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block">Pix Instantâneo</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    QR Code na tela com confirmação imediata
                  </span>
                </div>
              </button>

              {/* Pagamento no Balcão */}
              <button
                type="button"
                onClick={() => {
                  soundService.playTick();
                  setPaymentMethod('balcao');
                  setPixSimulatedStep(false);
                }}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all ${
                  paymentMethod === 'balcao'
                    ? 'bg-amber-500/15 border-amber-500 text-white shadow-md'
                    : 'bg-white/[0.03] border-white/10 text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    paymentMethod === 'balcao'
                      ? 'bg-amber-500 text-black'
                      : 'bg-white/5 text-amber-400'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block">Pagar no Caixa / Balcão</span>
                  <span className="text-xs text-slate-400 block mt-0.5">
                    Dinheiro físico ou Vale Refeição (VR/VA)
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Pix QR Code Preview (when Pix is selected) */}
          {paymentMethod === 'pix' && pixSimulatedStep && (
            <div className="p-5 rounded-2xl bg-zinc-900 border border-amber-500/40 flex flex-col sm:flex-row items-center gap-5">
              <div className="w-32 h-32 bg-white rounded-xl p-2.5 flex items-center justify-center shrink-0 shadow-lg">
                <svg className="w-full h-full text-black" viewBox="0 0 100 100" fill="currentColor">
                  {/* Styled QR pattern */}
                  <rect x="5" y="5" width="25" height="25" rx="3" fill="#000" />
                  <rect x="10" y="10" width="15" height="15" rx="2" fill="#fff" />
                  <rect x="13" y="13" width="9" height="9" rx="1" fill="#000" />

                  <rect x="70" y="5" width="25" height="25" rx="3" fill="#000" />
                  <rect x="75" y="10" width="15" height="15" rx="2" fill="#fff" />
                  <rect x="78" y="13" width="9" height="9" rx="1" fill="#000" />

                  <rect x="5" y="70" width="25" height="25" rx="3" fill="#000" />
                  <rect x="10" y="75" width="15" height="15" rx="2" fill="#fff" />
                  <rect x="13" y="78" width="9" height="9" rx="1" fill="#000" />

                  <rect x="35" y="10" width="10" height="25" fill="#000" />
                  <rect x="50" y="15" width="12" height="12" fill="#000" />
                  <rect x="35" y="45" width="30" height="10" fill="#000" />
                  <rect x="70" y="45" width="20" height="20" fill="#000" />
                  <rect x="40" y="65" width="15" height="25" fill="#000" />
                  <rect x="65" y="75" width="25" height="15" fill="#000" />
                </svg>
              </div>

              <div className="space-y-1.5 text-center sm:text-left">
                <span className="text-xs uppercase font-extrabold text-amber-400 tracking-wider">
                  Pix Dinâmico Gerado
                </span>
                <p className="text-sm text-slate-200 font-medium">
                  Abra o aplicativo do seu banco e aponte a câmera para o QR Code acima.
                </p>
                <p className="text-xs text-slate-400">
                  O totem identificará o pagamento e liberará seu cupom automaticamente.
                </p>
              </div>
            </div>
          )}

          {/* Secure disclaimer */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Ambiente integrado com o sistema Jão Burger. Os itens serão enviados à cozinha em tempo real.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-[#121215] border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
          <button
            type="button"
            onClick={onBackToCart}
            disabled={isSubmitting}
            className="w-full sm:w-auto px-5 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-sm transition-colors"
          >
            Voltar e Alterar Itens
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={isSubmitting}
            className="w-full sm:flex-1 py-4 px-8 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-base flex items-center justify-center gap-3 shadow-xl shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                <span>Registrando Pedido...</span>
              </div>
            ) : (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>Confirmar Pedido • R$ {total.toFixed(2).replace('.', ',')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
