/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Location } from "./types";

const preserveFormattingKey = Symbol("preserve-formatting");
const preserveLocationKey = Symbol("preserve-location");

export function getPreservedValue(container: any, key: string | number): string | undefined {
  if (container && container[preserveFormattingKey]) {
    return container[preserveFormattingKey][key];
  }
}

export function setPreservedValue(container: any, key: string | number, value: string): void {
  if (container[preserveFormattingKey] === undefined) {
    Object.defineProperty(container, preserveFormattingKey, { enumerable: false, value: {} });
  }
  container[preserveFormattingKey][key] = value;
}

export function getPreservedLocation(container: any, key: string | number): Location | undefined {
  if (container && container[preserveLocationKey]) {
    return container[preserveLocationKey][key];
  }
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
