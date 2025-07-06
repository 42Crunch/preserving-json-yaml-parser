import { describe, expect, test } from "vitest";
import { resolve } from "path";
import { readFileSync } from "fs";
import * as yaml from "js-yaml";

import { parseJson, parseYaml } from "../src";
import { parseToObject } from "./utils";

describe("Basic functionality", () => {
  test("Test Json 1", async () => {
    const text = readFileSync(resolve(__dirname, "xkcd.json"), { encoding: "utf8" });
    const object = parseToObject(text, "json");

    const [object2] = parseJson(text);

    expect(object2).toEqual(object);
  });

  test("Test Yaml 1", async () => {
    const text = readFileSync(resolve(__dirname, "xkcd.yaml"), { encoding: "utf8" });
    const object = parseToObject(text, "yaml");

    const [object2] = parseYaml(text);

    expect(object2).toEqual(object);
  });

  test("Test Json 2", async () => {
    const text = readFileSync(resolve(__dirname, "petstore-v3.json"), { encoding: "utf8" });
    const object = parseToObject(text, "json");

    const [object2] = parseJson(text);

    expect(object2).toEqual(object);
  });

  test("Test Yaml 2", async () => {
    const text = readFileSync(resolve(__dirname, "petstore-v3.yaml"), { encoding: "utf8" });

    // Just make sure all possible anchors are there in the file
    expect(text.indexOf("Pet: &anchor1") > 0).toBeTruthy();
    expect(text.indexOf("id: &anchor2") > 0).toBeTruthy();
    expect(text.indexOf("- &anchor3 pets") > 0 && text.indexOf("- *anchor3") > 0).toBeTruthy();
    expect(text.indexOf("$ref: &anchor4") > 0 && text.indexOf("$ref: *anchor4") > 0).toBeTruthy();
    expect(
      text.indexOf("headers: &anchor5") > 0 && text.indexOf("headers: *anchor5") > 0
    ).toBeTruthy();

    const object = parseToObject(text, "yaml");

    const [object2] = parseYaml(text);

    expect(object2).toEqual(object);
  });

  test("YAML null value", async () => {
    const [object] = parseYaml("one: null\ntwo: ~\nthree:");
    //@ts-ignore
    expect(object["one"]).toEqual(null);
    expect(object!["two"]).toEqual(null);
    expect(object!["three"]).toEqual(null);
  });

  test("JSON null value", async () => {
    const [object] = parseJson('{"one":null}');
    expect(object!["one"]).toEqual(null);
  });

  test("YAML integer leading zeroes", async () => {
    const [object] = parseYaml("agent: 007");
    expect(object!["agent"]).toEqual(7);
  });

  test("YAML integer base 16", async () => {
    const [object] = parseYaml("agent: 0x20");
    expect(object!["agent"]).toEqual(32);
  });

  test("YAML integer base 8", async () => {
    const [object] = parseYaml("agent: 0o40");
    expect(object!["agent"]).toEqual(32);
  });

  test("should handle broken.yaml", async () => {
    const text = readFileSync(resolve(__dirname, "broken.yaml"), { encoding: "utf8" });
    const [parsed, errors] = parseYaml(text);
    expect(errors.length).toEqual(2); // FIXME what is the second error?
  });

  test("should handle broken.json", async () => {
    const text = readFileSync(resolve(__dirname, "broken.json"), { encoding: "utf8" });
    const [parsed, errors] = parseJson(text);
    expect(errors.length).toEqual(1);
  });

  test("should return undefined when YAML parser parsing strings", async () => {
    const [object] = parseYaml("foo");
    expect(object).toEqual(undefined);
  });

  test("should return undefined when JSON parser parsing strings", async () => {
    const [object] = parseJson("foo");
    expect(object).toEqual(undefined);
  });

  test("should parse that particular regex in yaml", async () => {
    const text = readFileSync(resolve(__dirname, "regex.yaml"), { encoding: "utf8" });
    const [object] = parseYaml(text);
    expect(object!["foo"]).toEqual("^[a-zA-Z0-9\\s(\\\\)',_.]*$");
    expect("foo: ^[a-zA-Z0-9\\s(\\\\)',_.]*$\n").toEqual(yaml.dump(object));
  });

  /*
  it("It should allow parsing of a sub-tree of AST in YAML", async () => {
    const root = parseToAst("foo:\n  bar: baz\nzoom: [1,2,3]", "yaml");
    const foo = parse(root.find("/foo"));
    const zoom = parse(root.find("/zoom"));
    expect(foo).toEqual({ bar: "baz" });
    expect(zoom).toEqual([1, 2, 3]);
  });

  it("It should allow parsing of a sub-tree of AST in JSON", async () => {
    const root = parseToAst('{"foo": {"bar": "baz"}, "zoom":[1,2,3]}', "json");
    const foo = parse(root.find("/foo"));
    const zoom = parse(root.find("/zoom"));
    expect(foo).toEqual({ bar: "baz" });
    expect(zoom).toEqual([1, 2, 3]);
  });
  */
});
