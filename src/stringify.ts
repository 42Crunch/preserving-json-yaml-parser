/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { visitObject } from "./visit/object";

export type StringifyFormatter = (value: unknown, preserved: string) => string;

export function stringify(value: any, indent: number = 0, formatter?: StringifyFormatter): string {
  return indent === 0
    ? stringify_plain(value, formatter)
    : stringify_format(value, indent, formatter);
}

function stringify_plain(value: any, formatter?: StringifyFormatter): string {
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
      result.push(keyed(key, formatValue(value, preserved, formatter)) + ",");
    },
  });

  // trim "fakeroot": and trailing comma
  result[0] = result[0].slice('"fakeroot":'.length);
  trimLastElement(result, 1);
  return result.join("");
}

function stringify_format(value: any, indent: number, formatter?: StringifyFormatter): string {
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
      result.push(
        padding(indent, level) + keyed(key, formatValue(value, preserved, formatter), false) + ",\n"
      );
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

// numbers are preserved only when JSON.stringify() would change them, but the formatter
// is given every number
function formatValue(
  value: any,
  preserved: string | undefined,
  formatter: StringifyFormatter | undefined
): string {
  if (formatter && (preserved !== undefined || typeof value === "number")) {
    return formatter(value, preserved ?? JSON.stringify(value));
  }
  return preserved ?? JSON.stringify(value);
}

const paddings: string[] = [];

function padding(indent: number, level: number): string {
  const length = indent * level;
  return paddings[length] ?? (paddings[length] = " ".repeat(length));
}
