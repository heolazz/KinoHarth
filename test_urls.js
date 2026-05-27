const urls = [
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/164-ZpbuiNZk7Gk2.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/113415-jQBSkxWAAk83.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101922-YfZhKABiqMVp.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/16498-8jpFCOcDmndn.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/101291-qZ7U58oP2Fk8.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/11061-fytzE3uA6t0h.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/114-1m0m2a8Yx06V.jpg",
  "https://s4.anilist.co/file/anilistcdn/media/anime/banner/132405-qYha0J6V4t8e.jpg"
];

Promise.all(urls.map(url => 
  fetch(url).then(res => console.log(url, res.status))
));
