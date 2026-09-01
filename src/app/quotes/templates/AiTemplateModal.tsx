"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Sparkles, X, Wand2, Check, Loader2, Lightbulb, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { apiRequest } from "@/lib/api";

type GeneratedTemplate = {
  name: string;
  intro: string;
  terms: string;
  footer: string;
  validity_days: number;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (template: {
    name: string;
    intro: string;
    terms: string;
    footer: string;
    validity_days: string;
  }) => void;
  companyName?: string;
};

const PROMPT_SUGGESTIONS = [
  "Car detailing studio offering ceramic coating with 6-month warranty and 10-day validity",
  "Wedding photography package with drone coverage, 50% advance and 15-day validity",
  "Software consulting firm with milestone billing, 2 revision rounds and 30-day validity",
  "HVAC maintenance contractor with 24-hour SLA guarantee and 14-day validity",
  "Interior design studio with 3D renders, material specs and 10-day validity",
];

const TONES = [
  { id: "professional", label: "Professional & Corporate" },
  { id: "friendly", label: "Modern & Warm" },
  { id: "concise", label: "Short & Direct" },
  { id: "detailed", label: "Comprehensive & Legal" },
] as const;

export function AiTemplateModal({ isOpen, onClose, onApply, companyName }: Props) {
  const [mounted, setMounted] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [tone, setTone] = useState<"professional" | "friendly" | "concise" | "detailed">("professional");
  const [validityDays, setValidityDays] = useState<string>("14");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedTemplate | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Lock background body scroll whenever modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Please describe the type of quotation template you want to create.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<GeneratedTemplate>("/v1/quotations/templates/generate", {
        method: "POST",
        body: {
          prompt: prompt.trim(),
          tone,
          validity_days: validityDays ? Number(validityDays) : 14,
        },
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate template with AI.");
    } finally {
      setLoading(false);
    }
  }

  function handleApply() {
    if (!result) return;
    onApply({
      name: result.name,
      intro: result.intro,
      terms: result.terms,
      footer: result.footer,
      validity_days: String(result.validity_days || 14),
    });
    onClose();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-2xl animate-in fade-in duration-200"
      style={{
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
      onWheel={(e) => e.stopPropagation()}
    >
      <div
        className="relative w-full max-w-2xl bg-white border border-border/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        style={{ overscrollBehavior: "contain" }}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <div>
              <h3 className="text-base font-semibold text-foreground">
                AI Template Creator
              </h3>
              <p className="text-xs text-muted-foreground">
                Describe your business or service and AI will craft the perfect quotation letterhead, terms, and format.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div
          className="p-6 space-y-5 overflow-y-auto flex-1 no-scrollbar"
          style={{ overscrollBehavior: "contain" }}
          onWheel={(e) => e.stopPropagation()}
        >
          {error && (
            <div className="p-3 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg">
              {error}
            </div>
          )}

          {/* Description Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">
                Describe your quotation template:
              </label>
              <span className="text-[11px] text-muted-foreground">{prompt.length}/1000</span>
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., We are a luxury car detailing studio. Make a template offering ceramic coating and PPF packages, 6-month warranty on coating, 50% advance, valid for 10 days."
              className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Quick Idea Chips */}
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
              Quick Inspiration Chips:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(s)}
                  className="text-[11px] px-2.5 py-1 rounded-lg border border-border/60 bg-muted/40 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors text-left"
                >
                  {s.slice(0, 48)}…
                </button>
              ))}
            </div>
          </div>

          {/* Tone & Validity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Tone of voice:</label>
              <div className="grid grid-cols-2 gap-1.5">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTone(t.id)}
                    className={`text-xs px-2.5 py-2 rounded-lg border font-medium transition-all text-center ${
                      tone === t.id
                        ? "border-primary bg-primary/10 text-primary font-semibold"
                        : "border-border/60 bg-background text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Default validity (days):</label>
              <input
                type="number"
                min={1}
                max={365}
                value={validityDays}
                onChange={(e) => setValidityDays(e.target.value)}
                className="w-full text-sm rounded-xl border border-border bg-background px-3.5 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <p className="text-[11px] text-muted-foreground">
                How many days before proposals created with this template expire.
              </p>
            </div>
          </div>

          {/* Generated Result Preview */}
          {result && (
            <div className="mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Generated: {result.name}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  Valid for {result.validity_days} days
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-semibold text-foreground">Intro Salutation:</span>
                  <p className="mt-0.5 text-muted-foreground whitespace-pre-line bg-background/60 p-2 rounded-lg border border-border/40 font-mono text-[11px]">
                    {result.intro}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Terms & Conditions:</span>
                  <p className="mt-0.5 text-muted-foreground whitespace-pre-line bg-background/60 p-2 rounded-lg border border-border/40 font-mono text-[11px]">
                    {result.terms}
                  </p>
                </div>

                <div>
                  <span className="font-semibold text-foreground">Closing Footer:</span>
                  <p className="mt-0.5 text-muted-foreground whitespace-pre-line bg-background/60 p-2 rounded-lg border border-border/40 font-mono text-[11px]">
                    {result.footer}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 bg-white">
          <Button type="button" variant="ghost" onClick={onClose} disabled={loading} className="text-xs">
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={loading || !prompt.trim()}
              className="text-xs font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Generating…
                </>
              ) : result ? (
                <>
                  <RotateCw className="w-4 h-4 mr-1.5" />
                  Regenerate
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-1.5" />
                  Generate Template
                </>
              )}
            </Button>

            {result && (
              <Button
                type="button"
                onClick={handleApply}
                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Check className="w-4 h-4 mr-1.5" />
                Apply to Template Editor
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
