(function () {
    "use strict";

    var DEG_2_RAD = Math.PI / 180,
        RAD_2_DEG = 180.0 / Math.PI,
        EQUATORIAL_RADIUS,
        ECC_SQUARED,
        ECC_PRIME_SQUARED,
        IS_NAD83_DATUM = true,
        EASTING_OFFSET = 500000.0,
        NORTHING_OFFSET = 10000000.0,
        GRIDSQUARE_SET_COL_SIZE = 8,  // column width of grid square set
        GRIDSQUARE_SET_ROW_SIZE = 20, // row height of grid square set
        BLOCK_SIZE  = 100000, // size of square identifier (within grid zone designation),
        E1,
        k0 = 0.9996; // scale factor of central meridian

    // check for NAD83
    if (IS_NAD83_DATUM) {
        EQUATORIAL_RADIUS = 6378137.0; // GRS80 ellipsoid (meters)
        ECC_SQUARED = 0.006694380023; 
    } else {
        // else NAD27 datum is assumed
        EQUATORIAL_RADIUS = 6378206.4; // Clarke 1866 ellipsoid (meters)
        ECC_SQUARED = 0.006768658;
    }

    // variable used in inverse formulas (UTMtoLL function)
    E1 = (1 - Math.sqrt(1 - ECC_SQUARED)) / (1 + Math.sqrt(1 - ECC_SQUARED));

    ECC_PRIME_SQUARED = ECC_SQUARED / (1 - ECC_SQUARED);

    module.exports.DEG_2_RAD = DEG_2_RAD;
    module.exports.RAD_2_DEG = RAD_2_DEG;
    module.exports.EQUATORIAL_RADIUS = EQUATORIAL_RADIUS;
    module.exports.ECC_SQUARED = ECC_SQUARED;
    module.exports.ECC_PRIME_SQUARED = ECC_PRIME_SQUARED;
    module.exports.EASTING_OFFSET = EASTING_OFFSET;
    module.exports.NORTHING_OFFSET = NORTHING_OFFSET;
    module.exports.GRIDSQUARE_SET_COL_SIZE = GRIDSQUARE_SET_COL_SIZE;
    module.exports.GRIDSQUARE_SET_ROW_SIZE = GRIDSQUARE_SET_ROW_SIZE;
    module.exports.BLOCK_SIZE = BLOCK_SIZE;
    module.exports.E1 = E1;
    module.exports.k0 = k0;
}());
