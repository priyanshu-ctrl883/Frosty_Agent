"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { useWorkspace } from "@/lib/workspace";
import type { Plan } from "@/lib/types";
import { skipOnboardingStep, completeOnboardingStep } from "@/lib/onboarding";
import { clearBillingProcessing } from "@/lib/billingCheckout";
import { pollSubscriptionUntilMandateReady } from "@/lib/onboardingBilling";
import { refreshFrostySessionCookie } from "@/lib/session";

import { WizardShell } from "./components/WizardShell";
import { Step0Profile } from "./components/Step0Profile";
import { Step1Templates, TEMPLATES, type TemplateOption } from "./components/Step1Templates";
import { Step2Channels } from "./components/Step2Channels";
import { Step4UrlGoals } from "./components/Step4UrlGoals";
import { Step5Review } from "./components/Step5Review";
import { Step6Plans } from "./components/Step6Plans";
import { Step7Checkout } from "./components/Step7Checkout";
import { CORE_PLAN_TERMS, sortCorePlans, type BillingTerm } from "@/lib/corePlans";
import { RefreshCw } from "lucide-react";

function OnboardingWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const ws = useWorkspace();
  const { me, reload: reloadWorkspace } = ws;

  const [billingReturnPending, setBillingReturnPending] = useState(false);

  // Step Index (0 to 6)
  const [step, setStep] = useState<number>(0);

  // Form State across wizard
  const [orgName, setOrgName] = useState("");
  const [country, setCountry] = useState("India");
  const [referral, setReferral] = useState("Google Search");
  const [jobTitle, setJobTitle] = useState("Founder / CEO / Co-Founder");
  const [companySize, setCompanySize] = useState("1-10 employees");
  const [newsletter, setNewsletter] = useState(true);

  // Template / Objective selection
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption>(TEMPLATES[0]!);

  // Channels selection
  const [selectedChannels, setSelectedChannels] = useState<string[]>(["website", "whatsapp"]);

  // Website URL & Goals
  const [websiteUrl, setWebsiteUrl] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<string>("all");

  // Review & Bot Customization
  const [botName, setBotName] = useState<string>("Frostrek Assistant");
  const [brandColor, setBrandColor] = useState<string>("#0396A6");
  const [welcomeMessage, setWelcomeMessage] = useState<string>("Hi! How can I help you today?");
  const [behaviorPrompt, setBehaviorPrompt] = useState<string>(
    "You are a helpful, professional AI assistant for this business. Assist customers with inquiries, recommend products, and collect visitor details when needed."
  );

  // Plans & Billing
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<BillingTerm>("monthly");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [couponCode, setCouponCode] = useState("");

  // Loading & Feedback
  const [savingBot, setSavingBot] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [, setCreatedAgentId] = useState<string | null>(null);

  // Sync user profile on mount
  useEffect(() => {
    if (me?.display_name) {
      setBotName(`${me.display_name}'s Assistant`);
    }
  }, [me]);

  // Load plans from API
  useEffect(() => {
    void (async () => {
      try {
        const list = await apiRequest<Plan[]>("/v1/billing/plans");
        if (list && list.length > 0) {
          const active = list.filter((p) => p.is_active);
          setPlans(active);
          const growth = active.find((p) => p.slug === "growth") || active[0];
          if (growth) setSelectedPlan(growth);
        }
      } catch {
        // Fallback plans in component
      }
    })();
  }, []);

  // Re-bind selected plan from API when catalog reloads (prices are DB-backed).
  useEffect(() => {
    if (!selectedPlan?.slug || plans.length === 0) return;
    const fromApi = plans.find((p) => p.slug === selectedPlan.slug);
    if (fromApi) setSelectedPlan(fromApi);
  }, [plans, selectedPlan?.slug]);

  // Handler for template selection
  const handleSelectTemplate = (template: TemplateOption) => {
    setSelectedTemplate(template);
    setBrandColor(template.color);
    setWelcomeMessage(template.welcome);
    setBehaviorPrompt(template.prompt);
    setBotName(`${orgName || "Frostrek"} ${template.industry.split(" ")[0]} Bot`);
  };

  // Toggle channel
  const handleToggleChannel = (chId: string) => {
    setSelectedChannels((prev) =>
      prev.includes(chId) ? (prev.length > 1 ? prev.filter((id) => id !== chId) : prev) : [...prev, chId]
    );
  };

  // Skip wizard to Dashboard — fire redirect immediately, background calls run in parallel
  const handleSkipToDashboard = () => {
    setSkipping(true);
    // Fire & forget — don't block navigation on network
    void skipOnboardingStep("create_agent").catch(() => null);
    try {
      void reloadWorkspace();
    } catch {
      // Non-fatal
    }
    // Navigate immediately
    router.push("/home");
  };

  // Step 0: Save Profile -> Step 1
  const handleStep0Continue = async (data: {
    orgName: string;
    country: string;
    referral: string;
    jobTitle: string;
    companySize: string;
    newsletter: boolean;
    phone?: string;
  }) => {
    setOrgName(data.orgName);
    setCountry(data.country);
    setReferral(data.referral);
    setJobTitle(data.jobTitle);
    setCompanySize(data.companySize);
    setNewsletter(data.newsletter);

    try {
      await apiRequest("/v1/iam/profile/complete-setup", {
        method: "PATCH",
        body: {
          company_name: data.orgName,
          country: data.country,
          referral: data.referral,
          referral_source: data.referral,
          job_title: data.jobTitle,
          company_size: data.companySize,
          newsletter: data.newsletter,
          phone: data.phone,
        },
      });
    } catch {
      // Non-fatal
    }

    setStep(1);
  };

  // Step 4: Save Bot & Review -> Step 5 (Plans)
  const handleCreateChatbot = async () => {
    setSavingBot(true);
    try {
      const isUnified = selectedChannels.includes("website") && selectedChannels.includes("whatsapp");
      const isWhatsapp = selectedChannels.includes("whatsapp") && !selectedChannels.includes("website");
      const agentMode = isUnified ? "unified" : isWhatsapp ? "whatsapp" : "website";

      // 1. Create Agent via API
      try {
        const res = await apiRequest<{ id: string }>("/v1/agents", {
          method: "POST",
          body: {
            agent_name: botName.trim() || "Frostrek Assistant",
            mode: agentMode,
          },
        });
        if (res?.id) {
          setCreatedAgentId(res.id);
        }
      } catch {
        // Continue gracefully if already created
      }

      // 2. Patch Widget Appearance
      try {
        await apiRequest("/v1/widget/settings", {
          method: "PATCH",
          body: {
            title: botName.trim() || "Chat with us",
            greeting: welcomeMessage.trim() || "Hi! How can we help?",
            color: brandColor || "#0396A6",
          },
        });
      } catch {
        // Non-fatal
      }

      // 3. Initiate Knowledge Crawl if website URL provided
      if (websiteUrl.trim()) {
        try {
          await apiRequest("/v1/kb/sources/crawl", {
            method: "POST",
            body: {
              url: websiteUrl.trim(),
            },
          });
        } catch {
          // Non-fatal
        }
      }

      // 4. Mark checklist steps completed
      void completeOnboardingStep("create_agent").catch(() => null);
      if (websiteUrl.trim()) {
        void completeOnboardingStep("add_knowledge").catch(() => null);
      }
      void completeOnboardingStep("configure_channels").catch(() => null);

      setStep(5);
    } catch {
      setStep(5);
    } finally {
      setSavingBot(false);
    }
  };

  const handleAutopaySuccess = useCallback(async () => {
    void completeOnboardingStep("select_plan_trial").catch(() => null);
    try {
      await reloadWorkspace();
    } catch {
      // non-fatal
    }
    router.push("/home");
  }, [reloadWorkspace, router]);

  // Razorpay return → finish onboarding after mandate is active
  useEffect(() => {
    if (searchParams.get("billing") !== "done") return;
    let cancelled = false;
    setBillingReturnPending(true);
    void (async () => {
      try {
        await refreshFrostySessionCookie();
        await pollSubscriptionUntilMandateReady({ maxAttempts: 30 });
        clearBillingProcessing();
        if (!cancelled) await handleAutopaySuccess();
      } catch {
        if (!cancelled) {
          setBillingReturnPending(false);
          setStep(6);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, handleAutopaySuccess]);

  // Free plan path (no mandate needed)
  const handleFreePlan = async () => {
    void completeOnboardingStep("select_plan_trial").catch(() => null);
    try {
      await reloadWorkspace();
    } catch {
      // non-fatal
    }
    router.push("/home");
  };

  return (
    <WizardShell
      currentStep={step}
      totalSteps={6}
      showBack={step > 0}
      onBack={() => setStep((prev) => Math.max(prev - 1, 0))}
      onSkip={handleSkipToDashboard}
      skipLabel={skipping ? "Redirecting…" : step >= 5 ? "Skip to Dashboard" : "Skip"}
      skipping={skipping}
    >
      {billingReturnPending ? (
        <div className="flex flex-col items-center justify-center gap-4 py-24 min-h-[50vh]">
          <RefreshCw className="w-8 h-8 text-[#0396A6] animate-spin" />
          <p className="text-sm text-slate-600 font-medium">Confirming your autopay setup…</p>
          <p className="text-xs text-slate-400 max-w-sm text-center">
            This usually takes a few seconds after Razorpay redirects you back.
          </p>
        </div>
      ) : (
        <>
      {/* Step 0: Profile & Workspace Setup */}
      {step === 0 && (
        <Step0Profile
          initialOrgName={orgName}
          userEmail={me?.email || "merchant@frostrek.com"}
          userName={me?.display_name || "Merchant"}
          onContinue={handleStep0Continue}
        />
      )}

      {/* Step 1: Agent Objective */}
      {step === 1 && (
        <Step1Templates
          selectedTemplateId={selectedTemplate.id}
          onSelectTemplate={handleSelectTemplate}
          onContinue={() => setStep(2)}
          onSkip={handleSkipToDashboard}
        />
      )}

      {/* Step 2: Deployment Channels */}
      {step === 2 && (
        <Step2Channels
          selectedChannels={selectedChannels}
          onToggleChannel={handleToggleChannel}
          onContinue={() => setStep(3)}
          onSkip={handleSkipToDashboard}
        />
      )}

      {/* Step 3: Knowledge Base & Website URL */}
      {step === 3 && (
        <Step4UrlGoals
          websiteUrl={websiteUrl}
          selectedGoal={selectedGoal}
          onChangeUrl={setWebsiteUrl}
          onSelectGoal={setSelectedGoal}
          onContinue={() => setStep(4)}
          onSkip={handleSkipToDashboard}
        />
      )}

      {/* Step 4: Review & Live Customizer */}
      {step === 4 && (
        <Step5Review
          botName={botName}
          brandColor={brandColor}
          welcomeMessage={welcomeMessage}
          behaviorPrompt={behaviorPrompt}
          websiteUrl={websiteUrl}
          goal={selectedGoal}
          onChangeBotName={setBotName}
          onChangeColor={setBrandColor}
          onChangeWelcome={setWelcomeMessage}
          onChangePrompt={setBehaviorPrompt}
          onSubmit={handleCreateChatbot}
          onBack={() => setStep(3)}
          onCancel={handleSkipToDashboard}
          loading={savingBot}
        />
      )}

      {/* Step 5: Choose Plan & Free Trial */}
      {step === 5 && (
        <Step6Plans
          plans={plans}
          billingCycle={billingCycle}
          selectedPlan={selectedPlan}
          onCycleChange={setBillingCycle}
          onSelectPlan={setSelectedPlan}
          onContinueToCheckout={() => setStep(6)}
          onSkip={handleSkipToDashboard}
        />
      )}

      {/* Step 6: Trial Checkout — autopay mandate via Razorpay */}
      {step === 6 && selectedPlan && (
        selectedPlan.slug === "free" ? (
          // Free plan: no mandate required, just complete
          <div className="flex flex-col items-center gap-4 py-16">
            <p className="text-sm text-slate-600 font-medium">Activating your free plan…</p>
            <button
              type="button"
              onClick={() => void handleFreePlan()}
              className="px-6 py-2.5 rounded-xl bg-[#0396A6] text-white text-sm font-bold hover:bg-[#087681] transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        ) : (
          <Step7Checkout
            plan={selectedPlan}
            billingCycle={billingCycle}
            userEmail={me?.email || "merchant@frostrek.com"}
            orgName={orgName}
            couponCode={couponCode}
            onBack={() => setStep(5)}
            onSuccess={() => void handleAutopaySuccess()}
          />
        )
      )}
        </>
      )}
    </WizardShell>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center text-slate-400 font-sans">
          Loading…
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}
