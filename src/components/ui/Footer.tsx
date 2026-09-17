import { Link } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { motion } from 'framer-motion';

export interface FooterProps {
  className?: string;
}

export function Footer({ className }: FooterProps) {
  return (
    <footer className={cn("relative bg-surface-container-low border-t border-card-border overflow-hidden", className)}>
      {/* Middle Section: Giant Brand Text with Vertical Tagline positioned at the screen's right edge */}
      <div className="relative w-full flex justify-center items-center py-10 sm:py-16 select-none overflow-hidden">
        <motion.h1 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.5 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.12 } }
          }}
          className="text-[13vw] sm:text-[14vw] lg:text-[15vw] leading-none font-semibold tracking-tight text-on-surface flex items-center justify-center" 
          aria-label="Studexa"
        >
          {/* Split S, t, u, d, e into separate motion elements */}
          {["S", "t", "u", "d", "e"].map((char, i) => (
            <motion.span 
              key={i}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
              }}
            >
              {char}
            </motion.span>
          ))}
          
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
            }}
          >
            <svg 
              viewBox="0 0 80 100" 
              className="h-[0.75em] w-auto mx-[0.02em] inline-block" 
              style={{ transform: 'translateY(-0.05em)' }}
              aria-hidden="true"
            >
              <defs>
                <linearGradient id="xGrad" x1="0" y1="100" x2="80" y2="0" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#863bff" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
              <polygon points="0,0 22,0 80,100 58,100" fill="currentColor" />
              <polygon points="58,0 80,0 22,100 0,100" fill="url(#xGrad)" />
            </svg>
          </motion.span>
          
          <motion.span
            variants={{
              hidden: { opacity: 0, y: 30 },
              visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
            }}
          >
            a
          </motion.span>
        </motion.h1>

        {/* Vertical text positioned at the far right edge with 2px or 3px gap */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="absolute right-[2px] sm:right-[3px] top-1/2 -translate-y-1/2 flex items-center justify-center shrink-0 z-10"
        >
          <span className="[writing-mode:vertical-rl] text-[9px] sm:text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-on-surface-variant/80 select-none whitespace-nowrap">
            Elevate your studies
          </span>
        </motion.div>
      </div>

      {/* Bottom Section: Copyright & Legal */}
      <div className="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-card-border/70 relative before:absolute before:inset-x-0 before:-top-px before:h-px before:bg-gradient-to-r before:from-transparent before:via-card-border before:to-transparent">
          <div className="text-sm font-bold text-on-surface">
            Lexon IT Solutions
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Link to="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Privacy</Link>
            <Link to="#" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Terms</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
