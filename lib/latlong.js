(function () {
    "use strict";

    require('require-kiss');

    var CONSTANTS = require('./constants'),
        helpers = require('./helpers');

    /*
     * Converts decimal degrees to degrees, minutes seconds.
     * 
     * This function can either return a formatted string or an object.
     * 
     * If string or nothing is specified, it will look like this: 41°25'01"N
     * 
     * If object is chosen, it will have two properties, latitude and longitude.
     * Each will have these properties:
     * - degrees: positive integer
     * - minutes: positive integer
     * - seconds: positive float
     * - direction: N, S, E, or W
     * 
     * @param lat- latitude (float or string representing a float)
     * @param lon- longitude (float or string representing a float)
     * @param type- string representing return type (object or string); optional
     * @param digits- max digits in seconds; can be 3rd parameter; default is 2
     * @return Depents on type parameter (map of formatted strings or values)
     */
    function decimalToDegMinSec (lat, lon, type, digits) {
        var latDeg,
            latMin,
            latSec,
            lonDeg,
            lonMin,
            lonSec,
            latDir,
            lonDir,
            ret,
            magic;

        if (typeof digits === 'undefined') {
            digits = type;
        }

        if (typeof digits === 'string') {
            digits = parseInt(digits, 10);
        } else if (typeof digits !== 'number') {
            digits = 2;
        }

        // magic number that helps us round off un-needed digits
        magic = Math.pow(10, digits);

        lat = (typeof lat === 'string') ? parseFloat(lat) : lat;
        lon = (typeof lon === 'string') ? parseFloat(lon) : lon;

        if (lat < -90 || lat > 90) {
            throw "Latitude out of range: " + lat;
        }

        if (lon < -180 || lon > 180) {
            throw "Longitude out of range: " + lon;
        }

        latDir = (lat >= 0) ? 'N' : 'S';
        lonDir = (lon >= 0) ? 'E' : 'W';

        // Change to absolute value
        lat = Math.abs(lat);
        lon = Math.abs(lon);

        // Convert to Degree Minutes Seconds Representation
        latDeg = Math.floor(lat);
        lat -= latDeg;
        latMin = Math.floor(lat * 60);
        lat -= latMin / 60;
        latSec = Math.round((lat * 3600) * magic) / magic;

        lonDeg = Math.floor(lon);
        lon -= lonDeg;
        lonMin = Math.floor(lon * 60);
        lon -= lonMin / 60;
        lonSec = Math.round((lon * 3600) * magic) / magic;

        if (type === 'object') {
            ret = {
                latitude: {
                    degrees: latDeg,
                    minutes: latMin,
                    seconds: latSec,
                    direction: latDir
                },
                longitude: {
                    degrees: lonDeg,
                    minutes: lonMin,
                    seconds: lonSec,
                    direction: lonDir
                }
            };
        } else {
            ret = {
                latitude: latDeg + '°' + latMin + '\'' + latSec + '"' + latDir,
                longitude: lonDeg + '°' + lonMin + '\'' + lonSec + '"' + lonDir
            };
        }

        return ret;
    }

    /*
     * Verifies a coordinate object by following these steps:
     * - converts string members (degrees, minutes, seconds) to numbers
     * - if direction is present, makes degree positive or negative accordingly
     * 
     * @param coord- object with at least degrees, minutes, and seconds
     * @return New, cleaned object (doesn't have direction)
     */
    function dmsVerify(coord) {
        var newCoord = {};

        if (typeof coord !== 'object' || !coord.degrees || !coord.minutes || !coord.seconds) {
            return false;
        }

        if (typeof coord.degrees === 'string') {
            newCoord.degrees = parseInt(coord.degrees, 10);
        } else {
            newCoord.degrees = coord.degrees;
        }

        if (coord.direction) {
            if (coord.direction === 'S' || coord.direction === 'W') {
                newCoord.degrees *= -Math.abs(newCoord.degrees);
            } else {
                newCoord.degrees *= Math.abs(newCoord.degrees);
            }
        }

        if (typeof coord.minutes === 'string') {
            newCoord.minutes = Math.abs(parseInt(coord.minutes, 10));
        } else {
            newCoord.minutes = Math.abs(coord.minutes);
        }

        if (typeof coord.seconds === 'string') {
            newCoord.seconds = Math.abs(parseInt(coord.seconds, 10));
        } else {
            newCoord.seconds = Math.abs(coord.seconds);
        }
    }

    /*
     * Converts degrees, minutes, seconds to decimal degrees.
     * 
     * If objects are passed in, they should define these properties:
     * - degrees: integer (or string representing an integer)
     * - minutes: integer (or string representing an integer)
     * - seconds: float (or string representing a float)
     * - direction: N, S, E, or W
     * 
     * If strings are passed in, they will be parsed according to specs.
     * 
     * @param latitude- formatted string or an object with properties:
     * @param longitude- formatted string or an object
     * @return  Object with both latitude and longitude
     */
    function degMinSecToDecimal(latitude, longitude) {
        var reg = /^[NSEW\-]?\d{1,3}[° ]\d{1,2}[' ]\d{1,2}(\.\d{1,3})?[" ][NSEW]?$/,
            regSplit = /\d+(\.\d+)?/g,
            regDir = /[NSEW\-]/,
            lat = {},
            lon = {},
            tmp,
            ret = {};

        if (typeof latitude === 'object') {
            lat = dmsVerify(latitude);
        } else {
            if (!reg.test(latitude)) {
                throw "Latitude not formatted correctly: " + latitude;
            }
           tmp = latitude.match(regSplit);

            lat.degrees = parseInt(tmp[0], 10);
            lat.minutes = parseInt(tmp[1], 10);
            lat.seconds = parseFloat(tmp[2]);

            tmp = latitude.match(regDir);

            if (tmp[0] === 'S' || tmp[0] === '-') {
                lat.degrees *= -1;
            }
        }

        if (typeof longitude === 'object') {
            lon = dmsVerify(longitude);
        } else {
            if (!reg.test(longitude)) {
                throw "Longitude not formatted correctly: " + longitude;
            }

            tmp = longitude.match(regSplit);

            lon.degrees = parseInt(tmp[0], 10);
            lon.minutes = parseInt(tmp[1], 10);
            lon.seconds = parseFloat(tmp[2]);

            tmp = longitude.match(regDir);

            if (tmp[0] === 'W' || tmp[0] === '-') {
                lon.degrees *= -1;
            }
        }
        
        // Check if any error occurred
        if (lat.degrees < -90 || lat.degrees > 90) {
            throw "Latitude degrees out of bounds: " + lat.degrees;
        }
        if (lat.minutes < -60 || lat.minutes > 60) {
            throw "Latitude minutes out of bounds: " + lat.minutes;
        }
        if (lat.seconds < -60 || lat.seconds > 60) {
            throw "Latitude seconds out of bounds: " + lat.seconds;
        }
        if (lon.degrees < -180 || lon.degrees > 180) {
            throw "Longitude degrees out of bounds: " + lon.degrees;
        }
        if (lon.minutes < -60 || lon.minutes > 60) {
            throw "Longitude minutes out of bounds: " + lon.minutes;
        }
        if (lon.seconds < -60 || lon.seconds > 60) {
            throw "Longitude seconds out of bounds: " + lon.seconds;
        }

        tmp = String(lat.minutes / 60 + lat.seconds / 3600);
        ret.latitude = lat.degrees + '.' + tmp.substring(tmp.indexOf('.') + 1);

        tmp = String(lon.minutes / 60 + lon.seconds / 3600);
        ret.longitude = lon.degrees + '.' + tmp.substring(tmp.indexOf('.') + 1);

        return ret;
    }

    /*
     * Converts latitude and longitude to UTM.
     *
     * Converts lat/long to UTM coords.  Equations from USGS Bulletin 1532 
     * (or USGS Professional Paper 1395 "Map Projections - A Working Manual", 
     * by John P. Snyder, U.S. Government Printing Office, 1987.)
     * 
     * Note- UTM northings are negative in the southern hemisphere.
     *
     * @param lat- Latitude in decimal; north is positive, south is negative
     * @param lon- Longitude in decimal; east is positive, west is negative
     * @param zone- optional, result zone
     * @return Object with three properties, easting, northing, zone
     */
    function latLongToUtm(lat, lon, zone) {
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
            M,
            utmcoords = {};

        lat = parseFloat(lat);
        lon = parseFloat(lon);

        // Constrain reporting USNG coords to the latitude range [80S .. 84N]
        if (lat > 84.0 || lat < -80.0) {
            return "undefined";
        }

        // sanity check on input - remove for production
        // Make sure the longitude is between -180.00 .. 179.99..
        if (lon > 360 || lon < -180 || lat > 90 || lat < -90) {
            alert('Bad input. lat: ' + lat + ' lon: ' + lon);
        }

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

        utmcoords.easting = UTMEasting;
        utmcoords.northing = UTMNorthing;
        utmcoords.zone = zoneNumber;

        return utmcoords;
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
            coords,
            USNGLetters,
            USNGNorthing,
            USNGEasting,
            USNG,
            i,
            zoneNumber;

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
    
    module.exports.toDecimal = degMinSecToDecimal;
    module.exports.toDegMinSec = decimalToDegMinSec;
    module.exports.toUsng = latLongToUsng;
    module.exports.toUtm = latLongToUtm;
    module.exports.toMgrs = latLongToMgrs;
    module.exports.getConverter = getConverter;

    provide('latlong', module.exports);
}());
