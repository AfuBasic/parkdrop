import { HomeHeader } from './components/HomeHeader';
import { OperationalSearch } from './components/OperationalSearch';
import { OperationalSummary } from './components/OperationalSummary';
import { RecentPackages } from './components/RecentPackages';

interface HomeScreenProps {
  onNavigateToSearch?: () => void;
  onNavigateToAdd?: () => void;
  onNavigateToPackages?: () => void;
  onNavigateToCredits?: () => void;
  onSelectPackage?: (packageId: string) => void;
}

export function HomeScreen({ onNavigateToSearch, onNavigateToAdd, onNavigateToPackages, onNavigateToCredits, onSelectPackage }: HomeScreenProps) {
  return (
    <div className="flex flex-col h-full max-w-lg mx-auto pb-4">
      <HomeHeader onNavigateToCredits={onNavigateToCredits} />
      
      <main className="flex-1 mt-2">
        <OperationalSearch 
          onSearchFocus={onNavigateToSearch} 
          onAddPackage={onNavigateToAdd}
        />
        
        <OperationalSummary />
        
        <RecentPackages 
          onSeeAll={onNavigateToPackages}
          onAddPackage={onNavigateToAdd}
          onSelectPackage={onSelectPackage}
        />
      </main>
    </div>
  );
}
