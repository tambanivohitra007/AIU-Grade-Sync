import React from 'react';
import { Step } from '../types';

interface StepIndicatorProps {
  currentStep: Step;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { num: Step.UPLOAD, label: 'Upload' },
    { num: Step.CONFIGURE, label: 'Configure' },
    { num: Step.PREVIEW, label: 'Preview' },
    { num: Step.COMPLETE, label: 'Download' },
  ];

  return (
    <div className="flex items-center justify-center w-full mb-12">
      {steps.map((step, index) => (
        <React.Fragment key={step.num}>
          <div className="flex flex-col items-center z-10 relative group">
            {/* Glowing orb behind active step */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-purple-500/30 dark:bg-purple-500/40 blur-md transition-all duration-500 ${currentStep === step.num ? 'opacity-100 scale-150' : 'opacity-0 scale-50'}`}></div>
            
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold transition-all duration-300 border-2 relative z-10 ${
                currentStep >= step.num
                  ? 'bg-purple-900 dark:bg-purple-600 border-purple-900 dark:border-purple-400 text-white shadow-[0_0_15px_rgba(192,132,252,0.6)]'
                  : 'bg-slate-100 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-600'
              }`}
            >
              {currentStep > step.num ? <i className="fas fa-check text-xs"></i> : <span className="text-sm">{step.num}</span>}
            </div>
            <span
              className={`text-[10px] uppercase tracking-widest mt-4 font-semibold transition-all duration-300 ${
                currentStep >= step.num ? 'text-purple-900 dark:text-primary drop-shadow-[0_0_5px_rgba(192,132,252,0.8)]' : 'text-slate-400 dark:text-slate-600'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className="flex-1 max-w-[5rem] mx-2 relative h-0.5 mt-[-1.25rem] bg-slate-300 dark:bg-slate-800 rounded-sm overflow-hidden">
                <div 
                    className={`absolute top-0 left-0 h-full w-full bg-gradient-to-r from-purple-900 to-purple-700 dark:from-purple-600 dark:to-purple-400 transition-all duration-700 ease-out origin-left ${
                        currentStep > step.num ? 'scale-x-100 shadow-[0_0_10px_rgba(192,132,252,0.8)]' : 'scale-x-0'
                    }`}
                ></div>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StepIndicator;