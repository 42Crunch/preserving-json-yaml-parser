import { getPreservedValue } from "./preserve";
import { JSONVisitor, ObjectVisitor } from "./types";
function getType(node: any): "object" | "array" | "value" {
  if (typeof node === "object") {
    if (
      node === null ||
      node instanceof Number ||
      node instanceof String ||
      node instanceof Boolean
    ) {
      return "value";
    } else if (node instanceof Array) {
      return "array";
    }
    return "object";
  }
  return "value";
}

export function visitObject(
  parent: any,
  key: number | string,
  node: any,
  visitor: ObjectVisitor
): any {
  const type = getType(node);
  if (type === "object") {
    visitor.onObjectStart(parent, key, node);
    for (const key in node) {
      visitObject(node, key, node[key], visitor);
    }
    visitor.onObjectEnd();
  } else if (type === "array") {
    visitor.onArrayStart(parent, key, node);
    node.forEach((value: any, index: number) => {
      visitObject(node, index, value, visitor);
    });
    visitor.onArrayEnd();
  } else {
    visitor.onValue(parent, key, node, getPreservedValue(parent, key));
  }
}
