import { useRouter } from '@tanstack/react-router';

/**
 * Returns a navigation function that acts like the browser's Back button.
 * If the user opened the app directly to a deep link (meaning there is no in-app
 * history to go back to), it falls back to a provided route to prevent exiting the app.
 */
export function useSafeBack(fallbackRoute = '/home') {
  const router = useRouter();

  return () => {
    // window.history.length is 1 for a brand new tab, 
    // and > 2 usually means they've navigated within the app.
    if (typeof window !== 'undefined' && window.history.length > 2) {
      router.history.back();
    } else {
      router.navigate({ to: fallbackRoute });
    }
  };
}
