import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, CheckCircle2, Sparkles, BookOpen, Star } from 'lucide-react';
import { Logo } from './Logo';

export function MobileThemeShowcaseCard() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const isDark = theme === 'dark';

  return (
    <section className="px-4 py-12 border-t border-card-border bg-surface-container-low overflow-hidden">
      <div className="max-w-md mx-auto">
        {/* Section Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-bold uppercase tracking-wider text-primary mb-2.5">
            <Sparkles size={12} />
            <span>Light &amp; Dark Mode</span>
          </div>
          <h3 className="text-2xl font-extrabold tracking-tight text-on-surface">
            Designed for Day &amp; Night Study
          </h3>
          <p className="text-xs text-on-surface-variant mt-2 leading-relaxed">
            Studexa seamlessly adapts to your environment. Switch between high-contrast Light Mode and eye-friendly Dark Mode with a single tap.
          </p>
        </div>

        {/* Interactive Theme Switcher Tabs */}
        <div className="flex items-center justify-center p-1 rounded-xl bg-surface border border-card-border mb-6 max-w-[280px] mx-auto shadow-xs">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              !isDark
                ? 'bg-amber-500/15 text-amber-600 shadow-xs border border-amber-500/30'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Sun size={14} className={!isDark ? 'text-amber-500' : ''} />
            <span>Light Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              isDark
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Moon size={14} className={isDark ? 'text-indigo-200' : ''} />
            <span>Dark Mode</span>
          </button>
        </div>

        {/* Card Mockup Container */}
        <AnimatePresence mode="wait">
          <motion.div
            key={theme}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className={`rounded-2xl border transition-colors shadow-lg overflow-hidden ${
              isDark
                ? 'bg-[#0c0f17] border-slate-800 text-slate-100'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* Top Bar of the Mockup */}
            <div
              className={`flex items-center justify-between px-4 py-3 border-b ${
                isDark ? 'border-slate-800/80 bg-[#121722]' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Logo height={22} />
              </div>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isDark
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-amber-500/10 text-amber-700 border border-amber-500/20'
                }`}
              >
                {isDark ? <Moon size={10} /> : <Sun size={10} />}
                <span>{isDark ? 'OLED Dark Active' : 'Crisp Light Active'}</span>
              </div>
            </div>

            {/* Mockup Body: Material Document Card Preview */}
            <div className="p-4 space-y-3">
              {/* Document Banner */}
              <div
                className={`p-3.5 rounded-xl border ${
                  isDark
                    ? 'bg-gradient-to-br from-slate-900 to-[#151c2e] border-slate-800'
                    : 'bg-gradient-to-br from-indigo-50/70 to-purple-50/70 border-indigo-100/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-9 w-9 rounded-lg flex items-center justify-center ${
                        isDark ? 'bg-indigo-600/30 text-indigo-400' : 'bg-indigo-600 text-white'
                      }`}
                    >
                      <BookOpen size={18} />
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold leading-snug ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        Data Structures &amp; Algorithms
                      </h4>
                      <p
                        className={`text-[10px] ${
                          isDark ? 'text-slate-400' : 'text-slate-500'
                        }`}
                      >
                        CS302 • Semester 3 Comprehensive Notes
                      </p>
                    </div>
                  </div>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border shrink-0 ${
                      isDark
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}
                  >
                    Verified PDF
                  </span>
                </div>

                {/* Meta details row */}
                <div
                  className={`mt-3 pt-2.5 border-t grid grid-cols-3 gap-2 text-center text-[10px] ${
                    isDark ? 'border-slate-800/80 text-slate-400' : 'border-indigo-100/60 text-slate-600'
                  }`}
                >
                  <div>
                    <span className="opacity-70">Pages</span>
                    <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      54 Pages
                    </p>
                  </div>
                  <div>
                    <span className="opacity-70">Rating</span>
                    <p className={`font-bold flex items-center justify-center gap-0.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                      <Star size={10} fill="currentColor" /> 4.9
                    </p>
                  </div>
                  <div>
                    <span className="opacity-70">Downloads</span>
                    <p className={`font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      1.8k
                    </p>
                  </div>
                </div>
              </div>

              {/* Feature Highlights beneath */}
              <div
                className={`p-2.5 rounded-xl border text-[11px] flex items-center justify-between ${
                  isDark
                    ? 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                    : 'bg-slate-50 border-slate-100 text-slate-700'
                }`}
              >
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                  <span>{isDark ? 'Late-night OLED contrast' : 'High sunlight legibility'}</span>
                </span>
                <span
                  className={`text-[10px] font-bold ${
                    isDark ? 'text-indigo-400' : 'text-indigo-600'
                  }`}
                >
                  {isDark ? 'Eye-Care Mode' : 'Sunlight Ready'}
                </span>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
