"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Background,
  Controls,
  Edge,
  Handle,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { AppShell } from "@/components/shell/AppShell";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/StatusBadge";
import styles from "./ecosystem.module.css";

type EcosystemNodeData = {
  label: string;
  desc: string;
  icon: string;
  href: string;
  layer: "channels" | "brain" | "revenue";
};

function CustomEcosystemNode({ data, selected }: NodeProps<Node<EcosystemNodeData>>) {
  const router = useRouter();

  return (
    <div
      className={[
        styles.nodeCard,
        selected ? styles.nodeActive : "",
      ].join(" ")}
      onClick={() => {
        // Double click or click to navigate
      }}
    >
      <Handle type="target" position={Position.Left} className="!bg-[rgba(3,150,166,0.06)]0 !w-3 !h-3" />
      <div className={styles.nodeHeader}>
        <div className={styles.nodeIconWrap}>
          <span className="material-symbols-outlined text-base">
            {data.icon}
          </span>
        </div>
        <h3 className={styles.nodeTitle}>{data.label}</h3>
      </div>
      <p className={styles.nodeDesc}>{data.desc}</p>
      <div className="flex items-center justify-between mt-2">
        <span className={styles.badge}>{data.layer.toUpperCase()}</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            router.push(data.href);
          }}
          className="text-xs text-[#0396A6] font-semibold hover:underline flex items-center gap-0.5"
        >
          Open <span className="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
      <Handle type="source" position={Position.Right} className="!bg-[rgba(3,150,166,0.06)]0 !w-3 !h-3" />
    </div>
  );
}

const INITIAL_NODES: Node<EcosystemNodeData>[] = [
  {
    id: "wa",
    type: "ecosystem",
    position: { x: 40, y: 80 },
    data: {
      label: "WhatsApp Business",
      desc: "Meta WABA phone numbers & approved message templates.",
      icon: "chat",
      href: "/whatsapp",
      layer: "channels",
    },
  },
  {
    id: "web",
    type: "ecosystem",
    position: { x: 40, y: 250 },
    data: {
      label: "Website Widget",
      desc: "Embeddable script bubble for visitors on your live site.",
      icon: "widgets",
      href: "/widget",
      layer: "channels",
    },
  },
  {
    id: "unified",
    type: "ecosystem",
    position: { x: 40, y: 420 },
    data: {
      label: "Unified Handoff",
      desc: "Continue-on-WhatsApp cross-channel persistence.",
      icon: "dynamic_feed",
      href: "/unified",
      layer: "channels",
    },
  },
  {
    id: "agent",
    type: "ecosystem",
    position: { x: 370, y: 150 },
    data: {
      label: "Frosty AI Agent",
      desc: "Configured persona, custom tone, & fallback rules.",
      icon: "smart_toy",
      href: "/agents",
      layer: "brain",
    },
  },
  {
    id: "kb",
    type: "ecosystem",
    position: { x: 370, y: 340 },
    data: {
      label: "RAG Knowledge Base",
      desc: "Uploaded PDFs, FAQ docs, and strict grounding tau.",
      icon: "menu_book",
      href: "/knowledge",
      layer: "brain",
    },
  },
  {
    id: "inbox",
    type: "ecosystem",
    position: { x: 370, y: 510 },
    data: {
      label: "Human Inbox Queue",
      desc: "Live agent takeover when customer requests handoff.",
      icon: "inbox",
      href: "/inbox",
      layer: "brain",
    },
  },
  {
    id: "leads",
    type: "ecosystem",
    position: { x: 700, y: 80 },
    data: {
      label: "CRM Lead Capture",
      desc: "Extracted customer names, emails, & hot intent score.",
      icon: "person_search",
      href: "/leads",
      layer: "revenue",
    },
  },
  {
    id: "quotes",
    type: "ecosystem",
    position: { x: 700, y: 250 },
    data: {
      label: "PDF Quotations",
      desc: "Itemized product quotes with GST tax slabs.",
      icon: "request_quote",
      href: "/quotes",
      layer: "revenue",
    },
  },
  {
    id: "meetings",
    type: "ecosystem",
    position: { x: 700, y: 420 },
    data: {
      label: "Calendar Meetings",
      desc: "Automated booking slots synced with Google Calendar.",
      icon: "event_available",
      href: "/meetings",
      layer: "revenue",
    },
  },
  {
    id: "webhooks",
    type: "ecosystem",
    position: { x: 700, y: 560 },
    data: {
      label: "HTTP Webhooks",
      desc: "Signed events to Zapier, Zoho, or your own HTTPS URL.",
      icon: "webhook",
      href: "/webhooks",
      layer: "revenue",
    },
  },
];

