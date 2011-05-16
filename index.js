(function () {
    "use strict";

    var converters = {
        'latlong': require('./lib/latlong'),
        'usng': require('./lib/usng'),
        'utm': require('./lib/utm')
    };

    function getConverter(inputType, outType) {
        if (typeof inputType !== 'string') {
            throw new Error('Parameter not a string: ' + inputType);
        }

        if (typeof outType !== 'string') {
            throw new Error('Parameter not a string: ' + outType);
        }

        if (converters[inputType]) {
            return converters.getConverter(outType);
        }
    }

    module.exports = getConverter;
}());
