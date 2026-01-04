import type { VercelRequest, VercelResponse } from '@vercel/node';
import { keccak256, encodePacked } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';

const MAX_SCORE = 9999;
const SIGNATURE_EXPIRY_MS = 5 * 60 * 1000;

const ALLOWED_ORIGINS = [
  'https://base-bird.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
];

function getCorsHeaders(origin: string | undefined) {
  const allowedOrigin = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin;
  const corsHeaders = getCorsHeaders(origin);

  Object.entries(corsHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { address, score } = req.body;

    if (!address || typeof address !== 'string' || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      return res.status(400).json({ error: 'Invalid address' });
    }

    if (typeof score !== 'number' || score <= 0 || score > MAX_SCORE || !Number.isInteger(score)) {
      return res.status(400).json({ error: 'Invalid score' });
    }

    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    if (!privateKey) {
      console.error('SIGNER_PRIVATE_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const timestamp = Math.floor(Date.now() / 1000);
    const nonce = keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256', 'uint256'],
        [address as `0x${string}`, BigInt(score), BigInt(timestamp), BigInt(Math.floor(Math.random() * 1000000))]
      )
    );

    const messageHash = keccak256(
      encodePacked(
        ['address', 'uint256', 'uint256', 'bytes32'],
        [address as `0x${string}`, BigInt(score), BigInt(timestamp), nonce]
      )
    );

    const account = privateKeyToAccount(privateKey as `0x${string}`);
    const signature = await account.signMessage({
      message: { raw: messageHash },
    });

    return res.status(200).json({
      signature,
      timestamp,
      nonce,
      expiresAt: timestamp + Math.floor(SIGNATURE_EXPIRY_MS / 1000),
    });
  } catch (error) {
    console.error('Error signing score:', error);
    return res.status(500).json({ error: 'Failed to sign score' });
  }
}

