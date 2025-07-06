/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Location, Parsed } from "./types";
import { visitYaml } from "./visit/yaml";
import { visitJson } from "./visit/json";
import {
  getPreservedLocation,
  setPreservedLocation,
  setPreservedRootRange,
  setPreservedValue,
} from "./preserve";

import { ExtendedError, ExtendedErrorCode, parseTree, ExtendedNode } from "./json-parser";

import * as json from "jsonc-parser";
import * as yaml from "yaml";

function extendedErrorToMessage(error: ExtendedError) {
  if (error.extendedError) {
    if (error.extendedError === ExtendedErrorCode.DuplicateKey) {
      return "DuplicateKey";
    }
    return "<unknown ExtendedErrorCode>";
  }
  return json.printParseErrorCode(error.error);
}

export function parseJson(
  text: string
): [Parsed | undefined, { message: string; offset: number; length: number }[]] {
  const parseErrors: json.ParseError[] = [];

  const node = parseTree(text, parseErrors, {
    disallowComments: true,
    allowTrailingComma: false,
    allowEmptyContent: false,
  });

  const normalizedErrors = parseErrors.map((error) => ({
    message: extendedErrorToMessage(error),
    offset: error.offset,
    length: error.length,
  }));

  if (node) {
    const parsed = runvisitor(visitJson, undefined, node);
    return [parsed, normalizedErrors];
  }

  return [undefined, normalizedErrors];
}

export function parseYaml(
  text: string
): [Parsed | undefined, { message: string; offset: number }[]] {
  const documents = yaml.parseAllDocuments(text);

  if (documents.length !== 1) {
    return [undefined, []];
  }

  const document = documents[0];

  const normalizedErrors = document.errors.map((error) => ({
    message: error.message,
    offset: error.pos[0],
    length: error.pos[1] - error.pos[0],
  }));

  yaml.visit(document, {
    Alias(key, node) {
      if (!node.resolve(document)) {
        normalizedErrors.push({
          message: `Alias "${key}" could not be resolved`,
          offset: node.range![0],
          length: node.range![1] - node.range![0],
        });
      }
    },
  });

  const parsed = runvisitor(visitYaml, document, document.contents as yaml.Node);

  return [parsed, normalizedErrors];
}

function runvisitor(
  visit: Function,
  document: yaml.Document | undefined,
  root: ExtendedNode | yaml.Node
): Parsed | undefined {
  let container: any = {};
  const stack: any[] = [container];

  visit(document, null, "fakeroot", root, {
    onObjectStart: (
      parent: any,
      key: string | number,
      value: any,
      location: Location | undefined
    ) => {
      if (location) {
        setPreservedLocation(container, key, location);
      }
      stack.push(container);
      container = container[key] = {};
    },
    onObjectEnd: () => {
      container = stack.pop();
    },
    onArrayStart: (
      parent: any,
      key: string | number,
      value: any,
      location: Location | undefined
    ) => {
      if (location) {
        setPreservedLocation(container, key, location);
      }
      stack.push(container);
      container = container[key] = [];
    },
    onArrayEnd: () => {
      container = stack.pop();
    },
    onValue: (
      parent: any,
      key: string | number,
      value: any,
      raw: string | undefined,
      location: Location | undefined
    ) => {
      container[key] = value;
      if (typeof value === "number" && raw !== undefined) {
        setPreservedValue(container, key, raw);
      }
      if (location) {
        setPreservedLocation(container, key, location);
      }
    },
  });

  if (typeof stack[0].fakeroot !== "object") {
    return undefined;
  }

  const range = getPreservedLocation(stack[0], "fakeroot")?.value;
  setPreservedRootRange(stack[0].fakeroot, range!);
  return stack[0].fakeroot;
}
