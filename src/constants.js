/**
 * Regular expressions for matching CSS module and style file extensions.
 */
exports.STYLE_EXT_REGEX = /\.(css|postcss|pcss|scss|sass|less|styl|sss)$/;

/**
 * Schema for loader options validation.
 */
exports.SCHEMA = {
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
 * Default options for the loader.
 */
exports.DEFAULT_OPTIONS = {
    camelCase: false,
    quote: "double",
    indentStyle: "space",
    indentSize: 2,
    mode: "emit",
    sort: false
};

/**
 * Regular expressions for matching different CSS module export formats.
 */
exports.CSS_MODULE_PATTERNS = {
    OBJECT_EXPORT: /"([^"\\/;()\n]+)":/g,
    NAMED_EXPORT: /export (?:var|const) (\w+) =/g
};

/**
 * Export format markers for different CSS loader versions.
 */
exports.EXPORT_MARKERS = [
    { pattern: '___CSS_LOADER_EXPORT___.locals = {', isNamedExport: false },
    { pattern: 'export var ', isNamedExport: true },
    { pattern: 'export const ', isNamedExport: true },
    { pattern: 'module.exports = {', isNamedExport: false },
    { pattern: 'exports.locals = {', isNamedExport: false }
];
