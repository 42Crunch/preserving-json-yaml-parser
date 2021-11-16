import { parseJson, parseYaml, find } from "../src";
import { resolve } from "path";
import { readFileSync } from "fs";

function loadJson(filename: string) {
  const text = readFileSync(resolve(__dirname, filename), { encoding: "utf8" });
  return parseJson(text);
}

function loadYaml(filename: string) {
  const text = readFileSync(resolve(__dirname, filename), { encoding: "utf8" });
  return parseYaml(text);
}

describe("Basic tests for find()", () => {
  it("test find() in JSON file", async () => {
    const [root] = loadJson("xkcd.json");
    expect(find(root, "/swagger")).toEqual("2.0");
    expect(find(root, "/host")).toEqual("xkcd.com");
    expect(find(root, "/info/title")).toEqual("XKCD");
    expect(find(root, "/paths/~1info.0.json/get/description")).toEqual(
      "Fetch current comic and metadata.\n"
    );
    expect(find(root, "")).toEqual(root);
  });

  it("test find() in YAML file", async () => {
    const [root] = loadYaml("xkcd.yaml");
    expect(find(root, "/swagger")).toEqual("2.0");
    expect(find(root, "/host")).toEqual("xkcd.com");
    expect(find(root, "/info/title")).toEqual("XKCD");
    expect(find(root, "/paths/~1info.0.json/get/description")).toEqual(
      "Fetch current comic and metadata.\n"
    );
    // "" JSON Pointer points to a root
    expect(find(root, "")).toEqual(root);
  });

  it("checks falsy values, empty string", async () => {
    const [root] = parseJson('{"/name": {"get": {"description": ""}}}');
    expect(find(root, "/~1name/get/description")).toEqual("");
  });

  it("checks falsy values, null", async () => {
    const [root] = parseJson('{"/name": {"get": {"description": null}}}');
    expect(find(root, "/~1name/get/description")).toEqual(null);
  });

  it("checks falsy values, zero", async () => {
    const [root] = parseJson('{"/name": {"get": {"description": 0}}}');
    expect(find(root, "/~1name/get/description")).toEqual(0);
  });

  it("checks built in properties, length", async () => {
    const [root] = parseJson('{"/name": {"get": {"description": ""}}}');
    expect(find(root, "/~1name/get/description/length")).toEqual(undefined);
  });

  it("checks built in properties, length of array", async () => {
    const [root] = parseJson('{"/name": {"get": {"description": []}}}');
    expect(find(root, "/~1name/get/description/length")).toEqual(undefined);
  });

  it("checks built in properties, __proto_ of object", async () => {
    const [root] = parseJson('{"/name": {"get": {"description": {}}}}');
    expect(find(root, "/~1name/get/description/__proto__")).toEqual(undefined);
  });

  it("checks pointing into null value", async () => {
    const [root] = parseJson('{"/name": {"get": {"description": null}}}');
    expect(find(root, "/~1name/get/description/foo")).toEqual(undefined);
  });
});
