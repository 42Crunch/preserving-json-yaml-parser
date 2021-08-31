import { stringify } from "../src";

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
});
