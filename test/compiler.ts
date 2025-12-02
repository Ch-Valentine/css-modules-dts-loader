import webpack, { Stats } from "webpack";
import path from "path";
import fs from "fs";
import os from "os";
import { Volume, createFsFromVolume, IFs } from "memfs";
import { fileURLToPath } from "url";
import { dirname } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface CompileProjectOptions {
    files: Record<string, string>;
    loaderOptions?: Record<string, unknown>;
}

interface CompileProjectResult {
    tmpDir: string;
    stats: Stats;
}

/**
 * Compiles a test project with the css-modules-dts-loader
 *
 * @param options - Configuration options for the test compilation
 * @returns Promise resolving to the temporary directory and webpack stats
 */
function compileProject({ files, loaderOptions = {} }: CompileProjectOptions): Promise<CompileProjectResult> {
	// Create a temporary project directory
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "css-dts-test-"));

	// Write all provided files to the temporary directory
	Object.entries(files).forEach(([filePath, content]) => {
		const fullPath = path.join(tmpDir, filePath);
		fs.mkdirSync(path.dirname(fullPath), { recursive: true });
		fs.writeFileSync(fullPath, content, "utf8");
	});

	// Create webpack configuration
	const config: webpack.Configuration = {
		mode: "development",
		context: tmpDir,
		entry: "./index.js",
		output: {
			path: path.join(tmpDir, "dist"),
			filename: "bundle.js"
		},
		resolveLoader: {
			modules: [
				"node_modules",
				path.resolve(__dirname, "../node_modules")
			]
		},
		module: {
			rules: [
				{
					test: /\.css$/,
					use: [
						{
							loader: path.resolve(__dirname, "../dist/index.js"),
							options: loaderOptions
						},
						{
							loader: "css-loader",
							options: {
								modules: {
									// Match css-loader's namedExport with the loader's namedExport option
									namedExport: loaderOptions.namedExport !== false,
									// Match exportLocalsConvention or use appropriate default
									exportLocalsConvention: loaderOptions.exportLocalsConvention ||
										(loaderOptions.namedExport !== false ? "as-is" : "camel-case-only")
								}
							}
						}
					]
				}
			]
		},
		devtool: false,
	};

	// Create a virtual file system
	const vol = new Volume();
	const memfs = createFsFromVolume(vol) as unknown as IFs;

	// Copy files from real fs to memfs
	const copyToMemfs = (dir: string): void => {
		const files = fs.readdirSync(dir);
		files.forEach(file => {
			const fullPath = path.join(dir, file);
			const stat = fs.statSync(fullPath);
			if (stat.isDirectory()) {
				memfs.mkdirSync(fullPath, { recursive: true });
				copyToMemfs(fullPath);
			} else {
				const content = fs.readFileSync(fullPath);
				memfs.mkdirSync(path.dirname(fullPath), { recursive: true });
				memfs.writeFileSync(fullPath, content);
			}
		});
	};

	copyToMemfs(tmpDir);

	// Create compiler instance
	const compiler = webpack(config);
	compiler.outputFileSystem = memfs as webpack.OutputFileSystem;

	return new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (err) {
				return reject(err);
			}
			if (stats?.hasErrors()) {
				console.error(stats.toJson().errors);
				return reject(new Error(stats.toJson().errors?.join("\n")));
			}
			if (!stats) {
				return reject(new Error("No stats returned from webpack"));
			}
			resolve({ tmpDir, stats });
		});
	});
}

export default compileProject;
