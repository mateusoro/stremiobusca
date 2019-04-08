'use strict';

require('./parts/common');
require('./parts/title');
require('./parts/excess');

module.exports = ptn;

function ptn(name, customPatterns, customTypes) {
  return require('./core').exec(name, customPatterns, customTypes);
}

ptn.configure = function(customPatterns, customTypes) {
  require('./core').configure(customPatterns, customTypes);
};
