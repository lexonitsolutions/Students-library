import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { MoreHorizontal } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useWorkspace } from '../../hooks/useWorkspace';
import {
  calculatePixelPosition,
  useAIAssistantPreferences,
} from './useAIAssistantPreferences';
import { AICharacter } from './AICharacter';
import { AssistantMenu } from './AssistantMenu';
import { AssistantTooltip } from './AssistantTooltip';
import { getAssistantDimensions, type AssistantPosition } from './types';

export const AIFloatingAssistant: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspace } = useWorkspace();
  const prefersReducedMotion = useReducedMotion();

  const {
    preferences,
    setVisible,
    setSize,
    setPosition,
    resetPosition,
    markIntroBubbleSeen,
  } = useAIAssistantPreferences();

  // Route visibility filter: ONLY Student Dashboard (/dashboard) and Student Library (/library)
  const isTargetRoute =
    location.pathname === '/dashboard' || location.pathname === '/library';
  const isAdminWorkspace = user?.role === 'admin' && workspace !== 'student';
  const shouldRender = isTargetRoute && !isAdminWorkspace && preferences.visible;

  // Visual coordinates state (defaults to bottom-right corner)
  const [coords, setCoords] = useState<{ x: number; y: number }>(() => {
    if (typeof window !== 'undefined') {
      const { x, y } = calculatePixelPosition(
        preferences.position,
        preferences.size,
        window.innerWidth,
        window.innerHeight
      );
      return { x, y };
    }
    return { x: 0, y: 0 };
  });

  const coordsRef = useRef(coords);
  coordsRef.current = coords;

  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Synchronous drag tracking refs
  const isPointerDownRef = useRef(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{
    pointerX: number;
    pointerY: number;
    elemX: number;
    elemY: number;
    hasMoved: boolean;
  }>({ pointerX: 0, pointerY: 0, elemX: 0, elemY: 0, hasMoved: false });

  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute position based on window dimensions and user preference
  const updatePositionFromPreferences = useCallback(() => {
    if (typeof window === 'undefined') return;
    const { x, y } = calculatePixelPosition(
      preferences.position,
      preferences.size,
      window.innerWidth,
      window.innerHeight
    );
    setCoords({ x, y });
    coordsRef.current = { x, y };
  }, [preferences.position, preferences.size]);

  // Recalculate on mount, preference change, or window resize
  useEffect(() => {
    updatePositionFromPreferences();

    const handleResize = () => {
      updatePositionFromPreferences();
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updatePositionFromPreferences]);

  // Clean up long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    };
  }, []);

  const isMobile = typeof window !== 'undefined' ? window.innerWidth < 640 : false;
  const { containerSize } = getAssistantDimensions(preferences.size, isMobile);

  // Pointer Down (Mouse, Touch, Stylus)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only respond to primary button (left click or touch)
    if (e.button !== 0) return;

    // Prevent text selection or browser default drag
    e.preventDefault();

    if (!preferences.hasSeenIntroBubble) {
      markIntroBubbleSeen();
    }

    isPointerDownRef.current = true;
    isDraggingRef.current = false;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      elemX: coordsRef.current.x,
      elemY: coordsRef.current.y,
      hasMoved: false,
    };

    setIsPressed(true);

    // Setup long-press (500ms) to trigger contextual menu on touch/hold
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      if (isPointerDownRef.current && !dragStartRef.current.hasMoved) {
        setMenuOpen(true);
        setIsPressed(false);
      }
    }, 500);

    // Attach global move and up listeners for 100% reliable tracking
    const handleGlobalPointerMove = (moveEv: PointerEvent) => {
      if (!isPointerDownRef.current) return;

      const dx = moveEv.clientX - dragStartRef.current.pointerX;
      const dy = moveEv.clientY - dragStartRef.current.pointerY;
      const distance = Math.hypot(dx, dy);

      // 5px threshold to differentiate drag vs click
      if (!dragStartRef.current.hasMoved) {
        if (distance > 5) {
          dragStartRef.current.hasMoved = true;
          isDraggingRef.current = true;
          setIsDragging(true);
          if (longPressTimerRef.current) {
            clearTimeout(longPressTimerRef.current);
            longPressTimerRef.current = null;
          }
        } else {
          return;
        }
      }

      const { minX, maxX, minY, maxY } = calculatePixelPosition(
        preferences.position,
        preferences.size,
        window.innerWidth,
        window.innerHeight
      );

      const nextX = Math.max(minX, Math.min(maxX, dragStartRef.current.elemX + dx));
      const nextY = Math.max(minY, Math.min(maxY, dragStartRef.current.elemY + dy));

      coordsRef.current = { x: nextX, y: nextY };
      setCoords({ x: nextX, y: nextY });
    };

    const handleGlobalPointerUp = () => {
      if (!isPointerDownRef.current) return;
      isPointerDownRef.current = false;

      window.removeEventListener('pointermove', handleGlobalPointerMove);
      window.removeEventListener('pointerup', handleGlobalPointerUp);
      window.removeEventListener('pointercancel', handleGlobalPointerUp);

      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }

      const wasMoving = dragStartRef.current.hasMoved;
      setIsPressed(false);
      setIsDragging(false);
      isDraggingRef.current = false;

      if (wasMoving) {
        // Drag ended: gently snap to closest edge (left or right)
        const { minX, maxX, minY, maxY } = calculatePixelPosition(
          preferences.position,
          preferences.size,
          window.innerWidth,
          window.innerHeight
        );

        const currentX = coordsRef.current.x;
        const currentY = coordsRef.current.y;
        const midX = window.innerWidth / 2;
        const finalEdge: 'left' | 'right' =
          currentX + containerSize / 2 < midX ? 'left' : 'right';
        const snappedX = finalEdge === 'left' ? minX : maxX;

        const yRatio =
          maxY > minY
            ? Math.max(0, Math.min(1, (currentY - minY) / (maxY - minY)))
            : 1.0;

        const newPosition: AssistantPosition = {
          edge: finalEdge,
          yRatio,
        };

        coordsRef.current = { x: snappedX, y: currentY };
        setCoords({ x: snappedX, y: currentY });
        setPosition(newPosition);
      } else {
        // Clean tap/click -> open AI Learning page without full page reload
        navigate('/ai-learning');
      }
    };

    window.addEventListener('pointermove', handleGlobalPointerMove, { passive: true });
    window.addEventListener('pointerup', handleGlobalPointerUp);
    window.addEventListener('pointercancel', handleGlobalPointerUp);
  };

  // Context Menu (Right Click)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMenuOpen(true);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      navigate('/ai-learning');
    }
  };

  return (
    <AnimatePresence>
      {shouldRender && (
        <motion.div
          key="ai-floating-assistant"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={{
            position: 'fixed',
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            width: `${containerSize}px`,
            height: `${containerSize}px`,
            zIndex: 40,
            touchAction: 'none',
            userSelect: 'none',
            WebkitUserSelect: 'none',
            transition: isDragging ? 'none' : 'left 0.28s ease-out, top 0.28s ease-out',
          }}
          className={`group ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={handlePointerDown}
          onContextMenu={handleContextMenu}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            if (!isDraggingRef.current) setIsPressed(false);
          }}
          tabIndex={0}
          role="button"
          aria-label="Open AI Learning Assistant"
          onKeyDown={handleKeyDown}
        >
          {/* Speech Bubble (First-Time users) & Tooltip */}
          <AssistantTooltip
            showTooltip={isHovered && !isDragging && !menuOpen}
            showIntroBubble={!preferences.hasSeenIntroBubble && !isDragging && !menuOpen}
            position={preferences.position}
            onDismissIntro={markIntroBubbleSeen}
          />

          {/* Main Glassmorphic Circular Floating Container */}
          <motion.div
            className="relative w-full h-full rounded-full border border-card-border/80 dark:border-primary/30 bg-surface-container-lowest/95 dark:bg-surface-container/95 backdrop-blur-md p-1.5 shadow-xl transition-shadow duration-200 hover:border-primary/50 hover:shadow-2xl flex items-center justify-center overflow-visible"
            animate={{
              scale: isPressed ? 0.94 : isHovered ? 1.05 : 1,
            }}
            transition={
              prefersReducedMotion
                ? { duration: 0 }
                : { type: 'spring', stiffness: 450, damping: 26 }
            }
          >
            {/* Soft Ambient Radial Glow Behind Robot */}
            <div
              className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/10 via-sky-400/10 to-amber-400/10 dark:from-primary/20 dark:via-sky-400/20 dark:to-transparent pointer-events-none"
              aria-hidden="true"
            />

            {/* 3D Character Inside Container */}
            <AICharacter
              size={preferences.size}
              isHovered={isHovered}
              isPressed={isPressed}
              isDragging={isDragging}
            />

            {/* Options Trigger (3-dots button on hover or focus) */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen((prev) => !prev);
              }}
              aria-label="Assistant options"
              title="Assistant options"
              className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-surface-container-high border border-card-border/80 text-on-surface-variant shadow-xs opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity hover:text-on-surface hover:scale-110 cursor-pointer pointer-events-auto"
            >
              <MoreHorizontal size={11} />
            </button>
          </motion.div>

          {/* Contextual Menu */}
          <AssistantMenu
            isOpen={menuOpen}
            onClose={() => setMenuOpen(false)}
            currentSize={preferences.size}
            onSelectSize={(newSize) => setSize(newSize)}
            onResetPosition={resetPosition}
            onHideAssistant={() => setVisible(false)}
            position={preferences.position}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};
