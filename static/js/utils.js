function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}

function calculateLocalSiderealTime(julianDate, longitude) {
    const T = (julianDate - 2451545.0) / 36525.0;
    let GMST = 280.46061837 + 360.98564736629 * (julianDate - 2451545.0) + 0.000387933 * T ** 2 - T ** 3 / 38710000.0;
    GMST %= 360;
    return GMST + longitude;
}