import { rm } from "node:fs/promises";

// Vinext mirrors public assets into both client and server output. Sites serves
// the client copy directly and expects the server folder to contain modules.
await rm(new URL("../dist/server/og.png", import.meta.url), { force: true });
