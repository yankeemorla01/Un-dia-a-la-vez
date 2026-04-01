import { useMsal } from '@azure/msal-react';
import { useCallback, useRef } from 'react';
import { loginRequest } from './authConfig';

export function useAuthFetch() {
  const { instance, accounts } = useMsal();
  const accountIdRef = useRef(accounts[0]?.homeAccountId);
  accountIdRef.current = accounts[0]?.homeAccountId;
  const accountRef = useRef(accounts[0]);
  accountRef.current = accounts[0];

  const authFetch = useCallback(async (url, options = {}) => {
    let token = '';
    if (accountRef.current) {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accountRef.current,
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
  }, [instance]);

  return authFetch;
}
