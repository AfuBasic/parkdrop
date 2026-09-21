import * as React from 'react';

/**
 * Whether the browser currently thinks it has a connection.
 *
 * navigator.onLine is a blunt instrument — it reports whether there is a
 * network interface, not whether anything is reachable — so it is only ever
 * used here to explain a failure the user is already looking at, never to
 * block them from trying. Someone on a flaky Nigerian mobile connection may
 * well be "offline" by this measure and still get a request through, so the
 * button stays live either way.
 */
export function useOnline(): boolean {
  const [online, setOnline] = React.useState(() =>
    typeof navigator === 'undefined' ? true : navigator.onLine
  );

  React.useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
