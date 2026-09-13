import {
  motion,
  AnimatePresence,
} from 'framer-motion';
import {
  ChevronDown,
  Download,
  Eye,
  Heart,
  Trophy,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { Card } from '../components/ui/Card';
import { UserProfilePanel, type UploaderProfile } from '../components/ui/UserProfilePanel';
import { useAuth } from '../hooks/useAuth';
import { cn } from '../lib/cn';
import {
  listLeaderboardForUI,
  type LeaderboardEntry,
} from '../services/materialsService';

// ─── Continuous Pouring Confetti Canvas ──────────────────────────────────────

interface ConfettiPiece {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  colorDark: string;
  vy: number;
  vx: number;
  wobble: number;
  wobbleSpeed: number;
  tilt: number;
  tiltSpeed: number;
  rotation: number;
  rotationSpeed: number;
  isRibbon: boolean;
  opacity: number;
}

const PALETTE = [
  { main: '#f43f5e', dark: '#be123c' }, // Rose
  { main: '#fbbf24', dark: '#d97706' }, // Gold
  { main: '#f59e0b', dark: '#b45309' }, // Amber
  { main: '#10b981', dark: '#047857' }, // Emerald
  { main: '#06b6d4', dark: '#0e7490' }, // Cyan
  { main: '#3b82f6', dark: '#1d4ed8' }, // Blue
  { main: '#8b5cf6', dark: '#6d28d9' }, // Purple
  { main: '#d946ef', dark: '#a21caf' }, // Fuchsia
  { main: '#f97316', dark: '#c2410c' }, // Orange
  { main: '#a855f7', dark: '#7e22ce' }, // Violet
  { main: '#ec4899', dark: '#be185d' }, // Pink
  { main: '#eab308', dark: '#ca8a04' }, // Yellow
];

function ConfettiPouringCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.parentElement.clientWidth;
      height = canvas.parentElement.clientHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.scale(dpr, dpr);
    };

    const ro = new ResizeObserver(handleResize);
    if (canvas.parentElement) {
      ro.observe(canvas.parentElement);
    }

    const COUNT = 110;
    const pieces: ConfettiPiece[] = [];

    for (let i = 0; i < COUNT; i++) {
      const pColor = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      const isRibbon = Math.random() < 0.22;
      pieces.push({
        x: Math.random() * width,
        // Spread evenly from way above the top to the bottom on initial load
        y: Math.random() * (height + 150) - 100,
        w: isRibbon ? Math.random() * 3 + 3.5 : Math.random() * 5 + 5.5,
        h: isRibbon ? Math.random() * 14 + 18 : Math.random() * 8 + 8,
        color: pColor.main,
        colorDark: pColor.dark,
        vy: isRibbon ? Math.random() * 0.45 + 0.65 : Math.random() * 0.4 + 0.5,
        vx: Math.random() * 0.4 - 0.2,
        wobble: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.02 + 0.015,
        tilt: Math.random() * Math.PI * 2,
        tiltSpeed: Math.random() * 0.03 + 0.018,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.018,
        isRibbon,
        opacity: Math.random() * 0.25 + 0.75,
      });
    }

    let time = 0;
    const render = () => {
      time += 0.01;
      ctx.clearRect(0, 0, width, height);

      const breeze = Math.sin(time * 0.5) * 0.35;

      for (let i = 0; i < COUNT; i++) {
        const p = pieces[i];

        // Update kinematics
        p.wobble += p.wobbleSpeed;
        p.tilt += p.tiltSpeed;
        p.rotation += p.rotationSpeed;
        p.x += p.vx + Math.sin(p.wobble) * 0.65 + breeze;
        p.y += p.vy;

        // Wrap or reset at bottom
        if (p.y > height + 25) {
          p.y = -25 - Math.random() * 30;
          p.x = Math.random() * width;
          p.vy = p.isRibbon ? Math.random() * 0.45 + 0.65 : Math.random() * 0.4 + 0.5;
        }
        if (p.x < -30) p.x = width + 20;
        if (p.x > width + 30) p.x = -20;

        // 3D perspective flip factor
        const cosTilt = Math.cos(p.tilt);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;

        // Use dark side when card flips over
        ctx.fillStyle = cosTilt > 0 ? p.color : p.colorDark;

        if (p.isRibbon) {
          // Curved ribbon strip
          const ribbonW = p.w;
          const ribbonH = p.h * Math.abs(cosTilt);
          ctx.beginPath();
          ctx.ellipse(0, 0, ribbonW / 2, ribbonH / 2, Math.PI / 6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Rectangular paper slip with 3D horizontal scale
          const currentW = p.w * cosTilt;
          const currentH = p.h;
          ctx.fillRect(-currentW / 2, -currentH / 2, currentW, currentH);
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none z-0 w-full h-full"
      style={{ opacity: 0.92 }}
    />
  );
}

// ─── SVG Assets ──────────────────────────────────────────────────────────────

function TrophyBannerIcon() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Laurel branches around trophy */}
      <svg className="w-24 h-16" viewBox="0 0 100 68" fill="none">
        {/* Left laurel branch */}
        <g stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
          <path d="M 28 50 C 22 40 20 26 28 14" fill="none" />
          <path d="M 22 42 C 16 41 15 36 21 34" fill="#fbbf24" stroke="none" />
          <path d="M 20 32 C 14 30 14 24 20 24" fill="#fbbf24" stroke="none" />
          <path d="M 22 22 C 17 19 18 13 24 15" fill="#fbbf24" stroke="none" />
          <path d="M 27 14 C 24 10 27 6 31 10" fill="#fbbf24" stroke="none" />
        </g>
        {/* Right laurel branch */}
        <g stroke="#f59e0b" strokeWidth="1.8" strokeLinecap="round" opacity="0.85">
          <path d="M 72 50 C 78 40 80 26 72 14" fill="none" />
          <path d="M 78 42 C 84 41 85 36 79 34" fill="#fbbf24" stroke="none" />
          <path d="M 80 32 C 86 30 86 24 80 24" fill="#fbbf24" stroke="none" />
          <path d="M 78 22 C 83 19 82 13 76 15" fill="#fbbf24" stroke="none" />
          <path d="M 73 14 C 76 10 73 6 69 10" fill="#fbbf24" stroke="none" />
        </g>
        {/* Sparkle stars */}
        <path d="M 44 8 L 45 5 L 46 8 L 49 9 L 46 10 L 45 13 L 44 10 L 41 9 Z" fill="#f59e0b" />
        <path d="M 56 7 L 57 4 L 58 7 L 61 8 L 58 9 L 57 12 L 56 9 L 53 8 Z" fill="#f59e0b" />
        <path d="M 36 16 L 36.8 14 L 37.6 16 L 39.6 16.8 L 37.6 17.6 L 36.8 19.6 L 36 17.6 L 34 16.8 Z" fill="#fbbf24" />
        <path d="M 64 16 L 64.8 14 L 65.6 16 L 67.6 16.8 L 65.6 17.6 L 64.8 19.6 L 64 17.6 L 62 16.8 Z" fill="#fbbf24" />
      </svg>
      {/* Central golden trophy */}
      <div className="absolute top-1 flex flex-col items-center">
        <div className="relative">
          <svg className="w-10 h-10 drop-shadow-sm" viewBox="0 0 40 40" fill="none">
            {/* Cup body */}
            <path
              d="M 12 8 L 28 8 C 28 19 25 24 20 24 C 15 24 12 19 12 8 Z"
              fill="url(#trophy_grad)"
            />
            {/* Cup rim */}
            <rect x="11" y="6.5" width="18" height="3" rx="1.5" fill="#fef08a" />
            {/* Handles */}
            <path
              d="M 12 11 C 7 11 7 18 12 19 M 28 11 C 33 11 33 18 28 19"
              stroke="#f59e0b"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            {/* Stem */}
            <path d="M 18 23 L 22 23 L 21 28 L 19 28 Z" fill="#d97706" />
            {/* Base */}
            <rect x="14" y="28" width="12" height="3.5" rx="1.5" fill="#b45309" />
            <rect x="12.5" y="31.5" width="15" height="2" rx="1" fill="#78350f" />
            {/* White star on cup */}
            <path
              d="M 20 12.5 L 21 15 L 23.5 15.2 L 21.5 16.8 L 22.2 19.2 L 20 17.7 L 17.8 19.2 L 18.5 16.8 L 16.5 15.2 L 19 15 Z"
              fill="#ffffff"
              opacity="0.9"
            />
            <defs>
              <linearGradient id="trophy_grad" x1="12" y1="8" x2="28" y2="24" gradientUnits="userSpaceOnUse">
                <stop stopColor="#fde047" />
                <stop offset="0.5" stopColor="#eab308" />
                <stop offset="1" stopColor="#ca8a04" />
              </linearGradient>
            </defs>
          </svg>
        </div>
      </div>
    </div>
  );
}

