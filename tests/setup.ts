import { addBaseHashtagCommands } from "@/handlers/hashtag-commands";

// The built-in mappers (call, jump, show image, ...) are no longer registered as a side effect
// of importing this package — tests that exercise them need `addBaseHashtagCommands()` to have
// run first, exactly like a real app would call it once at startup.
addBaseHashtagCommands();
