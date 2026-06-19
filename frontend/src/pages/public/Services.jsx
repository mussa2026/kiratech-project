import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import NetworkBackground from '../../components/NetworkBackground';
import LoadingSpinner from '../../components/LoadingSpinner';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import api from '../../lib/api';

// ─── TZS formatter ────────────────────────────────────────────────────────────
const tzs = (amount) =>
  amount === 0
    ? 'Free'
    : `TZS ${Number(amount).toLocaleString('en-TZ')}`;

// ─── Sub-type tags per service (expandable spans) ─────────────────────────────
const serviceSubTypes = {
  'Mobile Phone Repair': [
    'Samsung Galaxy S/A/Note/Z Fold',
    'iPhone 6 / 7 / 8 / X / 11 / 12 / 13 / 14 / 15 / 16 / 17',
    'Xiaomi / Redmi / POCO',
    'Tecno Spark / Camon / Phantom',
    'Infinix Hot / Note / Zero',
    'Itel A / P Series',
    'Huawei / Honor',
    'Oppo / Realme',
    'Vivo Y / V Series',
    'OnePlus',
    'Nokia / Motorola',
    'Tablet Repair (iPad, Samsung Tab, Lenovo)',
  ],
  'Computer Maintenance & Troubleshooting': [
    'Windows 10 / 11 PC',
    'MacBook / iMac',
    'Linux (Ubuntu / Kali / Mint)',
    'Gaming PC / Desktop',
    'Laptop (Dell, HP, Lenovo, Asus, Acer)',
    'All-in-One Desktops',
    'Workstation / Server',
    'Virus & Malware Removal',
    'Blue Screen / Boot Failure Fix',
  ],
  'Printer Repair & Services': [
    'HP (InkJet & LaserJet)',
    'Canon PIXMA / ImageRunner',
    'Epson (L Series, EcoTank)',
    'Brother (DCP / MFC)',
    'Samsung / Xerox / Kyocera',
    'Thermal Receipt Printers',
    'Dot Matrix Printers',
    'Network / Wireless Printers',
  ],
  'Network Installation & WiFi Setup': [
    'TP-Link (Router / Extender)',
    'Huawei / ZTE 4G/5G Router',
    'Mikrotik / Ubiquiti Setup',
    'Cisco / Netgear / D-Link',
    'Office LAN Cabling (Cat5e/Cat6)',
    'Fibre / ADSL / LTE Setup',
    'WiFi Coverage Extension',
    'Network Security & Firewall',
  ],
  'Hardware Upgrade Services': [
    'RAM Upgrade (DDR3/DDR4/DDR5)',
    'HDD → SSD Migration (SATA/NVMe)',
    'GPU / Graphics Card Install',
    'CPU Upgrade',
    'Laptop Screen Replacement',
    'Laptop Keyboard Replacement',
    'Laptop Battery Replacement',
    'Power Supply (PSU) Replacement',
    'Dell / HP / Lenovo / Asus / Acer / Apple',
  ],
  'Software Installation & Updates': [
    'Windows 10 / 11 Installation',
    'Microsoft Office (2016/2019/365)',
    'Adobe Photoshop / Illustrator / Premiere',
    'AutoCAD / SketchUp',
    'Antivirus (Kaspersky / ESET / Avast)',
    'macOS Setup',
    'Ubuntu / Kali Linux',
    'Driver Updates & Optimization',
  ],
  'Remote Desktop Support': [
    'AnyDesk Remote Support',
    'TeamViewer Remote Support',
    'Windows Remote Desktop (RDP)',
    'Software Troubleshooting',
    'Email & Office 365 Setup',
    'Printer Remote Config',
    'Network Remote Fix',
  ],
};

// ─── Single service card ───────────────────────────────────────────────────────
function ServiceCard({ svc, index }) {
  const [expanded, setExpanded] = useState(false);
  const subTypes = serviceSubTypes[svc.name];

  return (
    <div
      className={`card-cyber p-5 group transition-all duration-300 animate-fade-in-up
                  delay-${Math.min(index * 75, 500)}
                  ${expanded ? 'shadow-cyber' : 'hover:-translate-y-0.5 hover:shadow-cyber'}`}>

      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-bold text-gray-900 dark:text-white text-sm leading-tight">
          {svc.name}
        </h3>
        <span className={`badge flex-shrink-0 text-xs ${
          svc.category === 'premium'
            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
        }`}>
          {svc.category === 'premium' ? '⭐ Premium' : 'Standard'}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
        {svc.description}
      </p>

      {/* Sub-types toggle */}
      {subTypes && (
        <div className="mb-3">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400
                       hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
          >
            {expanded
              ? <><ChevronUpIcon className="h-3.5 w-3.5" /> Hide supported types</>
              : <><ChevronDownIcon className="h-3.5 w-3.5" /> Show {subTypes.length} supported types</>
            }
          </button>

          {expanded && (
            <div className="mt-2.5 flex flex-wrap gap-1.5 animate-fade-in">
              {subTypes.map((t) => (
                <span key={t}
                  className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
                             bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300
                             border border-blue-100 dark:border-blue-800/40">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Footer — price + duration */}
      <div className="flex items-center justify-between text-xs pt-3 border-t border-blue-50 dark:border-slate-700/50">
        {svc.basePrice > 0 ? (
          <span className="font-bold text-blue-600 dark:text-blue-400">
            From {tzs(svc.basePrice)}
          </span>
        ) : (
          <span className="font-semibold text-green-600 dark:text-green-400">Free</span>
        )}
        {svc.estimatedDuration && (
          <span className="text-slate-400 flex items-center gap-1">⏱ {svc.estimatedDuration}</span>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function Services() {
  const [services, setServices]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(data.services)).finally(() => setLoading(false));
  }, []);

  const filtered = activeTab === 'all' ? services : services.filter(s => s.category === activeTab);

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff] dark:bg-[#070d1a]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 text-white text-center">
        <div className="absolute inset-0 bg-hero-gradient" />
        <NetworkBackground nodeCount={40} opacity={0.7} />
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <div className="relative max-w-3xl mx-auto animate-fade-in-up">
          <span className="cyber-tag mb-5 inline-flex border-white/20 text-white/80">⚙ Services Catalogue</span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            Our{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              IT Services
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-xl mx-auto leading-relaxed">
            Standard and premium computing services. Prices in Tanzanian Shillings (TZS).
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #f0f4ff)' }} />
        <div className="dark:block hidden absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #070d1a)' }} />
      </section>

      {/* Content */}
      <section className="flex-1 py-16 px-4">
        <div className="max-w-6xl mx-auto">

          {/* Filter tabs */}
          <div className="flex justify-center gap-2 mb-12 flex-wrap">
            {['all', 'standard', 'premium'].map((tab) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-6 py-2.5 rounded-full text-sm font-semibold capitalize transition-all duration-200 ${
                  activeTab === tab
                    ? 'bg-blue-600 text-white shadow-cyber-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-blue-100 dark:border-slate-700 hover:border-blue-400'
                }`}>
                {tab === 'all' ? 'All Services' : `${tab.charAt(0).toUpperCase() + tab.slice(1)} Services`}
              </button>
            ))}
          </div>

          {loading ? <LoadingSpinner text="Loading services..." /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filtered.map((svc, i) => (
                <ServiceCard key={svc.id} svc={svc} index={i} />
              ))}
            </div>
          )}

          <div className="text-center mt-14">
            <p className="text-slate-500 dark:text-slate-400 mb-4">Ready to request a service?</p>
            <Link to="/register" className="btn-primary px-10 py-3 text-base">
              Get Started Free →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
