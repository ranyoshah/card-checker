// Passes the official card picture through our own site.
// Why: a browser only lets our code measure the pixels of a picture (for the
// photo checks) if the picture comes from our own website. This only allows
// pictures from TCGdex's image server, so it can't be misused for other sites.

export async function GET(request) {
  const url = new URL(request.url).searchParams.get('url');

  let target;
  try {
    target = new URL(url);
  } catch {
    return new Response('Bad image address', { status: 400 });
  }
  if (target.protocol !== 'https:' || target.hostname !== 'assets.tcgdex.net') {
    return new Response('Only TCGdex images are allowed', { status: 400 });
  }

  const res = await fetch(target, { cache: 'no-store' });
  if (!res.ok) return new Response('Image not found', { status: res.status === 404 ? 404 : 502 });

  return new Response(await res.arrayBuffer(), {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/webp',
      'Cache-Control': 'public, max-age=86400, s-maxage=604800',
    },
  });
}
