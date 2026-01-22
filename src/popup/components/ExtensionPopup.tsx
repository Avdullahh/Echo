import React from 'react';
import { TrackerEvent, DashboardTab } from '../../shared/types';
import { Power, LayoutDashboard, Settings, Home, FileText } from 'lucide-react';

interface ExtensionPopupProps {
  trackers?: TrackerEvent[];
  blockedCount: number;
  isProtectionOn: boolean;
  setProtectionOn: (val: boolean) => void;
  onOpenDashboard: (tab: DashboardTab) => void;
}

export const ExtensionPopup: React.FC<ExtensionPopupProps> = ({ 
    blockedCount, 
    isProtectionOn, 
    setProtectionOn, 
    onOpenDashboard 
}) => {

  const NavItem = ({ icon: Icon, label, target }: { icon: any, label: string, target: DashboardTab }) => (
    <button 
        onClick={() => onOpenDashboard(target)}
        className="group flex items-center gap-2 p-1.5 rounded-full hover:bg-surface-cardAlt transition-all duration-300 overflow-hidden w-8 hover:w-24 bg-transparent"
        title={label}
    >
        <div className="w-5 h-5 flex items-center justify-center text-text-muted group-hover:text-accent-primary shrink-0">
            <Icon className="w-4 h-4" /> {/* Slightly larger icons for new size */}
        </div>
        <span className="text-[10px] font-medium text-text-primary opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
            {label}
        </span>
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col font-sans text-text-primary overflow-hidden relative bg-bg-canvas selection:bg-accent-primary selection:text-neutral-0">
      
      {/* BACKGROUND GLOW */}
      <div className="absolute top-[-20%] left-[-20%] w-[220px] h-[220px] bg-accent-softBg rounded-full blur-[70px] pointer-events-none opacity-60"></div>

      {/* HEADER & NAV ROW */}
      <div className="relative z-30 px-5 pt-6 pb-2 flex flex-col gap-4">
        {/* Logo Area */}
        <div className="flex items-center justify-center gap-2 mb-1">
            <div className="w-5 h-5 bg-accent-primary rounded-sm flex items-center justify-center text-text-onAccent shadow-glowAccent">
                <span className="font-bold text-[10px]">E</span>
            </div>
            <span className="font-bold text-lg tracking-tight text-text-primary">Echo</span>
        </div>

        {/* Navigation Bar */}
        <div className="flex items-center justify-between bg-surface-card/50 backdrop-blur-sm border border-border-subtle rounded-full p-1 shadow-cardSoft mx-1">
            <NavItem icon={Home} label="Home" target="home" />
            <NavItem icon={LayoutDashboard} label="Overview" target="overview" />
            <NavItem icon={FileText} label="Reports" target="reports" />
            <NavItem icon={Settings} label="Settings" target="settings" />
        </div>
      </div>

      {/* POWER BUTTON AREA */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center pb-10">
        <button 
            onClick={() => setProtectionOn(!isProtectionOn)}
            className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/30 rounded-full z-10"
        >
            {/* Pulse Effect */}
            <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 
               ${isProtectionOn ? 'bg-accent-primary/30' : 'bg-transparent'}`}></div>

            {/* The Physical Button */}
            <div className={`w-32 h-32 rounded-full flex items-center justify-center transition-all duration-300 relative border-4
                ${isProtectionOn 
                    ? 'bg-accent-primary border-accent-primary shadow-glowAccent scale-100' 
                    : 'bg-surface-card border-border-default scale-95 hover:border-border-strong'
                }`}
            >
                <Power className={`w-12 h-12 transition-colors duration-300 stroke-[2.5px]
                    ${isProtectionOn ? 'text-text-onAccent' : 'text-icon-muted group-hover:text-text-secondary'}`} 
                />
            </div>
        </button>
        
        {/* CONSTANT STATUS TEXT */}
        <div className="text-center mt-6 px-4">
             <h2 className="text-2xl font-bold text-text-primary tracking-tight mb-1">
                {isProtectionOn ? 'Echo On' : 'Echo Off'}
             </h2>
             <p className="text-xs text-text-muted leading-relaxed">
                {isProtectionOn 
                    ? 'Your digital footprint is masked.' 
                    : 'System paused. Protection is disabled.'}
             </p>
        </div>
      </div>
    </div>
  );
};