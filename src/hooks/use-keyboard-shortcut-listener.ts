'use client';

import {useEffect, useState} from 'react';

const numericKeyRegex = /^\d$/;

const clearTimer = (timer: NodeJS.Timeout | null) => {
  if (timer) {
    clearTimeout(timer);
  }
};

export function useGenericShortcutListener(
  key: string,
  callback: () => void,
  ignoreModifiers = false
) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        (event.ctrlKey || event.metaKey || ignoreModifiers) &&
        event.key.toLowerCase() === key.toLowerCase()
      ) {
        event.preventDefault();
        callback();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
}

export function useGenericVimShortcutListener(
  key: string,
  callback: () => void
) {
  const [colonAndKeyPressed, setColonAndKeyPressed] = useState(false);
  let timer: NodeJS.Timeout | null = null;

  useEffect(() => {
    let colonPressed = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === ':') {
        colonPressed = true;
        timer = setTimeout(() => {
          colonPressed = false;
        }, 800);
      } else if (
        colonPressed &&
        event.key.toLowerCase() === key.toLowerCase()
      ) {
        setColonAndKeyPressed(true);
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
    if (colonAndKeyPressed) {
      callback();
      setColonAndKeyPressed(false);
    }
  }, [callback, colonAndKeyPressed]);
}

export function useNumericKeyShortcutListener(callback: (key: number) => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if ((event.ctrlKey || event.metaKey) && numericKeyRegex.test(key)) {
        event.preventDefault();
        callback(parseInt(key, 10));
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  });
}

export function useNumericKeyVimShortcutListener(
  callback: (key: number) => void
) {
  const [colonAndKeyPressed, setColonAndKeyPressed] = useState<null | number>(
    null
  );
  let timer: NodeJS.Timeout | null = null;

  useEffect(() => {
    let colonPressed = false;
    const handleKeyDown = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === ':') {
        colonPressed = true;
        timer = setTimeout(() => {
          colonPressed = false;
        }, 800);
      } else if (colonPressed && numericKeyRegex.test(key)) {
        setColonAndKeyPressed(parseInt(key, 10));
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
    if (colonAndKeyPressed) {
      callback(colonAndKeyPressed);
      setColonAndKeyPressed(null);
    }
  }, [callback, colonAndKeyPressed]);
}
