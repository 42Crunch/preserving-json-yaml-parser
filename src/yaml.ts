export function reserializeYamlInt(value: string) {
  if (value.indexOf("_") !== -1) {
    value = value.replace(/_/g, "");
  }

  let sign = BigInt(1);
  if (value[0] === "-" || value[0] === "+") {
    if (value[0] === "-") sign = BigInt(-1);
    value = value.slice(1);
  }

  const bigInt = sign * BigInt(value);

  return bigInt.toString();
}

export function reserializeYamlFloat(value: number) {
  const serialized = JSON.stringify(value);
  if (
    serialized.includes("null") ||
    serialized.includes("e") ||
    serialized.includes("E") ||
    serialized.includes(".")
  ) {
    return serialized;
  }
  return serialized + ".0";
}
