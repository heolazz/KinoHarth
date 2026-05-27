const query = `
query {
  Studio(id: 21) {
    media(page: 1, perPage: 5, sort: POPULARITY_DESC, isMain: true) {
      nodes {
        id
        title { romaji }
      }
    }
  }
}
`;

globalThis.fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
})
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)));
