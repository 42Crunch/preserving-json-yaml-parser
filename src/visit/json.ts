/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Location, Visitor } from "../types";
import { ExtendedNode } from "@xliic/openapi-ast-node";

export function visitJson(
  parent: ExtendedNode,
  key: number | string,
  node: ExtendedNode,
  visitor: Visitor
): any {
  if (node.type === "object") {
    visitor.onObjectStart(parent, key, node);
    for (const property of node.children!) {
      const [key, value] = property.children!;
      visitJson(property, key.value, value, visitor);
    }
    visitor.onObjectEnd();
  } else if (node.type === "array") {
    visitor.onArrayStart(parent, key, node);
    node.children!.forEach((value, index) => {
      visitJson(node, index, value, visitor);
    });
    visitor.onArrayEnd();
  } else {
    const location: Location = { value: { start: node.offset, end: node.offset + node.length } };
    if (parent.type === "property") {
      const key = parent.children![0];
      location.key = { start: key.offset, end: key.offset + key.length };
    }
    visitor.onValue(parent, key, node.value, node.rawValue!, location);
  }
}
