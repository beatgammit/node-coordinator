(function () {
    "use strict";

    var converters = {
            'latlong': require('./latlong'),
            'usng': require('./usng'),
            'utm': require('./utm'),
            'mgrs': require('./mgrs')
        };

    function getConverter(inputType, outType) {
        if (typeof inputType !== 'string') {
            throw new Error('Parameter not a string: ' + inputType);
        }

        if (typeof outType !== 'string') {
            throw new Error('Parameter not a string: ' + outType);
        }

        if (!converters[inputType]) {
            throw "Converter doesn't exist. Complain on GitHub.";
        }

        return converters[inputType].getConverter(outType);
    }

    module.exports = getConverter;
    module.exports.converters = converters;
}());
