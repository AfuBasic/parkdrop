import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';

export type NavDirection = 'forward' | 'back';

const NavDirectionContext = React.createContext<NavDirection>('forward');

export function useNavDirection() {
  return React.useContext(NavDirectionContext);
}

export function NavDirectionProvider({ children }: { children: React.ReactNode }) {
  // TanStack Router does not expose a navigation type directly. Each history
  // entry carries an incrementing __TSR_index, so comparing it against the
  // last one we saw tells us whether this was a back (pop) navigation.
  const historyIndex = useRouterState({
    select: (state) => state.location.state.__TSR_index,
  });
  const lastIndexRef = React.useRef(historyIndex);
  const [direction, setDirection] = React.useState<NavDirection>('forward');

  React.useEffect(() => {
    const next: NavDirection = historyIndex < lastIndexRef.current ? 'back' : 'forward';
    lastIndexRef.current = historyIndex;
    setDirection(next);
  }, [historyIndex]);

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
