import outdent from "outdent";
import { parseJson, getLocation, getRootRange, findNodeAtOffset } from "../src";

describe("Test JSON Location information and finding nodes by offset", () => {
  it("Location info for object", async () => {
    const [object] = parseJson('{"a": "b"}');

    expect(getLocation(object!, "a")).toEqual({
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
    const [object] = parseJson("[1, 2, 3]");

    expect(getLocation(object!, 0)).toEqual({
      key: undefined,
      value: {
        start: 1,
        end: 2,
      },
    });
  });

  it("tests getRootLocation() object", async () => {
    const [object] = parseJson('{"a": "b"}');
    expect(getRootRange(object!)).toEqual({
      start: 0,
      end: 10,
    });
  });

  it("Node by offset in simple array", async () => {
    const [object] = parseJson("[1]");
    const [value, path, location] = findNodeAtOffset(object!, 1);
    expect(value).toEqual(1);
    expect(path).toEqual([0]);
    expect(location).toEqual({ value: { start: 1, end: 2 } });
  });

  it("tests node by offset in object in array", async () => {
    const [object] = parseJson('[{"a":"b"}]');
    const [value, path, location] = findNodeAtOffset(object!, 7);
    expect(value).toEqual("b");
    expect(path).toEqual([0, "a"]);
    expect(location).toEqual({ key: { start: 2, end: 5 }, value: { start: 6, end: 9 } });
  });

  it("Node by offset in array", async () => {
    const [object] = parseJson("[1, 2, 3]");
    expect(findNodeAtOffset(object!, 1)[0]).toEqual(1);
    expect(findNodeAtOffset(object!, 4)[0]).toEqual(2);
    expect(findNodeAtOffset(object!, 7)[0]).toEqual(3);
  });

  it("tests path by offset in arrays", async () => {
    const [object] = parseJson("[[1]]");
    const [found, path] = findNodeAtOffset(object!, 2);
    expect(found).toEqual(1);
    expect(path).toEqual([0, 0]);
  });

  it("tests path by offset in object in array", async () => {
    const [object] = parseJson('[{"a":"b"}]');
    const [found, path] = findNodeAtOffset(object!, 7);

    expect(found).toEqual("b");
    expect(path).toEqual([0, "a"]);
  });

  it("test for the issue where the key location was mssing from object values", async () => {
    const text = outdent`{
      "info": {
        "version": "1.0.0",
        "title": "Swagger Petstore",
        "license": {
          "name": "MIT"
        }
      }`;

    const [object] = parseJson(text);
    const location = getLocation(object["info"], "license");
    expect(location!.key).toBeDefined();
  });
});
