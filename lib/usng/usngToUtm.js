(function () {
    "use strict";

    require('require-kiss');

    var parseUsng = require('./parseUsng')();

    /*
     * Converts USNG to UTM.
     *
     * @param usngStr- string representing a USNG string
     * @return Returns an object with zoneNumber, zoneLetter, easting and northing
     */ 
    function usngToUtm(usngStr) { 
        var zoneBase,
            segBase,
            eSqrs,
            appxEast,
            appxNorth,
            letNorth,
            nSqrs,
            zoneStart,
            USNGSqEast = "ABCDEFGHJKLMNPQRSTUVWXYZ",
            ret = {},
            parts;

        parts = parseUsng(usngStr);

        //Starts (southern edge) of N-S zones in millons of meters
        zoneBase = [
            1.1, 2.0, 2.8, 3.7, 4.6, 5.5, 6.4, 7.3, 8.2, 9.1,
            0, 0.8, 1.7, 2.6, 3.5, 4.4, 5.3, 6.2, 7.0, 7.9
        ];

        //Starts of 2 million meter segments, indexed by zone 
        segBase = [
            0, 2, 2, 2, 4, 4, 6, 6, 8, 8,
            0, 0, 0, 2, 2, 4, 4, 6, 6, 6
        ];

        // convert easting to UTM
        eSqrs = USNGSqEast.indexOf(parts.sq1);          
        appxEast = 1 + eSqrs % 8; 

        // convert northing to UTM
        letNorth = "CDEFGHJKLMNPQRSTUVWX".indexOf(parts.zoneLetter);
        if (parts.zoneNumber % 2) {
            //odd number zone
            nSqrs = "ABCDEFGHJKLMNPQRSTUV".indexOf(parts.sq2);
        } else {
            // even number zone
            nSqrs = "FGHJKLMNPQRSTUVABCDE".indexOf(parts.sq2);
        }

        zoneStart = zoneBase[letNorth];
        appxNorth = segBase[letNorth] + nSqrs / 10;
        if (appxNorth < zoneStart) {
            appxNorth += 2;
        }

        ret.northing = appxNorth * 1000000 + parts.north * Math.pow(10, 5 - String(parts.north).length);
        ret.easting = appxEast * 100000 + parts.east * Math.pow(10, 5 - String(parts.east).length);
        ret.zoneNumber = parts.zoneNumber;
        ret.zoneLetter = parts.zoneLetter;

        return ret;
    }

    module.exports = function () {
        return usngToUtm;
    };

    provide('./usng/usngToUtm', module.exports);
}());
