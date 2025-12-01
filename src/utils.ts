/**
 * Utility functions for CSS Modules DTS loader.
 */
import { CSS_MODULE_PATTERNS, EXPORT_MARKERS, JS_KEYWORDS, LoaderOptions } from "./constants.js";
import { readFileSync, writeFileSync, existsSync } from "fs";

/**
 * Logger interface from Webpack
 */
export interface WebpackLogger {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	info(...args: any[]): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	warn(...args: any[]): void;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	error(...args: any[]): void;
}

/**
 * Handle DTS file parameters
 */
export interface HandleDtsFileParams {
    dtsFilePath: string;
    dtsContent: string;
    mode: "emit" | "verify";
    logger: WebpackLogger;
    emitError: (error: Error) => void;
}

/**
 * Generate DTS content parameters
 */
export interface GenerateDtsContentParams {
    classNames: string[];
    options: Required<LoaderOptions>;
}

/**
 * Messages interface
 */
export interface Messages {
    ERRORS: {
        FILE_NOT_FOUND: (filePath: string) => string;
        READ_FAILED: (filePath: string, error: Error) => string;
        WRITE_FAILED: (filePath: string, error: Error) => string;
        OUTDATED_FILE: (filePath: string) => string;
    };
}

/**
 * Normalizes line endings to LF (Unix style) to ensure consistent comparisons.
 * This is crucial for cross-platform compatibility when comparing generated files.
 *
 * @param text - The text to normalize
 * @returns The text with all line endings converted to LF (\n)
 *
 * @example
 * ```ts
 * enforceLFLineSeparators("Hello\r\nWorld") // Returns "Hello\nWorld"
 * enforceLFLineSeparators("Hello\rWorld")   // Returns "Hello\nWorld"
 * ```
 */
export const enforceLFLineSeparators = (text: string): string => typeof text === "string"
	? text.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
	: text;

/**
 * Converts kebab-case strings to camelCase.
 * Used when the camelCase option is enabled to transform CSS class names.
 *
 * @param name - The kebab-case string to convert
 * @returns The camelCased string
 *
 * @example
 * ```ts
 * toCamelCase("my-class-name")  // Returns "myClassName"
 * toCamelCase("button-primary") // Returns "buttonPrimary"
 * ```
 */
export const toCamelCase = (name: string): string => name.replace(/-([a-z])/g, (_, p1) => p1.toUpperCase());

/**
 * Determines the CSS loader version and export format based on source content.
 * Supports css-loader versions 3, 4, and 5 with different export formats.
 *
 * @param source - The CSS module source code from css-loader
 * @returns Object containing the start index of exports and whether it uses named exports
 * @returns Returns {startIndex: -1, isNamedExport: false} if no export format is detected
 *
 * @internal
 */
