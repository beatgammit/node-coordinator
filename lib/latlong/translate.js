/*jshint node:true */
(function () {
    "use strict";

    var CONSTANTS = {};

    function translate(lat, lon, d, brng) {
        var R = 6371,
            lat2,
            lon2,
            ret;

        lat *= CONSTANTS.DEG_2_RAD;
        lon *= CONSTANTS.DEG_2_RAD;

        brng *= CONSTANTS.DEG_2_RAD;

        lat2 = Math.asin(Math.sin(lat) * Math.cos(d/R) +
                      Math.cos(lat) * Math.sin(d/R) * Math.cos(brng));

        lon2 = lon + Math.atan2(Math.sin(brng) * Math.sin(d/R) * Math.cos(lat),
                      Math.cos(d/R) - Math.sin(lat) * Math.sin(lat2));

        lon2 = (lon2 + 3 * Math.PI) % (2 * Math.PI) - Math.PI;

        ret = {
            latitude: lat2 * CONSTANTS.RAD_2_DEG,
            longitude: lon2 * CONSTANTS.RAD_2_DEG
        };

        if (isNaN(ret.latitude) || isNaN(ret.longitude)) {
            return null;
        }

        return ret;
    }

    module.exports = function (constants) {
        CONSTANTS = constants;

        return translate;
    };
}());
