import { useState, useEffect, useRef } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';

export function useUserPhoto() {
  const { instance, accounts } = useMsal();
  const [photoUrl, setPhotoUrl] = useState(null);
  const accountId = accounts[0]?.homeAccountId;
  const fetchedRef = useRef(null);

  useEffect(() => {
    if (!accountId || fetchedRef.current === accountId) return;
    fetchedRef.current = accountId;

    let objectUrl = null;
    (async () => {
      try {
        const response = await instance.acquireTokenSilent({
          ...loginRequest,
          account: accounts[0],
        });

        const res = await fetch('https://graph.microsoft.com/v1.0/me/photo/$value', {
          headers: { Authorization: `Bearer ${response.accessToken}` },
        });

        if (res.ok) {
          const blob = await res.blob();
          objectUrl = URL.createObjectURL(blob);
          setPhotoUrl(objectUrl);
        }
      } catch {
        // No photo available
      }
    })();

    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [instance, accountId]);

  return photoUrl;
}
