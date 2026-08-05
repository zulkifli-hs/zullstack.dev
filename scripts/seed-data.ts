/**
 * Real content, transcribed from Zulkifli's CV (Jul 2026) and client portfolio deck.
 *
 * Nothing here is invented. Where the two source documents disagree, the CV is
 * treated as authoritative and the conflict is marked with a CONFLICT comment
 * so it can be resolved rather than silently buried.
 *
 * Collections with no source material — testimonials, articles, open source —
 * are intentionally empty. Fabricating a testimonial or a contribution would be
 * worse than an empty section.
 */

const now = () => new Date();

export const siteConfig = {
  key: "site",
  name: "Zulkifli",
  tagline: { en: "Your Software Lab Partner", id: "Partner Lab Software Anda" },
  bio: {
    en: "Senior software engineer with 6+ years building and shipping production systems for Indonesian government ministries, enterprises and startups — web, mobile and backend. I work across React, Next.js and Node.js, with Go, React Native and cloud infrastructure alongside. I've owned products end to end, from architecture through deployment, and shipped AI-integrated features into live workflows. For most of that time I've also been teaching: instructing full-stack cohorts at Hacktiv8, then leading curriculum and the instructor team.",
    id: "Senior software engineer dengan pengalaman 6+ tahun membangun dan merilis sistem production untuk kementerian, perusahaan, dan startup di Indonesia — web, mobile, dan backend. Saya bekerja dengan React, Next.js, dan Node.js, ditambah Go, React Native, dan infrastruktur cloud. Saya memegang produk dari hulu ke hilir, mulai arsitektur sampai deployment, termasuk merilis fitur berbasis AI ke alur kerja yang benar-benar dipakai. Sepanjang waktu itu saya juga mengajar: membimbing kelas full-stack di Hacktiv8, lalu memimpin kurikulum dan tim instruktur.",
  },
  // CONFLICT: CV lists itsmezulkifli@gmail.com; the portfolio deck lists
  // zullstack@gmail.com. Using the CV address — confirm which is public-facing.
  email: "itsmezulkifli@gmail.com",
  location: "Jakarta, Indonesia",
  socials: [
    { platform: "github", url: "https://github.com/", handle: "" },
    { platform: "linkedin", url: "https://linkedin.com/in/", handle: "" },
  ],
  // Only figures supported by the CV. "Engineers mentored" is deliberately
  // absent: the CV says "cohorts of 30+ students per batch" but never a total,
  // and a headline number should not be extrapolated.
  stats: [
    { key: "years", value: 6, suffix: "+" },
    { key: "projects", value: 13, suffix: "" },
    { key: "stack", value: 40, suffix: "+" },
  ],
};

