const { validate } = require("schema-utils");
const {
    STYLE_EXT_REGEX,
    SCHEMA,
    DEFAULT_OPTIONS
} = require("./constants");
const {
    extractClassNames,
    handleDtsFile,
    generateDtsContent
} = require("./utils");
const messages = require("./messages");

/**
 * Webpack loader for generating CSS module type declarations (.css.d.ts)
 * based on CSS content.
 *
 * @param {string} source - The CSS module source code.
 * @returns {string} - Unmodified source.
 */
module.exports = function cssModuleTypesLoader(source) {
    // Enable caching if supported (Webpack 5 has caching enabled by default)
    if (this.cacheable) {
        this.cacheable();
    }

    const logger = this.getLogger("css-modules-dts-loader");
    const providedOptions = this.getOptions() || {};

    // Validate options against schema
    validate(SCHEMA, providedOptions, {
        name: "CSS Modules d.ts loader",
        baseDataPath: "options"
    });

    // Merge default options with user options
    const options = { ...DEFAULT_OPTIONS, ...providedOptions };

    const classNames = extractClassNames(source);

    // Generate .d.ts file content
    const dtsContent = generateDtsContent({
        classNames,
        options
    });

    // Determine output path
    const dtsFilePath = this.resourcePath.replace(STYLE_EXT_REGEX, ".$1.d.ts");

    // Handle file generation or verification
    handleDtsFile({
        dtsFilePath,
        dtsContent,
        mode: options.mode,
        logger,
        emitError: this.emitError.bind(this)
    }, messages);

    // Return unmodified source
    return source;
};
