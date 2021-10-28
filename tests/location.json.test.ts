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

  it("Node by offset in simple array", async () => {
    const json = "[1]";
    const node = parseToAst(json, "json");
    const object = parse(node);
    expect(findNodeAtOffset(object, 1)[0]).toEqual(1);
  });

  it("tests node by offset in object in array", async () => {
    const json = '[{"a":"b"}]';
    const node = parseToAst(json, "json");
    const object = parse(node);
    expect(findNodeAtOffset(object, 7)[0]).toEqual("b");
  });

  it("Node by offset in array", async () => {
    const json = "[1, 2, 3]";
    const node = parseToAst(json, "json");
    const object = parse(node);
    expect(findNodeAtOffset(object, 1)[0]).toEqual(1);
    expect(findNodeAtOffset(object, 4)[0]).toEqual(2);
    expect(findNodeAtOffset(object, 7)[0]).toEqual(3);
  });

  it("tests path by offset in arrays", async () => {
    const json = "[[1]]";
    const node = parseToAst(json, "json");
    const object = parse(node);
    const [found, path] = findNodeAtOffset(object, 2);
    expect(found).toEqual(1);
    expect(path).toEqual([0, 0]);
  });

  it("tests path by offset in object in array", async () => {
    const json = '[{"a":"b"}]';
    const node = parseToAst(json, "json");
    const object = parse(node);
    const [found, path] = findNodeAtOffset(object, 7);

    expect(found).toEqual("b");
    expect(path).toEqual([0, "a"]);
  });
});
