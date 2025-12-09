// GET /api/spotify-dev/login
export const runtime = "nodejs";

function b64(x: string) {
  return Buffer.from(x).toString("base64");
}

export async function GET() {
  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const redirectUri = "http://127.0.0.1:3000/api/spotify-dev/callback"; // חייב להיות זהה בדיוק למה שבדשבורד

  const scope = [
    "user-read-email",
    "user-read-private",
    "playlist-read-private",
  ].join(" ");

  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    show_dialog: "true",
    state: Math.random().toString(36).slice(2),
  });

  const url = `https://accounts.spotify.com/authorize?${params.toString()}`;
  return Response.redirect(url, 302);
}
