(function () {
    "use strict";

    require('require-kiss');

    var CONSTANTS = require('./constants'),
        usngToUtm = require('./usng/usngToUtm')(CONSTANTS),
        parseUsng = require('./usng/parseUsng')(CONSTANTS),
        isUsng = require('./usng/isUsng')(CONSTANTS),
        utm = require('./utm');

    /*
     * Turns a USNG string into lat/long coordinates.
     * 
     * @param usngStr_input- USNG source
     * @return Object with two properties- latitude & longitude
     */
    function usngToLatLong(usngStr_input) {
        var usngp,
            coords,
            latlon;

        usngp = parseUsng(usngStr_input);

        // convert USNG coords to UTM; this routine counts digits and sets precision
        coords = usngToUtm(usngp.zoneNumber, usngp.zoneLetter, usngp.sq1, usngp.sq2, usngp.east, usngp.north);

        // southern hemisphere case
        if (usngp.zoneLetter < 'N') {
            coords.northing -= CONSTANTS.NORTHING_OFFSET;
        }

        latlon = utm.toLatLong(coords.northing, coords.easting, usngp.zoneNumber);

        return latlon;
    }

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

    provide('./usng', module.exports);
}());
