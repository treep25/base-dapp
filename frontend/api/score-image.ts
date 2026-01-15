import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const score = searchParams.get('score') || '0';
    const username = searchParams.get('username') || 'Player';
    const avatar = searchParams.get('avatar') || '';

    const baseUrl = 'https://base-bird.vercel.app';
    const bgImageUrl = `${baseUrl}/assets/share-bg.png`;

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
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          },
          children: [
            // Background image
            {
              type: 'img',
              props: {
                src: bgImageUrl,
                style: {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                },
              },
            },
            
            // Score Card (centered)
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, rgba(0,50,120,0.9) 0%, rgba(0,80,180,0.85) 100%)',
                  borderRadius: '32px',
                  padding: '36px 56px',
                  border: '4px solid rgba(100,180,255,0.6)',
                  boxShadow: '0 0 50px rgba(100,180,255,0.4), 0 20px 60px rgba(0,0,0,0.5)',
                  position: 'relative',
                  zIndex: '10',
                },
                children: [
                  // Avatar or Bird
                  avatar ? {
                    type: 'img',
                    props: {
                      src: avatar,
                      style: {
                        width: '90px',
                        height: '90px',
                        borderRadius: '50%',
                        border: '4px solid rgba(255,255,255,0.4)',
                        marginBottom: '12px',
                        objectFit: 'cover',
                      },
                    },
                  } : {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '64px',
                        marginBottom: '12px',
                        filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.4))',
                      },
                      children: '🐦',
                    },
                  },
                  
                  // Username
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '26px',
                        fontWeight: '700',
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: '6px',
                        textShadow: '0 2px 8px rgba(0,0,0,0.3)',
                      },
                      children: username,
                    },
                  },
                  
                  // Score
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '100px',
                        fontWeight: '900',
                        color: 'white',
                        lineHeight: '1',
                        textShadow: '0 4px 20px rgba(100,200,255,0.6), 0 2px 4px rgba(0,0,0,0.3)',
                        marginBottom: '6px',
                      },
                      children: score,
                    },
                  },
                  
                  // Label
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '18px',
                        fontWeight: '600',
                        color: 'rgba(255,255,255,0.6)',
                        letterSpacing: '6px',
                        textTransform: 'uppercase',
                      },
                      children: 'HIGH SCORE',
                    },
                  },
                ],
              },
            },
            
            // BaseBird branding (bottom)
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.7)',
                  padding: '10px 24px',
                  borderRadius: '20px',
                  border: '2px solid rgba(255,255,255,0.2)',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: { fontSize: '24px' },
                      children: '🐦',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '20px',
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
