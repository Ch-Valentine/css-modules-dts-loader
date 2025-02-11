# css-modules-dts-loader

A Webpack loader for generating TypeScript declaration files (`.d.ts`) for CSS Modules.

## Overview

**css-modules-dts-loader** automatically generates (or verifies) `.d.ts` files from your CSS Modules. By parsing the CSS module output, it extracts class names, applies optional transformations (such as camelCase conversion or sorting), and produces a corresponding TypeScript declaration file. This enhances type safety and improves the developer experience when using CSS Modules in TypeScript projects.

## Features

- **Automatic Declaration Generation:** Creates `.d.ts` files alongside your CSS files.
- **Verification Mode:** Checks if an existing declaration file is up-to-date.
- **Customizable Formatting:** Options to convert class names to camelCase, choose quote style, set indentation (tabs or spaces), and sort class names.
- **Seamless Webpack Integration:** Easily integrates into your Webpack configuration with minimal setup.
- **Logging and Error Handling:** Uses Webpack's logging and error emission for clear diagnostics.

## Installation

Install via npm:

```bash
npm install --save-dev css-modules-dts-loader
```

## Usage

### Webpack Configuration

Integrate the loader into your Webpack configuration. For example, if you are working with CSS or any supported preprocessor files:

```js
// webpack.config.js
module.exports = {
  // ... other webpack config settings
  module: {
    rules: [
      {
        test: /\.module\.(css|postcss|pcss|scss|sass|less|styl|sss)$/i,
        use: [
          "style-loader",
          {
            loader: "css-modules-dts-loader",
            options: {
              // Convert CSS class names to camelCase (default: false)
              camelCase: true,
              // Quote style: "single" or "double" (default: "double")
              quote: "single",
              // Indentation style: "tab" or "space" (default: "space")
              indentStyle: "space",
              // Number of spaces if indentStyle is "space" (default: 2)
              indentSize: 2,
              // Mode: "emit" to generate or "verify" to check the file (default: "emit")
              mode: isProduction ? "verify" : "emit",
              // Sort the exported class names alphabetically (default: false)
              sort: true
            }
          },
          "css-loader"
        ]
      }
    ]
  }
};
```

### Loader Options

| Option        | Type                       | Default   | Description                                                                                                                                                    |
| ------------- | -------------------------- | --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `camelCase`   | `boolean`                  | `false`   | When set to `true`, converts CSS class names from kebab-case to camelCase in the generated `.d.ts` file.                                                        |
| `quote`       | `"single"` or `"double"`   | `"double"`| Sets the quote style used for keys in the declaration file.                                                                                                     |
| `indentStyle` | `"tab"` or `"space"`       | `"space"` | Determines whether to use tabs or spaces for indentation.                                                                                                       |
| `indentSize`  | `number`                   | `2`       | The number of spaces used for indentation if `indentStyle` is set to `"space"`.                                                                                  |
| `mode`        | `"emit"` or `"verify"`     | `"emit"`  | In `"emit"` mode, the loader writes (or overwrites) the `.d.ts` file. In `"verify"` mode, it checks if the file exists and is up to date, emitting an error if not. |
| `sort`        | `boolean`                  | `false`   | When `true`, sorts the extracted CSS class names alphabetically before generating the declaration file.                                                          |

### How It Works

1. **Caching:**  
   The loader marks its result as cacheable using `this.cacheable()` if supported by Webpack.

2. **Options Validation:**  
   It validates the provided options against a predefined schema (using `schema-utils`) to ensure all options are valid.

3. **Extracting Class Names:**  
   The loader extracts CSS class names from the module source using a regular expression that matches exported variables (e.g., `export const button = ...`).

4. **Processing Class Names:**  
   Depending on the configuration, it may convert the class names to camelCase and/or sort them.

5. **Generating the `.d.ts` Content:**  
   The loader constructs a declaration file with a header comment, an interface defining the class names (using configurable indentation and quotes), and exports the interface.

6. **File Handling:**  
   - In `"emit"` mode, it writes or overwrites the declaration file next to the source file (by replacing the original file extension with `.d.ts`).
   - In `"verify"` mode, it compares the generated content with the existing file and emits an error if discrepancies are found.

7. **Logging and Error Handling:**  
   Webpack’s logging API (`this.getLogger`) and error emission (`this.emitError`) are used to provide clear feedback during the build process.

### Example Output

For a CSS module that exports class names like `button` and `container`, the generated declaration file might look like this:

```ts
// This file is automatically generated.
// Please do not change this file!
interface CssExports {
  'button': string;
  'container': string;
}

export const cssExports: CssExports;
export default cssExports;
```

## Contributing

Contributions, bug reports, and feature requests are welcome! To contribute:

1. Fork the repository.
2. Create a feature branch:
   ```bash
   git checkout -b my-new-feature
   ```
3. Commit your changes:
   ```bash
   git commit -am 'Add some feature'
   ```
4. Push to the branch:
   ```bash
   git push origin my-new-feature
   ```
5. Create a new Pull Request.

Before contributing, please review the [CONTRIBUTING.md](CONTRIBUTING.md) guidelines (if available) for additional details.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and recent changes.

## Support

If you encounter any issues or have questions, please open an issue in the [GitHub repository](https://github.com/Ch-Valentine/css-modules-dts-loader/issues).