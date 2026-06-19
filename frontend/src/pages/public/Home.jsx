import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import NetworkBackground from '../../components/NetworkBackground';
import {
  ComputerDesktopIcon, DevicePhoneMobileIcon, WifiIcon, CloudIcon,
  ArrowDownTrayIcon, CpuChipIcon, PrinterIcon,
  StarIcon, ShieldCheckIcon, ClockIcon, PhoneIcon,
  CreditCardIcon, CheckCircleIcon,
} from '@heroicons/react/24/outline';

const standardServices = [
  { icon: ComputerDesktopIcon, name: 'Computer Maintenance', desc: 'Full diagnosis, cleaning, and repair.' },
  { icon: PrinterIcon,         name: 'Printer Repair',       desc: 'Installation, repair, and driver setup.' },
  { icon: DevicePhoneMobileIcon, name: 'Mobile Phone Repair', desc: 'Screen, battery, and data recovery.' },
  { icon: WifiIcon,            name: 'Network & WiFi Setup', desc: 'Home and office network configuration.' },
  { icon: CloudIcon,           name: 'Data Recovery',        desc: 'File recovery and cloud backup solutions.' },
  { icon: ArrowDownTrayIcon,   name: 'Software Installation', desc: 'OS, drivers, antivirus, and updates.' },
  { icon: CpuChipIcon,         name: 'Hardware Upgrades',    desc: 'RAM, SSD, GPU, and component installs.' },
];

const features = [
  { icon: ClockIcon,        title: 'Fast Response',         desc: 'We respond within 2 hours on all standard requests.' },
  { icon: ShieldCheckIcon,  title: 'Certified Technicians', desc: 'All technicians are certified and background-checked.' },
  { icon: StarIcon,         title: '5-Star Service',        desc: 'Rated 4.9/5 by hundreds of satisfied customers.' },
  { icon: CreditCardIcon,   title: 'Secure Payments',       desc: 'Online payments powered by Stripe — safe and instant.' },
];

const steps = [
  { step: '01', title: 'Register & Verify', desc: 'Create your account and verify your email with a 6-digit code.' },
  { step: '02', title: 'Submit Request',    desc: 'Describe your issue and choose a service type.' },
  { step: '03', title: 'Get Assigned',      desc: 'Admin assigns the best available technician.' },
  { step: '04', title: 'Problem Solved',    desc: 'Technician executes the service and you pay securely online.' },
];

