var latlong = require('../lib/latlong'),
    checksums = require('./checksums');

checksums.forEach(function (item) {
    console.log("Check values:");
    console.log(item);

    console.log("UTM:", latlong.toUtm(item.latitude.decimal, item.longitude.decimal));
    console.log("MGRS:", latlong.toMgrs(item.latitude.decimal, item.longitude.decimal, 5, 'object'));

    console.log();
});
