import { parse, simpleClone, stringify } from "../src";
import { resolve } from "path";
import { readFileSync } from "fs";
import { assertNumberFormatNotCorrupted, parseToAst, parseToObject } from "./utils";

describe("Basic clone functionality", () => {
  it("Test clone", async () => {
    const text = readFileSync(resolve(__dirname, "boundary.json"), { encoding: "utf8" });
    assertNumberFormatNotCorrupted(text, false);

    const object = parseToObject(text, "json");
    expect(JSON.stringify(object)).toEqual(stringify(object));

    const root = parseToAst(text, "json");
    const object2 = parse(text, root);
    const object2Text = stringify(object2);
    assertNumberFormatNotCorrupted(object2Text, false);

    const object3 = simpleClone(object2);
    expect(object3).toBeDefined();
    const object3Text = stringify(object3);
    assertNumberFormatNotCorrupted(object3Text, false);

    expect(object2).toEqual(object3);
    expect(object2Text).toEqual(object3Text);
  });
});
