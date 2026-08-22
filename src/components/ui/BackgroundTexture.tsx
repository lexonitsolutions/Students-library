import { motion } from 'framer-motion';

export function BackgroundTexture({ isLight = true }: { isLight?: boolean }) {
  // Generate floating particle specks
  const particles = Array.from({ length: 12 });

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* ── 1. ANIMATED PANNING GRID MESH ── */}
      <motion.div
        animate={{
          backgroundPosition: ['0px 0px', '64px 64px'],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'linear',
        }}
        className={`absolute inset-0 bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_70%,transparent_100%)] ${
          isLight
            ? 'bg-[linear-gradient(to_right,#00000008_1px,transparent_1px),linear-gradient(to_bottom,#00000008_1px,transparent_1px)]'
            : 'bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)]'
        }`}
      />

      {/* ── 2. ROTATING AURORA GLOW ORBS ── */}
      <motion.div
        animate={{
          rotate: [0, 360],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] ${
          isLight
            ? 'bg-gradient-to-tr from-indigo-100/70 via-purple-100/60 to-blue-100/60'
            : 'bg-gradient-to-tr from-indigo-600/20 via-purple-600/15 to-blue-600/20'
        }`}
      />

      <motion.div
        animate={{
          rotate: [360, 0],
          scale: [1.1, 0.9, 1.1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className={`absolute bottom-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[110px] ${
          isLight
            ? 'bg-gradient-to-br from-violet-100/70 via-indigo-100/60 to-sky-100/60'
            : 'bg-gradient-to-br from-violet-600/20 via-pink-600/15 to-indigo-600/20'
        }`}
      />

      {/* ── 3. FLOATING DUST PARTICLES ── */}
      {particles.map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * 400 - 200,
            y: Math.random() * 600 - 300,
            opacity: Math.random() * 0.4 + 0.2,
            scale: Math.random() * 0.5 + 0.5,
          }}
          animate={{
            y: [0, -60, 0],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 6 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
          className={`absolute top-1/2 left-1/2 w-1.5 h-1.5 rounded-full ${
            isLight
              ? 'bg-indigo-400/40 shadow-[0_0_8px_rgba(99,102,241,0.3)]'
              : 'bg-indigo-300/60 shadow-[0_0_8px_rgba(165,180,252,0.8)]'
          }`}
        />
      ))}
    </div>
  );
}

export default BackgroundTexture;
