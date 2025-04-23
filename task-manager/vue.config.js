// vue.config.js
module.exports = {
  publicPath: process.env.NODE_ENV === 'production'
    ? '/task-manager/' // Replace with your repository name
    : '/',
  outputDir: 'dist'
}