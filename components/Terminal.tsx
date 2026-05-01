'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';

interface TerminalProps {
  onCommand?: (command: string) => void;
  yoloMode?: boolean;
}

export default function Terminal({ onCommand, yoloMode }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<XTerm | null>(null);

  const executeCommand = useCallback(async (cmd: string) => {
    if (onCommand) onCommand(cmd);

    try {
      const response = await fetch('/api/shell', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd, yoloMode }),
      });

      const result = await response.json();
      
      if (result.stdout) {
        xtermRef.current?.writeln(result.stdout);
      }
      if (result.stderr) {
        xtermRef.current?.writeln(`\x1b[31m${result.stderr}\x1b[0m`);
      }
      
      if (!result.stdout && !result.stderr && response.ok) {
        xtermRef.current?.writeln('\x1b[90m(Success)\x1b[0m');
      }

    } catch (err) {
      xtermRef.current?.writeln(`\x1b[31mError: ${err}\x1b[0m`);
    } finally {
      xtermRef.current?.write('\r\n\x1b[1;32mroot@aria\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
    }
  }, [onCommand, yoloMode]);

  useEffect(() => {
    if (!terminalRef.current) return;

    const term = new XTerm({
      cursorBlink: true,
      theme: {
        background: 'transparent',
        foreground: '#c9d1d9',
        cursor: '#58a6ff',
        selectionBackground: 'rgba(88, 166, 255, 0.3)',
      },
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 14,
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.loadAddon(new WebLinksAddon());

    term.open(terminalRef.current);
    fitAddon.fit();

    xtermRef.current = term;

    term.writeln('\x1b[1;32mΛ ARIA RUNTIME OS\x1b[0m');
    term.writeln('Autonomous Instance Initialized. "I\'m ready when you are."');
    term.write('\r\n\x1b[1;32mroot@aria\x1b[0m:\x1b[1;34m~\x1b[0m$ ');

    let inputBuffer = '';

    term.onKey(({ key, domEvent }) => {
      const printable = !domEvent.altKey && !domEvent.ctrlKey && !domEvent.metaKey;

      if (domEvent.keyCode === 13) { // Enter
        term.write('\r\n');
        if (inputBuffer.trim()) {
          executeCommand(inputBuffer);
        } else {
          term.write('\x1b[1;32mroot@aria\x1b[0m:\x1b[1;34m~\x1b[0m$ ');
        }
        inputBuffer = '';
      } else if (domEvent.keyCode === 8) { // Backspace
        if (inputBuffer.length > 0) {
          inputBuffer = inputBuffer.slice(0, -1);
          term.write('\b \b');
        }
      } else if (printable) {
        inputBuffer += key;
        term.write(key);
      }
    });

    const handleResize = () => fitAddon.fit();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      term.dispose();
    };
  }, [executeCommand]);

  return (
    <div className="h-full w-full p-4 overflow-hidden bg-black/40 rounded-lg border border-slate-800">
      <div ref={terminalRef} className="h-full w-full" />
    </div>
  );
}
