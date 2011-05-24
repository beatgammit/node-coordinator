(function () {
    "use strict";

    require('require-kiss');

    /*
     * Converts USNG to UTM.
     *
     * @param zone- Zone (integer), eg. 18
     * @zoneLetter- Zone letter, eg S
     * @param sq1- 1st USNG square letter, eg U
     * @param sq2- 2nd USNG square Letter, eg J 
     * @param east- Easting digit string, eg 4000
     * @param north- Northing digit string eg 4000
     * @return Returns an object with zone, zoneLetter, easting and northing
     */ 
    function usngToUtm(zone, zoneLetter, sq1, sq2, east, north) { 
        var zoneBase,
            segBase,
            eSqrs,
            appxEast,
            appxNorth,
            letNorth,
            nSqrs,
            zoneStart,
            USNGSqEast = "ABCDEFGHJKLMNPQRSTUVWXYZ",
            ret = {};

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
        eSqrs = USNGSqEast.indexOf(sq1);          
        appxEast = 1 + eSqrs % 8; 

        // convert northing to UTM
        letNorth = "CDEFGHJKLMNPQRSTUVWX".indexOf(zoneLetter);
        if (zone % 2) {
            //odd number zone
            nSqrs = "ABCDEFGHJKLMNPQRSTUV".indexOf(sq2);
        } else {
            // even number zone
            nSqrs = "FGHJKLMNPQRSTUVABCDE".indexOf(sq2); 
        }

        zoneStart = zoneBase[letNorth];
        appxNorth = segBase[letNorth] + nSqrs / 10;
        if (appxNorth < zoneStart) {
            appxNorth += 2;
        }

        ret.northing = appxNorth * 1000000 + north * Math.pow(10, 5 - String(north).length);
        ret.easting = appxEast * 100000 + east * Math.pow(10, 5 - String(east).length);
        ret.zone = zone;
        ret.letter = zoneLetter;

        return ret;
    }

    module.exports = usngToUtm;

    provide('./usngToUtm', module.exports);
}());
