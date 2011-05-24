(function () {
    "use strict";

    require('require-kiss');

    var decimalToDegMinSec = require('./latlong/decimalToDegMinSec'),
        degMinSecToDecimal = require('./latlong/degMinSecToDecimal'),
        latLongToUtm = require('./latlong/latlongToUtm'),
        latLongToUsng = require('./latlong/latlongToUsng'),
        latLongToMgrs = require('./latlong/latlongToMgrs'),
        translate = require('./latlong/translate');

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

    module.exports.translate = translate;

    provide('latlong', module.exports);
}());
