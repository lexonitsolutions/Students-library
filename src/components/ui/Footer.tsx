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
          className="text-[11vw] sm:text-[12vw] lg:text-[13vw] leading-none font-bold tracking-tight flex items-center justify-center" 
          aria-label="answersbro"
        >
          {/* answers in primary blue */}
          {["a", "n", "s", "w", "e", "r", "s"].map((char, i) => (
            <motion.span 
              key={`ans-${i}`}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
              }}
              className="text-primary"
            >
              {char}
            </motion.span>
          ))}
          {/* bro in brand orange */}
          {["b", "r", "o"].map((char, i) => (
            <motion.span 
              key={`bro-${i}`}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 20, stiffness: 100 } }
              }}
              className="text-[#FFA500] dark:text-[#FFAA32]"
            >
              {char}
            </motion.span>
          ))}
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
            <Link to="/privacy" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
