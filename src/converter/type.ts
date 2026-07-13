import type { CompileSharedType } from "@/parser/types";

/** A character id, or any object carrying one (e.g. a `CharacterInterface` / `RegisteredCharacters.values()`). */
export type CharacterIdSource = string | { id: string };

export type LoaderSharedType = Pick<CompileSharedType, "enums" | "functions"> & {
    /**
     * Characters recognised when splitting `characterId: text` speakers, in addition to the global
     * `RegisteredCharacters` registry. Pass when converting before characters are registered.
     */
    characters?: readonly CharacterIdSource[];
};
