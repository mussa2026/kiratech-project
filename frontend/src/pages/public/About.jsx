import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import NetworkBackground from '../../components/NetworkBackground';
import { ShieldCheckIcon, UserGroupIcon, StarIcon } from '@heroicons/react/24/outline';

const stats = [
  { value: '500+',   label: 'Happy Customers',       icon: '😊' },
  { value: '50+',    label: 'Certified Technicians',  icon: '👨‍💻' },
  { value: '1,200+', label: 'Completed Jobs',          icon: '✅' },
  { value: '4.9★',   label: 'Average Rating',          icon: '⭐' },
];

const values = [
  { icon: ShieldCheckIcon, title: 'Certified Experts',   desc: 'Every technician is background-checked and holds industry certifications.' },
  { icon: UserGroupIcon,   title: 'Customer First',       desc: 'We put customers at the center of everything we do — fast, transparent, reliable.' },
  { icon: StarIcon,        title: 'Quality Guarantee',    desc: 'All work is backed by our quality guarantee. Not satisfied? We make it right.' },
];

export default function About() {
  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff] dark:bg-[#070d1a]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 text-white text-center">
        <div className="absolute inset-0 bg-hero-gradient" />
        <NetworkBackground nodeCount={40} opacity={0.7} />
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <div className="relative max-w-3xl mx-auto animate-fade-in-up">
          <span className="cyber-tag mb-5 inline-flex border-white/20 text-white/80">🏢 About Us</span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            About{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              KIRATECH
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-xl mx-auto leading-relaxed">
            Your trusted partner in IT support and computing services across East Africa.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #f0f4ff)' }} />
        <div className="dark:block hidden absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #070d1a)' }} />
      </section>

      {/* Stats */}
      <section className="py-12 px-4 bg-white dark:bg-slate-900 border-y border-blue-50 dark:border-slate-700/50">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map(({ value, label, icon }, i) => (
            <div key={label} className={`animate-fade-in-up delay-${i * 100}`}>
              <div className="text-3xl mb-1">{icon}</div>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{value}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who we are */}
      <section className="py-20 px-4 bg-[#f0f4ff] dark:bg-[#070d1a] bg-cyber-grid">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center mb-12">
            <span className="cyber-tag mb-4 inline-flex">🔍 Our Story</span>
            <h2 className="section-title">Who We Are</h2>
          </div>

          <div className="card-cyber p-8 animate-fade-in-up">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">1</span>
              Our Company
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              KIRATECH is an online IT support management platform that connects customers with
              certified technicians for all their computing and technology needs. We serve homes,
              small businesses, and enterprises with professional, timely, and affordable IT services
              across Tanzania and East Africa.
            </p>
          </div>

          <div className="card-cyber p-8 animate-fade-in-up delay-100">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">2</span>
              Our Mission
            </h3>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              To make professional IT support accessible to everyone — simply submit a request,
              and we handle the rest. No more waiting in queues or searching for unreliable
              technicians. KIRATECH brings expert IT support right to your door.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 px-4 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="cyber-tag mb-4 inline-flex">💎 Our Values</span>
            <h2 className="section-title">What Drives Us</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={v.title}
                className={`card-cyber p-7 text-center group hover:-translate-y-1 hover:shadow-cyber
                            transition-all duration-300 animate-fade-in-up delay-${i * 100}`}>
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl
                                bg-blue-600 shadow-cyber-sm mb-5 mx-auto">
                  <v.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white mb-2">{v.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
