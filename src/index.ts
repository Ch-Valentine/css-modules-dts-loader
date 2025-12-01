import { validate } from "schema-utils";
import {
	STYLE_EXT_REGEX,
	SCHEMA,
	DEFAULT_OPTIONS,
	LoaderOptions
} from "./constants.js";
import {
	extractClassNames,
	handleDtsFile,
	generateDtsContent,
	WebpackLogger
} from "./utils.js";
import * as messages from "./messages.js";

/**
 * Webpack loader context interface
 */
interface LoaderContext {
    cacheable?: () => void;
    getLogger: (name: string) => WebpackLogger;
    getOptions: () => LoaderOptions;
    resourcePath: string;
    emitError: (error: Error) => void;
}

/**
 * Webpack/Rspack loader for generating TypeScript declaration files (.d.ts) for CSS Modules.
 *
 * This loader processes CSS modules and automatically generates corresponding TypeScript
 * declaration files. It runs after css-loader and extracts the exported class names to
 * create type-safe imports for TypeScript projects.
 *
 * Key features:
 * - Generates .d.ts files with exported class names
 * - Supports both named exports and interface-based exports
 * - Handles JavaScript reserved keywords as class names
 * - Configurable formatting (camelCase, quotes, indentation)
 * - Verification mode for CI/CD pipelines
 * - Compatible with Webpack 5+ and Rspack
 *
 * @this LoaderContext - The Webpack loader context with access to compiler APIs
 * @param source - The CSS module source code from css-loader (string or Buffer)
 * @returns The unmodified source (this loader doesn't transform the CSS)
 *
 * @example
 * ```js
 * // webpack.config.js
 * module.exports = {
 *   module: {
 *     rules: [{
 *       test: /\.module\.css$/,
 *       use: [
 *         'style-loader',
 *         {
 *           loader: 'css-modules-dts-loader',
 *           options: {
 *             namedExport: true,
 *             camelCase: true,
 *             mode: 'emit'
 *           }
 *         },
 *         {
 *           loader: 'css-loader',
 *           options: {
 *             modules: { namedExport: true }
 *           }
 *         }
 *       ]
 *     }]
 *   }
 * };
 * ```
 *
 * @see {@link https://webpack.js.org/api/loaders/ Webpack Loader API}
 * @see {@link https://github.com/Ch-Valentine/css-modules-dts-loader Repository}
 */
export default function cssModuleTypesLoader(this: LoaderContext, source: string | Buffer): string | Buffer {
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
}
