import { ImageResponse } from '@vercel/og';

export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    
    const score = searchParams.get('score') || '0';
    const username = searchParams.get('username') || 'Player';

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
            background: 'linear-gradient(180deg, #1a5fb4 0%, #62a0ea 50%, #99c1f1 100%)',
          },
          children: [
            // Background image (contain - вся картинка видна)
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
                  objectFit: 'contain',
                },
              },
            },
            
            // Username
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '42px',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 4px 20px rgba(0,0,0,0.9), 0 2px 4px rgba(0,0,0,0.7)',
                  marginBottom: '12px',
                  zIndex: 10,
                },
                children: username,
              },
            },
            
            // Score
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '160px',
                  fontWeight: '900',
                  color: 'white',
                  lineHeight: '1',
                  textShadow: '0 6px 30px rgba(0,0,0,0.9), 0 3px 6px rgba(0,0,0,0.7)',
                  zIndex: 10,
                },
                children: score,
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
