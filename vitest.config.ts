import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        setupFiles: [
            "./tests/setup/env.ts",
            "./tests/setup/sessionMock.ts",
            "./tests/setup/cleanup.ts",
        ],
        fileParallelism: false,
        testTimeout: 30000,
    },
});
