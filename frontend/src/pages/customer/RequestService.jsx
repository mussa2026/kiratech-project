import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '../../components/LoadingSpinner';
import { PhotoIcon, XMarkIcon, CheckCircleIcon, MapPinIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

// ─── Service-specific sub-types ────────────────────────────────────────────────
const SERVICE_SUBTYPES = {
  'Mobile Phone Repair': {
    label: 'Phone Brand & Model',
    placeholder: 'e.g. Samsung Galaxy A54',
    options: [
      '── Samsung ──', 'Samsung Galaxy S24 / S23 / S22', 'Samsung Galaxy A54 / A34 / A14',
      'Samsung Galaxy Note 20 / Note 10', 'Samsung Galaxy Z Fold / Z Flip',
      '── iPhone ──', 'iPhone 17 / 17 Air / 17 Pro Max','iPhone 16 / 16 Pro / 16 Pro Max',
      'iPhone 15 / 15 Pro / 15 Pro Max', 'iPhone 14 / 14 Pro / 14 pus / 14 Pro Max', 'iPhone 13 / 13 Pro / 13 Pro Max',
      'iPhone 12 / 12 Pro / 12 Pro Max', 'iPhone 11 / 11 Pro / 11 Pro Max', 'iPhone X / XS && XS MAX / XR',
      'iPhone 8 / 7 / 6',
      '── Tecno ──', 'Tecno Spark 20 / Spark 10', 'Tecno Camon 20 / Camon 19', 'Tecno Phantom X2',
      '── Infinix ──', 'Infinix Hot 40 / Hot 30', 'Infinix Note 30 / Note 12', 'Infinix Zero 30',
      '── Xiaomi ──', 'Xiaomi Redmi Note 13 / 12', 'Xiaomi 13 / 12', 'POCO X6 / X5', 'Redmi A3 / A2',
      '── Other ──', 'Itel A70 / A60', 'Huawei / Honor', 'Oppo / Realme', 'Vivo Y / V Series',
      'OnePlus', 'Nokia', 'Motorola', 'Other (specify in description)',
    ],
  },
  'Computer Maintenance & Troubleshooting': {
    label: 'Computer Type & Brand',
    placeholder: 'e.g. Dell Inspiron 15',
    options: [
      '── Laptop ──', 'Dell (Inspiron / XPS / Latitude)', 'HP (Pavilion / EliteBook / Envy)',
      'Lenovo (IdeaPad / ThinkPad)', 'Asus (VivoBook / ZenBook / ROG)',
      'Acer (Aspire / Swift / Nitro)', 'Apple MacBook Air / MacBook Pro',
      'Toshiba / Samsung / MSI', 'Other Laptop',
      '── Desktop ──', 'Windows Desktop PC', 'Apple iMac', 'Gaming PC / Custom Build',
      'All-in-One Desktop', 'Workstation / Server',
    ],
  },
  'Printer Repair & Services': {
    label: 'Printer Brand & Type',
    placeholder: 'e.g. HP LaserJet Pro M402',
    options: [
      'HP InkJet (DeskJet / OfficeJet)', 'HP LaserJet (Pro / Enterprise)',
      'Canon PIXMA (InkJet)', 'Canon imageRUNNER (LaserJet)',
      'Epson EcoTank / L-Series', 'Epson WorkForce',
      'Brother DCP / MFC', 'Samsung / Xerox / Kyocera',
      'Thermal Printer (receipt)', 'Dot Matrix Printer', 'Other',
    ],
  },
  'Network Installation & WiFi Setup': {
    label: 'Network Equipment',
    placeholder: 'e.g. TP-Link Archer AX73',
    options: [
      'TP-Link Router / Extender', 'Huawei 4G/5G Router', 'ZTE 4G Router',
      'Mikrotik Router / Switch', 'Ubiquiti UniFi', 'Cisco Router / Switch',
      'Netgear / D-Link', 'New Office LAN Installation', 'Home WiFi Setup',
      'Fibre/ADSL Connection Setup', 'Other',
    ],
  },
  'Hardware Upgrade Services': {
    label: 'Device to Upgrade',
    placeholder: 'e.g. Dell Inspiron 15 — RAM upgrade',
    options: [
      'Laptop — RAM Upgrade', 'Laptop — SSD/HDD Upgrade',
      'Laptop — Screen Replacement', 'Laptop — Keyboard Replacement',
      'Laptop — Battery Replacement', 'Desktop — RAM Upgrade',
      'Desktop — GPU Installation', 'Desktop — CPU Upgrade',
      'Desktop — SSD/HDD Upgrade', 'Desktop — PSU Replacement', 'Other',
    ],
  },
  'Data Recovery & Cloud Services': {
    label: 'Device / Storage Type',
    placeholder: 'e.g. Seagate 1TB External HDD',
    options: [
      'Laptop HDD / SSD', 'External Hard Drive', 'USB Flash Drive',
      'SD / MicroSD Card', 'Phone Internal Storage', 'RAID Array',
      'Cloud Backup Setup', 'Cloud Sync (Google Drive / OneDrive)', 'Other',
    ],
  },
  'Software Installation & Updates': {
    label: 'Software Needed',
    placeholder: 'e.g. Windows 11 + Microsoft Office 365',
    options: [
      'Windows 10 / 11 Installation', 'Microsoft Office (2019 / 365)',
      'Adobe Photoshop / Illustrator', 'Adobe Premiere / After Effects',
      'AutoCAD / SketchUp', 'Kaspersky / ESET Antivirus',
      'Avast / Avira / Bitdefender', 'macOS Setup',
      'Ubuntu / Kali Linux', 'Driver Updates & Optimization', 'Other',
    ],
  },
};

// ─── Service-specific common issues ────────────────────────────────────────────
const COMMON_ISSUES = {
  'Mobile Phone Repair': [
    '📱 Screen cracked / broken', '🔋 Battery drains fast / won\'t charge',
    '🔌 Charging port not working', '📷 Camera not working',
    '🔊 Speaker / microphone broken', '💧 Water damage',
    '📵 Phone not turning on', '🔄 Software / system crash',
    '🔒 Phone locked / forgot password', '📂 Data recovery needed',
  ],
  'Computer Maintenance & Troubleshooting': [
    '🐌 Computer running very slow', '🔵 Blue screen / BSOD error',
    '🦠 Virus / malware infection', '🔇 No sound',
    '📶 WiFi / internet not connecting', '🌀 Computer keeps restarting',
    '⚫ Black screen / won\'t boot', '🔥 Overheating / fan noise',
    '💾 Hard drive errors', '⌨️ Keyboard / touchpad issue',
  ],
  'Printer Repair & Services': [
    '🚫 Printer not printing', '📄 Paper jam', '🌫️ Faded / blurry print',
    '📡 Not connecting to WiFi', '🔴 Error light / code',
    '🖨️ Need driver installation', '🔌 Not recognized by computer',
    '🟡 Low ink / cartridge issue',
  ],
  'Network Installation & WiFi Setup': [
    '📶 WiFi signal weak / drops', '🌐 Internet very slow',
    '🆕 New router setup needed', '🏢 Office network installation',
    '🔐 Network security setup', '📡 WiFi extender installation',
    '🔄 Router not connecting', '💻 Can\'t connect devices',
  ],
  'Hardware Upgrade Services': [
    '🐌 Computer slow — need RAM upgrade', '💾 Need SSD (faster storage)',
    '🖥️ Laptop screen broken', '⌨️ Keyboard not working',
    '🔋 Laptop battery dead', '🎮 Need GPU for gaming/design',
    '🔌 Need more storage space', '🔧 Other hardware issue',
  ],
  'Data Recovery & Cloud Services': [
    '🗑️ Accidentally deleted files', '💥 Hard drive crashed',
    '🔒 Files encrypted by ransomware', '💧 Water damaged device',
    '📂 Formatted by mistake', '☁️ Need cloud backup setup',
    '🔄 Need file sync across devices', '📱 Lost phone data',
  ],
  'Software Installation & Updates': [
    '🖥️ Need fresh Windows install', '📦 Need Office / productivity apps',
    '🔄 Windows keeps updating badly', '🦠 Virus removed — need reinstall',
    '🔧 Need drivers updated', '🍎 macOS setup / issues',
    '🐧 Linux installation needed', '🔐 Need antivirus installed',
  ],
};

// ─── Location Picker component ────────────────────────────────────────────────
function LocationPicker({ value, onChange, onCoords }) {
  const [detecting, setDetecting]   = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSug, setShowSug]       = useState(false);
  const [coords, setCoords]         = useState(null);
  const debounceRef = useRef(null);
  const wrapperRef  = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setShowSug(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Detect GPS location and reverse-geocode via OpenStreetMap Nominatim ─────
  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setCoords({ lat, lng });
        onCoords?.({ lat, lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          );
          const data = await res.json();
          if (data?.display_name) {
            // Build a short, readable address
            const a = data.address || {};
            const parts = [
              a.road || a.pedestrian || a.neighbourhood,
              a.suburb || a.quarter,
              a.city || a.town || a.village || a.county,
              a.state,
              a.country,
            ].filter(Boolean);
            const address = parts.length >= 2 ? parts.join(', ') : data.display_name;
            onChange(address);
            toast.success('📍 Location detected!');
          } else {
            onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
            toast.success('📍 GPS coordinates captured');
          }
        } catch {
          onChange(`${lat.toFixed(5)}, ${lng.toFixed(5)}`);
          toast.success('📍 GPS coordinates captured');
        }
        setDetecting(false);
      },
      (err) => {
        setDetecting(false);
        const msgs = {
          1: 'Location access denied. Please allow location in your browser settings.',
          2: 'Location unavailable. Please type your address manually.',
          3: 'Location request timed out. Please try again.',
        };
        toast.error(msgs[err.code] || 'Could not detect location');
      },
      { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true }
    );
  };

  // ── Address autocomplete via Nominatim search ─────────────────────────────
  const handleInputChange = (e) => {
    const val = e.target.value;
    onChange(val);
    clearTimeout(debounceRef.current);
    if (val.length < 3) { setSuggestions([]); setShowSug(false); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(val)}&format=json&limit=5&addressdetails=1&countrycodes=tz,ke,ug,rw,tz`,
          { headers: { 'Accept-Language': 'en' } }
        );
        const data = await res.json();
        setSuggestions(data);
        setShowSug(data.length > 0);
      } catch { /* silent fail */ }
    }, 400);
  };

  const selectSuggestion = (item) => {
    const a = item.address || {};
    const parts = [
      a.road || a.pedestrian || a.neighbourhood,
      a.suburb || a.quarter,
      a.city || a.town || a.village || a.county,
      a.state,
      a.country,
    ].filter(Boolean);
    const address = parts.length >= 2 ? parts.join(', ') : item.display_name;
    onChange(address);
    setCoords({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    onCoords?.({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
    setSuggestions([]);
    setShowSug(false);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <label className="label flex items-center gap-1.5">
        <MapPinIcon className="h-4 w-4 text-blue-500" />
        Location / Address
        <span className="text-slate-400 font-normal">(where is the device?)</span>
      </label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            className="input pr-10"
            placeholder="Type address or click 📍 to auto-detect…"
            value={value}
            onChange={handleInputChange}
            onFocus={() => suggestions.length > 0 && setShowSug(true)}
            autoComplete="off"
          />
          {value && (
            <button type="button" onClick={() => { onChange(''); setSuggestions([]); setShowSug(false); setCoords(null); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-400 transition-colors">
              <XMarkIcon className="h-4 w-4" />
            </button>
          )}
          {/* Autocomplete dropdown */}
          {showSug && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-600 rounded-xl shadow-xl overflow-hidden">
              {suggestions.map((item, i) => {
                const a = item.address || {};
                const main = a.road || a.pedestrian || a.neighbourhood || a.suburb || item.name || '';
                const sub  = [a.city || a.town || a.village, a.state, a.country].filter(Boolean).join(', ');
                return (
                  <button key={i} type="button" onMouseDown={() => selectSuggestion(item)}
                    className="w-full text-left px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700 transition-colors border-b border-blue-50 dark:border-slate-700 last:border-0">
                    <div className="flex items-start gap-2">
                      <MapPinIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{main || 'Location'}</p>
                        <p className="text-xs text-slate-400 truncate">{sub}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
              <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-700/50 text-center">
                <span className="text-xs text-slate-400">Powered by OpenStreetMap</span>
              </div>
            </div>
          )}
        </div>
        {/* GPS detect button */}
        <button
          type="button"
          onClick={detectLocation}
          disabled={detecting}
          title="Detect my current location"
          className="flex-shrink-0 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl transition-all flex items-center gap-2 text-sm font-semibold shadow-cyber-sm active:scale-95"
        >
          {detecting
            ? <ArrowPathIcon className="h-4 w-4 animate-spin" />
            : <MapPinIcon className="h-4 w-4" />
          }
          {detecting ? 'Detecting…' : 'Detect'}
        </button>
      </div>
      {/* GPS coordinates badge */}
      {coords && (
        <div className="mt-1.5 flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg px-2 py-0.5">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
          </span>
          <a
            href={`https://www.google.com/maps?q=${coords.lat},${coords.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-500 hover:text-blue-400 underline"
          >
            View on Google Maps ↗
          </a>
        </div>
      )}
      <p className="text-xs text-slate-400 mt-1">
        💡 Click <strong>Detect</strong> for GPS auto-fill, or type and pick from suggestions
      </p>
    </div>
  );
}

