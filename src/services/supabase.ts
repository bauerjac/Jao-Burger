import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Order, AppSettings } from '../types';

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabaseClient(settings: AppSettings): SupabaseClient | null {
  const url = settings.supabaseUrl?.trim();
  const key = settings.supabaseAnonKey?.trim();

  if (!url || !key) {
    return null;
  }

  // Basic validation
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error('Erro ao inicializar Supabase Client:', err);
    return null;
  }
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !key) {
      return { success: false, message: 'URL e Chave Anon do Supabase são obrigatórias.' };
    }

    const client = createClient(url, key, {
      auth: { persistSession: false },
    });

    // Test a lightweight query
    const { error } = await client.from('pedidos').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, it's still a reachable database!
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Conectado ao Supabase com sucesso! A tabela "pedidos" ainda precisa ser criada (utilize o botão "Copiar SQL" abaixo).',
        };
      }
      return { success: false, message: `Erro ao consultar Supabase: ${error.message}` };
    }

    return { success: true, message: 'Conexão com Supabase validada e tabela "pedidos" pronta!' };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: `Falha na requisição ao Supabase: ${msg}` };
  }
}

export async function saveOrderToSupabase(
  order: Order,
  settings: AppSettings
): Promise<{ success: boolean; recordId?: string; error?: string }> {
  const client = getSupabaseClient(settings);

  if (!client) {
    return {
      success: false,
      error: 'Supabase não configurado (URL ou Chave Anon ausente).',
    };
  }

  try {
    // 1. Inserir registro principal em "pedidos"
    const orderData = {
      numero_pedido: order.orderNumber,
      senha_totem: order.displayPassword,
      cliente_nome: order.customerName || 'Cliente Totem',
      cliente_cpf: order.customerCpf || null,
      mesa: order.tableNumber || null,
      tipo_entrega: order.diningOption,
      forma_pagamento: order.paymentMethod,
      status_pagamento: order.paymentStatus,
      status_pedido: 'recebido',
      subtotal: Number(order.subtotal.toFixed(2)),
      desconto: Number(order.discount.toFixed(2)),
      total: Number(order.total.toFixed(2)),
      observacoes: order.notes || null,
      origem: 'totem_autoatendimento',
      totem_id: settings.kioskId || 'TOTEM-01',
      created_at: order.createdAt || new Date().toISOString(),
    };

    const { data: insertedOrder, error: orderError } = await client
      .from('pedidos')
      .insert([orderData])
      .select('id')
      .single();

    if (orderError) {
      throw new Error(`Falha ao salvar na tabela 'pedidos': ${orderError.message} (${orderError.code || ''})`);
    }

    const orderId = insertedOrder?.id || order.id;

    // 2. Inserir itens em "itens_pedido"
    if (order.items && order.items.length > 0) {
      const itemsData = order.items.map((item) => ({
        pedido_id: orderId,
        produto_id: item.productId,
        nome_produto: item.name,
        quantidade: item.quantity,
        preco_unitario: Number(item.price.toFixed(2)),
        subtotal: Number(item.subtotal.toFixed(2)),
        ponto_carne: item.customization?.meatDoneness || null,
        adicionais: item.customization?.extras || [],
        remocoes: item.customization?.removals || [],
        observacao: item.customization?.notes || null,
      }));

      const { error: itemsError } = await client
        .from('itens_pedido')
        .insert(itemsData);

      if (itemsError) {
        console.warn('Aviso: Pedido salvo, mas houve erro ao salvar itens_pedido:', itemsError);
        // We still consider the order saved with partial warning
      }
    }

    return {
      success: true,
      recordId: String(orderId),
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Erro ao salvar pedido no Supabase:', errorMsg);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export const SUPABASE_SQL_SCHEMA = `-- ============================================================
-- SQL PARA CONFIGURAÇÃO NO SUPABASE (JÃO BURGER TOTEM)
-- Execute este script no SQL Editor do seu projeto Supabase
-- ============================================================

-- 1. Criação da Tabela de Pedidos
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  numero_pedido text not null,
  senha_totem text,
  cliente_nome text default 'Cliente Totem',
  cliente_cpf text,
  mesa text,
  tipo_entrega text not null, -- 'comer_no_local' ou 'para_levar'
  forma_pagamento text not null, -- 'cartao_credito', 'cartao_debito', 'pix', 'balcao'
  status_pagamento text default 'pago',
  status_pedido text default 'recebido',
  subtotal numeric(10,2) not null,
  desconto numeric(10,2) default 0,
  total numeric(10,2) not null,
  observacoes text,
  origem text default 'totem_autoatendimento',
  totem_id text default 'TOTEM-01',
  created_at timestamptz default now()
);

-- 2. Criação da Tabela de Itens do Pedido
create table if not exists itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid references pedidos(id) on delete cascade,
  produto_id text not null,
  nome_produto text not null,
  quantidade integer not null default 1,
  preco_unitario numeric(10,2) not null,
  subtotal numeric(10,2) not null,
  ponto_carne text,
  adicionais jsonb default '[]'::jsonb,
  remocoes jsonb default '[]'::jsonb,
  observacao text,
  created_at timestamptz default now()
);

-- 3. Habilitação de RLS e Políticas Permissivas para Totem
alter table pedidos enable row level security;
alter table itens_pedido enable row level security;

-- Políticas de Leitura e Inserção para Anon Key
create policy "Permitir insercao anonima pedidos" on pedidos for insert with check (true);
create policy "Permitir leitura pedidos" on pedidos for select using (true);

create policy "Permitir insercao anonima itens" on itens_pedido for insert with check (true);
create policy "Permitir leitura itens" on itens_pedido for select using (true);

-- Índices para performance
create index if not exists idx_pedidos_created_at on pedidos (created_at desc);
create index if not exists idx_itens_pedido_id on itens_pedido (pedido_id);

-- ============================================================
-- 4. INTEGRAÇÃO COM N8N DIRETAMENTE PELO SUPABASE
-- ============================================================
-- Você pode configurar de 2 formas no Supabase:
--
-- FORMA 1 (Pelo Painel do Supabase - Recomendado):
-- 1. No menu lateral do Supabase, clique em "Database" -> "Webhooks"
-- 2. Clique em "Create a new webhook"
-- 3. Nome: "n8n_novo_pedido"
-- 4. Table: "pedidos"
-- 5. Events: marque apenas "Insert"
-- 6. Type: "HTTP Request" | Method: "POST"
-- 7. URL: Cole o webhook do seu fluxo n8n
-- 8. Pronto! Todo pedido inserido pelo totem dispara o n8n na hora.
--
-- FORMA 2 (Via SQL Trigger com pg_net):
-- Descomente as linhas abaixo se preferir configurar via SQL:
/*
create extension if not exists pg_net;

create or replace function public.disparar_webhook_n8n_pedido()
returns trigger
language plpgsql
security definer
as $$
declare
  webhook_url text := 'COLE_AQUI_SUA_URL_DO_N8N';
begin
  perform net.http_post(
    url := webhook_url,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := jsonb_build_object(
      'event', 'novo_pedido_totem',
      'id', NEW.id,
      'numero_pedido', NEW.numero_pedido,
      'senha_totem', NEW.senha_totem,
      'cliente_nome', NEW.cliente_nome,
      'tipo_entrega', NEW.tipo_entrega,
      'forma_pagamento', NEW.forma_pagamento,
      'total', NEW.total,
      'mesa', NEW.mesa,
      'created_at', NEW.created_at
    )
  );
  return NEW;
end;
$$;

drop trigger if exists trigger_pedidos_n8n on public.pedidos;
create trigger trigger_pedidos_n8n
  after insert on public.pedidos
  for each row
  execute function public.disparar_webhook_n8n_pedido();
*/
`;
