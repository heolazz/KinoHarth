fetch('https://graphql.anilist.co', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ query: '{ __type(name: "Studio") { fields { name args { name } } } }' })
})
  .then(r => r.json())
  .then(data => {
    console.log(data.data.__type.fields.map(f => f.name).join(', '));
  });
