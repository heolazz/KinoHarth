fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ __type(name: "Page") { fields { name args { name } } } }' })
})
  .then(r => r.json())
  .then(data => {
    const media = data.data.__type.fields.find(f => f.name === 'media');
    console.log(media.args.map(a => a.name).join(', '));
  });
