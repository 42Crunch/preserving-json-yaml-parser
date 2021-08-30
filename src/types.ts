export interface AstVisitor {
  onObjectStart: (parent: any, key: string | number, value: any) => void;
  onObjectEnd: () => void;
  onArrayStart: (parent: any, key: string | number, value: any) => void;
  onArrayEnd: () => void;
  onValue: (parent: any, key: string | number, value: any, text: string) => void;
}

export interface ObjectVisitor extends AstVisitor {
  onValue: (parent: any, key: string | number, value: any, text: string | undefined) => void;
}
