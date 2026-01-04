import type { VercelRequest, VercelResponse } from '@vercel/node';

interface FarcasterUser {
  fid: number;
  username: string;
  display_name: string;
  pfp_url: string;
  verified_addresses: {
    eth_addresses: string[];
  };
}

interface NeynarResponse {
  [address: string]: FarcasterUser[];
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
  'https://base-bird.vercel.app',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { addresses } = req.body as { addresses: string[] };

    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      return res.status(400).json({ error: 'Invalid addresses array' });
    }

    const apiKey = process.env.NEYNAR_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Neynar API key not configured' });
    }

    const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))];
    const addressesParam = uniqueAddresses.join(',');

    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addressesParam}`,
      {
        headers: {
          'accept': 'application/json',
          'api_key': apiKey,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Neynar API error:', errorText);
      return res.status(response.status).json({ error: 'Neynar API error' });
    }

    const data: NeynarResponse = await response.json();

    const profiles: Record<string, { username: string; displayName: string; pfpUrl: string }> = {};

    for (const [address, users] of Object.entries(data)) {
      if (users && users.length > 0) {
        const user = users[0];
        profiles[address.toLowerCase()] = {
          username: user.username,
          displayName: user.display_name,
          pfpUrl: user.pfp_url,
        };
      }
    }

    return res.status(200).json({ profiles });
  } catch (error) {
    console.error('Error fetching Farcaster profiles:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

