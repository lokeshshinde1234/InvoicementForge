"use client";

import {
  WorkspaceRecordsPage,
  type WorkspaceRecord,
} from "@/components/dashboard/WorkspaceRecordsPage";

type Payment = {
  id: string;
  invoiceId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string | null;
  amount: number | string;
  currency: string;
  status: string;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
};

function paymentProvider(payment: Payment) {
  if (payment.razorpayOrderId.startsWith("UPI-") || payment.metadata?.fallback === "upi_manual") {
    return "UPI QR";
  }

  return "Razorpay";
}

const paymentTabs = [
  {
    id: "all",
    label: "All payments",
    description: "All payment records created for this company.",
    filter: () => true,
  },
  {
    id: "upi",
    label: "UPI QR",
    filter: (record: WorkspaceRecord) => record.category === "UPI QR",
  },
  {
    id: "razorpay",
    label: "Razorpay",
    filter: (record: WorkspaceRecord) => record.category === "Razorpay",
  },
  {
    id: "payu",
    label: "PayU",
    filter: (record: WorkspaceRecord) => record.category === "PayU",
  },
  {
    id: "stripe",
    label: "Stripe",
    filter: (record: WorkspaceRecord) => record.category === "Stripe",
  },
];

export default function PaymentsPage() {
  return (
    <WorkspaceRecordsPage
      active="Payments"
      eyebrow="Payments"
      title="UPI, Razorpay, PayU, and Stripe"
      description="Payments are grouped by payment rail. UPI QR and Razorpay records come from live invoice payment activity; PayU and Stripe will show records when those gateways are connected."
      sources={[
        {
          label: "Payments",
          endpoint: "/payments",
          map: (data) =>
            (data as Payment[]).map((payment) => {
              const provider = paymentProvider(payment);

              return {
                id: payment.id,
                title: `${provider} payment`,
                subtitle: `Invoice ${payment.invoiceId.slice(0, 8)}`,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                date: payment.createdAt,
                category: provider,
                href: `/invoices/${payment.invoiceId}`,
                pdfFilename: `payment-${payment.id.slice(0, 8)}.pdf`,
                deletePath: `/payments/${payment.id}`,
                deleteLabel: `${provider} payment`,
                details: [
                  { label: "Order", value: payment.razorpayOrderId },
                  { label: "Payment", value: payment.razorpayPaymentId ?? "Pending" },
                ],
              };
            }),
        },
      ]}
      tabs={paymentTabs}
      emptyTitle="No payments found"
      emptyDescription="Create or collect invoice payments to populate this payment section."
    />
  );
}
