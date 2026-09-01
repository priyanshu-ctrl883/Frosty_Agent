"use client";

import {
  ArrowRight,
  Check,
  MessageSquare,
  CalendarCheck,
  ShoppingBag,
  Headphones,
  TrendingUp,
  LayoutGrid,
} from "lucide-react";

export interface TemplateOption {
  id: string;
  name: string;
  industry: string;
  color: string;
  icon: React.ReactNode;
  tagline: string;
  welcome: string;
  conversation: Array<{ role: "bot" | "user"; text: string }>;
  stat: { label: string; value: string };
  prompt: string;
}

export const TEMPLATES: TemplateOption[] = [
  {
    id: "lead_gen",
    name: "Lead Generation & Sales",
    industry: "Sales & Growth",
    color: "#0396A6",
    icon: <TrendingUp className="w-4 h-4" />,
    tagline: "Capture visitor contact info, qualify intent, and convert prospects 24/7.",
    welcome: "Hi! I can help you find the right plan for your business. May I ask a few quick questions?",
    stat: { label: "Leads qualified", value: "24/7" },
    conversation: [],
    prompt:
      "You are a warm, conversational lead qualification agent. Engage website visitors, understand their business needs, collect contact details, and guide them toward a demo or purchase. Always be helpful and non-pushy.",
  },
  {
    id: "customer_support",
    name: "Customer Support & Triage",
    industry: "Customer Support",
    color: "#0396A6",
    icon: <Headphones className="w-4 h-4" />,
    tagline: "Resolve repetitive customer queries, order status, and FAQs with zero latency.",
    welcome: "Hello! How can I help you today?",
    stat: { label: "Queries resolved", value: "< 2s" },
    conversation: [],
    prompt:
      "You are a professional, empathetic customer support agent. Resolve queries quickly and accurately using the business knowledge base. Escalate to a human agent only when truly necessary.",
  },
  {
    id: "appointment",
    name: "Scheduling & Booking",
    industry: "Appointments",
    color: "#0396A6",
    icon: <CalendarCheck className="w-4 h-4" />,
    tagline: "Allow clients to book consultations, reserve slots, and receive calendar confirmations.",
    welcome: "Hi! I can help you book an appointment. When would you like to come in?",
    stat: { label: "No-shows reduced", value: "41%" },
    conversation: [],
    prompt:
      "You are a friendly scheduling assistant. Help users book, reschedule or cancel appointments. Send confirmations and reminders via WhatsApp and keep the calendar updated in real time.",
  },
  {
    id: "ecommerce",
    name: "E-Commerce & Orders",
    industry: "Retail & Store",
    color: "#0396A6",
    icon: <ShoppingBag className="w-4 h-4" />,
    tagline: "Help shoppers discover products, track shipments, and recover abandoned carts.",
    welcome: "Hey! Welcome to the store. Looking for something specific, or need help with your order?",
    stat: { label: "Cart recovery", value: "34%" },
    conversation: [],
    prompt:
      "You are an enthusiastic store assistant. Help customers discover products, answer product questions, track orders and recover abandoned carts. Always suggest the best-fit product based on their needs.",
  },
  {
    id: "faq_bot",
    name: "Knowledge Base & FAQs",
    industry: "Information",
    color: "#0396A6",
    icon: <MessageSquare className="w-4 h-4" />,
    tagline: "Provide accurate answers based strictly on your uploaded docs, policies, and pricing.",
    welcome: "Hello! I know everything about this business. What would you like to know?",
    stat: { label: "Questions handled", value: "81%" },
    conversation: [],
    prompt:
      "You are a knowledgeable, precise information agent. Answer FAQs using the business knowledge base. Be concise, accurate, and always direct the user to the next step if needed.",
  },
  {
    id: "all_in_one",
    name: "All-in-One Autonomous Agent",
    industry: "Full-Funnel",
    color: "#0396A6",
    icon: <LayoutGrid className="w-4 h-4" />,
    tagline: "A multi-faceted agent configured for support, lead capture, bookings, and FAQs.",
    welcome: "Hi! I am here to help with anything — questions, bookings, orders or support. What do you need?",
    stat: { label: "Coverage", value: "Full" },
    conversation: [],
    prompt:
      "You are a versatile, professional AI agent for this business. Handle customer support, lead capture, appointment booking, product questions and FAQs with equal competence. Always be helpful and on-brand.",
  },
];

interface Step1TemplatesProps {
  selectedTemplateId: string;
  onSelectTemplate: (template: TemplateOption) => void;
  onContinue: () => void;
  onSkip?: () => void;
}

export function Step1Templates({
  selectedTemplateId,
  onSelectTemplate,
  onContinue,
  onSkip,
}: Step1TemplatesProps) {
  return (
    <div className="w-full max-w-[560px] mx-auto animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="text-[11px] font-semibold tracking-wider text-[#0396A6] uppercase mb-1.5">
          Step 2 of 6 · Agent Objective
        </div>
        <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
          What is your AI agent&apos;s primary focus?
        </h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
          Frostrek customizes your agent around your core business objective.
        </p>
      </div>

      {/* Goal Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-6">
        {TEMPLATES.map((tmpl) => {
          const isActive = selectedTemplateId === tmpl.id;

          return (
            <div
              key={tmpl.id}
              role="radio"
              aria-checked={isActive}
              tabIndex={0}
              onClick={() => onSelectTemplate(tmpl)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelectTemplate(tmpl);
                }
              }}
              className={`p-3.5 rounded-xl border text-left transition-all duration-150 cursor-pointer flex flex-col justify-between select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0396A6] ${
                isActive
                  ? "border-[#0396A6] bg-[#F7FDFD] shadow-xs"
                  : "border-slate-200/90 bg-white hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
                      isActive
                        ? "bg-[#0396A6] text-white"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {tmpl.icon}
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center transition-all ${
                      isActive
                        ? "border-[#0396A6] bg-[#0396A6] text-white"
                        : "border-slate-300 bg-white"
                    }`}
                  >
                    {isActive && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-900 leading-snug">
                  {tmpl.name}
                </div>
                <p className="text-[11px] text-slate-500 font-normal mt-1 leading-normal">
                  {tmpl.tagline}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Action CTA */}
      <div className="space-y-2">
        <button
          type="button"
          onClick={onContinue}
          className="w-full h-10 rounded-lg bg-[#0396A6] hover:bg-[#087681] text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer active:scale-[0.99]"
        >
          <span>Continue to Channels</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="w-full py-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors text-center font-medium"
          >
            Skip and configure objective later
          </button>
        )}
      </div>
    </div>
  );
}
