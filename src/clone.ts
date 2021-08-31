/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { visitObject } from "./visit/object";
import { copyPreservedValues } from "./preserve";

export function simpleClone<T>(orig: T): T {
  let container: any = {};
  const stack: any[] = [container];

  visitObject(undefined, "fakeroot", orig, {
    onObjectStart: (parent: any, key: string | number, value: any) => {
      stack.push(container);
      container = container[key] = {};
      copyPreservedValues(value, container);
    },
    onObjectEnd: () => {
      container = stack.pop();
    },
    onArrayStart: (parent: any, key: string | number, value: any) => {
      stack.push(container);
      container = container[key] = [];
      copyPreservedValues(value, container);
    },
    onArrayEnd: () => {
      container = stack.pop();
    },
    onValue: (parent: any, key: string | number, value: any, preserved: string | undefined) => {
      container[key] = value;
    },
  });

  return stack[0].fakeroot;
}
