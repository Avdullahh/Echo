import React from 'react';
import { TrackerEvent, DashboardTab } from '../../shared/types';
import { Power, ChevronRight, LayoutDashboard, Settings, Activity, Shield, Home, FileText } from 'lucide-react';

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
        className="group flex items-center gap-2 p-2 rounded-full hover:bg-surface-cardAlt transition-all duration-300 overflow-hidden w-10 hover:w-28 bg-transparent"
        title={label}
    >
        <div className="w-6 h-6 flex items-center justify-center text-text-muted group-hover:text-accent-primary shrink-0">
            <Icon className="w-5 h-5" />
        </div>
        <span className="text-small font-medium text-text-primary opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity duration-300">
            {label}
        </span>
    </button>
  );

  return (
    <div className="w-full h-full flex flex-col font-sans text-text-primary overflow-hidden relative bg-bg-canvas selection:bg-accent-primary selection:text-neutral-0">
      
      <div className="absolute top-[-20%] left-[-20%] w-[300px] h-[300px] bg-accent-softBg rounded-full blur-[80px] pointer-events-none opacity-60"></div>

      <div className="relative z-30 px-6 pt-6 pb-2 flex flex-col gap-4">
        <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-6 h-6 bg-accent-primary rounded-sm flex items-center justify-center text-text-onAccent shadow-glowAccent">
                <span className="font-bold text-xs">E</span>
            </div>
            <span className="font-bold text-h2 tracking-tight text-text-primary">Echo</span>
        </div>

        <div className="flex items-center justify-between bg-surface-card/50 backdrop-blur-sm border border-border-subtle rounded-full p-1 shadow-cardSoft mx-4">
            <NavItem icon={Home} label="Home" target="home" />
            <NavItem icon={LayoutDashboard} label="Overview" target="overview" />
            <NavItem icon={FileText} label="Reports" target="reports" />
            <NavItem icon={Settings} label="Settings" target="settings" />
        </div>
      </div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center">
        <button 
            onClick={() => setProtectionOn(!isProtectionOn)}
            className="group relative focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-primary/30 rounded-full z-10"
        >
            <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-700 
               ${isProtectionOn ? 'bg-accent-primary/30' : 'bg-transparent'}`}></div>

            <div className={`w-36 h-36 rounded-full flex items-center justify-center transition-all duration-300 relative border-4
                ${isProtectionOn 
                    ? 'bg-accent-primary border-accent-primary shadow-glowAccent scale-100' 
                    : 'bg-surface-card border-border-default scale-95 hover:border-border-strong'
                }`}
            >
                <Power className={`w-14 h-14 transition-colors duration-300 stroke-[2.5px]
                    ${isProtectionOn ? 'text-text-onAccent' : 'text-icon-muted group-hover:text-text-secondary'}`} 
                />
            </div>
        </button>
        
        <div className="text-center mt-6">
             <h2 className="text-h2 font-bold text-text-primary tracking-tight">
                {isProtectionOn ? 'System Active' : 'System Paused'}
             </h2>
        </div>
      </div>

      <div className="relative z-20 px-6 pb-6 space-y-3">
        <button 
            onClick={() => onOpenDashboard('reports')}
            className="w-full h-12 bg-surface-card border border-border-default rounded-lg px-4 flex items-center justify-between hover:bg-surface-cardAlt hover:border-border-strong transition-all group shadow-cardSoft focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:outline-none"
        >
            <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-accent-primary" />
                <span className="text-small font-medium text-text-primary">Live Status</span>
            </div>
            <div className="bg-surface-inset border border-border-subtle px-2 py-0.5 rounded text-[10px] font-mono text-text-muted group-hover:text-accent-primary transition-colors">
                {isProtectionOn ? blockedCount : 'OFF'}
            </div>
        </button>

        <button 
            onClick={() => onOpenDashboard('home')}
            className="w-full h-12 bg-surface-card border border-border-default rounded-lg px-4 flex items-center justify-between hover:bg-surface-cardAlt hover:border-border-strong transition-all group shadow-cardSoft focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:outline-none"
        >
             <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-accent-primary" />
                <span className="text-small font-medium text-text-primary">Dashboard</span>
            </div>
             <ChevronRight className="w-4 h-4 text-icon-muted group-hover:text-text-primary transition-colors" />
        </button>
      </div>
    </div>
  );
};