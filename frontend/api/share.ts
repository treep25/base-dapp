export const config = {
  runtime: 'edge',
};

export default async function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const score = searchParams.get('score') || '0';
  const username = searchParams.get('username') || 'Player';
  const avatar = searchParams.get('avatar') || '';

  const baseUrl = 'https://base-bird.vercel.app';
  const gameUrl = baseUrl;
  
  // Build image URL with params
  const imageParams = new URLSearchParams({ score, username });
  if (avatar) imageParams.set('avatar', avatar);
  const imageUrl = `${baseUrl}/api/score-image?${imageParams.toString()}`;

  // Return HTML with OG tags that redirect to game
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>BaseBird - Score ${score}</title>
  <meta property="og:title" content="${username} scored ${score} in BaseBird!" />
  <meta property="og:description" content="Can you beat this score? Play BaseBird now!" />
  <meta property="og:image" content="${imageUrl}" />
  <meta property="og:image:width" content="1536" />
  <meta property="og:image:height" content="1024" />
  <meta property="og:url" content="${gameUrl}" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${imageUrl}" />
  <meta http-equiv="refresh" content="0;url=${gameUrl}">
</head>
<body>
  <p>Redirecting to BaseBird...</p>
  <script>window.location.href = "${gameUrl}";</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}

