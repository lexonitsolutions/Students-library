import { motion } from 'framer-motion';
import { ArrowRight, BookOpen, Users, FileText, Sparkles, Star, Award, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CursorGlowTracker } from '../components/ui/CursorGlowTracker';
import { BackgroundVideo } from '../components/ui/BackgroundVideo';
import { useAuth } from '../hooks/useAuth';

export function GetStartedPage() {
  const navigate = useNavigate();
  const { completeOnboarding, startExploring } = useAuth();

  const handleGetStarted = (destination: string) => {
    completeOnboarding();
    navigate(destination);
  };

  const handleExplore = () => {
    startExploring();
    navigate('/dashboard');
  };

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#0b0d14] text-slate-100 relative overflow-x-hidden select-none">
      <BackgroundVideo />
      <CursorGlowTracker />
      
      {/* Background Glow Orbs */}
      <div className="absolute top-10 left-1/4 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />

      {/* ── HEADER NAVBAR ── */}
      <header className="relative z-20 flex items-center justify-between px-6 py-3 sm:py-4 sm:px-12 max-w-7xl w-full mx-auto shrink-0">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
          <motion.div 
            whileHover={{ rotate: 12, scale: 1.05 }}
            className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white font-black text-lg shadow-lg shadow-indigo-500/30"
          >
            Q
          </motion.div>
          <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-white">
            QuickLearnit
          </span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => handleGetStarted('/signin')}
            className="px-3 py-1.5 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            type="button"
            onClick={() => handleGetStarted('/signup')}
            className="rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-lg hover:shadow-indigo-500/25 cursor-pointer"
          >
            Get Started
          </motion.button>
        </div>
      </header>

      {/* ── MAIN HERO SECTION (PROPORTIONAL FLUID RESPONSIVE) ── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-2 sm:py-4 text-center max-w-5xl xl:max-w-6xl mx-auto my-auto w-full">
        {/* Top Announcement Pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-950/60 backdrop-blur-md px-3.5 py-1 text-xs font-semibold text-indigo-300 shadow-lg mb-2 sm:mb-3"
        >
          <Sparkles size={13} className="text-amber-400" />
          <span>Premier University Study Sharing Platform</span>
          <span className="h-1 w-1 rounded-full bg-indigo-400" />
          <span className="text-white">100% Free for Students</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-tight mb-2 sm:mb-3"
        >
          Learn. <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">Share.</span> Grow.
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="text-xs sm:text-base lg:text-lg text-slate-300 max-w-2xl font-medium leading-relaxed mb-4 sm:mb-5"
        >
          Access verified lecture notes, past exam papers, lab assignments, and study materials shared by top students across universities.
        </motion.p>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto mb-4 sm:mb-6"
        >
          <motion.div className="relative group w-full sm:w-auto" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <div className="absolute -inset-0.5 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-60 blur group-hover:opacity-100 transition duration-300" />
            <button
              type="button"
              onClick={handleExplore}
              className="relative flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 px-7 py-3 text-sm sm:text-base font-extrabold text-white shadow-2xl cursor-pointer"
            >
              <span>Explore Now</span>
              <ArrowRight size={17} className="group-hover:translate-x-1.5 transition-transform duration-200" />
            </button>
          </motion.div>

          <button
            type="button"
            onClick={() => handleGetStarted('/signin')}
            className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-7 py-3 text-sm sm:text-base font-bold text-white backdrop-blur-md hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer"
          >
            Sign In to Account
          </button>
        </motion.div>

        {/* Feature Cards Grid */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 lg:gap-5 w-full max-w-5xl text-left"
        >
          {/* Feature 1 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5 sm:p-4 lg:p-5 shadow-xl hover:border-indigo-500/40 transition-all duration-300 group">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 mb-2.5 group-hover:scale-110 transition-transform">
              <BookOpen size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">Verified Notes & Papers</h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              Find complete semester lecture notes, previous exam question papers, and lab manuals organized by course.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5 sm:p-4 lg:p-5 shadow-xl hover:border-purple-500/40 transition-all duration-300 group">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-2.5 group-hover:scale-110 transition-transform">
              <FileText size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">Built-in PDF Viewer</h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              Read study materials directly in your browser with smooth zooming, page jumping, and instant previews.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-3.5 sm:p-4 lg:p-5 shadow-xl hover:border-emerald-500/40 transition-all duration-300 group">
            <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2.5 group-hover:scale-110 transition-transform">
              <Users size={18} />
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white mb-1">Peer Learning Community</h3>
            <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">
              Connect with classmates, message students, earn badges, and contribute to the top student leaderboard.
            </p>
          </div>
        </motion.div>
      </main>

      {/* ── FOOTER STATS (ALWAYS VISIBLE) ── */}
      <footer className="relative z-10 px-4 py-2.5 sm:py-3 max-w-4xl w-full mx-auto shrink-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-6 sm:gap-8 text-[11px] sm:text-xs text-slate-400 border-t border-white/10 pt-2.5 sm:pt-3"
        >
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span className="font-bold text-white">50,000+</span> Students Joined
          </div>
          <div className="flex items-center gap-1.5">
            <Award size={14} className="text-indigo-400" />
            <span className="font-bold text-white">10,000+</span> Verified Notes
          </div>
          <div className="flex items-center gap-1.5">
            <Star size={14} className="text-amber-400" />
            <span className="font-bold text-white">4.9/5.0</span> Rating
          </div>
        </motion.div>
      </footer>
    </div>
  );
}

export default GetStartedPage;
