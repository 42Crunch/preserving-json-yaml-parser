import * as yaml from "yaml-language-server-parser";
import { Node, YamlNode } from "@xliic/openapi-ast-node";

const safePlaceKey = Symbol("vscode-openapi");
const underscoreRegExp = new RegExp("_", "g");

export function parse(text: string, root: Node): any {
  return dfs(text, root);
}

export function stringify(value: any): string {
  if (value) {
    const type = getType(value);
    if (type === "object" || type === "array") {
      return dfsStringify(value);
    }
  }
  return JSON.stringify(value);
}

export function simpleClone<T>(orig: T): T {
  const o = <any>orig;
  if (Array.isArray(o)) return cloneArray(o, simpleClone);
  const o2: { [key: string]: any } = {};
  cloneSimpleKey(o, o2);
  for (const k in o) {
    const cur = o[k];
    if (typeof cur !== "object" || cur === null) {
      o2[k] = cur;
    } else {
      o2[k] = simpleClone(cur);
    }
  }
  return o2 as T;
}

function dfs(text: string, node: Node, o?: any, id?: string | number | undefined): any {
  if (node.isObject()) {
    const result: { [key: string]: any } = {};
    for (const child of node.getChildren()) {
      const key = child.getKey();
      if (isYamlAnchorMergeNode(child)) {
        const value = getNodeValue(child);
        Object.assign(result, dfs(text, new YamlNode(value.value), result, key));
      } else {
        result[key] = dfs(text, child, result, key);
      }
    }
    return result;
  } else if (node.isArray()) {
    let index = 0;
    const result: any[] = [];
    for (const child of node.getChildren()) {
      result.push(dfs(text, child, result, index));
      index += 1;
    }
    return result;
  } else if (isYamlAnchorNode(node)) {
    const value = getNodeValue(node);
    return dfs(text, new YamlNode(value), o);
  } else if (isYamlAnchorNodeValue(node)) {
    const value = getNodeValue(node);
    return dfs(text, new YamlNode(value.value), o);
  } else {
    let value = node.getValue();
    if (node instanceof YamlNode) {
      const nodeValue = getNodeValue(node);
      if (nodeValue && nodeValue.valueObject !== undefined) {
        const valueObject = nodeValue.valueObject;
        if (typeof valueObject === "number") {
          const range = node.getValueRange();
          if (range) {
            const [start, end] = range;
            setSafeValue(o, id, normalizeYamlNumber(text.substring(start, end)), valueObject);
          }
        }
        return valueObject;
      }
    } else {
      if (typeof value === "number") {
        const range = node.getValueRange();
        if (range) {
          const [start, end] = range;
          setSafeValue(o, id, text.substring(start, end), value);
        }
      }
    }
    return value;
  }
}

function setSafeValue(
  o: any,
  id: string | number | undefined,
  textValue: string,
  value: number
): void {
  if (o && id && textValue !== Number(value).toString()) {
    const place = o[safePlaceKey] || {};
    place[id] = textValue;
    o[safePlaceKey] = place;
  }
}

function normalizeYamlNumber(x: string): string {
  if (x.indexOf("_") !== -1) {
    return x.replace(underscoreRegExp, "");
  }
  return x;
}

function getNodeValue(node: Node): any {
  const innerNode = <yaml.YAMLScalar>(<YamlNode>node).node;
  return (<yaml.YAMLNode>innerNode).value;
}

function isYamlAnchorMergeNode(node: Node): boolean {
  if (node.getKey() === "<<") {
    return isYamlAnchorNodeValue(node);
  }
  return false;
}

function isYamlAnchorNodeValue(node: Node): boolean {
  if (node instanceof YamlNode) {
    const value = getNodeValue(node);
    if (value !== null && value.kind === yaml.Kind.ANCHOR_REF) {
      return true;
    }
  }
  return false;
}

function isYamlAnchorNode(node: Node): boolean {
  if (node instanceof YamlNode) {
    const innerNode = <yaml.YAMLScalar>(<YamlNode>node).node;
    const kind = (<yaml.YAMLNode>innerNode).kind;
    if (kind === yaml.Kind.ANCHOR_REF) {
      return true;
    }
  }
  return false;
}

function dfsStringify(o: any, safeValue?: string): string {
  const type = isPrimitiveObject(o) ? getType(o.valueOf()) : getType(o);
  switch (type) {
    case "object":
      let i = 0;
      const keys = Object.keys(o).filter((key) => doStringify(o[key]));
      let objText = "{";
      for (const key of keys) {
        i += 1;
        objText += '"' + key + '":' + dfsStringify(o[key], getSafeValue(o, key));
        if (i < keys.length) {
          objText += ",";
        }
      }
      return objText + "}";
    case "array":
      let arrText = "[";
      for (let i = 0; i < o.length; i++) {
        if (doStringify(o[i])) {
          arrText += dfsStringify(o[i], getSafeValue(o, i));
        } else {
          arrText += "null";
        }
        if (i < o.length - 1) {
          arrText += ",";
        }
      }
      return arrText + "]";
    default:
      if (isPrimitiveObject(o)) {
        const value = o.valueOf();
        return type === "string" ? '"' + value + '"' : value;
      }
      if ((type === "number" || type === "integer") && safeValue) {
        return safeValue;
      }
      return type === "string" ? '"' + o + '"' : o;
  }
}

function doStringify(o: any): boolean {
  const type = getType(o);
  return type !== "function" && type !== "symbol" && type !== "undefined";
}

function isPrimitiveObject(o: any): boolean {
  return o instanceof Number || o instanceof String || o instanceof Boolean;
}

function getSafeValue(o: any, id: string | number): string | undefined {
  const place = o[safePlaceKey];
  return place ? place[id] : undefined;
}

function getType(value: any, nullForUndefined?: boolean): string {
  const type = typeof value;
  if (type === "object") {
    return value === null ? "null" : value instanceof Array ? "array" : type;
  } else if (type === "number") {
    return Number.isInteger(value) ? "integer" : type;
  } else if (nullForUndefined === true && type === "undefined") {
    return "null";
  }
  return type;
}

function cloneSimpleKey(oFrom: any, oTo: any) {
  if (oFrom !== undefined && oFrom !== null) {
    const place = oFrom[safePlaceKey];
    if (place) {
      oTo[safePlaceKey] = place;
    }
  }
}

function cloneArray(a: any, fn: any): any {
  const keys = Object.keys(a);
  const a2 = new Array(keys.length);
  cloneSimpleKey(a, a2);
  for (let i = 0; i < keys.length; i++) {
    const cur = a[i];
    if (typeof cur !== "object" || cur === null) {
      a2[i] = cur;
    } else {
      a2[i] = fn(cur);
    }
  }
  return a2;
}
