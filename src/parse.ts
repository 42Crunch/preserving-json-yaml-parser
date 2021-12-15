/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Location, Parsed, Visitor } from "./types";
import { visitYaml } from "./visit/yaml";
import { visitJson } from "./visit/json";
import {
  getPreservedLocation,
  setPreservedLocation,
  setPreservedRootRange,
  setPreservedValue,
} from "./preserve";

import { ExtendedError, ExtendedErrorCode, parseTree } from "./json-parser";

import * as json from "jsonc-parser";

import * as yaml from "yaml-language-server-parser";
import { Schema } from "yaml-language-server-parser/dist/src/schema";
import { Type } from "yaml-language-server-parser/dist/src/type";
import * as DEFAULT_SAFE_SCHEMA from "yaml-language-server-parser/dist/src/schema/default_safe";

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
    const parsed = runvisitor(visitJson, node);
    return [parsed, normalizedErrors];
  }

  return [undefined, normalizedErrors];
}

export function parseYaml(
  text: string,
  customTags?: { [tag: string]: "scalar" | "sequence" | "mapping" }
): [Parsed | undefined, { message: string; offset: number }[]] {
  const documents: any = [];
  yaml.loadAll(
    text,
    (document) => {
      documents.push(document);
    },
    { schema: createSchema(customTags) }
  );

  if (documents.length !== 1) {
    return [undefined, []];
  }

  const normalizedErrors = documents[0].errors.map((error: any) => ({
    message: error.message,
    offset: error.mark ? error.mark.position : 0,
  }));

  if (documents[0]) {
    const parsed = runvisitor(visitYaml, documents[0]);
    return [parsed, normalizedErrors];
  }

  return [undefined, normalizedErrors];
}

function createSchema(
  customTags: { [tag: string]: "scalar" | "sequence" | "mapping" } | undefined
): Schema {
  if (!customTags) {
    return DEFAULT_SAFE_SCHEMA;
  }

  const types = Object.entries(customTags).map(([key, value]) => new Type(key, { kind: value }));

  return Schema.create(DEFAULT_SAFE_SCHEMA, types);
}

function runvisitor(visit: Function, root: any): Parsed | undefined {
  let container: any = {};
  const stack: any[] = [container];

  visit(null, "fakeroot", root, {
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
