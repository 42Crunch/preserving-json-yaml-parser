import * as yaml from "js-yaml";
import * as json from "jsonc-parser";
import { parse as parseToASTNode, Node } from "@xliic/openapi-ast-node";

export function assertNumberFormatNotCorrupted(text: string): void {
  expect(text.indexOf("900719925474099665656") !== -1).toBeTruthy();
  expect(text.indexOf("1.0") !== -1).toBeTruthy();
  expect(text.indexOf("-1007199254740996656565643") !== -1).toBeTruthy();
  expect(text.indexOf("66666677777788888899999") !== -1).toBeTruthy();
  //expect(text.indexOf("6.000e23") !== -1).toBeTruthy();
}

export function parseToAst(text: string, language: "json" | "yaml"): Node {
  const [root, errors] = parseToASTNode(text, language, {});
  expect(root).toBeDefined();
  expect(errors.length === 0).toBeTruthy();
  return root;
}

export function parseToObject(text: string, language: "json" | "yaml"): any {
  let object: any;
  try {
    if (language === "yaml") {
      object = yaml.load(text);
    } else {
      const errors: json.ParseError[] = [];
      const parsed = json.parse(text, errors, { allowTrailingComma: true });
      if (errors.length == 0) {
        object = parsed;
      }
    }
  } catch (ex) {}
  expect(object).toBeDefined();
  return object;
}
