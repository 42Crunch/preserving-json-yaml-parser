import { parse, getLocation } from "../src";
import { parseToAst } from "./utils";

describe("Test JSON Ranges", () => {
  it("Ranges for object", async () => {
    const json = '{"a": "b"}';
    const node = parseToAst(json, "json");
    const object = parse(node);

    expect(getLocation(object, "a")).toEqual({
      key: {
        start: 1,
        end: 4,
      },
      value: {
        start: 6,
        end: 9,
      },
    });
  });

  it("Ranges for array", async () => {
    const json = "[1, 2, 3]";
    const node = parseToAst(json, "json");
    const object = parse(node);

    expect(getLocation(object, 0)).toEqual({
      key: undefined,
      value: {
        start: 1,
        end: 2,
      },
    });
  });
});
