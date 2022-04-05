/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { simpleClone } from "./clone";
import { parseJson, parseYaml } from "./parse";
import { stringify } from "./stringify";
import {
  getPreservedLocation as getLocation,
  getPreservedRootRange as getRootRange,
} from "./preserve";
import { findLocationForJsonPointer, findNodeAtOffset } from "./location";
import { find, joinJsonPointer, parseJsonPointer, findByPath } from "./jsonpointer";
import { Location, Range, ParserOptions, Path, Parsed, Container } from "./types";

function parse(
  text: string,
  languageId: string,
  options: ParserOptions
): [Parsed | undefined, { message: string; offset: number; length?: number }[]] {
  return languageId === "yaml" ? parseYaml(text, options?.yaml?.customTags) : parseJson(text);
}

export {
  parse,
  parseJson,
  parseYaml,
  stringify,
  simpleClone,
  getLocation,
  getRootRange,
  findNodeAtOffset,
  find,
  findLocationForJsonPointer,
  findByPath,
  Parsed,
  Path,
  Location,
  Range,
  ParserOptions,
  Container,
  joinJsonPointer,
  parseJsonPointer,
};
