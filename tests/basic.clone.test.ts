import { parseJson, simpleClone, stringify } from "../src";
import { resolve } from "path";
import { readFileSync } from "fs";
import { parseToObject } from "./utils";

describe("Basic clone functionality", () => {
  it("Test clone", async () => {
    const text = readFileSync(resolve(__dirname, "boundary.json"), { encoding: "utf8" });
    assertNumberFormatNotCorrupted(text);

    const object = parseToObject(text, "json");
    expect(JSON.stringify(object)).toEqual(stringify(object));

    const [object2] = parseJson(text);
    const object2Text = stringify(object2);
    assertNumberFormatNotCorrupted(object2Text);

    const object3 = simpleClone(object2);
    expect(object3).toBeDefined();
    const object3Text = stringify(object3);
    assertNumberFormatNotCorrupted(object3Text);

    expect(object2).toEqual(object3);
    expect(object2Text).toEqual(object3Text);
  });
});

function assertNumberFormatNotCorrupted(text: string): void {
  expect(text.indexOf("900719925474099665656") !== -1).toBeTruthy();
  expect(text.indexOf("1.0") !== -1).toBeTruthy();
  expect(text.indexOf("-1007199254740996656565643") !== -1).toBeTruthy();
  expect(text.indexOf("66666677777788888899999") !== -1).toBeTruthy();
}
