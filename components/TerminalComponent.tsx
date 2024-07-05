'use client';

import {getPackageLog} from '@/app/actions';
import {useCtrlFShortcutListener} from '@/lib/hooks';
import {BuilderPackageArchitecture} from '@/types/BuilderPackage';
import {RiArrowDownLine, RiArrowUpLine, RiSearchLine} from '@remixicon/react';
import {TextInput} from '@tremor/react';
import {FitAddon} from '@xterm/addon-fit';
import {SearchAddon} from '@xterm/addon-search';
import {WebLinksAddon} from '@xterm/addon-web-links';
import {WebglAddon} from '@xterm/addon-webgl';
import {Terminal} from '@xterm/xterm';
import '@xterm/xterm/css/xterm.css';
import styles from 'ansi-styles';
import {useEffect, useRef, useState} from 'react';

import Loader from './Loader';

const OSC = '\u001B]';
const BEL = '\u0007';
const SEP = ';';

export default function TerminalComponent({
  march,
  pkgbase,
}: Readonly<{
  march: BuilderPackageArchitecture;
  pkgbase: string;
}>) {
  const [loaded, setLoaded] = useState(false);
  const [textLoaded, setTextLoaded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const arrowUpRef = useRef<HTMLDivElement>(null);
  const arrowDownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const terminal = new Terminal({
    allowProposedApi: true,
    convertEol: true,
    cursorBlink: true,
    cursorInactiveStyle: 'underline',
    cursorStyle: 'underline',
    disableStdin: true,
    fontFamily: 'JetBrains Mono, monospace',
    scrollback: Number.MAX_SAFE_INTEGER,
    theme: {
      background: '#000000',
      black: '#1f1f1f',
      blue: '#2a84d2',
      brightBlack: '#d6dae4',
      brightBlue: '#0f80d5',
      brightCyan: '#0f7cda',
      brightGreen: '#1dd260',
      brightMagenta: '#524fb9',
      brightRed: '#de342e',
      brightWhite: '#ffffff',
      brightYellow: '#f2bd09',
      cursor: '#b9b9b9',
      cyan: '#0f80d5',
      foreground: '#d6dae4',
      green: '#2cc55d',
      magenta: '#4e59b7',
      red: '#f71118',
      selectionBackground: '#b9b9b9',
      selectionForeground: '#131313',
      white: '#d6dae4',
      yellow: '#ecb90f',
    },
  });
  const webLinksAddon = new WebLinksAddon();
  const searchAddon = new SearchAddon();
  const fitAddon = new FitAddon();
  const webglAddon = new WebglAddon();
  terminal.loadAddon(webLinksAddon);
  terminal.loadAddon(searchAddon);
  terminal.loadAddon(fitAddon);
  terminal.loadAddon(webglAddon);
  const searchEvent = () => {
    searchAddon.findNext(inputRef.current?.value ?? '', {
      caseSensitive: false,
      decorations: {
        activeMatchColorOverviewRuler: '#f97316',
        matchBackground: '#f97316',
        matchOverviewRuler: '#f97316',
      },
      incremental: false,
      wholeWord: false,
    });
  };
  const arrowUpEvent = () => {
    searchAddon.findPrevious(inputRef.current?.value ?? '', {
      caseSensitive: false,
      incremental: false,
      wholeWord: false,
    });
  };
  useEffect(() => {
    if (
      !loaded &&
      ref.current &&
      inputRef.current &&
      arrowUpRef.current &&
      arrowDownRef.current
    ) {
      setLoaded(true);
      terminal.open(ref.current);
      terminal.attachCustomKeyEventHandler(e => {
        if (e.key === 'f' && e.ctrlKey) {
          containerRef.current?.classList.remove('md:hidden');
          inputRef.current?.focus();
          return false;
        }
        return true;
      });
      getPackageLog(pkgbase, march, true).then(log =>
        terminal.write(
          log
            .replace(
              /\bERROR\b/gi,
              `${styles.redBright.open}$&${styles.redBright.close}`
            )
            .replace(
              /\bWARN(ING)?\b/gi,
              `${styles.yellowBright.open}$&${styles.yellowBright.close}`
            )
            .replace(
              /.*command not found.*/gi,
              `${styles.redBright.open}$&${styles.redBright.close}`
            )
            .replace(
              /\b[A-Fa-f0-9]{16}\b|\b[A-Fa-f0-9]{40}\b/g,
              [
                OSC,
                '8',
                SEP,
                SEP,
                'https://keyserver.ubuntu.com/pks/lookup?search=$&&fingerprint=on&op=index',
                BEL,
                '$&',
                OSC,
                '8',
                SEP,
                SEP,
                BEL,
              ].join('')
            ) ||
            `${styles.yellowBright.open}No logs found for this package (Received a blank response).${styles.yellowBright.close}`,
          () => {
            setTextLoaded(true);
            fitAddon.fit();
            inputRef.current?.addEventListener('input', searchEvent);
            arrowUpRef.current?.addEventListener('click', arrowUpEvent);
            arrowDownRef.current?.addEventListener('click', searchEvent);
          }
        )
      );
    }
    return () => {
      if (loaded) {
        fitAddon.dispose();
        searchAddon.dispose();
        webLinksAddon.dispose();
        webglAddon.dispose();
        terminal.dispose();
        inputRef.current?.removeEventListener('input', searchEvent);
        arrowUpRef.current?.removeEventListener('click', arrowUpEvent);
        arrowDownRef.current?.removeEventListener('click', searchEvent);
      }
    };
  }, [ref, loaded, inputRef, arrowUpRef, arrowDownRef]);
  useCtrlFShortcutListener(() => {
    containerRef.current?.classList.remove('md:hidden');
    inputRef.current?.focus();
  });
  return (
    <div className="flex flex-col w-full">
      <div hidden={!!textLoaded}>
        <Loader text="Processing the log file..." />
      </div>
      <div className="md:hidden" ref={containerRef}>
        <TextInput
          className="absolute z-10 max-w-xl right-0"
          icon={RiSearchLine}
          placeholder="Search logs"
          ref={inputRef}
        />
        <div ref={arrowUpRef}>
          <RiArrowUpLine className="absolute z-10 right-8 top-2 dark:hover:bg-gray-50/25 hover:bg-gray-400/50 rounded text-tremor-content dark:text-white" />
        </div>
        <div ref={arrowDownRef}>
          <RiArrowDownLine className="absolute z-10 right-2 top-2 dark:hover:bg-gray-50/25 hover:bg-gray-400/50 rounded text-tremor-content dark:text-white" />
        </div>
      </div>
      <div
        className="h-full flex flex-col flex-grow min-h-screen w-full"
        ref={ref}
      />
    </div>
  );
}
