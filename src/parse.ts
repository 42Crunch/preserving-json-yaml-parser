/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { Location, Parsed, Visitor } from "./types";
import { visitYaml, YamlVisitContext } from "./visit/yaml";
import { ExtendedError, ExtendedErrorCode, visitJson } from "./visit/json";
import {
  getPreservedLocation,
  preservedNumberSource,
  setOwnValue,
  setPreservedLocation,
  setPreservedRootRange,
  setPreservedValue,
} from "./preserve";

import * as json from "jsonc-parser";
import * as yaml from "yaml";
import { getCustomTags } from "./custom-tags";

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
  const parseErrors: ExtendedError[] = [];

  const parsed = runvisitor((visitor) =>
    visitJson(text, visitor, parseErrors, {
      disallowComments: true,
      allowTrailingComma: false,
      allowEmptyContent: false,
    })
  );

  const normalizedErrors = parseErrors.map((error) => ({
    message: extendedErrorToMessage(error),
    offset: error.offset,
    length: error.length,
  }));

  return [parsed, normalizedErrors];
}

export function parseYaml(
  text: string,
  customTags?: { [tag: string]: "scalar" | "sequence" | "mapping" }
): [Parsed | undefined, { message: string; offset: number }[]] {
  const tags = getCustomTags(customTags || {});
  // yaml's check for duplicate keys is quadratic, visitYaml() does it instead
  const documents = yaml.parseAllDocuments(text, { customTags: tags, uniqueKeys: false });

  if (documents.length !== 1) {
    return [undefined, []];
  }

  const document = documents[0] as yaml.Document;

  const aliasErrors: { message: string; offset: number; length: number }[] = [];
  const context: YamlVisitContext = {
    document,
    hasDuplicateKeys: false,
    onUnresolvedAlias: (key, node) => {
      aliasErrors.push({
        message: `Alias "${key}" could not be resolved`,
        offset: node.range![0],
        length: node.range![1] - node.range![0],
      });
    },
  };

  const parsed = runvisitor((visitor) =>
    visitYaml(context, "fakeroot", undefined, document.contents as yaml.Node, visitor)
  );

  // duplicate keys are rare, parse again to get the errors exactly as yaml reports them
  const errors = context.hasDuplicateKeys
    ? (yaml.parseAllDocuments(text, { customTags: tags })[0] as yaml.Document).errors
    : document.errors;

  const normalizedErrors = errors.map((error) => ({
    message: error.message,
    offset: error.pos[0],
    length: error.pos[1] - error.pos[0],
  }));

  return [parsed, normalizedErrors.concat(aliasErrors)];
}

function runvisitor(visit: (visitor: Visitor) => void): Parsed | undefined {
  let container: any = {};
  const stack: any[] = [container];

  visit({
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
      const object = {};
      setOwnValue(container, key, object);
      container = object;
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
      const array: any[] = [];
      setOwnValue(container, key, array);
      container = array;
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
      setOwnValue(container, key, value);
      if (typeof value === "number") {
        const preserved = preservedNumberSource(value, raw);
        if (preserved !== undefined) {
          setPreservedValue(container, key, preserved);
        }
      }
      if (location) {
        setPreservedLocation(container, key, location);
      }
    },
  });

  if (typeof stack[0].fakeroot !== "object" || stack[0].fakeroot === null) {
    return undefined;
  }

  const range = getPreservedLocation(stack[0], "fakeroot")?.value;
  setPreservedRootRange(stack[0].fakeroot, range!);
  return stack[0].fakeroot;
}
