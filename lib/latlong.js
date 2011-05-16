(function () {
    "use strict";

    require('require-kiss');

    var CONSTANTS = require('./constants'),
        helpers = require('./helpers');

    /*
     * Converts latitude and longitude to UTM.
     *
     * Converts lat/long to UTM coords.  Equations from USGS Bulletin 1532 
     * (or USGS Professional Paper 1395 "Map Projections - A Working Manual", 
     * by John P. Snyder, U.S. Government Printing Office, 1987.)
     *
     * East Longitudes are positive, West longitudes are negative. 
     * North latitudes are positive, South latitudes are negative
     * lat and lon are in decimal degrees
     *
     * output is in the input array utmcoords
     *    utmcoords[0] = easting
     *    utmcoords[1] = northing (NEGATIVE value in southern hemisphere)
     *    utmcoords[2] = zone
     */
    function latLongToUtm(lat, lon, utmcoords, zone) {
        var zoneNumber,
            lonTemp,
            latRad,
            lonRad,
            lonOrigin,
            lonOriginRad,
            UTMEasting,
            UTMNorthing,
            N,
            T,
            C,
            A,
            M;

        // utmcoords is a 2-D array declared by the calling routine

        lat = parseFloat(lat);
        lon = parseFloat(lon);

        // Constrain reporting USNG coords to the latitude range [80S .. 84N]
        if (lat > 84.0 || lat < -80.0) {
            return "undefined";
        }

        // sanity check on input - remove for production
        if (lon > 360 || lon < -180 || lat > 90 || lat < -90) {
            alert('Bad input. lat: ' + lat + ' lon: ' + lon);
        }

        // Make sure the longitude is between -180.00 .. 179.99..
        // Convert values on 0-360 range to this range.
        lonTemp = (lon + 180) - parseInt((lon + 180) / 360, 10) * 360 - 180;
        latRad = lat     * CONSTANTS.DEG_2_RAD;
        lonRad = lonTemp * CONSTANTS.DEG_2_RAD;

        // User-supplied zone number will force coordinates to be computed in a particular zone
        zoneNumber = zone || helpers.getZoneNumber(lat, lon);

        // +3 puts origin in middle of zone
        lonOrigin = (zoneNumber - 1) * 6 - 180 + 3;
        lonOriginRad = lonOrigin * CONSTANTS.DEG_2_RAD;

        // compute the UTM Zone from the latitude and longitude
        //UTMZone = String(zoneNumber) + UTMLetterDesignator(lat) + " ";

        N = CONSTANTS.EQUATORIAL_RADIUS / Math.sqrt(1 - CONSTANTS.ECC_SQUARED * Math.sin(latRad) * Math.sin(latRad));
        T = Math.tan(latRad) * Math.tan(latRad);
        C = CONSTANTS.ECC_PRIME_SQUARED * Math.cos(latRad) * Math.cos(latRad);
        A = Math.cos(latRad) * (lonRad - lonOriginRad);

        // Note that the term Mo drops out of the "M" equation, because phi 
        // (latitude crossing the central meridian, lambda0, at the origin of the
        //  x,y coordinates), is equal to zero for UTM.
        M = CONSTANTS.EQUATORIAL_RADIUS * (
            (1 - CONSTANTS.ECC_SQUARED / 4 - 3 * (CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED) / 64 - 5 * (CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED) / 256) * latRad -
            (3 * CONSTANTS.ECC_SQUARED / 8 + 3 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 32 + 45 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 1024) * Math.sin(2 * latRad) +
            (15 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 256 + 45 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 1024) * Math.sin(4 * latRad) -
            (35 * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED * CONSTANTS.ECC_SQUARED / 3072) * Math.sin(6 * latRad));

        UTMEasting = (CONSTANTS.k0 * N *
            (A + (1 - T + C) * (A * A * A) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * CONSTANTS.ECC_PRIME_SQUARED ) * (A * A * A * A * A) / 120) + CONSTANTS.EASTING_OFFSET);

        UTMNorthing = (CONSTANTS.k0 * ( M + N * Math.tan(latRad) * (
              (A * A) / 2 + (5 - T + 9 * C + 4 * C * C ) * (A * A * A * A) / 2 +
              (61 - 58 * T + T * T + 600 * C - 330 * CONSTANTS.ECC_PRIME_SQUARED ) *
              (A * A * A * A * A * A) / 720)
          ) );

        utmcoords[0] = UTMEasting;
        utmcoords[1] = UTMNorthing;
        utmcoords[2] = zoneNumber;
    }

    /*
     * Converts latitude and longitude to USNG:
     *  * Converts lat/long to UTM
     *  * Converts UTM to USNG
     * 
     * @param lat- Latitude in decimal degrees
     * @param lon- longitude in decimal degrees
     * @param precision- How many decimal places (1-5) in USNG
     * @return String of the format- DDL LL DDDDD DDDDD (5-digit precision)
     */
    function latLongToUsng(lat, lon, precision) {
        var UTMEasting,
            UTMNorthing,
            coords = [],
            USNGLetters,
            USNGNorthing,
            USNGEasting,
            USNG,
            i,
            zoneNumber;

        lat = parseFloat(lat);
        lon = parseFloat(lon);

        // convert lat/lon to UTM coordinates
        latLongToUtm(lat, lon, coords);

        UTMEasting = coords[0];
        UTMNorthing = coords[1];
        zoneNumber = coords[2];

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

    // create a Military Grid Reference System string.  this is the same as a USNG string, but
    //    with no spaces.  space delimiters are optional but allowed in USNG, but are not allowed
    //    in MGRS notation.  but the numbers are the same.
    function latLongToMgrs(lat, lon, precision)
    {
        var mgrs_str = "",
            usng_str = latLongToUsng(lat, lon, precision);

        // remove space delimiters to conform to mgrs spec
        mgrs_str = usng_str.replace(/ /g, "");

        return mgrs_str;
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

    module.exports.toUsng = latLongToUsng;
    module.exports.toUtm = latLongToUtm;
    module.exports.toMgrs = latLongToMgrs;
    module.exports.getConverter = getConverter;

    provide('latlong', module.exports);
}());
