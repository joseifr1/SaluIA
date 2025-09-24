import React from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export function Chip({ 
  children,
  onRemove,
  variant = 'default',
  className,
  ...props 
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
        variant === 'primary' && 'bg-primary/10 text-primary',
        variant === 'secondary' && 'bg-secondary/10 text-secondary',
        variant === 'default' && 'bg-gray-100 text-gray-800',
        className
      )}
      {...props}
    >
      {children}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-black/10 focus:outline-none focus:bg-black/10"
          aria-label="Quitar"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </span>
  );
}