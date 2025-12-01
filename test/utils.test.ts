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
					camelCase: false,
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

		test("should fallback to interface when namedExport=true but has keywords", () => {
			const result = generateDtsContent({
				classNames: ["class", "export", "validName"],
				options: {
					camelCase: false,
					quote: "double",
					indentStyle: "space",
					indentSize: 2,
					sort: false,
					namedExport: true,
					mode: "emit",
					banner: "// Test"
				}
			});

			// Should use interface format because of keywords
			expect(result).toContain("interface CssExports");
			expect(result).toContain('"class"');
			expect(result).toContain('"export"');
			expect(result).toContain('"validName"');
			expect(result).toContain("export default cssExports;");
		});

		test("should use default export when namedExport=false and no keywords", () => {
			const result = generateDtsContent({
				classNames: ["foo", "bar"],
				options: {
					camelCase: false,
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
					camelCase: false,
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

			expect(exportLines[0]).toContain("alpha");
			expect(exportLines[1]).toContain("beta");
			expect(exportLines[2]).toContain("zebra");
		});

		test("should apply camelCase transformation", () => {
			const result = generateDtsContent({
				classNames: ["kebab-case-name", "another-class"],
				options: {
					camelCase: true,
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
	});
});
