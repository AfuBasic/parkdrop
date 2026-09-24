import * as React from 'react';
import { useRouterState } from '@tanstack/react-router';
import { tabIndexOf } from './tab-order';

export type NavDirection = 'forward' | 'back';

const NavDirectionContext = React.createContext<NavDirection>('forward');

export function useNavDirection() {
  return React.useContext(NavDirectionContext);
}

export function NavDirectionProvider({ children }: { children: React.ReactNode }) {
  // TanStack Router does not expose a navigation type directly. Each history
  // entry carries an incrementing __TSR_index, so comparing it against the
  // last one we saw tells us whether this was a back (pop) navigation —
  // that's the right signal for drill-in/drill-out (e.g. a package detail
  // screen pushed from a list, and back out of it).
  //
  // But for the bottom-nav tabs specifically, EVERY tap pushes a new history
  // entry (they're not pops), so that signal alone always said "forward" —
  // Packages -> Home slid left exactly like Home -> Packages, even though
  // Home sits to the left of Packages in the bar. When both the previous
  // and next route are tabs, prefer their left-to-right position in the bar
  // instead: moving to a tab further right feels like advancing (slide
  // left), moving to one further left feels like retreating (slide right) —
  // "stacked screens" arranged in the order they appear in the nav.
  const location = useRouterState({ select: (state) => state.location });
  const lastRef = React.useRef({ pathname: location.pathname, index: location.state.__TSR_index });
  const [direction, setDirection] = React.useState<NavDirection>('forward');

  React.useEffect(() => {
    const prev = lastRef.current;
    const prevTabIndex = tabIndexOf(prev.pathname);
    const nextTabIndex = tabIndexOf(location.pathname);

    let next: NavDirection;
    if (prevTabIndex !== -1 && nextTabIndex !== -1) {
      next = nextTabIndex >= prevTabIndex ? 'forward' : 'back';
    } else {
      next = location.state.__TSR_index < prev.index ? 'back' : 'forward';
    }

    lastRef.current = { pathname: location.pathname, index: location.state.__TSR_index };
    setDirection(next);
  }, [location.pathname, location.state.__TSR_index]);

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