export const experience = [
  {
    company: "Technoverse",
    companyUrl: "https://technoverse.ltd",
    position: { en: "Senior Software Engineer", id: "Senior Software Engineer" },
    employmentType: "full-time",
    location: "Jakarta, Indonesia",
    locationType: "onsite",
    startDate: new Date("2025-02-01"),
    endDate: null,
    current: true,
    highlights: {
      en: [
        "Lead architecture and development of full-stack web and mobile solutions for clients across multiple industries, at the software house and digital solutions arm of PT. Teknologi Kemajuan Bangsa.",
        "Delivered AI-powered features using LLM APIs (OpenAI, Claude) into client product workflows, reducing manual operational overhead and improving user experience.",
        "Set and enforce technical standards across the team — code reviews, testing practices, and system design — within a microservices architecture.",
      ],
      id: [
        "Memimpin arsitektur dan pengembangan solusi web dan mobile full-stack untuk klien lintas industri, di software house dan lini solusi digital PT. Teknologi Kemajuan Bangsa.",
        "Merilis fitur berbasis AI menggunakan LLM API (OpenAI, Claude) ke dalam alur kerja produk klien, mengurangi beban operasional manual dan meningkatkan pengalaman pengguna.",
        "Menetapkan dan menegakkan standar teknis di seluruh tim — code review, praktik testing, dan desain sistem — dalam arsitektur microservices.",
      ],
    },
    techStack: ["Next.js", "Node.js", "TypeScript", "Golang", "MongoDB", "Docker", "OpenAI API"],
    order: 1,
    status: "published",
  },
  {
    company: "Technoverse",
    companyUrl: "https://technoverse.ltd",
    position: { en: "Senior Frontend Developer", id: "Senior Frontend Developer" },
    employmentType: "full-time",
    location: "Jakarta, Indonesia",
    locationType: "onsite",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2025-02-01"),
    current: false,
    highlights: {
      en: [
        "Led frontend development across multiple client projects, delivering cross-platform products built with React.js, Next.js, and React Native.",
        "Built shared component libraries and design systems using Tailwind CSS, cutting UI development time by approximately 30% across projects.",
        "Worked closely with clients and product stakeholders to scope, prioritize, and ship features within Agile sprint cycles.",
      ],
      id: [
        "Memimpin pengembangan frontend di sejumlah proyek klien, merilis produk lintas platform dengan React.js, Next.js, dan React Native.",
        "Membangun component library dan design system bersama menggunakan Tailwind CSS, memangkas waktu pengembangan UI sekitar 30% di berbagai proyek.",
        "Bekerja erat dengan klien dan stakeholder produk untuk merumuskan lingkup, menentukan prioritas, dan merilis fitur dalam siklus sprint Agile.",
      ],
    },
    techStack: ["React.js", "Next.js", "React Native", "Tailwind CSS", "TypeScript", "Redux"],
    order: 2,
    status: "published",
  },
  {
    company: "Hacktiv8",
    position: {
      en: "Lead of Program Development & Special Projects",
      id: "Lead of Program Development & Special Projects",
    },
    employmentType: "full-time",
    location: "Jakarta, Indonesia",
    locationType: "onsite",
    startDate: new Date("2024-01-01"),
    endDate: new Date("2025-08-01"),
    current: false,
    highlights: {
      en: [
        "Oversaw program development and curriculum strategy across four specialized tracks: Backend Golang, Generative AI, UI/UX Design, and Performance Marketing — aligning each program with current industry hiring standards.",
        "Managed cross-functional special projects with external partners — overseeing timelines, stakeholder communication, and end-to-end technical delivery.",
        "Led and mentored a team of instructors through code reviews, teaching quality standards, and cohort performance benchmarks.",
      ],
      id: [
        "Mengawasi pengembangan program dan strategi kurikulum untuk empat jalur khusus: Backend Golang, Generative AI, UI/UX Design, dan Performance Marketing — menyelaraskan tiap program dengan standar rekrutmen industri terkini.",
        "Mengelola proyek khusus lintas fungsi bersama mitra eksternal — mengawasi timeline, komunikasi stakeholder, dan pengiriman teknis dari hulu ke hilir.",
        "Memimpin dan membimbing tim instruktur melalui code review, standar kualitas pengajaran, dan tolok ukur performa tiap angkatan.",
      ],
    },
    techStack: ["Golang", "Generative AI", "Curriculum Design", "Agile"],
    order: 3,
    status: "published",
  },
  {
    company: "Hacktiv8",
    position: {
      en: "Lead Full-Stack JavaScript Instructor",
      id: "Lead Instruktur Full-Stack JavaScript",
    },
    employmentType: "full-time",
    location: "Jakarta, Indonesia",
    locationType: "onsite",
    startDate: new Date("2023-01-01"),
    endDate: new Date("2024-01-01"),
    current: false,
    highlights: {
      en: [
        "Delivered full-stack JavaScript instruction to cohorts of 30+ students per batch, covering React.js, Node.js, Express, PostgreSQL, and production deployment workflows.",
        "Designed project-based modules simulating real-world Agile engineering environments, contributing to improved student job placement outcomes.",
        "Provided 1-on-1 technical mentoring, code reviews, and career coaching for students entering the software engineering job market.",
      ],
      id: [
        "Mengajar full-stack JavaScript untuk angkatan berisi 30+ siswa per batch, mencakup React.js, Node.js, Express, PostgreSQL, dan alur deployment production.",
        "Merancang modul berbasis proyek yang menyimulasikan lingkungan engineering Agile nyata, berkontribusi pada peningkatan hasil penempatan kerja siswa.",
        "Memberikan mentoring teknis 1-on-1, code review, dan bimbingan karier bagi siswa yang memasuki pasar kerja software engineering.",
      ],
    },
    techStack: ["React.js", "Node.js", "Express.js", "PostgreSQL", "JavaScript"],
    order: 4,
    status: "published",
  },
  {
    company: "Hacktiv8",
    position: {
      en: "Full-Stack JavaScript Instructor",
      id: "Instruktur Full-Stack JavaScript",
    },
    employmentType: "full-time",
    location: "Jakarta, Indonesia",
    locationType: "onsite",
    startDate: new Date("2020-10-01"),
    endDate: new Date("2023-01-01"),
    current: false,
    highlights: {
      en: [
        "Taught frontend (React.js), backend (Node.js/Express), and database (PostgreSQL, MongoDB) fundamentals to beginner and intermediate-level students.",
        "Developed and maintained course materials, hands-on coding exercises, and assessment rubrics aligned with industry hiring expectations.",
      ],
      id: [
        "Mengajar dasar frontend (React.js), backend (Node.js/Express), dan database (PostgreSQL, MongoDB) untuk siswa tingkat pemula dan menengah.",
        "Menyusun dan merawat materi kursus, latihan coding praktik, serta rubrik penilaian yang selaras dengan ekspektasi rekrutmen industri.",
      ],
    },
    techStack: ["React.js", "Node.js", "Express.js", "PostgreSQL", "MongoDB"],
    order: 5,
    status: "published",
  },
  {
    company: "Warnas",
    position: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    employmentType: "full-time",
    location: "Jakarta, Indonesia",
    locationType: "onsite",
    startDate: new Date("2020-08-01"),
    endDate: new Date("2023-01-01"),
    current: false,
    highlights: {
      en: [
        "Built Warnas end-to-end — a social commerce platform connecting local food vendors and small businesses with customers, featuring a food review and recommendation feed, business mentorship programs, a frozen food marketplace, and in-app payment transactions.",
        "Owned the entire product stack: React.js CMS, Next.js landing page, React Native mobile app (iOS & Android), and Node.js/GraphQL backend — delivered in a 2-person engineering team.",
        "Handled deployment and infrastructure on AWS (EC2, S3) and VPS using Docker, Nginx, and CI/CD pipelines.",
      ],
      id: [
        "Membangun Warnas dari hulu ke hilir — platform social commerce yang menghubungkan pedagang makanan lokal dan UMKM dengan pelanggan, dengan feed ulasan dan rekomendasi makanan, program mentorship usaha, marketplace frozen food, dan transaksi pembayaran dalam aplikasi.",
        "Memegang keseluruhan stack produk: CMS React.js, landing page Next.js, aplikasi mobile React Native (iOS & Android), dan backend Node.js/GraphQL — dikerjakan dalam tim engineering 2 orang.",
        "Menangani deployment dan infrastruktur di AWS (EC2, S3) dan VPS menggunakan Docker, Nginx, dan pipeline CI/CD.",
      ],
    },
    techStack: ["React.js", "Next.js", "React Native", "Node.js", "GraphQL", "MongoDB", "AWS", "Docker"],
    order: 6,
    status: "published",
  },
];

