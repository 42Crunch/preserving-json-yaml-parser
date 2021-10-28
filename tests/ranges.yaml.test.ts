import { parse, getLocation } from "../src";
import { parseToAst } from "./utils";

describe("Test YAML Ranges", () => {
  it("Ranges for object", async () => {
    const yaml = "a: b";
    const node = parseToAst(yaml, "yaml");
    const object = parse(node);

    expect(getLocation(object, "a")).toEqual({
      key: {
        start: 0,
        end: 1,
      },
      value: {
        start: 3,
        end: 4,
      },
    });
  });

  it("Ranges for array", async () => {
    const yaml = "[1, 2, 3]";
    const node = parseToAst(yaml, "yaml");
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
