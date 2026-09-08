import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  Download,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
} from 'lucide-react';
import { AnimatePresence, motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/* ── 3D PARTICLE CONSTELLATION CANVAS ── */
function Hero3DCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 500);

    const onResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', onResize);

    const count = 46;
    const radius = Math.min(width, height) * 0.36;
    const pts: { x: number; y: number; z: number; size: number; color: string }[] = [];
    const colors = [
      'rgba(79, 70, 229, 0.75)',
      'rgba(99, 102, 241, 0.65)',
      'rgba(124, 58, 237, 0.65)',
      'rgba(16, 185, 129, 0.6)',
    ];

    for (let i = 0; i < count; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = radius * (0.75 + 0.3 * Math.random());
      pts.push({
        x: r * Math.sin(theta) * Math.cos(phi),
        y: r * Math.sin(theta) * Math.sin(phi),
        z: r * Math.cos(theta),
        size: 2.2 + Math.random() * 2.2,
        color: colors[i % colors.length],
      });
    }

    let mouseX = 0;
    let mouseY = 0;
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.02;
      mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.02;
    };
    window.addEventListener('mousemove', onMouseMove);

    const fov = 340;

    const loop = () => {
      ctx.clearRect(0, 0, width, height);
      const angY = 0.0035 + mouseX;
      const angX = 0.002 + mouseY;
      const cosY = Math.cos(angY);
      const sinY = Math.sin(angY);
      const cosX = Math.cos(angX);
      const sinX = Math.sin(angX);

      const projected = pts.map((p) => {
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.z * cosY + p.x * sinY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = z1 * cosX + p.y * sinX;
        p.x = x1;
        p.y = y2;
        p.z = z2;

        const scale = fov / (fov + z2 + radius);
        return {
          ...p,
          px: x1 * scale + width / 2,
          py: y2 * scale + height / 2,
          scale,
          z: z2,
        };
      });

      projected.sort((a, b) => a.z - b.z);

      ctx.lineWidth = 0.75;
      for (let i = 0; i < projected.length; i++) {
        for (let j = i + 1; j < projected.length; j++) {
          const dx = projected[i].px - projected[j].px;
          const dy = projected[i].py - projected[j].py;
          const d = Math.sqrt(dx * dx + dy * dy);
          const maxD = 85 * ((projected[i].scale + projected[j].scale) / 2);
          if (d < maxD) {
            const alpha = (1 - d / maxD) * 0.2 * Math.min(projected[i].scale, projected[j].scale);
            ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(projected[i].px, projected[i].py);
            ctx.lineTo(projected[j].px, projected[j].py);
            ctx.stroke();
          }
        }
      }

      for (const p of projected) {
        if (p.px < 0 || p.px > width || p.py < 0 || p.py > height) continue;
        const alpha = Math.max(0.2, Math.min(1, (p.z + radius) / (radius * 2)));
        ctx.beginPath();
        ctx.arc(p.px, p.py, p.size * p.scale, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(/[\d.]+\)$/g, `${alpha})`);
        ctx.fill();
      }

      animId = requestAnimationFrame(loop);
    };

    loop();
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none opacity-40 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,transparent_15%,black_85%)]"
    />
  );
}

