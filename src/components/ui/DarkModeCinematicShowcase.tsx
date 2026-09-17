import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  Moon,
  Pause,
  Play,
  RotateCcw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { Logo } from './Logo';

export interface DarkModeCinematicShowcaseProps {
  isOpen: boolean;
  onClose: () => void;
}

type ShowcasePage = 'dashboard' | 'library' | 'messages' | 'profile';

interface PageMeta {
  id: ShowcasePage;
  label: string;
  step: string;
  badge: string;
  tagline: string;
}

const SHOWCASE_PAGES: PageMeta[] = [
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

const AUTO_PLAY_DURATION = 5500; // 5.5s per screen

export function DarkModeCinematicShowcase({ isOpen, onClose }: DarkModeCinematicShowcaseProps) {
  // 'entering' -> split opens
  // 'active'   -> showcase running
  // 'exiting'  -> split closes
  // 'closed'   -> unmounted
  const [phase, setPhase] = useState<'entering' | 'active' | 'exiting' | 'closed'>('closed');
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);

  const activePage = SHOWCASE_PAGES[activePageIndex];
  const progressTimerRef = useRef<number | null>(null);

  // Sync with isOpen prop
  useEffect(() => {
    if (isOpen) {
      setPhase('entering');
      setActivePageIndex(0);
      setIsPaused(false);
      setProgress(0);

      // Lock body scroll
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      // Transition from 'entering' to 'active' after split animation finishes
      const enterTimer = window.setTimeout(() => {
        setPhase('active');
      }, 1300);

      return () => {
        clearTimeout(enterTimer);
        document.body.style.overflow = originalOverflow;
      };
    } else {
      setPhase('closed');
    }
  }, [isOpen]);

  // Handle Close with smooth reverse split transition
  const handleInitiateClose = () => {
    if (phase === 'exiting' || phase === 'closed') return;
    setPhase('exiting');
    const exitTimer = window.setTimeout(() => {
      setPhase('closed');
      onClose();
    }, 1300);
    return () => clearTimeout(exitTimer);
  };

  // Keyboard shortcut (Escape to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        handleInitiateClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, phase, activePageIndex]);

  // Page sequencing timer & progress bar animation
  useEffect(() => {
    if (phase !== 'active' || isPaused) return;

    setProgress(0);
    const intervalTime = 50; // update every 50ms
    const totalSteps = AUTO_PLAY_DURATION / intervalTime;
    let stepCount = 0;

    progressTimerRef.current = window.setInterval(() => {
      stepCount++;
      const currentPct = Math.min((stepCount / totalSteps) * 100, 100);
      setProgress(currentPct);

      if (stepCount >= totalSteps) {
        clearInterval(progressTimerRef.current!);
        if (activePageIndex < SHOWCASE_PAGES.length - 1) {
          setActivePageIndex((prev) => prev + 1);
        } else {
          // Reached end of Profile screen -> trigger return split animation!
          handleInitiateClose();
        }
      }
    }, intervalTime);

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [phase, activePageIndex, isPaused]);

  const handleNext = () => {
    if (activePageIndex < SHOWCASE_PAGES.length - 1) {
      setActivePageIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      handleInitiateClose();
    }
  };

  const handlePrev = () => {
    if (activePageIndex > 0) {
      setActivePageIndex((prev) => prev - 1);
      setProgress(0);
    }
  };

  if (!isOpen && phase === 'closed') return null;

  // Split-shutter animation variants (slow, smooth, synchronized cinematic easing)
  const cinematicEase: [number, number, number, number] = [0.76, 0, 0.24, 1]; // Premium smooth ease curve

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* ── 1. CINEMATIC SPLIT SHUTTERS (TOP & BOTTOM HALVES) ── */}
      
      {/* TOP SECTION SHUTTER: Moves upward (-100%) */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{
          y: phase === 'entering' || phase === 'active' ? '-100%' : '0%',
        }}
        transition={{
          duration: 1.3,
          ease: cinematicEase,
        }}
        className="fixed top-0 left-0 right-0 h-[50vh] z-[70] bg-[#f8f9fc] border-b border-indigo-500/20 shadow-2xl flex flex-col justify-end overflow-hidden"
      >
        <div className="p-6 sm:p-8 flex items-center justify-between text-slate-400 opacity-60">
          <div className="flex items-center gap-3">
            <Logo height={28} />
          </div>
          <span className="text-[11px] font-mono tracking-widest uppercase">
            Studexa // Day Mode
          </span>
        </div>
        {/* Subtle split seam lighting line at bottom edge of top panel */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />
      </motion.div>

      {/* BOTTOM SECTION SHUTTER: Moves downward (+100%) */}
      <motion.div
        initial={{ y: '0%' }}
        animate={{
          y: phase === 'entering' || phase === 'active' ? '100%' : '0%',
        }}
        transition={{
          duration: 1.3,
          ease: cinematicEase,
        }}
        className="fixed bottom-0 left-0 right-0 h-[50vh] z-[70] bg-[#f8f9fc] border-t border-indigo-500/20 shadow-2xl flex flex-col justify-start overflow-hidden"
      >
        {/* Subtle split seam lighting line at top edge of bottom panel */}
        <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-80" />
        <div className="p-6 sm:p-8 flex items-center justify-between text-slate-400 opacity-60">
          <span className="text-[11px] font-mono tracking-widest uppercase">
            Academic Ecosystem
          </span>
          <span className="text-xs text-slate-400">Lexon IT Solutions</span>
        </div>
      </motion.div>

      {/* ── 2. FULL-SCREEN DEDICATED DARK MODE SHOWCASE WINDOW ── */}
      <div className="fixed inset-0 z-50 bg-[#080a0f] text-slate-100 flex flex-col overflow-hidden font-sans">
        
        {/* Ambient deep dark glows (subtle, non-neon, professional depth) */}
        <div className="pointer-events-none absolute -top-40 left-1/4 h-[350px] w-[500px] rounded-full bg-indigo-900/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-40 right-1/4 h-[350px] w-[500px] rounded-full bg-purple-900/10 blur-[120px]" />

        {/* ── SHOWCASE TOP NAVIGATION BAR ── */}
        <header className="relative z-20 flex shrink-0 items-center justify-between border-b border-slate-800/80 bg-[#0c0f17]/90 px-4 py-3 sm:px-8 backdrop-blur-md">
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center">
              <Logo height={30} />
            </div>

            <div className="hidden md:flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-[11px] font-bold text-indigo-300">
              <Moon size={12} className="text-indigo-400" />
              <span>NATIVE DARK THEME SHOWCASE</span>
            </div>
          </div>

          {/* Sequential Page Progress Step Indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {SHOWCASE_PAGES.map((page, idx) => {
              const isActive = activePageIndex === idx;
              const isPassed = activePageIndex > idx;

              return (
                <button
                  key={page.id}
                  type="button"
                  onClick={() => {
                    setActivePageIndex(idx);
                    setProgress(0);
                  }}
                  className={`relative flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-800 text-white shadow-xs ring-1 ring-white/10'
                      : isPassed
                      ? 'text-slate-400 hover:text-slate-200'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  <span className="text-[10px] font-mono text-indigo-400">
                    {page.step}
                  </span>
                  <span className="hidden sm:inline">{page.label}</span>

                  {/* Active Page Smooth Progress Bar */}
                  {isActive && (
                    <div className="absolute bottom-0 left-2 right-2 h-0.5 overflow-hidden rounded-full bg-slate-700">
                      <div
                        className="h-full bg-indigo-400 transition-all duration-75"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Interactive Player Controls & Exit */}
          <div className="flex items-center gap-2">
            {/* Pause / Play button */}
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
              title={isPaused ? 'Resume tour' : 'Pause tour'}
            >
              {isPaused ? <Play size={14} /> : <Pause size={14} />}
            </button>

            {/* Prev / Next buttons */}
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrev}
                disabled={activePageIndex === 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                title="Previous Screen"
              >
                <ArrowLeft size={14} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-800 bg-slate-900/80 text-slate-300 hover:border-slate-700 hover:text-white transition-colors cursor-pointer"
                title={activePageIndex === SHOWCASE_PAGES.length - 1 ? 'Finish & Return' : 'Next Screen'}
              >
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Return / Close Transition Button */}
            <button
              type="button"
              onClick={handleInitiateClose}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700/80 bg-slate-800/90 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition-colors cursor-pointer ml-1"
              title="Return to Page (Esc)"
            >
              <X size={14} />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </header>

        {/* ── SHOWCASE BODY VIEWPORT ── */}
        <main className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8 flex flex-col justify-center">
          <div className="mx-auto w-full max-w-6xl">
            
            {/* Screen Header Info Pill */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-4">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-indigo-400 uppercase">
                  {activePage.badge}
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                  {activePage.label} in Dark Theme
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 max-w-md">
                {activePage.tagline}
              </p>
            </div>

            {/* Sequential Page Screen with Smooth Cinematic Transitions */}
            <div className="relative min-h-[460px] sm:min-h-[500px]">
              <AnimatePresence mode="wait">
                {/* ── SCREEN 1: DASHBOARD ── */}
                {activePage.id === 'dashboard' && (
                  <motion.div
                    key="dashboard"
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -12 }}
                    transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                    className="rounded-2xl border border-slate-800 bg-[#0e111a] shadow-2xl p-4 sm:p-6 space-y-6"
                  >
                    {/* Dashboard Header Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                            Good evening, Alex Kumar
                          </h3>
                          <span className="flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                          You have 3 verified materials updated in Semester 5 (Computer Science).
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                        >
                          <Upload size={14} />
                          <span>Upload Material</span>
                        </button>
                      </div>
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      <span className="rounded-lg bg-indigo-500/20 border border-indigo-500/30 px-3 py-1.5 text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <FileText size={13} /> Study Notes (128)
                      </span>
                      <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <Clock size={13} /> Past Exam Papers (42)
                      </span>
                      <span className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs font-medium text-slate-400 flex items-center gap-1.5">
                        <Sparkles size={13} /> Cheatsheets (18)
                      </span>
                    </div>

                    {/* Dashboard Material Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Card 1 */}
                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-[10px] font-bold text-indigo-400 border border-indigo-500/20">
                              PDF • 4.2 MB
                            </span>
                            <span className="text-[11px] text-amber-400 font-semibold">★ 4.9 (1.2k)</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">
                            Distributed Systems & Paxos Consensus Notes
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            Unit 1 to 4 handwritten diagrams, fault tolerance models, and Raft election proofs.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Alex K. • NIT Trichy</span>
                          <button type="button" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                            <Download size={13} /> View
                          </button>
                        </div>
                      </div>

                      {/* Card 2 */}
                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                              PDF • 2.8 MB
                            </span>
                            <span className="text-[11px] text-amber-400 font-semibold">★ 4.8 (890)</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">
                            Operating Systems Midterm 2024 Solved Papers
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            Step-by-step solutions for multi-threading deadlocks and virtual memory paging.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Sneha Nair (Top Author)</span>
                          <button type="button" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                            <Download size={13} /> View
                          </button>
                        </div>
                      </div>

                      {/* Card 3 */}
                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-4 flex flex-col justify-between hover:border-slate-700 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="rounded-md bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                              DOCX • 1.1 MB
                            </span>
                            <span className="text-[11px] text-amber-400 font-semibold">★ 5.0 (2.4k)</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-100 leading-snug">
                            Graph Theory & Network Flow Cheat Sheet
                          </h4>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                            Quick reference formulas for Dijkstra, Bellman-Ford, Prim, and Kruskal algorithms.
                          </p>
                        </div>
                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                          <span className="text-slate-400">Prof. Rao M.</span>
                          <button type="button" className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold">
                            <Download size={13} /> View
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── SCREEN 2: LIBRARY ── */}
                {activePage.id === 'library' && (
                  <motion.div
                    key="library"
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -12 }}
                    transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                    className="rounded-2xl border border-slate-800 bg-[#0e111a] shadow-2xl p-4 sm:p-6 space-y-6"
                  >
                    {/* Library Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                          My Academic Library
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                          Manage your saved study collections, past papers, and personal uploads.
                        </p>
                      </div>

                      {/* Tab Controls */}
                      <div className="flex items-center gap-1 rounded-xl bg-slate-900 p-1 border border-slate-800">
                        <button type="button" className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-xs">
                          Saved (18)
                        </button>
                        <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white">
                          Manage Uploads (6)
                        </button>
                        <button type="button" className="rounded-lg px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white">
                          Recent Activity
                        </button>
                      </div>
                    </div>

                    {/* Search & Action Bar */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-3.5 py-2 text-xs text-slate-300">
                        <Search size={14} className="text-slate-500" />
                        <span>Filter saved notes by subject, unit, or professor...</span>
                      </div>
                      <span className="text-xs text-slate-400 hidden sm:inline">Showing 18 saved items</span>
                    </div>

                    {/* Library Items List */}
                    <div className="space-y-3">
                      {/* Row 1 */}
                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold text-xs">
                            PDF
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">
                              Advanced Algorithms & Dynamic Programming (Unit 1 to 5)
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              B.Tech CSE • Sem 5 • 48 Pages • 5.6 MB • Bookmarked 2 days ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            Approved & Published
                          </span>
                          <button type="button" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700">
                            Read
                          </button>
                        </div>
                      </div>

                      {/* Row 2 */}
                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 font-bold text-xs">
                            PDF
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">
                              Computer Networks: TCP/IP & Socket Programming Architecture
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              B.Tech CSE • Sem 5 • 22 Pages • 2.1 MB • Bookmarked 1 week ago
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                            Approved & Published
                          </span>
                          <button type="button" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700">
                            Read
                          </button>
                        </div>
                      </div>

                      {/* Row 3 */}
                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors">
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs">
                            DOC
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">
                              Theory of Computation: Turing Machines & Regular Grammars
                            </h4>
                            <p className="text-xs text-slate-400 mt-0.5">
                              B.Tech CSE • Sem 4 • 35 Pages • 3.4 MB • Personal Upload
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                            Under Review
                          </span>
                          <button type="button" className="rounded-lg bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-slate-700">
                            Manage
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── SCREEN 3: MESSAGES ── */}
                {activePage.id === 'messages' && (
                  <motion.div
                    key="messages"
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -12 }}
                    transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                    className="rounded-2xl border border-slate-800 bg-[#0e111a] shadow-2xl overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[460px]"
                  >
                    {/* Left: Chat Contacts Sidebar */}
                    <div className="md:col-span-4 border-r border-slate-800/80 bg-[#0b0e16] p-4 flex flex-col space-y-4">
                      <div>
                        <h3 className="text-sm font-bold text-white tracking-tight">Study Circles</h3>
                        <p className="text-[11px] text-slate-400">Direct peer discussions</p>
                      </div>

                      <div className="flex items-center gap-2 rounded-lg bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs text-slate-400">
                        <Search size={13} />
                        <span>Search messages...</span>
                      </div>

                      <div className="space-y-1.5 flex-1">
                        {/* Active Conversation */}
                        <div className="rounded-xl bg-slate-800/90 border border-slate-700/80 p-3 flex items-start gap-3 cursor-pointer">
                          <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                              SN
                            </div>
                            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#0b0e16]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-white truncate">Sneha Nair</span>
                              <span className="text-[10px] text-indigo-400 font-mono">10:45 AM</span>
                            </div>
                            <p className="text-[11px] text-slate-300 truncate mt-0.5">
                              Yes! Just uploaded the verified proof...
                            </p>
                          </div>
                        </div>

                        {/* Other Conversations */}
                        <div className="rounded-xl p-3 flex items-start gap-3 hover:bg-slate-900/60 transition-colors cursor-pointer">
                          <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-700 text-white font-bold text-xs">
                              AK
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-200 truncate">Arun Kumar</span>
                              <span className="text-[10px] text-slate-500 font-mono">Yesterday</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              Can you check problem 4 on page 12?
                            </p>
                          </div>
                        </div>

                        <div className="rounded-xl p-3 flex items-start gap-3 hover:bg-slate-900/60 transition-colors cursor-pointer">
                          <div className="relative">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-white font-bold text-xs">
                              CS
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-semibold text-slate-200 truncate">CSE Study Group</span>
                              <span className="text-[10px] text-slate-500 font-mono">Sep 15</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate mt-0.5">
                              Karthik added OS Midsem questions
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right: Active Chat Area */}
                    <div className="md:col-span-8 flex flex-col justify-between p-4 sm:p-5 bg-[#0e111a]">
                      {/* Active Chat Header */}
                      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600 text-white font-bold text-xs">
                            SN
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-white">Sneha Nair</span>
                              <span className="rounded bg-indigo-500/20 px-1.5 py-0.2 text-[9px] font-bold text-indigo-400">
                                Top Contributor
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              NIT Trichy • CSE Sem 5 • Online
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Chat Messages Thread */}
                      <div className="space-y-3 py-4">
                        {/* Incoming message */}
                        <div className="flex items-start gap-2.5 max-w-[85%]">
                          <div className="rounded-2xl rounded-tl-sm bg-slate-800/90 border border-slate-700/60 p-3 text-xs text-slate-200 shadow-sm leading-relaxed">
                            Hey Alex! Did you manage to solve the deadlock concurrency proof from the 2024 Mid-Sem paper?
                          </div>
                        </div>

                        {/* Outgoing message */}
                        <div className="flex items-start justify-end gap-2.5">
                          <div className="rounded-2xl rounded-tr-sm bg-indigo-600 text-white p-3 text-xs shadow-sm leading-relaxed max-w-[85%]">
                            I was working on it earlier today! The mutex timing graph was confusing on question 3.
                          </div>
                        </div>

                        {/* Incoming message with Document Attachment */}
                        <div className="flex items-start gap-2.5 max-w-[85%]">
                          <div className="rounded-2xl rounded-tl-sm bg-slate-800/90 border border-slate-700/60 p-3 text-xs text-slate-200 shadow-sm leading-relaxed space-y-2">
                            <p>Here is my verified solution sheet with the step-by-step semaphore breakdown:</p>
                            
                            {/* Document attachment card */}
                            <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-900 border border-slate-700 p-2.5">
                              <div className="flex items-center gap-2">
                                <FileText size={16} className="text-indigo-400" />
                                <div>
                                  <div className="font-bold text-slate-100 text-[11px]">
                                    OS_MidSem_2025_Solved.pdf
                                  </div>
                                  <div className="text-[10px] text-slate-400">3.4 MB • 6 Pages</div>
                                </div>
                              </div>
                              <span className="text-indigo-400 hover:text-indigo-300 font-bold text-[11px] cursor-pointer">
                                View Note →
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Bottom Chat Input Bar */}
                      <div className="pt-2 border-t border-slate-800/80 flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value="Thanks Sneha! Reviewing the semaphore steps now..."
                          className="flex-1 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-xs text-slate-300 focus:outline-none"
                        />
                        <button
                          type="button"
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm hover:bg-indigo-500"
                        >
                          <Send size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── SCREEN 4: PROFILE ── */}
                {activePage.id === 'profile' && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, scale: 0.98, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 1.02, y: -12 }}
                    transition={{ duration: 0.7, ease: [0.25, 1, 0.5, 1] }}
                    className="rounded-2xl border border-slate-800 bg-[#0e111a] shadow-2xl p-4 sm:p-6 space-y-6"
                  >
                    {/* Profile Banner & Identity Header */}
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-[#131724]">
                      {/* Cover Photo */}
                      <div className="h-28 sm:h-32 w-full bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 flex items-end p-4">
                        <span className="text-[10px] font-mono text-indigo-300/60 uppercase tracking-widest">
                          National Institute of Technology • Computer Science
                        </span>
                      </div>

                      {/* Avatar & Handle info */}
                      <div className="px-6 pb-5 pt-0">
                        <div className="flex flex-col sm:flex-row sm:items-end justify-between -mt-10 sm:-mt-12 gap-4">
                          <div className="flex items-end gap-4">
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-600 text-white font-extrabold text-2xl ring-4 ring-[#131724] shadow-lg">
                              AK
                            </div>
                            <div className="mb-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-xl font-bold text-white">Alex Kumar</h3>
                                <CheckCircle2 size={16} className="text-emerald-400" />
                              </div>
                              <p className="text-xs text-slate-400">@alex_kumar • QuickID: QL-88210</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-3 py-1 text-xs font-semibold text-indigo-300">
                              3rd Year • Semester 5
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Academic Stats Metrics Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-3 text-center">
                        <span className="text-[11px] text-slate-400 font-medium">Karma Points</span>
                        <p className="text-lg sm:text-xl font-black text-amber-400 mt-0.5">1,420</p>
                        <span className="text-[10px] text-slate-500">Top 5% in Branch</span>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-3 text-center">
                        <span className="text-[11px] text-slate-400 font-medium">Verified Uploads</span>
                        <p className="text-lg sm:text-xl font-black text-indigo-400 mt-0.5">24</p>
                        <span className="text-[10px] text-slate-500">100% Moderated</span>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-3 text-center">
                        <span className="text-[11px] text-slate-400 font-medium">Saved Resources</span>
                        <p className="text-lg sm:text-xl font-black text-purple-400 mt-0.5">48</p>
                        <span className="text-[10px] text-slate-500">Exam Library</span>
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-[#131724] p-3 text-center">
                        <span className="text-[11px] text-slate-400 font-medium">Author Rating</span>
                        <p className="text-lg sm:text-xl font-black text-emerald-400 mt-0.5">4.9 ★</p>
                        <span className="text-[10px] text-slate-500">Across 3,800+ downloads</span>
                      </div>
                    </div>

                    {/* Preferred Subjects Badges */}
                    <div className="rounded-xl border border-slate-800 bg-[#131724] p-4">
                      <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5">
                        Enrolled Subjects & Interests
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          'Data Structures & Algorithms',
                          'Operating Systems',
                          'Database Management Systems',
                          'Computer Networks',
                          'Distributed Systems',
                        ].map((sub) => (
                          <span
                            key={sub}
                            className="rounded-lg bg-slate-900 border border-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Showcase Footer Note with Return Hint */}
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 border-t border-slate-800/60 pt-4">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-indigo-400" />
                <span>Authentic Studexa dark interface components • Zero neon glare</span>
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleInitiateClose}
                  className="text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
                >
                  <RotateCcw size={12} />
                  <span>Return to landing page</span>
                </button>
              </div>
            </div>

          </div>
        </main>

      </div>
    </div>
  );
}
