/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Node, YamlNode, JsonNode } from "@xliic/openapi-ast-node";

import { Location, Visitor } from "./types";
import { visitYaml } from "./visit/yaml";
import { visitJson } from "./visit/json";
import { setPreservedLocation, setPreservedValue } from "./preserve";

export function parse(root: Node): any {
  let container: any = {};
  const stack: any[] = [container];

  visit(root, "fakeroot", {
    onObjectStart: (
      parent: any,
      key: string | number,
      value: any,
      location: Location | undefined
    ) => {
      if (location) {
        setPreservedLocation(container, key, location);
      }
      stack.push(container);
      container = container[key] = {};
    },
    onObjectEnd: () => {
      container = stack.pop();
    },
    onArrayStart: (
      parent: any,
      key: string | number,
      value: any,
      location: Location | undefined
    ) => {
      if (location) {
        setPreservedLocation(container, key, location);
      }
      stack.push(container);
      container = container[key] = [];
    },
    onArrayEnd: () => {
      container = stack.pop();
    },
    onValue: (
      parent: any,
      key: string | number,
      value: any,
      raw: string | undefined,
      location: Location | undefined
    ) => {
      container[key] = value;
      if (typeof value === "number" && raw !== undefined) {
        setPreservedValue(container, key, raw);
      }
      if (location) {
        setPreservedLocation(container, key, location);
      }
    },
  });
  return stack[0].fakeroot;
}

export function visit(node: Node, key: string, visitor: Visitor): any {
  if (node instanceof JsonNode) {
    visitJson(node.node, key, node.node, visitor);
  } else if (node instanceof YamlNode) {
    visitYaml(node.node, key, node.node, visitor);
  }
}
