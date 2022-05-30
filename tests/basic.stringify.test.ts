import { stringify } from "../src";
import { readFileSync } from "fs";
import { resolve } from "path";

describe("Basic stringify functionality", () => {
  it("Test stringify", async () => {
    expect(stringify(null)).toEqual(JSON.stringify(null));
    expect(stringify(undefined)).toEqual(JSON.stringify(undefined));

    expect(stringify({})).toEqual(JSON.stringify({}));
    //expect(stringify(true)).toEqual(JSON.stringify(true));
    //expect(stringify("foo")).toEqual(JSON.stringify("foo"));

    expect(stringify({ x: 5 })).toEqual(JSON.stringify({ x: 5 }));
    expect(stringify({ x: 5, y: 6 })).toEqual(JSON.stringify({ x: 5, y: 6 }));
    expect(stringify([1, "false", false])).toEqual(JSON.stringify([1, "false", false]));

    const value = [new Number(1), new String("false"), new Boolean(false)];
    expect(stringify(value)).toEqual(JSON.stringify(value));

    //const value2 = { x: undefined, y: Object, z: Symbol("") };
    //expect(stringify(value2)).toEqual(JSON.stringify(value2));

    //const value3 = [undefined, Object, Symbol("")];
    //expect(stringify(value3)).toEqual(JSON.stringify(value3));

    //const value4 = { [Symbol("foo")]: "foo" };
    //expect(stringify(value4)).toEqual(JSON.stringify(value4));
  });

  it("Should escape newlines in strings", async () => {
    const value = { foo: "bar\nbaz" };
    expect(stringify(value)).toEqual(JSON.stringify(value));
  });

  it("Should handle unicode", async () => {
    const value = { фуу: "бар\nбаз" };
    expect(stringify(value)).toEqual(JSON.stringify(value));
  });

  it("should format any json", async () => {
    const value = { foo: "bar", baz: "brr", b: [1], bb: [1, 2], z: { foo: "bar" } };
    const own = stringify(value, 2);
    const json = JSON.stringify(value, null, 2);
    expect(own).toEqual(json);
  });

  it("should format empty object", async () => {
    const value = {};
    const own = stringify(value, 2);
    const json = JSON.stringify(value, null, 2);
    expect(own).toEqual(json);
  });

  it("should format empty array", async () => {
    const value: string[] = [];
    const own = stringify(value, 2);
    const json = JSON.stringify(value, null, 2);
    expect(own).toEqual(json);
  });

  it("should format array with empty object", async () => {
    const value: object[] = [{}];
    const own = stringify(value, 2);
    const json = JSON.stringify(value, null, 2);
    expect(own).toEqual(json);
  });

  it("should format petstore-v3.json", async () => {
    const value = JSON.parse(
      readFileSync(resolve(__dirname, "petstore-v3.json"), { encoding: "utf8" })
    );

    const own = stringify(value);
    const json = JSON.stringify(value);
    expect(own).toEqual(json);

    const formattedOwn = stringify(value, 2);
    const formattedJson = JSON.stringify(value, null, 2);
    expect(formattedOwn).toEqual(formattedJson);
  });

  it("should stringify large swagger-slot.json quickly", async () => {
    const value = JSON.parse(
      readFileSync(resolve(__dirname, "swagger-slot.json"), { encoding: "utf8" })
    );

    const own = stringify(value);
    const json = JSON.stringify(value);
    expect(own).toEqual(json);
    await new Promise((resolve) => setTimeout(resolve, 1));

    const formattedOwn = stringify(value, 2);
    const formattedJson = JSON.stringify(value, null, 2);
    expect(formattedOwn).toEqual(formattedJson);
    await new Promise((resolve) => setTimeout(resolve, 1));
  }, 1000);
});
