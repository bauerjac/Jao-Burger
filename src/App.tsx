import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Product, OrderItem, DiningOption, Order, AppSettings, OrderItemCustomization, PaymentMethod } from './types';
import { MENU_PRODUCTS, CATEGORIES } from './data/menu';
import { getInitialSettings, saveSettings, getNextOrderIdentifiers, saveOrderToLocalHistory, updateOrderInLocalHistory } from './services/storage';
import { saveOrderToSupabase } from './services/supabase';
import { sendOrderToN8N } from './services/n8n';
import { soundService } from './services/sound';

import { AttractScreen } from './components/AttractScreen';
import { DiningOptionModal } from './components/DiningOptionModal';
import { Header } from './components/Header';
import { CategoryNav } from './components/CategoryNav';
import { ProductCard } from './components/ProductCard';
import { ProductCustomizeModal } from './components/ProductCustomizeModal';
import { CartDrawer } from './components/CartDrawer';
import { CheckoutModal } from './components/CheckoutModal';
import { OrderSuccessModal } from './components/OrderSuccessModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';

import { Search, Sparkles, ShoppingBag, Utensils, X, Flame } from 'lucide-react';

export default function App() {
  // Application Settings (Supabase, n8n, sounds, idle timeout)
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);

  // Screen State: 'attract' (idle) or 'ordering' (interactive catalog)
  const [currentScreen, setCurrentScreen] = useState<'attract' | 'ordering'>('attract');

  // Dining option: 'comer_no_local' or 'para_levar'
  const [diningOption, setDiningOption] = useState<DiningOption>('comer_no_local');
  const [isDiningModalOpen, setIsDiningModalOpen] = useState(false);

  // Active Category & Search Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('combos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Cart State
  const [cartItems, setCartItems] = useState<OrderItem[]>([]);

  // Modals
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Idle timer ref
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sound service sync
  useEffect(() => {
    soundService.setEnabled(settings.soundEnabled);
  }, [settings.soundEnabled]);

  // Reset idle timer on touch/click/interaction
  const resetIdleTimer = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

    if (currentScreen === 'ordering' && !confirmedOrder) {
      idleTimerRef.current = setTimeout(() => {
        // Return to attract screen when idle
        handleResetToAttract();
      }, (settings.idleTimeoutSeconds || 60) * 1000);
    }
  }, [currentScreen, confirmedOrder, settings.idleTimeoutSeconds]);

  useEffect(() => {
    const handleUserActivity = () => {
      resetIdleTimer();
    };

    window.addEventListener('pointerdown', handleUserActivity);
    window.addEventListener('keydown', handleUserActivity);
    window.addEventListener('scroll', handleUserActivity, true);

    resetIdleTimer();

    return () => {
      window.removeEventListener('pointerdown', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity, true);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [resetIdleTimer]);

  // Start Order from Attract Screen
  const handleStartOrder = () => {
    setIsDiningModalOpen(true);
  };

  const handleSelectDiningOption = (option: DiningOption) => {
    setDiningOption(option);
    setIsDiningModalOpen(false);
    setCurrentScreen('ordering');
    resetIdleTimer();
  };

  const handleResetToAttract = () => {
    setCartItems([]);
    setCustomizingProduct(null);
    setIsCartDrawerOpen(false);
    setIsCheckoutOpen(false);
    setConfirmedOrder(null);
    setReceiptOrder(null);
    setIsReceiptOpen(false);
    setCurrentScreen('attract');
    setSearchQuery('');
    setSelectedCategory('combos');
  };

  // Add product to cart with full customization
  const handleAddToCart = (
    product: Product,
    quantity: number,
    customization: OrderItemCustomization
  ) => {
    const extrasTotal = customization.extras.reduce((acc, e) => acc + e.price, 0);
    const unitPrice = product.price + extrasTotal;
    const subtotal = unitPrice * quantity;

    const newItem: OrderItem = {
      cartItemId: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      productId: product.id,
      name: product.name,
      basePrice: product.price,
      price: unitPrice,
      quantity,
      image: product.image,
      customization,
      subtotal,
    };

    setCartItems((prev) => [...prev, newItem]);
    resetIdleTimer();
  };

  // Quick Add (with default settings)
  const handleQuickAdd = (product: Product) => {
    handleAddToCart(product, 1, {
      meatDoneness: product.allowMeatDoneness ? 'Ao Ponto' : undefined,
      extras: [],
      removals: [],
    });
  };

  // Update item quantity in cart
  const handleUpdateQuantity = (cartItemId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveItem(cartItemId);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          const subtotal = item.price * newQuantity;
          return { ...item, quantity: newQuantity, subtotal };
        }
        return item;
      })
    );
    resetIdleTimer();
  };

  const handleRemoveItem = (cartItemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
    resetIdleTimer();
  };

  const handleClearCart = () => {
    setCartItems([]);
    setIsCartDrawerOpen(false);
    resetIdleTimer();
  };

  // Proceed from Cart to Checkout
  const handleProceedToCheckout = () => {
    setIsCartDrawerOpen(false);
    setIsCheckoutOpen(true);
    resetIdleTimer();
  };

  // Final Order Confirmation: Save to Supabase and Send to n8n Webhook
  const handleConfirmOrder = async (orderDetails: {
    customerName: string;
    customerCpf?: string;
    tableNumber?: string;
    paymentMethod: PaymentMethod;
  }) => {
    setIsSubmittingOrder(true);

    try {
      // 1. Generate Order Identifiers
      const identifiers = getNextOrderIdentifiers();
      const subtotal = cartItems.reduce((acc, curr) => acc + curr.subtotal, 0);
      const discount = 0;
      const total = subtotal - discount;

      const newOrder: Order = {
        id: `ord_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        orderNumber: identifiers.orderNumber,
        displayPassword: identifiers.displayPassword,
        numericCode: identifiers.numericCode,
        diningOption,
        customerName: orderDetails.customerName,
        customerCpf: orderDetails.customerCpf,
        tableNumber: orderDetails.tableNumber,
        paymentMethod: orderDetails.paymentMethod,
        paymentStatus: 'pago',
        items: [...cartItems],
        subtotal,
        discount,
        total,
        createdAt: new Date().toISOString(),
        supabaseSync: {
          status: settings.supabaseUrl ? 'erro' : 'nao_configurado',
        },
        n8nSync: {
          status: settings.n8nWebhookUrl ? 'erro' : 'nao_configurado',
        },
      };

      // 2. Save to Supabase
      if (settings.supabaseUrl && settings.supabaseAnonKey) {
        try {
          const supabaseResult = await saveOrderToSupabase(newOrder, settings);
          if (supabaseResult.success) {
            newOrder.supabaseSync = {
              status: 'sucesso',
              recordId: supabaseResult.recordId,
              timestamp: new Date().toISOString(),
            };

            // If webhook is connected inside Supabase, mark n8n sync as handled via Supabase
            if (settings.webhookMode === 'supabase') {
              newOrder.n8nSync = {
                status: 'via_supabase',
                timestamp: new Date().toISOString(),
                note: 'Supabase Database Webhook acionado no INSERT da tabela pedidos',
              };
            }
          } else {
            newOrder.supabaseSync = {
              status: 'erro',
              error: supabaseResult.error,
              timestamp: new Date().toISOString(),
            };

            if (settings.webhookMode === 'supabase') {
              newOrder.n8nSync = {
                status: 'erro',
                error: 'Falha ao salvar no Supabase (o webhook do Supabase depende da gravação do pedido)',
              };
            }
          }
        } catch (supaErr: unknown) {
          newOrder.supabaseSync = {
            status: 'erro',
            error: String(supaErr),
            timestamp: new Date().toISOString(),
          };
          if (settings.webhookMode === 'supabase') {
            newOrder.n8nSync = {
              status: 'erro',
              error: 'Erro de conexão com o Supabase',
            };
          }
        }
      } else {
        newOrder.supabaseSync = {
          status: 'nao_configurado',
        };
        if (settings.webhookMode === 'supabase') {
          newOrder.n8nSync = {
            status: 'nao_configurado',
            note: 'Configure o Supabase no painel para acionar o n8n',
          };
        }
      }

      // 3. Send to n8n Webhook directly only if user chose 'direct' mode
      if (settings.webhookMode === 'direct') {
        if (settings.n8nWebhookUrl) {
          try {
            const n8nResult = await sendOrderToN8N(newOrder, settings);
            if (n8nResult.success) {
              newOrder.n8nSync = {
                status: 'sucesso',
                statusCode: n8nResult.statusCode || 200,
                timestamp: new Date().toISOString(),
              };
            } else {
              newOrder.n8nSync = {
                status: 'erro',
                error: n8nResult.error,
                timestamp: new Date().toISOString(),
              };
            }
          } catch (n8nErr: unknown) {
            newOrder.n8nSync = {
              status: 'erro',
              error: String(n8nErr),
              timestamp: new Date().toISOString(),
            };
          }
        } else {
          newOrder.n8nSync = {
            status: 'nao_configurado',
          };
        }
      }

      // 4. Save to persistent local storage for staff history
      saveOrderToLocalHistory(newOrder);

      // 5. Sound fanfare and display ticket
      soundService.playSuccess();
      setConfirmedOrder(newOrder);
      setIsCheckoutOpen(false);
      setCartItems([]);
    } catch (err) {
      console.error('Erro geral ao processar pedido:', err);
      alert('Houve um erro ao processar seu pedido. Por favor tente novamente.');
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  // Open receipt for specific order
  const handleOpenReceiptForOrder = (order: Order) => {
    setReceiptOrder(order);
    setIsReceiptOpen(true);
  };

  // Category counts
  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat.id] = MENU_PRODUCTS.filter((p) => p.category === cat.id).length;
    return acc;
  }, {} as Record<string, number>);

  // Filter products by category and search
  const filteredProducts = MENU_PRODUCTS.filter((prod) => {
    const matchesCategory = selectedCategory === prod.category;
    const matchesSearch =
      !searchQuery.trim() ||
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.description.toLowerCase().includes(searchQuery.toLowerCase());

    return searchQuery.trim() ? matchesSearch : matchesCategory;
  });

  const cartTotal = cartItems.reduce((acc, i) => acc + i.subtotal, 0);
  const cartItemCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="w-full min-h-screen bg-[#0e0e11] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* SCREEN 1: ATTRACT SCREEN (IDLE) */}
      {currentScreen === 'attract' && (
        <AttractScreen
          onStart={handleStartOrder}
          soundEnabled={settings.soundEnabled}
          onToggleSound={() => {
            const next = !settings.soundEnabled;
            const updated = { ...settings, soundEnabled: next };
            setSettings(updated);
            saveSettings(updated);
          }}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {/* SCREEN 2: ORDERING KIOSK INTERFACE */}
      {currentScreen === 'ordering' && (
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Header */}
          <Header
            diningOption={diningOption}
            onChangeDiningOption={() => setIsDiningModalOpen(true)}
            cartItemCount={cartItemCount}
            cartTotal={cartTotal}
            onOpenCart={() => setIsCartDrawerOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onResetOrder={handleResetToAttract}
            soundEnabled={settings.soundEnabled}
            onToggleSound={() => {
              const next = !settings.soundEnabled;
              const updated = { ...settings, soundEnabled: next };
              setSettings(updated);
              saveSettings(updated);
            }}
          />

          {/* Main Kiosk Area */}
          <div className="flex-1 flex flex-col lg:flex-row">
            {/* Category Navigation Bar */}
            <CategoryNav
              selectedCategory={selectedCategory}
              onSelectCategory={(catId) => {
                setSelectedCategory(catId);
                setSearchQuery('');
              }}
              productCounts={categoryCounts}
            />

            {/* Catalog Content Area */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
              {/* Category Title & Search Bar */}
              <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight uppercase">
                    {searchQuery
                      ? `Resultados para "${searchQuery}"`
                      : CATEGORIES.find((c) => c.id === selectedCategory)?.name || 'Cardápio'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
                    {searchQuery
                      ? `${filteredProducts.length} itens encontrados`
                      : CATEGORIES.find((c) => c.id === selectedCategory)?.description}
                  </p>
                </div>

                {/* Touch Search Bar */}
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar no cardápio..."
                    className="w-full bg-[#18181e] border border-white/10 rounded-xl pl-10 pr-9 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Products Grid */}
              {filteredProducts.length === 0 ? (
                <div className="p-12 text-center bg-white/[0.02] border border-white/10 rounded-3xl">
                  <Flame className="w-12 h-12 text-amber-500/50 mx-auto mb-3" />
                  <h3 className="text-lg font-bold text-white">Nenhum produto encontrado</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    Tente buscar por outro termo ou selecione uma categoria na barra lateral.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('combos');
                    }}
                    className="mt-4 px-4 py-2 rounded-xl bg-amber-500 text-black text-xs font-bold"
                  >
                    Ver Combos Principais
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onQuickAdd={handleQuickAdd}
                      onCustomize={(prod) => setCustomizingProduct(prod)}
                    />
                  ))}
                </div>
              )}
            </main>
          </div>

          {/* Sticky Bottom Quick Tray (When Cart has items) */}
          {cartItems.length > 0 && (
            <div className="sticky bottom-0 z-20 px-4 py-3 bg-[#121216]/95 backdrop-blur-md border-t border-amber-500/30 flex items-center justify-between gap-4 shadow-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold font-mono-numbers">
                  {cartItemCount}
                </div>
                <div>
                  <span className="text-xs text-slate-400 block uppercase font-bold tracking-wider">
                    Total do Pedido
                  </span>
                  <span className="font-mono-numbers text-xl font-black text-amber-400">
                    R$ {cartTotal.toFixed(2).replace('.', ',')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundService.playTap();
                    setIsCartDrawerOpen(true);
                  }}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-slate-300 transition-colors"
                >
                  Ver Itens
                </button>

                <button
                  onClick={() => {
                    soundService.playTap();
                    setIsCheckoutOpen(true);
                  }}
                  className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                >
                  <span>Concluir Pedido</span>
                  <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: Dining Option (Comer Aqui vs Para Levar) */}
      <DiningOptionModal
        isOpen={isDiningModalOpen}
        onSelect={handleSelectDiningOption}
        onCancel={() => {
          setIsDiningModalOpen(false);
          if (currentScreen === 'attract') {
            // Stay in attract screen
          }
        }}
      />

      {/* MODAL 2: Product Customization */}
      <ProductCustomizeModal
        product={customizingProduct}
        isOpen={!!customizingProduct}
        onClose={() => setCustomizingProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {/* MODAL 3: Cart Drawer / Review */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={handleProceedToCheckout}
        diningOption={diningOption}
      />

      {/* MODAL 4: Checkout & Payment Selection */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onBackToCart={() => {
          setIsCheckoutOpen(false);
          setIsCartDrawerOpen(true);
        }}
        items={cartItems}
        diningOption={diningOption}
        onConfirmOrder={handleConfirmOrder}
        isSubmitting={isSubmittingOrder}
      />

      {/* MODAL 5: Order Success & Big Ticket Number */}
      <OrderSuccessModal
        order={confirmedOrder}
        isOpen={!!confirmedOrder}
        onCloseAndReset={handleResetToAttract}
        onOpenReceipt={() => {
          if (confirmedOrder) {
            handleOpenReceiptForOrder(confirmedOrder);
          }
        }}
      />

      {/* MODAL 6: Printable Thermal Receipt */}
      <ReceiptModal
        order={receiptOrder}
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
      />

      {/* MODAL 7: Settings (Supabase & n8n Webhook Configuration) */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
        onSelectOrderForReceipt={handleOpenReceiptForOrder}
      />
    </div>
  );
}
