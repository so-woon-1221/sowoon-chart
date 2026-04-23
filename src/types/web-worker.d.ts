declare module 'web-worker:*' {
  const WorkerFactory: {
    new (): Worker;
    new (options: WorkerOptions): Worker;
  };

  export default WorkerFactory;
}
