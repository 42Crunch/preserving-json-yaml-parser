/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Visitor } from "../types";
import { ExtendedNode } from "@xliic/openapi-ast-node";

export function visitJson(
  parent: ExtendedNode | undefined,
  key: number | string,
  node: ExtendedNode,
  visitor: Visitor
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
