import { parse, getLocation, findNodeAtOffset } from "../src";
import { parseToAst } from "./utils";

describe("Test YAML Location information and finding nodes by offset", () => {
  it("Location info for object", async () => {
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

  it("Location info for array", async () => {
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

  it("Location info for array", async () => {
    const yaml = "[1, 2, 3]";
    const node = parseToAst(yaml, "yaml");
    const object = parse(node);

    expect(findNodeAtOffset(object, 1)[0]).toEqual(1);
    expect(findNodeAtOffset(object, 4)[0]).toEqual(2);
    expect(findNodeAtOffset(object, 7)[0]).toEqual(3);
  });
});
