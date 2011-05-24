(function () {
    require('require-kiss');

    var mgrsToUtm = require('./mgrs/mgrsToUtm');

    function getConverter(outputType) {
        var fn;

        switch (outputType.toLowerCase()) {
            case 'latlong':
                fn = usng.toLatLong;
                break;
            
            case 'latlong':
                fn = usng.toUtm;
                break;
        }

        return fn;
    }

    module.exports.getConverter = getConverter;
    module.exports.toLatLong = usng.toLatLong;
    module.exports.toUtm = mgrsToUtm;

    provide('mgrs', module.exports);
}());