const INITIAL_EDGES: Edge[] = [
  { id: "e-wa-agent", source: "wa", target: "agent", animated: true, style: { stroke: "#0396A6", strokeWidth: 2 } },
  { id: "e-web-agent", source: "web", target: "agent", animated: true, style: { stroke: "#0396A6", strokeWidth: 2 } },
  { id: "e-kb-agent", source: "kb", target: "agent", animated: false, style: { stroke: "#64748b", strokeWidth: 2, strokeDasharray: "4 4" } },
  { id: "e-agent-inbox", source: "agent", target: "inbox", animated: true, style: { stroke: "#f59e0b", strokeWidth: 2 } },
  { id: "e-unified-inbox", source: "unified", target: "inbox", animated: false, style: { stroke: "#64748b", strokeWidth: 2 } },
  { id: "e-agent-leads", source: "agent", target: "leads", animated: true, style: { stroke: "#0396A6", strokeWidth: 2 } },
  { id: "e-agent-quotes", source: "agent", target: "quotes", animated: true, style: { stroke: "#0396A6", strokeWidth: 2 } },
  { id: "e-agent-meetings", source: "agent", target: "meetings", animated: true, style: { stroke: "#0396A6", strokeWidth: 2 } },
  { id: "e-leads-webhooks", source: "leads", target: "webhooks", animated: false, style: { stroke: "#64748b", strokeWidth: 1.5 } },
  { id: "e-quotes-webhooks", source: "quotes", target: "webhooks", animated: false, style: { stroke: "#64748b", strokeWidth: 1.5 } },
];

export default function EcosystemMapPage() {
  const nodeTypes = useMemo(() => ({ ecosystem: CustomEcosystemNode }), []);
  const [selectedNode, setSelectedNode] = useState<EcosystemNodeData | null>(null);

  return (
    <AppShell
      title="Frosty Ecosystem Flow Map"
      subtitle="Interactive architectural map of your customer channels, AI agents, RAG knowledge, and CRM outputs."
      requires="dashboard:view"
      actions={
        <div className="flex items-center gap-2">
          <Link href="/help">
            <Button variant="ghost">Help Hub</Button>
          </Link>
          <Link href="/home">
            <Button variant="ghost">Dashboard Home</Button>
          </Link>
        </div>
      }
    >
      <div className={styles.header}>
        <div className={styles.titleGroup}>
          <p className={styles.sub}>
            Click any node on the diagram below to inspect its role or navigate directly to its configuration page.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[rgba(3,150,166,0.06)]0 inline-block" />
            Live Message / Data Flow
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block" />
            Grounding / Webhook Event
          </span>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.flowWrap}>
          <ReactFlowProvider>
            <ReactFlow
              nodes={INITIAL_NODES}
              edges={INITIAL_EDGES}
              nodeTypes={nodeTypes}
              fitView
              minZoom={0.5}
              maxZoom={1.5}
              onNodeClick={(_, node) => {
                if (node.data) setSelectedNode(node.data as EcosystemNodeData);
              }}
            >
              <Background gap={18} size={1} />
              <Controls />
              <MiniMap
                nodeColor={(n) => {
                  if (n.id === "agent") return "#0396A6";
                  if (n.id === "inbox") return "#f59e0b";
                  return "#64748b";
                }}
              />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
      </div>

      <Modal
        open={Boolean(selectedNode)}
        onOpenChange={(v) => {
          if (!v) setSelectedNode(null);
        }}
        title={selectedNode?.label || ""}
        description={`Layer: ${selectedNode?.layer.toUpperCase() || ""}`}
      >
        {selectedNode ? (
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {selectedNode.desc}
            </p>
            <div className="flex justify-between items-center pt-4 border-t border-border">
              <Button variant="ghost" onClick={() => setSelectedNode(null)}>
                Close
              </Button>
              <Link href={selectedNode.href}>
                <Button>
                  Open {selectedNode.label}
                  <span className="material-symbols-outlined ml-1 text-sm">
                    open_in_new
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        ) : null}
      </Modal>
    </AppShell>
  );
}
