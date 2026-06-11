import { notFound } from "next/navigation";
import { MemberTasksPage } from "@/components/dashboard/MemberTasksPage";
import { ModulePage } from "@/components/dashboard/ModulePage";
import { TeamRecordsPage } from "@/components/dashboard/TeamRecordsPage";

type ModuleConfig = {
  active: string;
  eyebrow: string;
  title: string;
  description: string;
  endpoint?: string;
  actions?: Array<{ label: string; href: string }>;
  cards: Array<{ title: string; body: string; meta?: string }>;
};

const modulePages: Record<string, ModuleConfig> = {
  "proposals/analytics": {
    active: "Proposals",
    eyebrow: "Proposal analytics",
    title: "Buyer engagement analytics",
    description: "Track opens, viewed duration, signature events, downloads, and proposal momentum.",
    endpoint: "/proposals",
    cards: [
      { title: "Opened", body: "Measure when buyers first open shared proposal links.", meta: "Signal" },
      { title: "Viewed duration", body: "Highlight proposals with strong reading time and buying intent.", meta: "Signal" },
      { title: "Signed", body: "Surface accepted proposals ready for invoicing and payment collection.", meta: "Conversion" },
      { title: "Downloaded", body: "Track offline document downloads for sales follow-up.", meta: "Activity" },
    ],
  },
  "proposals/versions": {
    active: "Proposals",
    eyebrow: "Version history",
    title: "Proposal revision history",
    description: "Review edits, saved versions, client-facing revisions, approvals, and rollback-ready milestones.",
    cards: [
      { title: "Saved versions", body: "Capture meaningful proposal snapshots before sending or changing scope." },
      { title: "Client revisions", body: "Separate internal drafting from buyer-visible revisions and final accepted versions." },
      { title: "Audit trail", body: "Preserve who changed pricing, terms, dates, and signature blocks." },
    ],
  },
  "invoices/analytics": {
    active: "Invoices",
    eyebrow: "Invoice analytics",
    title: "Invoice performance analytics",
    description: "Monitor revenue, outstanding balances, collection speed, overdue risk, and tax impact.",
    endpoint: "/invoices",
    cards: [
      { title: "Collection status", body: "Split invoice value by draft, sent, paid, partially paid, and overdue." },
      { title: "Aging buckets", body: "Group receivables by due date so finance can prioritize follow-up." },
      { title: "Tax summary", body: "Summarize taxable value, CGST, SGST, IGST, TDS, and TCS by period." },
    ],
  },
  "invoices/recurring": {
    active: "Invoices",
    eyebrow: "Recurring billing",
    title: "Recurring invoice schedules",
    description: "Configure repeat billing for retainers, subscriptions, maintenance, and service contracts.",
    cards: [
      { title: "Schedule builder", body: "Create monthly, quarterly, annual, or custom billing cycles." },
      { title: "Auto draft", body: "Generate invoices from approved plans before finance sends them." },
      { title: "Renewal visibility", body: "Track next billing dates, client plans, and upcoming renewals." },
    ],
  },
  quotes: {
    active: "Documents",
    eyebrow: "Quote module",
    title: "Quotes",
    description: "Build lightweight price quotes that can become proposals, invoices, or client approvals.",
    endpoint: "/documents",
    cards: [
      { title: "Quote builder", body: "Create quote-specific pricing tables, validity dates, tax rules, and client notes." },
      { title: "Approval state", body: "Track draft, sent, accepted, expired, and converted quote statuses." },
      { title: "Convert downstream", body: "Convert accepted quotes into proposals or invoices without retyping details." },
    ],
  },
  "purchase-orders": {
    active: "Documents",
    eyebrow: "Procurement",
    title: "Purchase orders",
    description: "Manage purchase orders for vendor commitments, approvals, delivery references, and accounting export.",
    endpoint: "/documents",
    cards: [
      { title: "Vendor details", body: "Track supplier identity, GSTIN, PO number, delivery terms, and payment terms." },
      { title: "Approval workflow", body: "Route purchase orders for review before sending to vendors." },
      { title: "Receiving status", body: "Connect purchase orders with bills, expenses, and delivery confirmations." },
    ],
  },
  expenses: {
    active: "Documents",
    eyebrow: "Expenses and bills",
    title: "Expense and bill management",
    description: "Capture vendor bills, reimbursements, tax details, attachments, approvals, and payment status.",
    endpoint: "/documents",
    cards: [
      { title: "Bill capture", body: "Record vendor invoices with due dates, tax breakup, and payment ownership." },
      { title: "Expense approvals", body: "Review employee claims before reimbursement or accounting export." },
      { title: "ITC readiness", body: "Store tax values and supplier data needed for GST reconciliation." },
    ],
  },
  "delivery-challans": {
    active: "Documents",
    eyebrow: "Logistics",
    title: "Delivery challans",
    description: "Create delivery records for goods movement, dispatch references, and client acceptance.",
    endpoint: "/documents",
    cards: [
      { title: "Dispatch details", body: "Capture consignee, delivery address, transporter, vehicle, and challan number." },
      { title: "Item movement", body: "List quantities, units, descriptions, and returnable or non-returnable status." },
      { title: "Invoice link", body: "Attach challans to future invoices for operational traceability." },
    ],
  },
  "credit-notes": {
    active: "Documents",
    eyebrow: "Adjustments",
    title: "Credit notes",
    description: "Issue credit notes for returns, discounts, corrections, cancelled invoices, and tax adjustments.",
    endpoint: "/documents",
    cards: [
      { title: "Invoice reference", body: "Link every credit note to the original invoice and adjustment reason." },
      { title: "GST impact", body: "Capture taxable value and tax reduction for compliance reports." },
      { title: "Client balance", body: "Apply credits to open invoices or client account balances." },
    ],
  },
  "debit-notes": {
    active: "Documents",
    eyebrow: "Adjustments",
    title: "Debit notes",
    description: "Raise debit notes for additional charges, tax corrections, or scope additions after invoicing.",
    endpoint: "/documents",
    cards: [
      { title: "Additional billing", body: "Record extra amounts against an original invoice or client account." },
      { title: "Tax correction", body: "Update taxable value and GST impact when invoice values increase." },
      { title: "Approval control", body: "Keep finance review in place before sending adjustments to clients." },
    ],
  },
  receipts: {
    active: "Documents",
    eyebrow: "Collections",
    title: "Receipts",
    description: "Generate payment acknowledgements for invoices, advances, partial payments, and settlements.",
    endpoint: "/payments",
    cards: [
      { title: "Payment acknowledgement", body: "Record amount, mode, reference, date, and invoice allocation." },
      { title: "Partial settlements", body: "Support multiple receipts against the same invoice." },
      { title: "Download center", body: "Make receipts available inside the client portal." },
    ],
  },
  contracts: {
    active: "Documents",
    eyebrow: "Contracts",
    title: "Contract and agreement module",
    description: "Build agreements with clause blocks, approval workflow, digital signature, and document audit history.",
    endpoint: "/documents",
    cards: [
      { title: "Clause blocks", body: "Reusable legal sections for scope, obligations, payment, termination, and confidentiality." },
      { title: "Approval workflow", body: "Route agreements through internal review before client signature." },
      { title: "Digital signature", body: "Collect acceptance and attach signed agreements to client records." },
    ],
  },
  "gst/settings": {
    active: "GST",
    eyebrow: "GST settings",
    title: "GST configuration",
    description: "Configure GSTIN, seller state, registration type, tax defaults, and compliance preferences.",
    endpoint: "/business-settings",
    cards: [
      { title: "Registration details", body: "Maintain GSTIN, PAN, legal name, place of supply, and seller state." },
      { title: "Tax behavior", body: "Set defaults for CGST, SGST, IGST, reverse charge, TDS, and TCS." },
      { title: "Report settings", body: "Prepare month, return type, and export preferences for GST summaries." },
    ],
  },
  "gst/hsn-sac": {
    active: "GST",
    eyebrow: "Catalog compliance",
    title: "HSN/SAC management",
    description: "Maintain item-level HSN and SAC codes, GST rates, and service/product tax metadata.",
    cards: [
      { title: "Code library", body: "Create a reusable catalog of common HSN/SAC codes for line items." },
      { title: "Rate mapping", body: "Attach default GST percentages and descriptions to each code." },
      { title: "Invoice validation", body: "Use catalog data to reduce tax errors before invoices are sent." },
    ],
  },
  "gst/gstr-1": {
    active: "GST",
    eyebrow: "GSTR-1",
    title: "GSTR-1 outward supplies",
    description: "Prepare outward sales data for B2B invoices, taxable values, tax breakup, and export review.",
    endpoint: "/gst/reports",
    cards: [
      { title: "B2B invoices", body: "Summarize registered buyer invoices and tax values." },
      { title: "Exports", body: "Review export-ready outward supply data before filing." },
      { title: "Amendments", body: "Track corrections and credit/debit note impact." },
    ],
  },
  "gst/gstr-3b": {
    active: "GST",
    eyebrow: "GSTR-3B",
    title: "GSTR-3B monthly summary",
    description: "Summarize outward tax, eligible credits, payable tax, and monthly GST position.",
    endpoint: "/gst/reports",
    cards: [
      { title: "Outward liability", body: "Summarize taxable value and tax payable." },
      { title: "ITC summary", body: "Reserve space for eligible input tax credit data." },
      { title: "Payment view", body: "Prepare a clean payable-tax summary for finance review." },
    ],
  },
  "gst/gstr-2a": {
    active: "GST",
    eyebrow: "GSTR-2A",
    title: "GSTR-2A reconciliation",
    description: "Compare purchase records with supplier-reported GST data and flag mismatches.",
    cards: [
      { title: "Supplier matching", body: "Match vendor GSTIN, invoice number, date, and taxable value." },
      { title: "Mismatch queue", body: "Flag missing invoices, value differences, and tax-rate differences." },
      { title: "ITC confidence", body: "Prepare purchase-side records for more reliable input tax credit review." },
    ],
  },
  "gst/e-invoices": {
    active: "E-Invoicing",
    eyebrow: "E-invoice management",
    title: "E-invoice records",
    description: "Manage IRN generation status, QR code references, e-invoice errors, and cancellation flow.",
    endpoint: "/e-invoices",
    cards: [
      { title: "IRN status", body: "Track generated, pending, failed, and cancelled e-invoices." },
      { title: "QR references", body: "Store signed QR data for compliant invoice PDFs." },
      { title: "Retry queue", body: "Keep failed e-invoice requests visible to finance teams." },
    ],
  },
  "gst/tds-tcs": {
    active: "GST",
    eyebrow: "TDS and TCS",
    title: "TDS/TCS management",
    description: "Track deductions and collections across invoices, payments, and compliance summaries.",
    cards: [
      { title: "Deduction tracking", body: "Capture TDS withheld by clients against invoice payments." },
      { title: "Collection tracking", body: "Capture TCS collected where applicable." },
      { title: "Settlement view", body: "Separate gross invoice value, deductions, and received amount." },
    ],
  },
  "payments/settings": {
    active: "Payments",
    eyebrow: "Gateway settings",
    title: "Payment gateway settings",
    description: "Configure Razorpay, Stripe, UPI, webhooks, settlement accounts, and payment methods.",
    cards: [
      { title: "Razorpay", body: "Configure keys, webhooks, UPI, cards, netbanking, and settlement references." },
      { title: "Stripe", body: "Set up international card collection, customer records, and event webhooks." },
      { title: "UPI", body: "Maintain QR codes and payment identifiers for Indian payment collection." },
    ],
  },
  "payments/subscription-billing": {
    active: "Payments",
    eyebrow: "Subscription billing",
    title: "Subscription billing",
    description: "Manage recurring client plans, SaaS subscriptions, renewals, and automated invoice generation.",
    cards: [
      { title: "Plans", body: "Create client-facing plan names, amounts, taxes, and billing cadence." },
      { title: "Renewals", body: "Track upcoming renewals and failed collection workflows." },
      { title: "Revenue operations", body: "Connect subscription invoices with receipts and accounting export." },
    ],
  },
  "payments/upi-qr": {
    active: "Payments",
    eyebrow: "UPI QR",
    title: "UPI QR management",
    description: "Create, store, and share UPI payment QR references for invoice and portal payments.",
    cards: [
      { title: "Static QR", body: "Maintain workspace-level QR codes for quick client payments." },
      { title: "Dynamic QR", body: "Prepare invoice-specific QR payloads for exact amount collection." },
      { title: "Reconciliation", body: "Match UPI references with invoice receipts and payment status." },
    ],
  },
  "accounting/xero": {
    active: "Accounting",
    eyebrow: "Xero integration",
    title: "Xero integration",
    description: "Map contacts, invoices, taxes, payments, and accounts for Xero export.",
    cards: [
      { title: "Contact sync", body: "Map client records with Xero contacts." },
      { title: "Invoice export", body: "Push invoice totals, tax lines, and payment state." },
      { title: "Account mapping", body: "Configure revenue, tax, and receivable accounts." },
    ],
  },
  "accounting/quickbooks": {
    active: "Accounting",
    eyebrow: "QuickBooks integration",
    title: "QuickBooks integration",
    description: "Prepare QuickBooks sync for customers, invoices, payments, tax codes, and accounting categories.",
    cards: [
      { title: "Customer mapping", body: "Link InvoiceForge clients to QuickBooks customers." },
      { title: "Tax code mapping", body: "Map GST and global tax codes to accounting records." },
      { title: "Payment sync", body: "Send receipt and settlement data to accounting." },
    ],
  },
  "accounting/tally": {
    active: "Accounting",
    eyebrow: "Tally export",
    title: "Tally export",
    description: "Generate Tally-friendly exports for invoices, ledgers, GST reports, and receipts.",
    cards: [
      { title: "Ledger mapping", body: "Map customers, revenue, tax, and bank ledgers." },
      { title: "Invoice XML/Excel", body: "Prepare export packages for Tally import workflows." },
      { title: "GST reports", body: "Align exported data with return periods and tax breakup." },
    ],
  },
  "team/members": {
    active: "Team",
    eyebrow: "Team management",
    title: "Team members",
    description: "Invite employees, manage member status, assign access, and organize workspace ownership.",
    cards: [
      { title: "Invitations", body: "Send employee invites and track accepted, pending, and expired invitations." },
      { title: "Member directory", body: "View workspace members, emails, roles, and last activity." },
      { title: "Workspace access", body: "Control which modules each team member can use." },
    ],
  },
  "team/roles": {
    active: "Team",
    eyebrow: "Roles and permissions",
    title: "Roles and permissions",
    description: "Define owner, admin, finance, sales, operations, and viewer access across the app.",
    cards: [
      { title: "Role templates", body: "Start with common permissions for sales, finance, and operations." },
      { title: "Module permissions", body: "Control access to proposals, invoices, GST, payments, settings, and admin." },
      { title: "Approval authority", body: "Define who can approve discounts, contracts, and document sends." },
    ],
  },
  "team/activity": {
    active: "Team",
    eyebrow: "Activity logs",
    title: "Workspace activity logs",
    description: "Audit important events across documents, clients, settings, payments, users, and security.",
    endpoint: "/activity-log",
    cards: [
      { title: "Document events", body: "Track create, edit, send, sign, approve, reject, and convert actions." },
      { title: "Security events", body: "Track login, invitation, role change, API key, and webhook activity." },
      { title: "Compliance events", body: "Preserve GST report, invoice, and payment changes for review." },
    ],
  },
  "settings/branding": {
    active: "Settings",
    eyebrow: "Branding",
    title: "Branding settings",
    description: "Configure logo, brand colors, invoice themes, proposal themes, email styling, and portal identity.",
    cards: [
      { title: "Logo and colors", body: "Set a consistent visual identity across proposals, invoices, and portal pages." },
      { title: "Document themes", body: "Choose layouts for invoice PDFs and proposal templates." },
      { title: "Client portal brand", body: "Apply workspace branding to buyer-facing review and payment pages." },
    ],
  },
  "settings/tax": {
    active: "Settings",
    eyebrow: "Tax settings",
    title: "Tax settings",
    description: "Set default tax behavior for GST, VAT, multi-currency documents, and international clients.",
    endpoint: "/business-settings",
    cards: [
      { title: "GST defaults", body: "Set seller state, registration type, default rates, and place-of-supply behavior." },
      { title: "VAT support", body: "Reserve tax rules for global customers and non-Indian invoices." },
      { title: "Currency defaults", body: "Coordinate tax and currency behavior for each workspace." },
    ],
  },
  "settings/notifications": {
    active: "Settings",
    eyebrow: "Notifications",
    title: "Notification settings",
    description: "Control email, in-app, payment, proposal, invoice, due-date, and client portal notifications.",
    cards: [
      { title: "Proposal alerts", body: "Notify teams when clients open, comment, approve, reject, or sign." },
      { title: "Invoice reminders", body: "Schedule due-date and overdue reminders." },
      { title: "Team notifications", body: "Send alerts for assignments, approvals, and system events." },
    ],
  },
  "settings/security": {
    active: "Settings",
    eyebrow: "Security",
    title: "Security settings",
    description: "Manage password policies, OTP, sessions, role controls, SSO readiness, and data protection.",
    cards: [
      { title: "Authentication", body: "Configure password, OTP, Google login, and future SSO options." },
      { title: "Session control", body: "Manage active sessions and sign-out behavior." },
      { title: "Access policies", body: "Coordinate roles, permissions, client portal access, and API controls." },
    ],
  },
  "settings/api": {
    active: "Settings",
    eyebrow: "API and webhooks",
    title: "API keys and webhooks",
    description: "Create integration keys, webhook endpoints, event subscriptions, and automation controls.",
    cards: [
      { title: "API keys", body: "Issue scoped keys for internal tools and integrations." },
      { title: "Webhook events", body: "Subscribe to proposal, invoice, payment, client, and signature events." },
      { title: "Developer controls", body: "Monitor failures, rotate secrets, and review integration activity." },
    ],
  },
  "admin/tenants": {
    active: "Admin",
    eyebrow: "Tenant management",
    title: "Tenant management",
    description: "Manage workspaces, companies, domains, plan status, onboarding stage, and tenant health.",
    cards: [
      { title: "Workspace list", body: "View all tenant companies across the SaaS platform." },
      { title: "Tenant health", body: "Monitor setup completion, document activity, and integration status." },
      { title: "Admin actions", body: "Suspend, reactivate, impersonate support, and review workspace metadata." },
    ],
  },
  "admin/subscriptions": {
    active: "Admin",
    eyebrow: "Subscription management",
    title: "Subscription management",
    description: "Track SaaS plans, billing status, active users, trial periods, upgrades, and cancellations.",
    cards: [
      { title: "Plan catalog", body: "Manage Free, Starter, Business, and Enterprise plan metadata." },
      { title: "Billing state", body: "Track trials, renewals, failed payments, and subscription lifecycle." },
      { title: "Revenue summary", body: "Monitor recurring revenue and expansion opportunities." },
    ],
  },
  "admin/users": {
    active: "Admin",
    eyebrow: "User management",
    title: "User management",
    description: "Manage platform users, roles, workspace membership, lockouts, and support access.",
    cards: [
      { title: "User directory", body: "Search users across tenants and workspaces." },
      { title: "Role oversight", body: "Review owner, admin, employee, and client portal access." },
      { title: "Account actions", body: "Reset access, revoke sessions, or assist with invitation issues." },
    ],
  },
  "admin/support-tickets": {
    active: "Admin",
    eyebrow: "Support",
    title: "Support tickets",
    description: "Track customer support requests, issue severity, tenant context, and resolution status.",
    cards: [
      { title: "Ticket queue", body: "Organize open, pending, escalated, and resolved tickets." },
      { title: "Tenant context", body: "Attach workspace data and recent activity to support cases." },
      { title: "Resolution metrics", body: "Monitor response times, ownership, and support quality." },
    ],
  },
  "admin/system-logs": {
    active: "Admin",
    eyebrow: "System logs",
    title: "System logs",
    description: "Review backend activity, authentication events, integrations, webhooks, and error signals.",
    cards: [
      { title: "Application events", body: "Inspect service-level events and operational activity." },
      { title: "Integration logs", body: "Review payment, accounting, email, and webhook delivery activity." },
      { title: "Security logs", body: "Monitor authentication, invitations, roles, and sensitive changes." },
    ],
  },
  "admin/feature-flags": {
    active: "Admin",
    eyebrow: "Feature flags",
    title: "Feature flags",
    description: "Control staged releases for tenants, modules, templates, integrations, and AI features.",
    cards: [
      { title: "Module flags", body: "Enable or disable product areas by tenant or plan." },
      { title: "Release cohorts", body: "Roll out features to internal, beta, or enterprise groups." },
      { title: "Kill switches", body: "Quickly disable risky integrations or experimental flows." },
    ],
  },
  "admin/analytics": {
    active: "Admin",
    eyebrow: "Analytics and monitoring",
    title: "Platform analytics and monitoring",
    description: "Monitor workspace growth, revenue, usage, active users, document sends, and system reliability.",
    cards: [
      { title: "Growth metrics", body: "Track tenants, active users, signups, and onboarding completion." },
      { title: "Revenue metrics", body: "Track subscriptions, MRR, churn, upgrades, and plan mix." },
      { title: "Reliability", body: "Monitor API health, background jobs, webhook delivery, and error rates." },
    ],
  },
};

type PageParams = {
  params: Promise<{
    module: string[];
  }>;
};

export default async function DashboardModuleRoute({ params }: PageParams) {
  const { module } = await params;
  const key = module.join("/");

  if (key === "team/my-tasks") {
    return <MemberTasksPage />;
  }

  if (key === "team/members" || key === "team/roles" || key === "team/activity") {
    return <TeamRecordsPage section={key} />;
  }

  const config = modulePages[key];

  if (!config) {
    notFound();
  }

  return <ModulePage {...config} />;
}
