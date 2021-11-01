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
  // this is a workaround for yaml which looks like this - foo:
  // and equals to foo: null
  // TODO look into checking value before calling visitYaml() in previous
  // iteration and injecting a YAMLNode with proper offsets

  if (node === null) {
    visitor.onValue(parent, key, null, undefined, { value: { start: 0, end: 0 } });
    return;
  }

  const location: Location = { value: { start: node.startPosition, end: node.endPosition } };
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
    if (parent.kind === Kind.MAPPING) {
      location.key = { start: parent.key.startPosition, end: parent.key.endPosition };
    }
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
