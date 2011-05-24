(function () {
    "use strict";

    var latLongToUsng = require('./latlongToUsng');

    /*
     * Creates a Military Grid Reference System string.
     * This is the same as a USNG string, but without spaces.
     * 
     * Space delimiters are optional but allowed in USNG, but are not allowed in MGRS.
     * 
     * The numbers are the same between the two coordinate systems.
     */
    function latLongToMgrs(lat, lon, precision)
    {
        var mgrs_str = "",
            usng_str = latLongToUsng(lat, lon, precision);

        // remove space delimiters to conform to mgrs spec
        mgrs_str = usng_str.replace(/ /g, "");

        return mgrs_str;
    }

    module.exports = latLongToMgrs;
}());
