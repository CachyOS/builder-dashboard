'use client';

import {addPackage} from '@/app/actions';
import {RiLink} from '@remixicon/react';
import {TextInput} from '@tremor/react';
import {useEffect} from 'react';
import {useFormState} from 'react-dom';
import {toast} from 'react-toastify';

import Modal from './Modal';
import SubmitButton from './SubmitButton';

const initialState = {
  errorPkgURL: '',
  success: false,
};

export default function AddPackageModal({
  isOpen,
  onClose,
}: Readonly<{
  isOpen: boolean;
  onClose: () => void;
}>) {
  const [state, formAction] = useFormState(addPackage, initialState);
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
          Add a new package
        </h4>
        <p className="mt-2 text-tremor-default leading-6 text-tremor-content dark:text-dark-tremor-content">
          Enter the URL of the package to add it to the CachyOS Builder.
        </p>
        <label
          className="mt-6 block text-tremor-default font-medium text-tremor-content-strong dark:text-dark-tremor-content-strong"
          htmlFor="pkgURL"
        >
          Package URL
        </label>
        <TextInput
          className="mt-2"
          icon={RiLink}
          id="pkgURL"
          name="pkgURL"
          placeholder="Example: https://git.cachyos.org/cachyos/builder.git"
          type="url"
        />
        <SubmitButton disabled text="Add package" />
      </form>
    </Modal>
  );
}
