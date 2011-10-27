(function () {
    "use strict";

    var CONSTANTS = require('./constants'),
        utmToLatLong = require('./utm/utmToLatLong')(CONSTANTS),
        utmToUsng = require('./utm/utmToUsng')(CONSTANTS);

    function getConverter (outputType) {
        var fn;

        switch (outputType.toLowerCase()) {
            case 'latlong':
                fn = utmToLatLong;
                break;

            case 'usng':
                fn = utmToUsng;
                break;
        }

        return fn;
    }

    module.exports.toLatLong = utmToLatLong;
    module.exports.toUsng = utmToUsng;
    module.exports.getConverter = getConverter;
}());
