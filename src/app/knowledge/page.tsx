"use client";

import { FormEvent, useCallback, useEffect, useRef, useState, useMemo } from "react";
import { AppShell } from "@/components/shell/AppShell";
import { TopbarTabs, type TopbarTab } from "@/components/shell/Topbar";
import { Button } from "@/components/ui/Button";
import { ErrorBox, PageState } from "@/components/ui/PageState";
import { Select } from "@/components/ui/Select";
import { can } from "@/lib/permissions";
import { apiPage, apiRequest, apiUpload, qs } from "@/lib/api";
import { useToast } from "@/lib/toast";
import type { Agent, KbSource, KbGap, KbSchedule, KbSearchResult } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace";
import { motion, useMotionValue, useReducedMotion, AnimatePresence } from "framer-motion";
import CountUp from "react-countup";
import {
  Search,
  FileText,
  Globe,
  Layers,
  CheckCircle,
  RefreshCcw,
  Upload,
  Brain,
  ZoomIn,
  ZoomOut,
  LocateFixed,
  AlertCircle,
  Clock,
  ArrowUpRight,
  Calendar,
  Pencil,
  BookOpen,
  SlidersHorizontal,
  Plus,
  HelpCircle,
  X,
  ArrowRight,
  Trash2,
  Sparkles,
  ShieldCheck,
  History,
  Cpu,
  Zap,
  Database,
  Lock,
  Check,
  Network,
} from "lucide-react";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { EntitlementGate } from "@/components/entitlements/EntitlementGate";
import { Pagination } from "@/components/ui/Pagination";
import { cn } from "@/lib/utils";
import styles from "./knowledge.module.css";


const MAX_MB = 100;
const ACCEPT = ".pdf,.docx,.txt,.csv,.md";
const PAGE_SIZE = 25;

const syncAgentQuery = (v: string) => {
  if (typeof window === "undefined") return;
  const url = new URL(window.location.href);
  if (v) url.searchParams.set("agent", v);
  else url.searchParams.delete("agent");
  window.history.replaceState({}, "", url.toString());
};

