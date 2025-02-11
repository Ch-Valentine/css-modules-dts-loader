const { extractClassNames } = require("./utils");

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
            const source = Buffer.from(`export var test = "test-class";`);
            expect(extractClassNames(source)).toEqual(["test"]);
        });
    });
});
