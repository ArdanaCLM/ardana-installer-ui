exports.config = {
  specs: ['./test/**/*.spec.js'],
  capabilities: {
    browserName: 'chrome'
  },
  baseUrl: 'http://localhost:2209',
  framework: 'jasmine',
  onPrepare: function() {
    browser.ignoreSynchronization = true;
  }
};
