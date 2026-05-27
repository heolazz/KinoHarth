const query = `
query {
  ghibli: Media(id: 164) { bannerImage }
  mappa: Media(id: 113415) { bannerImage }
  ufotable: Media(id: 101922) { bannerImage }
  wit: Media(id: 16498) { bannerImage }
  kyoani: Media(id: 101291) { bannerImage }
  madhouse: Media(id: 11061) { bannerImage }
  bones: Media(id: 5114) { bannerImage }
  cloverworks: Media(id: 132405) { bannerImage }
}
`;

globalThis.fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query })
})
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)));
