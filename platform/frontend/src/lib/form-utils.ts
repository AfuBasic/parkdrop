import type { UseFormReturn, Path } from 'react-hook-form';
import { ApiError } from './api';
import { notify } from './notify';

/**
 * Maps Laravel API validation errors to a react-hook-form instance.
 * If the error is not a 422 validation error, it displays a global toast.
 * 
 * @param form - The react-hook-form instance
 * @param error - The error caught from an API call
 * @param genericMessage - Fallback message for non-validation errors
 */
export function handleApiError<TFieldValues extends Record<string, any>>(
  form: UseFormReturn<TFieldValues>,
  error: unknown,
  genericMessage: string = 'An unexpected error occurred'
) {
  if (error instanceof ApiError) {
    if (error.status === 422 && error.errors) {
      // It's a Laravel validation bag
      Object.entries(error.errors).forEach(([field, messages]) => {
        // We only use the first error message per field to keep the UI clean
        form.setError(field as Path<TFieldValues>, {
          type: 'server',
          message: messages[0]
        });
      });
      return;
    }
    
    // Some other API error (401, 403, 404, 500, etc) with a message from the backend
    notify.error(error, genericMessage);
    return;
  }

  // A generic JS Error (Network error, etc)
  notify.error(error, genericMessage);
}
