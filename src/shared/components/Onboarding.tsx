
import React, { useState } from 'react';
import { Shield, ChevronRight, Check, User, Lock, Globe } from 'lucide-react';

interface OnboardingProps {
  onComplete: () => void;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(0);

  const nextStep = () => setStep(s => s + 1);

  // STEP 0: WELCOME
  if (step === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 text-center bg-black animate-in fade-in duration-700">
        <div className="w-20 h-20 bg-[#4DFFBC] rounded-full flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(77,255,188,0.3)]">
          <Shield className="w-10 h-10 text-black" />
        </div>
        <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Hi, I'm Echo.</h1>
        <p className="text-zinc-400 text-lg max-w-md leading-relaxed mb-10">
          The internet creates a hidden profile of you every day. 
          Let's see who advertisers think you are, and take back control.
        </p>
        <button onClick={nextStep} className="bg-white text-black px-8 py-4 rounded-full font-bold text-lg hover:bg-zinc-200 transition-colors flex items-center gap-2">
          Get Started <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // STEP 1: CALIBRATION QUIZ
  if (step === 1) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black animate-in slide-in-from-right duration-500">
        <div className="mb-8">
            <User className="w-12 h-12 text-[#4DFFBC] mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white text-center mb-2">Calibration</h2>
            <p className="text-zinc-500 text-center max-w-sm">
                Help Echo understand your actual interests to measure the "Education Gap" between you and the algorithms.
            </p>
        </div>
        
        <div className="space-y-4 w-full max-w-md">
            {['Do you enjoy cooking or looking up recipes?', 'Are you currently in the market for a vehicle?', 'Do you follow tech news frequently?'].map((q, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-zinc-900 rounded-2xl border border-zinc-800">
                    <span className="text-zinc-300 font-medium text-sm">{q}</span>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 rounded-lg bg-black border border-zinc-700 text-zinc-400 hover:text-white hover:border-[#4DFFBC] text-xs font-bold transition-all">NO</button>
                        <button className="px-4 py-2 rounded-lg bg-[#4DFFBC]/10 border border-[#4DFFBC]/50 text-[#4DFFBC] text-xs font-bold hover:bg-[#4DFFBC] hover:text-black transition-all">YES</button>
                    </div>
                </div>
            ))}
        </div>
        <button onClick={nextStep} className="mt-8 text-white font-bold underline hover:text-[#4DFFBC] transition-colors">
            Skip & Continue
        </button>
      </div>
    );
  }

  // STEP 2: PERMISSIONS
  if (step === 2) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-black animate-in slide-in-from-right duration-500">
         <div className="w-full max-w-md bg-zinc-900 p-8 rounded-3xl border border-zinc-800 text-center">
            <Lock className="w-12 h-12 text-zinc-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Enable Protection</h2>
            <p className="text-zinc-400 text-sm mb-8 leading-relaxed">
                To visualize your digital identity and intercept trackers, Echo requires permission to analyze network traffic on the websites you visit.
            </p>
            
            <div className="space-y-3">
                <button onClick={onComplete} className="w-full bg-[#4DFFBC] hover:bg-[#3beea8] text-black font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                    <Check className="w-5 h-5" /> Grant Permission
                </button>
                <button className="w-full bg-transparent text-zinc-500 hover:text-white font-medium py-2 text-sm transition-colors">
                    Learn more about data usage
                </button>
            </div>
         </div>
      </div>
    );
  }

  return null;
};