// ─── Clean Animated Stat Card ────────────────────────────────────────────────
function AnimatedStat({
  value,
  label,
  icon,
  delay = 0,
  onClick,
}: {
  value: number;
  label: string;
  icon: React.ReactNode;
  delay?: number;
  onClick?: () => void;
}) {
  const prefersReducedMotion = useReducedMotion();
  return (
    <motion.div
      onClick={onClick}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay }}
      whileHover={prefersReducedMotion ? {} : { y: -3, transition: { duration: 0.2 } }}
      className={cn(
        "relative overflow-hidden p-5 sm:p-6 rounded-2xl border border-border bg-card hover:border-[#0396A6]/30 hover:shadow-xs transition-all duration-300 flex flex-col justify-between min-h-[140px] sm:min-h-[155px] group min-w-0 shadow-2xs",
        onClick && "cursor-pointer active:scale-98"
      )}
    >
      {/* Top accent line in #0396A6 */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] opacity-40 group-hover:opacity-100 transition-opacity duration-300 bg-[#0396A6]"
      />

      {/* Top row: Unified #0396A6 Icon on left */}
      <div className="flex items-center justify-between mb-3 sm:mb-4 relative z-10">
        <div className="text-[#0396A6] flex items-center justify-center transition-all duration-300 group-hover:scale-105 shrink-0">
          {icon}
        </div>
      </div>

      {/* Middle row: Clean standard metric number with CountUp */}
      <div className="mb-2 sm:mb-3 relative z-10">
        <h3 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-none">
          <CountUp end={value} duration={1.5} separator="," />
        </h3>
      </div>

      {/* Bottom row: Clean uppercase label */}
      <div className="mt-auto relative z-10">
        <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground tracking-wide uppercase leading-tight block">
          {label}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Knowledge Graph Card ───────────────────────────────────────────────────────
interface GraphNode {
  id: string;
  kind: "center" | "url" | "doc" | "dot" | "cloud";
  label: string;
  x: number;
  y: number;
  scrapeDate: string;
  tokenSize: number;
  retrievalFrequency: number;
}

function KnowledgeGraphCard({ sources }: { sources: KbSource[] }) {
  const [zoom, setZoom] = useState(1);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [graphExpanded, setGraphExpanded] = useState(false);
  const [pulsingNodeId, setPulsingNodeId] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const spotlightX = useMotionValue(0);
  const spotlightY = useMotionValue(0);
  const [showSpotlight, setShowSpotlight] = useState(false);

  const retrievalQuality = useMemo(() => {
    if (sources.length === 0) return 0;
    const ready = sources.filter((s) => s.status === "ready" || s.status === "completed").length;
    return Math.round((ready / sources.length) * 100);
  }, [sources]);

  const nodes = useMemo<GraphNode[]>(() => {
    const center: GraphNode = {
      id: "ai-brain",
      kind: "center",
      label: "AI Brain",
      x: 50,
      y: 50,
      scrapeDate: new Date().toISOString(),
      tokenSize: sources.length * 240,
      retrievalFrequency: Math.max(1, Math.round(sources.length / 4)),
    };
    const POS = [
      { x: 22, y: 35 },
      { x: 72, y: 18 },
      { x: 28, y: 75 },
      { x: 88, y: 60 },
      { x: 15, y: 70 },
      { x: 60, y: 75 },
      { x: 38, y: 15 },
      { x: 75, y: 30 },
    ];
    const dataNodes: any[] = [];
    sources.slice(0, 8).forEach((s, idx) => {
      const p = POS[idx % POS.length]!;
      const isScrape = s.source_type === "scrape";
      dataNodes.push({
        id: `doc-${s.source_id}`,
        kind: isScrape ? "url" : "doc",
        label: s.filename || s.scrape_url || "Untitled",
        x: p.x,
        y: p.y,
        scrapeDate: new Date().toISOString(),
        tokenSize: s.size_bytes || 0,
        retrievalFrequency: 1,
      });
    });
    return [center, ...dataNodes];
  }, [sources]);

  useEffect(() => {
    setGraphExpanded(false);
    const t = setTimeout(() => setGraphExpanded(true), 30);
    return () => clearTimeout(t);
  }, [nodes]);

  useEffect(() => {
    if (prefersReducedMotion || nodes.length <= 1) return;
    const sat = nodes.filter((n) => n.kind !== "center" && n.kind !== "dot");
    if (!sat.length) return;
    const interval = setInterval(() => {
      const r = sat[Math.floor(Math.random() * sat.length)]!;
      setPulsingNodeId(r.id);
      setTimeout(() => setPulsingNodeId(null), 900);
    }, 2500);
    return () => clearInterval(interval);
  }, [nodes, prefersReducedMotion]);

  const centerNode = nodes[0]!;
  const hoveredNode = nodes.find((n) => n.id === hoveredNodeId) || null;
  const nodeOpacity = (node: GraphNode) => {
    if (!hoveredNodeId) return 1;
    return node.id === hoveredNodeId || node.kind === "center" ? 1 : 0.3;
  };
  const lineOpacity = (node: GraphNode) => {
    if (!hoveredNodeId) return 0.5;
    return node.id === hoveredNodeId ? 1 : 0.12;
  };
  const clampZoom = (v: number) => Math.max(0.75, Math.min(1.45, v));
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return;
    const rect = e.currentTarget.getBoundingClientRect();
    spotlightX.set(e.clientX - rect.left);
    spotlightY.set(e.clientY - rect.top);
  };
  const particles = useMemo(
    () => [
      { x: "14%", y: "18%", size: 3, delay: 0, dur: 5 },
      { x: "84%", y: "12%", size: 4, delay: 0.6, dur: 6 },
      { x: "91%", y: "72%", size: 2.5, delay: 1.2, dur: 7 },
      { x: "8%", y: "78%", size: 3.5, delay: 1.8, dur: 5.5 },
      { x: "42%", y: "8%", size: 2, delay: 0.9, dur: 6.5 },
      { x: "58%", y: "88%", size: 3, delay: 2.1, dur: 4.8 },
      { x: "24%", y: "62%", size: 2.5, delay: 0.4, dur: 7.2 },
      { x: "76%", y: "52%", size: 3, delay: 1.5, dur: 5.8 },
    ],
    []
  );

  return (
    <motion.div
      className="glass-card p-4 sm:p-6 rounded-2xl relative overflow-hidden bg-card border border-border shadow-xs shrink-0 w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
    >
      {!prefersReducedMotion && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 0,
            borderRadius: 16,
          }}
        >
          <motion.rect
            x="1"
            y="1"
            width="calc(100% - 2px)"
            height="calc(100% - 2px)"
            rx="15"
            ry="15"
            fill="none"
            stroke="rgba(var(--brand-rgb),0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeDasharray="55 9999"
            animate={{ strokeDashoffset: [0, -9999] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
        </svg>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 relative z-10 gap-2 sm:gap-3">
        <div>
          <div className="flex items-center gap-2.5 sm:gap-3 mb-1">
            <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
              AI Brain
            </h2>
          </div>
          <p className="text-xs text-muted-foreground">Knowledge Graph & neural retrieval map</p>
        </div>
      </div>
      <div
        ref={containerRef}
        className="relative h-[280px] sm:h-[340px] md:h-[380px] rounded-2xl overflow-hidden z-[1] w-full shrink-0"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setShowSpotlight(true)}
        onMouseLeave={() => setShowSpotlight(false)}
      >
        {!prefersReducedMotion && (
          <>
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(ellipse 65% 55% at 28% 58%, rgba(var(--brand-rgb),0.07) 0%, transparent 100%)",
              }}
              animate={{ opacity: [0.5, 1, 0.5], scale: [1, 1.06, 1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              style={{
                position: "absolute",
                inset: 0,
                pointerEvents: "none",
                background:
                  "radial-gradient(ellipse 55% 65% at 72% 38%, rgba(124,78,254,0.04) 0%, transparent 100%)",
              }}
              animate={{ opacity: [0.3, 0.8, 0.3], scale: [1.06, 1, 1.06] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
            />
          </>
        )}
        {!prefersReducedMotion && showSpotlight && (
          <motion.div
            style={{
              position: "absolute",
              pointerEvents: "none",
              zIndex: 2,
              width: 320,
              height: 320,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(var(--brand-rgb),0.07) 0%, transparent 70%)",
              transform: "translate(-50%, -50%)",
              x: spotlightX,
              y: spotlightY,
            }}
          />
        )}
        {!prefersReducedMotion &&
          particles.map((p, i) => (
            <motion.div
              key={`ap-${i}`}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: p.size,
                height: p.size,
                borderRadius: "50%",
                background: "rgba(var(--brand-rgb),0.35)",
                pointerEvents: "none",
                zIndex: 1,
              }}
              animate={{ y: [0, -14, 0], opacity: [0.2, 0.55, 0.2], scale: [1, 1.4, 1] }}
              transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            />
          ))}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at 50% 45%, rgba(var(--brand-rgb),0.05) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            transform: `scale(${zoom})`,
            transformOrigin: "50% 50%",
            transition: "transform 0.2s ease",
          }}
        >
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            {nodes
              .filter((n) => n.kind !== "center")
              .map((node, idx) => (
                <line
                  key={`line-${node.id}`}
                  x1={`${centerNode.x}%`}
                  y1={`${centerNode.y}%`}
                  x2={`${node.x}%`}
                  y2={`${node.y}%`}
                  stroke={hoveredNodeId === node.id ? "#0396A6" : "rgba(0,0,0,0.1)"}
                  strokeWidth={1}
                  opacity={graphExpanded ? lineOpacity(node) : 0}
                  style={{
                    transition: "opacity 0.35s ease, stroke 0.35s ease",
                    transitionDelay: graphExpanded ? "0ms" : `${60 + idx * 40}ms`,
                  }}
                />
              ))}
          </svg>
          {graphExpanded &&
            !prefersReducedMotion &&
            nodes
              .filter((n) => n.kind !== "center")
              .map((node, idx) => (
                <motion.div
                  key={`pkt-${node.id}`}
                  style={{
                    position: "absolute",
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#0396A6",
                    pointerEvents: "none",
                    zIndex: 5,
                    filter: "blur(0.5px)",
                    willChange: "transform",
                  }}
                  animate={{
                    left: [`${node.x}%`, `${centerNode.x}%`],
                    top: [`${node.y}%`, `${centerNode.y}%`],
                    opacity: [0, 0.75, 0.75, 0],
                    scale: [0.8, 1.1, 0.8],
                  }}
                  transition={{
                    duration: 2.4,
                    repeat: Infinity,
                    repeatDelay: 2.2 + idx * 0.65,
                    ease: "easeInOut",
                    delay: idx * 1.1,
                  }}
                />
              ))}
          {nodes.map((node, idx) => {
            const isCenter = node.kind === "center";
            const isHovered = node.id === hoveredNodeId;
            const isPulsing = node.id === pulsingNodeId;
            const delay = graphExpanded || isCenter ? "0ms" : `${80 + idx * 50}ms`;
            const scale = isCenter
              ? graphExpanded
                ? 1
                : 0.92
              : graphExpanded
              ? isHovered
                ? 1.05
                : 1
              : 0.72;
            return (
              <div
                key={node.id}
                onMouseEnter={() => !isCenter && node.kind !== "dot" && setHoveredNodeId(node.id)}
                onMouseLeave={() => !isCenter && setHoveredNodeId(null)}
                style={{
                  position: "absolute",
                  left: `${!graphExpanded && !isCenter ? centerNode.x : node.x}%`,
                  top: `${!graphExpanded && !isCenter ? centerNode.y : node.y}%`,
                  transform: `translate(-50%, -50%) scale(${scale})`,
                  opacity: isCenter ? 1 : graphExpanded ? nodeOpacity(node) : 0,
                  transition: isCenter
                    ? "none"
                    : "left 0.58s cubic-bezier(0.16,1,0.3,1), top 0.58s cubic-bezier(0.16,1,0.3,1), opacity 0.3s ease, transform 0.2s ease",
                  transitionDelay: delay,
                  cursor: isCenter ? "default" : "pointer",
                  zIndex: isCenter ? 4 : 3,
                  borderRadius: isCenter ? "50%" : undefined,
                }}
              >
                {isCenter ? (
                  <motion.div className="relative w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18">
                    <motion.div
                      className="w-full h-full rounded-full bg-[#0396A6] border-2 sm:border-4 border-white/60 flex items-center justify-center text-white"
                      animate={
                        prefersReducedMotion
                          ? {}
                          : {
                              scale: [0.97, 1.03, 0.97],
                              boxShadow: [
                                "0 8px 30px rgba(var(--brand-rgb),0.3)",
                                "0 16px 52px rgba(var(--brand-rgb),0.58)",
                                "0 8px 30px rgba(var(--brand-rgb),0.3)",
                              ],
                            }
                      }
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    >
                      <Brain className="w-6 h-6 sm:w-8 sm:h-8" strokeWidth={1.5} />
                    </motion.div>
                    {!prefersReducedMotion && (
                      <motion.div
                        style={{
                          position: "absolute",
                          inset: -8,
                          borderRadius: "50%",
                          border: "1px solid rgba(var(--brand-rgb),0.28)",
                          pointerEvents: "none",
                        }}
                        animate={{ scale: [1, 1.14, 1], opacity: [0.5, 0.12, 0.5] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[#0396A6] relative"
                    style={{ willChange: "transform, box-shadow" }}
                    animate={
                      prefersReducedMotion
                        ? {}
                        : {
                            y: [0, -6, 0],
                            boxShadow: isPulsing
                              ? [
                                  "0 2px 8px rgba(0,0,0,0.04)",
                                  "0 0 0 10px rgba(var(--brand-rgb),0.1), 0 6px 18px rgba(0,0,0,0.1)",
                                  "0 2px 8px rgba(0,0,0,0.04)",
                                ]
                              : isHovered
                              ? "0 6px 18px rgba(0,0,0,0.1)"
                              : "0 2px 8px rgba(0,0,0,0.04)",
                          }
                    }
                    transition={{
                      y: { duration: 6, repeat: Infinity, ease: "easeInOut", delay: idx * 0.4 },
                      boxShadow: { duration: isPulsing ? 0.9 : 0.2 },
                    }}
                  >
                    {node.kind === "url" ? (
                      <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    ) : (
                      <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    )}
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>
        <div className="absolute right-2.5 sm:right-3 bottom-2.5 sm:bottom-3 flex gap-1.5 sm:gap-2 z-[5]">
          <button
            onClick={() => setZoom((z) => clampZoom(z + 0.12))}
            aria-label="Zoom in"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer shadow-xs transition-colors"
          >
            <ZoomIn size={14} />
          </button>
          <button
            onClick={() => setZoom((z) => clampZoom(z - 0.12))}
            aria-label="Zoom out"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer shadow-xs transition-colors"
          >
            <ZoomOut size={14} />
          </button>
          <button
            onClick={() => setZoom(1)}
            aria-label="Reset zoom"
            className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground flex items-center justify-center cursor-pointer shadow-xs transition-colors"
          >
            <LocateFixed size={14} />
          </button>
        </div>
        {hoveredNode && hoveredNode.kind !== "center" && hoveredNode.kind !== "dot" && (() => {
          const isLeft = hoveredNode.x < 20;
          const isRight = hoveredNode.x > 80;
          const isTop = hoveredNode.y < 35;
          const tLeft = isLeft
            ? `calc(${hoveredNode.x}% - 10px)`
            : isRight
            ? `calc(${hoveredNode.x}% + 10px)`
            : `${hoveredNode.x}%`;
          const tTop = isTop ? `calc(${hoveredNode.y}% + 26px)` : `calc(${hoveredNode.y}% - 26px)`;
          const tx = isLeft ? "0" : isRight ? "-100%" : "-50%";
          const ty = isTop ? "0" : "-100%";
          return (
            <motion.div
              style={{
                position: "absolute",
                top: tTop,
                left: tLeft,
                transform: `translate(${tx}, ${ty})`,
                padding: "10px 12px",
                borderRadius: 12,
                background: "var(--card, #FFFFFF)",
                border: "1px solid var(--border, #E2DCEF)",
                boxShadow: "0 10px 30px rgba(0,0,0,0.12)",
                zIndex: 100,
                width: 190,
                maxWidth: "calc(100vw - 32px)",
                pointerEvents: "none",
              }}
              initial={{ opacity: 0, scale: 0.95, y: 4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--foreground, #111827)",
                  marginBottom: 4,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {hoveredNode.label}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--muted-foreground, #8B847B)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <div>
                  Type: <span style={{ color: "var(--foreground, #111827)" }}>Document</span>
                </div>
                <div>
                  Size:{" "}
                  <span style={{ color: "var(--foreground, #111827)" }}>
                    {(hoveredNode.tokenSize / 1024).toFixed(1)} KB
                  </span>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </div>
      {/* Premium Knowledge Graph Metrics Footer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4 pt-4 border-t border-[var(--line)] relative z-10">
        <div className="flex items-center gap-3.5 p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-muted/20 border border-border/70 hover:border-[#0396A6]/30 hover:bg-muted/30 transition-all group">
          <div className="w-11 h-11 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <FileText size={18} />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 leading-none">
              <span className="text-xl sm:text-2xl font-black text-foreground font-sans tracking-tight leading-none">
                <CountUp end={sources.length} duration={1.5} separator="," />
              </span>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Total Sources
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 truncate mt-1 leading-none">
              Active documents & web crawlers
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 p-3.5 sm:px-4 sm:py-3.5 rounded-2xl bg-muted/20 border border-border/70 hover:border-[#0396A6]/30 hover:bg-muted/30 transition-all group">
          <div className="w-11 h-11 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <CheckCircle size={18} />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center gap-2 leading-none">
              <span className="text-xl sm:text-2xl font-black text-foreground font-sans tracking-tight leading-none">
                <CountUp end={retrievalQuality} duration={1.5} suffix="%" />
              </span>
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider leading-none">
                Ready to Retrieve
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground/70 truncate mt-1 leading-none">
              High-confidence vector chunks
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

type ManageTabId = "sources" | "add" | "gaps" | "search" | "schedules" | "advanced";

type LibraryAgent = { agent_id: string; agent_name: string; source_count: number };

const KbBotIsolationCard = ({
  agentId,
  canEdit,
  busy,
  useSharedKb,
  libraryBots,
  importFromId,
  onToggleShared,
  onImportFromChange,
  onImport,
}: {
  agentId: string;
  canEdit: boolean;
  busy: boolean;
  useSharedKb: boolean;
  libraryBots: LibraryAgent[];
  importFromId: string;
  onToggleShared: (next: boolean) => void;
  onImportFromChange: (id: string) => void;
  onImport: () => void;
}) => {
  if (!agentId) return null;
  return (
    <div className="glass-card bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
      <div>
        <h3 className="text-sm sm:text-base font-bold text-foreground">
          This bot&apos;s knowledge
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Retrieval uses only this bot&apos;s sources unless you opt into the shared library. Import
          copies another bot&apos;s completed sources onto this bot.
        </p>
      </div>
      <label className="flex items-start gap-3 text-xs sm:text-sm cursor-pointer">
        <input
          type="checkbox"
          className="mt-1"
          checked={useSharedKb}
          disabled={busy || !canEdit}
          onChange={(e) => onToggleShared(e.target.checked)}
        />
        <span>
          <span className="font-semibold text-foreground">Use shared knowledge base</span>
          <span className="block text-xs text-muted-foreground">
            Also retrieve merchant-wide sources that are not attached to a specific bot.
          </span>
        </span>
      </label>
      {libraryBots.length > 0 ? (
        <div className="flex flex-col sm:flex-row sm:items-end gap-2.5 sm:gap-3">
          <div className="w-full sm:min-w-[16rem] flex-1">
            <Select
              value={importFromId}
              onChange={onImportFromChange}
              options={[
                { value: "", label: "Choose a bot with knowledge…" },
                ...libraryBots.map((b) => ({
                  value: b.agent_id,
                  label: `${b.agent_name} (${b.source_count} sources)`,
                })),
              ]}
              style={{ width: "100%" }}
            />
          </div>
          <Button
            type="button"
            size="sm"
            disabled={busy || !canEdit || !importFromId}
            onClick={onImport}
            className="bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-semibold cursor-pointer"
          >
            Import knowledge
          </Button>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No other bot has completed sources to import.
        </p>
      )}
    </div>
  );
};

export default function KnowledgePage() {
  const { me } = useWorkspace();
  const [sources, setSources] = useState<KbSource[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentId, setAgentId] = useState("");
  const [pageTab, setPageTab] = useState<"overview" | "manage">("overview");
  const [manageTab, setManageTab] = useState<ManageTabId>("sources");
  const [addType, setAddType] = useState<"upload" | "crawl" | "qa">("upload");
  const [listFilter, setListFilter] = useState<"all" | "shared" | string>("all");
  const [editSource, setEditSource] = useState<KbSource | null>(null);
  const [editText, setEditText] = useState("");
  const [editBusy, setEditBusy] = useState(false);
  const [agentsHydrated, setAgentsHydrated] = useState(false);
  const { showToast } = useToast();
  const setError = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "error" });
    },
    [showToast]
  );
  const setNotice = useCallback(
    (msg: string | null) => {
      if (msg) showToast(msg, { type: "success" });
    },
    [showToast]
  );
  const [crawlUrl, setCrawlUrl] = useState("");
  const [crawlDepth, setCrawlDepth] = useState(2);
  const [useSitemap, setUseSitemap] = useState(false);
  const [sourceOffset, setSourceOffset] = useState(0);
  const [sourceTotal, setSourceTotal] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, ready: 0, failed: 0, processing: 0 });
  const [graphSources, setGraphSources] = useState<KbSource[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [revisions, setRevisions] = useState<{ id: string; created_at: string | null; preview: string; chars: number }[]>([]);
  const [qaQuestion, setQaQuestion] = useState("");
  const [qaAnswer, setQaAnswer] = useState("");
  const [gaps, setGaps] = useState<KbGap[]>([]);
  const [gapAnswers, setGapAnswers] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<KbSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [schedules, setSchedules] = useState<KbSchedule[]>([]);
  const [gapsPage, setGapsPage] = useState(1);
  const [gapsPageSize, setGapsPageSize] = useState(5);
  const [schedulesPage, setSchedulesPage] = useState(1);
  const [schedulesPageSize, setSchedulesPageSize] = useState(5);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [confirmState, setConfirmState] = useState<{
    show: boolean;
    title: string;
    message: string;
    tone?: "primary" | "danger";
    confirmText?: string;
    onConfirm: () => void;
  }>({
    show: false,
    title: "",
    message: "",
    onConfirm: () => {},
  });
  const [useSharedKb, setUseSharedKb] = useState(false);
  const [libraryBots, setLibraryBots] = useState<LibraryAgent[]>([]);
  const [importFromId, setImportFromId] = useState("");

  const canEdit = can(me?.permissions, "kb:edit");

  const goToManage = (tab: ManageTabId, subAdd?: "upload" | "crawl" | "qa") => {
    setPageTab("manage");
    setManageTab(tab);
    if (subAdd) setAddType(subAdd);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    void (async () => {
      try {
        const list = await apiRequest<Agent[]>("/v1/agents");
        setAgents(list || []);
        const pref =
          typeof window !== "undefined"
            ? new URLSearchParams(window.location.search).get("agent")
            : null;
        if (pref && list?.some((a) => a.id === pref)) {
          setAgentId(pref);
        }
      } catch {
        setAgents([]);
      } finally {
        setAgentsHydrated(true);
      }
    })();
  }, []);

  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!agentsHydrated) return;
      if (!opts?.silent) setLoading(true);
      setError(null);
      try {
        const sharedOnly = listFilter === "shared";
        const filterAgent = listFilter !== "all" && listFilter !== "shared" ? listFilter : "";
        const [statsRes, graphRes, sourcesRes, gapsRes, schedulesRes] = await Promise.allSettled([
          apiRequest<{ total: number; ready: number; failed: number; processing: number }>("/v1/kb/stats"),
          apiPage<KbSource[]>(`/v1/kb/sources${qs({ limit: 8, offset: 0 })}`),
          apiPage<KbSource[]>(
            `/v1/kb/sources${qs({
              limit: pageSize,
              offset: sourceOffset,
              shared_only: sharedOnly || undefined,
              agent_id: filterAgent || undefined,
            })}`
          ),
          apiRequest<KbGap[]>("/v1/kb/gaps"),
          apiRequest<KbSchedule[]>("/v1/kb/schedules"),
        ]);

        if (statsRes.status === "fulfilled" && statsRes.value) setStats(statsRes.value);
        if (graphRes.status === "fulfilled") setGraphSources(graphRes.value.data || []);

        if (sourcesRes.status === "fulfilled") {
          setSources(sourcesRes.value.data || []);
          const total = Number((sourcesRes.value.meta as { total?: number })?.total ?? 0);
          setSourceTotal(total);
        } else {
          setSources([]);
          setError(sourcesRes.reason instanceof Error ? sourcesRes.reason.message : "Could not load sources");
        }

        setGaps(gapsRes.status === "fulfilled" ? gapsRes.value || [] : []);
        setSchedules(schedulesRes.status === "fulfilled" ? schedulesRes.value || [] : []);
      } finally {
        setLoading(false);
      }
    },
    [agentsHydrated, listFilter, sourceOffset, pageSize]
  );

  useEffect(() => {
    setSourceOffset(0);
    setCurrentPage(1);
  }, [listFilter]);

  const formatAgentMode = (mode?: string | null) => {
    if (!mode) return "";
    const m = mode.toLowerCase();
    if (m === "whatsapp" || m === "wa") return "WA";
    if (m === "website") return "Website";
    if (m === "unified") return "Unified";
    return mode.charAt(0).toUpperCase() + mode.slice(1);
  };

  const agentLabel = (id: string | null | undefined) => {
    if (!id) return "Shared library";
    const a = agents.find((x) => x.id === id);
    if (!a) return "Agent";
    const name = a.agent_name || a.slug || "Agent";
    const mode = formatAgentMode(a.mode);
    return mode ? `${name} (${mode})` : name;
  };

  const agentSelectOptions = [
    { value: "", label: "Shared library (retrieved only if a bot opts in)" },
    ...agents.map((a) => ({
      value: a.id,
      label: `${a.agent_name || a.slug} · ${a.mode}`,
    })),
  ];

  const isolationAgentId =
    agentId || (listFilter !== "all" && listFilter !== "shared" ? String(listFilter) : "");

  useEffect(() => {
    if (!isolationAgentId) {
      setUseSharedKb(false);
      setLibraryBots([]);
      setImportFromId("");
      return;
    }
    void (async () => {
      try {
        const agent = await apiRequest<Agent>(`/v1/agents/${isolationAgentId}`);
        setUseSharedKb(Boolean(agent?.use_shared_kb));
      } catch {
        setUseSharedKb(false);
      }
      try {
        const donors = await apiRequest<LibraryAgent[]>("/v1/kb/library-agents");
        setLibraryBots((donors || []).filter((d) => d.agent_id !== isolationAgentId));
      } catch {
        setLibraryBots([]);
      }
    })();
  }, [isolationAgentId]);

  const toggleSharedKb = async (next: boolean) => {
    if (!isolationAgentId) return;
    setBusy(true);
    setError(null);
    try {
      await apiRequest(`/v1/agents/${isolationAgentId}`, {
        method: "PATCH",
        body: { use_shared_kb: next },
      });
      setUseSharedKb(next);
      setNotice(
        next
          ? "This bot will also answer from the shared merchant library."
          : "This bot now uses only its own knowledge sources."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update shared knowledge setting");
    } finally {
      setBusy(false);
    }
  };

  const importFromBot = async () => {
    if (!isolationAgentId || !importFromId) return;
    setBusy(true);
    setError(null);
    try {
      const counts = await apiRequest<{ jobs?: number; chunks?: number }>("/v1/kb/import", {
        method: "POST",
        body: { from_agent_id: importFromId, to_agent_id: isolationAgentId },
      });
      setNotice(
        `Imported knowledge (${counts?.jobs ?? 0} sources, ${counts?.chunks ?? 0} chunks). This bot has its own copy.`
      );
      setImportFromId("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setBusy(false);
    }
  };

  async function onOpenEdit(s: KbSource) {
    setEditBusy(true);
    setError(null);
    try {
      const data = await apiRequest<{ text: string }>(`/v1/kb/sources/${s.source_id}/content`);
      const revs = await apiRequest<{ id: string; created_at: string | null; preview: string; chars: number }[]>(
        `/v1/kb/sources/${s.source_id}/revisions`
      );
      setEditSource(s);
      setEditText(data?.text || "");
      setRevisions(revs || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load source text");
    } finally {
      setEditBusy(false);
    }
  }

  async function onSaveEdit() {
    if (!editSource) return;
    setEditBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/kb/sources/${editSource.source_id}/content`, {
        method: "PUT",
        body: { text: editText },
      });
      setNotice("Indexed text saved — old chunks were replaced.");
      setEditSource(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save edited text");
    } finally {
      setEditBusy(false);
    }
  }

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const hasInFlight = sources.some((s) => s.status === "queued" || s.status === "processing");
    if (!hasInFlight) return;
    const interval = setInterval(() => {
      void load({ silent: true });
    }, 3000);
    return () => clearInterval(interval);
  }, [sources, load]);

  async function onUpload(e: FormEvent) {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`${file.name} is ${(file.size / 1024 / 1024).toFixed(1)} MB — the limit is ${MAX_MB} MB.`);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("file", file);
      if (agentId) body.append("agent_id", agentId);
      const data = await apiUpload<KbSource>("/v1/kb/sources/upload", body);
      const status = data?.status;
      const chunkCount = data?.chunk_count ?? 0;
      const msg =
        status === "completed"
          ? `${file.name} uploaded and indexed — ${chunkCount} chunk${chunkCount !== 1 ? "s" : ""} ready for retrieval.`
          : status === "failed"
          ? `${file.name} could not be indexed — check the error in the Sources list.`
          : `${file.name} uploaded — indexing in progress.`;
      setNotice(msg);
      if (fileRef.current) fileRef.current.value = "";
      setSelectedFileName("");
      setSelectedFile(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function onCrawl(e: FormEvent) {
    e.preventDefault();
    let targetUrl = (crawlUrl || "").trim();
    if (!targetUrl) return;
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest<KbSource>("/v1/kb/sources/crawl", {
        method: "POST",
        body: {
          url: targetUrl,
          max_depth: Number(crawlDepth),
          agent_id: agentId || null,
          use_sitemap: useSitemap,
        },
      });
      setNotice(`Crawl started for ${targetUrl} — progress will update automatically in the sources list.`);
      setCrawlUrl("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Website crawl failed to start");
    } finally {
      setBusy(false);
    }
  }

  async function onAddQa(e: FormEvent) {
    e.preventDefault();
    if (!qaQuestion.trim() || !qaAnswer.trim()) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest("/v1/kb/qa", {
        method: "POST",
        body: { question: qaQuestion.trim(), answer: qaAnswer.trim(), agent_id: agentId || null },
      });
      setNotice("Manual Q&A pair added and indexed for vector search!");
      setQaQuestion("");
      setQaAnswer("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add Q&A pair");
    } finally {
      setBusy(false);
    }
  }

  async function onResolveGap(gapId: string) {
    const ans = gapAnswers[gapId];
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/kb/gaps/${gapId}/resolve`, {
        method: "POST",
        body: { answer: ans || null },
      });
      setNotice("Knowledge gap resolved!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resolve gap");
    } finally {
      setBusy(false);
    }
  }

  async function onSearchPreview(e: FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setError(null);
    try {
      const hits = await apiRequest<any[]>("/v1/kb/search", {
        method: "POST",
        body: { query: searchQuery.trim(), agent_id: agentId || null, top_k: 5 },
      });
      setSearchResults(hits || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search preview failed");
    } finally {
      setIsSearching(false);
    }
  }

  async function onReindex(id: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/kb/sources/${id}/reindex`, { method: "POST" });
      setNotice("Re-indexing started — old embeddings are replaced when it finishes.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not re-index that source");
    } finally {
      setBusy(false);
    }
  }

  async function onSchedule(id: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await apiRequest(`/v1/kb/sources/${id}/schedule`, { method: "POST", body: { interval: "weekly" } });
      setNotice("Weekly re-crawl scheduled!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not schedule re-crawl");
    } finally {
      setBusy(false);
    }
  }

  function onDelete(id: string, name: string | null) {
    setConfirmState({
      show: true,
      title: "Delete Source",
      message: `Delete ${name || "this source"} and everything indexed from it?`,
      tone: "danger",
      confirmText: "Delete",
      onConfirm: async () => {
        setConfirmState((prev) => ({ ...prev, show: false }));
        setBusy(true);
        setError(null);
        try {
          await apiRequest(`/v1/kb/sources/${id}`, { method: "DELETE" });
          await load();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Could not delete that source");
        } finally {
          setBusy(false);
        }
      },
    });
  }

  async function onBulk(action: "delete" | "reindex") {
    if (!selectedIds.length) return;
    const run = async () => {
      setBusy(true);
      setError(null);
      setNotice(null);
      try {
        const rows = await apiRequest<{ source_id: string; ok: boolean; error?: string }[]>("/v1/kb/sources/bulk", {
          method: "POST",
          body: { action, source_ids: selectedIds },
        });
        const failed = (rows || []).filter((r) => !r.ok);
        setNotice(failed.length ? `${action} finished with ${failed.length} error(s).` : `Bulk ${action} finished.`);
        setSelectedIds([]);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Bulk action failed");
      } finally {
        setBusy(false);
      }
    };
    if (action === "delete") {
      setConfirmState({
        show: true,
        title: "Delete selected sources",
        message: `Delete ${selectedIds.length} source(s) and their vectors?`,
        tone: "danger",
        confirmText: "Delete",
        onConfirm: async () => {
          setConfirmState((prev) => ({ ...prev, show: false }));
          await run();
        },
      });
      return;
    }
    await run();
  }

  const kbHeaderTabs: TopbarTab[] = [
    { key: "overview", label: "Overview", icon: <BookOpen className="w-3.5 h-3.5" /> },
    { key: "manage", label: "Management", icon: <SlidersHorizontal className="w-3.5 h-3.5" /> },
  ];

  const manageNavTabs = [
    { id: "sources" as ManageTabId, label: "All Sources", icon: FileText },
    { id: "add" as ManageTabId, label: "Add Knowledge", icon: Plus },
    { id: "gaps" as ManageTabId, label: "Knowledge Gaps", icon: AlertCircle },
    { id: "search" as ManageTabId, label: "Test Retrieval", icon: Search },
    { id: "schedules" as ManageTabId, label: "Schedules", icon: Calendar },
    { id: "advanced" as ManageTabId, label: "Advanced", icon: HelpCircle },
  ];

  return (
    <AppShell
      title="Knowledge Base"
      requires="kb:view"
      noScroll={pageTab === "manage"}
      headerTabs={
        <TopbarTabs
          tabs={kbHeaderTabs}
          activeTab={pageTab}
          onTabChange={(key) => setPageTab(key as "overview" | "manage")}
        />
      }
    >
      <EntitlementGate feature="knowledge_base">
      <div
        className={cn(
          styles.kbPage,
          "w-full mx-auto",
          pageTab === "manage"
            ? "h-full flex-1 min-h-0 flex flex-col pt-3 sm:pt-4 px-3 sm:px-4 md:px-6 pb-3 overflow-hidden max-w-full"
            : "max-w-[1280px] flex-1 flex flex-col gap-4 sm:gap-6 pt-3 sm:pt-4 px-3 sm:px-4 md:px-6 pb-12"
        )}
      >
        {/* ── OVERVIEW TAB ─────────────────────────────────────────────────── */}
        {pageTab === "overview" && (
          <div className="flex flex-col gap-4 sm:gap-6">
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-7 shrink-0">
              <AnimatedStat
                value={stats.total}
                label="TOTAL DOCUMENTS"
                icon={<FileText className="w-5 h-5 text-[#0396A6]" />}
                delay={0.05}
                onClick={() => goToManage("sources")}
              />
              <AnimatedStat
                value={stats.ready}
                label="READY SOURCES"
                icon={<CheckCircle className="w-5 h-5 text-[#0396A6]" />}
                delay={0.1}
                onClick={() => goToManage("sources")}
              />
              <AnimatedStat
                value={stats.processing}
                label="PROCESSING"
                icon={<RefreshCcw className={cn("w-5 h-5 text-[#0396A6]", stats.processing > 0 && "animate-spin")} />}
                delay={0.15}
                onClick={() => goToManage("sources")}
              />
              <AnimatedStat
                value={stats.failed}
                label="FAILED SOURCES"
                icon={<AlertCircle className="w-5 h-5 text-[#0396A6]" />}
                delay={0.2}
                onClick={() => goToManage("sources")}
              />
            </div>

            {/* AI Brain Knowledge Graph */}
            <KnowledgeGraphCard sources={graphSources} />

            {/* Knowledge Gaps Callout Banner if gaps exist */}
            {gaps.length > 0 && (
              <motion.div
                className="glass-card bg-[#0396A6]/5 border border-[#0396A6]/20 rounded-2xl p-3.5 sm:p-5 shadow-xs"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0">
                      <AlertCircle size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-bold text-foreground">
                        {gaps.length} Unresolved Knowledge {gaps.length === 1 ? "Gap" : "Gaps"}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Customer questions that your AI agent couldn&apos;t answer
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => goToManage("gaps")}
                    className="bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-semibold text-xs self-start sm:self-auto shrink-0 cursor-pointer flex items-center gap-1.5"
                  >
                    <span>Resolve Gaps</span>
                    <ArrowRight size={13} className="shrink-0" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Quick Action Ingest Grid */}
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground mb-2.5 px-0.5">
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
                <button
                  type="button"
                  onClick={() => goToManage("add", "upload")}
                  className="p-3.5 rounded-2xl bg-card border border-[var(--line)] hover:border-[#0396A6]/40 hover:shadow-xs transition-all text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Upload size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#0396A6] transition-colors">Upload Document</div>
                    <div className="text-[11px] text-muted-foreground truncate">PDF, DOCX, TXT, CSV</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => goToManage("add", "crawl")}
                  className="p-3.5 rounded-2xl bg-card border border-[var(--line)] hover:border-[#0396A6]/40 hover:shadow-xs transition-all text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Globe size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#0396A6] transition-colors">Crawl Website</div>
                    <div className="text-[11px] text-muted-foreground truncate">Auto scrape URLs & sitemaps</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => goToManage("add", "qa")}
                  className="p-3.5 rounded-2xl bg-card border border-[var(--line)] hover:border-[#0396A6]/40 hover:shadow-xs transition-all text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Layers size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#0396A6] transition-colors">Manual Q&A</div>
                    <div className="text-[11px] text-muted-foreground truncate">Direct answer training</div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => goToManage("search")}
                  className="p-3.5 rounded-2xl bg-card border border-[var(--line)] hover:border-[#0396A6]/40 hover:shadow-xs transition-all text-left flex items-center gap-3 cursor-pointer group"
                >
                  <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Search size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-foreground group-hover:text-[#0396A6] transition-colors">Test Retrieval</div>
                    <div className="text-[11px] text-muted-foreground truncate">Simulate vector search</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Recent Sources Preview Card */}
            <motion.div
              className="glass-card bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xs"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-4 pb-3 border-b border-border">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-foreground">
                    Recent Sources
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Recently indexed documents, websites & Q&A pairs
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => goToManage("sources")}
                  className="self-start sm:self-auto text-xs font-semibold text-[#0396A6] hover:bg-[#0396A6]/10 flex items-center gap-1.5 cursor-pointer"
                >
                  <span>View all sources</span>
                  <ArrowUpRight size={13} className="shrink-0" />
                </Button>
              </div>

              {loading ? (
                <p className="text-xs sm:text-sm text-muted-foreground py-6 text-center">Loading sources…</p>
              ) : sources.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-border bg-muted/10">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-xs sm:text-sm font-semibold text-foreground mb-1">No knowledge sources yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Upload documents or crawl your website so your AI agent can answer customer questions.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => goToManage("add", "upload")}
                    className="bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-semibold cursor-pointer"
                  >
                    <Upload size={14} className="mr-1.5" /> Upload Document
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {sources.slice(0, 4).map((s) => {
                    const isScrape = s.source_type === "scrape";
                    return (
                      <div
                        key={s.source_id}
                        className="flex items-center justify-between p-3 sm:p-3.5 rounded-xl border border-border/80 bg-background/50 hover:bg-muted/30 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg text-[#0396A6] flex items-center justify-center shrink-0">
                            {isScrape ? <Globe size={15} /> : <FileText size={15} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-semibold text-xs sm:text-sm text-foreground truncate block">
                                {s.scrape_url || s.filename || "Untitled"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground flex-wrap">
                              <span>{agentLabel(s.agent_id)}</span>
                              <span>•</span>
                              <span>
                                {isScrape
                                  ? `${s.pages_scraped ?? 0} pages`
                                  : s.size_bytes
                                  ? `${(s.size_bytes / 1024).toFixed(0)} KB`
                                  : "Document"}
                              </span>
                              <span>•</span>
                              <span
                                className={cn(
                                  "font-bold text-[10px] sm:text-[11px] uppercase shrink-0 tracking-wider",
                                  s.status === "completed" || s.status === "ready"
                                    ? "text-emerald-600"
                                    : s.status === "failed" || s.status === "error"
                                    ? "text-red-500"
                                    : "text-[#0396A6]"
                                )}
                              >
                                {s.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => void onOpenEdit(s)}
                            title="Edit indexed text"
                            className="w-8 h-8 rounded-xl hover:bg-[#0396A6] text-[#0396A6] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50 shrink-0"
                          >
                            <Pencil size={14} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={() => goToManage("sources")}
                      className="text-xs sm:text-sm font-semibold text-[#0396A6] hover:underline cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <span>View all {sourceTotal || sources.length} sources in Management</span>
                      <ArrowRight size={14} className="shrink-0" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* ── MANAGEMENT TAB ───────────────────────────────────────────────── */}
        {pageTab === "manage" && (
          <div className="w-full flex-1 min-h-0 flex flex-col gap-3 sm:gap-3.5 pb-1 overflow-hidden">
            {/* Top Management Pill Tab Bar */}
            <div className="flex items-center justify-start md:justify-center overflow-x-auto no-scrollbar w-full shrink-0 pb-0.5 px-2 md:px-0">
              <div className="flex items-center gap-1.5 p-1 rounded-full border border-border bg-white shadow-2xs w-max">
                {manageNavTabs.map((tab) => {
                  const isActive = manageTab === tab.id;
                  const IconComponent = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setManageTab(tab.id)}
                      className={cn(
                        "flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full transition-all duration-200 whitespace-nowrap text-xs font-bold cursor-pointer",
                        isActive
                          ? "bg-[#0396A6] text-white shadow-sm font-extrabold"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                      )}
                    >
                      <IconComponent
                        size={15}
                        className={cn("shrink-0 transition-colors", isActive ? "text-white" : "text-muted-foreground")}
                      />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <KbBotIsolationCard
              agentId={isolationAgentId}
              canEdit={canEdit}
              busy={busy}
              useSharedKb={useSharedKb}
              libraryBots={libraryBots}
              importFromId={importFromId}
              onToggleShared={(next) => void toggleSharedKb(next)}
              onImportFromChange={setImportFromId}
              onImport={() => void importFromBot()}
            />

            {/* 1. SOURCES MANAGEMENT SUBTAB */}
            {manageTab === "sources" && (
              <motion.div
                className="glass-card bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 shrink-0">
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground">
                      Indexed Sources
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Manage, edit, re-index, or delete indexed documents and crawled websites.
                    </p>
                  </div>
                  {canEdit && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => setManageTab("add")}
                      className="bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-semibold flex items-center gap-1.5 self-start sm:self-auto shrink-0 cursor-pointer"
                    >
                      <Plus size={15} /> Add New Source
                    </Button>
                  )}
                </div>

                {/* Filter and Bulk Actions */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 mb-3 items-stretch sm:items-center shrink-0">
                  <div className="w-full sm:w-auto sm:min-w-[240px]">
                    <Select
                      value={listFilter}
                      onChange={setListFilter}
                      options={[
                        { value: "all", label: "All sources" },
                        { value: "shared", label: "Shared library only" },
                        ...agents.map((a) => ({ value: a.id, label: a.agent_name || a.slug })),
                      ]}
                      style={{ width: "100%" }}
                    />
                  </div>
                  {canEdit && selectedIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                      <Button
                        type="button"
                        onClick={() => void onBulk("reindex")}
                        disabled={busy}
                        size="sm"
                        className="flex-1 sm:flex-initial cursor-pointer"
                      >
                        Re-index selected ({selectedIds.length})
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={() => void onBulk("delete")}
                        disabled={busy}
                        size="sm"
                        className="flex-1 sm:flex-initial cursor-pointer"
                      >
                        Delete selected
                      </Button>
                    </div>
                  )}
                </div>

                {loading ? (
                  <p className="text-xs sm:text-sm text-muted-foreground py-8 text-center my-auto">Loading sources…</p>
                ) : !sources.length ? (
                  <div className="my-auto">
                    <PageState
                      icon="menu_book"
                      title="Nothing indexed yet"
                      description="The agent answers only from what is here. Upload a document or crawl a website to get started."
                      card={false}
                    />
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Inner Scrollable Container with hidden scrollbar */}
                    <div className="overflow-y-auto no-scrollbar scroll-smooth pr-0.5 space-y-3 sm:space-y-3.5 flex-1 min-h-0">
                      {sources.map((s) => {
                        const isScrape = s.source_type === "scrape";
                        return (
                          <div
                            key={s.source_id}
                            className="group flex flex-col lg:flex-row items-stretch lg:items-center justify-between p-4 sm:p-5 border border-border rounded-2xl bg-card gap-3.5 hover:border-[#0396A6]/40 hover:bg-muted/10 transition-all duration-200 shadow-2xs"
                          >
                            <label className="flex items-center gap-3 sm:gap-3.5 flex-1 min-w-0 cursor-pointer">
                              {canEdit && (
                                <input
                                  type="checkbox"
                                  checked={selectedIds.includes(s.source_id)}
                                  onChange={(e) => {
                                    setSelectedIds((prev) =>
                                      e.target.checked
                                        ? [...prev, s.source_id]
                                        : prev.filter((id) => id !== s.source_id)
                                    );
                                  }}
                                  className="w-4 h-4 shrink-0 rounded text-[#0396A6] focus:ring-[#0396A6] cursor-pointer"
                                />
                              )}
                              <div className="w-8 h-8 rounded-lg text-[#0396A6] flex items-center justify-center shrink-0">
                                {isScrape ? (
                                  <Globe size={18} />
                                ) : (
                                  <FileText size={18} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-center gap-2 mb-0.5">
                                  <span className="font-bold text-sm text-foreground break-all">
                                    {s.scrape_url || s.filename || "Untitled"}
                                  </span>
                                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                                    • {agentLabel(s.agent_id)}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-2.5 gap-y-1">
                                  {isScrape ? (
                                    <span>
                                      Website crawl · {s.pages_scraped ?? 0} of {s.total_pages || "?"} pages scraped
                                      {s.progress !== null && s.status !== "ready" && s.status !== "completed"
                                        ? ` (${s.progress}%)`
                                        : ""}
                                    </span>
                                  ) : (
                                    <span>
                                      Document ·{" "}
                                      {s.size_bytes ? `${(s.size_bytes / 1024).toFixed(0)} KB` : "Unknown size"}
                                      {s.progress !== null && s.status !== "ready" && s.status !== "completed"
                                        ? ` · ${s.progress}%`
                                        : ""}
                                    </span>
                                  )}
                                  <span>·</span>
                                  <span
                                    className={cn(
                                      "text-xs font-bold uppercase shrink-0 tracking-wider",
                                      s.status === "completed" || s.status === "ready"
                                        ? "text-emerald-600"
                                        : s.status === "failed" || s.status === "error"
                                        ? "text-red-500"
                                        : "text-[#0396A6]"
                                    )}
                                  >
                                    {s.status}
                                  </span>
                                </div>
                                {s.stopped_reason && (
                                  <div className="text-xs text-amber-600 mt-1 flex items-center gap-1.5">
                                    <Clock size={14} className="shrink-0" /> Stopped early:{" "}
                                    {s.stopped_reason === "page_limit_reached"
                                      ? "Page limit reached"
                                      : s.stopped_reason === "low_content"
                                      ? "Low readable text content found"
                                      : s.stopped_reason}{" "}
                                    ({s.pages_scraped ?? 0} pages indexed)
                                  </div>
                                )}
                                {s.error && <div className="text-xs text-red-600 mt-1">{s.error}</div>}
                              </div>
                            </label>
                            {canEdit && (
                              <div className="flex flex-wrap items-center gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-border/50 shrink-0 w-full lg:w-auto justify-start lg:justify-end opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200">
                                {isScrape && (
                                  <button
                                    type="button"
                                    onClick={() => onSchedule(s.source_id)}
                                    disabled={busy}
                                    className="text-xs font-bold text-[#0396A6] hover:underline cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 px-2 py-1"
                                  >
                                    Schedule Recrawl
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => onReindex(s.source_id)}
                                  disabled={busy}
                                  className="text-xs font-bold text-[#0396A6] hover:underline cursor-pointer transition-colors flex items-center gap-1.5 disabled:opacity-50 px-2 py-1"
                                >
                                  Re-index
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void onOpenEdit(s)}
                                  disabled={busy || editBusy}
                                  title="Edit indexed text"
                                  className="w-8 h-8 rounded-xl hover:bg-[#0396A6] text-[#0396A6] hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                                >
                                  <Pencil size={14} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDelete(s.source_id, s.scrape_url || s.filename)}
                                  disabled={busy}
                                  title="Delete source"
                                  className="w-8 h-8 rounded-xl hover:bg-red-500 text-red-500 hover:text-white flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95 disabled:opacity-50"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Pinned Pagination at Bottom */}
                    <Pagination
                      currentPage={currentPage}
                      pageSize={pageSize}
                      totalItems={sourceTotal}
                      onPageChange={(page) => {
                        setCurrentPage(page);
                        setSourceOffset((page - 1) * pageSize);
                      }}
                      onPageSizeChange={(newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(1);
                        setSourceOffset(0);
                      }}
                      pageSizeOptions={[5, 10, 20, 25, 50]}
                      itemLabel="sources"
                      className="shrink-0 border-t border-border mt-auto pt-2.5 bg-transparent"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* 2. ADD KNOWLEDGE SUBTAB */}
            {manageTab === "add" && (
              <motion.div
                className="glass-card bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {canEdit ? (
                  <div className="flex flex-col h-full flex-1 min-h-0">
                    <div className="flex items-center justify-center w-full mb-4 shrink-0">
                      <div className="flex items-center gap-1.5 p-1 rounded-full bg-muted/20 border border-border shadow-2xs w-max overflow-x-auto no-scrollbar">
                        <button
                          type="button"
                          onClick={() => setAddType("upload")}
                          className={cn(
                            "px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                            addType === "upload"
                              ? "bg-[#0396A6] text-white shadow-sm font-extrabold"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                          )}
                        >
                          <FileText size={15} className={addType === "upload" ? "text-white" : "text-muted-foreground"} />
                          <span>Upload Document</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddType("crawl")}
                          className={cn(
                            "px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                            addType === "crawl"
                              ? "bg-[#0396A6] text-white shadow-sm font-extrabold"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                          )}
                        >
                          <Globe size={15} className={addType === "crawl" ? "text-white" : "text-muted-foreground"} />
                          <span>Crawl Website</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setAddType("qa")}
                          className={cn(
                            "px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-2",
                            addType === "qa"
                              ? "bg-[#0396A6] text-white shadow-sm font-extrabold"
                              : "text-muted-foreground hover:text-foreground hover:bg-white/60"
                          )}
                        >
                          <Layers size={15} className={addType === "qa" ? "text-white" : "text-muted-foreground"} />
                          <span>Manual Q&A</span>
                        </button>
                      </div>
                    </div>

                    <div className="w-full flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar">
                      {addType === "upload" && (
                        <div className="flex flex-col flex-1 min-h-0 justify-between">
                          <div className="shrink-0 mb-3">
                            <h2 className="text-base sm:text-lg font-bold text-foreground mb-0.5">
                              Upload a Document
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Upload your product manuals, company policies, support FAQs, or documentation to train your AI agent.
                            </p>
                          </div>

                          <form onSubmit={onUpload} className="flex-1 min-h-0 flex flex-col justify-between gap-3 sm:gap-4">
                            {/* Modern Drag & Drop Hero Zone */}
                            <div
                              onDragOver={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                              }}
                              onDragEnter={(e) => {
                                e.preventDefault();
                                setIsDragging(true);
                              }}
                              onDragLeave={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                              }}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDragging(false);
                                const file = e.dataTransfer.files?.[0];
                                if (file) {
                                  if (fileRef.current) {
                                    const dataTransfer = new DataTransfer();
                                    dataTransfer.items.add(file);
                                    fileRef.current.files = dataTransfer.files;
                                  }
                                  setSelectedFile(file);
                                  setSelectedFileName(file.name);
                                }
                              }}
                              onClick={() => {
                                if (!selectedFile) fileRef.current?.click();
                              }}
                              className={cn(
                                "relative group rounded-2xl border-2 border-dashed transition-all duration-300 p-6 sm:p-8 flex-1 min-h-[190px] sm:min-h-[220px] flex flex-col items-center justify-center text-center overflow-hidden",
                                isDragging
                                  ? "border-[#0396A6] bg-[#0396A6]/10 scale-[1.005] shadow-[0_0_30px_rgba(3,150,166,0.2)]"
                                  : selectedFile
                                  ? "border-[#0396A6]/50 bg-[#0396A6]/5"
                                  : "border-border/80 hover:border-[#0396A6]/60 bg-muted/15 hover:bg-[#0396A6]/5 cursor-pointer"
                              )}
                            >
                              <input
                                ref={fileRef}
                                type="file"
                                accept={ACCEPT}
                                required={!selectedFile}
                                className="hidden"
                                onChange={(e) => {
                                  const f = e.target.files?.[0] || null;
                                  setSelectedFile(f);
                                  setSelectedFileName(f?.name || "");
                                }}
                              />

                              {/* Decorative ambient gradient glow */}
                              <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#0396A6]/10 blur-3xl pointer-events-none group-hover:bg-[#0396A6]/20 transition-all" />

                              {selectedFile ? (
                                /* File Selected Preview State */
                                <div className="flex flex-col items-center gap-3 relative z-10 w-full max-w-md my-auto">
                                  <div className="w-16 h-16 rounded-2xl text-[#0396A6] flex items-center justify-center shadow-[0_0_20px_rgba(3,150,166,0.2)]">
                                    <FileText size={32} />
                                  </div>
                                  <div className="text-center w-full">
                                    <h4 className="font-extrabold text-sm sm:text-base text-foreground truncate px-2">
                                      {selectedFile.name}
                                    </h4>
                                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">
                                      {(selectedFile.size / 1024).toFixed(1)} KB · Ready to index
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 mt-2">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        fileRef.current?.click();
                                      }}
                                      className="px-3.5 py-1.5 rounded-xl bg-card border border-border text-xs font-semibold text-foreground hover:border-[#0396A6]/40 hover:text-[#0396A6] transition-colors cursor-pointer"
                                    >
                                      Change File
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (fileRef.current) fileRef.current.value = "";
                                        setSelectedFile(null);
                                        setSelectedFileName("");
                                      }}
                                      className="p-1.5 rounded-xl bg-card border border-border text-muted-foreground hover:text-red-500 hover:border-red-500/30 transition-colors cursor-pointer"
                                      title="Remove file"
                                    >
                                      <X size={15} />
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                /* Empty Dropzone State */
                                <div className="flex flex-col items-center gap-3 relative z-10 my-auto">
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-[#0396A6] flex items-center justify-center shadow-[0_0_20px_rgba(3,150,166,0.15)] group-hover:scale-105 transition-all">
                                    <Upload size={28} className="text-[#0396A6]" />
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-sm sm:text-base font-bold text-foreground">
                                      <span className="text-[#0396A6] underline underline-offset-2">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Upload PDF, DOCX, TXT, CSV, or Markdown up to {MAX_MB} MB
                                    </p>
                                  </div>

                                  {/* Supported File Extension Chips */}
                                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                                    {["PDF", "DOCX", "TXT", "CSV", "MARKDOWN"].map((ext) => (
                                      <span
                                        key={ext}
                                        className="px-2.5 py-0.5 rounded-md bg-card border border-border text-[10px] font-bold text-muted-foreground tracking-wide"
                                      >
                                        {ext}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Agent Attachment & Upload Action Bar */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-muted/20 border border-border/80 shrink-0 mt-auto">
                              {agents.length > 0 ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 flex-1 min-w-0">
                                  <span className="text-xs sm:text-sm font-bold text-foreground shrink-0">
                                    Attach to Agent:
                                  </span>
                                  <div className="w-full sm:max-w-xs">
                                    <Select
                                      value={agentId}
                                      onChange={(v) => {
                                        setAgentId(v);
                                        syncAgentQuery(v);
                                      }}
                                      options={agentSelectOptions}
                                      style={{ width: "100%" }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div />
                              )}

                              <Button
                                type="submit"
                                loading={busy}
                                disabled={!selectedFile && !selectedFileName}
                                className="bg-[#0396A6] hover:bg-[#0396A6]/90 text-white rounded-xl px-6 py-2.5 font-extrabold text-xs sm:text-sm cursor-pointer transition-all shadow-[0_4px_16px_rgba(3,150,166,0.25)] hover:shadow-[0_6px_22px_rgba(3,150,166,0.35)] shrink-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                              >
                                <Upload size={15} />
                                <span>Upload & Index Document</span>
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}

                      {addType === "crawl" && (
                        <div className="flex flex-col flex-1 min-h-0 justify-between">
                          <div className="shrink-0 mb-3">
                            <h2 className="text-base sm:text-lg font-bold text-foreground mb-0.5">
                              Crawl Website & Web Pages
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Automatically crawl, clean, vectorize, and index entire websites or specific documentation pages.
                            </p>
                          </div>

                          <form onSubmit={onCrawl} className="flex-1 min-h-0 flex flex-col justify-between gap-4">
                            <div className="space-y-4">
                              {/* Target URL Input Bar */}
                              <div className="space-y-1.5">
                                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                                  <span>Website, Documentation, or Sitemap URL</span>
                                  <span className="text-[11px] font-medium text-muted-foreground">HTTP / HTTPS</span>
                                </label>
                                <div className="relative flex items-center">
                                  <div className="absolute left-3.5 sm:left-4 text-[#0396A6] pointer-events-none">
                                    <Globe size={18} />
                                  </div>
                                  <input
                                    type="url"
                                    placeholder="https://example.com, /docs, or /sitemap.xml"
                                    value={crawlUrl}
                                    onChange={(e) => {
                                      setCrawlUrl(e.target.value);
                                      if (e.target.value.toLowerCase().includes("sitemap") || e.target.value.toLowerCase().endsWith(".xml")) {
                                        setUseSitemap(true);
                                      }
                                    }}
                                    required
                                    className="w-full pl-11 sm:pl-12 pr-4 py-3 sm:py-3.5 border border-border/80 focus:border-[#0396A6] rounded-2xl bg-card text-xs sm:text-sm text-foreground outline-none transition-all shadow-2xs font-medium placeholder:text-muted-foreground/60"
                                  />
                                  {crawlUrl && (
                                    <button
                                      type="button"
                                      onClick={() => setCrawlUrl("")}
                                      className="absolute right-3.5 p-1 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>

                              {/* Configuration Grid: Crawl Depth & Attach to Agent */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 p-4 rounded-2xl border border-border/70 bg-muted/15">
                                {/* Crawl Depth */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-foreground block">
                                    Crawl Depth
                                  </label>
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                      { depth: 1, label: "Depth 1", desc: "Single Page" },
                                      { depth: 2, label: "Depth 2", desc: "Standard" },
                                      { depth: 3, label: "Depth 3", desc: "Deep Crawl" },
                                    ].map((d) => (
                                      <button
                                        key={d.depth}
                                        type="button"
                                        onClick={() => setCrawlDepth(d.depth)}
                                        className={cn(
                                          "px-2 py-2 rounded-xl text-xs font-bold border transition-all text-center flex flex-col items-center justify-center cursor-pointer",
                                          crawlDepth === d.depth
                                            ? "bg-[#0396A6] text-white border-[#0396A6] shadow-xs font-extrabold"
                                            : "bg-card border-border/80 text-muted-foreground hover:border-[#0396A6]/40 hover:text-foreground"
                                        )}
                                      >
                                        <span>{d.label}</span>
                                        <span className={cn("text-[10px] font-medium", crawlDepth === d.depth ? "text-white/80" : "text-muted-foreground")}>
                                          {d.desc}
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Attach to Agent */}
                                <div className="space-y-1.5">
                                  <label className="text-xs font-bold text-foreground block">
                                    Attach to Agent
                                  </label>
                                  {agents.length > 0 ? (
                                    <div className="w-full">
                                      <Select
                                        value={agentId}
                                        onChange={(v) => {
                                          setAgentId(v);
                                          syncAgentQuery(v);
                                        }}
                                        options={agentSelectOptions}
                                        style={{ width: "100%" }}
                                      />
                                    </div>
                                  ) : (
                                    <div className="px-3 py-2 rounded-xl border border-border/80 bg-card text-xs text-muted-foreground font-medium">
                                      Shared library (universal)
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Footer */}
                            <div className="flex justify-end pt-2 shrink-0 mt-auto">
                              <Button
                                type="submit"
                                loading={busy}
                                disabled={!crawlUrl.trim()}
                                className="bg-[#0396A6] hover:bg-[#0396A6]/90 text-white rounded-xl px-7 py-3 font-extrabold text-xs sm:text-sm cursor-pointer transition-all shadow-[0_4px_16px_rgba(3,150,166,0.25)] hover:shadow-[0_6px_22px_rgba(3,150,166,0.35)] shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Globe size={15} />
                                <span>Start Website Crawl</span>
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}

                      {addType === "qa" && (
                        <div className="flex flex-col flex-1 min-h-0 justify-between">
                          <div className="shrink-0 mb-3">
                            <h2 className="text-base sm:text-lg font-bold text-foreground mb-0.5">
                              Add Manual Q&A Pair
                            </h2>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              Directly teach your agent a question and answer pair. It is immediately vectorized and ready for
                              customer queries.
                            </p>
                          </div>
                          <form onSubmit={onAddQa} className="flex-1 min-h-0 flex flex-col justify-between gap-4">
                            <div className="flex flex-col gap-3.5 flex-1 min-h-0">
                              <input
                                type="text"
                                placeholder="Question (e.g. What is your refund policy?)"
                                value={qaQuestion}
                                onChange={(e) => setQaQuestion(e.target.value)}
                                required
                                className="w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-xl bg-background text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6] shrink-0"
                              />
                              <textarea
                                placeholder="Answer (e.g. We offer a full 30-day money-back guarantee...)"
                                value={qaAnswer}
                                onChange={(e) => setQaAnswer(e.target.value)}
                                rows={5}
                                required
                                className="w-full flex-1 min-h-[140px] px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-xl bg-background text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6] font-sans resize-y"
                              />
                            </div>

                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pt-1 shrink-0 mt-auto">
                              {agents.length > 0 ? (
                                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 flex-1 min-w-0">
                                  <span className="text-xs sm:text-sm font-semibold text-foreground shrink-0">
                                    Attach to agent:
                                  </span>
                                  <div className="w-full sm:w-auto sm:min-w-[280px] max-w-sm">
                                    <Select
                                      value={agentId}
                                      onChange={(v) => {
                                        setAgentId(v);
                                        syncAgentQuery(v);
                                      }}
                                      options={agentSelectOptions}
                                      style={{ width: "100%" }}
                                    />
                                  </div>
                                </div>
                              ) : (
                                <div />
                              )}

                              <Button
                                type="submit"
                                loading={busy}
                                disabled={!qaQuestion.trim() || !qaAnswer.trim()}
                                className="bg-[#0396A6] hover:bg-[#0396A6]/90 text-white rounded-xl px-7 py-3 font-extrabold text-xs sm:text-sm cursor-pointer transition-all shadow-[0_4px_16px_rgba(3,150,166,0.25)] hover:shadow-[0_6px_22px_rgba(3,150,166,0.35)] shrink-0 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
                              >
                                <Sparkles size={15} />
                                <span>Save Q&A Pair</span>
                              </Button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-[#F4EFE6] text-muted-foreground text-xs sm:text-sm">
                    Read-only — adding or removing knowledge needs the `kb:edit` permission.
                  </div>
                )}
              </motion.div>
            )}

            {/* 3. KNOWLEDGE GAPS SUBTAB */}
            {manageTab === "gaps" && (
              <motion.div
                className="glass-card bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-3 shrink-0">
                  <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">
                    Knowledge Gaps
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Queries from customer conversations that your agent could not confidently answer from current knowledge.
                  </p>
                </div>
                {!gaps.length ? (
                  <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-muted/10 my-auto">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">No open knowledge gaps!</p>
                    <p className="text-xs text-muted-foreground">Your AI agent has sufficient knowledge for recent queries.</p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Inner Scrollable Container with hidden scrollbar */}
                    <div className="overflow-y-auto no-scrollbar scroll-smooth pr-0.5 space-y-2.5 flex-1 min-h-0">
                      {gaps
                        .slice((gapsPage - 1) * gapsPageSize, gapsPage * gapsPageSize)
                        .map((g) => (
                          <div
                            key={g.id}
                            className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col gap-2.5"
                          >
                            <div>
                              <span className="font-bold text-sm text-foreground break-words block">
                                &ldquo;{g.query_text}&rdquo;
                              </span>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                Unanswered customer query · Needs manual Q&A resolution
                              </p>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-2 mt-1">
                              <input
                                type="text"
                                placeholder="Type answer to resolve & index as Q&A..."
                                value={gapAnswers[g.id] || ""}
                                onChange={(e) => setGapAnswers({ ...gapAnswers, [g.id]: e.target.value })}
                                className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6] font-medium"
                              />
                              <button
                                type="button"
                                onClick={() => onResolveGap(g.id)}
                                disabled={busy || !(gapAnswers[g.id] || "").trim()}
                                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-bold text-xs sm:text-sm border-none cursor-pointer transition-colors shrink-0 disabled:opacity-50"
                              >
                                Resolve & Save
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Pinned Pagination at Bottom */}
                    <Pagination
                      currentPage={gapsPage}
                      pageSize={gapsPageSize}
                      totalItems={gaps.length}
                      onPageChange={setGapsPage}
                      onPageSizeChange={(newSize) => {
                        setGapsPageSize(newSize);
                        setGapsPage(1);
                      }}
                      pageSizeOptions={[5, 10, 20, 25]}
                      itemLabel="gaps"
                      className="shrink-0 border-t border-border mt-auto pt-2.5 bg-transparent"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* 4. TEST RETRIEVAL SUBTAB */}
            {manageTab === "search" && (
              <motion.div
                className="glass-card bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-xs h-fit flex flex-col"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-4 shrink-0">
                  <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">
                    Test Knowledge Retrieval
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Test vector retrieval against your indexed knowledge base to preview matched chunks and similarity scores.
                  </p>
                </div>
                <form
                  onSubmit={onSearchPreview}
                  className={cn(
                    "flex flex-col sm:flex-row gap-2 sm:gap-2.5 shrink-0",
                    (searchResults.length > 0 || (searchQuery && !isSearching)) && "mb-4 sm:mb-5"
                  )}
                >
                  <input
                    type="text"
                    placeholder="Type a test customer query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    required
                    className="flex-1 w-full px-3.5 sm:px-4 py-2.5 sm:py-3 border border-border rounded-xl bg-background text-xs sm:text-sm text-foreground outline-none focus:border-[#0396A6]"
                  />
                  <Button
                    type="submit"
                    loading={isSearching}
                    className="w-full sm:w-auto bg-[#0396A6] hover:bg-[#0396A6]/90 text-white rounded-xl px-5 py-2.5 sm:py-3 font-bold text-xs sm:text-sm shrink-0 cursor-pointer"
                  >
                    Search
                  </Button>
                </form>
                {searchResults.length > 0 ? (
                  <div className="overflow-y-auto no-scrollbar scroll-smooth pr-0.5 space-y-3 max-h-[55vh]">
                    {searchResults.map((h, i) => (
                      <div key={i} className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className="font-bold text-sm text-[#0396A6]">{h.source_name}</span>
                          <span className="font-bold text-xs text-emerald-600">{(h.score * 100).toFixed(1)}% Match</span>
                        </div>
                        <p className="text-xs sm:text-sm text-foreground whitespace-pre-wrap bg-muted/20 p-3 rounded-xl border border-border/50 font-mono leading-relaxed">
                          {h.chunk_text}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : searchQuery && !isSearching ? (
                  <div className="p-6 text-center rounded-xl border border-dashed border-border text-muted-foreground text-xs sm:text-sm">
                    No results found in the knowledge base for this query.
                  </div>
                ) : null}
              </motion.div>
            )}

            {/* 5. SCHEDULES SUBTAB */}
            {manageTab === "schedules" && (
              <motion.div
                className="glass-card bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                <div className="mb-3 shrink-0">
                  <h2 className="text-base sm:text-lg font-bold text-foreground mb-1">
                    Active Crawl Schedules
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Scheduled background tasks to automatically recrawl your website sources and keep AI knowledge fresh.
                  </p>
                </div>
                {!schedules.length ? (
                  <div className="text-center py-10 px-4 rounded-xl border border-dashed border-border bg-muted/10 my-auto">
                    <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-60" />
                    <p className="text-xs sm:text-sm font-semibold text-foreground mb-0.5">No active schedules</p>
                    <p className="text-xs text-muted-foreground">
                      You can schedule weekly recrawls from the All Sources tab on any crawled website.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
                    {/* Inner Scrollable Container with hidden scrollbar */}
                    <div className="overflow-y-auto no-scrollbar scroll-smooth pr-0.5 space-y-2.5 flex-1 min-h-0">
                      {schedules
                        .slice((schedulesPage - 1) * schedulesPageSize, schedulesPage * schedulesPageSize)
                        .map((s, i) => (
                          <div
                            key={i}
                            className="p-3.5 sm:p-4 rounded-xl border border-border bg-card flex flex-col gap-1.5 sm:gap-2"
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="text-sm font-bold text-foreground break-all">
                                {s.scrape_url || "Website"}
                              </span>
                              <span className="text-xs font-bold text-emerald-600">
                                Active
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Interval: {s.interval} | Last run:{" "}
                              {s.last_run_at ? new Date(s.last_run_at).toLocaleString() : "Pending"}
                            </p>
                          </div>
                        ))}
                    </div>

                    {/* Pinned Pagination at Bottom */}
                    <Pagination
                      currentPage={schedulesPage}
                      pageSize={schedulesPageSize}
                      totalItems={schedules.length}
                      onPageChange={setSchedulesPage}
                      onPageSizeChange={(newSize) => {
                        setSchedulesPageSize(newSize);
                        setSchedulesPage(1);
                      }}
                      pageSizeOptions={[5, 10, 20, 25]}
                      itemLabel="schedules"
                      className="shrink-0 border-t border-border mt-auto pt-2.5 bg-transparent"
                    />
                  </div>
                )}
              </motion.div>
            )}

            {/* 6. ADVANCED OPTIONS SUBTAB */}
            {manageTab === "advanced" && (
              <motion.div
                className="glass-card bg-card border border-border rounded-2xl p-5 sm:p-8 shadow-xs flex-1 min-h-0 flex flex-col overflow-hidden"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
              >
                {/* Header with rounded teal icon box */}
                <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border/70 shrink-0">
                  <div className="w-12 h-12 rounded-2xl text-[#0396A6] flex items-center justify-center shrink-0">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                      Advanced Options & Guidelines
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      Follow these best practices to improve knowledge accuracy and retrieval.
                    </p>
                  </div>
                </div>

                {/* Rows with icons, titles, vertical dividers, and descriptions */}
                <div className="overflow-y-auto no-scrollbar scroll-smooth divide-y divide-border/70 flex-1 min-h-0">
                  {/* Row 1: Sitemaps */}
                  <div className="py-4 sm:py-4.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 first:pt-0 last:pb-0">
                    <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0">
                      <Network size={20} />
                    </div>
                    <div className="w-full sm:w-44 md:w-52 font-bold text-foreground text-sm shrink-0">
                      Sitemaps
                    </div>
                    <div className="w-px h-7 bg-border/80 hidden sm:block shrink-0" />
                    <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                      Paste <code className="font-mono text-foreground font-semibold text-xs bg-muted/30 px-1 py-0.5 rounded">sitemap.xml</code> URL (or check the sitemap box). Pages must reside on the same domain; standard SSRF safety rules apply.
                    </div>
                  </div>

                  {/* Row 2: Notion & Google Drive */}
                  <div className="py-4 sm:py-4.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 last:pb-0">
                    <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0">
                      <FileText size={20} />
                    </div>
                    <div className="w-full sm:w-44 md:w-52 font-bold text-foreground text-sm shrink-0">
                      Notion & Google Drive
                    </div>
                    <div className="w-px h-7 bg-border/80 hidden sm:block shrink-0" />
                    <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                      Export as Markdown, PDF, or CSV and upload here, or crawl a public shared link.
                    </div>
                  </div>

                  {/* Row 3: Vector Revision History */}
                  <div className="py-4 sm:py-4.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 last:pb-0">
                    <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0">
                      <History size={20} />
                    </div>
                    <div className="w-full sm:w-44 md:w-52 font-bold text-foreground text-sm shrink-0">
                      Vector Revision History
                    </div>
                    <div className="w-px h-7 bg-border/80 hidden sm:block shrink-0" />
                    <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                      Saving edited text stores the last 10 snapshots so you can restore earlier text if needed.
                    </div>
                  </div>

                  {/* Row 4: Shared Library */}
                  <div className="py-4 sm:py-4.5 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 last:pb-0">
                    <div className="w-10 h-10 rounded-xl text-[#0396A6] flex items-center justify-center shrink-0">
                      <Layers size={20} />
                    </div>
                    <div className="w-full sm:w-44 md:w-52 font-bold text-foreground text-sm shrink-0">
                      Shared Library
                    </div>
                    <div className="w-px h-7 bg-border/80 hidden sm:block shrink-0" />
                    <div className="text-xs sm:text-sm text-muted-foreground leading-relaxed flex-1">
                      Sources not assigned to a specific agent are shared universally and retrieved by every agent.
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </div>
      </EntitlementGate>

      {/* Edit Text Modal */}
      {editSource && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden shadow-2xl border border-[#D9EDEE] my-auto">
            <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-border/80 bg-white shrink-0">
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center shrink-0">
                  <Pencil size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base sm:text-lg text-foreground">
                    Edit Indexed Text
                  </h3>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    Update the chunked text used for retrieval. Saving re-embeds and replaces the old vectors.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditSource(null)}
                disabled={editBusy}
                className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <label className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Indexed content
                </label>
                <span className="text-[11px] font-mono font-semibold text-muted-foreground">
                  {editText.length.toLocaleString()} chars
                </span>
              </div>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={12}
                placeholder="Paste or edit the text that was indexed for this source. Headings and paragraphs are preserved when chunked for search."
                className="w-full min-h-[220px] sm:min-h-[280px] p-3.5 sm:p-4 rounded-xl text-xs sm:text-sm border border-border bg-white text-foreground resize-y outline-none focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/15 font-mono leading-relaxed placeholder:text-muted-foreground/55"
              />
              {revisions.length > 0 && (
                <div className="max-h-32 overflow-y-auto text-xs flex flex-col gap-1.5 pt-1">
                  <strong className="text-foreground text-[11px] uppercase tracking-wider">Previous versions</strong>
                  {revisions.map((r) => (
                    <div
                      key={r.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 p-2.5 rounded-xl bg-white border border-border/70"
                    >
                      <span className="truncate text-muted-foreground">
                        {r.created_at ? new Date(r.created_at).toLocaleString() : r.id} · {r.chars} chars · {r.preview}
                      </span>
                      <button
                        type="button"
                        disabled={editBusy}
                        onClick={async () => {
                          setEditBusy(true);
                          try {
                            await apiRequest(
                              `/v1/kb/sources/${editSource.source_id}/revisions/${r.id}/restore`,
                              { method: "POST" }
                            );
                            setNotice("Restored a previous version and re-indexed.");
                            setEditSource(null);
                            await load();
                          } catch (err) {
                            setError(err instanceof Error ? err.message : "Restore failed");
                          } finally {
                            setEditBusy(false);
                          }
                        }}
                        className="text-[#0396A6] hover:underline font-semibold shrink-0 cursor-pointer text-left sm:text-right"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 sm:px-6 py-4 border-t border-border/80 bg-white shrink-0">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditSource(null)}
                disabled={editBusy}
                className="w-full sm:w-auto cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                loading={editBusy}
                onClick={() => void onSaveEdit()}
                className="w-full sm:w-auto bg-[#0396A6] hover:bg-[#0396A6]/90 text-white font-semibold cursor-pointer"
              >
                Save and Re-index
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        show={confirmState.show}
        title={confirmState.title}
        message={confirmState.message}
        tone={confirmState.tone}
        confirmText={confirmState.confirmText}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState((prev) => ({ ...prev, show: false }))}
      />
    </AppShell>
  );
}
