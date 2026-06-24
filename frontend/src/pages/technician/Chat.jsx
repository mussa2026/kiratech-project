import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import {
  PaperAirplaneIcon, ArrowLeftIcon, ClipboardDocumentListIcon,
  ShareIcon, XMarkIcon, MagnifyingGlassIcon,
} from '@heroicons/react/24/outline';

// ── Availability badge ────────────────────────────────────────────────────────
function AvailBadge({ status }) {
  const map = {
    available: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
    busy:      'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400',
    offline:   'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400',
  };
  const dot = { available: 'bg-green-500', busy: 'bg-amber-500', offline: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || map.offline}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot[status] || dot.offline}`} />
      {status}
    </span>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ name, size = 'md' }) {
  const s = size === 'sm' ? 'h-8 w-8 text-xs' : 'h-10 w-10 text-sm';
  return (
    <div className={`${s} rounded-full bg-blue-600 flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {name?.[0]?.toUpperCase() || '?'}
    </div>
  );
}

// ── Share Task Modal ──────────────────────────────────────────────────────────
function ShareTaskModal({ onShare, onClose }) {
  const [tasks, setTasks]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote]       = useState('');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/technician/tasks?limit=30').then(({ data }) => {
      setTasks(data.data || []);
    }).catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, []);

  const activeTasks = tasks.filter(t => !['completed','cancelled','rejected'].includes(t.status));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShareIcon className="h-5 w-5 text-blue-500" /> Share a Task
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-red-400 transition-colors">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <p className="text-center text-slate-400 py-4">Loading tasks…</p>
          ) : activeTasks.length === 0 ? (
            <p className="text-center text-slate-400 py-4">No active tasks to share</p>
          ) : activeTasks.map(t => (
            <button key={t.id} type="button" onClick={() => setSelected(t)}
              className={`w-full text-left px-3 py-3 rounded-xl border transition-all ${
                selected?.id === t.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                  : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'
              }`}>
              <p className="font-semibold text-gray-800 dark:text-white text-sm">
                #{t.ticketNumber} — {t.service?.name || 'Service'}
              </p>
              <p className="text-xs text-slate-400 mt-0.5 truncate">{t.title}</p>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${
                t.status === 'in_progress' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
              }`}>{t.status.replace('_', ' ')}</span>
            </button>
          ))}
        </div>
        {selected && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <p className="text-sm font-medium text-gray-700 dark:text-slate-300">
              Sharing: <span className="text-blue-600">#{selected.ticketNumber}</span>
            </p>
            <textarea
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-600 text-sm text-gray-800 dark:text-white resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              placeholder="Add a note (optional)…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
            <button
              onClick={() => { onShare(selected, note); onClose(); }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all text-sm"
            >
              📤 Send Task
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Chat Component ───────────────────────────────────────────────────────
export default function TechnicianChat() {
  const { user } = useAuthStore();
  const [technicians, setTechnicians]     = useState([]);
  const [selected, setSelected]           = useState(null);   // selected technician object
  const [messages, setMessages]           = useState([]);
  const [myTechId, setMyTechId]           = useState(null);
  const [input, setInput]                 = useState('');
  const [sending, setSending]             = useState(false);
  const [loadingTechs, setLoadingTechs]   = useState(true);
  const [loadingMsgs, setLoadingMsgs]     = useState(false);
  const [showShare, setShowShare]         = useState(false);
  const [search, setSearch]               = useState('');
  const [mobileView, setMobileView]       = useState('list'); // 'list' | 'chat'
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);
  const pollRef    = useRef(null);

  // ── Load technician list ───────────────────────────────────────────────────
  const loadTechnicians = useCallback(async () => {
    try {
      const { data } = await api.get('/technician/chat/technicians');
      setTechnicians(data.technicians || []);
    } catch { /* silent */ }
    finally { setLoadingTechs(false); }
  }, []);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  // ── Load conversation ──────────────────────────────────────────────────────
  const loadMessages = useCallback(async (techId, silent = false) => {
    if (!techId) return;
    if (!silent) setLoadingMsgs(true);
    try {
      const { data } = await api.get(`/technician/chat/messages/${techId}`);
      setMessages(data.messages || []);
      setMyTechId(data.myTechnicianId);
      // Refresh unread counts in sidebar
      setTechnicians(prev => prev.map(t =>
        t.id === techId ? { ...t, unreadCount: 0 } : t
      ));
    } catch { /* silent */ }
    finally { if (!silent) setLoadingMsgs(false); }
  }, []);

  // ── Select technician ──────────────────────────────────────────────────────
  const selectTech = (tech) => {
    setSelected(tech);
    setMobileView('chat');
    loadMessages(tech.id);
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => loadMessages(tech.id, true), 8000);
  };

  useEffect(() => {
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Auto-scroll ────────────────────────────────────────────────────────────
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const { data } = await api.post('/technician/chat/messages', {
        receiverId: selected.id,
        message: text,
      });
      setMessages(prev => [...prev, data.message]);
      inputRef.current?.focus();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send');
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  // ── Share task ─────────────────────────────────────────────────────────────
  const handleShare = async (task, note) => {
    if (!selected) return;
    try {
      const { data } = await api.post(`/technician/chat/tasks/${task.id}/share`, {
        targetTechnicianId: selected.id,
        message: note || undefined,
      });
      setMessages(prev => [...prev, data.chatMessage]);
      toast.success(`Task ${task.ticketNumber} shared!`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to share task');
    }
  };

  const filtered = technicians.filter(t =>
    t.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const totalUnread = technicians.reduce((s, t) => s + (t.unreadCount || 0), 0);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-[calc(100vh-120px)] flex rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 shadow-xl bg-white dark:bg-slate-900 animate-fade-in-up">

      {/* ── LEFT: Technician list ─────────────────────────────────────── */}
      <div className={`w-full lg:w-80 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-700
        ${mobileView === 'chat' ? 'hidden lg:flex' : 'flex'}`}>

        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              💬 Team Chat
              {totalUnread > 0 && (
                <span className="h-5 px-1.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {totalUnread}
                </span>
              )}
            </h2>
          </div>
          <div className="relative">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              className="w-full pl-9 pr-3 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 dark:text-white placeholder-slate-400"
              placeholder="Search technicians…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
          {loadingTechs ? (
            <div className="flex items-center justify-center py-12">
              <span className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 px-4">
              <p className="text-slate-400 text-sm">No other technicians found</p>
            </div>
          ) : filtered.map(tech => (
            <button key={tech.id} onClick={() => selectTech(tech)}
              className={`w-full text-left px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                selected?.id === tech.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''
              }`}>
              <div className="flex items-start gap-3">
                <div className="relative">
                  <Avatar name={tech.user?.name} />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-900 ${
                    tech.availability === 'available' ? 'bg-green-500' :
                    tech.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-gray-900 dark:text-white truncate">{tech.user?.name}</p>
                    {tech.unreadCount > 0 && (
                      <span className="h-5 min-w-5 px-1.5 bg-blue-600 text-white text-xs rounded-full flex items-center justify-center font-bold flex-shrink-0">
                        {tech.unreadCount}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate mt-0.5">{tech.specialization || 'IT Technician'}</p>
                  <div className="mt-1"><AvailBadge status={tech.availability} /></div>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── RIGHT: Chat panel ─────────────────────────────────────────── */}
      <div className={`flex-1 flex flex-col min-w-0 ${mobileView === 'list' ? 'hidden lg:flex' : 'flex'}`}>

        {!selected ? (
          /* Empty state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
              <span className="text-4xl">💬</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Team Chat</h3>
            <p className="text-slate-400 text-sm max-w-xs">
              Select a technician from the list to start a conversation, share tasks, or collaborate.
            </p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                {/* Mobile back button */}
                <button onClick={() => { setMobileView('list'); clearInterval(pollRef.current); }}
                  className="lg:hidden p-1.5 rounded-lg text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>
                <div className="relative flex-shrink-0">
                  <Avatar name={selected.user?.name} />
                  <span className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-slate-800 ${
                    selected.availability === 'available' ? 'bg-green-500' :
                    selected.availability === 'busy' ? 'bg-amber-500' : 'bg-slate-400'
                  }`} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white truncate">{selected.user?.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <AvailBadge status={selected.availability} />
                    {selected.specialization && (
                      <span className="text-xs text-slate-400 truncate">{selected.specialization}</span>
                    )}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowShare(true)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-sm"
              >
                <ShareIcon className="h-4 w-4" />
                <span className="hidden sm:inline">Share Task</span>
              </button>
            </div>

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-slate-50 dark:bg-slate-950">
              {loadingMsgs ? (
                <div className="flex justify-center py-8">
                  <span className="h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-400 text-sm">No messages yet. Say hello! 👋</p>
                </div>
              ) : messages.map((msg) => {
                const isMine = msg.senderId === myTechId;
                return (
                  <div key={msg.id} className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
                    {!isMine && <Avatar name={msg.sender?.user?.name} size="sm" />}
                    <div className={`max-w-[72%] space-y-1 ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
                      {/* Task chip */}
                      {msg.requestId && (
                        <Link
                          to={`/technician/tasks/${msg.requestId}`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-100 transition-colors"
                        >
                          <ClipboardDocumentListIcon className="h-3.5 w-3.5" />
                          Task #{msg.ticketNumber || msg.requestId?.slice(-6)}
                        </Link>
                      )}
                      {/* Bubble */}
                      <div className={`px-4 py-2.5 text-sm leading-relaxed ${
                        isMine
                          ? 'bg-blue-600 text-white rounded-2xl rounded-br-sm'
                          : 'bg-white dark:bg-slate-700 text-gray-800 dark:text-white border border-slate-200 dark:border-slate-600 rounded-2xl rounded-bl-sm'
                      }`}>
                        {msg.message}
                      </div>
                      <span className="text-xs text-slate-400 px-1">
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={sendMessage} className="flex items-end gap-2 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <textarea
                ref={inputRef}
                rows={1}
                className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-2xl text-sm text-gray-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none max-h-32"
                placeholder={`Message ${selected.user?.name}…`}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="h-10 w-10 flex-shrink-0 flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-full transition-all active:scale-95 disabled:opacity-50"
              >
                {sending
                  ? <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  : <PaperAirplaneIcon className="h-4 w-4" />
                }
              </button>
            </form>
          </>
        )}
      </div>

      {/* Share Task Modal */}
      {showShare && (
        <ShareTaskModal
          onShare={handleShare}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
}
