(function () {
    "use strict";

    require('require-kiss');

    var converters = {
        'latlong': require('./latlong'),
        'usng': require('./usng'),
        'utm': require('./utm')
    };

    function getConverter(inputType, outType) {
        if (typeof inputType !== 'string') {
            throw new Error('Parameter not a string: ' + inputType);
        }

        if (typeof outType !== 'string') {
            throw new Error('Parameter not a string: ' + outType);
        }

        if (converters[inputType]) {
            return converters[inputType].getConverter(outType);
        }
    }

    module.exports = getConverter;

    provide('lib/convert', module.exports);
}());
