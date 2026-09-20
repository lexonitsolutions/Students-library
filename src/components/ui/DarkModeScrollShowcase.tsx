import { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Camera,
  CheckCircle2,
  Cpu,
  FileText,
  Filter,
  Headphones,
  Home,
  Layers,
  LayoutGrid,
  List,
  MessageSquare,
  Moon,
  Plus,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  ThumbsUp,
  Trophy,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { Logo } from './Logo';

/* ─────────────────────────── Document Cover Preview (Dummy) ────────── */

function DocumentCoverPreview({
  code,
  title,
  subtitle,
  badge,
  badgeBg,
  colorScheme,
}: {
  code: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeBg: string;
  colorScheme: 'indigo' | 'blue' | 'emerald' | 'amber';
}) {
  const schemes = {
    indigo: {
      bg: 'bg-gradient-to-br from-slate-950 via-indigo-950 to-[#1e1b4b]',
      border: 'border-indigo-500/25',
      accent: 'bg-indigo-400',
      icon: <Cpu size={16} className="text-indigo-400" />,
    },
    blue: {
      bg: 'bg-gradient-to-br from-slate-950 via-sky-950 to-[#0c4a6e]',
      border: 'border-sky-500/25',
      accent: 'bg-sky-400',
      icon: <Layers size={16} className="text-sky-400" />,
    },
    emerald: {
      bg: 'bg-gradient-to-br from-slate-950 via-emerald-950 to-[#064e3b]',
      border: 'border-emerald-500/25',
      accent: 'bg-emerald-400',
      icon: <FileText size={16} className="text-emerald-400" />,
    },
    amber: {
      bg: 'bg-gradient-to-br from-slate-950 via-amber-950 to-[#451a03]',
      border: 'border-amber-500/25',
      accent: 'bg-amber-400',
      icon: <Sparkles size={16} className="text-amber-400" />,
    },
  };

  const s = schemes[colorScheme];

  return (
    <div className={`w-full h-24 rounded-lg overflow-hidden relative p-2.5 flex flex-col justify-between select-none border ${s.bg} ${s.border}`}>
      {/* Background subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:0.9rem_0.9rem] pointer-events-none" />

      {/* Top row: Format Badge + Code + Icon */}
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-1.5">
          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${badgeBg}`}>
            {badge}
          </span>
          <span className="text-[9px] font-mono text-slate-400 font-semibold">
            {code}
          </span>
        </div>
        <div className="opacity-80">
          {s.icon}
        </div>
      </div>

      {/* Center/Bottom: Title & Subtitle */}
      <div className="relative z-10">
        <div className={`h-0.5 w-6 rounded-full ${s.accent} mb-1 opacity-70`} />
        <h5 className="text-[11px] font-bold text-white truncate leading-tight">
          {title}
        </h5>
        <p className="text-[9px] text-slate-400 truncate mt-0.5">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ─────────────────────────── Page Metadata ─────────────────────────── */

interface PageMeta {
  id: string;
  label: string;
  step: string;
  badge: string;
  tagline: string;
}

const PAGES: PageMeta[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    step: '01',
    badge: 'CORE ACADEMIC HUB',
    tagline: 'Personalized course materials, verified notes, and exam notifications.',
  },
  {
    id: 'library',
    label: 'Library',
    step: '02',
    badge: 'STUDY REPOSITORY',
    tagline: 'Curated semester archives with instant PDF preview and offline access.',
  },
  {
    id: 'messages',
    label: 'Messages',
    step: '03',
    badge: 'STUDY CIRCLES & CHAT',
    tagline: 'Real-time peer discussions, doubt clearing, and document sharing.',
  },
  {
    id: 'profile',
    label: 'Profile',
    step: '04',
    badge: 'STUDENT PORTFOLIO',
    tagline: 'Academic QuickID, contribution karma, and subject credentials.',
  },
];

const PAGE_COUNT = PAGES.length;

/* ─────────────── Progress Ranges (within 0 → 1 master progress) ──── */

const SHUTTER_OPEN_END = 0.14;        // 0.00 → 0.14 : shutters separate
const SHOWCASE_START = SHUTTER_OPEN_END;
const SHOWCASE_END = 0.86;             // 0.14 → 0.86 : 4 pages
const SHUTTER_CLOSE_START = SHOWCASE_END; // 0.86 → 1.00 : shutters return

/* ──────────────────────────────────────────────────────────────────────
   PreviousDarkModeSectionContent
   The exact previous Dark Mode section content as requested by the user:
   deep dark #0a0a0a surface, "NATIVE DARK MODE" badge, heading,
   paragraph, and the realistic Light/Dark split mockup card.
   ────────────────────────────────────────────────────────────────────── */

function PreviousDarkModeSectionContent() {
  return (
    <div className="w-full h-full bg-surface flex flex-col justify-center items-center select-none relative overflow-hidden">
      
      {/* ── ONLY THE MARKED AREA IS DARK (#0a0a0a) WITH REDUCED TOP & BOTTOM SPACE ── */}
      <div className="w-full bg-[#0a0a0a] border-y border-slate-800 py-8 sm:py-10 lg:py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden shadow-2xl">
        {/* Background depth glows inside the dark banner */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[350px] w-[500px] rounded-full bg-indigo-900/15 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[350px] w-[500px] rounded-full bg-purple-900/15 blur-[120px]" />

        <div className="mx-auto max-w-7xl w-full flex flex-col lg:flex-row items-center gap-8 lg:gap-14 relative z-10">
        
        {/* Left column: Text & Badge */}
        <div className="flex-1 text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 mb-5">
            <Moon size={14} />
            <span>NATIVE DARK MODE</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
            Study comfortably, <br className="hidden lg:block" /> day or night.
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-xl mx-auto lg:mx-0 leading-relaxed">
            Late night cramming? Studexa features a gorgeous, fully-integrated dark theme that's easy on the eyes. Switch seamlessly depending on your study environment.
          </p>
          <div className="mt-6 flex items-center justify-center lg:justify-start gap-2 text-xs text-indigo-400 font-mono">
            <span className="inline-block animate-bounce">↓</span>
            <span>Scroll down to enter Dark Mode showcase</span>
          </div>
        </div>

        {/* Right column: Split Mockup */}
        <div className="flex-1 w-full relative" style={{ perspective: 1200 }}>
          <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-800 max-w-[480px] mx-auto bg-[#0f1115]">
            <div className="flex">
              {/* Light Side */}
              <div className="w-1/2 bg-white p-4 sm:p-5 border-r border-slate-200 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Sun size={15} className="text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">Light Mode</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">Good morning</h4>
                    <p className="text-[10px] text-slate-500 truncate">Resume your studies</p>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">PDF</span>
                      <span className="text-[9px] text-slate-500">★ 4.9</span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">Operating Systems Notes</p>
                    <p className="text-[9px] text-slate-400">Alex K. · 48 pgs</p>
                  </div>
                </div>
              </div>

              {/* Dark Side */}
              <div className="w-1/2 bg-[#0b0e17] p-4 sm:p-5 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Moon size={15} className="text-indigo-400" />
                    <span className="text-xs font-bold text-slate-100">Dark Mode</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white leading-tight">Good evening</h4>
                    <p className="text-[10px] text-slate-400 truncate">Resume your studies</p>
                  </div>
                  <div className="rounded-xl bg-[#141824] border border-slate-800 p-2.5 space-y-1.5 shadow-2xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[8px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded">PDF</span>
                      <span className="text-[9px] text-slate-400">★ 4.9</span>
                    </div>
                    <p className="text-[11px] font-bold text-white line-clamp-2 leading-snug">Deep Learning Notes</p>
                    <p className="text-[9px] text-slate-500">Jordan L. · 54 pgs</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Central Divider Glow */}
            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-primary/60 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.6)] pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   MobileDarkModeDashboardCard
   Dedicated clean static dashboard card for mobile screens.
   Completely removes the 600vh scroll-trap exploring feature on mobile,
   and features the Studexa dashboard card with Light Mode and Dark Mode.
   ══════════════════════════════════════════════════════════════════════ */

function MobileDarkModeDashboardCard() {
  const [viewMode, setViewMode] = useState<'split' | 'light' | 'dark'>('split');

  return (
    <div className="block md:hidden w-full bg-[#0a0a0a] border-y border-slate-800 py-10 px-4 relative overflow-hidden shadow-2xl select-none">
      {/* Background depth glows */}
      <div className="pointer-events-none absolute -top-24 left-1/4 h-[260px] w-[350px] rounded-full bg-indigo-900/20 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 right-1/4 h-[260px] w-[350px] rounded-full bg-purple-900/20 blur-[100px]" />

      <div className="mx-auto max-w-lg w-full relative z-10 space-y-6">
        {/* Text Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Moon size={13} />
            <span>NATIVE DARK MODE</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-tight">
            Study comfortably, <br /> day or night.
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
            Late night cramming? Studexa features a gorgeous, fully-integrated dark theme that's easy on the eyes. Switch seamlessly depending on your study environment.
          </p>
        </div>

        {/* Dashboard Mockup Card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl border border-slate-800 bg-[#0f1115]">
          {/* Card Window Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800 bg-[#141824]">
            {/* Window control dots */}
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-slate-700/60 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                  viewMode === 'split' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('light')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'light' ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sun size={10} /> Light
              </button>
              <button
                type="button"
                onClick={() => setViewMode('dark')}
                className={`px-2 py-0.5 rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                  viewMode === 'dark' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Moon size={10} /> Dark
              </button>
            </div>
          </div>

          {/* Card Body */}
          <div className="relative overflow-hidden">
            {/* 1. SPLIT VIEW */}
            {viewMode === 'split' && (
              <div className="flex relative">
                {/* Light Side */}
                <div className="w-1/2 bg-white p-3.5 flex flex-col justify-between border-r border-slate-200">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1">
                      <Sun size={12} className="text-amber-500" />
                      <span className="text-[10px] font-bold text-slate-700">Light Mode</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Good morning</h4>
                      <p className="text-[9px] text-slate-500 truncate">Resume your studies</p>
                    </div>
                    {/* Material Item */}
                    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1 py-0.2 rounded">PDF</span>
                        <span className="text-[8px] text-slate-500">★ 4.9</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-snug">Operating Systems Notes</p>
                      <p className="text-[8px] text-slate-400">Alex K. · 48 pgs</p>
                    </div>
                  </div>
                </div>

                {/* Dark Side */}
                <div className="w-1/2 bg-[#0b0e17] p-3.5 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1">
                      <Moon size={12} className="text-indigo-400" />
                      <span className="text-[10px] font-bold text-slate-200">Dark Mode</span>
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-white leading-tight">Good evening</h4>
                      <p className="text-[9px] text-slate-400 truncate">Resume your studies</p>
                    </div>
                    {/* Material Item */}
                    <div className="rounded-lg bg-[#141824] border border-slate-800 p-2 space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-bold text-indigo-300 bg-indigo-500/20 px-1 py-0.2 rounded">PDF</span>
                        <span className="text-[8px] text-slate-400">★ 4.9</span>
                      </div>
                      <p className="text-[10px] font-bold text-white line-clamp-2 leading-snug">Deep Learning Notes</p>
                      <p className="text-[8px] text-slate-500">Jordan L. · 54 pgs</p>
                    </div>
                  </div>
                </div>

                {/* Central Divider Glow */}
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-px bg-gradient-to-b from-transparent via-primary/70 to-transparent shadow-[0_0_12px_rgba(99,102,241,0.8)] pointer-events-none" />
              </div>
            )}

            {/* 2. FULL LIGHT VIEW */}
            {viewMode === 'light' && (
              <div className="bg-white p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-slate-900">Good morning, Student</h4>
                    <p className="text-[10px] text-slate-500">Let's continue your studies where you left off.</p>
                  </div>
                  <span className="rounded-full bg-amber-50 border border-amber-200 text-amber-700 px-2 py-0.5 text-[9px] font-bold flex items-center gap-1">
                    <Sun size={10} /> Light Mode
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 shadow-2xs flex flex-col justify-between h-24">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">PDF</span>
                        <span className="text-[8px] text-slate-500">★ 4.9</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">Operating Systems Concurrency</p>
                    </div>
                    <span className="text-[8px] text-slate-400">Alex K. · 48 Pages</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 border border-slate-200 p-2.5 shadow-2xs flex flex-col justify-between h-24">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold text-violet-600 bg-violet-50 px-1.5 py-0.2 rounded">DOCX</span>
                        <span className="text-[8px] text-slate-500">★ 4.8</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-800 line-clamp-2 leading-tight">Discrete Math PYQs 2023</p>
                    </div>
                    <span className="text-[8px] text-slate-400">Sarah M. · 32 Pages</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. FULL DARK VIEW */}
            {viewMode === 'dark' && (
              <div className="bg-[#0b0e17] p-4 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-white">Good evening, Student</h4>
                    <p className="text-[10px] text-slate-400">Let's continue your studies where you left off.</p>
                  </div>
                  <span className="rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 text-[9px] font-bold flex items-center gap-1">
                    <Moon size={10} /> Dark Mode
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-xl bg-[#141824] border border-slate-800 p-2.5 shadow-2xs flex flex-col justify-between h-24">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold text-indigo-300 bg-indigo-500/20 px-1.5 py-0.2 rounded">PDF</span>
                        <span className="text-[8px] text-slate-400">★ 4.9</span>
                      </div>
                      <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">Deep Learning Architectures</p>
                    </div>
                    <span className="text-[8px] text-slate-400">Jordan L. · 54 Pages</span>
                  </div>
                  <div className="rounded-xl bg-[#141824] border border-slate-800 p-2.5 shadow-2xs flex flex-col justify-between h-24">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[8px] font-bold text-sky-300 bg-sky-500/20 px-1.5 py-0.2 rounded">DOCX</span>
                        <span className="text-[8px] text-slate-400">★ 4.8</span>
                      </div>
                      <p className="text-[10px] font-bold text-white line-clamp-2 leading-tight">Distributed Systems Guide</p>
                    </div>
                    <span className="text-[8px] text-slate-400">David Y. · 36 Pages</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════
   DarkModeScrollShowcase
   A 100 % scroll-controlled dark-mode showcase on desktop/tablets.
   ══════════════════════════════════════════════════════════════════════ */

export function DarkModeScrollShowcase() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const rafId = useRef(0);

  /* ── Scroll tracking ────────────────────────────────────────────── */
  useEffect(() => {
    const onScroll = () => {
      if (rafId.current) cancelAnimationFrame(rafId.current);
      rafId.current = requestAnimationFrame(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const scrollable = el.offsetHeight - window.innerHeight;
        if (scrollable <= 0) return;
        const scrolled = -rect.top;
        setProgress(Math.max(0, Math.min(1, scrolled / scrollable)));
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId.current);
    };
  }, []);

  /* ── Derived animation values ───────────────────────────────────── */

  // Shutter openness  0 = closed (previous section visible)  1 = fully open
  let shutterOpenness: number;
  if (progress <= SHUTTER_OPEN_END) {
    shutterOpenness = progress / SHUTTER_OPEN_END;
  } else if (progress >= SHUTTER_CLOSE_START) {
    shutterOpenness = 1 - (progress - SHUTTER_CLOSE_START) / (1 - SHUTTER_CLOSE_START);
  } else {
    shutterOpenness = 1;
  }

  // Showcase local progress  0 → 1  (across the four pages)
  let showcaseProgress = 0;
  if (progress > SHOWCASE_START && progress <= SHOWCASE_END) {
    showcaseProgress = (progress - SHOWCASE_START) / (SHOWCASE_END - SHOWCASE_START);
  } else if (progress > SHOWCASE_END) {
    showcaseProgress = 1;
  }

  // Active page index  0..3
  const activePageIndex = Math.min(
    PAGE_COUNT - 1,
    Math.floor(showcaseProgress * PAGE_COUNT),
  );

  // How far to translate the pages stack
  const pagesTranslatePercent = showcaseProgress * ((PAGE_COUNT - 1) / PAGE_COUNT) * 100;

  // Showcase content opacity (fades in as shutters separate)
  const contentOpacity = Math.min(1, shutterOpenness * 2.5);

  /* ═══════════════════════ RENDER ═══════════════════════════════════ */
  return (
    <>
      {/* ── MOBILE SCREENS: Clean static dashboard card with light/dark modes (NO 600vh scroll-trap exploring feature) ── */}
      <MobileDarkModeDashboardCard />

      {/* ── DESKTOP & TABLETS: Full 600vh scroll-controlled showcase ── */}
      <div
        ref={containerRef}
        className="hidden md:block relative"
        style={{ height: '600vh' }}           /* tall scroll runway */
      >
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* ── Layer 0: Dark background ── */}
        <div className="absolute inset-0 bg-[#080a0f]" />

        {/* Ambient depth glows */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[350px] w-[500px] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[350px] w-[500px] rounded-full bg-purple-900/10 blur-[120px]" />

        {/* ── Layer 1: Showcase content (z-10, behind the shutters) ── */}
        <div
          className="absolute inset-0 z-10 flex flex-col text-slate-100 font-sans"
          style={{ opacity: contentOpacity, willChange: 'opacity' }}
        >
          {/* ─── TOP NAVIGATION BAR ─── */}
          <header className="shrink-0 flex items-center justify-between border-b border-slate-800/80 bg-[#0c0f17]/90 px-4 py-3 sm:px-8 backdrop-blur-md">
            <div className="flex items-center gap-3 sm:gap-6">
              <Logo height={30} />
              <div className="hidden md:flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
                <Moon size={12} className="text-indigo-400" />
                <span>DARK THEME SHOWCASE</span>
              </div>
            </div>

            {/* Page step indicators (scroll-position driven) */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {PAGES.map((pg, idx) => {
                const isActive = activePageIndex === idx;
                const isPassed = activePageIndex > idx;
                return (
                  <span
                    key={pg.id}
                    className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold select-none ${
                      isActive
                        ? 'bg-slate-800 text-white shadow-xs ring-1 ring-white/10'
                        : isPassed
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }`}
                  >
                    <span className="text-[10px] font-mono text-indigo-400">{pg.step}</span>
                    <span className="hidden sm:inline">{pg.label}</span>
                  </span>
                );
              })}
            </div>

            {/* Scroll hint */}
            <span className="hidden lg:flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
              <span className="inline-block animate-bounce">↓</span> scroll to explore
            </span>
          </header>

          {/* ─── PAGES VIEWPORT ─── */}
          <div className="flex-1 relative overflow-hidden">
            <div
              style={{
                position: 'absolute',
                inset: '0',
                height: `${PAGE_COUNT * 100}%`,
                transform: `translate3d(0, -${pagesTranslatePercent}%, 0)`,
                willChange: 'transform',
              }}
            >
              {/* ═══ PAGE 1 — DASHBOARD (ORIGINAL STUDEXA DESIGN) ═══ */}
              <div
                style={{ height: `${100 / PAGE_COUNT}%` }}
                className="overflow-hidden px-2 sm:px-6 py-2 sm:py-4 flex flex-col justify-start"
              >
                <div className="mx-auto w-full max-w-7xl flex-1 min-h-0">
                  <div className="rounded-2xl border border-slate-800/90 bg-[#0b0e17] shadow-2xl overflow-hidden flex h-full">
                    
                    {/* Left Mini Sidebar (from original design) */}
                    <div className="hidden md:flex w-14 shrink-0 flex-col items-center justify-between border-r border-slate-800/70 bg-[#080a10] py-4">
                      <div className="flex flex-col items-center gap-4">
                        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
                          <Home size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <MessageSquare size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Trophy size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Upload size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <BookOpen size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Headphones size={15} />
                        </button>
                        <div className="h-7 w-7 rounded-full overflow-hidden ring-2 ring-indigo-400/30">
                          <img src="/images/dashboard/student_avatar.png" alt="Jordan Lee" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4">
                      
                      {/* Top Header: Greeting + Upload button */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                        <div>
                          <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                            Good evening, Jordan Lee
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Let's continue your studies where you left off.
                          </p>
                        </div>
                        <button type="button" className="flex items-center gap-2 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors self-start sm:self-center">
                          <Upload size={14} />
                          <span>Upload</span>
                        </button>
                      </div>

                      {/* Categories & Filter row */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                            Categories & Materials
                          </span>
                        </div>

                        {/* Tabs */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-lg bg-slate-800/90 border border-slate-700/80 px-3 py-1.5 text-xs font-bold text-white flex items-center gap-1.5 shadow-xs">
                            Materials <span className="rounded-full bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 text-[10px]">4</span>
                          </span>
                          <span className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                            Past Papers <span className="rounded-full bg-slate-800 text-slate-400 px-1.5 py-0.2 text-[10px]">2</span>
                          </span>
                          <span className="rounded-lg bg-slate-900/80 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                            Assignments & Docs <span className="rounded-full bg-slate-800 text-slate-400 px-1.5 py-0.2 text-[10px]">0</span>
                          </span>
                        </div>
                      </div>

                      {/* Search Bar + Preferences */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <div className="flex-1 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-400">
                            <Search size={13} className="text-slate-500" />
                            <span>Search in materials...</span>
                          </div>
                          <button type="button" className="flex items-center gap-1.5 rounded-xl bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300">
                            <Filter size={12} /> Filter
                          </button>
                        </div>
                        <span className="text-[11px] text-slate-400 hidden lg:inline">
                          Materials (4) • Prioritizing your subjects
                        </span>
                      </div>

                      {/* 4 Cards Grid Featuring Beautiful Vector Dummy Covers */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        {[
                          {
                            code: 'CS-401',
                            badge: 'PDF',
                            badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                            title: 'Neural Networks & Deep Learning',
                            subtitle: 'Lecture Notes · Units 1–5',
                            meta: '48 pages • PDF • 4.2 MB',
                            author: 'Jordan Lee',
                            likes: '184',
                            views: '1.4k',
                            colorScheme: 'indigo' as const,
                          },
                          {
                            code: 'SE-302',
                            badge: 'DOCX',
                            badgeBg: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                            title: 'Distributed Systems & Cloud Computing',
                            subtitle: 'Architecture & Protocols Specification',
                            meta: '32 pages • DOCX • 2.6 MB',
                            author: 'Sarah Chen',
                            likes: '96',
                            views: '820',
                            colorScheme: 'blue' as const,
                          },
                          {
                            code: 'CS-310',
                            badge: 'PDF',
                            badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                            title: 'Advanced Algorithms & Complexity',
                            subtitle: 'Asymptotic Analysis & Graph Theory',
                            meta: '44 pages • PDF • 3.8 MB',
                            author: 'David Miller',
                            likes: '230',
                            views: '2.1k',
                            colorScheme: 'emerald' as const,
                          },
                          {
                            code: 'AI-420',
                            badge: 'PPTX',
                            badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
                            title: 'Computer Vision & Edge Intelligence',
                            subtitle: 'Convolutional Pipelines & CNNs',
                            meta: '28 slides • PPTX • 5.1 MB',
                            author: 'Maya Patel',
                            likes: '142',
                            views: '1.1k',
                            colorScheme: 'amber' as const,
                          },
                        ].map((card) => (
                          <div
                            key={card.title}
                            className="rounded-xl border border-slate-800 bg-[#121623] p-2.5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm"
                          >
                            <div>
                              {/* Vector Document Cover Preview */}
                              <DocumentCoverPreview
                                code={card.code}
                                title={card.title}
                                subtitle={card.subtitle}
                                badge={card.badge}
                                badgeBg={card.badgeBg}
                                colorScheme={card.colorScheme}
                              />

                              {/* Title & Badge */}
                              <div className="mt-2.5 flex items-start gap-1.5">
                                <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold border ${card.badgeBg}`}>
                                  {card.badge}
                                </span>
                                <h4 className="text-xs font-bold text-slate-100 truncate leading-tight">
                                  {card.title}
                                </h4>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 truncate">
                                {card.meta}
                              </p>
                            </div>

                            {/* Author & Actions */}
                            <div className="mt-2 pt-2 border-t border-slate-800/80 flex flex-col gap-1.5">
                              <div className="flex items-center justify-between text-[10px] text-slate-400">
                                <span className="flex items-center gap-1 truncate max-w-[90px]">
                                  <span className="h-3.5 w-3.5 rounded-full bg-indigo-500/30 text-indigo-300 text-[8px] font-bold flex items-center justify-center">
                                    {card.author.charAt(0)}
                                  </span>
                                  <span className="truncate">{card.author}</span>
                                </span>
                                <span className="flex items-center gap-1.5 text-slate-500 text-[9px]">
                                  <ThumbsUp size={10} /> {card.likes}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-[11px] pt-1">
                                <span className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">
                                  View
                                </span>
                                <span className="text-slate-400 hover:text-slate-300 cursor-pointer flex items-center gap-1">
                                  <Bookmark size={10} /> Save as...
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Recently Uploaded List with Dummy Data */}
                      <div className="pt-2 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[11px] font-bold text-slate-300">
                            Recently Uploaded
                          </span>
                          <span className="text-[10px] text-indigo-400 hover:underline cursor-pointer">
                            View all uploads
                          </span>
                        </div>
                        <div className="space-y-1.5">
                          <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 px-3 py-1.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <FileText size={13} className="text-indigo-400" />
                              <span className="font-semibold text-slate-200 text-[11px]">Database Systems & Indexing Internals</span>
                              <span className="text-[10px] text-slate-500">· Computer Science</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span>Sarah Chen</span>
                              <Bookmark size={12} className="text-slate-500" />
                            </div>
                          </div>
                          <div className="rounded-lg bg-slate-900/60 border border-slate-800/70 px-3 py-1.5 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <FileText size={13} className="text-emerald-400" />
                              <span className="font-semibold text-slate-200 text-[11px]">Linear Algebra & Vector Calculus Notes</span>
                              <span className="text-[10px] text-slate-500">· Mathematics</span>
                            </div>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400">
                              <span>Alex Rivera</span>
                              <Bookmark size={12} className="text-slate-500" />
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ PAGE 2 — LIBRARY (ORIGINAL STUDEXA DESIGN) ═══ */}
              <div
                style={{ height: `${100 / PAGE_COUNT}%` }}
                className="overflow-hidden px-2 sm:px-6 py-2 sm:py-4 flex flex-col justify-start"
              >
                <div className="mx-auto w-full max-w-7xl flex-1 min-h-0">
                  <div className="rounded-2xl border border-slate-800/90 bg-[#0b0e17] shadow-2xl overflow-hidden flex h-full">
                    
                    {/* Left Mini Sidebar */}
                    <div className="hidden md:flex w-14 shrink-0 flex-col items-center justify-between border-r border-slate-800/70 bg-[#080a10] py-4">
                      <div className="flex flex-col items-center gap-4">
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Home size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <MessageSquare size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Trophy size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Upload size={16} />
                        </button>
                        {/* Active: Library */}
                        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
                          <BookOpen size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Headphones size={15} />
                        </button>
                        <div className="h-7 w-7 rounded-full overflow-hidden ring-2 ring-indigo-400/30">
                          <img src="/images/dashboard/student_avatar.png" alt="Jordan Lee" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-4">
                      
                      {/* Top Header: Title + Upload button + Grid/List toggle */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/60 pb-3">
                        <div>
                          <h3 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
                            Your Library
                          </h3>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Manage, review, and organize your study materials and downloads.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <button type="button" className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors">
                            <Plus size={14} />
                            <span>Upload Material</span>
                          </button>
                          <div className="flex items-center rounded-lg border border-slate-800 bg-slate-900/80 p-0.5">
                            <span className="rounded p-1 text-slate-400"><LayoutGrid size={13} /></span>
                            <span className="rounded p-1 text-slate-600"><List size={13} /></span>
                          </div>
                        </div>
                      </div>

                      {/* Tabs */}
                      <div className="flex items-center gap-4 border-b border-slate-800/60 pb-2">
                        <button type="button" className="text-xs font-bold text-indigo-400 border-b-2 border-indigo-500 pb-2 -mb-2.5 flex items-center gap-1.5">
                          <span>Saved</span>
                          <span className="rounded-full bg-indigo-500/20 text-indigo-300 px-1.5 py-0.2 text-[10px]">3</span>
                        </button>
                        <button type="button" className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5">
                          <span>Manage Uploads</span>
                          <span className="rounded-full bg-slate-800 text-slate-400 px-1.5 py-0.2 text-[10px]">4</span>
                        </button>
                        <button type="button" className="text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5">
                          <span>Recent Activity</span>
                          <span className="rounded-full bg-slate-800 text-slate-400 px-1.5 py-0.2 text-[10px]">12</span>
                        </button>
                      </div>

                      {/* Center Saved Materials List (Dummy Data) */}
                      <div className="flex-1 flex flex-col justify-start space-y-2.5 overflow-y-auto">
                        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                          <span className="flex items-center gap-1.5 font-semibold text-slate-300">
                            <CheckCircle2 size={13} className="text-emerald-400" />
                            <span>3 Study Materials Saved</span>
                          </span>
                          <span className="text-[11px] text-indigo-400">124 Total Pages • 10.6 MB Offline</span>
                        </div>

                        {[
                          {
                            title: 'Neural Networks & Deep Learning Architectures',
                            code: 'CS-401',
                            meta: '48 pages • PDF • 4.2 MB',
                            tag: 'AI & Data Science',
                            savedTime: 'Saved 2 days ago',
                            badge: 'PDF',
                            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
                          },
                          {
                            title: 'Distributed Systems & Cloud Computing Master Notes',
                            code: 'SE-302',
                            meta: '32 pages • DOCX • 2.6 MB',
                            tag: 'Software Engineering',
                            savedTime: 'Saved 4 days ago',
                            badge: 'DOCX',
                            badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
                          },
                          {
                            title: 'Advanced Algorithms & Complexity Analysis Handbook',
                            code: 'CS-310',
                            meta: '44 pages • PDF • 3.8 MB',
                            tag: 'Algorithms',
                            savedTime: 'Saved 1 week ago',
                            badge: 'PDF',
                            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
                          },
                        ].map((item) => (
                          <div
                            key={item.title}
                            className="rounded-xl border border-slate-800/90 bg-[#121623] p-3 flex items-center justify-between hover:border-slate-700 transition-colors shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-400">
                                <FileText size={18} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${item.badgeColor}`}>
                                    {item.badge}
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-bold text-white truncate">
                                    {item.title}
                                  </h4>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400 mt-1">
                                  <span className="font-mono text-slate-300">{item.code}</span>
                                  <span>•</span>
                                  <span>{item.meta}</span>
                                  <span>•</span>
                                  <span className="text-slate-500">{item.savedTime}</span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-3">
                              <button
                                type="button"
                                className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 px-3 py-1.5 text-xs font-semibold text-indigo-300 transition-colors"
                              >
                                <BookOpen size={12} />
                                <span>Read</span>
                              </button>
                              <button
                                type="button"
                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900 text-indigo-400 hover:text-white"
                              >
                                <Bookmark size={14} className="fill-indigo-400/40" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ PAGE 3 — MESSAGES (ORIGINAL STUDEXA DESIGN) ═══ */}
              <div
                style={{ height: `${100 / PAGE_COUNT}%` }}
                className="overflow-hidden px-2 sm:px-6 py-2 sm:py-4 flex flex-col justify-start"
              >
                <div className="mx-auto w-full max-w-7xl flex-1 min-h-0">
                  <div className="rounded-2xl border border-slate-800/90 bg-[#0b0e17] shadow-2xl overflow-hidden flex h-full">
                    
                    {/* Left Mini Sidebar */}
                    <div className="hidden md:flex w-14 shrink-0 flex-col items-center justify-between border-r border-slate-800/70 bg-[#080a10] py-4">
                      <div className="flex flex-col items-center gap-4">
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Home size={16} />
                        </button>
                        {/* Active: Messages */}
                        <button type="button" className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-xs">
                          <MessageSquare size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Trophy size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Upload size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <BookOpen size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Headphones size={15} />
                        </button>
                        <div className="h-7 w-7 rounded-full overflow-hidden ring-2 ring-indigo-400/30">
                          <img src="/images/dashboard/student_avatar.png" alt="Jordan Lee" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    </div>

                    {/* Chat Column (Left) + Peer Showcase (Right) */}
                    <div className="flex-1 min-w-0 flex flex-col md:flex-row h-full">
                      
                      {/* Left: Messages & Contact List */}
                      <div className="w-full md:w-64 lg:w-72 shrink-0 border-r border-slate-800/70 p-3 sm:p-4 flex flex-col space-y-3 bg-[#0a0d15]/60">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-indigo-400" />
                            <h3 className="text-sm font-bold text-white">Messages</h3>
                          </div>
                          <button type="button" className="flex items-center gap-1 rounded-lg bg-indigo-600/20 border border-indigo-500/30 px-2 py-1 text-[11px] font-bold text-indigo-300 hover:bg-indigo-600/30">
                            <Plus size={12} /> New
                          </button>
                        </div>

                        {/* Filter Tabs */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <span className="rounded-lg bg-slate-800 px-2.5 py-1 text-[11px] font-bold text-white flex items-center gap-1">
                            Chats <span className="rounded-full bg-indigo-500/20 text-indigo-300 px-1 text-[9px]">3</span>
                          </span>
                          <span className="rounded-lg px-2.5 py-1 text-[11px] font-medium text-slate-400">Requests</span>
                          <span className="rounded-lg px-2 py-1 text-[11px] font-medium text-slate-400 flex items-center gap-1">
                            <Search size={11} /> Find ID
                          </span>
                        </div>

                        {/* Contacts List with Realistic Dummy Peer Chats */}
                        <div className="space-y-1.5 flex-1">
                          <div className="rounded-xl bg-slate-800/80 border border-slate-700/70 p-2.5 flex items-start gap-2.5 cursor-pointer shadow-xs">
                            <div className="relative shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-[11px] shadow-xs">
                                SC
                              </div>
                              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0d15]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white truncate">Sarah Chen</span>
                                <span className="text-[9px] text-indigo-400 font-semibold">10m ago</span>
                              </div>
                              <p className="text-[11px] text-slate-300 truncate mt-0.5 font-medium">Can you send the Unit 3 assignment?</p>
                            </div>
                            <span className="shrink-0 rounded-full bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.2">2</span>
                          </div>

                          <div className="rounded-xl p-2.5 flex items-start gap-2.5 hover:bg-slate-900/60 transition-colors cursor-pointer">
                            <div className="relative shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-600 text-white font-bold text-[11px]">
                                DM
                              </div>
                              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-slate-500 ring-2 ring-[#0a0d15]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-200 truncate">David Miller</span>
                                <span className="text-[9px] text-slate-500">2h ago</span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">Thanks for sharing the formula sheet!</p>
                            </div>
                          </div>

                          <div className="rounded-xl p-2.5 flex items-start gap-2.5 hover:bg-slate-900/60 transition-colors cursor-pointer">
                            <div className="relative shrink-0">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 text-white font-bold text-[11px]">
                                ER
                              </div>
                              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-400 ring-2 ring-[#0a0d15]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-200 truncate">Elena Rostova</span>
                                <span className="text-[9px] text-slate-500">Yesterday</span>
                              </div>
                              <p className="text-[11px] text-slate-400 truncate mt-0.5">Meeting in library at 4:30 PM for revision</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right: Peer-to-Peer Student Messaging Hero */}
                      <div className="flex-1 p-5 sm:p-8 flex flex-col items-center justify-center text-center overflow-y-auto space-y-5 bg-[#0b0e17]">
                        {/* Central Icon */}
                        <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/15 border border-indigo-500/25 text-indigo-400 shadow-md">
                          <MessageSquare size={24} />
                          <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            <Shield size={10} />
                          </span>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h4 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                            Peer-to-Peer Student Messaging
                          </h4>
                          <p className="text-xs text-slate-400 max-w-md mt-1.5 leading-relaxed mx-auto">
                            Connect with classmates for academic discussions, exam preparation, and study collaboration in a secure, request-gated environment.
                          </p>
                        </div>

                        {/* 3 Feature Badges Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-xl text-left">
                          <div className="rounded-xl border border-slate-800 bg-[#0e121e] p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
                              <Users size={13} className="text-indigo-400" />
                              <span>Verified Peers</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Search classmates securely via their canonical 9-digit Student ID.
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-[#0e121e] p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
                              <Shield size={13} className="text-indigo-400" />
                              <span>Request-Gated</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Spam-free: Recipient must explicitly accept before any messages unlock.
                            </p>
                          </div>

                          <div className="rounded-xl border border-slate-800 bg-[#0e121e] p-3">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-300 mb-1">
                              <Zap size={13} className="text-indigo-400" />
                              <span>Realtime Sync</span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-normal">
                              Instant delivery, live typing status, and read receipts.
                            </p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button type="button" className="flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors">
                          <Users size={14} />
                          <span>Find a Student by ID →</span>
                        </button>

                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ PAGE 4 — PROFILE (ORIGINAL STUDEXA DESIGN) ═══ */}
              <div
                style={{ height: `${100 / PAGE_COUNT}%` }}
                className="overflow-hidden px-2 sm:px-6 py-2 sm:py-4 flex flex-col justify-start"
              >
                <div className="mx-auto w-full max-w-7xl flex-1 min-h-0">
                  <div className="rounded-2xl border border-slate-800/90 bg-[#0b0e17] shadow-2xl overflow-hidden flex h-full">
                    
                    {/* Left Mini Sidebar */}
                    <div className="hidden md:flex w-14 shrink-0 flex-col items-center justify-between border-r border-slate-800/70 bg-[#080a10] py-4">
                      <div className="flex flex-col items-center gap-4">
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Home size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <MessageSquare size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Trophy size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Upload size={16} />
                        </button>
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <BookOpen size={16} />
                        </button>
                      </div>

                      <div className="flex flex-col items-center gap-3">
                        <button type="button" className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:text-slate-300 transition-colors">
                          <Headphones size={15} />
                        </button>
                        {/* Active: Profile Avatar */}
                        <div className="h-7 w-7 rounded-full overflow-hidden ring-2 ring-indigo-400/30">
                          <img src="/images/dashboard/student_avatar.png" alt="Jordan Lee" className="h-full w-full object-cover" />
                        </div>
                      </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 min-w-0 p-3 sm:p-5 flex flex-col justify-between overflow-y-auto space-y-3">
                      
                      {/* Top Profile Banner with Dummy Profile Data */}
                      <div className="relative rounded-xl overflow-hidden border border-slate-800/90 bg-[#121623]">
                        {/* Cover image header */}
                        <div className="h-20 sm:h-24 w-full bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 relative p-3 flex justify-end">
                          <button type="button" className="flex h-7 w-7 items-center justify-center rounded-full bg-black/40 text-slate-300 hover:text-white backdrop-blur-xs">
                            <Camera size={13} />
                          </button>
                        </div>

                        {/* Avatar & Details */}
                        <div className="px-4 sm:px-6 pb-3 pt-0">
                          <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-8 sm:-mt-10 gap-3">
                            <div className="flex items-end gap-3">
                              <div className="relative">
                                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-full overflow-hidden ring-4 ring-[#121623] shadow-lg bg-slate-800">
                                  <img src="/images/dashboard/student_avatar.png" alt="Jordan Lee" className="h-full w-full object-cover" />
                                </div>
                                <span className="absolute bottom-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xs">
                                  <Camera size={10} />
                                </span>
                              </div>
                              <div className="mb-0.5">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-base sm:text-xl font-bold text-white">Jordan Lee</h3>
                                  <span className="rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 text-[9px] font-bold">
                                    VERIFIED STUDENT
                                  </span>
                                </div>
                                <p className="text-[11px] text-slate-400 mt-0.5 flex flex-wrap items-center gap-1.5">
                                  <span>University Institute of Technology</span>
                                  <span>•</span>
                                  <span>Computer Science & Engineering</span>
                                  <span>•</span>
                                  <span>3rd Year · Sem 6</span>
                                </p>
                              </div>
                            </div>

                            {/* Stats */}
                            <div className="flex items-center gap-3 text-[11px] text-slate-400 pb-1">
                              <span><strong className="text-white">148</strong> Likes</span>
                              <span>•</span>
                              <span><strong className="text-white">2.4k</strong> Views</span>
                              <span>•</span>
                              <span><strong className="text-white">4</strong> Uploads</span>
                              <span>•</span>
                              <span><strong className="text-white">18</strong> Saved</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2 Columns: Uploads & Academic Details */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 flex-1 min-h-0">
                        
                        {/* Left Column: Uploads List */}
                        <div className="lg:col-span-8 space-y-2">
                          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                            <div className="flex items-center gap-2">
                              <button type="button" className="rounded-lg bg-slate-800 px-3 py-1 text-xs font-bold text-white shadow-xs">
                                My Uploads <span className="text-[10px] text-indigo-400">4</span>
                              </button>
                              <button type="button" className="px-3 py-1 text-xs font-medium text-slate-400 hover:text-white">
                                Recent Activity <span className="text-[10px] text-slate-500">5</span>
                              </button>
                            </div>
                            <span className="text-[11px] text-indigo-400 hover:underline cursor-pointer">View All (4)</span>
                          </div>

                          <div className="space-y-1.5">
                            {[
                              { title: 'Neural Networks & Deep Learning Architectures', tag: 'AI & Data Science', time: 'Uploaded 3 days ago' },
                              { title: 'Distributed Systems & Cloud Computing Master Notes', tag: 'Software Eng', time: 'Uploaded 1 week ago' },
                              { title: 'Database Query Optimization & Indexing Guide', tag: 'Databases', time: 'Uploaded 2 weeks ago' },
                              { title: 'Discrete Mathematics & Graph Theory Formulas', tag: 'Mathematics', time: 'Uploaded 3 weeks ago' },
                            ].map((item) => (
                              <div key={item.title} className="rounded-xl border border-slate-800/80 bg-[#121623] p-2.5 flex items-center justify-between hover:border-slate-700 transition-colors">
                                <div className="flex items-center gap-2.5">
                                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                    <FileText size={13} />
                                  </div>
                                  <div>
                                    <h5 className="text-xs font-semibold text-slate-100">{item.title}</h5>
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                      <span className="rounded bg-slate-800 px-1.5 py-0.2 text-[9px] font-medium text-slate-300">{item.tag}</span>
                                      <span>{item.time}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right Column: Academic Details Card */}
                        <div className="lg:col-span-4 rounded-xl border border-slate-800/80 bg-[#121623] p-3 flex flex-col justify-between space-y-2.5">
                          <div>
                            <div className="flex items-center justify-between border-b border-slate-800/70 pb-1.5 mb-2">
                              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                                <Users size={12} className="text-indigo-400" /> Academic Details
                              </span>
                              <span className="text-[10px] text-indigo-400 hover:underline cursor-pointer">Edit</span>
                            </div>
                            
                            <div className="space-y-1.5 text-[11px]">
                              <div>
                                <span className="text-slate-500 text-[10px] block">Institution</span>
                                <span className="text-slate-200 font-medium truncate block">University Institute of Technology</span>
                              </div>
                              <div>
                                <span className="text-slate-500 text-[10px] block">Course / Program</span>
                                <span className="text-slate-200 font-medium">B.Tech (Computer Science & AI)</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] pt-0.5">
                                <div><span className="text-slate-500 text-[10px]">Year: </span><span className="text-slate-200 font-medium">3rd</span></div>
                                <div><span className="text-slate-500 text-[10px]">Sem: </span><span className="text-slate-200 font-medium">6</span></div>
                              </div>
                              <div className="pt-0.5">
                                <span className="text-slate-500 text-[10px] block">Student QuickID</span>
                                <span className="text-indigo-400 font-mono font-bold text-xs">STU-9402-X</span>
                              </div>
                            </div>
                          </div>

                          {/* Preferred Subjects */}
                          <div className="pt-2 border-t border-slate-800/70">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                              Preferred Subjects
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {['Machine Learning', 'Distributed Systems', 'Algorithms', 'Cloud Computing', 'Cybersecurity'].map((sub) => (
                                <span key={sub} className="rounded bg-slate-900 border border-slate-800 px-1.5 py-0.5 text-[9px] font-medium text-slate-300">
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>

                      </div>

                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ─── FOOTER ─── */}
          <div className="shrink-0 px-4 sm:px-8 py-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-indigo-400" />
              <span>Authentic Studexa dark components · Zero neon glare</span>
            </span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-500 font-mono">
              <span className="inline-block animate-bounce">↓</span> keep scrolling
            </span>
          </div>
        </div>

        {/* ── Layer 2: TOP WINDOW (z-20) ──
            Contains the TOP HALF (0vh to 50vh) of the exact previous Dark Mode section content.
            Moves upward by -100% as the user scrolls down. */}
        <div
          className="absolute top-0 left-0 right-0 h-[50vh] z-20 overflow-hidden bg-transparent shadow-2xl"
          style={{
            transform: `translate3d(0, ${-shutterOpenness * 100}%, 0)`,
            willChange: 'transform',
          }}
        >
          {/* Inner container pinned to full height */}
          <div className="absolute top-0 left-0 right-0 h-[100vh] w-full">
            <PreviousDarkModeSectionContent />
          </div>
        </div>

        {/* ── Layer 3: BOTTOM WINDOW (z-20) ──
            Contains the BOTTOM HALF (50vh to 100vh) of the exact previous Dark Mode section content.
            Moves downward by +100% as the user scrolls down. */}
        <div
          className="absolute bottom-0 left-0 right-0 h-[50vh] z-20 overflow-hidden bg-transparent shadow-2xl"
          style={{
            transform: `translate3d(0, ${shutterOpenness * 100}%, 0)`,
            willChange: 'transform',
          }}
        >
          {/* Inner container shifted up by -50vh so the bottom half shows seamlessly */}
          <div className="absolute -top-[50vh] left-0 right-0 h-[100vh] w-full">
            <PreviousDarkModeSectionContent />
          </div>
        </div>

      </div>
    </div>
    </>
  );
}
