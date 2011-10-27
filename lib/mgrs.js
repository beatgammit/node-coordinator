(function () {
    "use strict";

    var CONSTANTS = require('./constants'),
        mgrsToUtm = require('./mgrs/mgrsToUtm')(CONSTANTS),
        usng = require('./usng');

    function getConverter(outputType) {
        var fn;

        switch (outputType.toLowerCase()) {
            case 'latlong':
                fn = usng.toLatLong;
                break;
            
            case 'utm':
                fn = usng.toUtm;
                break;
        }

        return fn;
    }

    module.exports.getConverter = getConverter;
    module.exports.toLatLong = usng.toLatLong;
    module.exports.toUtm = mgrsToUtm;
}());
