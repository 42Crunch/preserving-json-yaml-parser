/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { visitObject } from "./visit/object";
import { copyPreservedValues } from "./preserve";
import { Path } from "./types";

export function simpleClone<T>(orig: T, replacer?: (value: unknown, location: Path) => unknown): T {
  let container: any = {};
  let location: Path = [];
  const stack: any[] = [container];

  visitObject(undefined, "fakeroot", orig, {
    onObjectStart: (parent: any, key: string | number, value: any) => {
      location.push(key);
      stack.push(container);
      container = container[key] = {};
      copyPreservedValues(value, container);
    },
    onObjectEnd: () => {
      location.pop();
      container = stack.pop();
    },
    onArrayStart: (parent: any, key: string | number, value: any) => {
      location.push(key);
      stack.push(container);
      container = container[key] = [];
      copyPreservedValues(value, container);
    },
    onArrayEnd: () => {
      location.pop();
      container = stack.pop();
    },
    onValue: (parent: any, key: string | number, value: any, preserved: string | undefined) => {
      container[key] = replacer ? replacer(value, [...location.slice(1), key]) : value;
    },
  });

  return stack[0].fakeroot;
}
