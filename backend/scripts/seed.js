require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize, User, Service, Technician } = require('../models');

const services = [
  // ── Standard Services ────────────────────────────────────────────────────────
  {
    name: 'Computer Maintenance & Troubleshooting',
    description: 'Full computer diagnosis, cleaning, performance optimization and repair. Covers: Windows PC, Mac, Linux, Gaming PCs, Workstations, All-in-One desktops. Includes virus removal, slow PC fix, blue screen repair, boot failure, fan cleaning, thermal paste replacement.',
    category: 'standard', icon: 'computer', basePrice: 25000, estimatedDuration: '1-3 hours', sortOrder: 1,
  },
  {
    name: 'Printer Repair & Services',
    description: 'Printer repair, installation, driver setup, cartridge replacement, paper jam fix, connectivity issues. Supports: HP, Canon, Epson, Brother, Samsung, Xerox, Kyocera — InkJet, LaserJet, Thermal, Dot Matrix, Wireless & Network printers.',
    category: 'standard', icon: 'printer', basePrice: 20000, estimatedDuration: '1-2 hours', sortOrder: 2,
  },
  {
    name: 'Mobile Phone Repair',
    description: 'Screen replacement, battery swap, charging port repair, software flashing, virus removal, data recovery. Covers: Samsung (Galaxy S/A/Note/Z), iPhone (all models 6–15 Pro Max), Xiaomi/Redmi, Tecno (Spark/Camon/Phantom), Infinix (Hot/Note/Zero), Itel, Huawei, Oppo, Vivo, OnePlus, Nokia, Motorola — Android & iOS.',
    category: 'standard', icon: 'phone', basePrice: 15000, estimatedDuration: '1-4 hours', sortOrder: 3,
  },
  {
    name: 'Network Installation & WiFi Setup',
    description: 'Home and office network setup, router config, WiFi extenders, LAN cabling, network security. Brands: TP-Link, Huawei, ZTE, Netgear, D-Link, Cisco, Mikrotik, Ubiquiti. Fibre, ADSL, LTE/4G/5G router setup.',
    category: 'standard', icon: 'wifi', basePrice: 40000, estimatedDuration: '2-4 hours', sortOrder: 4,
  },
  {
    name: 'Data Recovery & Cloud Services',
    description: 'Recovery of lost, deleted or corrupted files from HDD, SSD, USB drives, SD cards, phones. Cloud setup: Google Drive, OneDrive, Dropbox, iCloud, Mega. Supports NTFS, FAT32, exFAT, ext4 file systems.',
    category: 'standard', icon: 'cloud', basePrice: 50000, estimatedDuration: '2-8 hours', sortOrder: 5,
  },
  {
    name: 'Software Installation & Updates',
    description: 'Windows 10/11, Microsoft Office (2016/2019/365), Adobe Suite, AutoCAD, antivirus (Kaspersky, ESET, Avast, Bitdefender), driver updates, system optimization. Also: macOS, Ubuntu, Kali Linux installation and setup.',
    category: 'standard', icon: 'download', basePrice: 18000, estimatedDuration: '1-2 hours', sortOrder: 6,
  },
  {
    name: 'Hardware Upgrade Services',
    description: 'RAM upgrade (DDR3/DDR4/DDR5), HDD to SSD migration (SATA/NVMe M.2), GPU installation, CPU upgrade, PSU replacement. Laptop: keyboard, screen, battery replacement. All laptop brands: Dell, HP, Lenovo, Asus, Acer, Toshiba, Apple, MSI.',
    category: 'standard', icon: 'cpu', basePrice: 30000, estimatedDuration: '1-3 hours', sortOrder: 7,
  },
  // ── Premium Services ──────────────────────────────────────────────────────────
  {
    name: 'Remote Desktop Support',
    description: 'Remote support via AnyDesk, TeamViewer, RustDesk. Covers: Windows, Mac, Linux. Resolves: software issues, Office problems, email setup, printer config, network issues — all done remotely without needing a technician visit.',
    category: 'premium', icon: 'monitor', basePrice: 12000, estimatedDuration: '30 min - 2 hours', sortOrder: 8,
  },
  {
    name: 'On-Call Priority Support',
    description: 'Dedicated on-call technician on standby for urgent IT emergencies. 30-minute guaranteed response. SLA-backed service for businesses, hospitals, schools, and individuals who cannot afford downtime.',
    category: 'premium', icon: 'headphones', basePrice: 75000, estimatedDuration: 'As needed', sortOrder: 9,
  },
  {
    name: 'Live Service Tracking',
    description: 'Real-time live tracking of your service — see when your technician is en route, when work starts, and get live progress updates. Included with all on-site service requests at no extra charge.',
    category: 'premium', icon: 'map', basePrice: 0, estimatedDuration: 'During service', sortOrder: 10,
  },
  {
    name: 'Cloud Backup & Synchronization',
    description: 'Automated backup setup for Google Drive, OneDrive, AWS S3, Dropbox, Backblaze. Multi-device sync, scheduled backups, disaster recovery planning. For individuals and businesses with critical data.',
    category: 'premium', icon: 'sync', basePrice: 60000, estimatedDuration: '2-6 hours', sortOrder: 11,
  },
  {
    name: 'Web Hosting & Domain Services',
    description: 'Domain registration (.co.tz, .com, .org, .net, .tz), shared/VPS hosting setup, SSL certificates, WordPress/cPanel/Plesk installation, business email hosting, website deployment and ongoing maintenance.',
    category: 'premium', icon: 'globe', basePrice: 100000, estimatedDuration: '1-3 days', sortOrder: 12,
  },
];

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync({ force: false });
    console.log('✅ Tables synced');

    // Seed services
    let seededServices = 0;
    for (const svc of services) {
      const [, created] = await Service.findOrCreate({ where: { name: svc.name }, defaults: svc });
      if (created) seededServices++;
    }
    console.log(`✅ Seeded ${seededServices} new services (${services.length - seededServices} already existed)`);

    // Create default admin
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@kiratech.com';
    const [admin, adminCreated] = await User.findOrCreate({
      where: { email: adminEmail },
      defaults: {
        name: process.env.ADMIN_NAME || 'System Administrator',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'Admin@123456',
        role: 'admin',
        isVerified: true,
        isActive: true,
      },
    });

    if (adminCreated) {
      console.log(`✅ Admin account created: ${adminEmail}`);
    } else {
      console.log(`ℹ️  Admin account already exists: ${adminEmail}`);
    }

    console.log('\n🎉 Database seeded successfully!');
    console.log('─'.repeat(40));
    console.log(`Admin Email:    ${adminEmail}`);
    console.log(`Admin Password: ${process.env.ADMIN_PASSWORD || 'Admin@123456'}`);
    console.log('─'.repeat(40));

    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
