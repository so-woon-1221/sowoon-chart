import cloud from 'd3-cloud';

let currentLayout = null;

self.onmessage = (e) => {
  const { type = 'layout' } = e.data;

  if (type === 'cancel') {
    currentLayout?.stop();
    currentLayout = null;
    return;
  }

  const { data, width, height, padding, requestId } = e.data;

  currentLayout?.stop();

  self.postMessage({ type: 'start', requestId });

  currentLayout = cloud()
    .size([width, height])
    .words(data)
    .padding(padding)
    .font('Impact')
    .fontSize((d) => d.size)
    .random(() => 0.5)
    .spiral('archimedean')
    .rotate(() => 0)
    .canvas(() => new OffscreenCanvas(width, height))
    .on('end', (words) => {
      self.postMessage({ type: 'end', requestId, data: words });
      currentLayout = null;
    });

  currentLayout.start();
};
