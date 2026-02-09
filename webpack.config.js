const path = require('path');
const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
  entry: './src/webview/index.tsx',
  mode: 'production',
  devtool: 'source-map',
  plugins: [
    // Принудительно инлайним все чанки в один bundle
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1
    }),
    // Анализатор bundle (запускается только при флаге --analyze)
    ...(process.env.ANALYZE ? [new BundleAnalyzerPlugin()] : [])
  ],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: 'tsconfig.webview.json',
              // Отключаем трансформацию динамических импортов
              compilerOptions: {
                module: 'esnext',
                target: 'es2020',
              }
            }
          }
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      // Исключаем файлы, которые не должны быть в webview bundle
    }
  },
  output: {
    filename: 'metadataEditor.bundle.js',
    path: path.resolve(__dirname, 'media'),
    library: 'MetadataEditor',
    libraryTarget: 'umd',
  },
  externals: {
    vscode: 'commonjs vscode', // Исключаем vscode из bundle
    'fast-glob': 'commonjs fast-glob', // Используется только в extension host
  },
  optimization: {
    minimize: true, // Включаем минификацию для уменьшения размера bundle
    minimizer: [
      '...', // Используем дефолтный TerserPlugin
    ],
    usedExports: true, // Включаем tree-shaking
    sideEffects: false, // Указываем, что нет side effects для tree-shaking
    splitChunks: false, // Полностью отключаем code splitting
    // Инлайним все динамические импорты в один bundle
    moduleIds: 'deterministic',
    runtimeChunk: false,
  },
  // Отключаем создание отдельных чанков для динамических импортов
  experiments: {
    topLevelAwait: true,
  },
};

