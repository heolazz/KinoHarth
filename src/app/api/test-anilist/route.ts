export async function GET() {
  try {
    const url = process.env.ANILIST_API_URL || "https://graphql.anilist.co";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
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
      url,
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
