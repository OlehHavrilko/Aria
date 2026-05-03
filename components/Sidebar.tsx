'use client';

import { motion } from 'motion/react';
import { 
  Terminal as TerminalIcon, 
  Search, 
  LayoutDashboard, 
  Settings, 
  Inbox,
  Workflow,
  ShieldCheck,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSettingsClick: () => void;
  theme: string;
  onToggleTheme: () => void;
}

export default function Sidebar({ activeTab, setActiveTab, onSettingsClick, theme, onToggleTheme }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  return (
    <aside 
      className={`relative flex flex-col border-r border-brand-line bg-brand-sidebar transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'} z-50`}
    >
      <div className={`flex items-center px-6 h-16 border-b border-brand-line ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed && <span className="font-black text-xl tracking-tighter text-brand-accent">ARIA Λ</span>}
        {isCollapsed && <span className="font-black text-xl text-brand-accent">Λ</span>}
      </div>

      <nav className="flex-1 py-6 space-y-2">
        <SidebarItem 
          icon={<TerminalIcon size={18} />} 
          label="Orchestrator" 
          active={activeTab === 'orchestrator'} 
          isCollapsed={isCollapsed}
          onClick={() => setActiveTab('orchestrator')} 
        />
        <SidebarItem 
          icon={<Search size={18} />} 
          label="Explorer" 
          active={activeTab === 'explorer'} 
          isCollapsed={isCollapsed}
          onClick={() => setActiveTab('explorer')} 
        />
        <SidebarItem 
          icon={<LayoutDashboard size={18} />} 
          label="Dashboard" 
          active={activeTab === 'dashboard'} 
          isCollapsed={isCollapsed}
          onClick={() => setActiveTab('dashboard')} 
        />
        <div className="h-px bg-brand-line mx-4 my-4" />
        <SidebarItem 
          icon={<Workflow size={18} />} 
          label="Skills" 
          isCollapsed={isCollapsed}
          onClick={() => {}} 
        />
        <SidebarItem 
          icon={<ShieldCheck size={18} />} 
          label="Security" 
          isCollapsed={isCollapsed}
          onClick={() => {}} 
        />
      </nav>

      <div className="p-4 space-y-4 border-t border-brand-line bg-black/20">
        <button 
           onClick={onToggleTheme} 
           className={`w-full flex items-center gap-4 p-2 opacity-40 hover:opacity-100 transition-all ${isCollapsed ? 'justify-center' : ''}`}
        >
          <div className={`w-3 h-3 rounded-full ${theme === 'blue' ? 'bg-blue-500' : 'bg-red-500'}`} />
          {!isCollapsed && <span className="text-[10px] font-bold uppercase tracking-widest leading-none">Toggle Accent</span>}
        </button>
        
        <SidebarItem 
          icon={<Settings size={18} />} 
          label="Settings" 
          isCollapsed={isCollapsed}
          onClick={onSettingsClick} 
        />

        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-brand-line border border-brand-line flex items-center justify-center hover:bg-brand-accent hover:border-brand-accent transition-all group"
        >
          {isCollapsed ? <ChevronRight size={12} className="group-hover:text-white" /> : <ChevronLeft size={12} className="group-hover:text-white" />}
        </button>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active, isCollapsed, onClick }: { icon: React.ReactNode; label: string; active?: boolean; isCollapsed: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative flex items-center w-full px-6 py-3 transition-all ${active ? 'text-brand-accent' : 'text-brand-ink/40 hover:text-brand-ink hover:bg-brand-accent/5'}`}
    >
      <div className={`flex items-center gap-4 ${isCollapsed ? 'justify-center w-full' : ''}`}>
        <div className={`transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</div>
        {!isCollapsed && (
          <span className={`text-xs font-medium tracking-tight whitespace-nowrap transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}>
            {label}
          </span>
        )}
      </div>
      {active && <motion.div layoutId="sidebar-active" className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-brand-accent rounded-r-full" />}
    </button>
  );
}
