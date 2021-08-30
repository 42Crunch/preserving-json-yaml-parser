import { JSONVisitor } from "./types";
import { ExtendedNode as ExtendedJsonNode } from "@xliic/openapi-ast-node";

export function visitJson(
  parent: ExtendedJsonNode | undefined,
  key: number | string,
  node: ExtendedJsonNode,
  visitor: JSONVisitor
): any {
  if (node.type === "object") {
    visitor.onObjectStart(parent, key, node);
    for (const property of node.children!) {
      const [key, value] = property.children!;
      visitJson(node, key.value, value, visitor);
    }
    visitor.onObjectEnd();
  } else if (node.type === "array") {
    visitor.onArrayStart(parent, key, node);
    node.children!.forEach((value, index) => {
      visitJson(node, index, value, visitor);
    });
    visitor.onArrayEnd();
  } else {
    visitor.onValue(parent, key, node.value, node.rawValue!);
  }
}
