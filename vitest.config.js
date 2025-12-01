import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		coverage: {
			provider: "v8",
			include: ["src/**/*.ts"],
			exclude: ["src/**/*.d.ts", "src/**/*.test.ts"]
		},
		// Vitest doesn't need moduleNameMapper for .css files
		// since our mock is already using ES modules
		alias: {
			"\\.css$": "./test/__mocks__/styleMock.js"
		}
	}
});