// ─── Photo upload component ────────────────────────────────────────────────────
function PhotoUpload({ photos, onAdd, onRemove }) {
  const inputRef = useRef();

  const handleFiles = (e) => {
    const files = Array.from(e.target.files);
    const valid = files.filter(f => f.type.startsWith('image/') && f.size <= 5 * 1024 * 1024);
    if (valid.length !== files.length) toast.error('Images only, max 5MB each');
    valid.forEach(f => {
      const reader = new FileReader();
      reader.onload = (ev) => onAdd({ file: f, preview: ev.target.result, name: f.name });
      reader.readAsDataURL(f);
    });
    e.target.value = '';
  };

  return (
    <div>
      <label className="label">📸 Upload Photos <span className="text-slate-400 font-normal">(optional — helps technician understand the issue)</span></label>
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={e => e.preventDefault()}
        onDrop={e => { e.preventDefault(); const dt = e.dataTransfer; handleFiles({ target: dt, files: dt.files }); }}
        className="border-2 border-dashed border-blue-200 dark:border-slate-600 rounded-xl p-5 text-center cursor-pointer
                   hover:border-blue-400 hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-all">
        <PhotoIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Click to upload or drag & drop</p>
        <p className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP — max 5MB each · up to 5 photos</p>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mt-3">
          {photos.map((p, i) => (
            <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-blue-100 dark:border-slate-600">
              <img src={p.preview} alt={p.name} className="w-full h-full object-cover" />
              <button type="button" onClick={() => onRemove(i)}
                className="absolute top-1 right-1 h-5 w-5 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <XMarkIcon className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function RequestService() {
  const [services, setServices]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [submitting, setSubmitting]     = useState(false);
  const [selectedService, setSvc]       = useState(null);
  const [selectedSubType, setSubType]   = useState('');
  const [selectedIssues, setIssues]     = useState([]);
  const [photos, setPhotos]             = useState([]);
  const [form, setForm] = useState({
    serviceId:'', title:'', description:'', priority:'medium', location:'', preferredDate:'', preferredTime:'',
  });
  const [locationCoords, setLocationCoords] = useState(null);
  const navigate = useNavigate();

  const standardServices = services.filter(s => s.category === 'standard');
  const premiumServices  = services.filter(s => s.category === 'premium');

  useEffect(() => {
    api.get('/services').then(({ data }) => setServices(data.services)).finally(() => setLoading(false));
  }, []);

  const handleServiceSelect = (svc) => {
    setSvc(svc);
    setSubType('');
    setIssues([]);
    setForm(f => ({ ...f, serviceId: svc.id, title: '', description: '' }));
  };

  const toggleIssue = (issue) => {
    setIssues(prev => prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]);
  };

  // Auto-build title & description from selections
  const buildDescription = () => {
    let parts = [];
    if (selectedSubType && !selectedSubType.startsWith('──')) parts.push(`Device: ${selectedSubType}`);
    if (selectedIssues.length) parts.push(`Issues:\n${selectedIssues.map(i => `• ${i.replace(/^[^\s]+\s/, '')}`).join('\n')}`);
    if (form.description) parts.push(`Additional details:\n${form.description}`);
    return parts.join('\n\n');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.serviceId) { toast.error('Please select a service'); return; }
    if (!selectedSubType && SERVICE_SUBTYPES[selectedService?.name]) { toast.error('Please select the device/type'); return; }
    setSubmitting(true);
    try {
      const autoTitle = selectedSubType && !selectedSubType.startsWith('──')
        ? `${selectedService.name} — ${selectedSubType}`
        : form.title || selectedService.name;

      const fullDesc = buildDescription() || form.description;

      const payload = {
        ...form,
        title: form.title || autoTitle,
        description: fullDesc,
        attachments: photos.map(p => p.preview), // base64 previews
        ...(locationCoords && { locationLat: locationCoords.lat, locationLng: locationCoords.lng }),
      };

      const { data } = await api.post('/user/requests', payload);
      toast.success(`Request submitted! Ticket: ${data.request.ticketNumber}`);
      navigate('/dashboard/my-requests');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit request');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LoadingSpinner text="Loading services..." />;

  const subTypeConfig  = selectedService ? SERVICE_SUBTYPES[selectedService.name]  : null;
  const commonIssues   = selectedService ? COMMON_ISSUES[selectedService.name]      : null;

  return (
    <div className="max-w-3xl space-y-6 animate-fade-in-up">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Request a Service</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">Select the service, choose your device/type, and describe the problem.</p>
      </div>

      {/* Step 1 — Select service */}
      <div className="card-cyber p-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
          <span className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">1</span>
          Select a Service
        </h2>
        {standardServices.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Standard Services</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {standardServices.map(svc => (
                <button key={svc.id} type="button" onClick={() => handleServiceSelect(svc)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    selectedService?.id === svc.id
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 shadow-cyber-sm'
                      : 'border-blue-100 dark:border-slate-600 hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-slate-700/50'
                  }`}>
                  <p className="font-semibold text-gray-900 dark:text-white">{svc.name}</p>
                  {svc.basePrice > 0 && <p className="text-xs text-slate-400 mt-0.5">From TZS {Number(svc.basePrice).toLocaleString()}</p>}
                </button>
              ))}
            </div>
          </div>
        )}
        {premiumServices.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-500 mb-3">⭐ Premium Services</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {premiumServices.map(svc => (
                <button key={svc.id} type="button" onClick={() => handleServiceSelect(svc)}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    selectedService?.id === svc.id
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                      : 'border-amber-200 dark:border-amber-800/40 hover:border-amber-400'
                  }`}>
                  <p className="font-semibold text-gray-900 dark:text-white">{svc.name}</p>
                  {svc.basePrice > 0 && <p className="text-xs text-amber-500 mt-0.5">From TZS {Number(svc.basePrice).toLocaleString()} — Premium</p>}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Step 2 — Sub-type selector (appears when service has sub-types) */}
      {selectedService && subTypeConfig && (
        <div className="card-cyber p-6 animate-fade-in-down">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">2</span>
            {subTypeConfig.label}
          </h2>
          <select
            className="input"
            value={selectedSubType}
            onChange={e => setSubType(e.target.value)}
          >
            <option value="">— Select {subTypeConfig.label} —</option>
            {(() => {
              const elements = [];
              let currentGroup = null;
              let groupItems = [];

              subTypeConfig.options.forEach((opt, i) => {
                if (opt.startsWith('──')) {
                  // push previous group if any
                  if (currentGroup !== null) {
                    elements.push(
                      <optgroup key={`g-${currentGroup}`} label={currentGroup}>
                        {groupItems.map(item => <option key={item} value={item}>{item}</option>)}
                      </optgroup>
                    );
                  }
                  currentGroup = opt.replace(/──\s?/g, '').trim();
                  groupItems = [];
                } else {
                  groupItems.push(opt);
                }
              });
              // push last group
              if (currentGroup !== null) {
                elements.push(
                  <optgroup key={`g-${currentGroup}`} label={currentGroup}>
                    {groupItems.map(item => <option key={item} value={item}>{item}</option>)}
                  </optgroup>
                );
              } else {
                // no groups — flat list
                groupItems.forEach(item => elements.push(<option key={item} value={item}>{item}</option>));
              }
              return elements;
            })()}
          </select>
          {/* Manual fallback */}
          <div className="mt-3">
            <label className="label">Not in the list? Type manually</label>
            <input type="text" className="input" placeholder={subTypeConfig.placeholder}
              value={subTypeConfig.options.includes(selectedSubType) ? '' : selectedSubType}
              onChange={e => setSubType(e.target.value)} />
          </div>
        </div>
      )}

      {/* Step 3 — Common issues checkboxes */}
      {selectedService && commonIssues && (selectedSubType || !subTypeConfig) && (
        <div className="card-cyber p-6 animate-fade-in-down">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {subTypeConfig ? '3' : '2'}
            </span>
            Select the Issue(s) <span className="text-slate-400 font-normal text-sm">(tick all that apply)</span>
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {commonIssues.map(issue => (
              <label key={issue}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                  selectedIssues.includes(issue)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30 shadow-cyber-sm'
                    : 'border-blue-100 dark:border-slate-600 hover:border-blue-300 hover:bg-blue-50/30 dark:hover:bg-slate-700/30'
                }`}>
                <input type="checkbox" className="h-4 w-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500 flex-shrink-0"
                  checked={selectedIssues.includes(issue)} onChange={() => toggleIssue(issue)} />
                <span className="text-sm text-gray-800 dark:text-gray-200">{issue}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 4 — Full form */}
      {selectedService && (selectedSubType || !subTypeConfig) && (
        <form onSubmit={handleSubmit} className="card-cyber p-6 space-y-5 animate-fade-in-down">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
              {subTypeConfig ? '4' : commonIssues ? '3' : '2'}
            </span>
            Describe Your Issue
          </h2>

          {/* Summary chip */}
          <div className="flex flex-wrap gap-2">
            <span className="cyber-tag">⚙ {selectedService.name}</span>
            {selectedSubType && !selectedSubType.startsWith('──') && (
              <span className="cyber-tag">📱 {selectedSubType}</span>
            )}
            {selectedIssues.length > 0 && (
              <span className="cyber-tag">✓ {selectedIssues.length} issue{selectedIssues.length > 1 ? 's' : ''} selected</span>
            )}
          </div>

          <div>
            <label className="label">Issue Title <span className="text-slate-400 font-normal">(auto-generated, can edit)</span></label>
            <input type="text" className="input"
              placeholder={selectedSubType ? `${selectedService.name} — ${selectedSubType}` : 'Brief description of the problem'}
              value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
          </div>

          <div>
            <label className="label">Additional Details <span className="text-slate-400 font-normal">(optional — the selections above already describe your issue)</span></label>
            <textarea className="input" rows={4}
              placeholder="Any extra details, when it started, what happened before the issue…"
              value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
          </div>

          {/* Photo upload */}
          <PhotoUpload
            photos={photos}
            onAdd={p => photos.length < 5 ? setPhotos(prev => [...prev, p]) : toast.error('Maximum 5 photos')}
            onRemove={i => setPhotos(prev => prev.filter((_,idx) => idx !== i))}
          />

          <div>
            <label className="label">Priority</label>
            <select className="input" value={form.priority} onChange={e => setForm({...form, priority:e.target.value})}>
              <option value="low">🟢 Low</option>
              <option value="medium">🔵 Medium</option>
              <option value="high">🟠 High</option>
              <option value="urgent">🔴 Urgent</option>
            </select>
          </div>

          <LocationPicker
            value={form.location}
            onChange={val => setForm(f => ({ ...f, location: val }))}
            onCoords={c => setLocationCoords(c)}
          />          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Preferred Date</label>
              <input type="date" className="input" min={new Date().toISOString().split('T')[0]}
                value={form.preferredDate} onChange={e => setForm({...form, preferredDate:e.target.value})} />
            </div>
            <div>
              <label className="label">Preferred Time</label>
              <input type="time" className="input" value={form.preferredTime} onChange={e => setForm({...form, preferredTime:e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn-primary w-full py-3.5 text-base" disabled={submitting}>
            {submitting
              ? <span className="flex items-center justify-center gap-2"><span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Submitting…</span>
              : '📤 Submit Service Request'}
          </button>
        </form>
      )}
    </div>
  );
}
