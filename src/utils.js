/**
 * Utility functions for CSS Modules DTS loader.
 */
const { CSS_MODULE_PATTERNS, EXPORT_MARKERS } = require('./constants');

/**
 * Normalizes line endings to LF (Unix style) to ensure consistent comparisons.
 *
 * @param {string} text - The text to normalize.
 * @returns {string} - The text with normalized line endings.
 */
exports.enforceLFLineSeparators = (text) => typeof text === "string"
    ? text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
    : text;

/**
 * Converts kebab-case to camelCase.
 *
 * @param {string} name - The string to convert.
 * @returns {string} - The camelCased string.
 */
exports.toCamelCase = (name) => name.replace(/-([a-z])/g, (_, p1) => p1.toUpperCase());

/**
 * Determines the CSS loader version and export format based on source content.
 *
 * @param {string} source - The CSS module source code
 * @returns {{ startIndex: number, isNamedExport: boolean }} Export format information
 */
function detectExportFormat(source) {
    const match = EXPORT_MARKERS.find(marker => source.includes(marker.pattern));

    return {
        startIndex: match ? source.indexOf(match.pattern) : -1,
        isNamedExport: match?.isNamedExport || false
    };
}

/**
 * Extracts class names from a CSS module local export.
 * Supports multiple CSS loader versions (v3, v4, v5) and different export formats.
 *
 * @param {string | Buffer} source - The CSS module source code
 * @returns {string[]} Array of exported class names
 */
exports.extractClassNames = function extractClassNames(source) {
    const sourceString = Buffer.isBuffer(source) ? source.toString('utf8') : source;
    const { startIndex, isNamedExport } = detectExportFormat(sourceString);

    if (startIndex === -1) {
        return [];
    }

    const relevantSource = sourceString.slice(startIndex);
    const pattern = isNamedExport ? CSS_MODULE_PATTERNS.NAMED_EXPORT : CSS_MODULE_PATTERNS.OBJECT_EXPORT;
    const classes = [];
    let match;

    while ((match = pattern.exec(relevantSource)) !== null) {
        classes.push(match[1]);
    }

    return classes;
};

/**
 * Handles the generation or verification of the .d.ts file.
 *
 * @param {object} params - Parameters object
 * @param {string} params.dtsFilePath - Path to the .d.ts file
 * @param {string} params.dtsContent - Content to write or verify
 * @param {string} params.mode - "emit" to generate the file or "verify" to check its contents
 * @param {object} params.logger - Logger instance
 * @param {function} params.emitError - Function to emit errors
 * @param {object} messages - Message templates object
 */
exports.handleDtsFile = ({ dtsFilePath, dtsContent, mode, logger, emitError }, messages) => {
    const { enforceLFLineSeparators } = exports;
    const fs = require("fs");

    if (mode === "verify") {
        if (!fs.existsSync(dtsFilePath)) {
            emitError(new Error(messages.ERRORS.FILE_NOT_FOUND(dtsFilePath)));
            return;
        }

        let existingContent;
        try {
            existingContent = fs.readFileSync(dtsFilePath, "utf8");
        } catch (error) {
            emitError(new Error(messages.ERRORS.READ_FAILED(dtsFilePath, error)));
            return;
        }

        if (enforceLFLineSeparators(existingContent) !== enforceLFLineSeparators(dtsContent)) {
            emitError(new Error(messages.ERRORS.OUTDATED_FILE(dtsFilePath)));
        } else {
            return;
        }
    } else {
        try {
            fs.writeFileSync(dtsFilePath, dtsContent, "utf8");
        } catch (error) {
            emitError(new Error(messages.ERRORS.WRITE_FAILED(dtsFilePath, error)));
        }
    }
};

/**
 * Generates the content for a .d.ts file.
 *
 * @param {object} params - Parameters object
 * @param {string[]} params.classNames - Array of class names
 * @param {object} params.options - Loader options
 * @returns {string} - Generated .d.ts file content
 */
exports.generateDtsContent = ({ classNames, options }) => {
    const { toCamelCase } = exports;

    const baseClassNames = options.camelCase
        ? classNames.map(toCamelCase)
        : classNames;

    const processedClassNames = options.sort
        ? [...baseClassNames].sort((a, b) => a.localeCompare(b))
        : baseClassNames;

    const quoteChar = options.quote === "single" ? "'" : "\"";
    const indent = options.indentStyle === "tab"
        ? "\t"
        : " ".repeat(options.indentSize);

    const content = [];
    
    if (options.banner) {
        content.push(...options.banner.split('\n'));
    }

    if (options.namedExport) {
        content.push(...processedClassNames.map(cls => `export const ${cls}: string;`));
    } else {
        content.push(
            "interface CssExports {",
            ...processedClassNames.map((cls) => `${indent}${quoteChar}${cls}${quoteChar}: string;`),
            "}",
            "",
            "export const cssExports: CssExports;",
            "export default cssExports;"
        );
    }

    return content.join('\n') + '\n';
};
