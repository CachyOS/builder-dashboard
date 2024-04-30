'use client';
import {rebuildPackage} from '@/app/actions';
import {BuilderPackage} from '@/types/BuilderPackage';
import {Button} from '@tremor/react';
import {useEffect} from 'react';
import {useFormState} from 'react-dom';
import {toast} from 'react-toastify';

import Modal from './Modal';
import SubmitButton from './SubmitButton';

const initialState = {
  success: false,
};

export default function ConfirmRebuildModal({
  isOpen,
  onClose,
  pkg,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  pkg: BuilderPackage;
}>) {
  const [state, formAction] = useFormState(rebuildPackage, initialState);
  useEffect(() => {
    if (state?.success) {
      toast.success('Package added successfully!');
      onClose();
    }
  }, [onClose, state?.success]);
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <form action={formAction}>
        <h4 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-center">
          Rebuild package?
        </h4>
        <p className="mt-2 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
          Are you sure you want to rebuild {pkg.pkgname} ({pkg.pkgbase}) (
          {pkg.march})?
        </p>
        <input name="pkgbase" type="hidden" value={pkg.pkgbase} />
        <input name="march" type="hidden" value={pkg.march} />
        <input name="repository" type="hidden" value={pkg.repository} />
        <div className="flex flex-col gap-2 mt-4">
          <Button color="red" onClick={onClose} type="button">
            Cancel
          </Button>
          <SubmitButton className="w-full" text="Rebuild package" />
        </div>
      </form>
    </Modal>
  );
}
