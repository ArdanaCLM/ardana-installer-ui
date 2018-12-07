exports.config = {
  specs: ['./test/e2e/suites/day0/*.spec.js'],
  capabilities: {
    browserName: 'chrome'
  },
  baseUrl: 'http://localhost:2209',
  framework: 'jasmine',
  onPrepare: function() {
    browser.ignoreSynchronization = true;
  }
};
