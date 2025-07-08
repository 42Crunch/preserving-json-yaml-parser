/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import {
  Document,
  Node,
  Pair,
  Scalar,
  YAMLMap,
  isAlias,
  isMap,
  isPair,
  isScalar,
  isSeq,
} from "yaml";
import { Location, Range, Visitor } from "../types";

export function visitYaml(
  document: Document,
  parent: any,
  key: string | number,
  node: Node,
  visitor: Visitor
): any {
  const location = getLocation(parent, key, node);

  if (isMap(node)) {
    visitor.onObjectStart(parent, key, node, location);
    for (const pair of node.items) {
      visitYaml(document, node, (pair.key as Scalar<string>).value, pair.value as Node, visitor);
    }
    visitor.onObjectEnd();
  } else if (isSeq(node)) {
    visitor.onArrayStart(parent, key, node, location);
    node.items.forEach((value, index) => {
      visitYaml(document, node, index, value as Node, visitor);
    });
    visitor.onArrayEnd();
  } else if (isScalar(node)) {
    visitor.onValue(parent, key, node.value, node.source, location);
  } else if (isAlias(node)) {
    const resolved = node.resolve(document) as Node;
    if (resolved !== undefined) {
      visitYaml(document, parent, key, resolved, visitor);
    }
  }
}

function getLocation(parent: Node, key: string | number, node: Node): Location {
  return { key: getKeyRange(parent, key), value: { start: node.range![0], end: node.range![1] } };
}

function getKeyRange(parent: Node, key: string | number): Range | undefined {
  if (isMap(parent)) {
    const pair = findPair<Node, Node>(parent.items as any, key);
    if (pair !== undefined && pair.key.range) {
      return { start: pair.key.range[0], end: pair.key.range[1] };
    }
  }
}

function findPair<K = unknown, V = unknown>(
  items: Iterable<Pair<K, V>>,
  key: unknown
): Pair<K, V> | undefined {
  const k = isScalar(key) ? key.value : key;
  for (const it of items) {
    if (isPair(it)) {
      if (it.key === key || it.key === k) return it;
      if (isScalar(it.key) && it.key.value === k) return it;
    }
  }
  return undefined;
}
