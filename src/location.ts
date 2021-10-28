import { Range } from "./types";
import { getPreservedLocation } from "./preserve";

function inRange(range: Range, offset: number): boolean {
  return offset >= range.start && offset < range.end;
}

export function findNodeAtOffset(root: any, offset: number): any {
  const iterable = Array.isArray(root) ? root.keys() : Object.keys(root);
  for (const key of iterable) {
    const location = getPreservedLocation(root, key);
    if (location && inRange(location.value, offset)) {
      return findNodeAtOffset(root[key], offset);
    }
  }

  return root; // root is a container if offset is not found
}
