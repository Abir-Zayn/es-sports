// Event and match ids are made on the device and sent with the write, so a retried save cannot count twice.
export const localEventId = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.floor(Math.random() * 16);
  return (c === 'x' ? r : (r & 3) | 8).toString(16);
});
