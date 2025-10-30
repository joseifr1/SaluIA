import React from 'react';
import { Check } from 'lucide-react';
import clsx from 'clsx';

export function Stepper({ steps, currentStep, onStepClick }) {
  return (
    <nav aria-label="Progreso del registro" className="mb-8">
      <ol className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentStep;
          const isCompleted = stepNumber < currentStep;
          const isClickable = stepNumber <= currentStep && onStepClick;

          return (
            <li key={step.id} className="flex-1">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={isClickable ? () => onStepClick(stepNumber) : undefined}
                  disabled={!isClickable}
                  className={clsx(
                    'flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                    {
                      'bg-primary text-white': isActive,
                      'bg-green-500 text-white': isCompleted,
                      'bg-gray-200 text-gray-500': !isActive && !isCompleted,
                      'hover:bg-gray-300 cursor-pointer': isClickable && !isActive && !isCompleted,
                      'cursor-default': !isClickable,
                    }
                  )}
                  aria-current={isActive ? 'step' : undefined}
                  aria-label={`Paso ${stepNumber}: ${step.title}${isCompleted ? ' (completado)' : isActive ? ' (actual)' : ''}`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    stepNumber
                  )}
                </button>
                
                <div className="ml-3 min-w-0 flex-1">
                  <div className={clsx(
                    'text-sm font-medium',
                    isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  )}>
                    {step.title}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-500">
                      {step.description}
                    </div>
                  )}
                </div>

                {index < steps.length - 1 && (
                  <div 
                    className={clsx(
                      'flex-1 h-0.5 ml-4',
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    )}
                    aria-hidden="true"
                  />
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}