"use client";

import { useState, FormEvent, useEffect } from "react";
import {
  User,
  Building2,
  Globe2,
  Sparkles,
  ArrowRight,
  Check,
  Phone,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  Megaphone,
  Briefcase,
  Users,
  ChevronDown,
} from "lucide-react";
import { CountryCodeSelect, DEFAULT_COUNTRY, Country } from "@/components/auth/CountryCodeSelect";
import { OtpInput } from "@/components/auth/OtpInput";
import { apiRequest, ApiClientError } from "@/lib/api";
import { Select } from "@/components/ui/Select";

interface Step0ProfileProps {
  initialOrgName?: string;
  userEmail?: string;
  userName?: string;
  onContinue: (data: {
    orgName: string;
    country: string;
    referral: string;
    jobTitle: string;
    companySize: string;
    newsletter: boolean;
    phone?: string;
  }) => void;
  loading?: boolean;
}

const COUNTRIES = [
  "India",
  "United States",
  "United Kingdom",
  "United Arab Emirates",
  "Singapore",
  "Canada",
  "Australia",
  "Germany",
  "France",
  "Saudi Arabia",
  "Netherlands",
  "Other",
];

const REFERRAL_SOURCES = [
  "Google Search",
  "LinkedIn / Social Media",
  "YouTube",
  "Colleague / Word of Mouth",
  "Product Hunt",
  "Other",
];

const ROLES = [
  "Founder / CEO / Co-Founder",
  "Operations / General Management",
  "Customer Support & Success",
  "Sales & Business Development",
  "Product & Engineering",
  "Marketing & Growth",
  "E-commerce & Store Manager",
  "Consultant / Agency",
  "Other",
];

const COMPANY_SIZES = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "500+ employees",
];

interface SendPhoneOtpRes {
  session_id: string;
  masked_phone: string;
  cooldown_seconds: number;
  dev_otp?: string | null;
}

