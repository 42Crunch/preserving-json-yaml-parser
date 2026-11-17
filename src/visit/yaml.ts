/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Alias, Document, Node, isAlias, isMap, isScalar, isSeq } from "yaml";
import { Location, Range, Visitor } from "../types";

export interface YamlVisitContext {
  document: Document;
  // set when a map has duplicate keys
  hasDuplicateKeys: boolean;
  // called once for every alias in the document which can not be resolved
  onUnresolvedAlias: (key: string | number | null, node: Alias) => void;
}

export function visitYaml(
  context: YamlVisitContext,
  key: string | number,
  keyRange: Range | undefined,
  node: Node,
  visitor: Visitor,
  aliasKey: string | number | null = null,
  isExpandingAlias: boolean = false
): any {
  if (isAlias(node)) {
    const resolved = node.resolve(context.document) as Node;
    if (resolved !== undefined) {
      visitYaml(context, key, keyRange, resolved, visitor, aliasKey, true);
    } else if (!isExpandingAlias) {
      context.onUnresolvedAlias(aliasKey, node);
    }
    return;
  }

  if (!node) {
    // pair without a value
    visitor.onValue(undefined, key, null, undefined, keyRange && { key: keyRange, value: keyRange });
    return;
  }

  const location: Location = {
    key: keyRange,
    value: { start: node.range![0], end: node.range![1] },
  };

  if (isMap(node)) {
    visitor.onObjectStart(undefined, key, node, location);
    // duplicates are checked here, yaml's own check is quadratic in the number of keys
    const seen = isExpandingAlias ? undefined : new Set<unknown>();
    for (const pair of node.items) {
      const pairKey = pair.key as Node;
      if (isAlias(pairKey) && !isExpandingAlias && pairKey.resolve(context.document) === undefined) {
        context.onUnresolvedAlias("key", pairKey);
      }
      if (seen !== undefined && isScalar(pairKey)) {
        if (seen.has(pairKey.value)) {
          context.hasDuplicateKeys = true;
        } else {
          seen.add(pairKey.value);
        }
      }
      const pairKeyRange =
        pairKey && pairKey.range ? { start: pairKey.range[0], end: pairKey.range[1] } : undefined;
      visitYaml(
        context,
        (pairKey as any)?.value,
        pairKeyRange,
        pair.value as Node,
        visitor,
        "value",
        isExpandingAlias
      );
    }
    visitor.onObjectEnd();
  } else if (isSeq(node)) {
    visitor.onArrayStart(undefined, key, node, location);
    node.items.forEach((value, index) => {
      visitYaml(context, index, undefined, value as Node, visitor, index, isExpandingAlias);
    });
    visitor.onArrayEnd();
  } else if (isScalar(node)) {
    visitor.onValue(undefined, key, node.value, node.source, location);
  }
}