const stats = [
  { value: '500+',  label: 'Happy Customers' },
  { value: '50+',   label: 'Certified Technicians' },
  { value: '1,200+', label: 'Completed Jobs' },
  { value: '4.9★',  label: 'Average Rating' },
];

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff] dark:bg-[#070d1a]">
      <Navbar />

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Deep dark cyber background */}
        <div className="absolute inset-0 bg-hero-gradient" />

        {/* Animated network canvas */}
        <NetworkBackground nodeCount={60} opacity={0.9} />

        {/* Cyber grid overlay */}
        <div className="absolute inset-0 bg-cyber-grid opacity-30" />

        {/* Radial glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full"
               style={{ background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)' }} />
        </div>

        {/* Hero content */}
        <div className="relative w-full max-w-5xl mx-auto px-4 py-28 text-center">
          {/* Cyber badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8
                          border border-blue-500/30 bg-blue-500/10 backdrop-blur-sm
                          animate-fade-in-down">
            <span className="h-2 w-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-blue-300 text-xs font-semibold tracking-widest uppercase">
              Online IT Support Platform
            </span>
          </div>

          {/* Logo mark */}
          <div className="flex justify-center mb-6 animate-fade-in delay-100">
            <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-2xl animate-float"
                 xmlns="http://www.w3.org/2000/svg">
              <defs>
                <radialGradient id="hg2" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="1" />
                </radialGradient>
                <radialGradient id="hg3" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#134e4a" />
                  <stop offset="100%" stopColor="#0f766e" />
                </radialGradient>
              </defs>
              {[0,90,180,270].map((rot,i) => (
                <g key={i} transform={`rotate(${rot} 50 50)`}>
                  <path d="M50 50 C54 38,66 28,62 18 C59 10,50 8,46 14 C42 20,46 30,50 50Z"
                    fill="url(#hg2)" opacity={0.85 - i*0.08}/>
                  <ellipse cx="53" cy="14" rx="4.5" ry="6" transform="rotate(-20 53 14)"
                    fill="#2dd4bf" opacity="0.95"/>
                </g>
              ))}
              <circle cx="50" cy="50" r="10" fill="url(#hg3)"/>
              <circle cx="50" cy="50" r="6"  fill="#042f2e" opacity="0.9"/>
            </svg>
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 leading-[1.08] tracking-tight animate-fade-in-up delay-150">
            Professional{' '}
            <span className="relative">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                IT Support
              </span>
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-cyan-400">
              On Demand
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-200">
            From computer repairs to network setup and cloud services —
            KIRATECH connects you with certified technicians fast.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-14 animate-fade-in-up delay-300">            <Link to="/register"
              className="group px-9 py-4 text-lg font-bold rounded-2xl text-white
                         bg-gradient-to-r from-blue-600 to-blue-500
                         hover:from-blue-500 hover:to-cyan-500
                         shadow-cyber hover:shadow-cyber-sm
                         transition-all duration-300 active:scale-95">
              Get Started Free
              <span className="ml-2 inline-block group-hover:translate-x-1 transition-transform">→</span>
            </Link>
            <Link to="/services"
              className="px-9 py-4 text-lg font-bold rounded-2xl text-white
                         border border-white/20 bg-white/5 backdrop-blur-sm
                         hover:bg-white/10 hover:border-white/40
                         transition-all duration-300 active:scale-95">
              View Services
            </Link>
          </div>

          {/* Trust bar */}
          <div className="flex flex-wrap justify-center gap-6 animate-fade-in delay-400">
            {[
              { icon: '⚡', text: '2-Hour Response' },
              { icon: '🔒', text: 'Certified Technicians' },
              { icon: '⭐', text: '4.9 / 5 Rating' },
              { icon: '💳', text: 'Secure Online Payment' },
            ].map(({ icon, text }) => (
              <div key={text}
                className="flex items-center gap-2 px-4 py-2 rounded-full
                           bg-white/5 border border-white/10 backdrop-blur-sm
                           text-slate-300 text-sm">
                <span>{icon}</span>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #f0f4ff)' }} />
        <div className="dark:block hidden absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #070d1a)' }} />
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────── */}
      <section className="py-12 px-4 bg-white dark:bg-slate-900 border-y border-blue-50 dark:border-slate-700/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label }) => (
            <div key={label} className="animate-fade-in-up">
              <p className="text-3xl md:text-4xl font-extrabold text-blue-600 dark:text-blue-400 mb-1">
                {value}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY KIRATECH ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#f0f4ff] dark:bg-[#070d1a] bg-cyber-grid">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="cyber-tag mb-4 inline-flex">🛡 Why Choose Us</span>
            <h2 className="section-title">Enterprise-Grade IT Support</h2>
            <p className="section-subtitle">
              Professional, reliable, and secure. Every service backed by certified experts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div key={f.title}
                className={`card-cyber p-7 text-center group hover:-translate-y-1
                            hover:shadow-cyber transition-all duration-300
                            animate-fade-in-up delay-${i * 100}`}>
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl
                                bg-blue-600 dark:bg-blue-700
                                shadow-cyber-sm group-hover:shadow-cyber
                                mb-5 transition-all duration-300">
                  <f.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2 text-base">{f.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="cyber-tag mb-4 inline-flex">⚙ Our Services</span>
            <h2 className="section-title">What We Fix & Build</h2>
            <p className="section-subtitle">
              Professional computing and IT support for homes and businesses.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {standardServices.map((svc, i) => (
              <div key={svc.name}
                className={`group card hover:shadow-cyber hover:-translate-y-1 cursor-pointer
                            transition-all duration-300 animate-fade-in-up delay-${Math.min(i * 75, 500)}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/30
                                  flex items-center justify-center flex-shrink-0
                                  group-hover:bg-blue-600 group-hover:shadow-cyber-sm
                                  transition-all duration-300">
                    <svc.icon className="h-5 w-5 text-blue-600 dark:text-blue-400 group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
                    {svc.name}
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{svc.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-10">
            <Link to="/services" className="btn-primary px-8 py-3 text-base">
              View All Services →
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────── */}
      <section className="py-24 px-4 bg-[#f0f4ff] dark:bg-[#070d1a] bg-cyber-grid">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="cyber-tag mb-4 inline-flex">🔄 Process</span>
            <h2 className="section-title">How It Works</h2>
            <p className="section-subtitle">From registration to resolution in 4 simple steps.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((s, i) => (
              <div key={s.step}
                className={`card-cyber p-6 text-center relative animate-fade-in-up delay-${i * 100}`}>
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-6 z-10">
                    <div className="h-px w-full bg-gradient-to-r from-blue-400/60 to-transparent" />
                  </div>
                )}
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-full
                                bg-gradient-to-br from-blue-600 to-cyan-600
                                text-white font-black text-lg mb-4
                                shadow-cyber animate-glow-pulse mx-auto">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{s.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden py-28 px-4 text-white text-center">
        <div className="absolute inset-0 bg-hero-gradient" />
        <NetworkBackground nodeCount={35} opacity={0.6} />
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <div className="relative max-w-2xl mx-auto">
          <span className="cyber-tag mb-6 inline-flex border-white/20 text-white/80">
            🚀 Get Started Today
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
            Ready to Fix Your<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              IT Problem?
            </span>
          </h2>
          <p className="text-slate-300 mb-10 text-lg leading-relaxed">
            Join hundreds of customers who trust KIRATECH for their computing needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/register"
              className="group px-10 py-4 text-lg font-bold rounded-2xl text-white
                         bg-gradient-to-r from-blue-600 to-cyan-600
                         hover:from-blue-500 hover:to-cyan-500
                         shadow-cyber transition-all duration-300 active:scale-95">
              Create Free Account
              <span className="ml-2 group-hover:translate-x-1 inline-block transition-transform">→</span>
            </Link>
            <Link to="/contact"
              className="px-10 py-4 text-lg font-bold rounded-2xl text-white
                         border border-white/20 bg-white/5 backdrop-blur-sm
                         hover:bg-white/10 hover:border-white/40
                         transition-all duration-300 active:scale-95">
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
