import outdent from "outdent";
import { parseYaml, getLocation, findNodeAtOffset, getRootRange } from "../src";

describe("Test YAML Location information and finding nodes by offset", () => {
  it("Location info for object", async () => {
    const [object] = parseYaml("a: b");

    expect(getLocation(object!, "a")).toEqual({
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
    const [object] = parseYaml("[1, 2, 3]");

    expect(getLocation(object!, 0)).toEqual({
      key: undefined,
      value: {
        start: 1,
        end: 2,
      },
    });
  });

  it("tests getRootLocation() object", async () => {
    const [object] = parseYaml("a: b");
    expect(getRootRange(object!)).toEqual({
      start: 0,
      end: 4,
    });

    // should be possible to find node with the same offset as the root end location
    const [value, path, location] = findNodeAtOffset(object!, 4);
    expect(value).toEqual("b");
    expect(path).toEqual(["a"]);
    expect(location).toEqual({ key: { start: 0, end: 1 }, value: { start: 3, end: 4 } });
  });

  it("Location info for array", async () => {
    const [object] = parseYaml("[1, 2, 3]");

    expect(findNodeAtOffset(object!, 1)[0]).toEqual(1);
    expect(findNodeAtOffset(object!, 4)[0]).toEqual(2);
    expect(findNodeAtOffset(object!, 7)[0]).toEqual(3);
  });

  it("test for the issue where the key location was mssing from object values", async () => {
    const text = outdent`
      info:
        version: "1.0.0"
        title: "Swagger Petstore"
        license:
          name: "MIT"
      `;

    const [object] = parseYaml(text);
    const location = getLocation(object!.info, "license");
    expect(location!.key).toBeDefined();
  });

  it("finds location for missing null value in object", async () => {
    const [object] = parseYaml("foo:");
    expect(findNodeAtOffset(object!, 3)[1]).toEqual(["foo"]);
  });

  it("finds location for missing null value in object, middle of yaml body", async () => {
    const [object] = parseYaml("a: b\nc:\nd: e");
    const [node, path] = findNodeAtOffset(object!, 6);
    expect(path).toEqual(["c"]);
  });
});
