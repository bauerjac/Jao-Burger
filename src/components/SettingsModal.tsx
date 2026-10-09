import React, { useState } from 'react';
import { AppSettings, Order } from '../types';
import {
  X,
  Database,
  Send,
  Save,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  History,
  Volume2,
  VolumeX,
  Clock,
  Printer,
  RefreshCw,
} from 'lucide-react';
import { testSupabaseConnection, SUPABASE_SQL_SCHEMA } from '../services/supabase';
import { testN8NWebhook, sendOrderToN8N } from '../services/n8n';
import { soundService } from '../services/sound';
import { getLocalOrderHistory } from '../services/storage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onSelectOrderForReceipt: (order: Order) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onSelectOrderForReceipt,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'integrations' | 'history' | 'sql'>('integrations');
  const [formData, setFormData] = useState<AppSettings>({ ...settings });

  // Supabase test state
  const [testingSupabase, setTestingSupabase] = useState(false);
  const [supabaseTestResult, setSupabaseTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // n8n test state
  const [testingN8N, setTestingN8N] = useState(false);
  const [n8nTestResult, setN8nTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Copy SQL state
  const [copiedSql, setCopiedSql] = useState(false);

  // Order history state
  const [orderHistory, setOrderHistory] = useState<Order[]>(getLocalOrderHistory());
  const [retestingOrderId, setRetestingOrderId] = useState<string | null>(null);

  const handleTestSupabase = async () => {
    soundService.playTap();
    setTestingSupabase(true);
    setSupabaseTestResult(null);
    try {
      const res = await testSupabaseConnection(formData.supabaseUrl, formData.supabaseAnonKey);
      setSupabaseTestResult(res);
    } catch (e: unknown) {
      setSupabaseTestResult({ success: false, message: String(e) });
    } finally {
      setTestingSupabase(false);
    }
  };

  const handleTestN8N = async () => {
    soundService.playTap();
    setTestingN8N(true);
    setN8nTestResult(null);
    try {
      const res = await testN8NWebhook(formData.n8nWebhookUrl);
      setN8nTestResult(res);
    } catch (e: unknown) {
      setN8nTestResult({ success: false, message: String(e) });
    } finally {
      setTestingN8N(false);
    }
  };

  const handleCopySql = () => {
    soundService.playTap();
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSave = () => {
    soundService.playTap();
    onSaveSettings(formData);
    onClose();
  };

  const handleResendOrderToN8N = async (order: Order) => {
    soundService.playTap();
    setRetestingOrderId(order.id);
    try {
      const res = await sendOrderToN8N(order, formData);
      alert(
        res.success
          ? `Disparado com sucesso! n8n respondeu status HTTP ${res.statusCode || 200}`
          : `Erro ao enviar: ${res.error}`
      );
    } catch (e: unknown) {
      alert(`Falha: ${String(e)}`);
    } finally {
      setRetestingOrderId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#16161b] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Top Bar */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#121215] shrink-0">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
              <span>Painel de Integrações e Totem</span>
            </h3>
            <p className="text-xs text-slate-400">
              Configure Supabase, Webhook do n8n e parâmetros do Totem Jão Burger
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 px-6 bg-white/[0.02] shrink-0">
          <button
            onClick={() => setActiveTab('integrations')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'integrations'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Integrações (Supabase & n8n)
          </button>

          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === 'sql'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Script SQL Supabase
          </button>

          <button
            onClick={() => {
              setActiveTab('history');
              setOrderHistory(getLocalOrderHistory());
            }}
            className={`py-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Pedidos Recentes ({orderHistory.length})</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'integrations' && (
            <>
              {/* ARCHITECTURE SELECTOR */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider text-amber-400 block">
                    Arquitetura de Conexão com o n8n
                  </span>
                  <p className="text-xs text-slate-200 mt-0.5">
                    Onde o webhook do n8n será disparado?
                  </p>
                </div>

                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundService.playTick();
                      setFormData({ ...formData, webhookMode: 'supabase' });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      formData.webhookMode === 'supabase'
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    No Supabase (Recomendado)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundService.playTick();
                      setFormData({ ...formData, webhookMode: 'direct' });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      formData.webhookMode === 'direct'
                        ? 'bg-amber-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Direto pelo Totem
                  </button>
                </div>
              </div>

              {/* SECTION 1: SUPABASE */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <Database className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Banco de Dados Supabase</h4>
                      <p className="text-[11px] text-slate-400">
                        O totem grava os pedidos aqui e o Supabase dispara para o n8n
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestSupabase}
                    disabled={testingSupabase}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testingSupabase ? (
                      <>
                        <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                        <span>Testando...</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Testar Conexão</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Project URL do Supabase
                    </label>
                    <input
                      type="url"
                      value={formData.supabaseUrl}
                      onChange={(e) => setFormData({ ...formData, supabaseUrl: e.target.value })}
                      placeholder="https://xyzcompany.supabase.co"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Chave Anônima Pública (Anon Key)
                    </label>
                    <input
                      type="password"
                      value={formData.supabaseAnonKey}
                      onChange={(e) => setFormData({ ...formData, supabaseAnonKey: e.target.value })}
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {supabaseTestResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      supabaseTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-500/10 border-red-500/30 text-red-300'
                    }`}
                  >
                    {supabaseTestResult.success ? (
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    )}
                    <span>{supabaseTestResult.message}</span>
                  </div>
                )}
              </div>

              {/* HOW TO CONNECT WEBHOOK IN SUPABASE (GUIDE CARD) */}
              {formData.webhookMode === 'supabase' ? (
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-amber-500/30 space-y-3">
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4 text-amber-400" />
                    <h4 className="text-sm font-bold text-white uppercase tracking-wider">
                      Como Conectar o Webhook do n8n no Supabase
                    </h4>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Você configurará o Webhook diretamente no painel do Supabase. Assim, quando o totem salvar um pedido em <code className="text-amber-300">pedidos</code>, o próprio servidor do Supabase chamará seu n8n instantaneamente:
                  </p>

                  <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside pl-1 bg-black/40 p-3 rounded-xl border border-white/5">
                    <li>
                      Acesse seu projeto no painel do <strong>Supabase</strong>.
                    </li>
                    <li>
                      No menu lateral esquerdo, vá em <strong>Database</strong> &rarr; <strong>Webhooks</strong>.
                    </li>
                    <li>
                      Clique em <strong>&quot;Create a new webhook&quot;</strong>.
                    </li>
                    <li>
                      <strong>Name:</strong> <span className="font-mono text-white">n8n_novo_pedido</span>
                    </li>
                    <li>
                      <strong>Table:</strong> Selecione <span className="font-mono text-amber-300">pedidos</span>
                    </li>
                    <li>
                      <strong>Events:</strong> Selecione apenas <span className="font-bold text-emerald-400">Insert</span>.
                    </li>
                    <li>
                      <strong>Webhook configuration:</strong> Type: <strong>HTTP Request</strong> &bull; Method: <strong>POST</strong>
                    </li>
                    <li>
                      <strong>URL:</strong> Cole a URL do seu Webhook Node no n8n.
                    </li>
                    <li>
                      Clique em <strong>Save</strong>. Pronto! O n8n receberá o registro completo a cada novo pedido emitido pelo totem.
                    </li>
                  </ol>
                </div>
              ) : (
                /* SECTION 2: DIRECT n8n WEBHOOK */
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                        <Send className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Webhook n8n (Direto do Totem)</h4>
                        <p className="text-[11px] text-slate-400">
                          Dispara evento JSON após a confirmação do pedido
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestN8N}
                      disabled={testingN8N}
                      className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {testingN8N ? (
                        <>
                          <span className="w-3 h-3 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                          <span>Enviando teste...</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-amber-400" />
                          <span>Testar Webhook</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      URL do Webhook (n8n Webhook Node)
                    </label>
                    <input
                      type="url"
                      value={formData.n8nWebhookUrl}
                      onChange={(e) => setFormData({ ...formData, n8nWebhookUrl: e.target.value })}
                      placeholder="https://n8n.seuservidor.com/webhook/jao-burger-pedidos"
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <p className="text-[11px] text-slate-500 mt-1">
                      Método utilizado: <span className="font-mono text-slate-300">POST</span> &bull; Content-Type: <span className="font-mono text-slate-300">application/json</span>
                    </p>
                  </div>

                  {n8nTestResult && (
                    <div
                      className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                        n8nTestResult.success
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}
                    >
                      {n8nTestResult.success ? (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                      )}
                      <span>{n8nTestResult.message}</span>
                    </div>
                  )}
                </div>
              )}

              {/* SECTION 3: TOTEM BEHAVIOR */}
              <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <h4 className="text-sm font-bold text-white">Configurações Gerais do Totem</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Identificador do Totem
                    </label>
                    <input
                      type="text"
                      value={formData.kioskId}
                      onChange={(e) => setFormData({ ...formData, kioskId: e.target.value })}
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-300 block mb-1 font-medium">
                      Tempo de Inatividade (segundos)
                    </label>
                    <input
                      type="number"
                      min={20}
                      max={300}
                      value={formData.idleTimeoutSeconds}
                      onChange={(e) =>
                        setFormData({ ...formData, idleTimeoutSeconds: Number(e.target.value) || 60 })
                      }
                      className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-xs text-white"
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <button
                      type="button"
                      onClick={() =>
                        setFormData({ ...formData, soundEnabled: !formData.soundEnabled })
                      }
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                        formData.soundEnabled
                          ? 'bg-amber-500/15 border-amber-500 text-amber-300'
                          : 'bg-white/5 border-white/10 text-slate-400'
                      }`}
                    >
                      {formData.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      <span>{formData.soundEnabled ? 'Sons do Totem Ativos' : 'Sons Silenciados'}</span>
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'sql' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Esquema das Tabelas no Supabase</h4>
                  <p className="text-xs text-slate-400">
                    Copie e cole este script no <strong>SQL Editor</strong> do seu painel Supabase para criar as tabelas `pedidos` e `itens_pedido` com as permissões corretas.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-2 transition-colors shadow-md"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Script SQL</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-2xl bg-zinc-950 border border-white/10 text-slate-300 font-mono text-xs overflow-x-auto leading-relaxed max-h-96">
                {SUPABASE_SQL_SCHEMA}
              </pre>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-white">Histórico de Pedidos no Totem</h4>
                  <p className="text-xs text-slate-400">
                    Últimos pedidos emitidos neste terminal
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setOrderHistory(getLocalOrderHistory())}
                  className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-slate-300 flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Atualizar</span>
                </button>
              </div>

              {orderHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-400 bg-white/[0.02] border border-white/10 rounded-2xl">
                  Nenhum pedido realizado recentemente.
                </div>
              ) : (
                <div className="space-y-3">
                  {orderHistory.map((ord) => (
                    <div
                      key={ord.id}
                      className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono-numbers font-black text-amber-400 text-sm">
                            {ord.displayPassword}
                          </span>
                          <span className="text-slate-400 font-mono">({ord.orderNumber})</span>
                          <span className="text-white font-bold">{ord.customerName}</span>
                          <span className="text-slate-500">•</span>
                          <span className="text-slate-400">
                            {ord.diningOption === 'comer_no_local' ? 'Comer Aqui' : 'Levar'}
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px] mt-1">
                          {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(' | ')}
                        </p>
                        <p className="text-slate-500 text-[10px] mt-0.5 font-mono">
                          {new Date(ord.createdAt).toLocaleTimeString('pt-BR')} • Total: R$ {ord.total.toFixed(2).replace('.', ',')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectOrderForReceipt(ord);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 flex items-center gap-1 text-[11px]"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Cupom</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResendOrderToN8N(ord)}
                          disabled={retestingOrderId === ord.id}
                          className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1 text-[11px] disabled:opacity-50"
                        >
                          <Send className="w-3 h-3" />
                          <span>{retestingOrderId === ord.id ? 'Enviando...' : 'Reenviar n8n'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-6 bg-[#121215] border-t border-white/10 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-500">
            Alterações são salvas com persistência local no totem.
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs transition-colors"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs flex items-center gap-2 transition-all shadow-md active:scale-95"
            >
              <Save className="w-4 h-4 stroke-[2.5]" />
              <span>Salvar Configurações</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
