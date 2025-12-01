/**
 * Error and info message templates for the loader.
 */

export const ERRORS = {
	FILE_NOT_FOUND: (filePath: string): string =>
		`CSS DTS Loader: File "${filePath}" not found. Run build in "emit" mode to create it.`,

	READ_FAILED: (filePath: string, error: Error): string =>
		`CSS Modules d.ts loader: Failed to read file "${filePath}": ${error.message}`,

	WRITE_FAILED: (filePath: string, error: Error): string =>
		`CSS Modules d.ts loader: Failed to write file "${filePath}": ${error.message}`,

	OUTDATED_FILE: (filePath: string): string =>
		`CSS Modules d.ts loader: File "${filePath}" is outdated. Run build in "emit" mode to update it.`
};

export const INFO = {
	VERIFICATION_SUCCESS: (filePath: string): string =>
		`Verification successful: file "${filePath}" is up to date.`,

	GENERATION_SUCCESS: (filePath: string): string =>
		`Generated .d.ts file: "${filePath}"`
};
