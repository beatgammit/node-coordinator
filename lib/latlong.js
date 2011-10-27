(function () {
    "use strict";

    var CONSTANTS = require('./constants'),
        decimalToDegMinSec = require('./latlong/decimalToDegMinSec')(CONSTANTS),
        degMinSecToDecimal = require('./latlong/degMinSecToDecimal')(CONSTANTS),
        latLongToUtm = require('./latlong/latlongToUtm')(CONSTANTS),
        translate = require('./latlong/translate')(CONSTANTS),
        utm = require('./utm');

    /*
     * Convenience function that basically just:
     *  * Converts lat/long to UTM
     *  * Converts UTM to USNG
     * 
     * @param lat- Latitude in decimal degrees
     * @param lon- longitude in decimal degrees
     * @param precision- How many decimal places (1-5) in USNG (default 5)
     * @param output- Output format. Accepted values are: 'string' and 'object'
     * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
     */
    function latLongToUsng(lat, lon, precision, output) {
        var coords;

        if (typeof precision === 'string') {
            precision = parseInt(precision, 10);
        }

        precision = precision ? precision : 5;

        lat = parseFloat(lat);
        lon = parseFloat(lon);

        // convert lat/lon to UTM coordinates
        coords = latLongToUtm(lat, lon);

        return utm.toUsng(coords, precision, output);
    }

    /*
     * Creates a Military Grid Reference System string.
     * This is the same as a USNG string, but without spaces.
     * 
     * Space delimiters are optional but allowed in USNG, but are not allowed in MGRS.
     * 
     * The numbers are the same between the two coordinate systems.
     * 
     * @param lat- Latitude in decimal degrees
     * @param lon- longitude in decimal degrees
     * @param precision- How many decimal places (1-5) in USNG (default 5)
     * @param output- Output format. Accepted values are: 'string' and 'object'
     * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
     */
    function latLongToMgrs(lat, lon, precision, output) {
        var mgrs,
            usng = latLongToUsng(lat, lon, precision, output);

        if (typeof usng === 'string') {
            // remove space delimiters to conform to mgrs spec
            mgrs = usng.replace(/ /g, "");
        } else {
            mgrs = usng;
        }

        return mgrs;
    }

    function getConverter (outputType) {
        var fn;

        switch (outputType.toLowerCase()) {
            case 'utm':
                fn = latLongToUtm;
                break;

            case 'usng':
                fn = latLongToUsng;
                break;

            case 'mgrs':
                fn = latLongToMgrs;
                break;
        }

        return fn;
    }
    
    module.exports.toDecimal = degMinSecToDecimal;
    module.exports.toDegMinSec = decimalToDegMinSec;
    module.exports.toUsng = latLongToUsng;
    module.exports.toUtm = latLongToUtm;
    module.exports.toMgrs = latLongToMgrs;
    module.exports.getConverter = getConverter;

    module.exports.translate = translate;
}());
