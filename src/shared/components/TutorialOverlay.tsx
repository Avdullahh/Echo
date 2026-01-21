
import React, { useState } from 'react';
import { X, ChevronRight, CheckCircle2, Cookie, Eye, Fingerprint, ArrowRight } from 'lucide-react';

interface TutorialOverlayProps {
  onClose: () => void;
  tutorialId?: string;
}

const SLIDES = [
  {
    title: "The Cookie Jar",
    desc: "Websites store small text files called 'cookies' on your device. While some keep you logged in, others track where you go after you leave the site.",
    icon: Cookie,
    color: "text-[#4DFFBC]"
  },
  {
    title: "The Invisible Pixel",
    desc: "Marketers hide 1x1 transparent pixels in emails and websites. When these load, they tell the sender exactly when and where you viewed their content.",
    icon: Eye,
    color: "text-blue-400"
  },
  {
    title: "Your Digital Fingerprint",
    desc: "Even without cookies, sites analyze your screen resolution, battery level, and installed fonts to create a unique ID that identifies you across the web.",
    icon: Fingerprint,
    color: "text-purple-400"
  }
];

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ onClose }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const SlideData = SLIDES[currentSlide];
  const Icon = SlideData.icon;

  return (
    <div className="fixed inset-0 z-[300] bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl relative flex flex-col md:flex-row h-[500px]">
        
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Visual Side (Left) */}
        <div className="hidden md:flex w-1/3 bg-black flex-col items-center justify-center border-r border-zinc-800 relative overflow-hidden">
             <div className={`absolute inset-0 opacity-20 ${SlideData.color.replace('text-', 'bg-')} blur-3xl`}></div>
             <div className="relative z-10 w-24 h-24 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
                <Icon className={`w-10 h-10 ${SlideData.color}`} />
             </div>
             <div className="flex gap-2 relative z-10">
                {SLIDES.map((_, idx) => (
                    <div key={idx} className={`w-2 h-2 rounded-full transition-colors duration-300 ${idx === currentSlide ? 'bg-white' : 'bg-zinc-800'}`}></div>
                ))}
             </div>
        </div>

        {/* Content Side (Right) */}
        <div className="flex-1 p-10 flex flex-col justify-center relative">
             <div className="md:hidden w-12 h-12 rounded-full bg-black flex items-center justify-center mb-6 self-start">
                <Icon className={`w-6 h-6 ${SlideData.color}`} />
             </div>

             <div className="flex-1 flex flex-col justify-center">
                <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">
                    Lesson 1 • Slide {currentSlide + 1}/{SLIDES.length}
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">{SlideData.title}</h2>
                <p className="text-zinc-400 text-lg leading-relaxed">
                    {SlideData.desc}
                </p>
             </div>

             <div className="pt-8 flex justify-end">
                <button 
                    onClick={handleNext}
                    className="group flex items-center gap-3 px-8 py-4 bg-white hover:bg-zinc-200 text-black font-bold rounded-full transition-all"
                >
                    {currentSlide === SLIDES.length - 1 ? 'Complete Lesson' : 'Next Concept'}
                    {currentSlide === SLIDES.length - 1 ? <CheckCircle2 className="w-5 h-5" /> : <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                </button>
             </div>
        </div>

      </div>
    </div>
  );
};
