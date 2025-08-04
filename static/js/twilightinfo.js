function julianToDate(jd) {
    const JD_JAN_1_1970 = 2440587.5;
    const date = new Date((jd - JD_JAN_1_1970) * 86400000); // Convert Julian Date to UNIX timestamp in milliseconds
    return date;
}

function calculateSunPosition(lat, lon, jd) {
    const date = julianToDate(jd);
    const sunPos = SunCalc.getPosition(date, lat, lon);
    const altitude = sunPos.altitude * (180 / Math.PI); // Convert from radians to degrees
    return altitude;
}

function checkTwilight(lat, lon, jd) {
    const altitude = calculateSunPosition(lat, lon, jd);

    if (altitude >= 0 && altitude <= 90) {
        return "Day";
    } else if (altitude >= -6 && altitude < 0) {
        return "Civil Twilight";
    } else if (altitude >= -12 && altitude < -6) {
        return "Nautical Twilight";
    } else if (altitude >= -18 && altitude < -12) {
        return "Astronomical Twilight";
    } else if (altitude >= -90 && altitude < -18) {
        return "Night";
    } else {
        return "Unknown";
    }
}

function getSunPosition() {
    const lat = parseFloat(document.getElementById('latitude').value);
    const lon = parseFloat(document.getElementById('longitude').value);
    const jd = parseFloat(document.getElementById('julian_date').value);

    const altitude = calculateSunPosition(lat, lon, jd);
    const twilight = checkTwilight(lat, lon, jd);
    document.getElementById('result').innerHTML = `Sun Altitude: ${altitude.toFixed(2)} degrees<br>Twilight: ${twilight}`;
}
