import React from 'react';
import clsx from 'clsx';

export function NumberInput({ 
  unit,
  className,
  error,
  onChange,
  ...props 
}) {
  const handleChange = (e) => {
    const value = parseFloat(e.target.value);
    onChange(isNaN(value) ? undefined : value);
  };

  return (
    <div className="relative">
      <input
        type="number"
        onChange={handleChange}
        className={clsx(
          'input',
          unit && 'pr-12',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
          className
        )}
        {...props}
      />
      {unit && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-gray-500 text-sm">{unit}</span>
        </div>
      )}
    </div>
  );
}