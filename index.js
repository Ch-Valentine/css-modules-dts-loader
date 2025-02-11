// css-dts-loader.js
const fs = require("fs");
const { validate } = require("schema-utils");

// --- Constants ---
const CSS_MODULE_EXT_REGEX = /\.module\.(css|postcss|pcss|scss|sass|less|styl|sss)$/;
const STYLE_EXT_REGEX = /\.(css|postcss|pcss|scss|sass|less|styl|sss)$/;

// --- Helper Functions ---

/**
 * Normalizes line endings to LF (Unix style) to ensure consistent comparisons.
 *
 * @param {string} text - The text to normalize.
 * @returns {string} - The text with normalized line endings.
 */
const enforceLFLineSeparators = (text) => typeof text === "string"
    ? text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    : text;

/**
 * Converts kebab-case to camelCase.
 *
 * @param {string} name - The string to convert.
 * @returns {string} - The camelCased string.
 */
const toCamelCase = (name) => name.replace(/-([a-z])/g, (_, p1) => p1.toUpperCase());

/**
 * Validates loader options against the schema.
 */
const schema = {
    type: "object",
    properties: {
        camelCase: { type: "boolean" },
        quote: { type: "string", enum: ["single", "double"] },
        indentStyle: { type: "string", enum: ["tab", "space"] },
        indentSize: { type: "number" },
        mode: { type: "string", enum: ["emit", "verify"] },
        sort: { type: "boolean" }
    },
    additionalProperties: false
};

/**
 * Extracts class names from a CSS module export.
 *
 * @param {string} source - The CSS module source code.
 * @returns {string[]} - Array of exported class names.
 */
const extractClassNamesFromSource = (source) => {
    const regex = /export\s+(?:var|let|const)\s+(\w+)\s*=/g;
    return Array.from(source.matchAll(regex), (match) => match[1]);
};

/**
 * Handles the generation or verification of the .d.ts file.
 *
 * @param {string} dtsFilePath - Path to the .d.ts file.
 * @param {string} dtsContent - Content to write or verify.
 * @param {string} mode - "emit" to generate the file or "verify" to check its contents.
 * @param {object} logger - Logger instance.
 * @param {function} emitError - Function to emit errors.
 */
function handleDtsFile(dtsFilePath, dtsContent, mode, logger, emitError) {
    if (mode === "verify") {
        if (!fs.existsSync(dtsFilePath)) {
            emitError(
                new Error(
                    `CSS DTS Loader: File "${dtsFilePath}" not found. Run build in "emit" mode to create it.`
                )
            );
            return;
        }
        let existingContent;
        try {
            existingContent = fs.readFileSync(dtsFilePath, "utf8");
        } catch (error) {
            emitError(
                new Error(
                    `CSS DTS Loader: Failed to read file "${dtsFilePath}": ${error.message}`
                )
            );
            return;
        }
        if (
            enforceLFLineSeparators(existingContent)
      !== enforceLFLineSeparators(dtsContent)
        ) {
            emitError(
                new Error(
                    `CSS DTS Loader: File "${dtsFilePath}" is outdated. Run build in "emit" mode to update it.`
                )
            );
        } else {
            logger.info(`Verification successful: file "${dtsFilePath}" is up to date.`);
        }
    } else {
        try {
            fs.writeFileSync(dtsFilePath, dtsContent, "utf8");
            logger.info(`Generated .d.ts file: "${dtsFilePath}"`);
        } catch (error) {
            emitError(
                new Error(
                    `CSS DTS Loader: Failed to write file "${dtsFilePath}": ${error.message}`
                )
            );
        }
    }
}

// --- Main Loader Function ---

/**
 * Webpack loader for generating CSS module type declarations (.css.d.ts)
 * based on CSS content.
 *
 * Options:
 *  - camelCase: Convert class names to camelCase (false by default).
 *  - quote: Style of quotes for keys ("double" by default).
 *  - indentStyle: "tab" or "space" ("space" by default).
 *  - indentSize: Number of spaces (2 by default, if indentStyle is "space").
 *  - mode: "emit" (generate file) or "verify" (check file correctness).
 *  - sort: Sort class names alphabetically (false by default).
 *
 * @param {string} source - The CSS module source code.
 * @returns {string} - Unmodified source.
 */
module.exports = function cssModuleTypesLoader(source) {
    // Enable caching if supported (Webpack 5 has caching enabled by default)
    if (this.cacheable) {
        this.cacheable();
    }

    const logger = this.getLogger("css-dts-loader");
    const options = this.getOptions() || {};

    validate(schema, options, {
        name: "CSS DTS Loader",
        baseDataPath: "options"
    });

    const opts = {
        camelCase: false,
        quote: "double",
        indentStyle: "space",
        indentSize: 2,
        mode: "emit",
        sort: false,
        ...options
    };

    let classNames = [];

    if (CSS_MODULE_EXT_REGEX.test(this.resourcePath)) {
        classNames = extractClassNamesFromSource(source);
    }

    if (!classNames.length) {
        classNames = extractClassNamesFromSource(source);
    }

    const baseClassNames = opts.camelCase
        ? classNames.map(toCamelCase)
        : classNames;

    // Create sorted or unsorted array without mutation
    const processedClassNames = opts.sort
        // eslint-disable-next-line fp/no-mutating-methods
        ? [...baseClassNames].sort((a, b) => a.localeCompare(b))
        : baseClassNames;

    const quoteChar = opts.quote === "single" ? "'" : "\"";
    const indent = opts.indentStyle === "tab"
        ? "\t"
        : " ".repeat(opts.indentSize);

    const dtsContent = [
        "// This file is automatically generated.",
        "// Please do not change this file!",
        "interface CssExports {",
        ...processedClassNames.map((cls) => `${indent}${quoteChar}${cls}${quoteChar}: string;`),
        "}",
        "",
        "export const cssExports: CssExports;",
        "export default cssExports;",
        ""
    ].join("\n");

    const dtsFilePath = this.resourcePath.replace(STYLE_EXT_REGEX, ".$1.d.ts");

    // Handle file generation or verification.
    handleDtsFile(dtsFilePath, dtsContent, opts.mode, logger, this.emitError.bind(this));

    return source;
};
