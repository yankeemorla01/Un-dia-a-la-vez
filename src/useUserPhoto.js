import { useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest } from './authConfig';

export function useUserPhoto() {
  const { instance, accounts } = useMsal();
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    if (accounts.length === 0) return;

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
          setPhotoUrl(URL.createObjectURL(blob));
        }
      } catch {
        // No photo available
      }
    })();
  }, [instance, accounts]);

  return photoUrl;
}
