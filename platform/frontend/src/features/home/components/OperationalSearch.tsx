import { SearchInput } from '@/design-system/components/SearchInput';
import { Plus } from 'lucide-react';

interface OperationalSearchProps {
  onSearchFocus?: () => void;
  onAddPackage?: () => void;
}

export function OperationalSearch({ onSearchFocus, onAddPackage }: OperationalSearchProps) {
  return (
    <div className="flex flex-col gap-4 mb-8">
      <div>
        <h2 className="sr-only">Find a package</h2>
        <div 
          onClick={onSearchFocus}
          className="cursor-text"
        >
          <SearchInput 
            placeholder="Search name, phone, pickup code or package ID" 
            readOnly // Readonly because in this milestone it's just an entry point that acts like a button
            className="h-14 sm:h-12 shadow-sm text-lg sm:text-base cursor-text bg-surface-default"
          />
        </div>
      </div>
      
      <button 
        onClick={onAddPackage}
        className="flex h-14 sm:h-12 w-full items-center justify-center gap-2 rounded-xl bg-action-primary px-4 py-3 text-[var(--text-body-lg)] sm:text-[var(--text-body-md)] font-semibold text-text-inverse shadow-sm transition-colors hover:bg-action-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        <Plus className="h-5 w-5" />
        Add package
      </button>
    </div>
  );
}
