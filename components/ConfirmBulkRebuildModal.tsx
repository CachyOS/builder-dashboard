'use client';

import {bulkRebuildPackages} from '@/app/actions';
import {BaseBuilderPackageWithName} from '@/types/BuilderPackage';
import {Button} from '@tremor/react';
import {useEffect} from 'react';
import {useFormState} from 'react-dom';
import {toast} from 'react-toastify';

import {BasePackageList} from './BasePackageList';
import Modal from './Modal';
import SubmitButton from './SubmitButton';

const initialState = {
  success: false,
};

export default function ConfirmBulkRebuildModal({
  isOpen,
  onClose,
  packages,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
  packages: BaseBuilderPackageWithName[];
}>) {
  const [state, formAction] = useFormState(
    bulkRebuildPackages.bind(null, packages),
    initialState
  );
  useEffect(() => {
    if (state?.success) {
      toast.success('Packages added to rebuild queue successfully!');
      onClose();
    }
  }, [onClose, state?.success]);
  return (
    <Modal isOpen={isOpen} large onClose={onClose}>
      <form action={formAction}>
        <h4 className="font-semibold text-tremor-content-strong dark:text-dark-tremor-content-strong text-center">
          Rebuild packages?
        </h4>
        <p className="mt-2 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
          Are you sure you want to rebuild the following packages?
        </p>
        <div className="flex flex-col gap-2 mt-4">
          <BasePackageList packages={packages} title="Packages to rebuild" />
        </div>
        <div className="flex flex-col gap-2 mt-4">
          <Button color="red" onClick={onClose} type="button">
            Cancel
          </Button>
          <SubmitButton className="w-full" text="Rebuild packages" />
        </div>
      </form>
    </Modal>
  );
}
