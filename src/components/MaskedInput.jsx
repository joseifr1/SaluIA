import React, { useState, useRef } from 'react';
import clsx from 'clsx';

export function MaskedInput({ 
  mask,
  maskChar = '_',
  value = '',
  onChange,
  className,
  error,
  ...props 
}) {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(formatValue(value, mask, maskChar));

  function formatValue(val, maskPattern, placeholder) {
    if (!val) return '';
    
    const cleanValue = val.replace(/[^\w]/g, '');
    let formatted = '';
    let valueIndex = 0;
    
    for (let i = 0; i < maskPattern.length && valueIndex < cleanValue.length; i++) {
      if (maskPattern[i] === '#') {
        formatted += cleanValue[valueIndex];
        valueIndex++;
      } else {
        formatted += maskPattern[i];
      }
    }
    
    return formatted;
  }

  const handleChange = (e) => {
    const inputValue = e.target.value;
    const cleanValue = inputValue.replace(/[^\w]/g, '');
    const formatted = formatValue(cleanValue, mask, maskChar);
    
    setDisplayValue(formatted);
    onChange(cleanValue);
  };

  return (
    <input
      ref={inputRef}
      value={displayValue}
      onChange={handleChange}
      className={clsx(
        'input',
        error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
        className
      )}
      {...props}
    />
  );
}