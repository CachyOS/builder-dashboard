import {Check, ChevronsUpDown} from 'lucide-react';

import {Button} from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover';
import {cn} from '@/lib/utils';

export interface ComboBoxProps<T> {
  addItem: (item: T) => void;
  items: T[];
  noSelectedItemsText: string;
  removeItem: (item: T) => void;
  searchNoResultsText?: string;
  searchPlaceholder?: string;
  selectedItems: T[];
  selectedItemsText: ((count: number) => string) | string;
}

export function ComboBox<T extends string>({
  addItem,
  items,
  noSelectedItemsText,
  removeItem,
  searchNoResultsText = 'No results found',
  searchPlaceholder = 'Search...',
  selectedItems,
  selectedItemsText,
}: Readonly<ComboBoxProps<T>>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'max-w-sm w-full justify-between',
            !selectedItems.length && 'text-muted-foreground'
          )}
          variant="outline"
        >
          {selectedItems.length
            ? `${selectedItems.length} ${typeof selectedItemsText === 'function' ? selectedItemsText(selectedItems.length) : selectedItemsText}`
            : noSelectedItemsText}
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="max-w-2xl w-full p-0">
        <Command>
          <CommandInput className="h-9" placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{searchNoResultsText}</CommandEmpty>
            <CommandGroup>
              {items.map(item => (
                <CommandItem
                  key={item}
                  onSelect={() => {
                    if (selectedItems.includes(item)) {
                      removeItem(item);
                    } else {
                      addItem(item);
                    }
                  }}
                  value={item}
                >
                  {item}
                  <Check
                    className={cn(
                      'ml-auto',
                      selectedItems.includes(item) ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
