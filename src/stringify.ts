/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { visitObject } from "./visit/object";
import { safeDump } from "yaml-language-server-parser";
import { getPreservedValue } from "./preserve";

export function stringify(value: any, indent: number = 0): string {
  return indent === 0 ? stringify_plain(value) : stringify_format(value, indent);
}

export function stringifyYaml(value: any): string {
  if (!value) {
    return safeDump(value, {});
  }

  let indent: string = '';
  const handlers: { [key: string]: (parent: any, key: number | string, node: any, isInArray: boolean, isRootNode: boolean) => any } = {
    undefined: () => 'null',
    null: () => 'null',
    number: (parent: any, key: number | string) => getPreservedValue(parent, key),
    boolean: (parent: any, key: number | string, node: any) => (!!node ? 'true' : 'false'),
    string: (parent: any, key: number | string, node: any) => JSON.stringify(node),
    object: (parent: any, key: number | string, node: any, isInArray: boolean = false, isRootNode: boolean = false): string => {
      let result: string = '';
      const objectKeys: string[] = Object.keys(node);

      // check if an object is not empty
      if (!objectKeys.length) {
        result += '{}';
        return result;
      }

      if (!isRootNode) {
        indent = replaceIdent(indent);
      }

      objectKeys.forEach((itemKey: string, index: number) => {
        const objectValue = node[itemKey];

        // check if a value exists
        if (typeof objectValue === 'undefined') {
          return;
        }

        let valueHandler = handlers[typeof objectValue];

        if (Array.isArray(objectValue)) {
          valueHandler = handlers['array'];
        }

        // If there is no handler
        if (!valueHandler) {
          throw new Error(`Cannot handle the value: ${typeof objectValue}`);
        }

        if (!isInArray || index !== 0) {
          result += '\n' + indent;
        }

        result += itemKey + (typeof objectValue === "object" ? ':' : ': ') + valueHandler(node, itemKey, objectValue, false, false);
      });

      indent = clearIdent(indent);
      return result;
    },
    array: (parent: any, key: number | string, node: any, isInArray: boolean = false, isRootNode: boolean = false) => {
      let result = '';

      if (!node.length) {
        result += '[]';
        return result;
      }

      indent = replaceIdent(indent);

      node.forEach((item: any, index: number) => {
        const valueHandler = handlers[typeof item];

        if (!valueHandler) {
          throw new Error(`Cannot handle the value: ${typeof item}`);
        }

        result += '\n' + indent + '- ' + valueHandler(node, index, item, true, false);
      });

      indent = clearIdent(indent);
      return result;
    }
  };

  const result = handlers[typeof(value)](undefined, "", value, false, true) + '\n';
  return result.split('\n').slice(1).join('\n');
}

function stringify_plain(value: any): string {
  // safeguard for falsy values
  if (!value) {
    return JSON.stringify(value);
  }

  let result: string = "";

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
  return result.slice('"fakeroot":'.length, -1);
}

function stringify_format(value: any, indent: number): string {
  // safeguard for falsy values
  if (!value) {
    return JSON.stringify(value);
  }

  let result: string = "";
  let level: number = 0;
  const isEmpty: boolean[] = [true];

  visitObject(undefined, "fakeroot", value, {
    onObjectStart: (parent: any, key: string | number, value: any) => {
      result += padding(indent, level) + keyed(key, "{\n", false);
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
        result = result.slice(0, -1);
        result += "},\n";
      } else {
        // remove comma and EOL
        result = result.slice(0, -2);
        result += "\n" + padding(indent, level) + "},\n";
      }
    },
    onArrayStart: (parent: any, key: string | number, value: any) => {
      result += padding(indent, level) + keyed(key, "[\n", false);
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
        result = result.slice(0, -1);
        result += "],\n";
      } else {
        // remove comma and EOL
        result = result.slice(0, -2);
        result += "\n" + padding(indent, level) + "],\n";
      }
    },
    onValue: (parent: any, key: string | number, value: any, preserved: string | undefined) => {
      // mark current container as non-empty
      isEmpty[isEmpty.length - 1] = false;
      if (preserved !== undefined) {
        result += padding(indent, level) + keyed(key, preserved, false) + ",\n";
      } else {
        result += padding(indent, level) + keyed(key, JSON.stringify(value), false) + ",\n";
      }
    },
  });

  // trim "fakeroot": and trailing comma and EOL
  return result.slice('"fakeroot": '.length, -2);
}

function keyed(key: string | number, value: string, tight: boolean = true) {
  const separator = tight ? ":" : ": ";
  return typeof key === "string" ? JSON.stringify(key) + separator + value : value;
}

function padding(indent: number, level: number): string {
  return " ".repeat(indent * level);
}

function addIdent(): string {
  return padding(2, 1)
}

function clearIdent(indent: string): string {
  const regexp = new RegExp(addIdent());
  return indent.replace(regexp, '');
}

function replaceIdent(indent: string): string {
  return indent.replace(/$/, addIdent());
}
