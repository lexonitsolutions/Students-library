import { motion, useMotionValue, useSpring } from 'framer-motion';
import { useEffect } from 'react';

export function CursorGlowTracker() {
  const mouseX = useMotionValue(-300);
  const mouseY = useMotionValue(-300);

  // Tighter, controlled spring physics for subtle, non-exaggerated cursor tracking
  const springX = useSpring(mouseX, { damping: 50, stiffness: 350 });
  const springY = useSpring(mouseY, { damping: 50, stiffness: 350 });

  // Secondary subtle follower with soft damping
  const springX2 = useSpring(mouseX, { damping: 60, stiffness: 250 });
  const springY2 = useSpring(mouseY, { damping: 60, stiffness: 250 });

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseX.set(event.clientX);
      mouseY.set(event.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [mouseX, mouseY]);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Primary Subtle Glowing Micro Orb */}
      <motion.div
        style={{
          left: springX,
          top: springY,
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-[220px] h-[220px] rounded-full bg-gradient-to-r from-indigo-500/12 via-purple-500/10 to-pink-500/10 blur-[60px]"
      />

      {/* Secondary Compact Follower */}
      <motion.div
        style={{
          left: springX2,
          top: springY2,
        }}
        className="absolute -translate-x-1/2 -translate-y-1/2 w-[120px] h-[120px] rounded-full bg-gradient-to-tr from-cyan-400/10 to-violet-600/12 blur-[45px]"
      />
    </div>
  );
}

export default CursorGlowTracker;
