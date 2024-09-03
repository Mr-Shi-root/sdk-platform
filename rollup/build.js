const path = require('path')
const json = require('@rollup/plugin-json')
const {babel} = require('@rollup/plugin-babel')

const resolveFile = function(filePath) {
    return path.join(__dirname, filePath)
}

const plugins= [
    json(
        {
            compact: true
        }
    ),
    babel({
        extensions: ['.js','.ts'],
        babelHelpers: 'bundled',
        presets: [
            [
                '@babel/env',
                {
                    targets: {
                        browsers: [
                            '> 1%',
                            'last 2 versions',
                            'not ie <= 8',
                        ]
                    }
                }
                ]
        ]
    })
]

module.exports = [
    {
        plugins,
        input: resolveFile('../src/webEyeSDK.js'),
        output: {
            file: resolveFile('../dist/webEyeSDK.js'),
            format: 'iife',
            name: 'WebEyeSDK',
            soucemap: true,
            // globals: {
            //     'vue': 'Vue',
            // }
        }
    },
    {
        plugins,
        input: resolveFile('../src/webEyeSDK.js'),
        output: {
            file: resolveFile('../dist/webEyeSDK.js'),
            format: 'iife',
            name: 'WebEyeSDK',
            soucemap: true,
            // globals: {
            //     'vue': 'Vue',
            // }
        }
    },
    {
        plugins,
        input: resolveFile('../src/webEyeSDK.js'),
        output: {
            file: resolveFile('../dist/webEyeSDK.esm.js'),
            format: 'esm',
            name: 'WebEyeSDK',
            soucemap: true,
            // globals: {
            //     'vue': 'Vue',
            // }
        }
    },
    {
        plugins,
        input: resolveFile('../src/webEyeSDK.js'),
        output: {
            file: resolveFile('../dist/webEyeSDK.cjs.js'),
            format: 'cjs',
            name: 'WebEyeSDK',
            soucemap: true,//
            // globals: {
            //     'vue': 'Vue',
            // }
        }
    }
]