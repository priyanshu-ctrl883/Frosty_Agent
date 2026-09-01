/**
 * Merchant Help Hub — what we show customers, not internal engineering notes.
 * Every click path names a real sidebar item. Do not document buttons that do not exist.
 */

export const SUPPORT_EMAIL = "support@frostrek.ai";

export type HelpBlock =
  | { type: "p"; text: string }
  | { type: "h"; text: string }
  | { type: "ol"; items: string[] }
  | { type: "ul"; items: string[] }
  | { type: "note"; text: string }
  | { type: "warn"; text: string }
  | { type: "code"; text: string };

export type HelpCategory = {
  id: string;
  name: string;
  icon: string;
  description: string;
};

export type HelpArticle = {
  slug: string;
  category: string;
  title: string;
  summary: string;
  minutes: number;
  href?: string;
  hrefLabel?: string;
  body: HelpBlock[];
};

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "start",
    name: "Getting started",
    icon: "rocket_launch",
    description: "Set up your workspace and go live.",
  },
  {
    id: "agent",
    name: "Your agent",
    icon: "smart_toy",
    description: "Create, test, and publish the AI.",
  },
  {
    id: "knowledge",
    name: "Knowledge",
    icon: "menu_book",
    description: "Teach the agent from your documents.",
  },
  {
    id: "channels",
    name: "Website & WhatsApp",
    icon: "chat",
    description: "Put the agent where your customers already are.",
  },
  {
    id: "inbox",
    name: "Inbox",
    icon: "inbox",
    description: "Take over a chat when a person is needed.",
  },
  {
    id: "sales",
    name: "Leads, meetings & quotes",
    icon: "request_quote",
    description: "Turn conversations into pipeline.",
  },
  {
    id: "billing",
    name: "Billing & plans",
    icon: "payments",
    description: "Credits, plans, and invoices.",
  },
  {
    id: "team",
    name: "Team & security",
    icon: "group",
    description: "Invites, roles, and keys.",
  },
  {
    id: "developers",
    name: "Developers",
    icon: "webhook",
    description: "CRM connect, webhooks, and embed keys.",
  },
  {
    id: "account",
    name: "Account, privacy & FAQ",
    icon: "help",
    description: "Login, data, and common questions.",
  },
];

