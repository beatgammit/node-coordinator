(function () {
    "use strict";

    require('require-kiss');

    var helpers = require('./helpers'),
        CONSTANTS = {};

    /*
     * Converts a UTM coordinate to USNG:
     * 
     * @param coords- object with parts of a UTM coordinate
     * @param precision- How many decimal places (1-5) in USNG (default 5)
     * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
     */
    function utmToUsng(coords, precision) {
        var UTMEasting,
            UTMNorthing,
            USNGLetters,
            USNGNorthing,
            USNGEasting,
            USNG,
            i;

        if (typeof precision === 'string') {
            precision = parseInt(precision, 10);
        }

        precision = precision ? precision : 5;

        UTMEasting = coords.easting;
        UTMNorthing = coords.northing;

        // southern hemisphere case
        if (coords.hemisphere === 'S') {
          // Use offset for southern hemisphere
          UTMNorthing += CONSTANTS.NORTHING_OFFSET; 
        }

        USNGLetters  = helpers.findGridLetters(coords.zoneNumber, UTMNorthing, UTMEasting);
        USNGNorthing = Math.round(UTMNorthing) % CONSTANTS.BLOCK_SIZE;
        USNGEasting  = Math.round(UTMEasting)  % CONSTANTS.BLOCK_SIZE;

        // added... truncate digits to achieve specified precision
        USNGNorthing = Math.floor(USNGNorthing / Math.pow(10,(5-precision)));
        USNGEasting = Math.floor(USNGEasting / Math.pow(10,(5-precision)));
        USNG = coords.zoneNumber + coords.zoneLetter + " " + USNGLetters + " ";

        // REVISIT: Modify to incorporate dynamic precision ?
        for (i = String(USNGEasting).length; i < precision; i += 1) {
             USNG += "0";
        }

        USNG += USNGEasting + " ";

        for (i = String(USNGNorthing).length; i < precision; i += 1) {
            USNG += "0";
        }

        USNG += USNGNorthing;

        return USNG;
    }

    module.exports = function (constants) {
        CONSTANTS = constants;

        helpers = helpers(constants);

        return utmToUsng;
    };

    provide('./utm/utmToUsng', module.exports);
}());
