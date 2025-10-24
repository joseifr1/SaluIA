import React from 'react';
import clsx from 'clsx';

export function Select({ 
  options = [],
  placeholder,
  className,
  error,
  ...props 
}) {
  return (
    <select
      className={clsx(
        'input',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}