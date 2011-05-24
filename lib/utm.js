(function () {
    "use strict";

    require('require-kiss');

    var utmToLatLong = require('./utm/utmToLatLong');

    function getConverter (outputType) {
        var fn;

        switch (outputType.toLowerCase()) {
            case 'latlong':
                fn = utmToLatLong;
                break;
        }

        return fn;
    }

    module.exports.toLatLong = utmToLatLong;
    module.exports.getConverter = getConverter;

    provide('utm', module.exports);
}());
