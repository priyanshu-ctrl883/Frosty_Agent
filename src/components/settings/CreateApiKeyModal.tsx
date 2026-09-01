'use client';

import React, { useState } from 'react';
import { Key, Copy, Check, ShieldAlert, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/lib/toast';

interface CreateApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyCreated: (newKey: {
    id: string;
    name: string;
    keyMasked: string;
    rawKey?: string;
    scopes: string[];
    createdAt: string;
  }) => void;
}

const AVAILABLE_SCOPES = [
  { id: 'agent:chat', label: 'Agent Chat & Conversations', desc: 'Allows sending and reading visitor chat turns via API' },
  { id: 'leads:read', label: 'Leads & CRM Read', desc: 'Retrieve collected visitor contact details and qualification metadata' },
  { id: 'quotes:manage', label: 'Quotation Management', desc: 'Read and generate autonomous price quotes and line items' },
  { id: 'webhooks:subscribe', label: 'Webhook Event Streams', desc: 'Receive real-time push events for handoffs and hot leads' },
];

export function CreateApiKeyModal({ isOpen, onClose, onKeyCreated }: CreateApiKeyModalProps) {
  const { success: toastSuccess } = useToast();
  const [keyName, setKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['agent:chat', 'leads:read']);
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleToggleScope = (scopeId: string) => {
    setSelectedScopes(prev =>
      prev.includes(scopeId) ? prev.filter(s => s !== scopeId) : [...prev, scopeId]
    );
  };

  const handleCreate = () => {
    if (!keyName.trim()) return;
    setIsCreating(true);

    // Generate secure simulated enterprise API secret key
    setTimeout(() => {
      const randomSuffix = Array.from({ length: 32 }, () =>
        Math.random().toString(36)[2] || 'x'
      ).join('');
      const fullKey = `frosty_sec_live_${randomSuffix}`;
      const maskedKey = `frosty_sec_live_${randomSuffix.slice(0, 4)}••••••••••••${randomSuffix.slice(-4)}`;

      setGeneratedKey(fullKey);
      setIsCreating(false);

      onKeyCreated({
        id: `key_${Date.now().toString(36)}`,
        name: keyName.trim(),
        keyMasked: maskedKey,
        rawKey: fullKey,
        scopes: [...selectedScopes],
        createdAt: new Date().toISOString(),
      });
    }, 400);
  };

  const handleCopy = () => {
    if (!generatedKey) return;
    navigator.clipboard.writeText(generatedKey);
    setCopied(true);
    toastSuccess('API secret key copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleResetAndClose = () => {
    setKeyName('');
    setSelectedScopes(['agent:chat', 'leads:read']);
    setGeneratedKey(null);
    setCopied(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-border rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border bg-muted/10">
          <div className="flex items-center gap-3">
            <Key size={22} className="text-[#0396A6] shrink-0" />
            <div>
              <h3 className="text-base font-black text-foreground">
                {generatedKey ? 'API Key Generated' : 'Create New API Key'}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {generatedKey
                  ? 'Store this secret securely. It will not be shown again.'
                  : 'Generate a scoped API credential for programmatic workspace access.'}
              </p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {!generatedKey ? (
            <>
              {/* Key Name */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  KEY NAME / IDENTIFIER <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={keyName}
                  onChange={e => setKeyName(e.target.value)}
                  placeholder="e.g. Production Backend CRM / Zapier Ingestion"
                  className="w-full px-4 py-2.5 bg-muted/20 border border-border rounded-xl text-xs font-bold text-foreground outline-none focus:border-[#0396A6] transition-colors"
                  autoFocus
                />
              </div>

              {/* Scopes Selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  ACCESS SCOPES &amp; PERMISSIONS
                </label>
                <div className="space-y-2">
                  {AVAILABLE_SCOPES.map(scope => {
                    const isChecked = selectedScopes.includes(scope.id);
                    return (
                      <div
                        key={scope.id}
                        onClick={() => handleToggleScope(scope.id)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isChecked
                            ? 'bg-[#0396A6]/5 border-[#0396A6]/40'
                            : 'bg-muted/10 border-border hover:bg-muted/20'
                        }`}
                      >
                        <div
                          className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-[#0396A6] border-[#0396A6] text-white'
                              : 'border-muted-foreground/40 bg-white'
                          }`}
                        >
                          {isChecked && <Check size={12} strokeWidth={3} />}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-foreground">{scope.label}</div>
                          <p className="text-[11px] text-muted-foreground mt-0.5">{scope.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Generated Secret Key Alert & Display */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold">
                  <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                  <span>Copy your API secret key now</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  For security reasons, this secret key will <strong>never be shown in full again</strong>. If you lose it, you will need to regenerate a new key.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  GENERATED API SECRET KEY
                </label>
                <div className="flex items-center gap-2 p-3 bg-muted/30 border border-border rounded-xl font-mono text-xs font-bold text-foreground break-all">
                  <span className="flex-1 select-all">{generatedKey}</span>
                  <button
                    onClick={handleCopy}
                    type="button"
                    className="p-2 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white transition-colors shrink-0 flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>Key <strong>{keyName}</strong> successfully configured with {selectedScopes.length} scopes.</span>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-end gap-2.5">
          {!generatedKey ? (
            <>
              <button
                type="button"
                onClick={handleResetAndClose}
                className="px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!keyName.trim() || selectedScopes.length === 0 || isCreating}
                className="px-5 py-2.5 bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles size={14} />
                <span>{isCreating ? 'Generating...' : 'Generate API Key'}</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleResetAndClose}
              className="px-6 py-2.5 bg-[#0396A6] hover:bg-[#087681] text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-xs transition-all active:scale-98 cursor-pointer"
            >
              Done &amp; Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
