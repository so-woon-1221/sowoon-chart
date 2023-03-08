const cloud = require('d3-cloud');

globalThis.onmessage = function handler(e) {
  const { data, width, height, padding, fontFamily, type } = e.data;
  globalThis.postMessage({ type: 'start' });

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
      globalThis.postMessage({ type: 'end', data: words });
    });

  layout.start();
};
