import { platform, userInfo } from 'os'
import { resolve } from 'path'
import chalk from 'chalk'
import { Configuration, BannerPlugin } from 'webpack'
import * as TerserPlugin from 'terser-webpack-plugin'
import CleanPlugin from 'clean-webpack-plugin'
import * as WebpackBuildNotifierPlugin from 'webpack-build-notifier'
import * as PACKAGE from './package.json'

/**
 * Console warnings:
 *
 * WARNING in ./node_modules/keyv/src/index.js 18:14-40
 * Critical dependency: the request of a dependency is an expression
 * https://github.com/lukechilds/keyv/issues/45
 *
 * WARNING in ./node_modules/got/source/request-as-event-emitter.js 72:18-25
 * Critical dependency: require function is used in a way in which dependencies
 * cannot be statically extracted
 * https://github.com/sindresorhus/got/issues/742
 */

const Banner = `${'┄'.repeat(46)}
${PACKAGE.displayName} (${PACKAGE.name})
${PACKAGE.description}

@version ${PACKAGE.version}
@license ${PACKAGE.license}
@author ${PACKAGE.author.name} (${PACKAGE.author.url})
@readme ${PACKAGE.homepage}
@package ${PACKAGE.repository}
${'┄'.repeat(46)}`

// @ts-ignore
export default (env: any, argv: Configuration): Configuration => {
  const platformName = platform()
  const developerName = userInfo().username
  const mode = argv.mode ? argv.mode : 'none'
  const isProd = mode === 'production'
  const isDev = mode === 'development'

  // Show general information
  console.log('whoIsMe:', chalk.whiteBright(developerName))
  console.log('whichOs:', chalk.whiteBright(platformName))
  console.log('devMode:', isDev ? chalk.green('true') : chalk.red('false'), '\n')

  return {
    target: 'node',
    entry: resolve(__dirname, 'src', 'extension.ts'),
    output: {
      path: resolve(__dirname, 'dist'),
      filename: 'extension.js',
      libraryTarget: 'commonjs2',
      devtoolModuleFilenameTemplate: '../[resource-path]',
    },
    devtool: isDev ? 'cheap-module-source-map' : 'source-map',
    externals: {
      vscode: 'commonjs vscode', // the vscode-module is created on-the-fly and must be excluded. 📖 -> https://webpack.js.org/configuration/externals/
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    optimization: {
      namedModules: true,
      namedChunks: true,
      minimize: isProd,
      minimizer: [new TerserPlugin()],
    },
    plugins: [
      new WebpackBuildNotifierPlugin({
        title: 'Sundial',
        logo: resolve(__dirname, 'assets', 'icon.jpg'),
      }),
      new CleanPlugin(),
      new BannerPlugin(Banner),
    ],
    module: {
      rules: [
        {
          test: /\.ts$/,
          exclude: /node_modules/,
          use: [
            {
              loader: 'ts-loader',
            },
          ],
        },
      ],
    },
  }
}