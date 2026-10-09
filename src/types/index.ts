export interface ProductExtra {
  id: string;
  name: string;
  price: number;
}

export interface Product {
  id: string;
  name: string;
  category: 'combos' | 'smash' | 'artesanais' | 'acompanhamentos' | 'bebidas' | 'sobremesas' | 'molhos';
  price: number;
  description: string;
  image: string;
  isPopular?: boolean;
  isNew?: boolean;
  preparationTime?: string;
  calories?: number;
  allowMeatDoneness?: boolean;
  availableExtras?: ProductExtra[];
  availableRemovals?: string[];
}

export interface OrderItemCustomization {
  meatDoneness?: 'Mal Passado' | 'Ao Ponto' | 'Bem Passado';
  extras: ProductExtra[];
  removals: string[];
  notes?: string;
}

export interface OrderItem {
  cartItemId: string; // unique ID in cart
  productId: string;
  name: string;
  price: number; // base price + extras
  basePrice: number;
  quantity: number;
  image: string;
  customization: OrderItemCustomization;
  subtotal: number;
}

export type DiningOption = 'comer_no_local' | 'para_levar';

export type PaymentMethod = 'cartao_credito' | 'cartao_debito' | 'pix' | 'balcao';

export interface Order {
  id: string;
  orderNumber: string; // e.g. "JB-042"
  displayPassword: string; // e.g. "#042"
  numericCode: number;
  diningOption: DiningOption;
  customerName: string;
  customerCpf?: string;
  tableNumber?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pago' | 'aguardando_pagamento';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string;
  createdAt: string;
  supabaseSync: {
    status: 'sucesso' | 'erro' | 'nao_configurado';
    error?: string;
    recordId?: string;
    timestamp?: string;
  };
  n8nSync: {
    status: 'sucesso' | 'erro' | 'nao_configurado' | 'via_supabase';
    error?: string;
    statusCode?: number;
    timestamp?: string;
    note?: string;
  };
}

export type WebhookMode = 'supabase' | 'direct';

export interface AppSettings {
  supabaseUrl: string;
  supabaseAnonKey: string;
  n8nWebhookUrl: string;
  webhookMode: WebhookMode; // 'supabase' (recomendado: disparado pelo Supabase via Database Webhook) ou 'direct' (pelo totem)
  soundEnabled: boolean;
  idleTimeoutSeconds: number;
  restaurantName: string;
  kioskId: string;
}
