'use client';

import * as CheckboxPrimitives from '@radix-ui/react-checkbox';
import {ComponentPropsWithoutRef, ElementRef, forwardRef} from 'react';

const Checkbox = forwardRef<
  ElementRef<typeof CheckboxPrimitives.Root>,
  ComponentPropsWithoutRef<typeof CheckboxPrimitives.Root>
>(({className, checked, ...props}, forwardedRef) => {
  return (
    <CheckboxPrimitives.Root
      ref={forwardedRef}
      {...props}
      checked={checked}
      className={`relative inline-flex size-4 shrink-0 appearance-none items-center justify-center rounded border shadow-sm outline-none transition duration-100 enabled:cursor-pointer text-white dark:text-black data-[state=indeterminate]:text-white data-[state=indeterminate]:dark:text-black data-[state=checked]:text-white data-[state=checked]:dark:text-black bg-white dark:bg-gray-950 border-gray-300 dark:border-gray-800 data-[disabled]:border-gray-300 data-[disabled]:bg-gray-100 data-[disabled]:text-gray-400 data-[disabled]:dark:border-gray-700 data-[disabled]:dark:bg-gray-800 data-[disabled]:dark:text-gray-500 data-[state=checked]:border-0 data-[state=checked]:border-transparent data-[state=checked]:bg-black dark:data-[state=checked]:bg-white data-[state=indeterminate]:border-0 data-[state=indeterminate]:border-transparent data-[state=indeterminate]:bg-black dark:data-[state=indeterminate]:bg-white focus:ring-2 focus:ring-blue-200 focus:dark:ring-blue-700/30 focus:border-black focus:dark:border-white ${className}`}
    >
      <CheckboxPrimitives.Indicator className="flex size-full items-center justify-center">
        {checked === 'indeterminate' ? (
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <line
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              x1="4"
              x2="12"
              y1="8"
              y2="8"
            ></line>
          </svg>
        ) : (
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M11.2 5.59998L6.79999 9.99998L4.79999 7.99998"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            ></path>
          </svg>
        )}
      </CheckboxPrimitives.Indicator>
    </CheckboxPrimitives.Root>
  );
});
Checkbox.displayName = 'Checkbox';

export default Checkbox;
