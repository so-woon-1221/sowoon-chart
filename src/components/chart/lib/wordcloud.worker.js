import cloud from 'd3-cloud';

let currentLayout = null;

const postError = (requestId, error) => {
  self.postMessage({
    type: 'error',
    requestId,
    message: error instanceof Error ? error.message : String(error),
  });
};

self.onmessage = (e) => {
  const { type = 'layout', requestId } = e.data ?? {};

  if (type === 'cancel') {
    currentLayout?.stop();
    currentLayout = null;
    return;
  }

  if (type !== 'layout') {
    postError(requestId, new Error(`Unknown wordcloud worker message: ${type}`));
    return;
  }

  const { data, width, height, padding } = e.data;

  currentLayout?.stop();
  currentLayout = null;

  self.postMessage({ type: 'start', requestId });

  try {
    currentLayout = cloud()
      .size([width, height])
      .words(data)
      .padding(padding)
      .font('Impact')
      .fontSize((d) => d.size)
      .random(() => 0.5)
      .spiral('archimedean')
      .rotate(() => 0)
      .canvas(() => {
        if (typeof OffscreenCanvas !== 'function') {
          throw new Error('OffscreenCanvas is not available.');
        }

        return new OffscreenCanvas(width, height);
      })
      .on('end', (words) => {
        self.postMessage({ type: 'end', requestId, data: words });
        currentLayout = null;
      });

    currentLayout.start();
  } catch (error) {
    currentLayout = null;
    postError(requestId, error);
  }
};
