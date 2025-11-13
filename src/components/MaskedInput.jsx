import React, { useState, useRef, useEffect } from 'react';
import clsx from 'clsx';

export function MaskedInput({
  mask,
  maskChar = '_',
  value = '',
  onChange,
  className,
  error,
  normalizePhone = false,
  ...props
}) {
  const inputRef = useRef(null);
  const [displayValue, setDisplayValue] = useState(formatValue(value, mask, maskChar));

  // Sync display value when external value changes
  useEffect(() => {
    setDisplayValue(formatValue(value, mask, maskChar));
  }, [value, mask, maskChar]);

  function countMaskSlots(pattern) {
    return (pattern.match(/#/g) || []).length;
  }

  function sanitizeDigits(input) {
    const digits = String(input ?? '').replace(/\D/g, '');
    return digits;
  }

  function formatValue(val, maskPattern, placeholder) {
    if (!val) return '';

    let cleanValue;
    if (normalizePhone && val.startsWith('+56')) {
      // Extract digits after +56
      cleanValue = val.substring(3);
    } else {
      cleanValue = sanitizeDigits(val);
    }

    // For phone numbers, limit to exactly 9 digits
    if (normalizePhone) {
      cleanValue = cleanValue.slice(0, 9);
    } else {
      const maxLen = countMaskSlots(maskPattern);
      if (maxLen) cleanValue = cleanValue.slice(0, maxLen);
    }

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
    let digits = sanitizeDigits(inputValue);
    const maxLen = countMaskSlots(mask);

    // For phone numbers, limit to exactly 9 digits
    if (normalizePhone) {
      digits = digits.slice(0, 9);
    } else if (maxLen) {
      digits = digits.slice(0, maxLen);
    }

    const formatted = formatValue(digits, mask, maskChar);
    setDisplayValue(formatted);

    // For phone numbers, store the complete formatted value with +56
    if (normalizePhone) {
      const phoneValue = '+56' + digits;
      onChange(phoneValue);
    } else {
      onChange(digits);
    }
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
