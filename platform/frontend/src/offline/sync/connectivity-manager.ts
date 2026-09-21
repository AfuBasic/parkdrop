export type ConnectivityState = 'UNKNOWN' | 'REACHABLE' | 'DEGRADED' | 'UNREACHABLE';

class ConnectivityManager {
  private state: ConnectivityState = 'UNKNOWN';
  private listeners: ((state: ConnectivityState) => void)[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private consecutiveSuccesses = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.debouncedCheckReachability());
      window.addEventListener('offline', () => {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
          this.debounceTimer = null;
        }
        this.consecutiveSuccesses = 0;
        this.setState('UNREACHABLE');
      });
      
      // Initial check
      if (navigator.onLine) {
        this.checkReachability();
      } else {
        this.setState('UNREACHABLE');
      }
    }
  }

  private debouncedCheckReachability(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.checkReachability();
    }, 500);
  }

  /**
   * Returns true only after at least 2 consecutive successful reachability checks.
   * Helps guard against aggressive background sync on flapping network connections.
   */
  isStabilized(): boolean {
    return this.state === 'REACHABLE' && this.consecutiveSuccesses >= 2;
  }

  async checkReachability(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      this.consecutiveSuccesses = 0;
      this.setState('UNREACHABLE');
      return false;
    }

    try {
      // Cheap ping to our API to confirm it's actually reachable
      const response = await fetch('/api/v1/auth/session', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
      
      // 401 is STILL REACHABLE! It's just an auth failure.
      if (response.ok || response.status === 401 || response.status === 403) {
        this.consecutiveSuccesses++;
        this.setState('REACHABLE');
        return true;
      }
      
      this.consecutiveSuccesses = 0;
      this.setState('DEGRADED');
      return false;
    } catch {
      this.consecutiveSuccesses = 0;
      this.setState('UNREACHABLE');
      return false;
    }
  }

  getState(): ConnectivityState {
    return this.state;
  }

  subscribe(listener: (state: ConnectivityState) => void): () => void {
    this.listeners.push(listener);
    listener(this.state); // fire immediately with current state
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private setState(newState: ConnectivityState) {
    if (this.state !== newState) {
      this.state = newState;
      this.listeners.forEach(l => l(newState));
    }
  }
}

export const connectivityManager = new ConnectivityManager();
