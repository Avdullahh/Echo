
import React from 'react';
import { ShieldAlert, ArrowLeft, AlertTriangle } from 'lucide-react';

interface BlockedScreenProps {
    onGoBack: () => void;
    onProceed: () => void;
}

export const BlockedScreen: React.FC<BlockedScreenProps> = ({ onGoBack, onProceed }) => {
  return (
    <div className="fixed inset-0 z-[400] bg-gradient-to-br from-red-950 via-zinc-950 to-black flex items-center justify-center p-6 animate-in zoom-in-95 duration-300">
        
        {/* Noise Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

        <div className="max-w-lg w-full text-center relative z-10">
            <div className="w-24 h-24 mx-auto bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/20 shadow-[0_0_60px_rgba(239,68,68,0.2)]">
                <ShieldAlert className="w-12 h-12 text-[#FF4D4D]" />
            </div>

            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Connection Blocked</h1>
            
            <div className="bg-red-950/30 border border-red-900/50 rounded-xl p-4 mb-8">
                <p className="text-red-200 font-mono text-sm break-all">
                    https://homechef-shop.com/tracking/pixel.js
                </p>
            </div>

            <p className="text-zinc-400 text-lg mb-10 leading-relaxed">
                Echo intercepted a high-risk request attempting unauthorized data extraction. This site is known for aggressive fingerprinting.
            </p>

            <div className="space-y-4">
                <button 
                    onClick={onGoBack}
                    className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-all shadow-xl flex items-center justify-center gap-2"
                >
                    <ArrowLeft className="w-5 h-5" /> Go Back to Safety
                </button>
                
                <button 
                    onClick={onProceed}
                    className="w-full py-3 text-zinc-500 hover:text-[#FF4D4D] text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                    <AlertTriangle className="w-4 h-4" /> Proceed Anyway (Unsafe)
                </button>
            </div>
        </div>

        {/* Bottom Status Bar */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-red-950/20 border-t border-red-900/20 flex items-center justify-center">
            <span className="text-red-500/60 text-xs font-mono uppercase tracking-widest">
                Strict Mode Enforcement Active
            </span>
        </div>
    </div>
  );
};
