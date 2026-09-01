export type PresetTemplate = {
  id: string;
  title: string;
  description: string;
  badge: string;
  iconName: string;
  name: string;
  intro: string;
  terms: string;
  footer: string;
  validity_days: string;
};

export const PRESET_TEMPLATES: PresetTemplate[] = [
  {
    id: "corporate-b2b",
    title: "Corporate & B2B Services",
    description: "Milestone-based delivery, formal invoicing, 30 days validity.",
    badge: "B2B Standard",
    iconName: "building-2",
    name: "Corporate Services Proposal",
    intro:
      "Dear {{customer_name}},\n\nThank you for reaching out to {{company_name}}. Please find our detailed proposal and commercial terms for the enterprise services discussed.",
    terms:
      "1. Commercial Terms: 50% mobilization advance upon signing, 50% upon milestone completion and acceptance.\n2. Invoicing: Formal tax invoice will be issued upon payment receipt.\n3. Scope Revisions: Any additional requirements outside this schedule will be quoted under separate addendum.\n4. Validity: This quotation remains valid until {{valid_until}}.",
    footer:
      "We appreciate the opportunity to collaborate. For clarifications, contact our accounts team.\n\nWarm regards,\n{{company_name}} Enterprise Team",
    validity_days: "30",
  },
  {
    id: "creative-agency",
    title: "Creative Agency & Studio",
    description: "Scope outline, 2 revision rounds, IP transfer on final settlement.",
    badge: "Agency",
    iconName: "sparkles",
    name: "Creative & Design Engagement",
    intro:
      "Dear {{customer_name}},\n\nWe are thrilled about the opportunity to partner with you! Below is the creative scope and cost estimate prepared by {{company_name}}.",
    terms:
      "1. Deliverables Schedule: Phase-wise delivery as outlined in the project timeline.\n2. Revisions: Includes up to two (2) consolidated rounds of client feedback.\n3. Intellectual Property: Complete IP and usage rights transfer to client upon final invoice clearance.\n4. Validity: This creative proposal is valid until {{valid_until}}.",
    footer:
      "Let's create something extraordinary together!\n\nBest,\n{{company_name}} Creative Team",
    validity_days: "14",
  },
  {
    id: "amc-retainer",
    title: "AMC & Maintenance Retainer",
    description: "Routine scheduled inspections, 24h SLA response, spare parts policy.",
    badge: "Maintenance",
    iconName: "wrench",
    name: "Annual Maintenance & Support Contract",
    intro:
      "Dear {{customer_name}},\n\nThank you for trusting {{company_name}} for your equipment and facility maintenance. Here is our comprehensive maintenance contract estimate.",
    terms:
      "1. Service Coverage: Includes scheduled quarterly preventative maintenance and emergency breakdown support.\n2. Response SLA: Priority on-site response within 24–48 hours of ticket dispatch.\n3. Spare Parts: Consumables and major replacements are billed on actuals unless covered under warranty.\n4. Validity: This contract estimate is valid until {{valid_until}}.",
    footer:
      "Ensuring uptime and reliability for your operations.\n\nSincerely,\n{{company_name}} Service Division",
    validity_days: "15",
  },
  {
    id: "product-supply",
    title: "Product Supply & Equipment",
    description: "Itemized dispatch, manufacturer warranty terms, 7 days validity.",
    badge: "Retail / Supply",
    iconName: "package",
    name: "Equipment & Product Supply Estimate",
    intro:
      "Dear {{customer_name}},\n\nThank you for your product inquiry. Please find our price quotation for the requested items and equipment from {{company_name}}.",
    terms:
      "1. Delivery & Dispatch: Orders dispatched within 3-5 business days upon order confirmation and payment.\n2. Warranty: Standard 1-year manufacturer warranty against manufacturing defects.\n3. Taxes & Freight: Prices inclusive of applicable GST unless explicitly stated otherwise.\n4. Validity: Due to inventory and market pricing, this quote is valid until {{valid_until}}.",
    footer:
      "Thank you for your business.\n\nSales & Fulfillment Team,\n{{company_name}}",
    validity_days: "7",
  },
  {
    id: "home-commercial-services",
    title: "Home & Commercial Services",
    description: "On-site assessment terms, satisfaction guarantee, 10 days validity.",
    badge: "Services",
    iconName: "shield-check",
    name: "Service Estimate & Work Order",
    intro:
      "Dear {{customer_name}},\n\nThank you for contacting {{company_name}}. Below is the estimated cost breakdown for the services requested for your premises.",
    terms:
      "1. Service Schedule: Date and slot confirmed upon booking confirmation.\n2. Satisfaction Guarantee: Any service concerns reported within 24 hours of completion will be re-inspected free of charge.\n3. Cancellation: Cancellations within 12 hours of scheduled slot may attract a nominal rebooking fee.\n4. Validity: This service estimate is valid until {{valid_until}}.",
    footer:
      "We look forward to serving you with excellence.\n\n{{company_name}} Support Team",
    validity_days: "10",
  },
];
