/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { visitObject } from "./visit/object";

export function stringify(value: any, indent: number = 0): string {
  return indent === 0 ? stringify_plain(value) : stringify_format(value, indent);
}

function stringify_plain(value: any): string {
  // safeguard for falsy values
  if (!value) {
    return JSON.stringify(value);
  }

  const result: string[] = [];

  visitObject(undefined, "fakeroot", value, {
    onObjectStart: (parent: any, key: string | number, value: any) => {
      result.push(keyed(key, "{"));
    },
    onObjectEnd: () => {
      if (result[result.length - 1].endsWith(",")) {
        trimLastElement(result, 1);
      }
      result.push("},");
    },
    onArrayStart: (parent: any, key: string | number, value: any) => {
      result.push(keyed(key, "["));
    },
    onArrayEnd: () => {
      if (result[result.length - 1].endsWith(",")) {
        trimLastElement(result, 1);
      }
      result.push("],");
    },
    onValue: (parent: any, key: string | number, value: any, preserved: string | undefined) => {
      if (preserved !== undefined) {
        result.push(keyed(key, preserved) + ",");
      } else {
        result.push(keyed(key, JSON.stringify(value)) + ",");
      }
    },
  });

  // trim "fakeroot": and trailing comma
  result[0] = result[0].slice('"fakeroot":'.length);
  trimLastElement(result, 1);
  return result.join("");
}

function stringify_format(value: any, indent: number): string {
  // safeguard for falsy values
  if (!value) {
    return JSON.stringify(value);
  }

  const result: string[] = [];
  let level: number = 0;
  const isEmpty: boolean[] = [true];

  visitObject(undefined, "fakeroot", value, {
    onObjectStart: (parent: any, key: string | number, value: any) => {
      result.push(padding(indent, level) + keyed(key, "{\n", false));
      // new object in the parent container, therefore it's not empty
      isEmpty[isEmpty.length - 1] = false;
      // this object is empty so far
      isEmpty.push(true);
      level++;
    },
    onObjectEnd: () => {
      level--;
      if (isEmpty.pop()) {
        // remove EOL to put closing brace on the same line, there is no comma to remove
        trimLastElement(result, 1);
        result.push("},\n");
      } else {
        // remove comma and EOL
        trimLastElement(result, 2);
        result.push("\n" + padding(indent, level) + "},\n");
      }
    },
    onArrayStart: (parent: any, key: string | number, value: any) => {
      result.push(padding(indent, level) + keyed(key, "[\n", false));
      // new array in the parent container, therefore it's not empty
      isEmpty[isEmpty.length - 1] = false;
      // this array is empty so far
      isEmpty.push(true);
      level++;
    },
    onArrayEnd: () => {
      level--;
      if (isEmpty.pop()) {
        // remove EOL to put closing brace on the same line, there is no comma to remove
        trimLastElement(result, 1);
        result.push("],\n");
      } else {
        // remove comma and EOL
        trimLastElement(result, 2);
        result.push("\n" + padding(indent, level) + "],\n");
      }
    },
    onValue: (parent: any, key: string | number, value: any, preserved: string | undefined) => {
      // mark current container as non-empty
      isEmpty[isEmpty.length - 1] = false;
      if (preserved !== undefined) {
        result.push(padding(indent, level) + keyed(key, preserved, false) + ",\n");
      } else {
        result.push(padding(indent, level) + keyed(key, JSON.stringify(value), false) + ",\n");
      }
    },
  });

  // trim "fakeroot": and trailing comma and EOL
  result[0] = result[0].slice('"fakeroot": '.length);
  trimLastElement(result, 2);
  return result.join("");
}

function trimLastElement(array: string[], chars: number): void {
  const lastIndex = array.length - 1;
  array[lastIndex] = array[lastIndex].slice(0, -chars);
}

function keyed(key: string | number, value: string, tight: boolean = true) {
  const separator = tight ? ":" : ": ";
  return typeof key === "string" ? JSON.stringify(key) + separator + value : value;
}

function padding(indent: number, level: number): string {
  return " ".repeat(indent * level);
}
