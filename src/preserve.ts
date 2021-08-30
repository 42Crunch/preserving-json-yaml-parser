const preserveKey = Symbol("preserve-formatting");

export function getPreservedValue(container: any, key: string | number): string | undefined {
  if (container[preserveKey]) {
    return container[preserveKey][key];
  }
}

export function setPreservedValue(container: any, key: string | number, value: string): void {
  if (container[preserveKey] === undefined) {
    Object.defineProperty(container, preserveKey, { enumerable: false, value: {} });
  }
  container[preserveKey][key] = value;
}

export function copyPreservedValues(src: any, dest: any) {
  if (src[preserveKey] !== undefined) {
    Object.defineProperty(dest, preserveKey, { enumerable: false, value: src[preserveKey] });
  }
}
