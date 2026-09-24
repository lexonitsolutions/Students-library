export type AssistantSize = 'small' | 'medium' | 'large';

export interface AssistantPosition {
  readonly edge: 'left' | 'right';
  readonly yRatio: number; // 0 (near top safe bound) to 1 (near bottom safe bound)
}

export interface AssistantPreferences {
  readonly visible: boolean;
  readonly size: AssistantSize;
  readonly position: AssistantPosition;
  readonly hasSeenIntroBubble: boolean;
}

export const AI_ASSISTANT_STORAGE_KEY = 'answersbro:ai_assistant_preferences:v2';
export const AI_ASSISTANT_EVENT = 'ai-assistant-pref-changed';

export const DEFAULT_ASSISTANT_PREFERENCES: AssistantPreferences = {
  visible: true,
  size: 'medium',
  position: {
    edge: 'right',
    yRatio: 1.0, // default in bottom right corner
  },
  hasSeenIntroBubble: false,
};

export interface AssistantDimensions {
  readonly containerSize: number;
  readonly characterSize: number;
}

export function getAssistantDimensions(size: AssistantSize, isMobile: boolean): AssistantDimensions {
  switch (size) {
    case 'small':
      return isMobile
        ? { containerSize: 48, characterSize: 38 }
        : { containerSize: 54, characterSize: 42 };
    case 'large':
      return isMobile
        ? { containerSize: 68, characterSize: 54 }
        : { containerSize: 78, characterSize: 62 };
    case 'medium':
    default:
      return isMobile
        ? { containerSize: 58, characterSize: 46 }
        : { containerSize: 64, characterSize: 50 };
  }
}
