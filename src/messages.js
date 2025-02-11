/**
 * Error and info message templates for the loader.
 */

exports.ERRORS = {
    FILE_NOT_FOUND: (filePath) =>
        `CSS DTS Loader: File "${filePath}" not found. Run build in "emit" mode to create it.`,

    READ_FAILED: (filePath, error) =>
        `CSS Modules d.ts loader: Failed to read file "${filePath}": ${error.message}`,

    WRITE_FAILED: (filePath, error) =>
        `CSS Modules d.ts loader: Failed to write file "${filePath}": ${error.message}`,

    OUTDATED_FILE: (filePath) =>
        `CSS Modules d.ts loader: File "${filePath}" is outdated. Run build in "emit" mode to update it.`
};

exports.INFO = {
    VERIFICATION_SUCCESS: (filePath) =>
        `Verification successful: file "${filePath}" is up to date.`,

    GENERATION_SUCCESS: (filePath) =>
        `Generated .d.ts file: "${filePath}"`
};
