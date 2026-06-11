"use client"
import React from 'react'

export default function Navbar(){
  return (
    <header className="fixed w-full z-50 backdrop-blur bg-white/30 dark:bg-slate-900/40">
      <nav className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">InvoiceForge</div>
        </div>
        <div className="hidden md:flex items-center gap-8">
          <a className="text-sm text-slate-700 hover:underline hover:underline-offset-4" href="#features">Features</a>
          <a className="text-sm text-slate-700 hover:underline" href="#gst">GST Compliance</a>
          <a className="text-sm text-slate-700 hover:underline" href="#proposal">Proposal Builder</a>
          <a className="text-sm text-slate-700 hover:underline" href="#documents">Documents</a>
          <a className="text-sm text-slate-700 hover:underline" href="#pricing">Pricing</a>
          <a className="text-sm text-slate-700 hover:underline" href="#contact">Contact</a>
        </div>
        <div className="flex items-center gap-3">
          <a href="/portal/login" className="text-sm px-3 py-2">Client Login</a>
          <button className="text-sm px-3 py-2">Login</button>
          <a className="hidden md:inline-block bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-2 rounded-full shadow-lg transition hover:scale-[1.02]">Get Started</a>
        </div>
      </nav>
    </header>
  )
}
