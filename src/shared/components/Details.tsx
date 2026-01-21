
import React from 'react';
import { X, Building2, MapPin, Database, Target, AlertTriangle, Fingerprint, ThumbsDown, ThumbsUp } from 'lucide-react';
import { TrackerEvent, UserProfile, RiskLevel } from '../types';

// --- ENTITY DETAIL MODAL ---
interface EntityDetailProps {
    event: TrackerEvent;
    onClose: () => void;
}

export const EntityDetail: React.FC<EntityDetailProps> = ({ event, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-zinc-900 rounded-full text-zinc-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 text-xs font-bold uppercase tracking-wider mb-4">
                        <Building2 className="w-3 h-3" /> Data Collector
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-1">{event.company || 'Unknown Entity'}</h2>
                    <p className="text-zinc-500 font-mono text-sm">{event.domain}</p>
                </div>

                {/* Grid */}
                <div className="px-8 py-4 grid grid-cols-2 gap-4">
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                        <div className="text-zinc-500 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" /> Threat Level
                        </div>
                        <div className={`text-xl font-bold ${event.riskLevel === RiskLevel.SAFE ? 'text-[#4DFFBC]' : 'text-[#FF4D4D]'}`}>
                            {event.riskLevel || 'High'}
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                        <div className="text-zinc-500 text-xs font-bold uppercase mb-2 flex items-center gap-1">
                            <Target className="w-3 h-3" /> Category
                        </div>
                        <div className="text-xl font-bold text-white">
                            {event.category}
                        </div>
                    </div>
                </div>

                {/* Data Collected List */}
                <div className="px-8 py-4">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                        <Database className="w-4 h-4 text-[#4DFFBC]" /> Data Collected
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {['Device ID', 'IP Address', 'Browsing History', 'Approx. Location'].map((item, i) => (
                            <span key={i} className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-zinc-300 text-sm">
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="p-8 pt-4">
                     <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                        This entity is known to aggregate user data across multiple sites to build a profile for targeted advertising.
                     </p>
                     <button onClick={onClose} className="w-full py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-xl transition-colors">
                        Close Report
                     </button>
                </div>
            </div>
        </div>
    );
};

// --- PERSONA DETAIL MODAL ---
interface PersonaDetailProps {
    profile: UserProfile;
    onClose: () => void;
}

export const PersonaDetail: React.FC<PersonaDetailProps> = ({ profile, onClose }) => {
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
                <button onClick={onClose} className="absolute top-4 right-4 p-2 z-10 bg-black/50 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                </button>

                {/* Left Side: The Persona */}
                <div className="w-full md:w-1/3 bg-zinc-900 p-8 flex flex-col items-center justify-center text-center border-r border-zinc-800">
                    <div className="w-24 h-24 rounded-full bg-black flex items-center justify-center text-[#4DFFBC] mb-6 shadow-[0_0_30px_rgba(77,255,188,0.1)]">
                        <Fingerprint className="w-10 h-10" />
                    </div>
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Algorithm View</div>
                    <h2 className="text-2xl font-bold text-white mb-4 leading-tight">{profile.persona}</h2>
                    <div className="px-4 py-1.5 bg-black rounded-full text-[#4DFFBC] text-sm font-bold border border-[#4DFFBC]/20">
                        98% Confidence
                    </div>
                </div>

                {/* Right Side: The Evidence */}
                <div className="flex-1 p-8 bg-zinc-950">
                     <h3 className="text-xl font-bold text-white mb-6">Reverse Engineering</h3>
                     
                     <div className="space-y-6">
                        <div>
                            <div className="text-sm font-bold text-zinc-500 mb-2 uppercase tracking-wide">Primary Indicators</div>
                            <ul className="space-y-3">
                                <li className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300">Visited <span className="text-white font-bold">homechef.com</span></span>
                                    <span className="text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">3x</span>
                                </li>
                                <li className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300">Visited <span className="text-white font-bold">techcrunch.com</span></span>
                                    <span className="text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">5x</span>
                                </li>
                                <li className="flex items-center justify-between text-sm">
                                    <span className="text-zinc-300">Search Keywords: "Best 4K TV"</span>
                                    <span className="text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded">High Value</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <div className="text-sm font-bold text-zinc-500 mb-3 uppercase tracking-wide">Feedback Loop</div>
                            <p className="text-zinc-400 text-sm mb-3">Is this accurate? Your feedback helps confuse the trackers.</p>
                            <div className="flex gap-3">
                                <button className="flex-1 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 hover:border-[#4DFFBC] hover:text-[#4DFFBC] text-zinc-400 font-bold text-sm transition-all flex items-center justify-center gap-2">
                                    <ThumbsUp className="w-4 h-4" /> Yes
                                </button>
                                <button className="flex-1 py-3 rounded-xl border border-zinc-800 hover:bg-zinc-900 hover:border-[#FF4D4D] hover:text-[#FF4D4D] text-zinc-400 font-bold text-sm transition-all flex items-center justify-center gap-2">
                                    <ThumbsDown className="w-4 h-4" /> No
                                </button>
                            </div>
                        </div>
                     </div>
                </div>
             </div>
        </div>
    );
};
