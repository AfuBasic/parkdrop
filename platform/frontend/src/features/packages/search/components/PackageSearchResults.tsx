import type { PackageSearchResult } from '../package-search-types';
import { PackageSearchResultRow } from './PackageSearchResultRow';

interface PackageSearchResultsProps {
  results: PackageSearchResult[];
  onSelectResult?: (result: PackageSearchResult) => void;
  activePickupPointId?: number | null;
}

export function PackageSearchResults({
  results,
  onSelectResult,
  activePickupPointId,
}: PackageSearchResultsProps) {
  if (results.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 text-xs font-medium text-text-muted">
        <span>
          {results.length} {results.length === 1 ? 'package found' : 'packages found'}
        </span>
      </div>

      <ul className="flex flex-col divide-y divide-border-subtle bg-surface-default rounded-2xl border border-border-subtle shadow-sm overflow-hidden" role="list">
        {results.map((res) => (
          <PackageSearchResultRow
            key={res.packageId}
            result={res}
            onSelect={onSelectResult}
            activePickupPointId={activePickupPointId}
          />
        ))}
      </ul>
    </div>
  );
}
