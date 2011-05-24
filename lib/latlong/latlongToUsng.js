(function () {
    "use strict";

    require('require-kiss');

    var helpers = require('./helpers'),
        CONSTANTS = require('../constants'),
        latLongToUtm = require('./latlongToUtm');

    /*
     * Converts latitude and longitude to USNG:
     *  * Converts lat/long to UTM
     *  * Converts UTM to USNG
     * 
     * @param lat- Latitude in decimal degrees
     * @param lon- longitude in decimal degrees
     * @param precision- How many decimal places (1-5) in USNG (default 5)
     * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
     */
    function latLongToUsng(lat, lon, precision) {
        var UTMEasting,
            UTMNorthing,
            coords,
            USNGLetters,
            USNGNorthing,
            USNGEasting,
            USNG,
            i,
            zoneNumber;

        if (typeof precision === 'string') {
            precision = parseInt(precision, 10);
        }

        precision = precision ? precision : 5;

        lat = parseFloat(lat);
        lon = parseFloat(lon);

        // convert lat/lon to UTM coordinates
        coords = latLongToUtm(lat, lon);

        UTMEasting = coords.easting;
        UTMNorthing = coords.northing;
        zoneNumber = coords.zone;

        // ...then convert UTM to USNG

        // southern hemispher case
        if (lat < 0) {
            // Use offset for southern hemisphere
            UTMNorthing += CONSTANTS.NORTHING_OFFSET; 
        }

        USNGLetters  = helpers.findGridLetters(zoneNumber, UTMNorthing, UTMEasting);
        USNGNorthing = Math.round(UTMNorthing) % CONSTANTS.BLOCK_SIZE;
        USNGEasting  = Math.round(UTMEasting)  % CONSTANTS.BLOCK_SIZE;

        // added... truncate digits to achieve specified precision
        USNGNorthing = Math.floor(USNGNorthing / Math.pow(10,(5-precision)));
        USNGEasting = Math.floor(USNGEasting / Math.pow(10,(5-precision)));
        USNG = helpers.getZoneNumber(lat, lon) + helpers.UTMLetterDesignator(lat) + " " + USNGLetters + " ";

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

    module.exports = latLongToUsng;

    provide('./latLongToUsng', module.exports);
}());