export const HELP_ARTICLES: HelpArticle[] = [
  {
    slug: "first-hour",
    category: "start",
    title: "Your first hour with Frosty",
    summary: "Sign up → agent → knowledge → widget → try a chat.",
    minutes: 8,
    href: "/home",
    hrefLabel: "Open setup checklist",
    body: [
      { type: "p", text: "Frosty is an AI that answers customers on your website (and WhatsApp, if you add it). You stay in control from this dashboard." },
      { type: "h", text: "Do these in order" },
      {
        type: "ol",
        items: [
          "Sign up and name your company. You land on the setup checklist.",
          "Open Agents → New agent. Give it a name and a short welcome line. Save, then Publish.",
          "Open Knowledge → upload a PDF or paste a website URL to crawl. Wait until it shows as ready.",
          "Open Sandbox and ask a question you expect that document to answer.",
          "Open Widget → copy the snippet → paste it on your website before </body>.",
          "Open your site and send a test message.",
        ],
      },
      { type: "note", text: "You can stay on the Free plan while you set this up. Paid plans add inbox, meetings, quotes, WhatsApp, and more. Locked menu items mean “available to buy”, not “broken”." },
    ],
  },
  {
    slug: "what-frosty-does",
    category: "start",
    title: "What Frosty can do for a visitor",
    summary: "Answer from your docs, take a lead, book a meeting, send a quote, or hand off to you.",
    minutes: 3,
    body: [
      { type: "p", text: "When someone chats, the agent tries to help from your Knowledge. Depending on your plan and settings, it can also:" },
      {
        type: "ul",
        items: [
          "Answer product and policy questions from your files",
          "Save a lead when the visitor shares interest and contact details",
          "Offer meeting times from your Google Calendar",
          "Draft a priced quote from your catalogue (you approve before it goes out, unless you turn auto-send on)",
          "Offer a human — that chat appears in Inbox",
          "Offer to continue the same chat on WhatsApp",
        ],
      },
      { type: "p", text: "You choose what the agent is allowed to do in Automation Controls (AI, a person, or off) and in Settings." },
    ],
  },
  {
    slug: "automation",
    category: "agent",
    title: "Who handles meetings, quotes, and handoff",
    summary: "Per feature: the AI, a person, or off.",
    minutes: 3,
    href: "/automation-controls",
    hrefLabel: "Open Automation Controls",
    body: [
      { type: "p", text: "Open Automation Controls. For meetings, quotes, WhatsApp, and handoff you pick:" },
      {
        type: "ul",
        items: [
          "AI — the agent does it in the chat.",
          "Human — we route that request to your team (Inbox), instead of the agent completing it.",
          "Off — the agent says it cannot do that, and can still take a contact.",
        ],
      },
      { type: "p", text: "Meetings can also require your approval before the calendar invite is sent." },
      { type: "warn", text: "Turning a feature Off changes what the visitor is told. Save only when you mean it." },
    ],
  },
  {
    slug: "create-agent",
    category: "agent",
    title: "Create, save, and publish an agent",
    summary: "Save makes a new version. Publish is what visitors actually talk to.",
    minutes: 4,
    href: "/agents",
    hrefLabel: "Go to Agents",
    body: [
      {
        type: "ol",
        items: [
          "Open Agents → New agent. Name it and set a welcome message.",
          "Open the agent. Change the persona / welcome / fallback text.",
          "Click Save. This stores a new version. It does not go live yet.",
          "Click Publish on the version you want customers to see.",
          "Turn the Website channel on for that agent.",
        ],
      },
      { type: "note", text: "You can roll back to an older version from Agents → that agent → Versions." },
      { type: "warn", text: "Deleting an agent cannot be undone." },
    ],
  },
  {
    slug: "test-in-sandbox",
    category: "agent",
    title: "Test in Sandbox before you go live",
    summary: "Chat against a draft without putting it on your website.",
    minutes: 2,
    href: "/website?tab=settings&subtab=sandbox",
    hrefLabel: "Open Sandbox",
    body: [
      {
        type: "ol",
        items: [
          "Open Sandbox (needs the sandbox feature on your plan).",
          "Pick the agent.",
          "Ask the same questions a real customer would ask.",
        ],
      },
      { type: "p", text: "If it cannot answer, add that content in Knowledge and try again. Publish only when Sandbox looks right." },
    ],
  },
  {
    slug: "add-knowledge",
    category: "knowledge",
    title: "Add documents and website pages",
    summary: "The agent answers from what you upload or crawl — not from guesses about your business.",
    minutes: 5,
    href: "/knowledge",
    hrefLabel: "Go to Knowledge",
    body: [
      {
        type: "ol",
        items: [
          "Open Knowledge.",
          "Upload: choose a file (PDF, text, or markdown).",
          "Or Crawl: paste a public URL. Frosty fetches that page.",
          "Wait until the source is ready. If it fails, use Reindex / retry — do not assume it is trained.",
          "Use Search in Knowledge to ask a question and see if the right passage comes back.",
        ],
      },
      { type: "p", text: "Write documents with clear headings. Avoid photos of tables — typed text works better." },
      { type: "note", text: "Gaps shows questions the agent could not answer from your files. Fix those first." },
    ],
  },
  {
    slug: "how-answers-work",
    category: "knowledge",
    title: "How the agent decides what to say",
    summary: "In plain language: it looks up your Knowledge, then answers.",
    minutes: 3,
    body: [
      { type: "p", text: "Each question is matched against your Knowledge. If a good match is found, the answer is based on that text. If nothing matches, the agent uses your fallback message (you set this on the agent) instead of inventing company facts." },
      { type: "p", text: "Home can show a grounding chart — that is “did we have a document for this?” It is a health check, not a second product." },
      { type: "note", text: "Home → Knowledge if that chart looks empty: you usually need more (or clearer) documents, not a different model." },
    ],
  },
  {
    slug: "install-widget",
    category: "channels",
    title: "Put the chat on your website",
    summary: "Copy the snippet from Widget. Paste it once. Looks update without pasting again.",
    minutes: 4,
    href: "/widget",
    hrefLabel: "Go to Widget",
    body: [
      {
        type: "ol",
        items: [
          "Open Widget in the sidebar (not Settings).",
          "Set greeting, colour, logo, and the consent line visitors see.",
          "Save.",
          "Copy the embed snippet.",
          "Paste it on every page where chat should appear, just before </body>.",
        ],
      },
      { type: "p", text: "Always copy the snippet from Widget in your dashboard. Do not invent a script URL." },
      { type: "note", text: "Greeting and colours apply on the visitor’s next page load. You do not need to paste the snippet again — unless you rotate the key." },
    ],
  },
  {
    slug: "rotate-widget-key",
    category: "channels",
    title: "Rotate the widget key",
    summary: "Use this if the key leaked. Chat on your site stops until you paste the new snippet.",
    minutes: 2,
    href: "/widget",
    hrefLabel: "Go to Widget",
    body: [
      { type: "p", text: "The widget key is public on purpose — it sits in your page source. Rotate it if someone else embedded your chat, or if you are leaving a contractor." },
      {
        type: "ol",
        items: [
          "Open Widget (or Settings → Developer).",
          "Rotate key. Confirm. There is no second key and no grace period.",
          "Copy the new snippet immediately.",
          "Replace the old snippet on every live page.",
        ],
      },
      { type: "warn", text: "Until you update the website, visitors cannot chat. Plan this like a deploy." },
    ],
  },
  {
    slug: "connect-whatsapp",
    category: "channels",
    title: "Connect WhatsApp",
    summary: "Same agent, on your WhatsApp Business number.",
    minutes: 5,
    href: "/whatsapp",
    hrefLabel: "Go to WhatsApp",
    body: [
      { type: "p", text: "You need a Meta Business account, a WhatsApp Business Account (WABA) ID, and a Phone Number ID." },
      {
        type: "ol",
        items: [
          "Open WhatsApp in the sidebar (needs WhatsApp on your plan).",
          "Use Connect and enter the IDs Meta shows in WhatsApp Manager.",
          "If your team has a Meta access token, that is what actually attaches the number. If the form only collects IDs, email support and we will finish the attach.",
          "Send a WhatsApp message to your business number and confirm a reply.",
        ],
      },
      { type: "note", text: "Human takeovers for WhatsApp chats use the same Inbox as website chats." },
    ],
  },
  {
    slug: "continue-on-whatsapp",
    category: "channels",
    title: "Continue a website chat on WhatsApp",
    summary: "The visitor keeps the same conversation after they move to WhatsApp.",
    minutes: 3,
    href: "/unified",
    hrefLabel: "Go to Unified",
    body: [
      { type: "p", text: "Unified is not a second inbox. It lets a website visitor continue on WhatsApp without starting over." },
      {
        type: "ol",
        items: [
          "Open Unified (needs this feature on your plan).",
          "Turn the setting on and Save.",
          "The agent can then offer a WhatsApp link in the chat.",
        ],
      },
    ],
  },
  {
    slug: "inbox-overview",
    category: "inbox",
    title: "Inbox overview",
    summary: "Waiting vs All open, and the bell when someone needs you.",
    minutes: 2,
    href: "/inbox",
    hrefLabel: "Go to Inbox",
    body: [
      { type: "p", text: "Inbox is for chats that need a person. It needs the live-inbox feature on your plan." },
      {
        type: "ul",
        items: [
          "Waiting — chats nobody on your team has claimed yet.",
          "All open — every live handoff, including ones already claimed.",
        ],
      },
      { type: "note", text: "New waiting chats also raise the bell in the top bar. You do not need to refresh." },
    ],
  },
  {
    slug: "take-over-chat",
    category: "inbox",
    title: "Take over a live chat",
    summary: "Claim the conversation, reply, and leave an internal note if needed.",
    minutes: 3,
    href: "/inbox",
    hrefLabel: "Go to Inbox",
    body: [
      {
        type: "ol",
        items: [
          "Open Inbox → Waiting, then click a conversation.",
          "Click Claim. If a teammate claimed it first, you will be told — try another chat.",
          "Type in the box → Send. The visitor sees it on the website or WhatsApp.",
          "Use an internal note for a remark only your team can see.",
        ],
      },
    ],
  },
  {
    slug: "hand-back-or-close",
    category: "inbox",
    title: "Hand back or close",
    summary: "Return the chat to the AI, or end it when you are done.",
    minutes: 2,
    href: "/inbox",
    hrefLabel: "Go to Inbox",
    body: [
      {
        type: "ul",
        items: [
          "Hand back to the agent — the AI continues with the visitor.",
          "Close conversation — the thread is finished. Do this when the person is done.",
        ],
      },
      { type: "p", text: "Both actions are on the claimed conversation in Inbox. You need permission to reply." },
    ],
  },
  {
    slug: "leads",
    category: "sales",
    title: "Leads",
    summary: "People who showed buying intent — from the agent or added by you.",
    minutes: 3,
    href: "/leads",
    hrefLabel: "Go to Leads",
    body: [
      {
        type: "ol",
        items: [
          "Open Leads. Filter by status or temperature (new / warm / hot, and so on).",
          "Click a row to open the person, edit details, and see their timeline if we have a contact record.",
          "Use New lead if you want to add someone by hand.",
        ],
      },
      { type: "p", text: "The agent can file a lead during a chat when the visitor shares enough. You can also export the list you are viewing as CSV." },
      { type: "p", text: "To copy new leads into Zoho or another CRM, open Integrations. Frosty keeps the lead here and sends a copy out." },
    ],
  },
  {
    slug: "connect-crm",
    category: "sales",
    title: "Send leads to Zoho CRM",
    summary: "Zapier copies each new Frosty lead into Zoho. Direct Zoho login is not available yet.",
    minutes: 5,
    href: "/integrations",
    hrefLabel: "Open Integrations",
    body: [
      { type: "p", text: "Frosty does not log into Zoho for you. Production tools (Calendly, Typeform) work the same way: we POST a signed event, Zapier (or Make) creates the Zoho Lead. Your Leads screen still holds the original." },
      { type: "h", text: "Zoho in five minutes" },
      {
        type: "ol",
        items: [
          "In Zapier, Create Zap. Trigger app: Webhooks by Zapier. Trigger event: Catch Hook. Continue, then copy the Custom Webhook URL.",
          "In Frosty, open Integrations → Webhooks (needs webhooks on your plan). Event: New lead. Paste the Zapier URL. Create webhook.",
          "Copy the signing secret immediately. It is shown once. Zapier Catch Hook does not check that signature — keep it if you later move to your own URL.",
          "Back in Zapier, Continue so it waits for a sample. In Frosty click Ping on the endpoint, wait a few seconds, then Refresh deliveries until status is sent. In Zapier, find the sample.",
          "Action: Zoho CRM → Create/Update Module Entry. Module: Leads. Map Last Name from data.name, Email from data.email, Phone from data.phone, Description from data.interest, Lead Source to Frosty. Zoho requires a last name — if name is empty, map a fallback such as Website visitor.",
          "Turn the Zap on. Create a real lead in Frosty and confirm the row in Zoho.",
        ],
      },
      { type: "h", text: "What we send (lead.created)" },
      { type: "p", text: "Each POST body is JSON with id (the delivery id), event, created_at, and data. For a new lead, data is the lead: id, name, email, phone, interest, budget, source, channel, score, temperature, status." },
      {
        type: "code",
        text: `{
  "id": "delivery-uuid",
  "event": "lead.created",
  "created_at": "2026-08-14T10:44:00+00:00",
  "data": {
    "id": 42,
    "name": "Asha",
    "email": "asha@example.test",
    "phone": "9876543210",
    "interest": "Enterprise plan",
    "source": "chat",
    "channel": "website",
    "score": 70,
    "temperature": "hot",
    "status": "new"
  }
}`,
      },
      { type: "note", text: "HubSpot, Salesforce, Pipedrive, Freshsales, and LeadSquared use the same Catch Hook. Only the Zapier action app changes. Make.com works the same with a Custom webhook module." },
      { type: "warn", text: "There is no Connect Zoho button. A URL pasted into Webhooks is not Zoho’s API — Zoho will reject Frosty JSON. Direct OAuth is not built." },
    ],
  },
  {
    slug: "meetings",
    category: "sales",
    title: "Meetings and Google Calendar",
    summary: "The agent offers real free slots. You can require approval before the invite goes out.",
    minutes: 4,
    href: "/meetings",
    hrefLabel: "Go to Meetings",
    body: [
      {
        type: "ol",
        items: [
          "Open Meetings → connect Google Calendar (sign in and allow access).",
          "If you want to confirm every booking yourself, turn on approval in Automation Controls.",
          "When a meeting is waiting, open Meetings → Awaiting approval → Approve & invite. That emails the visitor via Google.",
          "Decline or Cancel if the slot should not happen — the visitor is notified.",
        ],
      },
      { type: "warn", text: "Approving is the Invite button on the meeting — do not “fix” a held meeting by changing its status to confirmed. That can lose the approval step and still email Google." },
    ],
  },
  {
    slug: "quotes-gst",
    category: "sales",
    title: "Quotes, catalogue, and GST",
    summary: "Prices come from your catalogue. You approve, then send a PDF.",
    minutes: 5,
    href: "/quotes",
    hrefLabel: "Go to Quotes",
    body: [
      {
        type: "ol",
        items: [
          "Open Quotes → Catalogue. Add products with name and price.",
          "Open Quotes. Create or open a draft. Lines must be catalogue items.",
          "Approve, then Send. The customer gets email + PDF.",
          "Set your GST rate in Settings / Invoices. Per-quote rate still wins if you change it on that quote. Export (zero-rated) is a reason on the quote — not “because the currency is USD”.",
        ],
      },
      { type: "note", text: "Settings has “send quotes without waiting for you”. Leave it off until you trust the drafts." },
    ],
  },
  {
    slug: "billing",
    category: "billing",
    title: "Plans, credits, and paying",
    summary: "Pick a plan, add credits, see the wallet. Checkout is Razorpay.",
    minutes: 4,
    href: "/billing",
    hrefLabel: "Go to Billing",
    body: [
      {
        type: "ol",
        items: [
          "Open Billing to see wallet balance, current plan, and recent credit use.",
          "Plans → choose a plan → you are sent to Razorpay to pay.",
          "Top up credits from Billing if you are running low.",
          "Cancel stops at the end of the period — you keep access until then. This may ask for extra confirmation (authenticator).",
        ],
      },
      { type: "p", text: "If payment is overdue, a banner appears. Agents may still answer for a while. If the workspace is suspended, agents stop and settings are read-only — pay or contact us to restore." },
      { type: "note", text: "Invoices in the menu is your credit ledger and GST profile, not always a downloadable tax PDF yet. Use it for the running balance." },
    ],
  },
  {
    slug: "invoices",
    category: "billing",
    title: "Invoices and GST profile",
    summary: "Credit ledger and the company details printed on bills.",
    minutes: 2,
    href: "/billing/invoices",
    hrefLabel: "Go to Invoices",
    body: [
      {
        type: "ol",
        items: [
          "Open Billing → Invoices for the credit ledger.",
          "Fill company name, GSTIN, and phone so they show on bills.",
        ],
      },
      { type: "note", text: "This screen is the running balance and GST profile. A downloadable tax PDF is not always available yet." },
    ],
  },
  {
    slug: "invite-team",
    category: "team",
    title: "Invite your team",
    summary: "Email an invite. They join with their own login.",
    minutes: 3,
    href: "/team",
    hrefLabel: "Go to Team",
    body: [
      {
        type: "ol",
        items: [
          "Open Team → invite with email and a role.",
          "They open the link, sign in (or sign up), and Accept.",
          "You can revoke an unused invite or remove a member later.",
        ],
      },
      { type: "p", text: "Plans cap how many people you can have. If invite fails because the team is full, upgrade or remove someone." },
      { type: "note", text: "One login can own only one company. The same person can still be invited to another company as a member." },
    ],
  },
  {
    slug: "roles",
    category: "team",
    title: "Owner, Manager, Agent, Viewer",
    summary: "Who can change settings vs who can only answer chats.",
    minutes: 3,
    href: "/team/roles",
    hrefLabel: "Open roles",
    body: [
      {
        type: "ul",
        items: [
          "Owner — you, from signup. Full access. This role cannot be handed over from the dashboard yet; contact us if the company changes hands.",
          "Manager — team, billing (if granted), most settings.",
          "Agent — Inbox, leads, and day-to-day work — not team or billing.",
          "Viewer — look, don’t change.",
        ],
      },
      { type: "p", text: "Custom roles: Team → Roles. Tick only the permissions that person needs. A missing permission shows “you don’t have this”, not a blank error." },
    ],
  },
  {
    slug: "webhooks",
    category: "developers",
    title: "Send events to your CRM",
    summary: "We POST to your URL when a lead, meeting, or quote changes.",
    minutes: 6,
    href: "/webhooks",
    hrefLabel: "Go to Webhooks",
    body: [
      {
        type: "ol",
        items: [
          "Open Integrations, then Webhooks (needs webhooks on your plan). For Zoho without writing code, use Send leads to Zoho CRM.",
          "Add your HTTPS URL and pick events. Copy the signing secret immediately — it is shown once. If you lose it, use Rotate secret; the old secret stops working.",
          "Use Ping to queue a test. It does not wait for the POST. Check Recent deliveries a few seconds later. Failed rows have Retry.",
        ],
      },
      { type: "h", text: "Events you can subscribe to" },
      {
        type: "ul",
        items: [
          "lead.created",
          "meeting.created, meeting.cancelled, meeting.rescheduled",
          "quote.approved, quote.rejected, quote.expired",
          "* — everything above",
        ],
      },
      { type: "p", text: "Each request includes headers X-Frosty-Event, X-Frosty-Delivery, and X-Frosty-Signature (format t=<time>,v1=<hex>). Sign the timestamp plus the raw body with your secret — same idea as Stripe. Reject old timestamps. Zapier Catch Hook ignores the signature; your own backend must not." },
      {
        type: "code",
        text: `import hmac, hashlib

def ok(secret: str, body: bytes, header: str) -> bool:
    parts = dict(p.split("=", 1) for p in header.split(","))
    ts, sig = parts["t"], parts["v1"]
    expect = hmac.new(secret.encode(), f"{ts}.".encode() + body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expect, sig)`,
      },
    ],
  },
  {
    slug: "widget-not-showing",
    category: "account",
    title: "The chat bubble is missing",
    summary: "Fix install, key, and blocked scripts.",
    minutes: 4,
    href: "/widget",
    hrefLabel: "Check Widget",
    body: [
      {
        type: "ol",
        items: [
          "Open Widget and confirm a Website channel is on for an agent.",
          "View source on your site and check the snippet matches Widget (especially after a key rotate).",
          "Turn off ad blockers / script blockers on a test window.",
          "If the bubble shows but never answers: check Billing (suspended workspace) and Knowledge (empty KB).",
        ],
      },
    ],
  },
  {
    slug: "privacy",
    category: "account",
    title: "Visitor data and privacy",
    summary: "What you store, the consent line, and how to honour a delete request.",
    minutes: 4,
    href: "/widget",
    hrefLabel: "Edit consent line",
    body: [
      { type: "p", text: "Chats, contact details the visitor typed, leads, meetings, and quotes are stored in your workspace so you can serve that person. The Widget consent line is the notice they see before chatting — write it in plain language." },
      { type: "p", text: "If a visitor asks you to delete their data (India DPDP / similar): email support with the person’s email or phone and your company name. Deletion is done by our staff, is permanent, and cannot be done while someone is logged in as you for support." },
      { type: "note", text: "Voice messages are not kept as long-term memory — a transcript is a guess, not a filed fact." },
    ],
  },
  {
    slug: "faq",
    category: "account",
    title: "Frequently asked questions",
    summary: "Short answers to what we get asked most.",
    minutes: 5,
    body: [
      { type: "h", text: "I forgot my password" },
      { type: "p", text: "Use Forgot password on the login page if it sends email. If it asks you to contact an owner, email support@frostrek.ai from the account address." },
      { type: "h", text: "How do I send leads to Zoho?" },
      { type: "p", text: "Open Integrations. There is no Connect Zoho button — use Zapier Catch Hook as in Send leads to Zoho CRM. Frosty keeps the lead; Zoho gets a copy." },
      { type: "p", text: "That feature is not on your plan. Open it anyway — you will see an upgrade explanation — then Billing → Plans." },
      { type: "h", text: "The agent invented a price" },
      { type: "p", text: "Put official prices in the Quotes catalogue and in Knowledge. Quotes should be sent from catalogue lines, not from chat guesses." },
      { type: "h", text: "Google Calendar connected but no slots" },
      { type: "p", text: "Meetings → confirm the green connected state. Check the calendar is the working one, timezone in Settings, and that Automation has meetings set to AI (not off)." },
      { type: "h", text: "Who do I email?" },
      { type: "p", text: `Product and setup: ${SUPPORT_EMAIL}. Include your company name and, if you saw an error, the request id on the error message.` },
    ],
  },
];

export function getArticle(slug: string): HelpArticle | undefined {
  return HELP_ARTICLES.find((a) => a.slug === slug);
}

/** Path to a Help Hub article served by `app/help/guides/[slug]`. */
export const helpGuideHref = (slug: string): string => `/help/guides/${slug}`;

export function searchArticles(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return HELP_ARTICLES;
  return HELP_ARTICLES.filter((a) => {
    const blob = [
      a.title,
      a.summary,
      a.body
        .map((b) => {
          if ("text" in b) return b.text;
          if ("items" in b) return b.items.join(" ");
          return "";
        })
        .join(" "),
    ]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}
