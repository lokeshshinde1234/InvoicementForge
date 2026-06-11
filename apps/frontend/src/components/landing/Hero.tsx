"use client"
import React from 'react'

export default function Hero(){
  return (
    <section id="hero" className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">Create Proposals, Invoices & GST-Compliant Business Documents in One Powerful Platform</h1>
          <p className="mt-4 text-lg text-slate-600">InvoiceForge helps agencies, freelancers, SMEs, and enterprises manage proposals, invoices, taxes, signatures, payments, and accounting workflows from one modern SaaS dashboard.</p>
          <div className="mt-6 flex gap-4">
            <button className="px-5 py-3 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">Start Free Trial</button>
            <button className="px-5 py-3 rounded-full border border-slate-200">Watch Demo</button>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -inset-6 bg-gradient-to-r from-indigo-300 via-purple-200 to-pink-200 opacity-30 blur-3xl rounded-2xl transform-gpu animate-blob"></div>
          <div className="relative p-6 bg-white/80 dark:bg-slate-800/70 rounded-2xl shadow-2xl animate-rise-delayed">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gradient-to-br from-white to-indigo-50 rounded-lg">
                <h3 className="font-semibold">Proposal Builder</h3>
                <p className="text-sm text-slate-500">Visual drag & drop blocks</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-white to-green-50 rounded-lg">
                <h3 className="font-semibold">GST Report</h3>
                <p className="text-sm text-slate-500">Auto CGST/SGST/IGST</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-white to-pink-50 rounded-lg">
                <h3 className="font-semibold">Invoice Card</h3>
                <p className="text-sm text-slate-500">Multi-currency & e-invoice ready</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-white to-yellow-50 rounded-lg">
                <h3 className="font-semibold">E-Signature</h3>
                <p className="text-sm text-slate-500">Collect signatures & approvals</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