export const projects = [
  {
    slug: "saman-anti-fraud-monitoring",
    title: {
      en: "SAMAN — Anti-Fraud Monitoring System",
      id: "SAMAN — Sistem Monitoring Anti-Fraud",
    },
    summary: {
      en: "The first anti-fraud monitoring system among ministerial inspectorates in Indonesia, officially launched by the Minister of Culture.",
      id: "Sistem monitoring anti-fraud pertama di antara inspektorat kementerian di Indonesia, diresmikan langsung oleh Menteri Kebudayaan.",
    },
    description: {
      en: "Led project delivery and contributed to frontend development of SAMAN, built for the Inspectorate General of the Ministry of Culture. Key features include real-time fraud alert notifications via Server-Sent Events; AI-powered document analysis that automatically reads and flags uploaded files for suspicious patterns; facial recognition for identity verification; and a violation scoring engine that calculates risk scores per individual or transaction. The platform enables risk-based internal auditing and data-driven governance across the ministry's programs and budget cycles.",
      id: "Memimpin pengiriman proyek dan turut mengembangkan frontend SAMAN, dibangun untuk Inspektorat Jenderal Kementerian Kebudayaan. Fitur utamanya mencakup notifikasi peringatan fraud real-time melalui Server-Sent Events; analisis dokumen berbasis AI yang otomatis membaca dan menandai berkas dengan pola mencurigakan; pengenalan wajah untuk verifikasi identitas; dan mesin penilaian pelanggaran yang menghitung skor risiko per individu atau transaksi. Platform ini memungkinkan audit internal berbasis risiko dan tata kelola berbasis data di seluruh program dan siklus anggaran kementerian.",
    },
    category: "web",
    techStack: ["Next.js", "Express.js", "REST API", "Server-Sent Events", "AI Document Analysis", "Face Recognition"],
    role: { en: "Project Manager & Frontend Lead", id: "Project Manager & Frontend Lead" },
    liveUrl: "https://saman.kemenbud.go.id",
    featured: true,
    year: 2025,
    order: 1,
    status: "published",
  },
  {
    slug: "hipmigo",
    title: { en: "HipmiGO — Super App for HIPMI", id: "HipmiGO — Super App untuk HIPMI" },
    summary: {
      en: "The official super app for Indonesia's Young Entrepreneurs Association, with 10,000+ downloads across iOS and Android.",
      id: "Super app resmi Himpunan Pengusaha Muda Indonesia, dengan 10.000+ unduhan di iOS dan Android.",
    },
    description: {
      en: "Developed the official super app for HIPMI, a national organization representing young business owners across Indonesia. The admin dashboard was built with React.js and Redux for advanced state management, supporting complex data flows across member management, event coordination, and content moderation. The mobile app features digital membership cards with QR verification, a real-time curated news feed, member registration and dues payment, national event management, and career resources.",
      id: "Mengembangkan super app resmi HIPMI, organisasi nasional yang mewakili pengusaha muda di seluruh Indonesia. Dashboard admin dibangun dengan React.js dan Redux untuk state management tingkat lanjut, menopang alur data kompleks pada manajemen anggota, koordinasi acara, dan moderasi konten. Aplikasi mobile-nya memiliki kartu anggota digital dengan verifikasi QR, feed berita kurasi real-time, pendaftaran anggota dan pembayaran iuran, manajemen acara nasional, serta sumber daya karier.",
    },
    category: "mobile",
    techStack: ["React.js", "Redux", "React Native", "Next.js", "Express.js", "MongoDB", "Firebase Cloud Messaging"],
    role: { en: "Frontend & Mobile Developer", id: "Frontend & Mobile Developer" },
    liveUrl: "https://hipmigo.co.id",
    featured: true,
    year: 2024,
    order: 2,
    status: "published",
  },
  {
    slug: "culminaite",
    title: { en: "Culminaite — AI-Powered Career Platform", id: "Culminaite — Platform Karier Berbasis AI" },
    summary: {
      en: "A career services platform for the Malaysian job market, built and operated solo, serving 100+ customers since launch.",
      id: "Platform layanan karier untuk pasar kerja Malaysia, dibangun dan dioperasikan sendiri, melayani 100+ pelanggan sejak diluncurkan.",
    },
    description: {
      en: "Built and currently operating a career services platform targeting the Malaysian job market. The platform is owned by a Malaysia-based client and built for Malaysian users, with payment processing in Ringgit Malaysia via SenangPay (powered by DOKU). Features include AI-assisted CV analysis and ATS scoring, intelligent resume feedback powered by LLM APIs, and job matching. Architected the complete full-stack system including LLM integration, production-grade payment workflows with MYR currency handling, and user authentication.",
      id: "Membangun dan hingga kini mengoperasikan platform layanan karier yang menyasar pasar kerja Malaysia. Platform ini dimiliki klien yang berbasis di Malaysia dan dibuat untuk pengguna Malaysia, dengan pemrosesan pembayaran dalam Ringgit Malaysia via SenangPay (didukung DOKU). Fiturnya mencakup analisis CV dan penilaian ATS berbantuan AI, masukan resume cerdas bertenaga LLM API, serta pencocokan pekerjaan. Merancang keseluruhan sistem full-stack termasuk integrasi LLM, alur pembayaran siap production dengan penanganan mata uang MYR, dan autentikasi pengguna.",
    },
    category: "web",
    techStack: ["Next.js", "Express.js", "Node.js", "MongoDB", "OpenAI API", "Claude API", "SenangPay (DOKU)"],
    role: { en: "Full-Stack Developer (solo)", id: "Full-Stack Developer (solo)" },
    liveUrl: "https://culminaite.com",
    featured: true,
    year: 2025,
    order: 3,
    status: "published",
  },
  {
    slug: "idbuild",
    title: {
      en: "IDBuild — Interior Design Project Management",
      id: "IDBuild — Manajemen Proyek Desain Interior",
    },
    summary: {
      en: "A SaaS platform for interior design firms to run commercial office projects end to end, built solo.",
      id: "Platform SaaS bagi firma desain interior untuk menjalankan proyek kantor komersial dari hulu ke hilir, dibangun sendiri.",
    },
    description: {
      en: "Built a centralized SaaS platform for interior design firms to manage commercial office projects end-to-end, consolidating cross-team collaboration into a single platform. The system is designed for multiple roles within a firm — Project Managers, Designers, Finance, Sales, and Admin — each with tailored views and permissions. Core features include a Bill of Quantities builder with auto-calculation and product catalog, an interactive Gantt chart for timeline and milestone tracking, invoice and payment term management, CAD/3D asset storage, and AI-powered cost estimation and material recommendations.",
      id: "Membangun platform SaaS terpusat bagi firma desain interior untuk mengelola proyek kantor komersial dari hulu ke hilir, menyatukan kolaborasi lintas tim dalam satu platform. Sistem ini dirancang untuk beragam peran dalam firma — Project Manager, Desainer, Finance, Sales, dan Admin — masing-masing dengan tampilan dan izin tersendiri. Fitur utamanya mencakup pembangun Bill of Quantities dengan perhitungan otomatis dan katalog produk, Gantt chart interaktif untuk pelacakan timeline dan milestone, manajemen invoice dan termin pembayaran, penyimpanan aset CAD/3D, serta estimasi biaya dan rekomendasi material berbasis AI.",
    },
    category: "web",
    techStack: ["Next.js", "Express.js", "Node.js", "MongoDB", "OpenAI API", "Tailwind CSS"],
    role: { en: "Full-Stack Developer (solo)", id: "Full-Stack Developer (solo)" },
    liveUrl: "https://idbuildapp.com",
    featured: true,
    year: 2025,
    order: 4,
    status: "published",
  },
  {
    slug: "satu-matrix",
    title: {
      en: "Satu Matrix — Origin-Destination Analytics",
      id: "Satu Matrix — Analitik Origin-Destination",
    },
    summary: {
      en: "Big-data commuter analytics for Greater Jakarta, integrating TransJakarta, MRT, LRT, KCI and Damri.",
      id: "Analitik big data pergerakan komuter Jabodetabek, mengintegrasikan TransJakarta, MRT, LRT, KCI, dan Damri.",
    },
    description: {
      en: "Built a web-based Origin-Destination analytics platform for the Greater Jakarta Transportation Management Agency (BPTJ), integrating commuter data from multiple public transit operators across the metro region. Delivered advanced visualizations including flow maps of thousands of simultaneous passenger movements between origin-destination pairs, anomaly detection for unusual movement patterns, peak-hour heatmaps by time and location, and per-mode breakdowns across transit types. The platform serves as a decision support system enabling government planners to make evidence-based decisions on transit network expansion.",
      id: "Membangun platform analitik Origin-Destination berbasis web untuk Badan Pengelola Transportasi Jabodetabek (BPTJ), mengintegrasikan data komuter dari sejumlah operator transportasi publik di wilayah metropolitan. Menghadirkan visualisasi tingkat lanjut berupa flow map ribuan pergerakan penumpang simultan antar pasangan asal-tujuan, deteksi anomali untuk pola pergerakan tak biasa, heatmap jam sibuk berdasarkan waktu dan lokasi, serta rincian per moda transportasi. Platform ini berfungsi sebagai sistem pendukung keputusan yang memungkinkan perencana pemerintah mengambil keputusan berbasis bukti untuk perluasan jaringan transit.",
    },
    category: "web",
    techStack: ["React.js", "Express.js", "Node.js", "MongoDB", "Leaflet.js", "D3.js", "Machine Learning"],
    role: { en: "Frontend Developer", id: "Frontend Developer" },
    featured: false,
    year: 2022,
    order: 5,
    status: "published",
  },
  {
    slug: "ritj-dashboard",
    title: {
      en: "RITJ — Greater Jakarta Transport Master Plan Dashboard",
      id: "RITJ — Dashboard Rencana Induk Transportasi Jabodetabek",
    },
    summary: {
      en: "A monitoring dashboard consolidating progress, KPIs and budget absorption across Jakarta and its satellite cities.",
      id: "Dashboard monitoring yang menyatukan progres, KPI, dan serapan anggaran di Jakarta dan kota-kota penyangganya.",
    },
    description: {
      en: "Developed a centralized master plan monitoring dashboard for the Greater Jakarta Transportation Management Agency (BPTJ), under the Ministry of Transportation — tracking the Jabodetabek Integrated Transportation Master Plan across multiple government stakeholders spanning Jakarta, Bogor, Depok, Tangerang and Bekasi. The platform consolidates progress data, KPI achievement, and budget absorption from numerous agencies and local governments into a single unified view with interactive maps, milestone tracking, and real-time reporting.",
      id: "Mengembangkan dashboard monitoring rencana induk terpusat untuk Badan Pengelola Transportasi Jabodetabek (BPTJ) di bawah Kementerian Perhubungan — memantau Rencana Induk Transportasi Jabodetabek lintas pemangku kepentingan pemerintah di Jakarta, Bogor, Depok, Tangerang, dan Bekasi. Platform ini menyatukan data progres, capaian KPI, dan serapan anggaran dari banyak instansi dan pemerintah daerah ke dalam satu tampilan terpadu dengan peta interaktif, pelacakan milestone, dan pelaporan real-time.",
    },
    category: "web",
    techStack: ["React.js", "Express.js", "Node.js", "PostgreSQL", "REST API", "Interactive Mapping"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    featured: false,
    // CONFLICT: CV dates this 2020; the portfolio deck dates it 2021 (4 months).
    year: 2021,
    order: 6,
    status: "published",
  },
  {
    slug: "wikiexport",
    title: { en: "WikiExport — Indonesia–Japan Trade Platform", id: "WikiExport — Platform Dagang Indonesia–Jepang" },
    summary: {
      en: "A bilingual Indonesian–Japanese trade platform for KADIN, supporting product showcasing, auctions and cross-border trade.",
      id: "Platform dagang dwibahasa Indonesia–Jepang untuk KADIN, mendukung etalase produk, lelang, dan perdagangan lintas negara.",
    },
    description: {
      en: "Developed WikiExport for the Indonesian Chamber of Commerce and Industry (KADIN), a bilingual web platform that facilitates product showcasing, online sales, auctions, and international trade collaboration — particularly with Japanese partners. The platform enables businesses to list and sell products, participate in real-time auctions, and engage in cross-border trade initiatives, with intuitive navigation and seamless language switching.",
      id: "Mengembangkan WikiExport untuk Kamar Dagang dan Industri Indonesia (KADIN), platform web dwibahasa yang memfasilitasi etalase produk, penjualan online, lelang, dan kolaborasi dagang internasional — khususnya dengan mitra Jepang. Platform ini memungkinkan pelaku usaha memasang dan menjual produk, mengikuti lelang real-time, serta terlibat dalam inisiatif dagang lintas negara, dengan navigasi intuitif dan pergantian bahasa yang mulus.",
    },
    category: "web",
    techStack: ["React.js", "Next.js", "Express.js", "Node.js", "React Native", "MongoDB", "REST API"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    liveUrl: "https://wikiexport.jp",
    featured: false,
    year: 2022,
    order: 7,
    status: "published",
  },
  {
    slug: "e-persuratan-ditprasarana",
    title: {
      en: "e-Persuratan DitPrasarana — Ministry of Transportation",
      id: "e-Persuratan DitPrasarana — Kementerian Perhubungan",
    },
    summary: {
      en: "Digital correspondence and disposition management for the Directorate General of Infrastructure.",
      id: "Manajemen persuratan dan disposisi digital untuk Direktorat Jenderal Prasarana.",
    },
    description: {
      en: "Developed a comprehensive digital platform for managing incoming and outgoing letters, dispositions, and tracking for the Directorate General of Infrastructure, Ministry of Transportation. The system digitizes the entire correspondence workflow, incorporating secure digital signatures, automated notifications, centralized archiving, and real-time tracking to improve accountability and transparency across the full lifecycle of correspondence from creation to resolution.",
      id: "Mengembangkan platform digital menyeluruh untuk mengelola surat masuk dan keluar, disposisi, dan pelacakannya bagi Direktorat Jenderal Prasarana, Kementerian Perhubungan. Sistem ini mendigitalkan seluruh alur persuratan, mencakup tanda tangan digital yang aman, notifikasi otomatis, pengarsipan terpusat, dan pelacakan real-time untuk meningkatkan akuntabilitas dan transparansi sepanjang siklus surat dari pembuatan hingga penyelesaian.",
    },
    category: "web",
    techStack: ["React.js", "Express.js", "Node.js", "React Native", "MongoDB", "REST API"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    featured: false,
    year: 2021,
    order: 8,
    status: "published",
  },
  {
    slug: "adigsi",
    title: {
      en: "ADIGSI — Digitalization & Cybersecurity Association",
      id: "ADIGSI — Asosiasi Digitalisasi dan Keamanan Siber",
    },
    summary: {
      en: "The official platform for Indonesia's Digitalization and Cybersecurity Association — CMS, membership and knowledge hub.",
      id: "Platform resmi Asosiasi Digitalisasi dan Keamanan Siber Indonesia — CMS, keanggotaan, dan knowledge hub.",
    },
    description: {
      en: "Built and currently operating the official digital platform for ADIGSI, supporting the organization's public presence, member engagement, and digital ecosystem initiatives. Architected and developed the complete full-stack platform including a content management system for news, events and a knowledge hub, membership registration and management workflows, a role-based administration dashboard, an authentication system, and a responsive public website.",
      id: "Membangun dan hingga kini mengoperasikan platform digital resmi ADIGSI, menopang kehadiran publik organisasi, keterlibatan anggota, dan inisiatif ekosistem digitalnya. Merancang dan mengembangkan platform full-stack lengkap termasuk sistem manajemen konten untuk berita, acara, dan knowledge hub, alur pendaftaran dan pengelolaan keanggotaan, dashboard administrasi berbasis peran, sistem autentikasi, serta situs publik yang responsif.",
    },
    category: "web",
    techStack: ["Next.js", "MongoDB", "Radix UI", "Zod", "Tailwind CSS"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    liveUrl: "https://adigsi.id",
    featured: false,
    year: 2026,
    order: 9,
    status: "published",
  },
  {
    slug: "pawship-grooming",
    title: { en: "Pawship — Pet Grooming Operations Platform", id: "Pawship — Platform Operasional Grooming Hewan" },
    summary: {
      en: "A booking and operations platform for a pet grooming business — scheduling, pet profiles and an admin dashboard.",
      id: "Platform pemesanan dan operasional untuk usaha grooming hewan — penjadwalan, profil hewan, dan dashboard admin.",
    },
    description: {
      en: "Built a pet grooming booking and operations platform designed to streamline customer reservations and day-to-day service management. Developed the full-stack application including online appointment scheduling, customer and pet profile management, grooming history, service and pricing management, booking status tracking, and an administrative dashboard for operational workflows.",
      id: "Membangun platform pemesanan dan operasional grooming hewan untuk merapikan reservasi pelanggan dan pengelolaan layanan sehari-hari. Mengembangkan aplikasi full-stack mencakup penjadwalan janji temu online, manajemen profil pelanggan dan hewan, riwayat grooming, manajemen layanan dan harga, pelacakan status pemesanan, serta dashboard administratif untuk alur kerja operasional.",
    },
    category: "web",
    techStack: ["Next.js", "Nest.js", "TypeScript", "MongoDB", "Tailwind CSS", "Radix UI", "Zod"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    featured: false,
    year: 2026,
    order: 10,
    status: "published",
  },
  {
    slug: "it-care-inspection",
    title: { en: "IT Care — Digital Inspection Platform", id: "IT Care — Platform Inspeksi Digital" },
    summary: {
      en: "A mobile-first inspection platform for a major Indonesian port operator, replacing paper-based quality control.",
      id: "Platform inspeksi mobile-first untuk operator pelabuhan besar di Indonesia, menggantikan kendali mutu berbasis kertas.",
    },
    description: {
      en: "Built a mobile-first digital inspection platform for Krakatau Bandar Samudera, replacing paper-based quality control and asset inspection processes. Field inspectors capture photos, notes, and signatures directly on mobile devices with real-time sync to a centralized database, supported by customizable inspection templates, automated reporting, and an audit trail for compliance.",
      id: "Membangun platform inspeksi digital mobile-first untuk Krakatau Bandar Samudera, menggantikan proses kendali mutu dan inspeksi aset berbasis kertas. Inspektur lapangan merekam foto, catatan, dan tanda tangan langsung dari perangkat mobile dengan sinkronisasi real-time ke basis data terpusat, ditopang template inspeksi yang dapat disesuaikan, pelaporan otomatis, dan jejak audit untuk kepatuhan.",
    },
    category: "mobile",
    // CONFLICT: CV lists React.js / Node.js / Firebase and dates this 2023.
    // The portfolio deck lists Laravel / Vue.js / Flutter / PostgreSQL and dates
    // it 2024. Using the CV stack — confirm which project version is being shown.
    techStack: ["React.js", "Node.js", "Firebase"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    featured: false,
    year: 2023,
    order: 11,
    status: "published",
  },
  {
    slug: "pbhmi-datacentrum",
    title: { en: "PBHMI DataCentrum", id: "PBHMI DataCentrum" },
    summary: {
      en: "Member reception, automated membership numbering and event coordination across a nationwide branch network.",
      id: "Penerimaan anggota, penomoran keanggotaan otomatis, dan koordinasi acara di jaringan cabang nasional.",
    },
    description: {
      en: "Developed a centralized platform for managing member reception, automated membership number generation, and event coordination across a nationwide network of branches and regional divisions. The system enables member registration, profile management, and streamlined event organization, from branch meetings to regional conferences.",
      id: "Mengembangkan platform terpusat untuk mengelola penerimaan anggota, pembuatan nomor keanggotaan otomatis, dan koordinasi acara di jaringan cabang serta wilayah se-Indonesia. Sistem ini memungkinkan pendaftaran anggota, pengelolaan profil, dan penyelenggaraan acara yang lebih rapi, dari rapat cabang hingga konferensi wilayah.",
    },
    category: "web",
    techStack: ["React.js", "Express.js", "Node.js", "MongoDB", "REST API"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    featured: false,
    year: 2022,
    order: 12,
    status: "published",
  },
  {
    slug: "warnas",
    title: { en: "Warnas — Food Discovery & Social Commerce", id: "Warnas — Penemuan Kuliner & Social Commerce" },
    summary: {
      en: "A social commerce platform connecting local food vendors and small businesses with customers.",
      id: "Platform social commerce yang menghubungkan pedagang makanan lokal dan UMKM dengan pelanggan.",
    },
    description: {
      en: "Built Warnas end-to-end — a social commerce platform combining a food review and recommendation feed with a marketplace, letting users share reviews, discover trending dishes, follow other food enthusiasts, and buy directly from partnered vendors. Also included business mentorship programs for small business owners, a frozen food marketplace, and in-app payments. Owned the entire product stack across CMS, landing page, mobile app and backend in a 2-person engineering team.",
      id: "Membangun Warnas dari hulu ke hilir — platform social commerce yang memadukan feed ulasan dan rekomendasi makanan dengan marketplace, memungkinkan pengguna berbagi ulasan, menemukan hidangan yang sedang tren, mengikuti sesama penikmat kuliner, dan membeli langsung dari mitra pedagang. Termasuk pula program mentorship usaha bagi pemilik UMKM, marketplace frozen food, dan pembayaran dalam aplikasi. Memegang keseluruhan stack produk mulai CMS, landing page, aplikasi mobile, hingga backend dalam tim engineering 2 orang.",
    },
    category: "mobile",
    techStack: ["React.js", "Next.js", "React Native", "Express.js", "Node.js", "GraphQL", "MongoDB"],
    role: { en: "Full-Stack Developer", id: "Full-Stack Developer" },
    featured: false,
    year: 2020,
    order: 13,
    status: "published",
  },
];

export const mentoringTracks = [
  {
    slug: "fullstack-javascript",
    track: { en: "Full-Stack JavaScript", id: "Full-Stack JavaScript" },
    description: {
      en: "The track I taught to cohorts of 30+ at Hacktiv8: React on the front, Node and Express behind it, PostgreSQL underneath, and the deployment workflow that ties them together.",
      id: "Jalur yang saya ajarkan ke angkatan berisi 30+ siswa di Hacktiv8: React di depan, Node dan Express di belakangnya, PostgreSQL di bawahnya, dan alur deployment yang menyatukan semuanya.",
    },
    level: "beginner",
    topics: {
      en: ["React.js", "Node.js", "Express.js", "PostgreSQL", "MongoDB", "Production deployment"],
      id: ["React.js", "Node.js", "Express.js", "PostgreSQL", "MongoDB", "Deployment production"],
    },
    format: "group",
    duration: { en: "Cohort-based", id: "Berbasis angkatan" },
    outcomes: {
      en: [
        "Build and deploy a full-stack application end to end",
        "Work the way an Agile engineering team actually works",
      ],
      id: [
        "Membangun dan men-deploy aplikasi full-stack dari hulu ke hilir",
        "Bekerja dengan cara tim engineering Agile bekerja sungguhan",
      ],
    },
    icon: "layers",
    order: 1,
    status: "published",
  },
  {
    slug: "frontend-engineering",
    track: { en: "Frontend Engineering", id: "Frontend Engineering" },
    description: {
      en: "React, Next.js and TypeScript at production standard — component libraries, design systems, and the accessibility and performance work that separates a demo from a product.",
      id: "React, Next.js, dan TypeScript pada standar production — component library, design system, serta pekerjaan aksesibilitas dan performa yang membedakan demo dari produk.",
    },
    level: "intermediate",
    topics: {
      en: ["React.js", "Next.js App Router", "TypeScript", "Tailwind CSS", "Design systems", "Accessibility"],
      id: ["React.js", "Next.js App Router", "TypeScript", "Tailwind CSS", "Design system", "Aksesibilitas"],
    },
    format: "1-on-1",
    duration: { en: "8–12 weeks", id: "8–12 minggu" },
    outcomes: {
      en: ["Ship a production-grade frontend", "Review other people's code with confidence"],
      id: ["Merilis frontend siap production", "Mereview kode orang lain dengan percaya diri"],
    },
    icon: "layout",
    order: 2,
    status: "published",
  },
  {
    slug: "backend-golang",
    track: { en: "Backend Engineering with Go", id: "Backend Engineering dengan Go" },
    description: {
      en: "One of the four tracks I built curriculum for at Hacktiv8. API design, data modelling, and the operational concerns that only appear under real load.",
      id: "Salah satu dari empat jalur yang kurikulumnya saya susun di Hacktiv8. Desain API, pemodelan data, dan urusan operasional yang baru muncul saat beban nyata.",
    },
    level: "intermediate",
    topics: {
      en: ["Golang (Gin, Echo)", "gRPC", "REST & GraphQL", "Database design", "Microservices", "Testing"],
      id: ["Golang (Gin, Echo)", "gRPC", "REST & GraphQL", "Desain database", "Microservices", "Testing"],
    },
    format: "1-on-1",
    duration: { en: "8–12 weeks", id: "8–12 minggu" },
    outcomes: {
      en: ["Design an API you can defend in review", "Debug production incidents methodically"],
      id: ["Merancang API yang bisa dipertahankan saat review", "Men-debug insiden production secara metodis"],
    },
    icon: "server",
    order: 3,
    status: "published",
  },
  {
    slug: "generative-ai",
    track: { en: "Generative AI Engineering", id: "Generative AI Engineering" },
    description: {
      en: "Putting LLMs into products that real people use — not demos. Based on shipping AI features into client workflows in production.",
      id: "Menempatkan LLM ke dalam produk yang benar-benar dipakai orang — bukan sekadar demo. Berbasis pengalaman merilis fitur AI ke alur kerja klien di production.",
    },
    level: "intermediate",
    topics: {
      en: ["OpenAI API", "Claude API", "LangChain", "Prompt engineering", "RAG & semantic search", "Cost and latency"],
      id: ["OpenAI API", "Claude API", "LangChain", "Prompt engineering", "RAG & pencarian semantik", "Biaya dan latensi"],
    },
    format: "1-on-1",
    duration: { en: "6–8 weeks", id: "6–8 minggu" },
    outcomes: {
      en: ["Ship an AI feature that survives real users", "Reason about cost, latency and failure modes"],
      id: ["Merilis fitur AI yang bertahan di tangan pengguna nyata", "Menalar soal biaya, latensi, dan mode kegagalan"],
    },
    icon: "sparkles",
    order: 4,
    status: "published",
  },
  {
    slug: "mobile-react-native",
    track: { en: "Mobile with React Native", id: "Mobile dengan React Native" },
    description: {
      en: "Cross-platform apps that actually reach the stores — built on shipping iOS and Android products with tens of thousands of users.",
      id: "Aplikasi lintas platform yang benar-benar sampai ke store — berbasis pengalaman merilis produk iOS dan Android dengan puluhan ribu pengguna.",
    },
    level: "intermediate",
    topics: {
      en: ["React Native", "Expo", "Push notifications", "Secure storage", "App store deployment"],
      id: ["React Native", "Expo", "Push notification", "Secure storage", "Deployment ke app store"],
    },
    format: "1-on-1",
    duration: { en: "8 weeks", id: "8 minggu" },
    outcomes: {
      en: ["Publish an app to both stores", "Handle the platform differences that bite late"],
      id: ["Menerbitkan aplikasi ke kedua store", "Menangani perbedaan platform yang menggigit di akhir"],
    },
    icon: "smartphone",
    order: 5,
    status: "published",
  },
  {
    slug: "devops-foundations",
    track: { en: "DevOps Foundations", id: "Dasar DevOps" },
    description: {
      en: "Containers, pipelines and deployment — the path from your laptop to production, drawn from running infrastructure on AWS and VPS for live products.",
      id: "Container, pipeline, dan deployment — jalur dari laptop Anda ke production, diambil dari pengalaman menjalankan infrastruktur di AWS dan VPS untuk produk yang hidup.",
    },
    level: "beginner",
    topics: {
      en: ["Docker & Docker Compose", "Nginx", "CI/CD pipelines", "AWS (EC2, S3)", "Linux CLI"],
      id: ["Docker & Docker Compose", "Nginx", "Pipeline CI/CD", "AWS (EC2, S3)", "Linux CLI"],
    },
    format: "group",
    duration: { en: "6 weeks", id: "6 minggu" },
    outcomes: {
      en: ["Containerise and deploy your own service", "Build a pipeline you understand end to end"],
      id: ["Meng-container dan men-deploy service sendiri", "Membangun pipeline yang dipahami dari hulu ke hilir"],
    },
    icon: "container",
    order: 6,
    status: "published",
  },
];

export const resources = [
  {
    title: { en: "Next.js documentation", id: "Dokumentasi Next.js" },
    description: {
      en: "The official docs. The App Router guide is worth reading start to finish rather than dipping into.",
      id: "Dokumentasi resmi. Panduan App Router layak dibaca utuh dari awal, bukan sekadar dilihat sepotong-sepotong.",
    },
    type: "documentation",
    url: "https://nextjs.org/docs",
    tags: ["nextjs", "react"],
    level: "intermediate",
    free: true,
    order: 1,
    status: "published",
  },
  {
    title: { en: "MDN Web Docs", id: "MDN Web Docs" },
    description: {
      en: "The reference for anything that runs in a browser. Still the fastest way to settle an argument about the platform.",
      id: "Rujukan untuk apa pun yang berjalan di browser. Masih cara tercepat menyelesaikan perdebatan soal platform web.",
    },
    type: "documentation",
    url: "https://developer.mozilla.org",
    tags: ["web", "css", "javascript"],
    level: "beginner",
    free: true,
    order: 2,
    status: "published",
  },
  {
    title: { en: "Go by Example", id: "Go by Example" },
    description: {
      en: "Annotated example programs. The fastest on-ramp to Go if you already write another language.",
      id: "Contoh program beranotasi. Jalan masuk tercepat ke Go bila Anda sudah menulis bahasa lain.",
    },
    type: "documentation",
    url: "https://gobyexample.com",
    tags: ["golang", "backend"],
    level: "beginner",
    free: true,
    order: 3,
    status: "published",
  },
  {
    title: { en: "Tailwind CSS documentation", id: "Dokumentasi Tailwind CSS" },
    description: {
      en: "Read the theme and dark-mode pages properly — v4 moved configuration into CSS and most tutorials still teach v3.",
      id: "Baca halaman theme dan dark mode dengan benar — v4 memindahkan konfigurasi ke CSS dan sebagian besar tutorial masih mengajarkan v3.",
    },
    type: "documentation",
    url: "https://tailwindcss.com/docs",
    tags: ["css", "tailwind"],
    level: "beginner",
    free: true,
    order: 4,
    status: "published",
  },
];

export const snippets = [
  {
    slug: "use-debounce",
    title: { en: "useDebounce hook", id: "Hook useDebounce" },
    description: {
      en: "Defers a rapidly-changing value until it settles — the usual fix for search-as-you-type hammering an API.",
      id: "Menunda nilai yang berubah cepat sampai stabil — solusi umum agar search-as-you-type tidak menghujani API.",
    },
    language: "typescript",
    code: `import { useEffect, useState } from "react";

export function useDebounce<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}`,
    embedProvider: "none",
    tags: ["react", "hooks"],
    order: 1,
    status: "published",
  },
  {
    slug: "mongoose-hmr-guard",
    title: { en: "Mongoose model guard for Next.js", id: "Guard model Mongoose untuk Next.js" },
    description: {
      en: "Next's dev server hot-reloads modules, and re-registering a schema either throws or silently rebinds the model to a stale one. This guard is not optional.",
      id: "Dev server Next me-reload modul, dan mendaftarkan ulang schema akan error atau diam-diam mengikat model ke schema usang. Guard ini bukan opsional.",
    },
    language: "typescript",
    code: `import { model, models, Schema } from "mongoose";

const projectSchema = new Schema(
  { slug: { type: String, required: true, unique: true } },
  { timestamps: true },
);

// Reuse the registered model if it already exists.
export const Project = models.Project ?? model("Project", projectSchema);`,
    embedProvider: "none",
    tags: ["mongodb", "nextjs"],
    order: 2,
    status: "published",
  },
  {
    slug: "cached-mongo-connection",
    title: { en: "Cached MongoDB connection", id: "Koneksi MongoDB ter-cache" },
    description: {
      en: "Serverless instances are ephemeral and dev reloads are frequent. Caching the promise on globalThis is what stops the connection pool being exhausted.",
      id: "Instance serverless bersifat sementara dan reload saat dev sering terjadi. Meng-cache promise di globalThis-lah yang mencegah connection pool habis.",
    },
    language: "typescript",
    code: `import mongoose from "mongoose";

const cache = (globalThis as any)._mongoose ??= { conn: null, promise: null };

export async function connectDB() {
  if (cache.conn) return cache.conn;

  cache.promise ??= mongoose.connect(process.env.MONGODB_URI!, {
    maxPoolSize: 10,
    bufferCommands: false,
  });

  try {
    cache.conn = await cache.promise;
  } catch (error) {
    cache.promise = null; // let the next request retry
    throw error;
  }

  return cache.conn;
}`,
    embedProvider: "none",
    tags: ["mongodb", "nextjs", "serverless"],
    order: 3,
    status: "published",
  },
];

/** No source material exists for these — left empty rather than invented. */
export const testimonials: unknown[] = [];
export const articles: unknown[] = [];
export const openSource: unknown[] = [];

export const seededAt = now;
