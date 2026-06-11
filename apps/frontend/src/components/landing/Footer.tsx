import React from 'react'

export default function Footer(){
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">InvoiceForge</div>
          <p className="text-sm text-slate-500 mt-3">Complete business documents, GST compliance and payments in one platform.</p>
        </div>
        <div>
          <h4 className="font-semibold">Product</h4>
          <ul className="mt-2 text-sm text-slate-600 space-y-1">
            <li>Features</li>
            <li>Pricing</li>
            <li>Docs</li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold">Company</h4>
          <ul className="mt-2 text-sm text-slate-600 space-y-1">
            <li>About</li>
            <li>Careers</li>
            <li>Contact</li>
          </ul>
        </div>
      </div>
      <div className="text-center text-sm text-slate-500 py-6">© {new Date().getFullYear()} InvoiceForge. All rights reserved.</div>
    </footer>
  )
}
