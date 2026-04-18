export function createJobReference() {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `EP-${timestamp}`;
}
