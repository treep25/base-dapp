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
            background: 'linear-gradient(180deg, #0a1628 0%, #1e3a5f 30%, #4a90d9 60%, #87ceeb 100%)',
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          },
          children: [
            // Stars
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '40px',
                  left: '100px',
                  width: '4px',
                  height: '4px',
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 0 10px white',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '80px',
                  right: '150px',
                  width: '3px',
                  height: '3px',
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 0 8px white',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '120px',
                  left: '300px',
                  width: '2px',
                  height: '2px',
                  background: 'white',
                  borderRadius: '50%',
                  boxShadow: '0 0 6px white',
                },
              },
            },
            // Clouds
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '180px',
                  left: '50px',
                  width: '200px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: '40px',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '220px',
                  right: '80px',
                  width: '160px',
                  height: '50px',
                  background: 'rgba(255,255,255,0.85)',
                  borderRadius: '35px',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '140px',
                  right: '200px',
                  width: '120px',
                  height: '40px',
                  background: 'rgba(255,255,255,0.8)',
                  borderRadius: '30px',
                },
              },
            },
            // Left Pipe (top)
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '0',
                  left: '60px',
                  width: '80px',
                  height: '180px',
                  background: 'linear-gradient(90deg, #2d5a1d 0%, #4a9f35 30%, #6abf4a 50%, #4a9f35 70%, #2d5a1d 100%)',
                  borderRadius: '0 0 8px 8px',
                  display: 'flex',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  top: '160px',
                  left: '50px',
                  width: '100px',
                  height: '40px',
                  background: 'linear-gradient(90deg, #1e4a12 0%, #3d8a2a 30%, #5aaf3f 50%, #3d8a2a 70%, #1e4a12 100%)',
                  borderRadius: '6px',
                },
              },
            },
            // Right Pipe (bottom)
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '0',
                  right: '80px',
                  width: '80px',
                  height: '200px',
                  background: 'linear-gradient(90deg, #2d5a1d 0%, #4a9f35 30%, #6abf4a 50%, #4a9f35 70%, #2d5a1d 100%)',
                  borderRadius: '8px 8px 0 0',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '180px',
                  right: '70px',
                  width: '100px',
                  height: '40px',
                  background: 'linear-gradient(90deg, #1e4a12 0%, #3d8a2a 30%, #5aaf3f 50%, #3d8a2a 70%, #1e4a12 100%)',
                  borderRadius: '6px',
                },
              },
            },
            // Main card with glow
            {
              type: 'div',
              props: {
                style: {
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(180deg, rgba(30,58,95,0.95) 0%, rgba(74,144,217,0.9) 100%)',
                  borderRadius: '24px',
                  padding: '40px 80px',
                  border: '3px solid rgba(100,200,255,0.6)',
                  boxShadow: '0 0 40px rgba(100,200,255,0.4), inset 0 0 60px rgba(255,255,255,0.1)',
                  position: 'relative',
                  zIndex: '10',
                },
                children: [
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '56px',
                        fontWeight: '900',
                        color: 'white',
                        textShadow: '0 2px 10px rgba(0,0,0,0.3)',
                        marginBottom: '8px',
                        letterSpacing: '4px',
                      },
                      children: 'SCORE',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '28px',
                        fontWeight: '700',
                        color: 'rgba(255,255,255,0.7)',
                        marginBottom: '16px',
                        letterSpacing: '6px',
                      },
                      children: 'GAME OVER',
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '140px',
                        fontWeight: '900',
                        color: 'white',
                        lineHeight: '1',
                        textShadow: '0 4px 20px rgba(0,0,0,0.4)',
                      },
                      children: score,
                    },
                  },
                  {
                    type: 'div',
                    props: {
                      style: {
                        fontSize: '20px',
                        color: 'rgba(255,255,255,0.6)',
                        marginTop: '16px',
                      },
                      children: username,
                    },
                  },
                ],
              },
            },
            // Bird emoji flying
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  right: '200px',
                  top: '50%',
                  fontSize: '80px',
                  transform: 'translateY(-50%)',
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                },
                children: '🐦',
              },
            },
            // Speed lines
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  right: '300px',
                  top: '48%',
                  width: '60px',
                  height: '4px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.8))',
                  borderRadius: '2px',
                },
              },
            },
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  right: '320px',
                  top: '52%',
                  width: '40px',
                  height: '3px',
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6))',
                  borderRadius: '2px',
                },
              },
            },
            // BaseBird branding
            {
              type: 'div',
              props: {
                style: {
                  position: 'absolute',
                  bottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  background: 'rgba(0,0,0,0.5)',
                  padding: '10px 24px',
                  borderRadius: '20px',
                  border: '1px solid rgba(255,255,255,0.2)',
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

