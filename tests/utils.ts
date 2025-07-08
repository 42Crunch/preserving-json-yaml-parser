import { expect } from "vitest";
import * as yaml from "js-yaml";
import * as json from "jsonc-parser";

export function parseToObject(text: string, language: "json" | "yaml"): any {
  let object: any;
  try {
    if (language === "yaml") {
      object = yaml.load(text);
    } else {
      const errors: json.ParseError[] = [];
      const parsed = json.parse(text, errors, { allowTrailingComma: false });
      if (errors.length == 0) {
        object = parsed;
      }
    }
  } catch (ex) {}
  expect(object).toBeDefined();
  return object;
}
