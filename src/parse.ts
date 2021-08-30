import { Node, YamlNode, JsonNode } from "@xliic/openapi-ast-node";

import { AstVisitor } from "./types";
import { visitYaml } from "./yaml";
import { visitJson } from "./json";
import { setPreservedValue } from "./preserve";

export function parse(root: Node): any {
  let container: any = {};
  const stack: any[] = [container];

  visit(root, "fakeroot", {
    onObjectStart: (parent: any, key: string | number) => {
      stack.push(container);
      container = container[key] = {};
    },
    onObjectEnd: () => {
      container = stack.pop();
    },
    onArrayStart: (parent: any, key: string | number) => {
      stack.push(container);
      container = container[key] = [];
    },
    onArrayEnd: () => {
      container = stack.pop();
    },
    onValue: (parent: any, key: string | number, value: any, raw: string) => {
      container[key] = value;
      if (typeof value === "number") {
        setPreservedValue(container, key, raw);
      }
    },
  });
  return stack[0].fakeroot;
}

export function visit(node: Node, key: string, visitor: AstVisitor): any {
  if (node instanceof JsonNode) {
    visitJson(undefined, key, node.node, visitor);
  } else if (node instanceof YamlNode) {
    visitYaml(undefined, key, node.node, visitor);
  }
}
