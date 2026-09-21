import { useAuth } from '@/features/auth/AuthContext';
import { useAttentionItems } from '@/features/attention/hooks/useAttentionItems';
import { AttentionSummary } from '@/features/attention/components/AttentionSummary';
import { HomeHeader } from './components/HomeHeader';
import { OperationalSearch } from './components/OperationalSearch';
import { OperationalSummary } from './components/OperationalSummary';
import { RecentPackages } from './components/RecentPackages';

interface HomeScreenProps {
  onNavigateToSearch?: () => void;
  onNavigateToAdd?: () => void;
  onNavigateToPackages?: () => void;
  onNavigateToCredits?: () => void;
  onNavigateToAttention?: () => void;
  onSelectPackage?: (packageId: string) => void;
}

export function HomeScreen({ 
  onNavigateToSearch, 
  onNavigateToAdd, 
  onNavigateToPackages, 
  onNavigateToCredits, 
  onNavigateToAttention,
  onSelectPackage 
}: HomeScreenProps) {
  const { business, role } = useAuth();
  const { items } = useAttentionItems({
    businessId: business?.id ?? 0,
    userRole: role,
  });

  return (
    <div className="flex flex-col h-full max-w-lg mx-auto pb-4">
      <HomeHeader onNavigateToCredits={onNavigateToCredits} />
      
      <main className="flex-1 mt-2">
        {onNavigateToAttention && (
          <AttentionSummary 
            items={items} 
            onViewAll={onNavigateToAttention} 
          />
        )}

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

