import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Compass,
  FileText,
  GraduationCap,
  Layers,
  MessageSquare,
  Search,
  ShieldCheck,
  Sparkles,
  Trophy,
  Upload,
} from 'lucide-react';
import {
  AnimatePresence,
  motion,
  useScroll,
  useTransform,
  useInView,
  animate,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Logo } from '../components/ui/Logo';
import { Footer } from '../components/ui/Footer';
import { DarkModeScrollShowcase } from '../components/ui/DarkModeScrollShowcase';
/* ── TYPEWRITER TEXT EFFECT COMPONENT ── */
function TypewriterText({ text, delay = 0, speed = 0.03 }: { text: string; delay?: number; speed?: number }) {
  const letters = Array.from(text);
  return (
    <motion.span
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-20px' }}
      variants={{
        hidden: { opacity: 1 },
        visible: {
          opacity: 1,
          transition: { delayChildren: delay, staggerChildren: speed },
        },
      }}
    >
      {letters.map((char, index) => (
        <motion.span
          key={index}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1 },
          }}
        >
          {char}
        </motion.span>
      ))}
    </motion.span>
  );
}

/* ── SCROLL-TRIGGERED NUMBER COUNT-UP COMPONENT ── */
function CountUpNumber({
  target,
  duration = 1.8,
  prefix = '',
  suffix = '',
  decimals = 0,
}: {
  target: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: false, amount: 0.3 });
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isInView) {
      setDisplayValue(0);
      return;
    }

    const controls = animate(0, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => {
        setDisplayValue(value);
      },
    });

    return () => controls.stop();
  }, [isInView, target, duration]);

  const formatted =
    decimals > 0
      ? displayValue.toFixed(decimals)
      : Math.floor(displayValue).toLocaleString();

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}{formatted}{suffix}
    </span>
  );
}

