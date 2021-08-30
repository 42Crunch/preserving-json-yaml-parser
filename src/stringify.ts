import { visitObject } from "./object";

export function stringify(value: any): string {
  // safeguard for falsy values
  if (!value) {
    return JSON.stringify(value);
  }

  let result: string = "";

  function keyed(key: string | number, value: any) {
    return typeof key === "string" ? `${JSON.stringify(key)}:${value}` : value;
  }

  visitObject(undefined, "", value, {
    onObjectStart: (parent: any, key: string | number, value: any) => {
      result += keyed(key, "{");
    },
    onObjectEnd: () => {
      if (result.endsWith(",")) {
        result = result.slice(0, -1);
      }
      result += "},";
    },
    onArrayStart: (parent: any, key: string | number, value: any) => {
      result += keyed(key, "[");
    },
    onArrayEnd: () => {
      if (result.endsWith(",")) {
        result = result.slice(0, -1);
      }
      result += "],";
    },
    onValue: (parent: any, key: string | number, value: any, preserved: string | undefined) => {
      if (preserved !== undefined) {
        result += keyed(key, preserved) + ",";
      } else {
        result += keyed(key, JSON.stringify(value)) + ",";
      }
    },
  });

  return result.slice(3, -1);
}
