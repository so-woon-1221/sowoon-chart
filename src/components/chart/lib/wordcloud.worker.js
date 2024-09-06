import cloud from "d3-cloud";

self.onmessage = (e) => {
  const { data, width, height, padding } = e.data;

  self.postMessage({ type: "start" });

  const wordcloud = cloud()
    .size([width, height])
    .words(data)
    .padding(padding)
    .font("Impact")
    .fontSize((d) => d.size)
    .random(() => 0.5)
    .spiral("archimedean")
    .rotate(() => 0)
    .canvas(() => new OffscreenCanvas(width, height))
    .on("end", (words) => {
      self.postMessage({ type: "end", data: words });
    });

  wordcloud.start();
};
