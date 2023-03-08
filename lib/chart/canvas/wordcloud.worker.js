/* eslint-disable no-undef */
importScripts(
  'https://cdn.bootcdn.net/ajax/libs/d3-cloud/1.2.5/d3.layout.cloud.min.js',
);
globalThis.onmessage = function handler(e) {
  const { data, width, height, padding, fontFamily, type } = e.data;

  globalThis.postMessage({ type: 'start' });

  const layout = d3.layout
    .cloud()
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
