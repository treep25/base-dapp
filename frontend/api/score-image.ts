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
          },
          children: [
            // Твоя картинка как фон (занимает всё)
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
            
            // Аватар (если есть)
            avatar ? {
              type: 'img',
              props: {
                src: avatar,
                style: {
                  width: '120px',
                  height: '120px',
                  borderRadius: '50%',
                  border: '4px solid rgba(255,255,255,0.8)',
                  marginBottom: '20px',
                  objectFit: 'cover',
                  zIndex: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                },
              },
            } : null,
            
            // Username
            {
              type: 'div',
              props: {
                style: {
                  fontSize: '48px',
                  fontWeight: '700',
                  color: 'white',
                  textShadow: '0 4px 20px rgba(0,0,0,0.8), 0 2px 4px rgba(0,0,0,0.6)',
                  marginBottom: '16px',
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
                  fontSize: '200px',
                  fontWeight: '900',
                  color: 'white',
                  lineHeight: '1',
                  textShadow: '0 8px 40px rgba(0,0,0,0.8), 0 4px 8px rgba(0,0,0,0.6)',
                  zIndex: 10,
                },
                children: score,
              },
            },
          ].filter(Boolean),
        },
      },
      {
        width: 1536,
        height: 1024,
      }
    );
  } catch (e) {
    console.error('Error generating image:', e);
    return new Response('Failed to generate image', { status: 500 });
  }
}
