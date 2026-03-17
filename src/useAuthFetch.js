import { useMsal } from '@azure/msal-react';
import { useCallback } from 'react';
import { loginRequest } from './authConfig';

export function useAuthFetch() {
  const { instance, accounts } = useMsal();

  const authFetch = useCallback(async (url, options = {}) => {
    let token = '';
    if (accounts.length > 0) {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });
        token = response.idToken;
      } catch {
        // If silent fails, the user may need to re-login
      }
    }

    const headers = { ...options.headers };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return fetch(url, { ...options, headers });
  }, [instance, accounts]);

  return authFetch;
}
