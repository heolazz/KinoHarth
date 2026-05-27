fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ __type(name: "Studio") { fields { name args { name } type { name kind } } } }' })
})
  .then(r => r.json())
  .then(data => {
    const media = data.data.__type.fields.find(f => f.name === 'media');
    console.log(media.args.map(a => a.name).join(', '));
    console.log(media.type.name, media.type.kind);
  });