/* ── INTERACTIVE 3D TILT STUDY DECK ── */
function Hero3DCard() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x, { stiffness: 280, damping: 26 });
  const mouseYSpring = useSpring(y, { stiffness: 280, damping: 26 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['10deg', '-10deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ['0%', '100%']);
  const glareY = useTransform(mouseYSpring, [-0.5, 0.5], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative mx-auto mt-12 w-full max-w-4xl [perspective:1200px] cursor-grab active:cursor-grabbing select-none"
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative rounded-3xl border border-card-border bg-surface-container-low/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl transition-shadow duration-300 hover:shadow-primary/15"
      >
        {/* Dynamic 3D Specular Glare */}
        <motion.div
          style={{
            background: useTransform(
              [glareX, glareY],
              ([gx, gy]) =>
                `radial-gradient(circle 350px at ${gx} ${gy}, rgba(255, 255, 255, 0.35), transparent 70%)`
            ),
          }}
          className="pointer-events-none absolute inset-0 rounded-3xl z-30 opacity-70"
        />

        {/* 3D Foreground Floating Satellite 1 (Top-Right): translateZ(75px) */}
        <motion.div
          style={{ transform: 'translateZ(75px)' }}
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-4 -right-2 sm:-right-6 z-40 flex items-center gap-2 rounded-2xl border border-card-border bg-surface px-4 py-2 text-xs font-bold text-on-surface shadow-xl backdrop-blur-md"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <ShieldCheck size={16} className="text-emerald-500" />
          <span>Verified Academic Content</span>
        </motion.div>

        {/* 3D Foreground Floating Satellite 2 (Bottom-Left): translateZ(85px) */}
        <motion.div
          style={{ transform: 'translateZ(85px)' }}
          animate={{ y: [0, 7, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-5 -left-2 sm:-left-6 z-40 hidden sm:flex items-center gap-2 rounded-2xl border border-card-border bg-surface px-4 py-2.5 text-xs font-bold text-on-surface shadow-xl backdrop-blur-md"
        >
          <Trophy size={16} className="text-amber-500" />
          <span>Top Contributor • QL-94821</span>
          <span className="ml-1 rounded-md bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-600 font-extrabold">
            +1,420 Karma
          </span>
        </motion.div>

        {/* 3D Card Base Content: translateZ(25px) */}
        <div style={{ transform: 'translateZ(25px)' }} className="space-y-4 text-left">
          {/* Top Bar inside 3D Card */}
          <div className="flex items-center justify-between border-b border-card-border/70 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold shadow-xs">
                <BookOpen size={18} />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-on-surface">
                  Operating Systems & Concurrency Architecture
                </h4>
                <p className="text-xs text-on-surface-variant">B.Tech CSE • Semester 5 • Solved Mid-Term Archive</p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
              <Sparkles size={13} /> 100% Syllabus Aligned
            </span>
          </div>

          {/* Interactive Document Preview Box */}
          <div
            style={{ transform: 'translateZ(45px)' }}
            className="rounded-2xl border border-card-border bg-surface p-5 shadow-inner space-y-3"
          >
            <div className="flex items-center justify-between text-xs text-on-surface-variant">
              <span className="font-mono text-primary font-bold">UNIT 3: DEADLOCK DETECTION & RESOURCE ALLOCATION</span>
              <span className="rounded bg-surface-container-high px-2 py-0.5 font-mono text-[11px] font-semibold text-on-surface">
                Page 18 of 56
              </span>
            </div>

            <div className="rounded-xl bg-surface-container-high/40 p-3.5 text-xs text-on-surface-variant font-mono space-y-1.5 border border-card-border/40">
              <p className="text-on-surface font-semibold">
                Theorem 5.1 (Banker's Algorithm State Invariant):
              </p>
              <p className="text-[11px] text-on-surface-variant leading-relaxed">
                Let Available[m], Max[n][m], Allocation[n][m], and Need[n][m] be defined. If Need[i][j] &le; Available[j],
                process P_i safely commits without circular resource contention.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
              <div className="flex items-center gap-4 text-on-surface-variant">
                <span>📄 56 Verified Pages</span>
                <span>⭐ 4.95 / 5.0 (420 Votes)</span>
                <span>📥 4,120 Offline Downloads</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-[11px] font-bold text-emerald-600">
                  Moderator Approved
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

interface PlatformFeature {
  id: string;
  label: string;
  icon: typeof BookOpen;
  categoryBadge: string;
  title: string;
  description: string;
  highlights: { title: string; desc: string }[];
  floatingBadge: string;
}

const PLATFORM_FEATURES: PlatformFeature[] = [
  {
    id: 'library',
    label: 'Academic Library',
    icon: BookOpen,
    categoryBadge: 'CURATED SEMESTER REPOSITORY',
    title: 'Instant access to verified semester notes & past papers',
    description:
      'Stop searching through disorganized WhatsApp groups and expired Google Drive links. QuickLearnit curates study materials indexed by Branch, Semester, and Subject syllabus.',
    highlights: [
      { title: 'Curriculum-Aligned Structure', desc: 'Browse Engineering and Degree notes mapped by unit and semester.' },
      { title: 'Quality Moderation Queue', desc: 'Every uploaded file is reviewed and approved by student admins before publishing.' },
      { title: 'PYQ Exam Archive', desc: 'Solved mid-term and final semester question papers with step-by-step answers.' },
    ],
    floatingBadge: '100% Moderated & Spam-Free',
  },
  {
    id: 'reader',
    label: 'In-Browser Reader',
    icon: FileText,
    categoryBadge: 'DISTRACTION-FREE STUDY ENGINE',
    title: 'High-speed PDF viewer with zero pop-ups or paywalls',
    description:
      'Read documents immediately in your browser with responsive zoom, page jump navigation, continuous scroll, and one-click offline PDF downloads for exam hall revisions.',
    highlights: [
      { title: 'Instant Previewing', desc: 'View notes instantly without waiting for massive file downloads.' },
      { title: 'One-Click Offline Download', desc: 'Save clean, high-resolution PDFs directly to your phone or laptop.' },
      { title: 'Personal Study Library', desc: 'Bookmark essential notes into your personal collection for quick revision.' },
    ],
    floatingBadge: 'Offline PDF Downloads Ready',
  },
  {
    id: 'messaging',
    label: 'Peer Study Chat',
    icon: MessageSquare,
    categoryBadge: 'PEER-TO-PEER COLLABORATION',
    title: 'Discuss exam doubts and share notes directly with classmates',
    description:
      'Connect with note uploaders, form study circles with peers from your university, and share document attachments directly inside real-time student messaging threads.',
    highlights: [
      { title: 'Direct Student Messaging', desc: 'Ask authors specific questions about difficult theorems or solutions.' },
      { title: 'Rich Document Previews', desc: 'Share links that automatically expand into readable material preview cards.' },
      { title: 'Verified Student Profiles', desc: 'Know who you are learning from with verified university tags.' },
    ],
    floatingBadge: 'Live Academic Chat',
  },
  {
    id: 'reputation',
    label: 'Honor Roll & Karma',
    icon: Trophy,
    categoryBadge: 'STUDENT REPUTATION & QUICKID',
    title: 'Build your academic profile and climb the leaderboard',
    description:
      'Every student is assigned a unique QuickID. Earn academic Karma points whenever classmates like or download your notes, and get recognized on the University Honor Roll.',
    highlights: [
      { title: 'Unique Student QuickID', desc: 'A verified academic handle (e.g. QL-78210) to showcase your study portfolio.' },
      { title: 'Karma & Contribution Badges', desc: 'Earn Gold, Silver, and Bronze badges as your notes help fellow students.' },
      { title: 'University Honor Roll', desc: 'Compete with the top contributors across semesters and departments.' },
    ],
    floatingBadge: 'Rank #1 Academic Honor Roll',
  },
];

const SUPPORTED_BRANCHES = [
  { name: 'Computer Science (CSE)', count: '3,400+ Notes', tag: 'Core' },
  { name: 'Electronics & Comm (ECE)', count: '2,800+ Notes', tag: 'Core' },
  { name: 'Mechanical Engineering (ME)', count: '1,900+ Notes', tag: 'Core' },
  { name: 'Civil Engineering (CE)', count: '1,650+ Notes', tag: 'Core' },
  { name: 'Electrical Engineering (EEE)', count: '1,450+ Notes', tag: 'Core' },
  { name: 'AI & Machine Learning', count: '1,200+ Notes', tag: 'Trending' },
  { name: 'Data Science & Analytics', count: '980+ Notes', tag: 'Trending' },
  { name: 'Information Technology (IT)', count: '1,750+ Notes', tag: 'Core' },
  { name: 'BCA & B.Sc Computing', count: '1,100+ Notes', tag: 'Degree' },
];

export function GetStartedPage() {
  const navigate = useNavigate();
  const { completeOnboarding, startExploring } = useAuth();
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const activeFeature = PLATFORM_FEATURES[activeFeatureIndex];

  // Auto-advance through features every 6 seconds unless paused
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % PLATFORM_FEATURES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleGetStarted = (destination: string) => {
    completeOnboarding();
    navigate(destination);
  };

  const handleExplore = () => {
    startExploring();
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary/20 selection:text-primary">
      {/* ── TOP NAVIGATION ── */}
      <header className="sticky top-0 z-40 border-b border-card-border bg-surface-container-low/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-white font-bold shadow-xs">
              <GraduationCap size={20} />
            </div>
            <div>
              <span className="text-body-md font-bold tracking-tight text-on-surface">QuickLearnit</span>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={() => handleGetStarted('/signin')}
              className="px-3.5 py-1.5 text-label-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => handleGetStarted('/signup')}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-label-sm font-bold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH 3D ANIMATIONS ── */}
      <section className="relative border-b border-card-border bg-surface-container-low px-4 pt-16 pb-20 sm:px-6 lg:px-8 overflow-hidden">
        {/* 3D Interactive Particle Constellation */}
        <Hero3DCanvas />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Subtle ambient lighting behind hero */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-full h-[240px] bg-gradient-to-tr from-indigo-500/8 via-purple-500/8 to-transparent blur-3xl pointer-events-none rounded-full" />

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-indigo-100 bg-white shadow-xs px-4 py-1.5 text-xs font-medium text-slate-700 mb-8 transition-all hover:border-indigo-200">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-800">Open Academic Repository</span>
            <span className="text-slate-300">·</span>
            <span className="text-indigo-600 font-bold">100% Free for University Students</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-[-0.035em] text-slate-900 leading-[1.12] max-w-4xl mx-auto">
            <span>Master your university courses with{' '}</span>
            <span className="relative inline-block whitespace-nowrap">
              <span className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 bg-clip-text text-transparent">
                verified notes
              </span>
              <svg
                className="absolute -bottom-2 sm:-bottom-2.5 left-0 w-full h-3 text-indigo-500/80 overflow-visible"
                viewBox="0 0 250 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 8C48 2 152 2 247 7"
                  stroke="currentColor"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <path
                  d="M18 10C65 4 165 4 232 9"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  opacity="0.6"
                />
              </svg>
            </span>
            <span>, exam papers & assignments.</span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-7 max-w-2xl text-[16px] sm:text-[18px] text-slate-600 leading-relaxed font-normal">
            The student-powered platform designed for <span className="font-bold text-slate-900">Engineering & Degree programs</span>. Access curated semester notes, view past exam solutions, and share academic knowledge with peers.
          </p>

          {/* Feature Badges / Quick Highlights */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <BookOpen size={14} className="text-indigo-600" />
              <span>Curated Semester Notes</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <FileText size={14} className="text-violet-600" />
              <span>Past Exam Solutions</span>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-xs">
              <GraduationCap size={14} className="text-emerald-600" />
              <span>Branch & University Specific</span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="mt-9 flex items-center justify-center">
            <button
              type="button"
              onClick={handleExplore}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 px-8 py-3.5 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition-all cursor-pointer active:scale-[0.99]"
            >
              <Compass size={18} strokeWidth={2.2} />
              <span>Explore Library</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
          </div>

          {/* 3D Interactive Holographic Tilt Study Deck */}
          <Hero3DCard />

          {/* Trust stats bar */}
          <div className="mt-14 grid grid-cols-2 gap-4 border-t border-card-border/60 pt-8 sm:grid-cols-4">
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-on-surface">50,000+</span>
              <span className="text-label-sm text-on-surface-variant">Active Students</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-on-surface">12,500+</span>
              <span className="text-label-sm text-on-surface-variant">Verified Documents</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-on-surface">100% Free</span>
              <span className="text-label-sm text-on-surface-variant">No Paywalls Ever</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-bold tracking-tight text-on-surface">4.9 / 5.0</span>
              <span className="text-label-sm text-on-surface-variant">Student Satisfaction</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── INTERACTIVE PLATFORM SHOWCASE (ANIMATED FEATURE TOUR) ── */}
      <section
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 mb-4">
            <Sparkles size={13} />
            <span>PLATFORM TOUR & CAPABILITIES</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface">
            Everything built for academic excellence
          </h2>
          <p className="mt-3 text-body-md text-on-surface-variant">
            Explore how QuickLearnit connects students with verified university course materials and peer study tools.
          </p>

          {/* Segmented Animated Navigation Tabs */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-surface-container border border-card-border max-w-2xl mx-auto">
            {PLATFORM_FEATURES.map((feature, idx) => {
              const Icon = feature.icon;
              const isActive = activeFeatureIndex === idx;
              return (
                <button
                  key={feature.id}
                  type="button"
                  onClick={() => {
                    setActiveFeatureIndex(idx);
                    setIsAutoPlaying(false);
                  }}
                  className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer ${
                    isActive ? 'text-white' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="platformActiveTab"
                      className="absolute inset-0 rounded-xl bg-primary shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon size={16} className="relative z-10" />
                  <span className="relative z-10">{feature.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Animated Viewport */}
        <div className="rounded-3xl border border-card-border bg-surface-container-low p-6 sm:p-10 shadow-sm">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeFeature.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center"
            >
              {/* Left Column: Feature Breakdown */}
              <div className="lg:col-span-5 space-y-6">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {activeFeature.categoryBadge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-extrabold text-on-surface mt-2 leading-tight">
                    {activeFeature.title}
                  </h3>
                  <p className="text-body-sm sm:text-body-md text-on-surface-variant mt-3 leading-relaxed">
                    {activeFeature.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="space-y-3 pt-2">
                  {activeFeature.highlights.map((h) => (
                    <div key={h.title} className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 size={13} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-on-surface">{h.title}: </span>
                        <span className="text-xs sm:text-sm text-on-surface-variant">{h.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleExplore}
                    className="inline-flex items-center gap-2 rounded-xl bg-surface border border-card-border px-5 py-2.5 text-xs sm:text-sm font-semibold text-on-surface hover:bg-surface-container hover:border-primary/40 transition-all cursor-pointer shadow-xs"
                  >
                    <span>Open in Study Hub</span>
                    <ArrowRight size={14} className="text-primary" />
                  </button>
                </div>
              </div>

              {/* Right Column: Animated Interactive Mockup Window */}
              <div className="lg:col-span-7">
                <div className="rounded-2xl border border-card-border bg-surface-container overflow-hidden shadow-md">
                  {/* Browser Window Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-card-border/70 bg-surface-container-high/50">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-400" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface border border-card-border text-[11px] text-on-surface-variant font-mono">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span>quicklearnit.edu/app/{activeFeature.id}</span>
                    </div>
                    <div className="w-12" />
                  </div>

                  {/* Window Body Mockup Content */}
                  <div className="p-6 sm:p-8 min-h-[360px] flex flex-col justify-center relative">
                    {/* Floating pill badge */}
                    <motion.div
                      animate={{ y: [0, -5, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                      className="absolute top-4 right-4 hidden sm:flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary shadow-2xs z-10"
                    >
                      <Sparkles size={12} />
                      <span>{activeFeature.floatingBadge}</span>
                    </motion.div>

                    {/* MOCKUP 1: LIBRARY */}
                    {activeFeature.id === 'library' && (
                      <div className="space-y-4">
                        {/* Search & Filter Bar Simulation */}
                        <div className="flex items-center gap-2 rounded-xl bg-surface border border-card-border px-3 py-2 text-xs text-on-surface-variant">
                          <Search size={14} className="text-primary" />
                          <span className="font-medium text-on-surface">Data Structures & Algorithms</span>
                          <span className="ml-auto rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                            B.Tech CSE • Sem 3
                          </span>
                        </div>

                        {/* Document Card Preview */}
                        <div className="rounded-xl border border-card-border bg-surface p-4 shadow-xs space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-primary font-bold">
                                <FileText size={20} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold text-on-surface">Graph Algorithms & Dynamic Programming</h4>
                                <p className="text-xs text-on-surface-variant">CS302 • Unit 4 Handwritten Lecture Notes</p>
                              </div>
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 border border-emerald-500/20">
                              Verified PDF
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-card-border/60 text-center text-xs">
                            <div>
                              <span className="text-on-surface-variant">Pages</span>
                              <p className="font-bold text-on-surface">48 Pages</p>
                            </div>
                            <div>
                              <span className="text-on-surface-variant">Rating</span>
                              <p className="font-bold text-on-surface">★ 4.9 / 5.0</p>
                            </div>
                            <div>
                              <span className="text-on-surface-variant">Downloads</span>
                              <p className="font-bold text-on-surface">3,850+</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-on-surface-variant pt-1 px-1">
                          <span className="flex items-center gap-1">
                            <CheckCircle2 size={13} className="text-emerald-500" /> Syllabus Unit 1 to 5 Mapped
                          </span>
                          <span className="font-semibold text-primary">Free Instant PDF</span>
                        </div>
                      </div>
                    )}

                    {/* MOCKUP 2: READER */}
                    {activeFeature.id === 'reader' && (
                      <div className="rounded-xl border border-card-border bg-surface p-4 space-y-4">
                        {/* Reader Toolbar Simulation */}
                        <div className="flex items-center justify-between pb-3 border-b border-card-border/60 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-on-surface">Page 14 of 48</span>
                            <span className="text-outline">|</span>
                            <span className="text-on-surface-variant">100% Zoom</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-lg bg-primary/10 text-primary px-2.5 py-1 font-semibold text-xs"
                            >
                              <Download size={12} /> Download
                            </button>
                          </div>
                        </div>

                        {/* Page Preview Content Simulation */}
                        <div className="rounded-lg bg-surface-container-high/40 p-4 border border-card-border/50 text-xs space-y-2">
                          <div className="font-bold text-on-surface text-sm">Theorem 3.2: Asymptotic Bounds of Dijkstra’s Algorithm</div>
                          <p className="text-on-surface-variant leading-relaxed">
                            Given a directed graph G = (V, E) with non-negative edge weights, the priority queue implementation yields an optimal time complexity of O((|V| + |E|) log |V|).
                          </p>
                          <div className="mt-2 p-2 rounded bg-primary/10 border border-primary/20 text-primary text-[11px] font-mono">
                            Time: O(E log V) | Space: O(V)
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MOCKUP 3: MESSAGING */}
                    {activeFeature.id === 'messaging' && (
                      <div className="space-y-3">
                        {/* Student Chat Message 1 */}
                        <div className="flex items-start gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            AK
                          </div>
                          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-surface border border-card-border p-3 text-xs shadow-2xs">
                            <p className="font-bold text-on-surface mb-0.5">Arun Kumar • CSE Sem 5</p>
                            <p className="text-on-surface-variant">Hey! Did anyone get the solved proofs for the 2025 Mid-Sem Operating Systems paper?</p>
                          </div>
                        </div>

                        {/* Student Reply 2 */}
                        <div className="flex items-start gap-2.5 flex-row-reverse">
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs">
                            SN
                          </div>
                          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-white p-3 text-xs shadow-xs space-y-2">
                            <p className="font-bold mb-0.5">Sneha Nair (Top Contributor)</p>
                            <p className="text-white/90">Yes! Just uploaded the verified solutions with step-by-step diagrams:</p>
                            <div className="rounded-xl bg-white/10 p-2 text-[11px] flex items-center justify-between gap-2">
                              <span className="font-mono">OS_MidSem_2025_Solved.pdf</span>
                              <span className="underline font-bold cursor-pointer">View Note →</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* MOCKUP 4: REPUTATION */}
                    {activeFeature.id === 'reputation' && (
                      <div className="space-y-3">
                        <div className="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-1">
                          University Honor Roll • Top Semester Contributors
                        </div>

                        {/* Contributor Row 1 */}
                        <div className="flex items-center justify-between rounded-xl bg-surface border border-card-border p-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-500 text-white font-bold text-xs shadow-xs">
                              1
                            </div>
                            <div>
                              <p className="text-xs font-bold text-on-surface">Rohit Sharma (@rohit_cse)</p>
                              <p className="text-[11px] text-on-surface-variant">Computer Science • 32 Documents Uploaded</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-600">
                            1,480 Karma
                          </span>
                        </div>

                        {/* Contributor Row 2 */}
                        <div className="flex items-center justify-between rounded-xl bg-surface border border-card-border p-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-300 text-slate-800 font-bold text-xs">
                              2
                            </div>
                            <div>
                              <p className="text-xs font-bold text-on-surface">Priya Patel (@priya_ece)</p>
                              <p className="text-[11px] text-on-surface-variant">Electronics & Comm • 24 Documents</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                            1,210 Karma
                          </span>
                        </div>

                        {/* Contributor Row 3 */}
                        <div className="flex items-center justify-between rounded-xl bg-surface border border-card-border p-3 shadow-2xs">
                          <div className="flex items-center gap-3">
                            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-700/20 text-amber-800 font-bold text-xs">
                              3
                            </div>
                            <div>
                              <p className="text-xs font-bold text-on-surface">Karthik Reddy (@karthik_me)</p>
                              <p className="text-[11px] text-on-surface-variant">Mechanical Engg • 18 Documents</p>
                            </div>
                          </div>
                          <span className="rounded-full bg-slate-100 border border-slate-200 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                            950 Karma
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </section>

      {/* ── COURSE & BRANCH COVERAGE DIRECTORY ── */}
      <section className="border-t border-card-border bg-surface-container-low px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary mb-1">
                <Layers size={14} />
                <span>Broad Academic Coverage</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-on-surface">
                Supported Degree & Engineering Streams
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md">
              Notes and question papers are organized across Semesters 1 through 8 for each stream.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SUPPORTED_BRANCHES.map((b) => (
              <div
                key={b.name}
                onClick={handleExplore}
                className="group flex items-center justify-between p-4 rounded-xl border border-card-border bg-surface hover:border-primary/40 hover:bg-surface-container transition-all cursor-pointer shadow-xs"
              >
                <div>
                  <h4 className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">
                    {b.name}
                  </h4>
                  <p className="text-xs text-on-surface-variant mt-0.5">{b.count}</p>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {b.tag}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="border-y border-card-border bg-surface px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-label-sm font-bold uppercase tracking-wider text-primary mb-2">Simple 3-Step Flow</h2>
            <p className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">Designed for how students actually study</p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg mb-4 shadow-xs">
                1
              </div>
              <h4 className="text-body-lg font-bold text-on-surface mb-2">Search Your Course</h4>
              <p className="text-body-sm text-on-surface-variant">
                Select your stream (Engineering or Degree), choose your branch, and find exact notes for your current semester.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg mb-4 shadow-xs">
                2
              </div>
              <h4 className="text-body-lg font-bold text-on-surface mb-2">Read in Browser or Save</h4>
              <p className="text-body-sm text-on-surface-variant">
                Preview documents instantly with our built-in PDF viewer, bookmark them into your personal Library, or download for offline study.
              </p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white font-bold text-lg mb-4 shadow-xs">
                3
              </div>
              <h4 className="text-body-lg font-bold text-on-surface mb-2">Share & Build Profile</h4>
              <p className="text-body-sm text-on-surface-variant">
                Upload your notes to help fellow students, earn points, climb the Academic Leaderboard, and build your student portfolio.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CALL TO ACTION BANNER ── */}
      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8 text-center">
        <div className="rounded-3xl border border-card-border bg-surface-container p-8 sm:p-12 shadow-sm">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-on-surface mb-4">
            Ready to elevate your semester preparation?
          </h2>
          <p className="text-body-md text-on-surface-variant max-w-xl mx-auto mb-8">
            Join thousands of university students learning smarter today. Create your account in less than a minute.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => handleGetStarted('/signup')}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-3.5 text-label-md font-bold text-white shadow-md hover:opacity-95 transition-all cursor-pointer"
            >
              <span>Create Free Account</span>
              <ArrowRight size={16} />
            </button>
            <button
              type="button"
              onClick={handleExplore}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-card-border bg-surface-container-low px-6 py-3.5 text-label-md font-semibold text-on-surface hover:bg-surface-container transition-all cursor-pointer"
            >
              Browse Library as Guest
            </button>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-card-border bg-surface-container-low py-8 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-white text-xs font-bold">
              Q
            </div>
            <span className="font-bold text-body-sm text-on-surface">QuickLearnit</span>
            <span className="text-on-surface-variant text-body-xs">· Open University Study Platform</span>
          </div>

          <p className="text-body-xs text-on-surface-variant">
            &copy; {new Date().getFullYear()} QuickLearnit. All academic rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

export default GetStartedPage;
