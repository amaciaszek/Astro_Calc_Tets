function raDecToAltAz(RA, Dec, latitude, longitude, Julian_date) {
    const LST = calculateLocalSiderealTime(Julian_date, longitude);
    const RA_rad = degreesToRadians(RA * 15);
    const Dec_rad = degreesToRadians(Dec);
    const LST_rad = degreesToRadians(LST);
    const latitude_rad = degreesToRadians(latitude);
    const HA = LST_rad - RA_rad;
    const sin_altitude = Math.sin(Dec_rad) * Math.sin(latitude_rad) + Math.cos(Dec_rad) * Math.cos(latitude_rad) * Math.cos(HA);
    const altitude_rad = Math.asin(sin_altitude);
    const altitude = radiansToDegrees(altitude_rad) * -1 + 90;
    const cos_azimuth = (Math.sin(Dec_rad) - Math.sin(altitude_rad) * Math.sin(latitude_rad)) / (Math.cos(altitude_rad) * Math.cos(latitude_rad));
    const sin_azimuth = -Math.cos(Dec_rad) * Math.sin(HA) / Math.cos(altitude_rad);
    const azimuth_rad = Math.atan2(sin_azimuth, cos_azimuth);
    return [radiansToDegrees(altitude_rad) * -1 + 90, (radiansToDegrees(azimuth_rad) + 360) % 360];
}

function parseCSV(csv) {
    const lines = csv.split('\n');
    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');

        // Check if the number of values matches the number of headers
        if (values.length === headers.length) {
            const row = {};

            // Iterate over each header and assign the corresponding value
            headers.forEach((header, index) => {
                // Remove quotes and leading/trailing whitespace
                const cleanedValue = values[index].replace(/^"(.*)"$/, '$1').trim();
                row[header.trim()] = cleanedValue === 'None' ? '' : cleanedValue; // Convert 'None' to empty string
            });

            data.push(row);
        }
    }

    return data;
}

function getMarkerSize(magnitude) {
    if (magnitude <= 1) {
        return 6;
    } else if (magnitude <= 2) {
        return 5;
    } else if (magnitude <= 3) {
        return 4;
    } else if (magnitude <= 4) {
        return 3;
    } else if (magnitude <= 5) {
        return 1.5;
    } else {
        return 0.2;
    }
}

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