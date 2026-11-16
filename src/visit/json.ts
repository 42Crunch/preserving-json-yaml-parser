/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

import { ParseError, ParseErrorCode, ParseOptions, visit } from "jsonc-parser";
import { Location, Range, Visitor } from "../types";

export enum ExtendedErrorCode {
  DuplicateKey = 1,
}

export interface ExtendedError extends ParseError {
  error: ParseErrorCode;
  extendedError?: ExtendedErrorCode;
}

interface Frame {
  isObject: boolean;
  location: Location;
  // array: index of the next item
  index: number;
  // object: the property waiting for its value
  key: string;
  keyRange: Range | undefined;
  hasPendingKey: boolean;
  // object: all keys in document order, to report duplicates when the object ends
  keys: string[];
  keyRanges: Range[];
  seen: Set<string>;
  hasDuplicates: boolean;
}

// Visits JSON text in a single pass, without building an intermediate tree
export function visitJson(
  text: string,
  visitor: Visitor,
  errors: ExtendedError[],
  options: ParseOptions
): void {
  const stack: Frame[] = [];
  let frame: Frame | undefined = undefined;
  let hasRoot = false;

  // returns the key of the next value in the current container, or undefined if there is no place for it
  function nextKey(): [string | number, Range | undefined] | undefined {
    if (frame === undefined) {
      if (hasRoot) {
        return undefined;
      }
      hasRoot = true;
      return ["fakeroot", undefined];
    }
    if (!frame.isObject) {
      return [frame.index++, undefined];
    }
    if (frame.hasPendingKey) {
      frame.hasPendingKey = false;
      return [frame.key, frame.keyRange];
    }
    return undefined;
  }

  // property without a value, i.e. {"a":}
  function completePendingKey() {
    if (frame !== undefined && frame.hasPendingKey) {
      frame.hasPendingKey = false;
      visitor.onValue(undefined, frame.key, null, undefined, { value: { start: 0, end: 0 } });
    }
  }

  function startContainer(isObject: boolean, offset: number): boolean {
    const next = nextKey();
    if (next === undefined) {
      return false;
    }
    const [key, keyRange] = next;
    const location: Location = { value: { start: offset, end: -1 } };
    if (keyRange !== undefined) {
      location.key = keyRange;
    }
    if (isObject) {
      visitor.onObjectStart(undefined, key, undefined, location);
    } else {
      visitor.onArrayStart(undefined, key, undefined, location);
    }
    if (frame !== undefined) {
      stack.push(frame);
    }
    frame = {
      isObject,
      location,
      index: 0,
      key: "",
      keyRange: undefined,
      hasPendingKey: false,
      keys: [],
      keyRanges: [],
      seen: new Set(),
      hasDuplicates: false,
    };
    return true;
  }

  function endContainer(offset: number, length: number) {
    frame!.location.value.end = offset + length;
    frame = stack.pop();
  }

  // the visitor ignores values which have no place in the document, nesting of these is tracked
  // to match the begin and end events
  let ignored = 0;

  visit(
    text,
    {
      onObjectBegin: (offset: number) => {
        if (ignored > 0 || !startContainer(true, offset)) {
          ignored++;
        }
      },
      onObjectProperty: (name: string, offset: number, length: number) => {
        if (ignored > 0) {
          return;
        }
        completePendingKey();
        const keyRange = { start: offset, end: offset + length };
        frame!.key = name;
        frame!.keyRange = keyRange;
        frame!.hasPendingKey = true;
        frame!.keys.push(name);
        frame!.keyRanges.push(keyRange);
        if (frame!.seen.has(name)) {
          frame!.hasDuplicates = true;
        } else {
          frame!.seen.add(name);
        }
      },
      onObjectEnd: (offset: number, length: number) => {
        if (ignored > 0) {
          ignored--;
          return;
        }
        completePendingKey();
        if (frame!.hasDuplicates) {
          reportDuplicateKeys(frame!.keys, frame!.keyRanges, errors);
        }
        endContainer(offset, length);
        visitor.onObjectEnd();
      },
      onArrayBegin: (offset: number) => {
        if (ignored > 0 || !startContainer(false, offset)) {
          ignored++;
        }
      },
      onArrayEnd: (offset: number, length: number) => {
        if (ignored > 0) {
          ignored--;
          return;
        }
        endContainer(offset, length);
        visitor.onArrayEnd();
      },
      onLiteralValue: (value: any, offset: number, length: number) => {
        if (ignored > 0) {
          return;
        }
        const next = nextKey();
        if (next === undefined) {
          return;
        }
        const [key, keyRange] = next;
        const location: Location = { value: { start: offset, end: offset + length } };
        if (keyRange !== undefined) {
          location.key = keyRange;
        }
        // only numbers need their source text, see preservedNumberSource()
        const raw = typeof value === "number" ? text.substring(offset, offset + length) : undefined;
        visitor.onValue(undefined, key, value, raw, location);
      },
      onError: (error: ParseErrorCode, offset: number, length: number) => {
        errors.push({ error, offset, length });
      },
    },
    options
  );
}

// Reports every key which has a twin, once for each of its twins
function reportDuplicateKeys(keys: string[], ranges: Range[], errors: ExtendedError[]) {
  const counts = new Map<string, number>();
  for (const key of keys) {
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  for (let i = 0; i < keys.length; i++) {
    const count = counts.get(keys[i])!;
    for (let j = 1; j < count; j++) {
      errors.push({
        error: 0 as any,
        extendedError: ExtendedErrorCode.DuplicateKey,
        offset: ranges[i].start,
        length: ranges[i].end - ranges[i].start,
      });
    }
  }
}
