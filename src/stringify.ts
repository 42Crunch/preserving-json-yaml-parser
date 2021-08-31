/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { visitObject } from "./visit/object";

export function stringify(value: any): string {
  // safeguard for falsy values
  if (!value) {
    return JSON.stringify(value);
  }

  let result: string = "";

  function keyed(key: string | number, value: any) {
    return typeof key === "string" ? `${JSON.stringify(key)}:${value}` : value;
  }

  visitObject(undefined, "fakeroot", value, {
    onObjectStart: (parent: any, key: string | number, value: any) => {
      result += keyed(key, "{");
    },
    onObjectEnd: () => {
      if (result.endsWith(",")) {
        result = result.slice(0, -1);
      }
      result += "},";
    },
    onArrayStart: (parent: any, key: string | number, value: any) => {
      result += keyed(key, "[");
    },
    onArrayEnd: () => {
      if (result.endsWith(",")) {
        result = result.slice(0, -1);
      }
      result += "],";
    },
    onValue: (parent: any, key: string | number, value: any, preserved: string | undefined) => {
      if (preserved !== undefined) {
        result += keyed(key, preserved) + ",";
      } else {
        result += keyed(key, JSON.stringify(value)) + ",";
      }
    },
  });

  // trim "fakeroot": and trailing comma
  return result.slice(11, -1);
}
