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

export function getPreservedValue(container: Container, key: string | number): string | undefined {
  return container?.[preserveFormattingKey]?.[key];
}

export function setPreservedValue(container: any, key: string | number, value: string): void {
  if (container[preserveFormattingKey] === undefined) {
    Object.defineProperty(container, preserveFormattingKey, { enumerable: false, value: {} });
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
    Object.defineProperty(container, preserveLocationKey, { enumerable: false, value: {} });
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
