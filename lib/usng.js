(function () {
    "use strict";

    require('require-kiss');

    var usngToUtm = require('./usng=usngToUtm'),
        usngToLatLong = require('./usng/usngToLatLong'),
        parseUsng = require('./usng/parseUsng'),
        isUsng = require('./usng/isUsng');

    function getConverter (outputType) {
        var fn;

        switch (outputType.toLowerCase()) {
            case 'utm':
                fn = usngToUtm;
                break;
            case 'latlong':
                fn = usngToLatLong;
                break;
        }

        return fn;
    }

    module.exports.toUtm = usngToUtm;
    module.exports.toLatLong = usngToLatLong;
    module.exports.isUsng = isUsng;
    module.exports.getConverter = getConverter;
    module.exports.parseUSNG = parseUsng;

    provide('usng', module.exports);
}());
