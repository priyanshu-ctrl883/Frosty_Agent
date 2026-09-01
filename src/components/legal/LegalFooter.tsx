import Link from "next/link";

type Props = {
  /** Navy marketing panels need light text. */
  tone?: "light" | "dark";
  showCopyright?: boolean;
};

const LINKS = [
  { href: "/privacy", label: "Privacy" },
  { href: "/cookies", label: "Cookies" },
  { href: "/terms", label: "Terms" },
  { href: "/accessibility", label: "Accessibility" },
] as const;

export const LegalFooter = ({ tone = "light", showCopyright = false }: Props) => {
  const onDark = tone === "dark";
  const muted = onDark ? "text-white/70" : "text-muted-foreground";
  const hover = onDark ? "hover:text-white" : "hover:text-foreground";

  return (
    <div className={`space-y-1.5 ${onDark ? "text-white" : ""}`}>
      <nav
        aria-label="Legal"
        className={`flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] ${muted}`}
      >
        {LINKS.map((item, i) => (
          <span key={item.href} className="inline-flex items-center gap-x-3">
            {i > 0 ? <span aria-hidden>·</span> : null}
            <Link href={item.href} className={`${hover} hover:underline`}>
              {item.label}
            </Link>
          </span>
        ))}
      </nav>
      {showCopyright ? (
        <p className={`text-[10px] font-medium text-center ${muted}`}>
          © {new Date().getFullYear()} Frostrek AI, Gurugram.{" "}
          <a href="mailto:sales@frostrek.com" className={`${hover} underline`}>
            sales@frostrek.com
          </a>
        </p>
      ) : null}
    </div>
  );
};
