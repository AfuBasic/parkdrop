import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';

export type NavDirection = 'forward' | 'back';

const NavDirectionContext = React.createContext<NavDirection>('forward');

export function useNavDirection() {
  return React.useContext(NavDirectionContext);
}

export function NavDirectionProvider({ children }: { children: React.ReactNode }) {
  const routerState = useRouterState();
  const navigationType = routerState.navigationType; // 'push' | 'replace' | 'pop'

  const direction: NavDirection = navigationType === 'pop' ? 'back' : 'forward';

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-nav-dir', direction);
    }
  }, [direction]);

  return (
    <NavDirectionContext.Provider value={direction}>
      {children}
    </NavDirectionContext.Provider>
  );
}
