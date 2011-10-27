(function () {
    "use strict";

    var CONSTANTS = require('./constants'),
        usngToUtmRaw = require('./usng/usngToUtm')(CONSTANTS),
        parseUsng = require('./usng/parseUsng')(CONSTANTS),
        isUsng = require('./usng/isUsng')(CONSTANTS),
        utm = require('./utm');

    function usngToUtm (usngStr) {
        var usng = parseUsng(usngStr);
        return usngToUtmRaw(usng);
    }

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
        coords = usngToUtm(usngStr_input);

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
    module.exports.parseUsng = parseUsng;
}());
