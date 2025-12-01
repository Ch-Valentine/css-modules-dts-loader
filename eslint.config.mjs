import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import vitest from "@vitest/eslint-plugin";
import globals from "globals";

/** @type {import('eslint').Linter.Config[]} */
export default [
	// Ignore patterns
	{
		ignores: ["dist/**", "node_modules/**", "coverage/**", "**/*.d.ts"]
	},

	// Base JavaScript config for all files
	{
		files: ["**/*.{js,mjs,cjs,ts}"],
		...pluginJs.configs.recommended,
		languageOptions: {
			ecmaVersion: "latest",
			sourceType: "module",
			globals: {
				...globals.node,
				...globals.es2021
			}
		},
		rules: {
			"quotes": ["error", "double", { "avoidEscape": true }],
			"indent": ["error", "tab", { "SwitchCase": 1 }],
			"no-tabs": "off",
			"no-mixed-spaces-and-tabs": "error",
			"no-unused-vars": ["warn", {
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_"
			}]
		}
	},

	// TypeScript source files - strict rules
	{
		files: ["src/**/*.ts"],
		ignores: ["**/*.test.ts"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				project: "./tsconfig.json"
			}
		},
		plugins: {
			"@typescript-eslint": tseslint
		},
		rules: {
			...tseslint.configs.recommended.rules,
			"@typescript-eslint/no-explicit-any": "warn",
			"@typescript-eslint/explicit-function-return-type": "off",
			"@typescript-eslint/no-unused-vars": ["warn", {
				"argsIgnorePattern": "^_",
				"varsIgnorePattern": "^_"
			}],
			"no-unused-vars": "off" // Use TypeScript version instead
		}
	},

	// Test files - relaxed rules
	{
		files: ["**/*.test.{js,ts}", "test/**/*.{js,ts}"],
		languageOptions: {
			parser: tsparser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module"
			}
		},
		plugins: {
			vitest
		},
		rules: {
			...vitest.configs.recommended.rules,
			"vitest/expect-expect": "warn",
			"vitest/no-disabled-tests": "off", // Allow .skip() for tests requiring extra loaders
			"@typescript-eslint/no-explicit-any": "off",
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off"
		}
	},

	// Config files - relaxed rules
	{
		files: ["*.config.{js,mjs,cjs,ts}", "eslint.config.mjs"],
		rules: {
			"no-unused-vars": "off",
			"@typescript-eslint/no-unused-vars": "off",
			"no-undef": "off"
		}
	}
];
