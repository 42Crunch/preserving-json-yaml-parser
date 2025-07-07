import { Tags, isSeq, isMap, YAMLMap, YAMLSeq } from "yaml";

class CommonTagImpl {
  tag: string;
  readonly type: string;

  constructor(tag: string, type: string) {
    this.tag = tag;
    this.type = type;
  }

  resolve(
    value: string | YAMLMap | YAMLSeq,
    onError: (message: string) => void
  ): string | YAMLMap | YAMLSeq | undefined {
    if (isMap(value) && this.type === "mapping") {
      return value;
    }
    if (isSeq(value) && this.type === "sequence") {
      return value;
    }
    if (typeof value === "string" && this.type === "scalar") {
      return value;
    }

    onError(`Unexpected type for tag ${this.tag}: ${typeof value}, expected ${this.type}`);
  }
}

class IncludeTag {
  public readonly tag = "!include";
  public readonly type = "scalar";
  resolve(value: string, onError: (message: string) => void): string | undefined {
    if (value && value.length > 0 && value.trim()) {
      return value;
    }
    onError("!include without value");
  }
}

export function getCustomTags(customTags: {
  [tag: string]: "scalar" | "sequence" | "mapping";
}): Tags {
  const tags = [];
  for (const [tagName, tagType] of Object.entries(customTags)) {
    tags.push(new CommonTagImpl(tagName, tagType));
  }
  tags.push(new IncludeTag());
  return tags;
}
