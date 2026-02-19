import { useEffect } from 'react';

export type TrekkerEventType = 'EVENT_CHANGED' | 'NOTE_CHANGED' | 'WIDGET_CHANGED' | 'HABIT_CHANGED';

export const emitTrekkerEvent = (type: TrekkerEventType, detail?: any) => {
  const event = new CustomEvent(type, { detail });
  window.dispatchEvent(event);
};

export const useTrekkerEvent = (type: TrekkerEventType, handler: (detail?: any) => void) => {
  useEffect(() => {
    const eventListener = (e: Event) => {
      const customEvent = e as CustomEvent;
      handler(customEvent.detail);
    };

    window.addEventListener(type, eventListener);
    
    return () => {
      window.removeEventListener(type, eventListener);
    };
  }, [type, handler]);
};