export function Step0Profile({
  initialOrgName = "",
  userEmail = "merchant@frostrek.com",
  userName = "Merchant User",
  onContinue,
  loading = false,
}: Step0ProfileProps) {
  const [orgName, setOrgName] = useState(initialOrgName || "");
  const [country, setCountry] = useState("India");
  const [referral, setReferral] = useState("Google Search");
  const [jobTitle, setJobTitle] = useState("Founder / CEO / Co-Founder");
  const [companySize, setCompanySize] = useState("1-10 employees");
  const [newsletter, setNewsletter] = useState(true);

  // Phone verification state
  const [selectedCountry, setSelectedCountry] = useState<Country>(DEFAULT_COUNTRY);
  const [phone, setPhone] = useState("");
  const [phoneStep, setPhoneStep] = useState<"idle" | "otp" | "verified">("idle");
  const [phoneSessionId, setPhoneSessionId] = useState<string | null>(null);
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneCooldown, setPhoneCooldown] = useState(30);
  const [phoneDevOtp, setPhoneDevOtp] = useState<string | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [phoneSuccess, setPhoneSuccess] = useState<string | null>(null);

  const [formError, setFormError] = useState<string | null>(null);

  // Countdown timer for phone OTP resend
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (phoneStep === "otp" && phoneCooldown > 0) {
      timer = setInterval(() => {
        setPhoneCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [phoneStep, phoneCooldown]);

  // Send Phone SMS OTP
  const handleSendPhoneOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 6 || cleanPhone.length > 15) {
      setPhoneError("Please enter a valid phone number (6-15 digits).");
      return;
    }

    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneSuccess(null);

    try {
      const res = await apiRequest<SendPhoneOtpRes>("/v1/iam/phone/send-otp", {
        method: "POST",
        body: {
          phone: cleanPhone,
          country_code: selectedCountry.code,
        },
      });

      setPhoneSessionId(res.session_id);
      setPhoneCooldown(res.cooldown_seconds || 30);
      setPhoneDevOtp(res.dev_otp || null);
      if (res.dev_otp) {
        setPhoneOtp(res.dev_otp);
      } else {
        setPhoneOtp("");
      }
      setPhoneStep("otp");
    } catch (err) {
      setPhoneError(err instanceof ApiClientError ? err.message : "Failed to send code to phone.");
    } finally {
      setPhoneLoading(false);
    }
  };

  // Verify Phone OTP
  const handleVerifyPhoneOtp = async () => {
    if (!phoneSessionId || phoneOtp.length !== 6) return;

    setPhoneLoading(true);
    setPhoneError(null);

    try {
      await apiRequest("/v1/iam/phone/verify-otp", {
        method: "POST",
        body: {
          session_id: phoneSessionId,
          otp: phoneOtp.trim(),
        },
      });

      setPhoneStep("verified");
      setPhoneSuccess("Phone number verified successfully!");
    } catch (err) {
      setPhoneError(err instanceof ApiClientError ? err.message : "Invalid code. Please try again.");
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) {
      setFormError("Organization Name is required");
      return;
    }
    setFormError(null);

    onContinue({
      orgName: orgName.trim(),
      country,
      referral,
      jobTitle: jobTitle.trim(),
      companySize,
      newsletter,
      phone: phoneStep === "verified" ? phone : undefined,
    });
  };

  return (
    <div className="w-full max-w-[540px] mx-auto flex flex-col items-center animate-in fade-in-50 duration-300">
      {/* Top Compact Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#EAF8F8] border border-[#B8E0E2] text-[#0396A6] text-[11px] font-bold mb-2.5 shadow-2xs">
        <Sparkles className="w-3 h-3" />
        Step 1 of 6: Profile & Business Setup
      </div>

      {/* Main Card */}
      <div className="w-full bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-[#D9EDEE] text-left">
        {/* Header & Signed In Pill in 1 compact section */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
          <div>
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight leading-tight">
              Complete your setup
            </h1>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">
              Personalize your AI assistant and channels.
            </p>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-[#0396A6]/10 text-[#0396A6] flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <div className="text-right">
              <div className="text-[11px] font-bold text-slate-800 leading-tight truncate max-w-[130px]">{userName}</div>
              <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">{userEmail}</div>
            </div>
          </div>
        </div>

        {formError && (
          <div className="mt-2.5 p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-1.5 text-xs text-rose-700 font-medium">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-2.5">
          {/* Organization Name */}
          <div>
            <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
              Organization Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative flex items-center">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none z-10" />
              <input
                type="text"
                value={orgName}
                onChange={(e) => {
                  setOrgName(e.target.value);
                  if (formError) setFormError(null);
                }}
                placeholder="Enter your company or organization name"
                required
                className="w-full bg-[#F7FDFD] border border-[#D9EDEE] focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/15 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 font-medium transition-all h-9"
              />
            </div>
          </div>

          {/* ─── Phone Verification Section (Compact) ─── */}
          <div className="p-2.5 bg-[#F8FAFB] border border-[#D9EDEE] rounded-xl space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3 h-3 text-[#0396A6]" />
                WhatsApp Phone Verification
              </label>
              {phoneStep === "verified" ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Check className="w-2.5 h-2.5 stroke-[3]" /> Verified on WhatsApp
                </span>
              ) : (
                <span className="text-[10px] text-slate-400 font-medium">
                  Optional • Skip anytime
                </span>
              )}
            </div>

            {phoneError && (
              <div className="p-1.5 bg-rose-50 border border-rose-200 rounded-md text-[11px] text-rose-700 font-medium flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                {phoneError}
              </div>
            )}

            {phoneSuccess && (
              <div className="p-1.5 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-700 font-medium flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                {phoneSuccess}
              </div>
            )}

            {phoneStep === "idle" && (
              <div className="space-y-1">
                <div className="flex items-center gap-1.5">
                  <CountryCodeSelect
                    value={selectedCountry.code}
                    onChange={(c) => setSelectedCountry(c)}
                    disabled={phoneLoading}
                  />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    placeholder="98765 43210"
                    className="flex-1 bg-white border border-[#D9EDEE] focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/15 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-900 h-8"
                  />
                  <button
                    type="button"
                    onClick={handleSendPhoneOtp}
                    disabled={phoneLoading || !phone.trim()}
                    className="px-3 py-1 bg-[#0396A6] hover:bg-[#087681] text-white font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0 h-8"
                  >
                    {phoneLoading ? <RotateCw className="w-3 h-3 animate-spin" /> : "Send on WhatsApp"}
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  We will send a 6-digit OTP to your WhatsApp via Meta Cloud API. You can also skip this and verify in Profile settings.
                </p>
              </div>
            )}

            {phoneStep === "otp" && (
              <div className="space-y-1.5">
                {phoneDevOtp && (
                  <div
                    onClick={() => setPhoneOtp(phoneDevOtp)}
                    className="p-1.5 bg-[#EAF8F8] border border-[#B8E0E2] rounded-lg flex items-center justify-between text-[11px] cursor-pointer hover:bg-[#D9F1F2] transition-colors"
                  >
                    <span className="font-mono font-bold text-[#0396A6]">Test Code: {phoneDevOtp}</span>
                    <span className="text-[10px] font-bold text-[#0396A6] underline">Click to fill</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <div className="flex-1">
                    <OtpInput
                      value={phoneOtp}
                      onChange={(val) => setPhoneOtp(val)}
                      disabled={phoneLoading}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleVerifyPhoneOtp}
                    disabled={phoneLoading || phoneOtp.length !== 6}
                    className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1 shrink-0 h-8"
                  >
                    {phoneLoading ? <RotateCw className="w-3 h-3 animate-spin" /> : "Verify Code"}
                  </button>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep("idle");
                      setPhoneOtp("");
                      setPhoneError(null);
                    }}
                    className="text-[10px] font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
                  >
                    Change Number
                  </button>

                  <div className="flex items-center gap-2">
                    {phoneCooldown > 0 ? (
                      <span className="text-[10px] text-slate-400 font-medium">Resend in {phoneCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendPhoneOtp}
                        disabled={phoneLoading}
                        className="text-[10px] font-bold text-[#0396A6] hover:underline cursor-pointer"
                      >
                        Resend WhatsApp Code
                      </button>
                    )}
                    <span className="text-slate-300">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        setPhoneStep("idle");
                        setPhone("");
                        setPhoneOtp("");
                      }}
                      className="text-[10px] font-medium text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Skip for Now
                    </button>
                  </div>
                </div>
              </div>
            )}

            {phoneStep === "verified" && (
              <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-2.5 py-1.5">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-800">{selectedCountry.code} {phone}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStep("idle");
                    setPhoneOtp("");
                    setPhoneSuccess(null);
                  }}
                  className="text-[11px] font-bold text-slate-400 hover:text-slate-600"
                >
                  Edit
                </button>
              </div>
            )}
          </div>

          {/* Country & Referral Source (2 Columns) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Country
              </label>
              <Select
                value={country}
                onChange={(val) => setCountry(val)}
                leadingIcon={<Globe2 className="w-4 h-4 text-slate-400" />}
                size="sm"
                searchable
                options={COUNTRIES.map((c) => ({ value: c, label: c }))}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                How did you hear?
              </label>
              <Select
                value={referral}
                onChange={(val) => setReferral(val)}
                leadingIcon={<Megaphone className="w-4 h-4 text-slate-400" />}
                size="sm"
                options={REFERRAL_SOURCES.map((r) => ({ value: r, label: r }))}
              />
            </div>
          </div>

          {/* Job Title & Company Size (2 Columns) */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Your Role / Job Title
              </label>
              <Select
                value={jobTitle}
                onChange={(val) => setJobTitle(val)}
                leadingIcon={<Briefcase className="w-4 h-4 text-slate-400" />}
                size="sm"
                options={ROLES.map((role) => ({ value: role, label: role }))}
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Company Size
              </label>
              <Select
                value={companySize}
                onChange={(val) => setCompanySize(val)}
                leadingIcon={<Users className="w-4 h-4 text-slate-400" />}
                size="sm"
                options={COMPANY_SIZES.map((s) => ({ value: s, label: s }))}
              />
            </div>
          </div>

          {/* Promotional & Messaging Agreement (Compact) */}
          <label className="flex items-start gap-2 cursor-pointer select-none pt-0.5 group">
            <input
              type="checkbox"
              checked={newsletter}
              onChange={(e) => setNewsletter(e.target.checked)}
              className="mt-0.5 w-3.5 h-3.5 rounded text-[#0396A6] border-slate-300 focus:ring-[#0396A6] cursor-pointer shrink-0"
            />
            <span className="text-[11px] text-slate-500 font-medium leading-tight group-hover:text-slate-800 transition-colors">
              I agree to receive promotional messages, new AI model releases, and updates via email, SMS, and WhatsApp. Opt out anytime.
            </span>
          </label>

          {/* Submit Button */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 px-5 rounded-xl bg-[#0396A6] hover:bg-[#087681] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm shadow-[#0396A6]/20 active:scale-[0.99] transition-all cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving details...</span>
                </>
              ) : (
                <>
                  <span>Continue to Chatbot Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
