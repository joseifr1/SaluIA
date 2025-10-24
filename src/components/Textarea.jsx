import React from 'react';
import clsx from 'clsx';

export function Textarea({ 
  className,
  error,
  ...props 
}) {
  return (
    <textarea
      className={clsx(
        'input min-h-[100px] resize-y',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  );
}