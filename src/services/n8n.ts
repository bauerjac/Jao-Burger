import { Order, AppSettings } from '../types';

export interface N8NWebhookPayload {
  event: 'novo_pedido_totem';
  restaurante: {
    nome: string;
    unidade: string;
    totem_id: string;
  };
  pedido: {
    id: string;
    numero_pedido: string;
    senha_painel: string;
    data_hora: string;
    tipo_entrega: {
      codigo: 'comer_no_local' | 'para_levar';
      descricao: string;
    };
    forma_pagamento: {
      codigo: string;
      descricao: string;
      status: string;
    };
    cliente: {
      nome: string;
      cpf: string | null;
      mesa: string | null;
    };
    itens: Array<{
      produto_id: string;
      nome: string;
      quantidade: number;
      preco_unitario: number;
      subtotal: number;
      ponto_carne?: string | null;
      adicionais: Array<{ id: string; nome: string; preco: number }>;
      remocoes: string[];
      observacao?: string | null;
    }>;
    totais: {
      subtotal: number;
      desconto: number;
      total: number;
      quantidade_itens_total: number;
    };
    observacoes_gerais?: string | null;
  };
}

export async function sendOrderToN8N(
  order: Order,
  settings: AppSettings
): Promise<{ success: boolean; statusCode?: number; error?: string }> {
  const webhookUrl = settings.n8nWebhookUrl?.trim();

  if (!webhookUrl) {
    return {
      success: false,
      error: 'URL do Webhook do n8n não configurada.',
    };
  }

  const payload: N8NWebhookPayload = {
    event: 'novo_pedido_totem',
    restaurante: {
      nome: settings.restaurantName || 'Jão Burger',
      unidade: 'Unidade Principal',
      totem_id: settings.kioskId || 'TOTEM-01',
    },
    pedido: {
      id: order.id,
      numero_pedido: order.orderNumber,
      senha_painel: order.displayPassword,
      data_hora: order.createdAt || new Date().toISOString(),
      tipo_entrega: {
        codigo: order.diningOption,
        descricao: order.diningOption === 'comer_no_local' ? 'Comer no Local' : 'Para Levar',
      },
      forma_pagamento: {
        codigo: order.paymentMethod,
        descricao: getPaymentMethodLabel(order.paymentMethod),
        status: order.paymentStatus,
      },
      cliente: {
        nome: order.customerName || 'Cliente Totem',
        cpf: order.customerCpf || null,
        mesa: order.tableNumber || null,
      },
      itens: order.items.map((item) => ({
        produto_id: item.productId,
        nome: item.name,
        quantidade: item.quantity,
        preco_unitario: Number(item.price.toFixed(2)),
        subtotal: Number(item.subtotal.toFixed(2)),
        ponto_carne: item.customization?.meatDoneness || null,
        adicionais: item.customization?.extras?.map((e) => ({
          id: e.id,
          nome: e.name,
          preco: e.price,
        })) || [],
        remocoes: item.customization?.removals || [],
        observacao: item.customization?.notes || null,
      })),
      totais: {
        subtotal: Number(order.subtotal.toFixed(2)),
        desconto: Number(order.discount.toFixed(2)),
        total: Number(order.total.toFixed(2)),
        quantidade_itens_total: order.items.reduce((acc, curr) => acc + curr.quantity, 0),
      },
      observacoes_gerais: order.notes || null,
    },
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12s timeout

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Source': 'JaoBurger-Totem',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      return {
        success: false,
        statusCode: response.status,
        error: `Webhook retornou HTTP ${response.status}: ${errText.slice(0, 120)}`,
      };
    }

    return {
      success: true,
      statusCode: response.status,
    };
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      return {
        success: false,
        error: 'Tempo limite esgotado (timeout de 12s) ao conectar com o n8n.',
      };
    }

    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: `Erro ao enviar para webhook n8n: ${msg}. Verifique CORS ou URL ativa.`,
    };
  }
}

export async function testN8NWebhook(webhookUrl: string): Promise<{ success: boolean; message: string; statusCode?: number }> {
  if (!webhookUrl || !webhookUrl.trim()) {
    return { success: false, message: 'Insira a URL do Webhook do n8n para testar.' };
  }

  const testPayload = {
    event: 'teste_conexao_totem',
    origem: 'Jão Burger Totem Autoatendimento',
    timestamp: new Date().toISOString(),
    mensagem: 'Ping de teste de conectividade entre o Totem e o fluxo n8n.',
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      return {
        success: true,
        statusCode: response.status,
        message: `Conexão bem sucedida! n8n respondeu com status HTTP ${response.status}.`,
      };
    } else {
      return {
        success: false,
        statusCode: response.status,
        message: `O webhook do n8n respondeu com erro HTTP ${response.status}. Certifique-se de que o workflow está ativo ou em modo "Listen for test event".`,
      };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Não foi possível alcançar o webhook: ${msg}. (Dica: Se estiver rodando n8n localmente ou via ngrok/cloud, certifique-se que o CORS está habilitado no n8n)`,
    };
  }
}

function getPaymentMethodLabel(method: string): string {
  switch (method) {
    case 'cartao_credito':
      return 'Cartão de Crédito';
    case 'cartao_debito':
      return 'Cartão de Débito';
    case 'pix':
      return 'Pix QR Code';
    case 'balcao':
      return 'Pagamento no Caixa / Balcão';
    default:
      return method;
  }
}