// Laurel Wreath framing the 1st place avatar
function AvatarLaurelWreath() {
  return (
    <svg className="absolute -inset-x-6 -inset-y-3 w-[calc(100%+48px)] h-[calc(100%+24px)] pointer-events-none" viewBox="0 0 130 90" fill="none">
      {/* Left branch */}
      <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
        <path d="M 34 76 C 18 64 16 38 28 18" fill="none" opacity="0.8" />
        <path d="M 20 66 C 12 64 12 56 19 54" fill="#fbbf24" stroke="none" />
        <path d="M 18 52 C 10 50 11 41 19 42" fill="#fbbf24" stroke="none" />
        <path d="M 20 38 C 13 34 16 26 23 29" fill="#fbbf24" stroke="none" />
        <path d="M 26 26 C 22 20 27 14 32 19" fill="#fbbf24" stroke="none" />
      </g>
      {/* Right branch */}
      <g stroke="#f59e0b" strokeWidth="2" strokeLinecap="round">
        <path d="M 96 76 C 112 64 114 38 102 18" fill="none" opacity="0.8" />
        <path d="M 110 66 C 118 64 118 56 111 54" fill="#fbbf24" stroke="none" />
        <path d="M 112 52 C 120 50 119 41 111 42" fill="#fbbf24" stroke="none" />
        <path d="M 110 38 C 117 34 114 26 107 29" fill="#fbbf24" stroke="none" />
        <path d="M 104 26 C 108 20 103 14 98 19" fill="#fbbf24" stroke="none" />
      </g>
    </svg>
  );
}

