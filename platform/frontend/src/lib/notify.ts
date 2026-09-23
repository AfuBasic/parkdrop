import { toast } from 'sonner';

export interface AppError {
  title: string;
  message: string;
}

export function getUserFacingError(error: unknown): AppError {
  const defaultNetworkError = {
    title: "Could not connect",
    message: "Check your internet and try again.",
  };

  if (!error) return defaultNetworkError;

  if (typeof error === 'string') {
    if (error.toLowerCase().includes('fetch') || error.toLowerCase().includes('network')) {
      return defaultNetworkError;
    }
    return { title: "Error", message: error };
  }

  const err = error as Error;
  const rawMessage = err.message || '';
  
  if (
    rawMessage === 'Failed to fetch' ||
    rawMessage.toLowerCase().includes('networkerror') ||
    err.name === 'TypeError'
  ) {
    return defaultNetworkError;
  }

  return {
    title: "Request failed",
    message: rawMessage || "An unexpected error occurred.",
  };
}

export const notify = {
  success: (title: string, message?: string) => {
    toast.success(title, {
      description: message,
    });
  },
  error: (error: unknown, fallbackTitle?: string) => {
    const appError = getUserFacingError(error);
    if (fallbackTitle && appError.title === "Request failed") {
        appError.title = fallbackTitle;
    }
    
    toast.error(appError.title, {
      description: appError.message,
    });
  },
  warning: (title: string, message?: string) => {
    toast.warning(title, {
      description: message,
    });
  },
  info: (title: string, message?: string) => {
    toast.info(title, {
      description: message,
    });
  },
};
