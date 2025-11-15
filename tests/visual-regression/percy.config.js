module.exports = {
  version: 2,
  discovery: {
    allowedHostnames: ['localhost'],
    networkIdleTimeout: 750,
    disableCache: false
  },
  static: {
    cleanUrls: true,
    include: '**/*.html',
    exclude: []
  },
  snapshot: {
    widths: [375, 768, 1280, 1920],
    minHeight: 1024,
    percyCSS: '',
    enableJavaScript: true,
    cliEnableJavaScript: true,
    disableShadowDOM: false
  },
  defer: {
    // Defer screenshots until these selectors are present
    selectors: [
      '[data-percy-ready]',
      '.scene-loaded',
      '.models-loaded'
    ],
    timeout: 30000
  }
}
