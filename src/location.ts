import { Range, Path, Location, Parsed } from "./types";
import { getPreservedLocation, getPreservedRootRange } from "./preserve";
import { parseJsonPointer } from "./jsonpointer";

function inRange(range: Range, offset: number): boolean {
  return offset >= range.start && offset <= range.end;
}

export function findNodeAtOffset(root: Parsed, offset: number): [any, Path, Location] {
  const rootLocation: Location = { value: getPreservedRootRange(root)! };
  return findNodeAtOffsetImpl(root, offset, [], rootLocation);
}

function findNodeAtOffsetImpl(
  root: any,
  offset: number,
  path: Path,
  location: Location
): [any, Path, Location] {
  const keys = Array.isArray(root) ? root.keys() : Object.keys(root);
  for (const key of keys) {
    const location = getPreservedLocation(root, key);
    if (location && inRange(location.value, offset)) {
      const value = root[key];
      path.push(key);
      if (value !== null && typeof value === "object") {
        return findNodeAtOffsetImpl(value, offset, path, location);
      } else {
        return [value, path, location];
      }
    }
  }

  return [root, path, location]; // root is a container if offset is not found
}

export function findLocationForPath(root: Parsed, path: Path): Location | undefined {
  let current = root;
  let i = 0;
  while (i < path.length - 1 && current) {
    current = current[path[i]];
    i++;
  }

  if (current) {
    return getPreservedLocation(current, path[i]);
  }
}

export function findLocationForJsonPointer(
  root: Parsed,
  jsonPointer: string
): Location | undefined {
  return findLocationForPath(root, parseJsonPointer(jsonPointer));
}
