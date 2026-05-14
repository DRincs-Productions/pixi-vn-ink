import JSON5 from "json5";

const SPACE_SEPARATOR = "§SPACE§";
const DOUBLE_QUOTES_CONVERTER = "§DOUBLE_QUOTES§";
const QUOTES_CONVERTER = "§QUOTES§";
const SPECIAL_QUOTES_CONVERTER = "SPECIAL_§QUOTES§";
const CURLY_BRACKETS_CONVERTER1 = "§CURLY_BRACKETS1§";
const CURLY_BRACKETS_CONVERTER2 = "§CURLY_BRACKETS2§";

/**
 * Merges valid JSON-like blocks delimited by { }
 * into single strings.
 *
 * Rules:
 * - Braces must be balanced.
 * - Inner blocks are processed before parent blocks.
 * - Every generated block is validated with JSON5.parse().
 * - If a block is invalid:
 *   - the block remains split
 *   - all parent blocks also remain split
 * - Unmatched braces are treated as normal strings.
 */
export function mergeJsonBlocks(tokens: string[]): string[] {
    return mergeJsonBlockRange(tokens).tokens;
}

function mergeJsonBlockRange(tokens: string[]): {
    tokens: string[];
    hasInvalidMatchedBlock: boolean;
} {
    const result: string[] = [];
    let hasInvalidMatchedBlock = false;

    for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token !== "{") {
            result.push(token);
            continue;
        }

        const currentClose = findMatchingClosingBrace(tokens, i);

        if (currentClose === -1) {
            result.push(token);
            continue;
        }

        const innerBlock = mergeJsonBlockRange(tokens.slice(i + 1, currentClose));
        const blockTokens = ["{", ...innerBlock.tokens, "}"];
        const merged = blockTokens.join(" ");

        if (!innerBlock.hasInvalidMatchedBlock) {
            try {
                JSON5.parse(merged);
                result.push(merged);
                i = currentClose;
                continue;
            } catch {
                // keep the block split below
            }
        }

        hasInvalidMatchedBlock = true;
        result.push(...blockTokens);
        i = currentClose;
    }

    return {
        tokens: result,
        hasInvalidMatchedBlock,
    };
}

function findMatchingClosingBrace(tokens: string[], openIndex: number): number {
    let depth = 0;

    for (let i = openIndex; i < tokens.length; i++) {
        if (tokens[i] === "{") {
            depth++;
        } else if (tokens[i] === "}") {
            depth--;

            if (depth === 0) {
                return i;
            }
        }
    }

    return -1;
}

/**
 * Converts a raw hashtag-command string into a list of tokens, respecting
 * quoted strings and JSON-like `{ }` blocks.
 */
export function convertTagTolist(tag: string): string[] {
    tag = tag.replaceAll('\\"', DOUBLE_QUOTES_CONVERTER);
    tag = tag.replaceAll("\\'", QUOTES_CONVERTER);
    tag = tag.replaceAll("\\`", SPECIAL_QUOTES_CONVERTER);
    tag = tag.replaceAll("\\{", CURLY_BRACKETS_CONVERTER1);
    tag = tag.replaceAll("\\}", CURLY_BRACKETS_CONVERTER2);
    tag = tag.replaceAll("{", " { ");
    tag = tag.replaceAll("}", " } ");
    tag = tag.replaceAll(CURLY_BRACKETS_CONVERTER1, "{");
    tag = tag.replaceAll(CURLY_BRACKETS_CONVERTER2, "}");
    let list: string[] = [];
    // for string characters
    let startComment: '"' | "'" | "`" | undefined;
    let temp = "";
    for (let i = 0; i < tag.length; i++) {
        const char = tag[i];
        if (char === '"' || char === "'" || char === "`") {
            if (startComment === undefined) {
                list.push(temp);
                temp = "";
                startComment = char;
                temp += char;
            } else if (startComment === char) {
                startComment = undefined;
                temp += char;
                list.push(temp);
                temp = "";
            } else {
                temp += char;
            }
        } else {
            temp += char;
        }
    }
    if (temp !== "") {
        list.push(temp);
    }

    list.forEach((item, index) => {
        // if index is odd
        if (index % 2 === 1) {
            list[index] = item.replaceAll(" ", SPACE_SEPARATOR);
        }
    });
    tag = list.join("");
    list = tag.split(" ").filter((item) => item !== "");
    list = list.map((item) =>
        item
            .replaceAll(SPACE_SEPARATOR, " ")
            .replaceAll(DOUBLE_QUOTES_CONVERTER, '"')
            .replaceAll(QUOTES_CONVERTER, "'")
            .replaceAll(SPECIAL_QUOTES_CONVERTER, "`"),
    );
    // find the { and } that are not between quotes and join only valid JSON-like blocks
    // ["edit","image","bg","position","{",'"x":',"-20.5,",'"y":',"30,",'"test":','"test } \' test",','"test2":','"\'"',"}","visible","true","cursor",'"pointer"',"alpha","0.5",];
    list = mergeJsonBlocks(list);
    list = list.map((item) => {
        if (
            (item.startsWith('"') && item.endsWith('"')) ||
            (item.startsWith("'") && item.endsWith("'")) ||
            (item.startsWith("`") && item.endsWith("`"))
        ) {
            return item.slice(1, -1);
        }
        return item;
    });
    return list;
}
