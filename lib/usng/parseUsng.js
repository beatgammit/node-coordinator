(function () {
    "use strict";

    require('require-kiss');

    /*
     * Converts lower-case characters to upper case, removes spaces, and 
     * separates the string into logical parts.
     */
    function parseUsng(usngStr_input) {
        var j = 0,
            k,
            usngStr = [],
            usngStr_temp = [],
            parts = {};

        usngStr_temp = usngStr_input.toUpperCase();

        // put usgn string in 'standard' form with no space delimiters
        usngStr = usngStr_temp.replace(/%20/g, "");
        usngStr = usngStr_temp.replace(/ /g, "");

        if (usngStr.length < 7) {
            alert("This application requires minimum USNG precision of 10,000 meters");
            return 0;
        }

        // break usng string into its component pieces
        parts.zone = usngStr.match(/^\d{1,2}/)[0];
        j += parts.zone.length;
        parts.zone = parseInt(parts.zone, 10);
        parts.zoneLetter = usngStr.charAt(j); j+= 1;
        parts.sq1 = usngStr.charAt(j); j += 1;
        parts.sq2 = usngStr.charAt(j); j += 1;

        parts.precision = (usngStr.length-j) / 2;
        parts.east='';
        parts.north='';
        for (k = 0; k < parts.precision; k += 1) {
            parts.east += usngStr.charAt(j);
            j += 1;
        }

        if (usngStr[j] === " ") {
            j += 1;
        }
        for (k = 0; k < parts.precision; k += 1) {
            parts.north += usngStr.charAt(j);
            j += 1;
        }

        return parts;
    }

    module.exports = parseUsng;

    provide('./parseUsng', module.exports);
}());
