import { Link } from 'react-router-dom';
import KiratechLogo from './KiratechLogo';

export default function Footer() {
  return (
    <footer className="relative bg-[#07101f] dark:bg-[#04080f] text-slate-400 overflow-hidden">
      {/* Subtle cyber grid */}
      <div className="absolute inset-0 bg-cyber-grid opacity-20 pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">

          {/* Brand */}
          <div className="md:col-span-2">
            <KiratechLogo size={32} className="mb-4" />
            <p className="text-sm leading-relaxed text-slate-500 max-w-xs">
              Professional IT support and computing services. We fix computers, networks,
              phones, and everything in between — so you can focus on what matters.
            </p>
            {/* Social / contact pills */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { label: '📧 Email', href: 'mailto:robertcharles088@gmail.com' },
                { label: '💬 WhatsApp', href: 'https://wa.me/255714759884' },
              ].map(({ label, href }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer"
                   className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium
                              bg-blue-900/30 text-blue-300 border border-blue-800/50
                              hover:bg-blue-800/40 hover:text-blue-200 transition-colors">
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Quick Links</h4>
            <ul className="space-y-2.5 text-sm">
              {[['Home', '/'], ['About', '/about'], ['Services', '/services'], ['Contact', '/contact']].map(([label, href]) => (
                <li key={href}>
                  <Link to={href}
                    className="flex items-center gap-1.5 hover:text-blue-400 transition-colors">
                    <span className="text-blue-600 text-xs">›</span>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wide uppercase">Contact</h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <a href="mailto:robertcharles088@gmail.com"
                   className="hover:text-blue-400 transition-colors">
                  📧 robertcharles088@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+255714759884" className="hover:text-blue-400 transition-colors">
                  📞 +255 714 759 884
                </a>
              </li>
              <li>
                <a href="https://wa.me/255714759884" target="_blank" rel="noopener noreferrer"
                   className="hover:text-blue-400 transition-colors">
                  💬 WhatsApp: +255 714 759 884
                </a>
              </li>
              <li>📍 Njiro Road, Arusha, Tanzania</li>
              <li>🕒 Mon–Sat: 8am – 6pm</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} KIRATECH IT Support. All rights reserved.</p>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>All systems operational</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
