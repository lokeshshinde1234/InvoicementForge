"use client";

import React from "react";

const features = [
  ["Proposal Builder", "Build visually rich proposals"],
  ["GST-Compliant Invoicing", "India-first GST support"],
  ["E-Signature & Approval", "Secure client signatures"],
  ["Payment Collection", "UPI, Razorpay, Stripe"],
  ["Multi-Currency Support", "INR, USD, EUR and more"],
  ["Document Management", "Store and version docs"],
  ["Accounting Export", "Xero, QuickBooks, Tally"],
  ["Client Portal", "Secure client access"],
];

export default function Features() {
  return (
    <section id="features" className="py-16">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-3xl font-bold">Core Features</h2>
        <p className="mt-2 text-slate-600">
          All the tools to run your documents, billing and compliance.
        </p>
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map(([title, desc]) => (
            <div
              key={title}
              className="rounded-2xl border border-transparent bg-white/70 p-6 transition duration-300 hover:-translate-y-1 hover:border-indigo-300 hover:shadow-xl dark:bg-slate-800/60"
            >
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-50 font-bold text-indigo-700">
                IF
              </div>
              <h3 className="font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
