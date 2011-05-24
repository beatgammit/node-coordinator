(function () {
    "use strict";

    require('require-kiss');

    module.exports = require('./lib/convert');

    provide('./coordinator', module.exports);
}());
