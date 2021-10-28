import { parse, getLocation, findNodeAtOffset } from "../src";
import { parseToAst } from "./utils";

describe("Test JSON Location information and finding nodes by offset", () => {
  it("Location info for object", async () => {
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

  it("Location info for array", async () => {
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

  it("Node by offset in array", async () => {
    const json = "[1, 2, 3]";
    const node = parseToAst(json, "json");
    const object = parse(node);
    expect(findNodeAtOffset(object, 1)).toEqual(1);
    expect(findNodeAtOffset(object, 4)).toEqual(2);
    expect(findNodeAtOffset(object, 7)).toEqual(3);
  });
});
