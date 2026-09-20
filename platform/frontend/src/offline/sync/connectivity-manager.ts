export type ConnectivityState = 'UNKNOWN' | 'REACHABLE' | 'DEGRADED' | 'UNREACHABLE';

class ConnectivityManager {
  private state: ConnectivityState = 'UNKNOWN';
  private listeners: ((state: ConnectivityState) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.checkReachability());
      window.addEventListener('offline', () => this.setState('UNREACHABLE'));
      
      // Initial check
      if (navigator.onLine) {
        this.checkReachability();
      } else {
        this.setState('UNREACHABLE');
      }
    }
  }

  async checkReachability(): Promise<boolean> {
    if (typeof window === 'undefined' || !navigator.onLine) {
      this.setState('UNREACHABLE');
      return false;
    }

    try {
      // Cheap ping to our API to confirm it's actually reachable
      // We could use a dedicated /api/v1/connectivity endpoint, or just check session
      const response = await fetch('/api/v1/auth/session', { method: 'GET', headers: { 'Cache-Control': 'no-cache' } });
      
      // 401 is STILL REACHABLE! It's just an auth failure.
      if (response.ok || response.status === 401 || response.status === 403) {
        this.setState('REACHABLE');
        return true;
      }
      
      this.setState('DEGRADED');
      return false;
    } catch (e) {
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
