import { useEffect, useState, useCallback } from 'react';
import {
  AI_ASSISTANT_EVENT,
  AI_ASSISTANT_STORAGE_KEY,
  DEFAULT_ASSISTANT_PREFERENCES,
  getAssistantDimensions,
  type AssistantPosition,
  type AssistantPreferences,
  type AssistantSize,
} from './types';

function readStoredPreferences(): AssistantPreferences {
  if (typeof window === 'undefined') return DEFAULT_ASSISTANT_PREFERENCES;
  try {
    const raw = localStorage.getItem(AI_ASSISTANT_STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem('answersbro:ai_assistant_preferences:v1');
      if (legacyRaw) {
        try {
          const legacy = JSON.parse(legacyRaw);
          return {
            ...DEFAULT_ASSISTANT_PREFERENCES,
            visible: typeof legacy.visible === 'boolean' ? legacy.visible : DEFAULT_ASSISTANT_PREFERENCES.visible,
            size: ['small', 'medium', 'large'].includes(legacy.size) ? legacy.size : DEFAULT_ASSISTANT_PREFERENCES.size,
            position: DEFAULT_ASSISTANT_PREFERENCES.position,
          };
        } catch {
          // ignore
        }
      }
      return DEFAULT_ASSISTANT_PREFERENCES;
    }
    const parsed = JSON.parse(raw);
    return {
      visible: typeof parsed.visible === 'boolean' ? parsed.visible : DEFAULT_ASSISTANT_PREFERENCES.visible,
      size: ['small', 'medium', 'large'].includes(parsed.size)
        ? (parsed.size as AssistantSize)
        : DEFAULT_ASSISTANT_PREFERENCES.size,
      position: {
        edge: parsed.position?.edge === 'left' ? 'left' : 'right',
        yRatio:
          typeof parsed.position?.yRatio === 'number' && !Number.isNaN(parsed.position.yRatio)
            ? Math.max(0, Math.min(1, parsed.position.yRatio))
            : DEFAULT_ASSISTANT_PREFERENCES.position.yRatio,
      },
      hasSeenIntroBubble: typeof parsed.hasSeenIntroBubble === 'boolean' ? parsed.hasSeenIntroBubble : false,
    };
  } catch {
    return DEFAULT_ASSISTANT_PREFERENCES;
  }
}

export function writeStoredPreferences(preferences: AssistantPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AI_ASSISTANT_STORAGE_KEY, JSON.stringify(preferences));
    window.dispatchEvent(new CustomEvent(AI_ASSISTANT_EVENT, { detail: preferences }));
  } catch (err) {
    console.warn('Failed to save AI assistant preferences:', err);
  }
}

export function calculatePixelPosition(
  position: AssistantPosition,
  size: AssistantSize,
  windowWidth: number,
  windowHeight: number
): { x: number; y: number; width: number; height: number; minX: number; maxX: number; minY: number; maxY: number } {
  const isMobile = windowWidth < 640;
  const { containerSize } = getAssistantDimensions(size, isMobile);
  const safePaddingX = isMobile ? 16 : 24;
  const minX = safePaddingX;
  const maxX = Math.max(minX, windowWidth - containerSize - safePaddingX);
  const minY = 76; // Below TopBar (64px) + margin
  const safeBottom = isMobile ? 20 : 28;
  const maxY = Math.max(minY, windowHeight - containerSize - safeBottom);

  const x = position.edge === 'left' ? minX : maxX;
  const y = Math.round(minY + position.yRatio * (maxY - minY));

  return {
    x,
    y: Math.max(minY, Math.min(maxY, y)),
    width: containerSize,
    height: containerSize,
    minX,
    maxX,
    minY,
    maxY,
  };
}

export function useAIAssistantPreferences() {
  const [preferences, setPreferencesState] = useState<AssistantPreferences>(readStoredPreferences);

  useEffect(() => {
    const handleSync = () => {
      setPreferencesState(readStoredPreferences());
    };

    window.addEventListener(AI_ASSISTANT_EVENT, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(AI_ASSISTANT_EVENT, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const updatePreferences = useCallback((updater: (prev: AssistantPreferences) => AssistantPreferences) => {
    setPreferencesState((prev) => {
      const next = updater(prev);
      writeStoredPreferences(next);
      return next;
    });
  }, []);

  const setVisible = useCallback(
    (visible: boolean) => {
      updatePreferences((prev) => ({ ...prev, visible }));
    },
    [updatePreferences]
  );

  const setSize = useCallback(
    (size: AssistantSize) => {
      updatePreferences((prev) => ({ ...prev, size }));
    },
    [updatePreferences]
  );

  const setPosition = useCallback(
    (position: AssistantPosition) => {
      updatePreferences((prev) => ({ ...prev, position }));
    },
    [updatePreferences]
  );

  const resetPosition = useCallback(() => {
    updatePreferences((prev) => ({
      ...prev,
      position: DEFAULT_ASSISTANT_PREFERENCES.position,
    }));
  }, [updatePreferences]);

  const markIntroBubbleSeen = useCallback(() => {
    updatePreferences((prev) => ({ ...prev, hasSeenIntroBubble: true }));
  }, [updatePreferences]);

  return {
    preferences,
    setVisible,
    setSize,
    setPosition,
    resetPosition,
    markIntroBubbleSeen,
  };
}
