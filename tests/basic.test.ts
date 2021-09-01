import { parse } from "../src";
import { resolve } from "path";
import { readFileSync } from "fs";
import { parseToAst, parseToObject } from "./utils";

describe("Basic functionality", () => {
  it("Test Json 1", async () => {
    const text = readFileSync(resolve(__dirname, "xkcd.json"), { encoding: "utf8" });
    const object = parseToObject(text, "json");

    const root = parseToAst(text, "json");
    const object2 = parse(root);

    expect(object2).toEqual(object);
  });

  it("Test Yaml 1", async () => {
    const text = readFileSync(resolve(__dirname, "xkcd.yaml"), { encoding: "utf8" });
    const object = parseToObject(text, "yaml");

    const root = parseToAst(text, "yaml");
    const object2 = parse(root);

    expect(object2).toEqual(object);
  });

  it("Test Json 2", async () => {
    const text = readFileSync(resolve(__dirname, "petstore-v3.json"), { encoding: "utf8" });
    const object = parseToObject(text, "json");

    const root = parseToAst(text, "json");
    const object2 = parse(root);

    expect(object2).toEqual(object);
  });

  it("Test Yaml 2", async () => {
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

    const root = parseToAst(text, "yaml");
    const object2 = parse(root);

    expect(object2).toEqual(object);
  });

  it("YAML null value", async () => {
    const root = parseToAst("one: null\ntwo: ~\nthree:", "yaml");
    const object = parse(root);
    expect(object.one).toEqual(null);
    expect(object.two).toEqual(null);
    expect(object.three).toEqual(null);
  });

  it("JSON null value", async () => {
    const root = parseToAst('{"one":null}', "json");
    const object = parse(root);
    expect(object.one).toEqual(null);
  });

  it("YAML integer leading zeroes", async () => {
    const object = parse(parseToAst("agent: 007", "yaml"));
    expect(object.agent).toEqual(7);
  });

  it("YAML integer base 16", async () => {
    const object = parse(parseToAst("agent: 0x20", "yaml"));
    expect(object.agent).toEqual(32);
  });

  it("YAML integer base 8", async () => {
    const object = parse(parseToAst("agent: 0o40", "yaml"));
    expect(object.agent).toEqual(32);
  });

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
});
