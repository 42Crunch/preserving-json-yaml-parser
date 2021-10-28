import { resolve } from "path";
import { readFileSync } from "fs";
import { parseJson, parseYaml, stringify } from "../src";
import { parseToObject } from "./utils";

describe("Basic numeric limits functionality", () => {
  it("Test Json numeric limits", async () => {
    const text = readFileSync(resolve(__dirname, "boundary.json"), { encoding: "utf8" });
    assertNumberFormatNotCorrupted(text);

    const object = parseToObject(text, "json");
    expect(JSON.stringify(object)).toEqual(stringify(object));

    const [object2] = parseJson(text);
    const object2Text = stringify(object2);
    assertNumberFormatNotCorrupted(object2Text);

    expect(JSON.parse(object2Text)).toEqual(object);
  });

  it("Test Yaml numeric limits", async () => {
    const text = readFileSync(resolve(__dirname, "boundary.yaml"), { encoding: "utf8" });
    assertNumberFormatNotCorrupted(text);

    const object = parseToObject(text, "yaml");
    expect(JSON.stringify(object)).toEqual(stringify(object));

    const [object2] = parseYaml(text);
    const object2Text = stringify(object2);
    assertNumberFormatNotCorrupted(object2Text);

    expect(JSON.parse(object2Text)).toEqual(object);
  });
});

function assertNumberFormatNotCorrupted(text: string): void {
  expect(text.indexOf("900719925474099665656") !== -1).toBeTruthy();
  expect(text.indexOf("1.0") !== -1).toBeTruthy();
  expect(text.indexOf("-1007199254740996656565643") !== -1).toBeTruthy();
  expect(text.indexOf("66666677777788888899999") !== -1).toBeTruthy();
}
