/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Location, Visitor } from "../types";
import { ExtendedNode } from "../json-parser";

export function visitJson(
  document: undefined,
  parent: ExtendedNode,
  key: number | string,
  node: ExtendedNode,
  visitor: Visitor
): any {
  if (node === undefined) {
    visitor.onValue(parent, key, null, undefined, { value: { start: 0, end: 0 } });
    return;
  }
  const location: Location = { value: { start: node.offset, end: node.offset + node.length } };
  if (parent && parent.type === "property") {
    const key = parent.children![0];
    location.key = { start: key.offset, end: key.offset + key.length };
  }
  if (node.type === "object") {
    visitor.onObjectStart(parent, key, node, location);
    for (const property of node.children!) {
      const [key, value] = property.children!;
      visitJson(undefined, property, key.value, value, visitor);
    }
    visitor.onObjectEnd();
  } else if (node.type === "array") {
    visitor.onArrayStart(parent, key, node, location);
    node.children!.forEach((value, index) => {
      visitJson(undefined, node, index, value, visitor);
    });
    visitor.onArrayEnd();
  } else {
    visitor.onValue(parent, key, node.value, node.rawValue!, location);
  }
}
