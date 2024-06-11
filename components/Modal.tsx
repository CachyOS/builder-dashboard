'use client';
import {RiCloseLine} from '@remixicon/react';
import {Dialog, DialogPanel} from '@tremor/react';

export default function Modal({
  children,
  isOpen,
  large,
  onClose,
}: Readonly<{
  children: React.ReactNode;
  isOpen: boolean;
  large?: boolean;
  onClose: () => void;
}>) {
  return (
    <Dialog
      className="z-[100]"
      onClose={() => onClose()}
      open={isOpen}
      static={true}
    >
      <DialogPanel className={large ? 'sm:max-w-xl' : 'sm:max-w-md'}>
        <div className="absolute right-0 top-0 pr-3 pt-3">
          <button
            aria-label="Close"
            className="rounded-tremor-small p-2 text-tremor-content-subtle hover:bg-tremor-background-subtle hover:text-tremor-content dark:text-dark-tremor-content-subtle hover:dark:bg-dark-tremor-background-subtle hover:dark:text-tremor-content"
            onClick={() => onClose()}
            type="button"
          >
            <RiCloseLine aria-hidden={true} className="h-5 w-5 shrink-0" />
          </button>
        </div>
        {children}
      </DialogPanel>
    </Dialog>
  );
}
