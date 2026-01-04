import { useState, useEffect, useCallback } from 'react';

interface FarcasterProfile {
  username: string;
  displayName: string;
  pfpUrl: string;
}

type ProfilesMap = Record<string, FarcasterProfile>;

const API_URL = '/api/farcaster-profiles';

const profilesCache: ProfilesMap = {};

export function useFarcasterProfiles(addresses: string[]) {
  const [profiles, setProfiles] = useState<ProfilesMap>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchProfiles = useCallback(async (addrs: string[]) => {
    if (addrs.length === 0) return;

    const uncachedAddresses = addrs.filter(
      addr => !profilesCache[addr.toLowerCase()]
    );

    if (uncachedAddresses.length === 0) {
      const cached: ProfilesMap = {};
      addrs.forEach(addr => {
        const profile = profilesCache[addr.toLowerCase()];
        if (profile) {
          cached[addr.toLowerCase()] = profile;
        }
      });
      setProfiles(cached);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ addresses: uncachedAddresses }),
      });

      if (response.ok) {
        const data = await response.json();
        const newProfiles: ProfilesMap = data.profiles || {};

        Object.entries(newProfiles).forEach(([addr, profile]) => {
          profilesCache[addr.toLowerCase()] = profile as FarcasterProfile;
        });

        const allProfiles: ProfilesMap = {};
        addrs.forEach(addr => {
          const profile = profilesCache[addr.toLowerCase()];
          if (profile) {
            allProfiles[addr.toLowerCase()] = profile;
          }
        });

        setProfiles(allProfiles);
      }
    } catch (error) {
      console.error('Error fetching Farcaster profiles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (addresses.length > 0) {
      fetchProfiles(addresses);
    }
  }, [addresses.join(','), fetchProfiles]);

  const getProfile = useCallback((address: string): FarcasterProfile | null => {
    return profiles[address.toLowerCase()] || null;
  }, [profiles]);

  return { profiles, getProfile, isLoading };
}

