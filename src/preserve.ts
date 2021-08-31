/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

const preserveKey = Symbol("preserve-formatting");

export function getPreservedValue(container: any, key: string | number): string | undefined {
  if (container && container[preserveKey]) {
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
  if (src && src[preserveKey] !== undefined) {
    Object.defineProperty(dest, preserveKey, { enumerable: false, value: src[preserveKey] });
  }
}
