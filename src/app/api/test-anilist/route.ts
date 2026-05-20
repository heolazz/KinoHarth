export async function GET() {
  try {
    const response = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "User-Agent": "KinoHarth/1.0",
      },
      body: JSON.stringify({
        query: `
          query {
            Page(page: 1, perPage: 1) {
              media(type: ANIME, sort: POPULARITY_DESC) {
                id
                title {
                  romaji
                }
              }
            }
          }
        `,
      }),
    });

    const text = await response.text();

    return Response.json({
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      body: text.slice(0, 1000),
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
