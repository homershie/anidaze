declare module "opencc-js" {
  export interface ConverterOptions {
    from: "cn" | "tw" | "hk" | "jp" | "t";
    to: "cn" | "tw" | "hk" | "jp" | "t";
  }

  export type ConverterFunction = (text: string) => string;

  export function Converter(options: ConverterOptions): ConverterFunction;
}

