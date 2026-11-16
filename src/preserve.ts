/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import {
  Location,
  Range,
  preserveRootRangeKey,
  preserveFormattingKey,
  preserveLocationKey,
  Parsed,
  Container,
} from "./types";

const jsonNumberPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

// Returns the source text of a number when it has to be preserved: when String(value) would
// change it (big integers, "1.0", "1e10", "-0") and it is a valid JSON number. Numbers which are
// not valid JSON ("007", "0x1F", "+1", ".5", ".inf") are left to be normalized from their value.
export function preservedNumberSource(value: number, source: string | undefined): string | undefined {
  if (source !== undefined && source !== String(value) && jsonNumberPattern.test(source)) {
    return source;
  }
}

// Assigns container[key], keeping "__proto__" as an own property instead of setting the prototype
export function setOwnValue(container: any, key: string | number, value: unknown): void {
  if (key === "__proto__") {
    Object.defineProperty(container, key, {
      value,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  } else {
    container[key] = value;
  }
}

export function getPreservedValue(container: Container, key: string | number): string | undefined {
  return container?.[preserveFormattingKey]?.[key];
}

export function setPreservedValue(container: any, key: string | number, value: string): void {
  if (container[preserveFormattingKey] === undefined) {
    Object.defineProperty(container, preserveFormattingKey, {
      enumerable: false,
      value: Object.create(null),
    });
  }
  container[preserveFormattingKey][key] = value;
}

export function getPreservedLocation(
  container: Container,
  key: string | number
): Location | undefined {
  return container?.[preserveLocationKey]?.[key];
}

export function setPreservedLocation(
  container: any,
  key: string | number,
  location: Location
): void {
  if (container[preserveLocationKey] === undefined) {
    Object.defineProperty(container, preserveLocationKey, {
      enumerable: false,
      value: Object.create(null),
    });
  }
  container[preserveLocationKey][key] = location;
}

export function getPreservedRootRange(container: Parsed): Range {
  return container[preserveRootRangeKey];
}

export function setPreservedRootRange(container: any, range: Range): void {
  Object.defineProperty(container, preserveRootRangeKey, { enumerable: false, value: range });
}

export function copyPreservedValues(src: any, dest: any) {
  if (src && src[preserveFormattingKey] !== undefined) {
    Object.defineProperty(dest, preserveFormattingKey, {
      enumerable: false,
      value: src[preserveFormattingKey],
    });
  }

  // Do not copy location data, cloned objects are likely to be used for
  // bundling OAS file that contain external references
  // so the resulting object will be a mix of data coming from different file
  // which makes location information
}
