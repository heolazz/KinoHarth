async function run() {
  try {
    const r = await fetch('http://localhost:3000/studio/21/studio-ghibli');
    const t = await r.text();
    const parts = t.split('"description":"');
    if (parts.length > 1) {
      console.log(parts[1].substring(0, 1000));
    } else {
      console.log('No description found in HTML. Snippet:', t.substring(0, 500));
    }
  } catch (e) {
    console.error(e);
  }
}
run();
