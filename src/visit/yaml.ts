/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import {
  YAMLMapping,
  YAMLNode,
  YAMLScalar,
  YAMLSequence,
  Kind,
  determineScalarType,
  ScalarType,
  parseYamlInteger,
  parseYamlFloat,
  parseYamlBoolean,
  YAMLAnchorReference,
} from "yaml-language-server-parser";
import { Location, Visitor } from "../types";

export function visitYaml(
  parent: YAMLNode,
  key: number | string,
  node: YAMLNode,
  visitor: Visitor
): any {
  const location = getLocation(parent, node);

  // the case for YAML which looks like this ```foo:``` and is similar to ```foo: null```
  // TODO maybe look into checking value before calling visitYaml() in previous
  // iteration and injecting a YAMLNode with proper offsets
  if (node === undefined || node === null) {
    visitor.onValue(parent, key, node, undefined, location);
    return;
  }

  if (node.kind === Kind.MAP) {
    visitor.onObjectStart(parent, key, node, location);
    for (const mapping of (<YAMLMapping>node).mappings) {
      visitYaml(mapping, mapping.key.value, mapping.value, visitor);
    }
    visitor.onObjectEnd();
  } else if (node.kind === Kind.SEQ) {
    visitor.onArrayStart(parent, key, node, location);
    (<YAMLSequence>node).items.forEach((value, index) => {
      visitYaml(node, index, value, visitor);
    });
    visitor.onArrayEnd();
  } else if (node.kind === Kind.ANCHOR_REF) {
    // TODO figure out what to do with location data,
    // perhaps location data should not be saved in this case
    visitYaml(parent, key, (<YAMLAnchorReference>node).value, visitor);
  } else if (node.kind === Kind.MAPPING) {
    // this should not happen normally, but node.kind === Kind.MAPPING can be passed
    // as root, so we just walk it's contents
    visitYaml(parent, key, (<YAMLMapping>node).value, visitor);
  } else if (node.kind === Kind.SCALAR) {
    const [type, value] = parseYamlScalar(<YAMLScalar>node);
    const text = reserializeYamlValue(type, node.value, value);
    visitor.onValue(parent, key, value, text, location);
  }
}

// TODO honor YAML JSON mode
function parseYamlScalar(node: YAMLScalar): [ScalarType, any] {
  const type = determineScalarType(node);
  if (type === ScalarType.int) {
    return [type, parseYamlInteger(node.value)];
  } else if (type === ScalarType.float) {
    return [type, parseYamlFloat(node.value)];
  } else if (type === ScalarType.bool) {
    return [type, parseYamlBoolean(node.value)];
  } else if (type == ScalarType.null) {
    return [type, null];
  } else {
    return [type, node.value];
  }
}

function getLocation(parent: YAMLNode, node: YAMLNode): Location {
  // key location is known for childen of MAPPING nodes
  const key =
    parent && parent.kind === Kind.MAPPING
      ? { start: parent.key.startPosition, end: parent.key.endPosition }
      : undefined;

  if (node) {
    // normal case, non-null node
    return { key, value: { start: node.startPosition, end: node.endPosition } };
  } else if (parent && parent.kind === Kind.MAPPING) {
    // for null nodes with known parent of type MAPPING
    // value location is a zero-width space after the end of the key
    return { key, value: { start: parent.key.endPosition, end: parent.key.endPosition } };
  } else {
    return { key, value: { start: 0, end: 0 } };
  }
}

function reserializeYamlValue(type: ScalarType, text: string, value: number): string {
  if (type === ScalarType.int) {
    return reserializeYamlInt(text);
  }
  if (type === ScalarType.float) {
    return reserializeYamlFloat(value);
  }
  return text;
}

function reserializeYamlInt(value: string) {
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }

  let sign = BigInt(1);
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = BigInt(-1);
    value = value.slice(1);
  }

  const bigInt = sign * BigInt(value);

  return bigInt.toString();
}

function reserializeYamlFloat(value: number) {
  const serialized = JSON.stringify(value);
  if (
    serialized.includes("null") ||
    serialized.includes("e") ||
    serialized.includes("E") ||
    serialized.includes(".")
  ) {
    return serialized;
  }
  return serialized + ".0";
}
