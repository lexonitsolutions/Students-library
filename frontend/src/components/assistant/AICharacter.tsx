import React from 'react';
import { cn } from '../../lib/cn';
import type { AssistantSize } from './types';

interface AICharacterProps {
  readonly size: AssistantSize;
  readonly isHovered: boolean;
  readonly isPressed: boolean;
  readonly isDragging: boolean;
  readonly className?: string;
}

export const AICharacter: React.FC<AICharacterProps> = ({
  isHovered,
  isPressed,
  isDragging,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative select-none pointer-events-none transition-transform duration-200 ease-out flex items-center justify-center',
        isHovered && !isDragging && 'scale-105 -rotate-2',
        isPressed && 'scale-95',
        isDragging && 'scale-108 rotate-1',
        className
      )}
      style={{ width: '100%', height: '100%' }}
    >
      <style>{`
        @keyframes aiFloatAnim {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-4px) rotate(1.5deg);
          }
        }
        @keyframes aiShadowAnim {
          0%, 100% {
            transform: scale(1);
            opacity: 0.35;
          }
          50% {
            transform: scale(0.8);
            opacity: 0.2;
          }
        }
        @keyframes aiBlinkAnim {
          0%, 92%, 100% {
            transform: scaleY(1);
          }
          95% {
            transform: scaleY(0.12);
          }
        }
        @keyframes aiWaveAnim {
          0%, 75%, 100% {
            transform: rotate(0deg);
          }
          80% {
            transform: rotate(18deg);
          }
          85% {
            transform: rotate(-10deg);
          }
          90% {
            transform: rotate(14deg);
          }
          95% {
            transform: rotate(0deg);
          }
        }
        @keyframes aiAntennaGlow {
          0%, 100% {
            opacity: 0.75;
            filter: drop-shadow(0 0 2px #38BDF8);
          }
          50% {
            opacity: 1;
            filter: drop-shadow(0 0 5px #60A5FA);
          }
        }
        .ai-char-floating {
          animation: aiFloatAnim 3.8s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .ai-char-shadow {
          animation: aiShadowAnim 3.8s ease-in-out infinite;
          transform-origin: center center;
        }
        .ai-char-eyes {
          animation: aiBlinkAnim 3.6s ease-in-out infinite;
          transform-origin: 50% 52px;
        }
        .ai-char-hand {
          animation: aiWaveAnim 5.5s ease-in-out infinite;
          transform-origin: 78px 65px;
        }
        .ai-char-antenna-node {
          animation: aiAntennaGlow 2.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .ai-char-floating,
          .ai-char-shadow,
          .ai-char-eyes,
          .ai-char-hand,
          .ai-char-antenna-node {
            animation: none !important;
          }
        }
      `}</style>

      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible drop-shadow-md"
        aria-hidden="true"
      >
        <defs>
          {/* Subtle Ambient Floor Shadow */}
          <radialGradient id="aiFloorShadow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1E293B" stopOpacity="0.45" />
            <stop offset="60%" stopColor="#1E293B" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#1E293B" stopOpacity="0" />
          </radialGradient>

          {/* Robot Head 3D Lighting - Light Theme */}
          <radialGradient id="aiHeadLight" cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="45%" stopColor="#F1F5FD" />
            <stop offset="85%" stopColor="#DDE6FA" />
            <stop offset="100%" stopColor="#C4D4F5" />
          </radialGradient>

          {/* Robot Head 3D Lighting - Dark Theme */}
          <radialGradient id="aiHeadDark" cx="36%" cy="32%" r="68%">
            <stop offset="0%" stopColor="#2E3B5E" />
            <stop offset="45%" stopColor="#202A46" />
            <stop offset="85%" stopColor="#171F36" />
            <stop offset="100%" stopColor="#101627" />
          </radialGradient>

          {/* Head Glossy Rim Highlight */}
          <linearGradient id="aiHeadRim" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#A5BDFC" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#3049B8" stopOpacity="0.5" />
          </linearGradient>

          {/* High-Tech Curved Visor */}
          <linearGradient id="aiVisorBg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0B101E" />
            <stop offset="100%" stopColor="#182238" />
          </linearGradient>

          {/* Visor Glass Reflection */}
          <linearGradient id="aiVisorGlass" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.35" />
            <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.1" />
          </linearGradient>

          {/* Glowing Digital Eyes */}
          <linearGradient id="aiEyeGlow" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#67E8F9" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          {/* Academic Graduation Cap (Brand Blue) */}
          <linearGradient id="aiCapGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#435ECE" />
            <stop offset="60%" stopColor="#3049B8" />
            <stop offset="100%" stopColor="#213388" />
          </linearGradient>

          {/* Gold Tassel */}
          <linearGradient id="aiTasselGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#FFD369" />
            <stop offset="60%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#D97706" />
          </linearGradient>

          {/* Ear / Headphone Accents */}
          <linearGradient id="aiEarGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#FFA500" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>

        {/* 3D Depth Shadow on Ground */}
        <ellipse
          cx="50"
          cy="92"
          rx="25"
          ry="5.5"
          fill="url(#aiFloorShadow)"
          className="ai-char-shadow"
        />

        {/* Floating Animated Character Assembly */}
        <g className="ai-char-floating">
          {/* Antenna Stem */}
          <line
            x1="50"
            y1="22"
            x2="50"
            y2="14"
            stroke="#94A3B8"
            strokeWidth="2.4"
            strokeLinecap="round"
          />

          {/* Antenna Glowing Orb */}
          <circle
            cx="50"
            cy="12"
            r="4.2"
            fill="#38BDF8"
            className="ai-char-antenna-node"
          />
          <circle cx="48.8" cy="10.8" r="1.3" fill="#FFFFFF" opacity="0.9" />

          {/* Left Ear Accent / Headphone Cup */}
          <rect
            x="14"
            y="46"
            width="6.5"
            height="14"
            rx="3.2"
            fill="url(#aiEarGrad)"
            stroke="#C2410C"
            strokeWidth="0.8"
          />

          {/* Right Ear Accent / Headphone Cup */}
          <rect
            x="79.5"
            y="46"
            width="6.5"
            height="14"
            rx="3.2"
            fill="url(#aiEarGrad)"
            stroke="#C2410C"
            strokeWidth="0.8"
          />

          {/* Main 3D Sculpted Head Base */}
          {/* Light Theme Head */}
          <rect
            x="18"
            y="23"
            width="64"
            height="58"
            rx="27"
            className="dark:hidden"
            fill="url(#aiHeadLight)"
            stroke="url(#aiHeadRim)"
            strokeWidth="1.6"
          />

          {/* Dark Theme Head */}
          <rect
            x="18"
            y="23"
            width="64"
            height="58"
            rx="27"
            className="hidden dark:block"
            fill="url(#aiHeadDark)"
            stroke="#3B486B"
            strokeWidth="1.6"
          />

          {/* Glossy Specular Highlight on Head Top-Left */}
          <ellipse
            cx="36"
            cy="31"
            rx="14"
            ry="6"
            transform="rotate(-15 36 31)"
            fill="#FFFFFF"
            opacity="0.55"
          />

          {/* Visor Area (Sleek Dark Glass) */}
          <rect
            x="24"
            y="37"
            width="52"
            height="32"
            rx="15"
            fill="url(#aiVisorBg)"
            stroke="#1E293B"
            strokeWidth="1.2"
          />

          {/* Visor Specular Glass Arc Reflection */}
          <path
            d="M 28 42 Q 50 36 72 43 Q 50 39 28 42 Z"
            fill="url(#aiVisorGlass)"
          />

          {/* Expressive Digital Eyes & Smile */}
          <g className="ai-char-eyes">
            {/* Left Eye */}
            <rect
              x="34"
              y="45"
              width="9.5"
              height="13.5"
              rx="4.75"
              fill="url(#aiEyeGlow)"
            />
            {/* Left Eye Specular Glint */}
            <circle cx="36.5" cy="48" r="2" fill="#FFFFFF" />

            {/* Right Eye */}
            <rect
              x="56.5"
              y="45"
              width="9.5"
              height="13.5"
              rx="4.75"
              fill="url(#aiEyeGlow)"
            />
            {/* Right Eye Specular Glint */}
            <circle cx="59" cy="48" r="2" fill="#FFFFFF" />
          </g>

          {/* Cute Soft Blush Cheeks */}
          <ellipse cx="32" cy="61" rx="3.5" ry="1.8" fill="#F43F5E" opacity="0.35" />
          <ellipse cx="68" cy="61" rx="3.5" ry="1.8" fill="#F43F5E" opacity="0.35" />

          {/* Friendly LED Smile Line */}
          <path
            d={isHovered ? 'M 44 60 Q 50 66 56 60' : 'M 45 61 Q 50 65 55 61'}
            stroke="#38BDF8"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />

          {/* Floating Friendly Wave Hand (Cute Companion Detail) */}
          <g className="ai-char-hand">
            <ellipse
              cx="82"
              cy="67"
              rx="4.5"
              ry="4.5"
              className="dark:hidden"
              fill="#E2E8F0"
              stroke="#CBD5E1"
              strokeWidth="0.8"
            />
            <ellipse
              cx="82"
              cy="67"
              rx="4.5"
              ry="4.5"
              className="hidden dark:block"
              fill="#24304D"
              stroke="#3B486B"
              strokeWidth="0.8"
            />
          </g>

          {/* Stylized Student Academic Graduation Cap */}
          <g transform="translate(1, -2)">
            {/* Cap Diamond Top (Angled jauntily) */}
            <polygon
              points="49,15 75,22 49,29 23,22"
              fill="url(#aiCapGrad)"
              stroke="#1E2A68"
              strokeWidth="1.2"
            />
            {/* Cap Headband / Skullcap base */}
            <path
              d="M 33 24 Q 49 29 65 24 L 64 27 Q 49 32 34 27 Z"
              fill="#1D2764"
            />
            {/* Cap Button / Center Pin */}
            <circle cx="49" cy="22" r="2" fill="#FFA500" />
            {/* Golden Tassel Dangle */}
            <path
              d="M 49 22 Q 62 26 66 36"
              stroke="url(#aiTasselGrad)"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
            />
            {/* Tassel Fringe Brush */}
            <circle cx="66" cy="37" r="2.2" fill="#FFB51B" />
          </g>
        </g>
      </svg>
    </div>
  );
};
