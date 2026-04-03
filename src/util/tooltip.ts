import type { TooltipAnchorMode, TooltipPositionMode } from './types';

const isKnownPointerType = (value: string): value is 'mouse' | 'pen' | 'touch' => {
  return value === 'mouse' || value === 'pen' || value === 'touch';
};

export const getEventPointerType = (event: unknown) => {
  if (!event || typeof event !== 'object') {
    return undefined;
  }

  if ('pointerType' in event && typeof event.pointerType === 'string' && isKnownPointerType(event.pointerType)) {
    return event.pointerType;
  }

  if (
    'nativeEvent' in event &&
    event.nativeEvent &&
    typeof event.nativeEvent === 'object' &&
    'pointerType' in event.nativeEvent &&
    typeof event.nativeEvent.pointerType === 'string' &&
    isKnownPointerType(event.nativeEvent.pointerType)
  ) {
    return event.nativeEvent.pointerType;
  }

  return undefined;
};

export const resolveTooltipPositionMode = (
  mode: TooltipPositionMode,
  pointerType?: string,
): TooltipAnchorMode => {
  if (mode === 'point' || mode === 'cursor') {
    return mode;
  }

  return pointerType === 'touch' || pointerType === 'pen' ? 'point' : 'cursor';
};

export const getTooltipAlign = (mode: TooltipAnchorMode) => {
  return mode === 'point' ? 'center' : 'cursor';
};