// Royal Crown atop 1st place avatar
function CrownGraphic() {
  return (
    <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none drop-shadow-md">
      <svg className="w-12 h-9" viewBox="0 0 48 36" fill="none">
        {/* Crown base body with 5 peaks */}
        <path
          d="M 6 30 L 42 30 L 44 14 L 33 22 L 24 8 L 15 22 L 4 14 Z"
          fill="url(#crown_grad)"
        />
        {/* Crown base rim */}
        <path
          d="M 5 29 C 5 28 6 27 8 27 L 40 27 C 42 27 43 28 43 29 L 43 31 C 43 32 42 33 40 33 L 8 33 C 6 33 5 32 5 31 Z"
          fill="#d97706"
        />
        {/* Gems on peaks */}
        <circle cx="24" cy="8" r="2.8" fill="#fef08a" stroke="#d97706" strokeWidth="1" />
        <circle cx="15" cy="22" r="2.2" fill="#ef4444" />
        <circle cx="33" cy="22" r="2.2" fill="#ef4444" />
        <circle cx="4" cy="14" r="2" fill="#38bdf8" />
        <circle cx="44" cy="14" r="2" fill="#38bdf8" />
        {/* Base rim embedded jewels */}
        <circle cx="16" cy="30" r="1.5" fill="#ffffff" opacity="0.9" />
        <circle cx="24" cy="30" r="1.8" fill="#ef4444" />
        <circle cx="32" cy="30" r="1.5" fill="#ffffff" opacity="0.9" />
        <defs>
          <linearGradient id="crown_grad" x1="4" y1="8" x2="44" y2="30" gradientUnits="userSpaceOnUse">
            <stop stopColor="#fef08a" />
            <stop offset="0.4" stopColor="#f59e0b" />
            <stop offset="1" stopColor="#d97706" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// Scalloped Rosette Medal Badge for 2nd & 3rd place
function RosetteBadge({ rank }: { rank: 2 | 3 }) {
  const isSilver = rank === 2;
  const mainColor = isSilver ? '#94a3b8' : '#c2410c';
  const shadowColor = isSilver ? '#64748b' : '#9a3412';
  const lightColor = isSilver ? '#cbd5e1' : '#fb923c';

  return (
    <div className="absolute -top-3.5 -left-3.5 z-20 pointer-events-none drop-shadow-md">
      <div className="relative w-11 h-13 flex flex-col items-center">
        {/* Scalloped round medal */}
        <svg className="w-11 h-11" viewBox="0 0 44 44" fill="none">
          {/* 12-scallop rosette border */}
          <path
            d="M 22 2 
               C 24 2 26 4 28 3.5 C 30 3 32 5 33.5 6.5 C 35 8 37 8.5 38 10.5 C 39 12.5 40 14.5 40.5 16.5 C 41 18.5 42 20 42 22
               C 42 24 41 25.5 40.5 27.5 C 40 29.5 39 31.5 38 33.5 C 37 35.5 35 36 33.5 37.5 C 32 39 30 41 28 40.5 C 26 40 24 42 22 42
               C 20 42 18 40 16 40.5 C 14 41 12 39 10.5 37.5 C 9 36 7 35.5 6 33.5 C 5 31.5 4 29.5 3.5 27.5 C 3 25.5 2 24 2 22
               C 2 20 3 18.5 3.5 16.5 C 4 14.5 5 12.5 6 10.5 C 7 8.5 9 8 10.5 6.5 C 12 5 14 3 16 3.5 C 18 4 20 2 22 2 Z"
            fill={mainColor}
            stroke={lightColor}
            strokeWidth="1.5"
          />
          {/* Inner ring */}
          <circle cx="22" cy="22" r="14" fill={shadowColor} opacity="0.45" />
          <circle cx="22" cy="22" r="13" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="2 2" fill="none" opacity="0.65" />
          {/* Rank number */}
          <text
            x="22"
            y="27"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="16"
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {rank}
          </text>
        </svg>
        {/* Ribbon tails hanging below */}
        <div className="flex gap-1 -mt-2">
          <div
            className="w-2.5 h-4.5"
            style={{
              background: mainColor,
              clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
            }}
          />
          <div
            className="w-2.5 h-4.5"
            style={{
              background: shadowColor,
              clipPath: 'polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%)',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Laurel branch sprig for podium text
function LaurelSprig({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      className={cn('w-4 h-4 inline-block text-white/90', flip && 'scale-x-[-1]')}
      viewBox="0 0 16 16"
      fill="currentColor"
    >
      <path d="M 8 14 C 4 11 3 6 7 2 C 7 5 9 8 11 9 C 9 9 7 9 8 14 Z" opacity="0.9" />
      <path d="M 4 10 C 2 8 2 5 5 4 C 5 6 6 8 7 8 C 5 8 4 9 4 10 Z" opacity="0.8" />
      <path d="M 5 6 C 3 4 4 2 7 2 C 6 3 6 5 7 5 C 6 5 5 5 5 6 Z" opacity="0.7" />
    </svg>
  );
}

// ─── Background Leaf Petals Behind Podiums ────────────────────────────────────

function BackgroundFoliage() {
  return (
    <div className="absolute inset-x-0 bottom-0 h-44 pointer-events-none overflow-hidden select-none">
      {/* Left side: Soft lilac/periwinkle petals */}
      <div className="absolute -left-3 bottom-2 w-32 h-36">
        <div
          className="absolute left-2 bottom-0 w-16 h-28 rounded-full opacity-35"
          style={{ background: '#c4b5fd', transform: 'rotate(-42deg)', transformOrigin: 'bottom center' }}
        />
        <div
          className="absolute left-6 bottom-0 w-14 h-32 rounded-full opacity-45"
          style={{ background: '#a78bfa', transform: 'rotate(-25deg)', transformOrigin: 'bottom center' }}
        />
        <div
          className="absolute left-10 bottom-0 w-13 h-24 rounded-full opacity-30"
          style={{ background: '#ddd6fe', transform: 'rotate(-8deg)', transformOrigin: 'bottom center' }}
        />
      </div>

      {/* Center-left golden petals */}
      <div className="absolute left-[34%] bottom-2 w-20 h-28 hidden sm:block">
        <div
          className="absolute left-0 bottom-0 w-12 h-26 rounded-full opacity-40"
          style={{ background: '#fde68a', transform: 'rotate(-18deg)', transformOrigin: 'bottom center' }}
        />
        <div
          className="absolute left-4 bottom-0 w-11 h-22 rounded-full opacity-30"
          style={{ background: '#fef08a', transform: 'rotate(10deg)', transformOrigin: 'bottom center' }}
        />
      </div>

      {/* Center-right golden petals */}
      <div className="absolute right-[34%] bottom-2 w-20 h-28 hidden sm:block">
        <div
          className="absolute right-0 bottom-0 w-12 h-26 rounded-full opacity-40"
          style={{ background: '#fde68a', transform: 'rotate(18deg)', transformOrigin: 'bottom center' }}
        />
        <div
          className="absolute right-4 bottom-0 w-11 h-22 rounded-full opacity-30"
          style={{ background: '#fef08a', transform: 'rotate(-10deg)', transformOrigin: 'bottom center' }}
        />
      </div>

      {/* Right side: Soft peach/orange petals */}
      <div className="absolute -right-3 bottom-2 w-32 h-36">
        <div
          className="absolute right-2 bottom-0 w-16 h-28 rounded-full opacity-35"
          style={{ background: '#fed7aa', transform: 'rotate(42deg)', transformOrigin: 'bottom center' }}
        />
        <div
          className="absolute right-6 bottom-0 w-14 h-32 rounded-full opacity-45"
          style={{ background: '#fb923c', transform: 'rotate(25deg)', transformOrigin: 'bottom center' }}
        />
        <div
          className="absolute right-10 bottom-0 w-13 h-24 rounded-full opacity-30"
          style={{ background: '#ffedd5', transform: 'rotate(8deg)', transformOrigin: 'bottom center' }}
        />
      </div>
    </div>
  );
}

// ─── Top 3 Mobile Row Card (< md screens) ─────────────────────────────────────

interface Top3RowCardProps {
  student: LeaderboardEntry;
  rank: 1 | 2 | 3;
  onSelect?: (student: LeaderboardEntry) => void;
}

function Top3MobileRowCard({ student, rank, onSelect }: Top3RowCardProps) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  return (
    <motion.div
      onClick={() => onSelect?.(student)}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.22, delay: rank * 0.06 }}
      className={cn(
        'relative flex items-center justify-between gap-3 rounded-2xl p-3 sm:p-3.5 border transition-all cursor-pointer shadow-xs active:scale-[0.99] select-none',
        isFirst && 'bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-surface border-amber-300/90 dark:from-amber-950/40 dark:to-surface dark:border-amber-500/30 shadow-amber-500/5',
        isSecond && 'bg-gradient-to-r from-slate-200/80 via-slate-100/40 to-surface border-slate-300/90 dark:from-slate-800/40 dark:to-surface dark:border-slate-600/40',
        isThird && 'bg-gradient-to-r from-orange-500/15 via-orange-500/5 to-surface border-orange-300/90 dark:from-orange-950/40 dark:to-surface dark:border-orange-500/30 shadow-orange-500/5'
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        {/* Place Badge */}
        <div className="relative shrink-0 flex items-center justify-center">
          {isFirst ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-white font-black text-xs shadow-xs ring-2 ring-amber-200 dark:ring-amber-500/40">
              1st
            </div>
          ) : isSecond ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-slate-300 to-slate-500 text-white font-black text-xs shadow-xs ring-2 ring-slate-200 dark:ring-slate-500/40">
              2nd
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-white font-black text-xs shadow-xs ring-2 ring-orange-200 dark:ring-orange-500/40">
              3rd
            </div>
          )}
        </div>

        {/* Avatar */}
        <Avatar
          src={student.avatar}
          name={student.name}
          size={38}
          className={cn(
            'shrink-0 ring-2 shadow-xs',
            isFirst && 'ring-amber-400',
            isSecond && 'ring-slate-300',
            isThird && 'ring-orange-400'
          )}
        />

        {/* Student Info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h4 className="font-bold text-sm text-on-surface truncate">
              {student.name}
            </h4>
            {isFirst && (
              <span className="shrink-0 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/15 px-1.5 py-0.5 rounded-md border border-amber-500/20">
                Top 1
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant truncate mt-0.5">
            {isFirst ? '1st Place Champion' : isSecond ? '2nd Place Contributor' : '3rd Place Contributor'}
          </p>
        </div>
      </div>

      {/* Stats Box */}
      <div className="flex items-center gap-2 shrink-0 bg-surface/80 dark:bg-surface-container/60 backdrop-blur-xs border border-card-border/60 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-on-surface">
        <div className="flex items-center gap-1" title="Likes">
          <Heart size={12} className={cn('fill-current', isFirst ? 'text-amber-500' : isSecond ? 'text-indigo-500' : 'text-orange-500')} />
          <span className="tabular-nums font-bold text-[12px]">{student.totalLikes ?? 0}</span>
        </div>
        <div className="h-3 w-px bg-card-border" />
        <div className="flex items-center gap-1" title="Views">
          <Eye size={12} className={cn(isFirst ? 'text-amber-500' : isSecond ? 'text-indigo-500' : 'text-orange-500')} />
          <span className="tabular-nums font-bold text-[12px]">{student.totalViews.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Podium Card Props & Config (iPad & Desktop, md+) ─────────────────────────

interface PodiumCardProps {
  student: LeaderboardEntry;
  rank: 1 | 2 | 3;
  delay?: number;
  onSelect?: (student: LeaderboardEntry) => void;
}

function PodiumCard({ student, rank, delay = 0, onSelect }: PodiumCardProps) {
  const isFirst = rank === 1;
  const isSecond = rank === 2;
  const isThird = rank === 3;

  return (
    <motion.div
      onClick={() => onSelect?.(student)}
      className={cn(
        'flex flex-col items-center flex-1 min-w-0 z-10 cursor-pointer group',
        isFirst ? 'md:-translate-y-3.5 lg:-translate-y-5 max-w-[260px] lg:max-w-[320px]' : 'max-w-[220px] lg:max-w-[270px]'
      )}
      initial={{ opacity: 0, y: 35, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* ── Main White Card ── */}
      <div
        className={cn(
          'w-full bg-white rounded-2xl md:rounded-[22px] border relative flex flex-col items-center text-center shadow-[0_12px_28px_-6px_rgba(0,0,0,0.08)] select-none transition-all duration-200 group-hover:scale-[1.02] group-hover:shadow-xl',
          isFirst && 'border-amber-200/90 shadow-[0_16px_36px_-8px_rgba(245,158,11,0.18)] pt-5 md:pt-6 lg:pt-7 pb-3 md:pb-3.5 lg:pb-4 px-2.5 md:px-3.5 lg:px-5 dark:bg-[#332B19] dark:border-[#D6A84F]/40 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]',
          isSecond && 'border-slate-200/90 shadow-[0_12px_28px_-6px_rgba(100,116,139,0.15)] pt-4 md:pt-5 lg:pt-6 pb-3 md:pb-3.5 lg:pb-4 px-2 md:px-3 lg:px-4 dark:bg-[#27303A] dark:border-[#AEB7C4]/40 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]',
          isThird && 'border-orange-200/90 shadow-[0_12px_28px_-6px_rgba(234,88,12,0.14)] pt-4 md:pt-5 lg:pt-6 pb-3 md:pb-3.5 lg:pb-4 px-2 md:px-3 lg:px-4 dark:bg-[#33251F] dark:border-[#B8794A]/40 dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)]'
        )}
      >
        {/* Rosette Medal for 2nd & 3rd */}
        {!isFirst && <RosetteBadge rank={rank as 2 | 3} />}

        {/* Crown & Laurel for 1st */}
        {isFirst && <CrownGraphic />}

        {/* Avatar area */}
        <div className="relative mb-2 mt-1">
          {isFirst && <AvatarLaurelWreath />}
          <Avatar
            src={student.avatar}
            name={student.name}
            size={isFirst ? 62 : 52}
            className={cn(
              'shrink-0',
              isFirst && 'ring-4 ring-[#f59e0b] dark:ring-[#D6A84F] shadow-md',
              isSecond && 'ring-4 ring-slate-300 dark:ring-[#AEB7C4] shadow-sm',
              isThird && 'ring-4 ring-orange-300 dark:ring-[#B8794A] shadow-sm'
            )}
          />
        </div>

        {/* Contributor Name */}
        <h3
          className={cn(
            'font-bold text-slate-800 dark:text-[#F3F4F6] tracking-tight line-clamp-1 w-full mt-1 text-sm md:text-base'
          )}
        >
          {student.name}
        </h3>

        {/* Stats Pill Box */}
        <div
          className={cn(
            'w-full rounded-xl mt-2.5 md:mt-3 flex items-center justify-around py-1.5 md:py-2 px-1.5 md:px-2 border',
            isFirst && 'bg-[#fffbeb] border-amber-200/70 dark:bg-[#282113] dark:border-[#D6A84F]/30',
            isSecond && 'bg-[#f8fafc] border-slate-200/70 dark:bg-[#1E252D] dark:border-[#AEB7C4]/30',
            isThird && 'bg-[#fff7ed] border-orange-200/70 dark:bg-[#261B16] dark:border-[#B8794A]/30'
          )}
        >
          {/* Likes */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <Heart
                size={12}
                className={cn(
                  'fill-current',
                  isFirst && 'text-amber-500 dark:text-[#D6A84F]',
                  isSecond && 'text-indigo-500 dark:text-[#AEB7C4]',
                  isThird && 'text-orange-500 dark:text-[#B8794A]'
                )}
              />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                Likes
              </span>
            </div>
            <span className="text-xs md:text-sm lg:text-base font-extrabold text-slate-800 dark:text-[#F3F4F6] tabular-nums leading-tight mt-0.5">
              {student.totalLikes ?? 0}
            </span>
          </div>

          {/* Divider */}
          <div
            className={cn(
              'h-7 w-px shrink-0',
              isFirst && 'bg-amber-200/80 dark:bg-[#D6A84F]/30',
              isSecond && 'bg-slate-200/80 dark:bg-[#AEB7C4]/30',
              isThird && 'bg-orange-200/80 dark:bg-[#B8794A]/30'
            )}
          />

          {/* Views */}
          <div className="flex flex-col items-center flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <Eye
                size={12}
                className={cn(
                  isFirst && 'text-amber-500 dark:text-[#D6A84F]',
                  isSecond && 'text-indigo-500 dark:text-[#AEB7C4]',
                  isThird && 'text-orange-500 dark:text-[#B8794A]'
                )}
              />
              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 dark:text-[#9CA3AF]">
                Views
              </span>
            </div>
            <span className="text-xs md:text-sm lg:text-base font-extrabold text-slate-800 dark:text-[#F3F4F6] tabular-nums leading-tight mt-0.5">
              {student.totalViews.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* ── 3D Podium Pedestal Step ── */}
      <div
        className={cn(
          'w-full flex items-center justify-center gap-1.5 shadow-md relative overflow-hidden',
          isFirst && 'h-12 md:h-13 lg:h-14 rounded-b-2xl bg-gradient-to-b from-[#fbbf24] to-[#d97706] shadow-amber-500/25 border-t border-amber-300/40 dark:from-[#3D331E] dark:to-[#2B2313] dark:border-[#D6A84F]/30 dark:shadow-none',
          isSecond && 'h-9 md:h-10 lg:h-11 rounded-b-2xl bg-gradient-to-b from-[#94a3b8] to-[#64748b] shadow-slate-500/20 border-t border-slate-200/40 dark:from-[#2F3A46] dark:to-[#212932] dark:border-[#AEB7C4]/30 dark:shadow-none',
          isThird && 'h-8 md:h-8.5 lg:h-9 rounded-b-2xl bg-gradient-to-b from-[#ea580c] to-[#9a3412] shadow-orange-500/20 border-t border-orange-300/40 dark:from-[#3D2C24] dark:to-[#2B1E19] dark:border-[#B8794A]/30 dark:shadow-none'
        )}
      >
        <LaurelSprig />
        <span className="text-xs md:text-sm font-bold text-white tracking-wide drop-shadow-xs">
          {isFirst ? '1st Place' : isSecond ? '2nd Place' : '3rd Place'}
        </span>
        <LaurelSprig flip />
      </div>
    </motion.div>
  );
}

// ─── Main Leaderboard Page ────────────────────────────────────────────────────

export function LeaderboardPage() {
  const { user } = useAuth();

  const [sortBy, setSortBy] = useState<'likes' | 'views'>('likes');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [students, setStudents] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProfile, setSelectedProfile] = useState<UploaderProfile | null>(null);

  const handleOpenProfile = (student: LeaderboardEntry) => {
    setSelectedProfile({
      uploaderId: student.id,
      uploaderName: student.name,
      uploaderUsername: student.username,
      uploaderAvatar: student.avatar,
      uploaderUniversity: student.university || undefined,
      uploaderCollege: student.branch || undefined,
      uploaderUploadsCount: student.totalUploads,
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listLeaderboardForUI(user?.id)
      .then((data) => {
        if (active) setStudents(data);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [user?.id]);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (sortBy === 'views') return b.totalViews - a.totalViews;
      return (b.totalLikes ?? 0) - (a.totalLikes ?? 0);
    });
  }, [students, sortBy]);

  const rankLabel = (rank: number) => {
    if (rank === 1) return '1st';
    if (rank === 2) return '2nd';
    if (rank === 3) return '3rd';
    return String(rank);
  };

  const top3 = sortedStudents.slice(0, 3);

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 w-full min-w-0">
      {/* ── Page Header with Filter ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-card-border pb-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-on-surface">Leaderboard</h1>
          <p className="mt-0.5 text-sm text-on-surface-variant">
            Top contributors ranked by likes and resource reach.
          </p>
        </div>

        <div className="flex items-center gap-2" ref={dropdownRef}>
          <span className="text-xs font-medium text-on-surface-variant shrink-0">Rank by</span>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className={cn(
                'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all cursor-pointer',
                dropdownOpen
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-card-border bg-surface-container text-on-surface hover:border-primary/40 hover:bg-surface-container-high'
              )}
            >
              {sortBy === 'likes' ? (
                <><Heart size={13} className="text-rose-500 fill-current shrink-0" /> Most Liked</>
              ) : (
                <><Eye size={13} className="text-emerald-500 shrink-0" /> Most Viewed</>
              )}
              <ChevronDown
                size={13}
                className={cn('ml-0.5 transition-transform duration-200 shrink-0', dropdownOpen && 'rotate-180')}
              />
            </button>

            <AnimatePresence>
              {dropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -5, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -5, scale: 0.97 }}
                  transition={{ duration: 0.12, ease: 'easeOut' }}
                  className="absolute right-0 top-full mt-1.5 z-50 w-52 rounded-xl border border-card-border bg-surface-container-low shadow-lg overflow-hidden"
                >
                  <button
                    onClick={() => { setSortBy('likes'); setDropdownOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-container-high',
                      sortBy === 'likes' && 'bg-surface-container-high'
                    )}
                  >
                    <Heart size={13} className="text-rose-500 fill-current shrink-0" />
                    <span className={cn('font-medium flex-1', sortBy === 'likes' ? 'text-on-surface' : 'text-on-surface-variant')}>
                      Most Liked
                    </span>
                    {sortBy === 'likes' && <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />}
                  </button>
                  <div className="mx-3 h-px bg-card-border" />
                  <button
                    onClick={() => { setSortBy('views'); setDropdownOpen(false); }}
                    className={cn(
                      'flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-surface-container-high',
                      sortBy === 'views' && 'bg-surface-container-high'
                    )}
                  >
                    <Eye size={13} className="text-emerald-500 shrink-0" />
                    <span className={cn('font-medium flex-1', sortBy === 'views' ? 'text-on-surface' : 'text-on-surface-variant')}>
                      Most Viewed
                    </span>
                    {sortBy === 'views' && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Loading State ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-on-surface-variant">
          <div className="h-7 w-7 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm">Loading leaderboard...</p>
        </div>
      )}

      {/* ── Empty State ── */}
      {!loading && sortedStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-container text-on-surface-variant border border-card-border">
            <Trophy size={22} />
          </span>
          <div>
            <h2 className="text-base font-semibold text-on-surface">No contributors yet</h2>
            <p className="mt-0.5 text-sm text-on-surface-variant max-w-xs">
              Be the first to upload study materials and claim the top spot.
            </p>
          </div>
        </div>
      )}

      {!loading && sortedStudents.length > 0 && (
        <>
          {/* ── Celebration Top 3 Banner ── */}
          {top3.length >= 2 && (
            <div
              className="relative rounded-3xl overflow-hidden pt-6 md:pt-8 pb-4 md:pb-0 px-3 sm:px-6 md:px-8 border border-amber-100/70 dark:border-amber-900/30"
              style={{
                background: 'linear-gradient(180deg, #fffdf8 0%, #fef8ed 60%, #fef3df 100%)',
              }}
            >
              {/* Confetti sprinkle bits */}
              {/* Continuous celebration pouring paper animation */}
              <ConfettiPouringCanvas />

              {/* Foliage petals behind podiums */}
              <BackgroundFoliage />

              {/* Header: Trophy, Title & Subtitle */}
              <div className="relative flex flex-col items-center text-center mb-5 md:mb-8 lg:mb-10 z-10">
                <TrophyBannerIcon />
                <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-[#0f172a] tracking-tight mt-1">
                  Top 3 Contributors
                </h2>
                <p className="text-xs sm:text-sm text-[#64748b] mt-0.5 sm:mt-1 font-medium">
                  Your support keeps the community growing!
                </p>
              </div>

              {/* ── MOBILE: ROWS FORMAT (< md screens) ── */}
              <div className="relative flex flex-col gap-2.5 pb-2 z-10 md:hidden">
                {top3[0] && <Top3MobileRowCard student={top3[0]} rank={1} onSelect={handleOpenProfile} />}
                {top3[1] && <Top3MobileRowCard student={top3[1]} rank={2} onSelect={handleOpenProfile} />}
                {top3[2] && <Top3MobileRowCard student={top3[2]} rank={3} onSelect={handleOpenProfile} />}
              </div>

              {/* ── TABLET / IPAD / DESKTOP: PODIUM FORMAT (md+) ── */}
              <div className="relative hidden md:flex items-end justify-center gap-3 md:gap-4 lg:gap-6 px-1 md:px-4 z-10 max-w-4xl mx-auto">
                {top3[1] && <PodiumCard student={top3[1]} rank={2} delay={0.1} onSelect={handleOpenProfile} />}
                {top3[0] && <PodiumCard student={top3[0]} rank={1} delay={0} onSelect={handleOpenProfile} />}
                {top3[2] && <PodiumCard student={top3[2]} rank={3} delay={0.2} onSelect={handleOpenProfile} />}
              </div>
            </div>
          )}

          {/* ── Full Rankings Table ── */}
          <Card padded={false} hoverable={false} className="w-full min-w-0 overflow-hidden mt-2">
            <div className="w-full min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-2.5 border-b border-card-border bg-surface-container">
                <span className="w-7 sm:w-10 shrink-0 text-center text-xs font-semibold text-on-surface-variant">#</span>
                <span className="w-7 sm:w-8 shrink-0" />
                <span className="flex-1 min-w-0 text-xs font-medium text-on-surface-variant">Student</span>
                <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
                  <span className="flex items-center gap-1 text-xs font-medium text-on-surface-variant w-11 sm:w-[4.5rem] justify-end">
                    <Heart size={11} className="text-rose-500 fill-current" /> <span className="hidden sm:inline">Likes</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-on-surface-variant w-11 sm:w-[4.5rem] justify-end">
                    <Eye size={11} /> <span className="hidden sm:inline">Views</span>
                  </span>
                  <span className="hidden sm:flex items-center gap-1 text-xs font-medium text-on-surface-variant w-20 justify-end">
                    <Download size={11} /> Downloads
                  </span>
                </div>
              </div>

              <div className="divide-y divide-card-border">
                {sortedStudents.map((student, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;
                  const isCurrentUser = !!(user && student.id === user.id);

                  return (
                    <motion.div
                      key={student.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.16, delay: Math.min(index * 0.035, 0.35) }}
                      onClick={() => handleOpenProfile(student)}
                      className={cn(
                        'flex items-center gap-1.5 sm:gap-3 px-3 sm:px-4 py-3 transition-colors cursor-pointer group',
                        isCurrentUser
                          ? 'bg-primary/[0.04] border-l-2 border-l-primary'
                          : 'hover:bg-surface-container'
                      )}
                    >
                      <div
                        className={cn(
                          'w-7 sm:w-10 shrink-0 flex items-center justify-center h-6 sm:h-7 rounded-md text-[11px] sm:text-xs font-semibold tabular-nums',
                          rank === 1 && 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
                          rank === 2 && 'bg-slate-500/10 text-slate-500',
                          rank === 3 && 'bg-orange-500/10 text-orange-500',
                          !isTop3 && 'text-on-surface-variant'
                        )}
                      >
                        {isTop3 ? rankLabel(rank) : rank}
                      </div>

                      <Avatar src={student.avatar} name={student.name} size={28} className="shrink-0 transition-transform group-hover:scale-105 sm:w-8 sm:h-8" />

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">
                            {student.name}
                          </p>
                          {isCurrentUser && (
                            <span className="rounded bg-primary/10 px-1.5 py-px text-[10px] font-semibold text-primary shrink-0 leading-4">
                              you
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
                        <span className="text-xs sm:text-sm font-semibold text-on-surface tabular-nums w-11 sm:w-[4.5rem] text-right">
                          {student.totalLikes ?? 0}
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-on-surface tabular-nums w-11 sm:w-[4.5rem] text-right">
                          {student.totalViews.toLocaleString()}
                        </span>
                        <span className="text-sm font-semibold text-on-surface tabular-nums w-20 text-right hidden sm:block">
                          {student.totalDownloads.toLocaleString()}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="px-4 py-2 border-t border-card-border bg-surface-container">
              <p className="text-xs text-on-surface-variant">
                {sortedStudents.length} contributor{sortedStudents.length !== 1 ? 's' : ''} · sorted by{' '}
                {sortBy === 'likes' ? 'total likes' : 'total views'}
              </p>
            </div>
          </Card>
        </>
      )}

      {/* ── User Profile Panel (Opens on Right) ── */}
      <UserProfilePanel
        profile={selectedProfile}
        onClose={() => setSelectedProfile(null)}
        side="right"
      />
    </div>
  );
}

export default LeaderboardPage;
