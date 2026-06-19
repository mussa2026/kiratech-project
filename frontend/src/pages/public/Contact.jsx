import { useState } from 'react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import NetworkBackground from '../../components/NetworkBackground';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const contactInfo = [
  { icon: '📧', label: 'Email',          value: 'robertcharles088@gmail.com', href: 'mailto:robertcharles088@gmail.com' },
  { icon: '📞', label: 'Phone',          value: '+255 714 759 884',           href: 'tel:+255714759884' },
  { icon: '💬', label: 'WhatsApp',       value: '+255 714 759 884',           href: 'https://wa.me/255714759884', external: true },
  { icon: '📍', label: 'Address',        value: 'Njiro Road, Arusha, Tanzania' },
  { icon: '🕒', label: 'Business Hours', value: 'Mon – Sat: 8:00am – 6:00pm' },
];

export default function Contact() {
  const [form, setForm]     = useState({ name: '', email: '', subject: '', message: '' });
  const [sending, setSend]  = useState(false);
  const [sent, setSent]     = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSend(true);
    try {
      await api.post('/contact', form);
      setSent(true);
      setForm({ name: '', email: '', subject: '', message: '' });
      toast.success('Message sent! We\'ll reply within 24 hours.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send. Please try WhatsApp or email directly.');
    } finally {
      setSend(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f0f4ff] dark:bg-[#070d1a]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4 text-white text-center">
        <div className="absolute inset-0 bg-hero-gradient" />
        <NetworkBackground nodeCount={35} opacity={0.7} />
        <div className="absolute inset-0 bg-cyber-grid opacity-20" />
        <div className="relative max-w-3xl mx-auto animate-fade-in-up">
          <span className="cyber-tag mb-5 inline-flex border-white/20 text-white/80">📬 Get In Touch</span>
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            Contact{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
              Us
            </span>
          </h1>
          <p className="text-xl text-slate-300 max-w-xl mx-auto leading-relaxed">
            Have a question or need IT help? Reach out and we'll respond promptly.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #f0f4ff)' }} />
        <div className="dark:block hidden absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
             style={{ background: 'linear-gradient(to bottom, transparent, #070d1a)' }} />
      </section>

      {/* Contact grid */}
      <section className="flex-1 py-16 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10">

          {/* Contact info cards */}
          <div className="space-y-4 animate-fade-in-up">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Contact Information</h2>
            {contactInfo.map(({ icon, label, value, href, external }) => (
              <div key={label}
                className="card-cyber p-5 flex items-center gap-4 hover:shadow-cyber transition-all duration-200">
                <div className="h-12 w-12 rounded-xl bg-blue-600 flex items-center justify-center text-xl flex-shrink-0 shadow-cyber-sm">
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-0.5">{label}</p>
                  {href ? (
                    <a href={href} {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                       className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate block">
                      {value}
                    </a>
                  ) : (
                    <p className="text-sm font-semibold text-gray-800 dark:text-slate-200 truncate">{value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Message form */}
          <div className="animate-fade-in-up delay-150">
            {sent ? (
              <div className="card-cyber p-10 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                    <CheckCircleIcon className="h-10 w-10 text-green-500" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Message Sent!</h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  We received your message and will reply to your email within 24 hours.
                  You should also receive an auto-reply confirmation.
                </p>
                <button onClick={() => setSent(false)} className="btn-secondary text-sm">
                  Send Another Message
                </button>
              </div>
            ) : (
              <div className="card-cyber p-7">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Send a Message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Your Name</label>
                      <input className="input" placeholder="John Doe"
                        value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div>
                      <label className="label">Your Email</label>
                      <input type="email" className="input" placeholder="john@example.com"
                        value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                  </div>
                  <div>
                    <label className="label">Subject</label>
                    <input className="input" placeholder="What is this about?"
                      value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Message</label>
                    <textarea className="input" rows={5}
                      placeholder="Describe your question or issue in detail..."
                      value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required />
                  </div>
                  <button type="submit" className="btn-primary w-full py-3 text-base" disabled={sending}>
                    {sending ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending…
                      </span>
                    ) : '📤 Send Message'}
                  </button>
                </form>
                <p className="text-xs text-center text-slate-400 mt-3">
                  Message goes directly to <strong>robertcharles088@gmail.com</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
