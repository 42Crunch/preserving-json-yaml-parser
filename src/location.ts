import { Range, Path } from "./types";
import { getPreservedLocation } from "./preserve";

function inRange(range: Range, offset: number): boolean {
  return offset >= range.start && offset < range.end;
}

export function findNodeAtOffset(root: any, offset: number): [any, Path] {
  return findNodeAtOffsetImpl(root, offset, []);
}

function findNodeAtOffsetImpl(root: any, offset: number, path: Path): [any, Path] {
  const iterable = Array.isArray(root) ? root.keys() : Object.keys(root);
  for (const key of iterable) {
    const location = getPreservedLocation(root, key);
    if (location && inRange(location.value, offset)) {
      path.push(key);
      return findNodeAtOffsetImpl(root[key], offset, path);
    }
  }

  return [root, path]; // root is a container if offset is not found
}
