import { describe, expect, test } from "vitest";

import { parseJson, parseYaml, simpleClone, stringify, getLocation } from "../src";
import { preserveFormattingKey } from "../src/types";

const preserved = [
  "12345678901234567890123",
  "-1007199254740996656565643",
  "1.0",
  "2.500",
  "1.50e10",
  "1.5E+3",
  "-0",
  "1e-7",
];

describe("Numbers", () => {
  test.each(preserved)("JSON number %s is preserved", (number) => {
    const [parsed, errors] = parseJson(`{"a": ${number}, "b": [${number}]}`);
    expect(errors).toEqual([]);
    expect(stringify(parsed)).toEqual(`{"a":${number},"b":[${number}]}`);
    expect(stringify(parsed, 2)).toEqual(`{\n  "a": ${number},\n  "b": [\n    ${number}\n  ]\n}`);
    expect(stringify(simpleClone(parsed))).toEqual(`{"a":${number},"b":[${number}]}`);
  });

  test.each(preserved)("YAML number %s is preserved", (number) => {
    const [parsed, errors] = parseYaml(`a: ${number}\nb:\n  - ${number}\n`);
    expect(errors).toEqual([]);
    expect(stringify(parsed)).toEqual(`{"a":${number},"b":[${number}]}`);
  });

  test.each([
    ["0007", "7"],
    ["007", "7"],
    ["0x1F", "31"],
    ["0o17", "15"],
    ["+1", "1"],
    [".5", "0.5"],
    ["1.", "1"],
    ["-.5e1", "-5"],
    [".inf", "null"],
    ["-.inf", "null"],
    [".nan", "null"],
  ])("YAML number %s is normalized to %s", (number, expected) => {
    const [parsed] = parseYaml(`a: ${number}`);
    const text = stringify(parsed);
    expect(text).toEqual(`{"a":${expected}}`);
    expect(() => JSON.parse(text)).not.toThrow();
  });

  test("numbers which serialize as written are not preserved", () => {
    const [json] = parseJson('{"a": 42, "b": 3.14, "c": -1, "d": 1.0}');
    expect((json as any)[preserveFormattingKey]).toEqual({ d: "1.0" });

    const [yaml] = parseYaml("a: 42\nb: 3.14\nc: -1\nd: 007");
    expect((yaml as any)[preserveFormattingKey]).toBeUndefined();
  });

  test("strings which look like numbers stay strings", () => {
    const [yaml] = parseYaml("a: '0007'\nb: \"123\"\nc: '1.0'");
    expect(stringify(yaml)).toEqual('{"a":"0007","b":"123","c":"1.0"}');

    const [json] = parseJson('{"a": "0007", "b": "123"}');
    expect(stringify(json)).toEqual('{"a":"0007","b":"123"}');
  });

  test("formatter is called for every number", () => {
    const [parsed] = parseJson('{"a": 1, "b": 1.0, "c": "1", "d": true}');
    const calls: [unknown, string][] = [];
    const text = stringify(parsed, 0, (value, preserved) => {
      calls.push([value, preserved]);
      return preserved;
    });
    expect(text).toEqual('{"a":1,"b":1.0,"c":"1","d":true}');
    expect(calls).toEqual([
      [1, "1"],
      [1, "1.0"],
    ]);
  });
});

describe("Keys", () => {
  test("__proto__ is kept as a key", () => {
    for (const [parsed] of [
      parseJson('{"__proto__": {"a": 1.0}, "b": 2}'),
      parseYaml("__proto__:\n  a: 1.0\nb: 2"),
    ]) {
      expect(Object.getPrototypeOf(parsed)).toBe(Object.prototype);
      expect(Object.keys(parsed!)).toEqual(["__proto__", "b"]);
      expect(getLocation(parsed!, "__proto__")?.key).toEqual(expect.any(Object));
      expect(stringify(parsed)).toEqual('{"__proto__":{"a":1.0},"b":2}');
      expect(stringify(simpleClone(parsed))).toEqual('{"__proto__":{"a":1.0},"b":2}');
    }
  });

  test("JSON duplicate keys are reported", () => {
    const [parsed, errors] = parseJson('{"a": 1, "b": 2, "a": 3}');
    expect(parsed).toEqual({ a: 3, b: 2 });
    expect(errors).toEqual([
      { message: "DuplicateKey", offset: 1, length: 3 },
      { message: "DuplicateKey", offset: 17, length: 3 },
    ]);
  });

  test("JSON property without a value is null", () => {
    const [parsed, errors] = parseJson('{"a": , "b": 1}');
    expect(parsed).toEqual({ a: null, b: 1 });
    expect(errors.length).toEqual(1);
  });

  test("YAML duplicate keys are reported", () => {
    const [parsed, errors] = parseYaml("a: 1\nb: 2\na: 3\na: 4\n");
    expect(parsed).toEqual({ a: 4, b: 2 });
    expect(errors.map((error) => [error.message.split(" at ")[0], error.offset])).toEqual([
      ["Map keys must be unique", 10],
      ["Map keys must be unique", 15],
    ]);
  });

  test("YAML keys of different types are not duplicates", () => {
    const [, errors] = parseYaml('1: one\n"1": two');
    expect(errors).toEqual([]);
  });
});

describe("YAML documents", () => {
  test("unresolved alias is reported once", () => {
    const [parsed, errors] = parseYaml("a: &x\n  b: *nope\nc: *x\nd: *x\n");
    expect(parsed).toEqual({ a: {}, c: {}, d: {} });
    expect(errors).toEqual([
      { message: 'Alias "value" could not be resolved', offset: 11, length: 5 },
    ]);
  });

  test("null root is not parsed", () => {
    expect(parseYaml("---\n")[0]).toBeUndefined();
    expect(parseYaml("~")[0]).toBeUndefined();
  });
});
