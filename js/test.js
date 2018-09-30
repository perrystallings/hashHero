let v = 'astal01@gmail.com'
let perfStart = performance.now();
for (i = 0; i < 100000; i++) {
    //if (re.test(v)){
      sha256(v).then(hash => console.log(performance.now()- perfStart));
    //}
}
let perfEnd = performance.now();