function detectExportFormat(source: string): { startIndex: number; isNamedExport: boolean } {
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
 * This function handles:
 * - Named exports (css-loader with modules.namedExport: true)
 * - Object exports (css-loader with modules.namedExport: false)
 * - JavaScript keywords as class names (e.g., "class", "export")
 * - Aliased exports for reserved keywords
 *
 * @param source - The CSS module source code from css-loader, can be string or Buffer
 * @returns Array of exported class names, empty array if no exports found
 *
 * @example
 * ```ts
 * // Named export format (css-loader v5+)
 * const source = 'export var button = "btn_123";';
 * extractClassNames(source); // Returns ["button"]
 *
 * // Object export format (css-loader v4)
 * const source = '___CSS_LOADER_EXPORT___.locals = { "button": "btn_123" };';
 * extractClassNames(source); // Returns ["button"]
 * ```
 */
export function extractClassNames(source: string | Buffer): string[] {
	const sourceString = Buffer.isBuffer(source) ? source.toString("utf8") : source;
	const { startIndex, isNamedExport } = detectExportFormat(sourceString);

	if (startIndex === -1) {
		return [];
	}

	const relevantSource = sourceString.slice(startIndex);
	const classes: string[] = [];
	let match: RegExpExecArray | null;

	if (isNamedExport) {
		// Extract regular named exports: export var foo = "...";
		const namedPattern = CSS_MODULE_PATTERNS.NAMED_EXPORT;
		while ((match = namedPattern.exec(relevantSource)) !== null) {
			classes.push(match[1]);
		}

		// Extract aliased exports for JS keywords: export { _1 as "class" };
		const aliasedPattern = CSS_MODULE_PATTERNS.ALIASED_EXPORT;
		while ((match = aliasedPattern.exec(relevantSource)) !== null) {
			classes.push(match[1]);
		}
	} else {
		// Extract object property names: "foo": "..."
		const objectPattern = CSS_MODULE_PATTERNS.OBJECT_EXPORT;
		while ((match = objectPattern.exec(relevantSource)) !== null) {
			classes.push(match[1]);
		}
	}

	return classes;
}

/**
 * Handles the generation or verification of the .d.ts file.
 *
 * In "emit" mode, writes the generated .d.ts content to disk.
 * In "verify" mode, checks if the existing .d.ts file matches the generated content.
 *
 * @param params - Parameters object containing file path, content, mode, logger, and error emitter
 * @param params.dtsFilePath - The absolute path where the .d.ts file should be written
 * @param params.dtsContent - The generated TypeScript declaration content
 * @param params.mode - Either "emit" (write file) or "verify" (check existing file)
 * @param params.logger - Webpack logger instance (currently unused, prefixed with _ to avoid lint warnings)
 * @param params.emitError - Function to emit errors through Webpack's error system
 * @param messages - Message templates object for error messages
 *
 * @throws Will emit an error through emitError if:
 * - In verify mode: file doesn't exist, can't be read, or content doesn't match
 * - In emit mode: file can't be written
 *
 * @example
 * ```ts
 * // Emit mode - writes file
 * handleDtsFile({
 *   dtsFilePath: "/path/to/styles.css.d.ts",
 *   dtsContent: "export const button: string;",
 *   mode: "emit",
 *   logger: webpackLogger,
 *   emitError: (err) => console.error(err)
 * }, messages);
 *
 * // Verify mode - checks existing file
 * handleDtsFile({
 *   dtsFilePath: "/path/to/styles.css.d.ts",
 *   dtsContent: "export const button: string;",
 *   mode: "verify",
 *   logger: webpackLogger,
 *   emitError: (err) => console.error(err)
 * }, messages);
 * ```
 */
export function handleDtsFile({ dtsFilePath, dtsContent, mode, logger: _logger, emitError }: HandleDtsFileParams, messages: Messages): void {
	if (mode === "verify") {
		if (!existsSync(dtsFilePath)) {
			emitError(new Error(messages.ERRORS.FILE_NOT_FOUND(dtsFilePath)));
			return;
		}

		let existingContent: string;
		try {
			existingContent = readFileSync(dtsFilePath, "utf8");
		} catch (error) {
			emitError(new Error(messages.ERRORS.READ_FAILED(dtsFilePath, error as Error)));
			return;
		}

		if (enforceLFLineSeparators(existingContent) !== enforceLFLineSeparators(dtsContent)) {
			emitError(new Error(messages.ERRORS.OUTDATED_FILE(dtsFilePath)));
		} else {
			return;
		}
	} else {
		try {
			writeFileSync(dtsFilePath, dtsContent, "utf8");
		} catch (error) {
			emitError(new Error(messages.ERRORS.WRITE_FAILED(dtsFilePath, error as Error)));
		}
	}
}

/**
 * Generates the content for a .d.ts file based on extracted CSS class names and options.
 *
 * This function performs several transformations:
 * 1. Applies camelCase conversion if enabled
 * 2. Sorts class names alphabetically if enabled
 * 3. Checks for JavaScript reserved keywords in class names
 * 4. Chooses appropriate export format based on options and keyword detection
 * 5. Formats the output with custom indentation and quotes
 *
 * Export format selection:
 * - If namedExport=true and no keywords: generates named exports (export const foo: string;)
 * - If namedExport=true but has keywords: falls back to interface + export = (for compatibility)
 * - If namedExport=false: generates interface + default export
 *
 * @param params - Parameters object
 * @param params.classNames - Array of CSS class names extracted from the module
 * @param params.options - Loader options (camelCase, quote, indentStyle, etc.)
 * @returns Generated TypeScript declaration file content with trailing newline
 *
 * @example
 * ```ts
 * // Named exports (no keywords)
 * generateDtsContent({
 *   classNames: ["button", "container"],
 *   options: { namedExport: true, quote: "double", ... }
 * });
 * // Returns:
 * // export const button: string;
 * // export const container: string;
 *
 * // Interface format (with keywords)
 * generateDtsContent({
 *   classNames: ["class", "button"],
 *   options: { namedExport: true, quote: "double", ... }
 * });
 * // Returns:
 * // interface CssExports {
 * //   "class": string;
 * //   "button": string;
 * // }
 * // export const cssExports: CssExports;
 * // export = cssExports;
 * ```
 */
export function generateDtsContent({ classNames, options }: GenerateDtsContentParams): string {

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

	const content: string[] = [];

	if (options.banner) {
		content.push(...options.banner.split("\n"));
	}

	// Check if any class names are JS keywords
	const hasKeywords = processedClassNames.some(cls => JS_KEYWORDS.has(cls));

	// If namedExport is requested but we have keywords, fall back to interface format
	// because we can't use keywords as named exports (e.g., export const class: string;)
	const useNamedExport = options.namedExport && !hasKeywords;

	if (useNamedExport) {
		content.push(...processedClassNames.map(cls => `export const ${cls}: string;`));
	} else {
		content.push(
			"interface CssExports {",
			...processedClassNames.map((cls) => `${indent}${quoteChar}${cls}${quoteChar}: string;`),
			"}",
			""
		);

		// When we have keywords, use 'export =' to export all properties
		// This allows importing like: import styles from './file.css'
		// and accessing keywords like: styles.class
		if (hasKeywords) {
			content.push(
				"export const cssExports: CssExports;",
				"export = cssExports;"
			);
		} else {
			content.push(
				"export const cssExports: CssExports;",
				"export default cssExports;"
			);
		}
	}

	return content.join("\n") + "\n";
}
