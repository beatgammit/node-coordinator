(function () {
    require('require-kiss');

    var CONSTANTS = require('./constants'),
        usng = require('./usng'),
        latLong = require('./latlong');

    /*
     * Translates a zone if the square is on the edge of the zone and the
     * northing or easting change would change zones.
     * 
     * @param zone- Starting zone
     * @param square- Starting square
     * @param northing- positive if northbound, negative if southbound, or 0
     * @param easting- positive if eastbound, negative if westbound, or 0
     * @return New zone as a string
     */
    function translateZone(zone, square, northing, easting) {
        ;
    }

    /*
     * Translates a square if the northing and easting change would cross
     * square boundaries.
     *
     * @param zone- should be the new one if there was a zone change
     * @param square- starting square
     * @param northing- positive if northbound, negative if southbound, or 0
     * @param easting- postitive if eastbound, negative if westbound, or 0
     * @return New square as a string
     */
    function translateSquare(zone, square, northing, easting) {
    }

    function translate(mgrsOrig, mNorth, mEast) {
        var brng = Math.atan(mNorth, mEast) * CONSTANTS.RAD_2_DEG,
            dist = Math.sqrt(Math.pow(mNorth, 2) + Math.pow(mEast, 2)),
            tLL = usng.toLatLong(mgrsOrig),
            newLL = latLong.translate(tLL.latitude, tLL.longitude, dist, brng);

        return latLong.toMgrs(newLL.latitude, newLL.longitude);
/*
        var zone, squareId, easting, northing, temp;

        zone = mgrsOrig.match(/\d+./)[0];
        squareId = mgrsOrig.substring(zone.length, zone.length + 2);

        temp = mgrsOrig.substring(zone.length + squareId.length);

        easting = parseInt(temp.substring(0, temp.length / 2), 10);
        northing = parseInt(temp.substring(temp.length / 2), 10);

        // move squares
        if (easting > 100000) {
        }
*/
    }

    function getConverter(outputType) {
        var fn;

        switch (outputType.toLowerCase()) {
            case 'utm':
                fn = latLongToUtm;
                break;

            case 'usng':
                fn = latLongToUsng;
                break;
        }

        return fn;
    }

    module.exports.translate = translate;
    module.exports.getConverter = getConverter;
    module.exports.toLatLong = usng.toLatLong;

    provide('mgrs', module.exports);
}());