/* ── INTERACTIVE 3D HERO DASHBOARD CARD WITH CURSOR-TRACKING MOVEMENT ── */
function HeroInteractiveCard() {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Normalized cursor coordinates (-0.5 to 0.5)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for buttery smooth motion without lag or sudden snap
  const springX = useSpring(mouseX, { stiffness: 175, damping: 22, mass: 0.5 });
  const springY = useSpring(mouseY, { stiffness: 175, damping: 22, mass: 0.5 });

  // 3D rotation based on cursor position
  const rotateX = useTransform(springY, [-0.5, 0.5], ['7.5deg', '-7.5deg']);
  const rotateY = useTransform(springX, [-0.5, 0.5], ['-7.5deg', '7.5deg']);

  // Dynamic translational movement towards cursor position
  const translateX = useTransform(springX, [-0.5, 0.5], [-16, 16]);
  const translateY = useTransform(springY, [-0.5, 0.5], [-16, 16]);

  // Enhanced parallax for the floating "500+ Students" badge
  const badgeTranslateX = useTransform(springX, [-0.5, 0.5], [-26, 26]);
  const badgeTranslateY = useTransform(springY, [-0.5, 0.5], [-26, 26]);

  // Dynamic cursor lighting glare position (in percentages)
  const glowX = useTransform(springX, [-0.5, 0.5], ['15%', '85%']);
  const glowY = useTransform(springY, [-0.5, 0.5], ['15%', '85%']);
  const glowBackground = useMotionTemplate`radial-gradient(650px circle at ${glowX} ${glowY}, rgba(99, 102, 241, 0.09), transparent 65%)`;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    if (width === 0 || height === 0) return;

    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;

    const xPct = Math.max(-0.5, Math.min(0.5, clientX / width - 0.5));
    const yPct = Math.max(-0.5, Math.min(0.5, clientY / height - 0.5));

    mouseX.set(xPct);
    mouseY.set(yPct);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.5, ease: 'easeOut' }}
      className="mt-16 relative mx-auto w-full max-w-5xl [perspective:1400px]"
    >
      <motion.div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          x: translateX,
          y: translateY,
          transformStyle: 'preserve-3d',
        }}
        className="rounded-3xl border border-card-border/60 bg-surface/50 p-2 sm:p-3 shadow-2xl backdrop-blur-xl transition-shadow duration-300 hover:shadow-indigo-500/10 cursor-pointer relative"
      >
        {/* Dynamic cursor sheen / glare following cursor */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl transition-opacity duration-500 z-30"
          style={{
            opacity: isHovered ? 1 : 0,
            background: glowBackground,
          }}
        />

        <div className="rounded-2xl border border-card-border bg-surface-container overflow-hidden shadow-inner">
           {/* Mock UI Header */}
           <div className="flex items-center gap-2 px-4 py-3 border-b border-card-border bg-surface-container-high/50">
             <div className="h-3 w-3 rounded-full bg-rose-400" />
             <div className="h-3 w-3 rounded-full bg-amber-400" />
             <div className="h-3 w-3 rounded-full bg-emerald-400" />
           </div>
           {/* Mock UI Body populated with real-looking content */}
           <div className="h-[300px] sm:h-[400px] bg-surface flex p-0 text-left">
              {/* Sidebar */}
              <div className="w-48 sm:w-[220px] border-r border-card-border p-5 space-y-6 hidden md:block bg-surface-container-lowest">
                 <div className="flex items-center gap-2 mb-8">
                   <Logo />
                 </div>
                 <div className="space-y-1.5">
                   <div className="px-3 py-2 rounded-xl bg-primary/10 text-primary font-bold text-[13px] flex items-center gap-2.5">
                     <Compass size={16} strokeWidth={2.5} /> Explore
                   </div>
                   <div className="px-3 py-2 rounded-xl text-on-surface-variant font-medium text-[13px] flex items-center gap-2.5">
                     <BookOpen size={16} /> My Library
                   </div>
                   <div className="px-3 py-2 rounded-xl text-on-surface-variant font-medium text-[13px] flex items-center gap-2.5">
                     <MessageSquare size={16} /> Discussions
                   </div>
                 </div>
              </div>
              {/* Main Content */}
              <div className="flex-1 overflow-hidden flex flex-col bg-surface">
                 <div className="p-5 sm:p-7 border-b border-card-border flex items-center justify-between">
                    <div>
                      <h3 className="text-lg sm:text-xl font-extrabold text-on-surface tracking-tight">Good morning, Student</h3>
                      <p className="text-[11px] sm:text-xs text-on-surface-variant mt-0.5">Let's continue your studies where you left off.</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-white text-[11px] font-bold shadow-sm">
                      <Upload size={14} /> Upload
                    </div>
                 </div>
                 
                 <div className="p-5 sm:p-7 space-y-5 flex-1 overflow-hidden">
                   {/* Fake Tabs */}
                   <div className="flex items-center gap-2 overflow-hidden">
                     <div className="px-3 py-1.5 rounded-lg bg-surface-container-high border border-card-border text-on-surface text-[11px] font-bold flex items-center gap-1.5">
                       <FileText size={12} className="text-indigo-500" /> Study Notes
                     </div>
                     <div className="px-3 py-1.5 rounded-lg text-on-surface-variant text-[11px] font-medium flex items-center gap-1.5">
                       <FileText size={12} className="text-violet-500" /> Past Papers
                     </div>
                     <div className="px-3 py-1.5 rounded-lg text-on-surface-variant text-[11px] font-medium flex items-center gap-1.5">
                       <FileText size={12} className="text-emerald-500" /> Cheatsheets
                     </div>
                   </div>

                   {/* Grid of Materials */}
                   <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                     {/* Card 1 */}
                     <div className="rounded-xl bg-surface border border-card-border p-3 sm:p-4 shadow-sm flex flex-col justify-between h-28 sm:h-32">
                       <div>
                         <div className="flex items-center justify-between mb-1.5">
                           <span className="text-[9px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded">PDF</span>
                           <span className="text-[9px] text-on-surface-variant">2.4 MB</span>
                         </div>
                         <div className="text-xs sm:text-sm font-bold text-on-surface leading-tight line-clamp-2">Operating Systems Concurrency Guide</div>
                       </div>
                       <div className="flex items-center justify-between text-[10px] text-on-surface-variant mt-2">
                         <span className="font-medium text-emerald-600">Alex K.</span>
                         <span>★ 4.9</span>
                       </div>
                     </div>
                     
                     {/* Card 2 */}
                     <div className="rounded-xl bg-surface border border-card-border p-3 sm:p-4 shadow-sm flex flex-col justify-between h-28 sm:h-32">
                       <div>
                         <div className="flex items-center justify-between mb-1.5">
                           <span className="text-[9px] font-bold text-violet-600 uppercase bg-violet-50 px-1.5 py-0.5 rounded">PDF</span>
                           <span className="text-[9px] text-on-surface-variant">1.1 MB</span>
                         </div>
                         <div className="text-xs sm:text-sm font-bold text-on-surface leading-tight line-clamp-2">Discrete Math PYQ Solutions 2023</div>
                       </div>
                       <div className="flex items-center justify-between text-[10px] text-on-surface-variant mt-2">
                         <span className="font-medium text-violet-600">Sarah M.</span>
                         <span>★ 4.8</span>
                       </div>
                     </div>
                     
                     {/* Card 3 */}
                     <div className="hidden lg:flex rounded-xl bg-surface border border-card-border p-3 sm:p-4 shadow-sm flex flex-col justify-between h-28 sm:h-32">
                       <div>
                         <div className="flex items-center justify-between mb-1.5">
                           <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded">DOCX</span>
                           <span className="text-[9px] text-on-surface-variant">845 KB</span>
                         </div>
                         <div className="text-xs sm:text-sm font-bold text-on-surface leading-tight line-clamp-2">Data Structures Tree Traversal Summary</div>
                       </div>
                       <div className="flex items-center justify-between text-[10px] text-on-surface-variant mt-2">
                         <span className="font-medium text-blue-600">David Y.</span>
                         <span>★ 5.0</span>
                       </div>
                     </div>
                   </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Floating badges around the mock UI with enhanced parallax */}
        <motion.div
          style={{
            x: badgeTranslateX,
            y: badgeTranslateY,
          }}
          className="absolute -left-4 bottom-12 sm:-left-8 sm:bottom-24 hidden sm:block z-40 pointer-events-none"
        >
          <motion.div 
            animate={{ y: [8, -8, 8] }} 
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="bg-surface border border-card-border px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md"
          >
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-surface" />
              <div className="w-8 h-8 rounded-full bg-purple-500 border-2 border-surface" />
              <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-surface" />
            </div>
            <div className="text-left">
              <p className="text-xs font-bold text-on-surface">500+ Students</p>
              <p className="text-[10px] text-on-surface-variant">Studying now</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
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
    id: 'messaging',
    label: 'Peer Study Chat',
    icon: MessageSquare,
    categoryBadge: 'PEER-TO-PEER COLLABORATION',
    title: 'Discuss exam doubts and share notes directly with classmates',
    description:
      'Connect with note uploaders, form study circles with peers from your university, and share document attachments directly inside real-time student messaging threads.',
    highlights: [
      { title: 'Direct Student Messaging', desc: 'Ask authors specific questions about difficult theorems or solutions.' },
      { title: 'Verified Student Profiles', desc: 'Know who you are learning from with verified university tags.' },
    ],
    floatingBadge: 'Live Academic Chat',
  },
  {
    id: 'library',
    label: 'Academic Library',
    icon: BookOpen,
    categoryBadge: 'CURATED SEMESTER REPOSITORY',
    title: 'Instant access to verified semester notes & past papers',
    description:
      'Stop searching through disorganized WhatsApp groups and expired Google Drive links. Studexa curates study materials indexed by Branch, Semester, and Subject syllabus.',
    highlights: [
      { title: 'Curriculum-Aligned Structure', desc: 'Browse Engineering and Degree notes mapped by unit and semester.' },
      { title: 'Quality Moderation Queue', desc: 'Every uploaded file is reviewed and approved by student admins before publishing.' },
      { title: 'PYQ Exam Archive', desc: 'Solved mid-term and final semester question papers with step-by-step answers.' },
    ],
    floatingBadge: '100% Moderated & Spam-Free',
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

const WATERMARK_LINE = Array(22).fill("Studexa").join("   ");
const WATERMARK_ROWS = Array.from({ length: 18 });

export function GetStartedPage() {
  const navigate = useNavigate();
  const { completeOnboarding, startExploring, stopExploring } = useAuth();
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Combined scroll controller for the continuous watermark typography across How It Works + CTA
  const combinedSectionsRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: combinedSectionsRef,
    offset: ["start end", "end start"]
  });

  // Diagonal travel: starts at TOP-RIGHT (positive X, negative Y) -> moves toward BOTTOM-LEFT (negative X, positive Y)
  const watermarkX = useTransform(scrollYProgress, [0, 0.5, 1], ["25vw", "0vw", "-25vw"]);
  const watermarkY = useTransform(scrollYProgress, [0, 0.5, 1], ["-20vh", "0vh", "20vh"]);

  const activeFeature = PLATFORM_FEATURES[activeFeatureIndex];

  // Auto-advance through features every 6 seconds unless paused
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveFeatureIndex((prev) => (prev + 1) % PLATFORM_FEATURES.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    if (window.location.pathname === '/get-started') {
      window.location.reload();
    } else {
      window.location.href = '/get-started';
    }
  };

  const handleGetStarted = (destination: string = '/signup') => {
    stopExploring?.();
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
          <div
            className="flex items-center cursor-pointer transition-opacity hover:opacity-85"
            onClick={handleLogoClick}
            role="button"
            tabIndex={0}
            title="Refresh Page"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                handleLogoClick();
              }
            }}
          >
            <Logo height={34} />
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-label-sm font-bold text-white shadow-xs hover:opacity-95 transition-all cursor-pointer active:scale-95"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </header>

      {/* ── HERO SECTION WITH 3D ANIMATIONS ── */}
      <section className="relative border-b border-card-border bg-surface-container-low px-4 pt-16 pb-20 sm:px-6 lg:px-8 overflow-hidden">

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          {/* Subtle ambient lighting behind hero */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] max-w-full h-[240px] bg-gradient-to-tr from-indigo-500/8 via-purple-500/8 to-transparent blur-3xl pointer-events-none rounded-full" />

          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2.5 rounded-full border border-indigo-100 bg-white shadow-xs px-4 py-1.5 text-xs font-medium text-slate-700 mb-8 transition-all hover:border-indigo-200"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="font-semibold text-slate-800">Open Academic Repository</span>
            <span className="text-slate-300">·</span>
            <span className="text-indigo-600 font-bold">100% Free for University Students</span>
          </motion.div>

          {/* Heading */}
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-[64px] font-black tracking-[-0.035em] text-slate-900 leading-[1.12] max-w-4xl mx-auto"
          >
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
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-7 max-w-2xl text-[16px] sm:text-[18px] text-slate-600 leading-relaxed font-normal"
          >
            The student-powered platform designed for <span className="font-bold text-slate-900">Engineering & Degree programs</span>. Access curated semester notes, view past exam solutions, and share academic knowledge with peers.
          </motion.p>

          {/* Feature Badges / Quick Highlights */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center justify-center gap-2 sm:gap-2.5"
          >
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
          </motion.div>

          {/* Primary Action Buttons */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="mt-9 flex items-center justify-center gap-3.5 flex-wrap"
          >
            <button
              type="button"
              onClick={() => handleGetStarted('/signup')}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary hover:opacity-95 px-8 py-3.5 text-sm font-bold text-white shadow-md shadow-indigo-600/25 hover:shadow-lg hover:shadow-indigo-600/35 transition-all cursor-pointer active:scale-[0.99]"
            >
              <span>Get Started</span>
              <ArrowRight size={16} strokeWidth={2.2} />
            </button>
            <button
              type="button"
              onClick={handleExplore}
              className="inline-flex items-center justify-center gap-2.5 rounded-xl border border-card-border bg-surface-container px-6 py-3.5 text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-all cursor-pointer active:scale-[0.99]"
            >
              <Compass size={18} strokeWidth={2.2} />
              <span>Explore Library</span>
            </button>
          </motion.div>

          {/* Elegant Hero Visual Dashboard Mockup with 3D Cursor Tracking */}
          <HeroInteractiveCard />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="mt-14 grid grid-cols-2 gap-4 border-t border-card-border/60 pt-8 sm:grid-cols-4"
          >
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                <CountUpNumber target={50000} suffix="+" />
              </span>
              <span className="text-label-sm text-on-surface-variant">Active Students</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                <CountUpNumber target={12500} suffix="+" />
              </span>
              <span className="text-label-sm text-on-surface-variant">Verified Documents</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                <CountUpNumber target={100} suffix="% Free" />
              </span>
              <span className="text-label-sm text-on-surface-variant">No Paywalls Ever</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl sm:text-3xl font-bold tracking-tight text-on-surface">
                <CountUpNumber target={4.9} decimals={1} suffix=" / 5.0" />
              </span>
              <span className="text-label-sm text-on-surface-variant">Student Satisfaction</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── SEAMLESS SCROLLING LOGO MARQUEE ── */}
      <section className="border-b border-card-border bg-surface py-10 overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-6 text-center">
          <p className="text-sm font-semibold tracking-wide text-on-surface-variant uppercase">
            Trusted by students across top institutions
          </p>
        </div>
        <div className="relative flex w-full overflow-hidden">
          {/* Gradient masks for smooth fade at edges */}
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-20 sm:w-40 bg-gradient-to-r from-surface to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-20 sm:w-40 bg-gradient-to-l from-surface to-transparent" />
          
          <motion.div
            className="flex items-center gap-16 px-8 whitespace-nowrap"
            animate={{ x: [0, -1035] }}
            transition={{
              ease: "linear",
              duration: 20,
              repeat: Infinity,
            }}
          >
            {/* Duplicated list for infinite scroll effect */}
            {[...SUPPORTED_BRANCHES, ...SUPPORTED_BRANCHES, ...SUPPORTED_BRANCHES].map((branch, i) => (
              <div key={i} className="flex items-center">
                <span className="text-xl sm:text-2xl font-black text-on-surface/20 hover:text-on-surface/40 transition-colors">
                  {branch.name}
                </span>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── INTERACTIVE PLATFORM SHOWCASE (ANIMATED FEATURE TOUR) ── */}
      <motion.section
        initial={{ opacity: 0, y: 60, scale: 0.95, rotateX: 15 }}
        whileInView={{ opacity: 1, y: 0, scale: 1, rotateX: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        style={{ perspective: 1000 }}
        className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        <div className="text-center max-w-3xl mx-auto mb-12">

          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-3xl sm:text-4xl font-extrabold tracking-tight text-on-surface"
          >
            Everything built for academic excellence
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-3 text-body-md text-on-surface-variant"
          >
            Explore how Studexa connects students with verified university course materials and peer study tools.
          </motion.p>
        </div>

        {/* Dynamic Animated Viewport with Vertical Tabs */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 rounded-3xl border border-card-border bg-surface-container-low p-6 sm:p-10 shadow-sm">
          
          {/* Vertical Navigation Tabs */}
          <div className="flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-visible lg:w-64 shrink-0 pb-4 lg:pb-0">
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
                  className={`relative flex items-center gap-3 px-4 py-3 sm:py-4 rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer text-left whitespace-nowrap lg:whitespace-normal ${
                    isActive ? 'text-white' : 'text-on-surface-variant hover:text-on-surface bg-surface border border-card-border/50 hover:bg-surface-container'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="platformActiveTab"
                      className="absolute inset-0 rounded-xl bg-primary shadow-xs"
                      transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                    />
                  )}
                  <Icon size={18} className="relative z-10 shrink-0" />
                  <span className="relative z-10 leading-snug">{feature.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="grid grid-cols-1 xl:grid-cols-2 gap-8 lg:gap-12 items-center min-h-[800px] sm:min-h-[720px] xl:min-h-[480px]"
              >
              {/* Left Column: Feature Breakdown */}
              <div className="space-y-6 flex flex-col justify-center">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                    {activeFeature.categoryBadge}
                  </span>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-on-surface mt-2 leading-tight">
                    {activeFeature.title}
                  </h3>
                  <p className="text-body-sm sm:text-body-md text-on-surface-variant mt-4 leading-relaxed">
                    {activeFeature.description}
                  </p>
                </div>

                {/* Highlights List */}
                <div className="space-y-4 pt-2">
                  {activeFeature.highlights.map((h) => (
                    <div key={h.title} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <CheckCircle2 size={13} strokeWidth={3} />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-on-surface">{h.title}: </span>
                        <span className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">{h.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Action CTA */}
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleExplore}
                    className="inline-flex items-center gap-2 rounded-xl bg-surface border border-card-border px-5 py-3 text-sm font-bold text-on-surface hover:bg-surface-container hover:border-primary/40 transition-all cursor-pointer shadow-sm active:scale-95"
                  >
                    <span>Open in Study Hub</span>
                    <ArrowRight size={16} className="text-primary" />
                  </button>
                </div>
              </div>

              {/* Right Column: Animated Interactive Mockup Window */}
              <div style={{ perspective: 1200 }}>
                <motion.div 
                  initial={{ rotateY: -15, x: 20 }}
                  animate={{ rotateY: 0, x: 0 }}
                  exit={{ rotateY: 15, x: -20 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="rounded-2xl border border-card-border bg-surface-container overflow-hidden shadow-xl"
                >
                  {/* Browser Window Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-card-border/70 bg-surface-container-high/50">
                    <div className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full bg-rose-400" />
                      <span className="h-3 w-3 rounded-full bg-amber-400" />
                      <span className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface border border-card-border text-[11px] text-on-surface-variant font-mono">
                      <ShieldCheck size={12} className="text-emerald-500" />
                      <span>studexa.app/{activeFeature.id}</span>
                    </div>
                    <div className="w-12" />
                  </div>

                  {/* Window Body Mockup Content */}
                  <div className="p-6 sm:p-8 min-h-[360px] flex flex-col justify-center relative">
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
                      </div>
                    )}

                    {/* MOCKUP 3: MESSAGING */}
                    {activeFeature.id === 'messaging' && (
                      <div className="space-y-4">
                        {/* Student Chat Message 1 */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.1, duration: 0.3 }}
                          className="flex items-start gap-2.5"
                        >
                          <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                            AK
                          </div>
                          <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-surface border border-card-border p-3 text-xs shadow-2xs">
                            <p className="font-bold text-on-surface mb-0.5">Arun Kumar • CSE Sem 5</p>
                            <p className="text-on-surface-variant min-h-[32px]">
                              <TypewriterText text="Hey! Did anyone get the solved proofs for the 2025 Mid-Sem Operating Systems paper?" delay={0.4} />
                            </p>
                          </div>
                        </motion.div>

                        {/* Student Reply 2 */}
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 2.8, duration: 0.3 }}
                          className="flex items-start gap-2.5 flex-row-reverse"
                        >
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0">
                            SN
                          </div>
                          <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-primary text-white p-3 text-xs shadow-xs space-y-2">
                            <p className="font-bold mb-0.5">Sneha Nair (Top Contributor)</p>
                            <p className="text-white/90 min-h-[16px]">
                              <TypewriterText text="Yes! Just uploaded the verified solutions with step-by-step diagrams:" delay={3.1} speed={0.02} />
                            </p>
                            <motion.div 
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 4.8 }}
                              className="rounded-xl bg-white/10 p-2 text-[11px] flex items-center justify-between gap-2"
                            >
                              <span className="font-mono">OS_MidSem_2025_Solved.pdf</span>
                              <span className="underline font-bold cursor-pointer">View Note →</span>
                            </motion.div>
                          </div>
                        </motion.div>
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
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        </div>
      </motion.section>

      {/* ── COURSE & BRANCH COVERAGE DIRECTORY ── */}
      <motion.section 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, amount: 0.2 }}
        transition={{ duration: 0.6 }}
        className="border-t border-card-border bg-surface-container-low px-4 py-16 sm:px-6 lg:px-8"
      >
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

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            variants={{
              hidden: {},
              visible: {
                transition: { staggerChildren: 0.05 }
              }
            }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
            style={{ perspective: 1000 }}
          >
            {SUPPORTED_BRANCHES.map((b) => (
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20, rotateX: -15 },
                  visible: { opacity: 1, y: 0, rotateX: 0, transition: { duration: 0.4, ease: 'easeOut' } }
                }}
                key={b.name}
                onClick={handleExplore}
                className="group flex items-center justify-between p-4 rounded-xl border border-card-border bg-surface hover:border-primary/40 hover:bg-surface-container transition-all cursor-pointer shadow-xs hover:-translate-y-1 hover:shadow-md"
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
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ── DARK MODE SHOWCASE (100% SCROLL-CONTROLLED) ── */}
      <DarkModeScrollShowcase />

      {/* ── COMBINED HOW IT WORKS & CTA WITH CONTINUOUS SCROLL-CONTROLLED WATERMARK ── */}
      <div 
        ref={combinedSectionsRef}
        className="relative overflow-hidden border-y border-card-border bg-surface"
      >
        {/* Continuous Scroll-Controlled Watermark Typography Layer */}
        <div className="absolute -inset-x-[40vw] -inset-y-[35vh] pointer-events-none select-none z-0 overflow-hidden flex items-center justify-center">
          <motion.div 
            style={{ 
              x: watermarkX, 
              y: watermarkY,
              rotate: -12,
              willChange: 'transform'
            }}
            className="flex flex-col gap-6 sm:gap-10 w-[170vw] max-w-none"
          >
            {WATERMARK_ROWS.map((_, i) => (
              <div 
                key={i}
                className={`whitespace-nowrap font-black uppercase tracking-wider select-none leading-none text-on-surface/[0.035] dark:text-white/[0.045] text-[clamp(2.5rem,5.5vw,5.5rem)] ${
                  i % 2 === 0 ? '-ml-28 sm:-ml-48' : 'ml-0'
                }`}
                aria-hidden="true"
              >
                {WATERMARK_LINE}
              </div>
            ))}
          </motion.div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <motion.section 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 px-4 pt-20 pb-12 sm:px-6 lg:px-8"
        >
          {/* Subtle decorative background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-gradient-to-r from-primary/5 via-blue-500/5 to-purple-500/5 blur-3xl pointer-events-none rounded-full" />

          <div className="relative mx-auto max-w-5xl">
            {/* Header */}
            <div className="text-center mb-16">
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-3 shadow-xs"
              >
                <Sparkles size={13} className="text-primary animate-pulse" />
                <span>Simple 3-Step Flow</span>
              </motion.div>
              <motion.h2 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-2xl sm:text-4xl font-extrabold tracking-tight text-on-surface"
              >
                Designed for how students <span className="bg-gradient-to-r from-primary via-indigo-500 to-blue-600 bg-clip-text text-transparent">actually study</span>
              </motion.h2>
            </div>

            {/* Cards Grid with connecting progress line */}
            <div className="relative">
              {/* Connecting progress beam on desktop */}
              <div className="hidden md:block absolute top-[68px] left-[15%] right-[15%] h-[2px] z-0 pointer-events-none overflow-hidden rounded-full">
                <div className="w-full h-full bg-gradient-to-r from-primary/15 via-primary/30 to-primary/15" />
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                  className="absolute top-0 left-0 w-1/3 h-full bg-gradient-to-r from-transparent via-primary to-transparent blur-[1px]"
                />
              </div>

              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                variants={{
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.18 }
                  }
                }}
                className="grid grid-cols-1 gap-8 md:grid-cols-3 relative z-10"
              >
                {/* Step 1 */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 35, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 120 } }
                  }}
                  whileHover={{ y: -8, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
                  className="group relative flex flex-col items-center text-center p-7 sm:p-8 rounded-3xl border border-card-border/80 bg-surface/90 hover:bg-surface-container backdrop-blur-sm transition-all duration-300 shadow-xs hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 cursor-default"
                >
                  {/* Ambient hover glow */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Animated Icon & Step Badge */}
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 rounded-2xl bg-primary/20 blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110" />
                    <motion.div 
                      whileHover={{ rotate: [-6, 6, -3, 0], scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-blue-600 text-white shadow-lg shadow-primary/25"
                    >
                      <Search size={26} className="text-white drop-shadow-xs" />
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-primary border-2 border-primary font-black text-xs shadow-xs">
                        1
                      </span>
                    </motion.div>
                  </div>

                  <h4 className="text-lg font-bold text-on-surface mb-2.5 group-hover:text-primary transition-colors">
                    Search Your Course
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                    Select your stream (Engineering or Degree), choose your branch, and find exact notes for your current semester.
                  </p>

                  {/* Micro tags */}
                  <div className="mt-auto flex flex-wrap justify-center gap-1.5 pt-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Engineering</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Degree</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Sem 1-8</span>
                  </div>
                </motion.div>

                {/* Step 2 */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 35, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 120 } }
                  }}
                  whileHover={{ y: -8, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
                  className="group relative flex flex-col items-center text-center p-7 sm:p-8 rounded-3xl border border-card-border/80 bg-surface/90 hover:bg-surface-container backdrop-blur-sm transition-all duration-300 shadow-xs hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 cursor-default"
                >
                  {/* Ambient hover glow */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Animated Icon & Step Badge */}
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 rounded-2xl bg-indigo-500/20 blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110" />
                    <motion.div 
                      whileHover={{ rotate: [-6, 6, -3, 0], scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-primary text-white shadow-lg shadow-indigo-500/25"
                    >
                      <BookOpen size={26} className="text-white drop-shadow-xs" />
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-primary border-2 border-primary font-black text-xs shadow-xs">
                        2
                      </span>
                    </motion.div>
                  </div>

                  <h4 className="text-lg font-bold text-on-surface mb-2.5 group-hover:text-primary transition-colors">
                    Read in Browser or Save
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                    Preview documents instantly with our built-in PDF viewer, bookmark them into your personal Library, or download for offline study.
                  </p>

                  {/* Micro tags */}
                  <div className="mt-auto flex flex-wrap justify-center gap-1.5 pt-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Built-in PDF</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Bookmark</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Offline</span>
                  </div>
                </motion.div>

                {/* Step 3 */}
                <motion.div 
                  variants={{
                    hidden: { opacity: 0, y: 35, scale: 0.95 },
                    visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', damping: 20, stiffness: 120 } }
                  }}
                  whileHover={{ y: -8, transition: { type: 'spring', stiffness: 350, damping: 20 } }}
                  className="group relative flex flex-col items-center text-center p-7 sm:p-8 rounded-3xl border border-card-border/80 bg-surface/90 hover:bg-surface-container backdrop-blur-sm transition-all duration-300 shadow-xs hover:shadow-xl hover:shadow-primary/10 hover:border-primary/40 cursor-default"
                >
                  {/* Ambient hover glow */}
                  <div className="absolute inset-0 rounded-3xl bg-gradient-to-b from-primary/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                  {/* Animated Icon & Step Badge */}
                  <div className="relative mb-6">
                    <div className="absolute -inset-2 rounded-2xl bg-violet-500/20 blur-md opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110" />
                    <motion.div 
                      whileHover={{ rotate: [-6, 6, -3, 0], scale: 1.08 }}
                      transition={{ duration: 0.4 }}
                      className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-primary text-white shadow-lg shadow-violet-600/25"
                    >
                      <Trophy size={26} className="text-white drop-shadow-xs" />
                      <span className="absolute -top-2 -right-2 flex h-6 w-6 items-center justify-center rounded-full bg-surface text-primary border-2 border-primary font-black text-xs shadow-xs">
                        3
                      </span>
                    </motion.div>
                  </div>

                  <h4 className="text-lg font-bold text-on-surface mb-2.5 group-hover:text-primary transition-colors">
                    Share & Build Profile
                  </h4>
                  <p className="text-sm text-on-surface-variant leading-relaxed mb-5">
                    Upload your notes to help fellow students, earn points, climb the Academic Leaderboard, and build your student portfolio.
                  </p>

                  {/* Micro tags */}
                  <div className="mt-auto flex flex-wrap justify-center gap-1.5 pt-2">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Leaderboard</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Earn Points</span>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-surface-container border border-card-border/70 text-on-surface-variant/80 group-hover:border-primary/30 group-hover:text-primary transition-colors">Portfolio</span>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ── CALL TO ACTION BANNER ── */}
        <motion.section 
          initial={{ opacity: 0, y: 40, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mx-auto max-w-5xl px-4 pt-8 pb-20 sm:px-6 lg:px-8 text-center"
        >
          <div className="relative rounded-3xl border border-card-border/90 bg-surface-container/95 p-8 sm:p-14 shadow-xl overflow-hidden backdrop-blur-md">
            {/* Animated floating background glow spheres */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                x: [0, 25, 0],
                y: [0, -20, 0],
                opacity: [0.25, 0.45, 0.25]
              }}
              transition={{ repeat: Infinity, duration: 8, ease: 'easeInOut' }}
              className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-primary/20 blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{
                scale: [1.2, 1, 1.2],
                x: [0, -30, 0],
                y: [0, 25, 0],
                opacity: [0.2, 0.4, 0.2]
              }}
              transition={{ repeat: Infinity, duration: 9, ease: 'easeInOut' }}
              className="absolute -bottom-28 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none"
            />

            {/* Subtle grid pattern texture */}
            <div 
              className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
              style={{
                backgroundImage: 'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
                backgroundSize: '24px 24px'
              }}
            />

            <div className="relative z-10 max-w-2xl mx-auto">
              {/* Headline */}
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-on-surface mb-4 leading-tight">
                Ready to elevate your <br className="hidden sm:inline" />
                <span className="bg-gradient-to-r from-primary via-indigo-500 to-blue-600 bg-clip-text text-transparent">
                  semester preparation?
                </span>
              </h2>

              {/* Subtitle */}
              <p className="text-sm sm:text-base text-on-surface-variant max-w-xl mx-auto mb-7 leading-relaxed">
                Join thousands of university students learning smarter today. Create your account in less than a minute.
              </p>

              {/* Value proposition badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-8 text-xs sm:text-sm font-semibold text-on-surface-variant">
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-primary" /> Verified Notes
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <CheckCircle2 size={16} className="text-primary" /> Instant PDF Viewer
                </span>
              </div>

              {/* Interactive Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.04, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleGetStarted('/signup')}
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-primary to-blue-600 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 transition-all cursor-pointer overflow-hidden"
                >
                  {/* Shimmer sweep animation across button */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
                  <span className="relative z-10">Get Started</span>
                  <ArrowRight size={17} className="relative z-10 transition-transform group-hover:translate-x-1" />
                </motion.button>

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.03, y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleExplore}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-card-border bg-surface-container-low px-7 py-4 text-sm font-semibold text-on-surface hover:bg-surface-container hover:border-primary/30 transition-all cursor-pointer shadow-xs"
                >
                  Browse Library as Guest
                </motion.button>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

      {/* ── FOOTER ── */}
      <Footer />
    </div>
  );
}

export default GetStartedPage;
