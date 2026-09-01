"use client";

import { useEffect, useRef } from "react";

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  hasError?: boolean;
  length?: number;
}

export function OtpInput({
  value,
  onChange,
  disabled = false,
  hasError = false,
  length = 6,
}: OtpInputProps) {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const digits = Array.from({ length }, (_, i) => value[i] || "");

  useEffect(() => {
    // Auto-focus first empty input or first input
    const firstEmptyIndex = digits.findIndex((d) => !d);
    const targetIndex = firstEmptyIndex === -1 ? length - 1 : firstEmptyIndex;
    if (inputsRef.current[targetIndex] && !disabled) {
      inputsRef.current[targetIndex]?.focus();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const rawVal = e.target.value;
    const cleanDigits = rawVal.replace(/\D/g, "");

    if (!cleanDigits) {
      // Empty/cleared
      const newDigits = [...digits];
      newDigits[index] = "";
      onChange(newDigits.join(""));
      return;
    }

    if (cleanDigits.length > 1) {
      // Multiple digits entered or pasted into input
      const pasted = cleanDigits.slice(0, length);
      const newDigits = [...digits];
      for (let i = 0; i < pasted.length; i++) {
        if (index + i < length && pasted[i]) {
          newDigits[index + i] = pasted[i]!;
        }
      }
      const finalVal = newDigits.join("");
      onChange(finalVal);
      const nextFocus = Math.min(index + pasted.length, length - 1);
      inputsRef.current[nextFocus]?.focus();
      return;
    }

    // Single digit entered
    const newDigits = [...digits];
    newDigits[index] = cleanDigits[0] ?? "";
    onChange(newDigits.join(""));


    if (index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!digits[index] && index > 0) {
        // Current empty, backspace moves back and clears previous
        const newDigits = [...digits];
        newDigits[index - 1] = "";
        onChange(newDigits.join(""));
        inputsRef.current[index - 1]?.focus();
        e.preventDefault();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus();
      e.preventDefault();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
      e.preventDefault();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").replace(/\D/g, "");
    if (!pastedData) return;

    const newDigits = pastedData.slice(0, length).split("");
    const filled = Array.from({ length }, (_, i) => newDigits[i] || "");
    onChange(filled.join(""));

    const nextIndex = Math.min(newDigits.length, length - 1);
    inputsRef.current[nextIndex]?.focus();
  };

  return (
    <div className="flex items-center justify-between gap-2 sm:gap-2.5 my-2">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={`w-11 sm:w-12 h-12 text-center text-lg sm:text-xl font-bold rounded-xl border transition-all focus:outline-none ${
            hasError
              ? "border-[#D96464] bg-rose-50/50 text-[#D96464] focus:ring-2 focus:ring-[#D96464]/20"
              : digit
              ? "border-[#0396A6] bg-[#F7FDFD] text-slate-800 focus:ring-2 focus:ring-[#0396A6]/20 shadow-sm"
              : "border-[#D9EDEE] bg-[#FCFDFD] text-slate-800 hover:border-slate-300 focus:border-[#0396A6] focus:ring-2 focus:ring-[#0396A6]/15"
          } disabled:opacity-50 disabled:bg-slate-50 disabled:cursor-not-allowed`}
          aria-label={`Digit ${index + 1}`}
        />
      ))}
    </div>
  );
}
