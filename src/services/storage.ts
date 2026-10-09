import { AppSettings, Order } from '../types';

const SETTINGS_KEY = 'jao_burger_kiosk_settings_v1';
const ORDERS_KEY = 'jao_burger_kiosk_orders_v1';
const COUNTER_KEY = 'jao_burger_kiosk_counter_v1';

export function getInitialSettings(): AppSettings {
  const envUrl = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_SUPABASE_ANON_KEY || '';
  const envN8n = (import.meta as unknown as { env?: Record<string, string> }).env?.VITE_N8N_WEBHOOK_URL || '';

  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        supabaseUrl: parsed.supabaseUrl || envUrl,
        supabaseAnonKey: parsed.supabaseAnonKey || envKey,
        n8nWebhookUrl: parsed.n8nWebhookUrl || envN8n,
        webhookMode: parsed.webhookMode || 'supabase',
        soundEnabled: parsed.soundEnabled !== undefined ? parsed.soundEnabled : true,
        idleTimeoutSeconds: parsed.idleTimeoutSeconds || 60,
        restaurantName: parsed.restaurantName || 'Jão Burger',
        kioskId: parsed.kioskId || 'TOTEM-01',
      };
    }
  } catch (e) {
    console.error('Falha ao ler configurações do localStorage:', e);
  }

  return {
    supabaseUrl: envUrl,
    supabaseAnonKey: envKey,
    n8nWebhookUrl: envN8n,
    webhookMode: 'supabase',
    soundEnabled: true,
    idleTimeoutSeconds: 60,
    restaurantName: 'Jão Burger',
    kioskId: 'TOTEM-01',
  };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error('Erro ao salvar configurações:', e);
  }
}

export function getNextOrderIdentifiers(): { orderNumber: string; displayPassword: string; numericCode: number } {
  const today = new Date().toISOString().slice(0, 10);
  let counter = 1;

  try {
    const raw = localStorage.getItem(COUNTER_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data.date === today) {
        counter = (data.count || 0) + 1;
      }
    }
  } catch {
    counter = 1;
  }

  try {
    localStorage.setItem(COUNTER_KEY, JSON.stringify({ date: today, count: counter }));
  } catch {
    // Ignore storage errors
  }

  const padded = String(counter).padStart(3, '0');
  return {
    orderNumber: `JB-${padded}`,
    displayPassword: `#${padded}`,
    numericCode: counter,
  };
}

export function saveOrderToLocalHistory(order: Order): void {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    const orders: Order[] = raw ? JSON.parse(raw) : [];
    // Keep last 50 orders
    orders.unshift(order);
    if (orders.length > 50) orders.pop();
    localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
  } catch (e) {
    console.error('Erro ao salvar pedido no histórico local:', e);
  }
}

export function getLocalOrderHistory(): Order[] {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateOrderInLocalHistory(orderId: string, updates: Partial<Order>): void {
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return;
    const orders: Order[] = JSON.parse(raw);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updates };
      localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
    }
  } catch (e) {
    console.error('Erro ao atualizar histórico:', e);
  }
}
