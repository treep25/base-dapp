import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

interface BaseAppUser {
  fid?: number;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface BaseAppContext {
  user: BaseAppUser | null;
  isInBaseApp: boolean;
  isLoading: boolean;
}

export function useBaseAppContext(): BaseAppContext {
  const [user, setUser] = useState<BaseAppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInBaseApp, setIsInBaseApp] = useState(false);

  useEffect(() => {
    const loadContext = async () => {
      try {
        const context = await sdk.context;
        if (context?.user) {
          setUser({
            fid: context.user.fid,
            username: context.user.username,
            displayName: context.user.displayName,
            pfpUrl: context.user.pfpUrl,
          });
          setIsInBaseApp(true);
        }
      } catch {
        setIsInBaseApp(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadContext();
  }, []);

  return { user, isInBaseApp, isLoading };
}

