'use client';

import {Button} from '@tremor/react';
import {useFormStatus} from 'react-dom';

export default function SubmitButton({
  className = 'mt-4 w-full',
  disabled = false,
  text,
}: Readonly<{className?: string; disabled?: boolean; text: string}>) {
  const {pending} = useFormStatus();
  return (
    <Button
      className={`${className} rounded-tremor-default bg-tremor-brand py-2 text-center text-tremor-default font-medium text-tremor-brand-inverted shadow-tremor-input hover:bg-tremor-brand-emphasis dark:bg-dark-tremor-brand dark:text-dark-tremor-brand-inverted dark:shadow-dark-tremor-input dark:hover:bg-dark-tremor-brand-emphasis`}
      disabled={pending || disabled}
      type="submit"
    >
      {text}
    </Button>
  );
}
