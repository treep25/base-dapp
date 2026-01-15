import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const score = searchParams.get('score') || '0';
    const username = searchParams.get('username') || 'Player';

    return new ImageResponse(
      {
        type: 'div',
        props: {
          style: {
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            fontFamily: 'system-ui, sans-serif',
          },
          children: [
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'rgba(0, 0, 0, 0.7)',
                  borderRadius: '32px',
                  padding: '48px 64px',
                  border: '4px solid rgba(255, 255, 255, 0.2)',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: '80px', marginBottom: '16px' },
                      children: '🐦',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '32px',
                        color: 'rgba(255, 255, 255, 0.8)',
                        marginBottom: '8px',
                      },
                      children: username,
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '120px',
                        fontWeight: 'bold',
                        color: '#00D4FF',
                        lineHeight: '1',
                        marginBottom: '8px',
                      },
                      children: score,
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '24px',
                        color: 'rgba(255, 255, 255, 0.5)',
                        textTransform: 'uppercase',
                        letterSpacing: '8px',
                      },
                      children: 'HIGH SCORE',
                    },
                  },
                ],
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  background: 'rgba(0, 0, 0, 0.6)',
                  padding: '12px 24px',
                  borderRadius: '16px',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: '28px' },
                      children: '🐦',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: 'white',
                      },
                      children: 'BaseBird',
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (e) {
    console.error('Error generating image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}

