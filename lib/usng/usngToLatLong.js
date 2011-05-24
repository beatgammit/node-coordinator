(function () {
    "use strict";

    require('require-kiss');

    var CONSTANTS = require('../constants'),
        usngToUtm = require('./usngToUtm'),
        parseUsng = require('./parseUsng'),
        utm = require('../utm');

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
        coords = usngToUtm(usngp.zone, usngp.zoneLetter, usngp.sq1, usngp.sq2, usngp.east, usngp.north);

        // southern hemisphere case
        if (usngp.zoneLetter < 'N') {
            coords.northing -= CONSTANTS.NORTHING_OFFSET;
        }

        latlon = utm.toLatLong(coords.northing, coords.easting, usngp.zone);

        return latlon;
    }

    module.exports = usngToLatLong;

    provide('./usngToLatLong', module.exports);
}());
