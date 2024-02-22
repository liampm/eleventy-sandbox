const { EleventyServerlessBundlerPlugin } = require('@11ty/eleventy')
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation')

module.exports = eleventyConfig => {

  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: 'cf-cache-page', // The serverless function name for the permalink object
    functionsDir: './cloud/functions/',
  })

  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: 'cache-page', // The serverless function name for the permalink object
    functionsDir: './cloud/functions/',
  })

  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: 'ssr', // The serverless function name for the permalink object
    functionsDir: './cloud/functions/',
  })

  eleventyConfig.addPlugin(EleventyServerlessBundlerPlugin, {
    name: 'on-demand', // The serverless function name for the permalink object
    functionsDir: './cloud/functions/',
  })

  eleventyConfig.addPlugin(eleventyNavigationPlugin)

  eleventyConfig.addGlobalData('ttl', 3600)
  eleventyConfig.dataFilterSelectors.add('ttl')

  return {
    dir: {
      input: 'src',
      output: 'dist',
      data: '_data',
    },
    templateFormats: ['md', 'njk', 'html'],
  }
}
