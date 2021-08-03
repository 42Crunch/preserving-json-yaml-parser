import { resolve } from "path";
import { readFileSync } from "fs";
import { parse, stringify } from "../src";
import { assertNumberFormatNotCorrupted, parseToAst, parseToObject } from "./utils";

describe("Basic numeric limits functionality", () => {
  it("Test Json numeric limits", async () => {
    const text = readFileSync(resolve(__dirname, "boundary.json"), { encoding: "utf8" });
    assertNumberFormatNotCorrupted(text, false);

    const object = parseToObject(text, "json");
    expect(JSON.stringify(object)).toEqual(stringify(object));

    const root = parseToAst(text, "json");
    const object2 = parse(text, "json", root);
    const object2Text = stringify(object2);
    assertNumberFormatNotCorrupted(object2Text, false);

    expect(JSON.parse(object2Text)).toEqual(object);
  });

  it("Test Yaml numeric limits", async () => {
    const text = readFileSync(resolve(__dirname, "boundary.yaml"), { encoding: "utf8" });
    assertNumberFormatNotCorrupted(text, true);

    const object = parseToObject(text, "yaml");
    expect(JSON.stringify(object)).toEqual(stringify(object));

    const root = parseToAst(text, "yaml");
    const object2 = parse(text, "yaml", root);
    const object2Text = stringify(object2);
    assertNumberFormatNotCorrupted(object2Text, false);

    expect(JSON.parse(object2Text)).toEqual(object);
  });
});
