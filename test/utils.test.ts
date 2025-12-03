import { describe, test, expect } from "vitest";
import { extractClassNames, handleDtsFile, generateDtsContent } from "../src/utils";
import * as messages from "../src/messages";

describe("utils", () => {
	describe("extractClassNames", () => {
		test("should extract class names from CSS modules using named exports", () => {
			const source = `// Imports
        import ___CSS_LOADER_API_SOURCEMAP_IMPORT___ from "../../../../../node_modules/.pnpm/css-loader@7.1.2_webpack@5.97.1/node_modules/css-loader/dist/runtime/sourceMaps.js";
        import ___CSS_LOADER_API_IMPORT___ from "../../../../../node_modules/.pnpm/css-loader@7.1.2_webpack@5.97.1/node_modules/css-loader/dist/runtime/api.js";
        var ___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(___CSS_LOADER_API_SOURCEMAP_IMPORT___);
        // Module
        ___CSS_LOADER_EXPORT___.push([module.id, ':root, :host {
            --base-unit: 0.25rem;
        }
        :root, :host {
            --silver: #d8d8d8;
        }
        .styles-module__contentRow___hmIljKEcM6QoGjgBbIu9 {
            margin-bottom: calc(0.25rem * 4);
        }
        .styles-module__selectedItems___mE8ogdP_jZ99yzImOCwk {
            display: flex;
            flex-direction: column;
        }
        .styles-module__content___v2Z0AxFdXA7B6PVqNRPy {
            display: flex;
            justify-content: space-between;
            overflow-x: hidden;
            overflow-y: auto;
        }
        .styles-module__list___PdkLGOpTdOdUM7mLl76F {
            flex-basis: 48%;
            margin: 0;
        }
        // Exports
        ___CSS_LOADER_EXPORT___.locals = {
            "contentRow": 'styles-module__contentRow___hmIljKEcM6QoGjgBbIu9',
            "selectedItems": 'styles-module__selectedItems___mE8ogdP_jZ99yzImOCwk',
            "content": 'styles-module__content___v2Z0AxFdXA7B6PVqNRPy',
            "list": 'styles-module__list___PdkLGOpTdOdUM7mLl76F'
        };
        export default ___CSS_LOADER_EXPORT___;`

			expect(extractClassNames(source)).toEqual([
				"contentRow",
				"selectedItems",
				"content",
				"list"
			]);
		});

		test("should extract class names from CSS modules using locals export", () => {
			const source = `// Imports
            import ___CSS_LOADER_API_SOURCEMAP_IMPORT___ from "../../../../../node_modules/.pnpm/css-loader@7.1.2_webpack@5.97.1/node_modules/css-loader/dist/runtime/sourceMaps.js";
            import ___CSS_LOADER_API_IMPORT___ from "../../../../../node_modules/.pnpm/css-loader@7.1.2_webpack@5.97.1/node_modules/css-loader/dist/runtime/api.js";
            var ___CSS_LOADER_EXPORT___ = ___CSS_LOADER_API_IMPORT___(___CSS_LOADER_API_SOURCEMAP_IMPORT___);
            // Module
            ___CSS_LOADER_EXPORT___.push([module.id, ':root, :host {
                --base-unit: 0.25rem;
            }
            :root, :host {
                --silver: #d8d8d8;
            }
            .styles-module__contentRow___hmIljKEcM6QoGjgBbIu9 {
                margin-bottom: calc(0.25rem * 4);
            }
            .styles-module__selectedItems___mE8ogdP_jZ99yzImOCwk {
                display: flex;
                flex-direction: column;
            }
            .styles-module__content___v2Z0AxFdXA7B6PVqNRPy {
                display: flex;
                justify-content: space-between;
                overflow-x: hidden;
                overflow-y: auto;
            }
            .styles-module__list___PdkLGOpTdOdUM7mLl76F {
                flex-basis: 48%;
                margin: 0;
            }

            // Exports
            export var contentRow = 'styles-module__contentRow___hmIljKEcM6QoGjgBbIu9';
            export var selectedItems = 'styles-module__selectedItems___mE8ogdP_jZ99yzImOCwk';
            export var content = 'styles-module__content___v2Z0AxFdXA7B6PVqNRPy';
            export var list = 'styles-module__list___PdkLGOpTdOdUM7mLl76F';
            export default ___CSS_LOADER_EXPORT___;
        `;

			expect(extractClassNames(source)).toEqual([
				"contentRow",
				"selectedItems",
				"content",
				"list"
			]);
		});

		test("should return empty array for invalid source", () => {
			expect(extractClassNames("invalid source")).toEqual([]);
		});

		test("should handle Buffer input", () => {
			const source = Buffer.from("export var test = \"test-class\";");
			expect(extractClassNames(source)).toEqual(["test"]);
		});

		test("should extract class names when they are JS keywords (named export format)", () => {
			// This is what css-loader outputs when class names are JS keywords
			const source = `
            // Module
            ___CSS_LOADER_EXPORT___.push([module.id, '.class { color: blue; } .export { color: red; }', ""]);
            // Exports
            export { _1 as "class" };
            export { _2 as "export" };
            export var validName = "styles-module__validName___abc123";
            `;

			const result = extractClassNames(source);
			// Should contain all class names (order may vary based on extraction)
			expect(result).toHaveLength(3);
			expect(result).toContain("class");
			expect(result).toContain("export");
			expect(result).toContain("validName");
		});

		test("should extract class names when they are JS keywords (object export format)", () => {
			// This is what css-loader outputs for object exports with keywords
			const source = `
            // Module
            ___CSS_LOADER_EXPORT___.push([module.id, '.class { color: blue; }', ""]);
            // Exports
            ___CSS_LOADER_EXPORT___.locals = {
                "class": "styles-module__class___abc123",
                "export": "styles-module__export___def456",
                "validName": "styles-module__validName___ghi789"
            };
            `;

			expect(extractClassNames(source)).toEqual([
				"class",
				"export",
				"validName"
			]);
		});
	});

	describe("handleDtsFile", () => {
		test("should handle write errors in emit mode", () => {
			const mockLogger = {
				info: () => {},
				warn: () => {},
				error: () => {}
			};
			const errors: Error[] = [];
			const mockEmitError = (error: Error) => errors.push(error);

			// Create a fake file path that doesn't exist
			const dtsFilePath = "/nonexistent/path/test.d.ts";
			const dtsContent = "export const test: string;";

			// This should trigger a write error
			handleDtsFile({
				dtsFilePath,
				dtsContent,
				mode: "emit",
				logger: mockLogger,
				emitError: mockEmitError
			}, messages);

			// In emit mode with invalid path, we should get a write error
			expect(errors.length).toBeGreaterThan(0);
		});
	});

	describe("generateDtsContent", () => {
		test("should generate content with custom banner", () => {
			const result = generateDtsContent({
				classNames: ["test"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Custom banner\n// Line 2"
				}
			});

			expect(result).toContain("// Custom banner");
			expect(result).toContain("// Line 2");
			expect(result).toContain("export const test: string;");
		});

		test("should use aliased exports for keywords when namedExport=true", () => {
			const result = generateDtsContent({
				classNames: ["class", "export", "validName"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Test",
					keywordPrefix: "__dts_"
				}
			});

			// Should export non-keyword classes normally
			expect(result).toContain("export const validName: string;");

			// Should NOT export keywords as named exports directly
			expect(result).not.toContain("export const class");
			expect(result).not.toContain("export const export");

			// Should use aliased exports for keywords
			expect(result).toContain("declare const __dts_class: string;");
			expect(result).toContain("declare const __dts_export: string;");
			expect(result).toContain('export { __dts_class as "class" };');
			expect(result).toContain('export { __dts_export as "export" };');

			expect(result).not.toContain("interface");
		});

		test("should use default export when namedExport=false and no keywords", () => {
			const result = generateDtsContent({
				classNames: ["foo", "bar"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "single",
					indentStyle: "tab",
					indentSize: 2,
					sort: false,
					namedExport: false,
					mode: "emit",
					banner: "// Test"
				}
			});

			expect(result).toContain("interface CssExports");
			expect(result).toContain("'foo'");
			expect(result).toContain("'bar'");
			expect(result).toContain("export default cssExports;");
			expect(result).not.toContain("export = cssExports;");
		});

		test("should sort class names when sort option is true", () => {
			const result = generateDtsContent({
				classNames: ["zebra", "alpha", "beta"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: true,
					namedExport: true,
					mode: "emit",
					banner: "// Test"
				}
			});

			const lines = result.split("\n");
			const exportLines = lines.filter(l => l.startsWith("export const"));

			expect(exportLines.length).toBe(3);
			expect(exportLines[0]).toContain("alpha");
			expect(exportLines[1]).toContain("beta");
			expect(exportLines[2]).toContain("zebra");
		});

		test("should apply camelCase transformation with camel-case-only", () => {
			const result = generateDtsContent({
				classNames: ["kebab-case-name", "another-class"],
				options: {
					exportLocalsConvention: "camel-case-only",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Test"
				}
			});

			expect(result).toContain("kebabCaseName");
			expect(result).toContain("anotherClass");
			expect(result).not.toContain("kebab-case-name");
		});

		test("should handle collision with __dts_ prefix (class name starting with __dts_)", () => {
			const result = generateDtsContent({
				classNames: ["__dts_class", "class", "normalClass"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Test",
					keywordPrefix: "__dts_"
				}
			});

			// Normal classes should export normally
			expect(result).toContain("export const normalClass: string;");
			expect(result).toContain("export const __dts_class: string;");

			// Keywords should use aliased exports (potentially colliding with existing class)
			expect(result).toContain("declare const __dts_class: string;");
			expect(result).toContain('export { __dts_class as "class" };');

			// Note: In this edge case, there will be both:
			// - export const __dts_class (for the actual CSS class named __dts_class)
			// - declare const __dts_class (for aliasing the keyword "class")
			// This will cause a TypeScript error, but it's an extremely unlikely edge case
			// where users are intentionally naming classes with the __dts_ prefix
		});

		test("should use custom keywordPrefix (dts) when specified", () => {
			const result = generateDtsContent({
				classNames: ["class", "export", "validName"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Test",
					keywordPrefix: "dts"
				}
			});

			// Should export non-keyword classes normally
			expect(result).toContain("export const validName: string;");

			// Should use custom prefix for keywords
			expect(result).toContain("declare const dtsclass: string;");
			expect(result).toContain("declare const dtsexport: string;");
			expect(result).toContain('export { dtsclass as "class" };');
			expect(result).toContain('export { dtsexport as "export" };');

			// Should NOT use default __dts_ prefix
			expect(result).not.toContain("__dts_class");
			expect(result).not.toContain("__dts_export");
		});

		test("should use custom keywordPrefix with underscores", () => {
			const result = generateDtsContent({
				classNames: ["class", "import"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Test",
					keywordPrefix: "my_prefix_"
				}
			});

			expect(result).toContain("declare const my_prefix_class: string;");
			expect(result).toContain("declare const my_prefix_import: string;");
			expect(result).toContain('export { my_prefix_class as "class" };');
			expect(result).toContain('export { my_prefix_import as "import" };');
		});

		test("should use custom keywordPrefix with camelCase style", () => {
			const result = generateDtsContent({
				classNames: ["class", "for"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Test",
					keywordPrefix: "dtsKeyword"
				}
			});

			expect(result).toContain("declare const dtsKeywordclass: string;");
			expect(result).toContain("declare const dtsKeywordfor: string;");
			expect(result).toContain('export { dtsKeywordclass as "class" };');
			expect(result).toContain('export { dtsKeywordfor as "for" };');
		});

		test("should not affect interface export mode (namedExport=false)", () => {
			const result = generateDtsContent({
				classNames: ["class", "export", "normal"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: false,
					mode: "emit",
					banner: "// Test",
					keywordPrefix: "customPrefix"
				}
			});

			// Interface mode should not use keyword prefix at all
			expect(result).toContain("interface CssExports");
			expect(result).toContain('"class"');
			expect(result).toContain('"export"');
			expect(result).toContain('"normal"');
			expect(result).not.toContain("customPrefix");
			expect(result).not.toContain("declare const");
		});

		test("should work with sorted keywords using custom prefix", () => {
			const result = generateDtsContent({
				classNames: ["zebra", "class", "alpha", "export"],
				options: {
					exportLocalsConvention: "as-is",
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: true,
					namedExport: true,
					mode: "emit",
					banner: "// Test",
					keywordPrefix: "dts"
				}
			});

			const lines = result.split("\n");
			const exportLines = lines.filter(l => l.startsWith("export const"));
			const declareLines = lines.filter(l => l.startsWith("declare const"));
			const aliasedLines = lines.filter(l => l.startsWith("export {"));

			// Normal classes should be sorted
			expect(exportLines[0]).toContain("alpha");
			expect(exportLines[1]).toContain("zebra");

			// Keywords should use custom prefix
			expect(declareLines).toHaveLength(2);
			expect(declareLines[0]).toContain("dtsclass");
			expect(declareLines[1]).toContain("dtsexport");

			expect(aliasedLines[0]).toContain('dtsclass as "class"');
			expect(aliasedLines[1]).toContain('dtsexport as "export"');
		});
	});
});
