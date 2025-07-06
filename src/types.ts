/*
 Copyright (c) 42Crunch Ltd. All rights reserved.
 Licensed under the GNU Affero General Public License version 3. See LICENSE.txt in the project root for license information.
*/

export interface Visitor {
  onObjectStart: (
    parent: any,
    key: string | number,
    value: any,
    location: Location | undefined
  ) => void;
  onObjectEnd: () => void;
  onArrayStart: (
    parent: any,
    key: string | number,
    value: any,
    location: Location | undefined
  ) => void;
  onArrayEnd: () => void;
  onValue: (
    parent: any,
    key: string | number,
    value: any,
    text: string | undefined,
    location: Location | undefined
  ) => void;
}

export interface Location {
  key?: Range;
  value: Range;
}

export interface Range {
  start: number;
  end: number;
}

export type Segment = string | number;
export type Path = Segment[];

export const preserveRootRangeKey: unique symbol = Symbol("preserve-root-location");
export const preserveFormattingKey: unique symbol = Symbol("preserve-formatting");
export const preserveLocationKey: unique symbol = Symbol("preserve-location");

export interface Parsed {
  [preserveRootRangeKey]: Range;
}

export interface Container {
  [key: string | number]: any;

  [preserveLocationKey]?: {
    [key: string | number]: Location;
  };
  [preserveFormattingKey]?: {
    [key: string | number]: string;
  };
}
