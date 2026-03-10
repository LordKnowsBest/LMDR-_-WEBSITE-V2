'use client';
import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';

const steps = [
  { step: 1, name: 'Profile Created', icon: 'person', description: 'Complete your basic profile information' },
  { step: 2, name: 'Documents Required', icon: 'upload_file', description: 'Upload your CDL front and back' },
  { step: 3, name: 'CDL Submitted', icon: 'verified', description: 'CDL documents submitted for review' },
  { step: 4, name: 'Background Check', icon: 'security', description: 'Background verification in progress' },
  { step: 5, name: 'MVR Check', icon: 'fact_check', description: 'Motor vehicle record check' },
  { step: 6, name: 'Profile Review', icon: 'rate_review', description: 'Final review by our team' },
  { step: 7, name: 'Active', icon: 'check_circle', description: 'You are active and searchable!' },
];

export default function DriverOnboardingPage() {
  const [currentStep, setCurrentStep] = useState(1);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-lmdr-dark">Onboarding Progress</h2>
        <p className="text-tan text-sm mt-1">Complete all steps to become searchable by carriers</p>
      </div>

      {/* Progress bar */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-lmdr-dark">Step {currentStep} of {steps.length}</span>
          <span className="text-sm text-tan">{Math.round((currentStep / steps.length) * 100)}% complete</span>
        </div>
        <div className="w-full bg-beige-d rounded-full h-3 shadow-[inset_2px_2px_4px_#C8B896,inset_-2px_-2px_4px_#FFFFF5]">
          <div
            className="bg-lmdr-blue h-3 rounded-full transition-all duration-500"
            style={{ width: `${(currentStep / steps.length) * 100}%` }}
          />
        </div>
      </Card>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step) => {
          const isComplete = step.step < currentStep;
          const isCurrent = step.step === currentStep;
          const isFuture = step.step > currentStep;

          return (
            <Card
              key={step.step}
              elevation={isCurrent ? 'md' : 'flat'}
              className={isCurrent ? 'ring-2 ring-lmdr-blue/30' : isFuture ? 'opacity-50' : ''}
            >
              <div className="flex items-center gap-4">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full ${
                  isComplete ? 'bg-sg text-white' : isCurrent ? 'bg-lmdr-blue text-white' : 'bg-beige-d text-tan'
                }`}>
                  <span className="material-symbols-outlined text-[20px]">
                    {isComplete ? 'check' : step.icon}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-lmdr-dark">{step.name}</p>
                    {isComplete && <Badge variant="success">Done</Badge>}
                    {isCurrent && <Badge variant="info">In Progress</Badge>}
                  </div>
                  <p className="text-xs text-tan mt-0.5">{step.description}</p>
                </div>
                {isCurrent && (
                  <Button size="sm" onClick={() => setCurrentStep(s => Math.min(s + 1, steps.length))}>
                    Continue
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
