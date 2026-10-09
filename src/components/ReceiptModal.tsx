import React from 'react';
import { Order } from '../types';
import { X, Printer } from 'lucide-react';
import { soundService } from '../services/sound';

interface ReceiptModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    soundService.playTap();
    window.print();
  };

  const formattedDate = new Date(order.createdAt).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md max-h-[92vh] bg-white text-black rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 bg-zinc-100 border-b border-zinc-200 flex items-center justify-between shrink-0 print:hidden">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-600">
            Comprovante do Totem
          </span>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-8 h-8 rounded-full bg-zinc-200 hover:bg-zinc-300 flex items-center justify-center text-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thermal Receipt Paper Body */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs leading-relaxed divide-y divide-zinc-200 divide-dashed">
          {/* Header */}
          <div className="text-center pb-4">
            <h2 className="text-xl font-black uppercase tracking-tight">
              JÃO BURGER
            </h2>
            <p className="text-[11px] text-zinc-600">Artesanal & Smash House</p>
            <p className="text-[10px] text-zinc-500 mt-1">CNPJ: 12.345.678/0001-90</p>
            <p className="text-[10px] text-zinc-500">Totem Autoatendimento #01</p>

            <div className="my-3 py-2 px-3 bg-zinc-100 rounded-lg border border-zinc-300 inline-block">
              <span className="block text-[10px] uppercase font-bold text-zinc-500">
                Senha de Atendimento
              </span>
              <span className="text-3xl font-black tracking-tight text-black">
                {order.displayPassword}
              </span>
            </div>

            <div className="text-[11px] text-zinc-700 flex justify-between pt-1">
              <span>Pedido: {order.orderNumber}</span>
              <span>{order.diningOption === 'comer_no_local' ? 'COMER NO LOCAL' : 'PARA LEVAR'}</span>
            </div>
            <div className="text-[10px] text-zinc-500 flex justify-between">
              <span>Data/Hora:</span>
              <span>{formattedDate}</span>
            </div>
            {order.customerName && (
              <div className="text-[11px] text-zinc-700 flex justify-between font-bold">
                <span>Cliente:</span>
                <span>{order.customerName}</span>
              </div>
            )}
            {order.customerCpf && (
              <div className="text-[10px] text-zinc-500 flex justify-between">
                <span>CPF:</span>
                <span>{order.customerCpf}</span>
              </div>
            )}
            {order.tableNumber && (
              <div className="text-[10px] text-zinc-500 flex justify-between">
                <span>Mesa/Pager:</span>
                <span>{order.tableNumber}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="py-4 space-y-3">
            <div className="flex justify-between font-bold text-[11px] border-b border-zinc-200 pb-1">
              <span>QTD ITEM</span>
              <span>VALOR</span>
            </div>

            {order.items.map((item) => (
              <div key={item.cartItemId} className="space-y-0.5">
                <div className="flex justify-between items-start">
                  <span className="font-bold">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="tabular-nums">
                    R$ {item.subtotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>

                {item.customization.meatDoneness && (
                  <div className="text-[10px] text-zinc-600 pl-4">
                    Ponto: {item.customization.meatDoneness}
                  </div>
                )}
                {item.customization.extras && item.customization.extras.length > 0 && (
                  <div className="text-[10px] text-zinc-600 pl-4">
                    + {item.customization.extras.map((e) => e.name).join(', ')}
                  </div>
                )}
                {item.customization.removals && item.customization.removals.length > 0 && (
                  <div className="text-[10px] text-zinc-600 pl-4">
                    Sem: {item.customization.removals.join(', ')}
                  </div>
                )}
                {item.customization.notes && (
                  <div className="text-[10px] text-zinc-600 pl-4 italic">
                    Obs: {item.customization.notes}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="py-4 space-y-1">
            <div className="flex justify-between text-zinc-600">
              <span>Subtotal:</span>
              <span className="tabular-nums">
                R$ {order.subtotal.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between font-black text-sm pt-1 border-t border-zinc-300">
              <span>TOTAL A PAGAR:</span>
              <span className="tabular-nums">
                R$ {order.total.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600 pt-1 text-[11px]">
              <span>Forma de Pagamento:</span>
              <span className="uppercase font-bold">
                {order.paymentMethod.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between text-zinc-600 text-[10px]">
              <span>Status:</span>
              <span className="font-bold text-emerald-700 uppercase">
                {order.paymentStatus === 'pago' ? 'Confirmado' : 'Aguardando'}
              </span>
            </div>
          </div>

          {/* Footer Barcode Simulation */}
          <div className="pt-4 text-center space-y-2">
            <div className="h-10 bg-zinc-900 mx-auto w-4/5 flex items-center justify-around px-2 text-[8px] text-white">
              ||| | |||| || | ||| |||| | || |||
            </div>
            <p className="text-[10px] text-zinc-500">
              Acompanhe sua senha no painel da loja.
            </p>
            <p className="text-[9px] text-zinc-400">
              Obrigado pela preferência e bom apetite!
            </p>
          </div>
        </div>

        {/* Action Button */}
        <div className="p-4 bg-zinc-100 border-t border-zinc-200 flex gap-3 shrink-0 print:hidden">
          <button
            onClick={handlePrint}
            className="flex-1 py-3 px-4 rounded-xl bg-zinc-900 hover:bg-black text-white font-bold text-sm flex items-center justify-center gap-2 shadow"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Cupom</span>
          </button>
          <button
            onClick={onClose}
            className="py-3 px-4 rounded-xl bg-zinc-200 hover:bg-zinc-300 text-zinc-800 font-bold text-sm"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
