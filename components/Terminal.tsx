'use client';

import { useAgentStore } from '@/lib/store';
import TerminalView from './terminal/TerminalView';

export default function Terminal() {
  const terminalEntries = useAgentStore((s) => s.terminalEntries);
  
  return (
    <div className="h-full w-full">
      <TerminalView entries={terminalEntries} />
    </div>
  );
}
