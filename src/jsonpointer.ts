/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Parsed, Path, Segment } from "./types";

const SLASHES = /\//g;
const TILDES = /~/g;

function encodeJsonPointerSegment(segment: Segment) {
  if (typeof segment === "number") {
    return String(segment);
  }
  return segment.replace(TILDES, "~0").replace(SLASHES, "~1");
}

export function joinJsonPointer(path: Path): string {
  if (path.length == 0) {
    return "";
  }

  return "/" + path.map((segment) => encodeJsonPointerSegment(segment)).join("/");
}

export function parseJsonPointer(pointer: string): Path {
  const hasExcape = /~/;
  const escapeMatcher = /~[01]/g;
  function escapeReplacer(m: string) {
    switch (m) {
      case "~1":
        return "/";
      case "~0":
        return "~";
    }
    throw new Error("Invalid tilde escape: " + m);
  }

  function untilde(str: string) {
    if (!hasExcape.test(str)) {
      return str;
    }
    return str.replace(escapeMatcher, escapeReplacer);
  }

  return pointer.split("/").slice(1).map(untilde).map(decodeURIComponent);
}

export function findByPath(root: Parsed, path: Path): any | undefined {
  let current: any = root;
  for (const name of path) {
    if (typeof current === "object" && current !== null) {
      if (Array.isArray(current)) {
        const index = typeof name === "string" ? parseInt(name, 10) : name;
        if (isNaN(index)) {
          return undefined;
        }
        current = current[index];
      } else if (current.hasOwnProperty(name)) {
        current = current[name];
      } else {
        return undefined;
      }
    } else {
      return undefined;
    }
  }

  return current;
}

export function find(root: Parsed, jsonPointer: string): any | undefined {
  return findByPath(root, parseJsonPointer(jsonPointer));
}
