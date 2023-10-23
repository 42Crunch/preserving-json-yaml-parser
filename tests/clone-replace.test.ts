import { simpleClone } from "../src";

describe("Clone replace functionality", () => {
  it("Test that simple replacement works", async () => {
    const object = { foo: "bar" };
    const object2 = simpleClone(object, (value) => "baz");
    expect(object2).toEqual({ foo: "baz" });
  });

  it("Test that simple location works", async () => {
    const object = { foo: "bar" };
    const object2 = simpleClone(object, (value, location) => {
      expect(location).toEqual(["foo"]);
      return "baz";
    });
    expect(object2).toEqual({ foo: "baz" });
  });

  it("Test more complex locations", async () => {
    const object = { foo: "foo", baz: "baz", rom: { com: "com" }, ram: ["ram1", "ram2"] };
    const object2 = simpleClone(object, (value, location) => {
      if (value == "foo") {
        expect(location).toEqual(["foo"]);
      } else if (value == "baz") {
        expect(location).toEqual(["baz"]);
      } else if (value == "com") {
        expect(location).toEqual(["rom", "com"]);
      } else if (value == "ram1") {
        expect(location).toEqual(["ram", 0]);
      } else if (value == "ram2") {
        expect(location).toEqual(["ram", 1]);
      }
      return "baz";
    });
    expect(object2).toEqual({ foo: "baz", baz: "baz", rom: { com: "baz" }, ram: ["baz", "baz"] });
  });
});
