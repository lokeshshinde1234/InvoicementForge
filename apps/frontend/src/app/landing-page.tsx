import React from 'react'
import dynamic from 'next/dynamic'

const Navbar = dynamic(()=>import('../components/landing/Navbar'))
const Hero = dynamic(()=>import('../components/landing/Hero'))
const Features = dynamic(()=>import('../components/landing/Features'))
const Footer = dynamic(()=>import('../components/landing/Footer'))

export default function LandingPage(){
  return (
    <div className="antialiased text-slate-900 bg-white dark:bg-slate-900 min-h-screen">
      <Navbar />
      <main className="pt-24">
        <div data-aos="if-fade-up" data-once="true">
          <Hero />
        </div>
        <div data-aos="if-fade-up">
          <Features />
        </div>
        <section id="trusted" className="py-12" data-aos="if-fade-up">
          <div className="max-w-7xl mx-auto px-6">
            <h3 className="text-xl font-semibold">Trusted by growing agencies, consultants, SMEs, and global businesses.</h3>
            <div className="mt-6 overflow-hidden">
              <div className="flex gap-8 animate-marquee">
                {Array.from({length:8}).map((_,i)=> (
                  <div key={i} className="w-32 h-12 bg-slate-100 rounded flex items-center justify-center text-sm text-slate-400">Logo</div>
                ))}
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </div>
  )
}
