let _nextId = 1;

export function nextId(): number {
  return _nextId++;
}

export function resetIdCounter(start: number = 1): void {
  _nextId = start;
}
