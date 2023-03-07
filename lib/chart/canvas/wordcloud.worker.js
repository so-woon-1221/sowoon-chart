import cloud from 'd3-cloud';

// code that run in worker to make wordcloud
// eslint-disable-next-line no-restricted-globals
self.onmessage = function handler(e) {
  console.log('worker: onmessage');
  const { data, width, height, padding, fontFamily, type } = e.data;

  const layout = cloud()
    .size([width, height])
    .words(data)
    .padding(padding)
    .font(fontFamily)
    .fontSize(d => d.size)
    .spiral(type)
    .rotate(() => 0)
    .canvas(() => new OffscreenCanvas(width, height))
    .on('end', words => {
      // eslint-disable-next-line no-restricted-globals
      self.postMessage(words);
    });

  layout.start();
};
