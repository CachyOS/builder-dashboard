'use client';

import {useEffect, useState} from 'react';

const clearTimer = (timer: NodeJS.Timeout | null) => {
  if (timer) {
    clearTimeout(timer);
  }
};

export function useLogoutShortcutListener(callback: () => void) {
  const [colonQPressed, setColonQPressed] = useState(false);
  let timer: NodeJS.Timeout | null = null;

  useEffect(() => {
    let colonPressed = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ':') {
        colonPressed = true;
        timer = setTimeout(() => {
          colonPressed = false;
        }, 800);
      } else if (colonPressed && event.key.toLowerCase() === 'q') {
        setColonQPressed(true);
        colonPressed = false;
        clearTimer(timer);
      } else {
        colonPressed = false;
        clearTimer(timer);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimer(timer);
    };
  }, []);

  useEffect(() => {
    if (colonQPressed) {
      callback();
      setColonQPressed(false);
    }
  }, [callback, colonQPressed]);
}
