/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Path, Segment } from "./types";

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

export function findByPath(root: any, path: Path): any | undefined {
  let current = root;
  for (const name of path) {
    current = current[name];
    if (current === undefined) {
      return undefined;
    }
  }

  return current;
}

export function find(root: any, jsonPointer: string): any | undefined {
  return findByPath(root, parseJsonPointer(jsonPointer));
}
