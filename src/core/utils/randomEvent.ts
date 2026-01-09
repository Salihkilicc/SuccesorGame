export function getRandomEvent<T>(events: T[]): T | undefined {
  if (!events.length) {
    return undefined;
  }
  const index = Math.floor(Math.random() * events.length);
  return events[index];
}
