import React from 'react';
import { TextInput } from './TextInput.jsx';
import { MaskedInput } from './MaskedInput.jsx';
import { Select } from './Select.jsx';
import { NumberInput } from './NumberInput.jsx';
import { Textarea } from './Textarea.jsx';
import { FIELD_TYPES } from '../lib/constants.js';

export function FormField({
  field,
  value,
  onChange,
  error,
  disabled = false
}) {
  const { id, label, type, required, placeholder, options, unit, step } = field;

  // Ensure primitives are passed to inputs and normalize change events
  const handleBasicChange = (eOrValue) => {
    const nextValue = eOrValue && eOrValue.target !== undefined ? eOrValue.target.value : eOrValue;
    onChange(nextValue);
  };

  const commonProps = {
    id,
    value: (typeof value === 'string' || typeof value === 'number') ? value : '',
    onChange: handleBasicChange,
    error,
    disabled,
    placeholder,
    required,
    'aria-describedby': error ? `${id}-error` : undefined,
  };

  const renderInput = () => {
    switch (type) {
      case FIELD_TYPES.RUT:
        return (
          <MaskedInput
            {...commonProps}
            onChange={handleBasicChange}
            mask="##.###.###-#"
            maskChar="_"
          />
        );

      case FIELD_TYPES.PHONE:
        return (
          <MaskedInput
            {...commonProps}
            onChange={handleBasicChange}
            mask="+56 9 #### ####"
            maskChar="_"
            normalizePhone
            inputMode="tel"
            autoComplete="off"
          />
        );

      case FIELD_TYPES.SELECT:
        return (
          <Select
            {...commonProps}
            options={options}
            placeholder={placeholder || `Seleccionar ${label.toLowerCase()}`}
          />
        );

      case FIELD_TYPES.NUMBER:
        return (
          <NumberInput
            {...commonProps}
            onChange={handleBasicChange}
            unit={unit}
            step={step}
          />
        );

      case FIELD_TYPES.TEXTAREA:
        return (
          <Textarea
            {...commonProps}
            rows={4}
          />
        );

      default:
        return (
          <TextInput
            {...commonProps}
            type={type}
          />
        );
    }
  };

  return (
    <div className="space-y-2">
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="requerido">*</span>}
      </label>

      {renderInput()}

      {error && (
        <p
          id={`${id}-error`}
          className="text-sm text-red-600"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}
