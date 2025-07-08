import { describe, expect, test } from "vitest";
import outdent from "outdent";

import {
  parseYaml,
  getLocation,
  findNodeAtOffset,
  getRootRange,
  findLocationForJsonPointer,
} from "../src";

describe("Test YAML Location information and finding nodes by offset", () => {
  test("Location info for object", async () => {
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

  test("Location info for array", async () => {
    const [object] = parseYaml("[1, 2, 3]");

    expect(getLocation(object!, 0)).toEqual({
      key: undefined,
      value: {
        start: 1,
        end: 2,
      },
    });
  });

  test("tests getRootLocation() object", async () => {
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

  test("Location info for array", async () => {
    const [object] = parseYaml("[1, 2, 3]");

    expect(findNodeAtOffset(object!, 1)[0]).toEqual(1);
    expect(findNodeAtOffset(object!, 4)[0]).toEqual(2);
    expect(findNodeAtOffset(object!, 7)[0]).toEqual(3);
  });

  test("test for the issue where the key location was mssing from object values", async () => {
    const text = outdent`
      info:
        version: "1.0.0"
        title: "Swagger Petstore"
        license:
          name: "MIT"
      `;

    const [object] = parseYaml(text);
    const location = getLocation(object!["info"], "license");
    expect(location!.key).toBeDefined();
  });

  test("finds location for missing null value in object", async () => {
    const [object] = parseYaml("foo:");
    expect(findNodeAtOffset(object!, 4)[1]).toEqual(["foo"]);
  });

  test("finds location for missing null value in object, middle of yaml body", async () => {
    const [object] = parseYaml("a: b\nc:\nd: e");
    const [node, path] = findNodeAtOffset(object!, 7);
    expect(path).toEqual(["c"]);
  });

  test("finds location for missing null value in object, middle of yaml body", async () => {
    const [object] = parseYaml("a: b\nc:\nd: e");
    const location1 = findLocationForJsonPointer(object!, "");
    const location2 = findLocationForJsonPointer(object!, "/a");
    expect(location1).toEqual({ value: { end: 12, start: 0 } });
    expect(location2).toEqual({ key: { end: 1, start: 0 }, value: { end: 4, start: 3 } });
  });
});
