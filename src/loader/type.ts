import type { CompileSharedType } from "@/parser/types";

export type LoaderSharedType = Pick<CompileSharedType, "enums" | "functions">;
