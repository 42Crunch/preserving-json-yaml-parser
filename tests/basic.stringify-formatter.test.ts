import { describe, expect, test } from "vitest";

import { stringify, StringifyFormatter, parse } from "../src";

describe("Basic StringifyFormatter functionality", () => {
  test("simple example, formatter replaces all values", () => {
    const json = '{"a": 1, "b": 2.5, "c": 3.14}';
    const [value] = parse(json, "json", {});

    const formatter: StringifyFormatter = (key, value, preserved) => {
      return "0";
    };

    const result = stringify(value, 0, formatter);
    expect(result).toEqual('{"a":0,"b":0,"c":0}');
  });

  test("check if value is an integer, and strip trailing zeros", () => {
    const maxsafe = "9007199254740991"; // Number.MAX_SAFE_INTEGER
    const json = `{"a": "1", "b": 2.5, "c": ${maxsafe}, "d": ${maxsafe}01234, "e": ${maxsafe}01234.00}`;
    const [value] = parse(json, "json", {});

    const formatter: StringifyFormatter = (key, value, preserved) => {
      if (typeof value === "number") {
        if (/\.0+$/.test(preserved)) {
          return preserved.slice(0, preserved.indexOf("."));
        } else {
          return preserved;
        }
      } else {
        return JSON.stringify(value);
      }
    };

    const result = stringify(value, 0, formatter);
    expect(result).toEqual(
      '{"a":"1","b":2.5,"c":9007199254740991,"d":900719925474099101234,"e":900719925474099101234}'
    );
  });
});
