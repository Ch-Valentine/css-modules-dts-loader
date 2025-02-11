const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { Volume, createFsFromVolume } = require('memfs');

function compileProject({ files, loaderOptions = {} }) {
  // Create a temporary project directory
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-dts-test-'));

  // Write all provided files to the temporary directory
  Object.entries(files).forEach(([filePath, content]) => {
    const fullPath = path.join(tmpDir, filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, content, 'utf8');
  });

  // Create webpack configuration
  const config = {
    mode: 'development',
    context: tmpDir,
    entry: './index.js',
    output: {
      path: path.join(tmpDir, 'dist'),
      filename: 'bundle.js'
    },
    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            {
              loader: path.resolve(__dirname, '../src/index.js'),
              options: loaderOptions
            },
            {
              loader: require.resolve('css-loader'),
              options: {
                modules: {
                  namedExport: true
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
  const memfs = createFsFromVolume(vol);

  // Copy files from real fs to memfs
  const copyToMemfs = (dir) => {
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
  compiler.outputFileSystem = memfs;

  return new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        return reject(err);
      }
      if (stats.hasErrors()) {
        console.error(stats.toJson().errors);
        return reject(new Error(stats.toJson().errors.join('\n')));
      }
      resolve({ tmpDir, stats });
    });
  });
}

module.exports = compileProject;
