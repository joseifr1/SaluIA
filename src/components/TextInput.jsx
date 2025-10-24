// import React from 'react';
// import clsx from 'clsx';

// export function TextInput({ 
//   className, 
//   error,
//   ...props 
// }) {
//   return (
//     <input
//       className={clsx(
//         'input',
//         error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
//         className
//       )}
//       {...props}
//     />
//   );
// }

// src/components/TextInput.jsx
import React, { forwardRef } from 'react';
import clsx from 'clsx';

export const TextInput = forwardRef(function TextInput(
  { className, error, ...props }, // NO extraigas name, onChange, value, etc.
  ref
) {
  return (
    <div>
      <input
        ref={ref}
        // estos props vienen desde register(...) y deben pasar tal cual:
        {...props}
        className={clsx(
          'flex h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          error && 'border-danger focus:border-danger focus:ring-danger/40',
          className
        )}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
    </div>
  );
});