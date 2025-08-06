// Enhanced astronomical calculation functions
const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const J2000 = 2451545.0;

// Utility functions
function mod360(x) {
  return x - 360 * Math.floor(x / 360);
}

function sin(x) { return Math.sin(x * DEG_TO_RAD); }
function cos(x) { return Math.cos(x * DEG_TO_RAD); }
function tan(x) { return Math.tan(x * DEG_TO_RAD); }
function asin(x) { return Math.asin(x) * RAD_TO_DEG; }
function acos(x) { return Math.acos(x) * RAD_TO_DEG; }
function atan2(y, x) { return Math.atan2(y, x) * RAD_TO_DEG; }

// Convert Date to Julian Date
function dateToJD(date) {
  const a = Math.floor((14 - (date.getUTCMonth() + 1)) / 12);
  const y = date.getUTCFullYear() + 4800 - a;
  const m = (date.getUTCMonth() + 1) + 12 * a - 3;
  
  let jdn = date.getUTCDate() + Math.floor((153 * m + 2) / 5) + 365 * y + 
            Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
  
  const jd = jdn + (date.getUTCHours() - 12) / 24 + date.getUTCMinutes() / 1440 + 
             date.getUTCSeconds() / 86400 + date.getUTCMilliseconds() / 86400000;
  
  return jd;
}

function julianCenturies(jd) {
  return (jd - J2000) / 36525.0;
}

function gmst(jd) {
  const T = julianCenturies(jd);
  let gmst = 280.46061837 + 360.98564736629 * (jd - J2000) + 
            0.000387933 * T * T - T * T * T / 38710000.0;
  return mod360(gmst);
}

function nutation(jd) {
  const T = julianCenturies(jd);
  const omega = mod360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000.0);
  const deltaPsi = -17.20 * sin(omega) - 1.32 * sin(2 * 280.4665 + 36000.7698 * T) 
                 - 0.23 * sin(2 * (134.96298 + 477198.867398 * T)) + 0.21 * sin(2 * omega);
  const deltaEps = 9.20 * cos(omega) + 0.57 * cos(2 * 280.4665 + 36000.7698 * T) 
                 + 0.10 * cos(2 * (134.96298 + 477198.867398 * T)) - 0.09 * cos(2 * omega);
  return {
    deltaPsi: deltaPsi / 3600.0,
    deltaEps: deltaEps / 3600.0
  };
}

function meanObliquity(jd) {
  const T = julianCenturies(jd);
  return 23.439291 - 0.0130042 * T - 0.000000164 * T * T + 0.000000504 * T * T * T;
}

// Enhanced Sun position calculation
function calculateSunPosition(jd) {
  const T = julianCenturies(jd);
  let L0 = mod360(280.4664567 + 36000.76982779 * T + 0.0003032028 * T * T + 
                 T * T * T / 49931821 - T * T * T * T / 15300000000);
  const M = mod360(357.5291092 + 35999.0502909 * T - 0.0001559 * T * T - 
                  T * T * T / 24490000);
  const C = (1.9146 - 0.004817 * T - 0.000014 * T * T) * sin(M) +
           (0.019993 - 0.000101 * T) * sin(2 * M) +
           0.000289 * sin(3 * M);
  const trueLon = L0 + C;
  const nut = nutation(jd);
  const apparentLon = trueLon + nut.deltaPsi;
  const eps = meanObliquity(jd) + nut.deltaEps;
  const alpha = atan2(cos(eps) * sin(apparentLon), cos(apparentLon));
  const delta = asin(sin(eps) * sin(apparentLon));
  
  return {
    ra: mod360(alpha),
    dec: delta
  };
}

// Enhanced Moon position calculation
function calculateMoonPosition(jd) {
  const T = julianCenturies(jd);
  const Lp = mod360(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T + 
                   T * T * T / 538841 - T * T * T * T / 65194000);
  const D = mod360(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T + 
                  T * T * T / 545868 - T * T * T * T / 113065000);
  const M = mod360(357.5291092 + 35999.0502909 * T - 0.0001559 * T * T - 
                  T * T * T / 24490000);
  const Mp = mod360(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T + 
                   T * T * T / 69699 - T * T * T * T / 14712000);
  const F = mod360(93.2720950 + 483202.0175233 * T - 0.0036539 * T * T - 
                  T * T * T / 3526000 + T * T * T * T / 863310000);

  // Major periodic terms
  let sigmaL = 0;
  sigmaL += 6.288774 * sin(Mp);
  sigmaL += 1.274027 * sin(2*D - Mp);
  sigmaL += 0.658314 * sin(2*D);
  sigmaL += 0.213618 * sin(2*Mp);
  sigmaL += -0.185116 * sin(M);
  sigmaL += -0.114332 * sin(2*F);
  sigmaL += 0.058793 * sin(2*D - 2*Mp);
  sigmaL += 0.057066 * sin(2*D - M - Mp);
  sigmaL += 0.053322 * sin(2*D + Mp);
  sigmaL += 0.045758 * sin(2*D - M);
  sigmaL += -0.040923 * sin(M - Mp);
  sigmaL += -0.034720 * sin(D);
  sigmaL += -0.030383 * sin(M + Mp);
  sigmaL += 0.015327 * sin(2*D - 2*F);

  let sigmaB = 0;
  sigmaB += 5.128122 * sin(F);
  sigmaB += 0.280602 * sin(Mp + F);
  sigmaB += 0.277693 * sin(Mp - F);
  sigmaB += 0.173237 * sin(2*D - F);
  sigmaB += 0.055413 * sin(2*D - Mp + F);
  sigmaB += 0.046271 * sin(2*D - Mp - F);
  sigmaB += 0.032573 * sin(2*D + F);
  sigmaB += 0.017198 * sin(2*Mp + F);

  const longitude = Lp + sigmaL;
  const latitude = sigmaB;
  const eps = meanObliquity(jd);
  const cosEps = cos(eps);
  const sinEps = sin(eps);
  const cosLat = cos(latitude);
  const sinLat = sin(latitude);
  const cosLon = cos(longitude);
  const sinLon = sin(longitude);
  
  const x = cosLon * cosLat;
  const y = sinLon * cosLat * cosEps - sinLat * sinEps;
  const z = sinLon * cosLat * sinEps + sinLat * cosEps;
  
  const ra = atan2(y, x);
  const dec = asin(z);
  
  return {
    ra: mod360(ra),
    dec: dec
  };
}

// Convert equatorial to horizontal coordinates
function equatorialToHorizontal(ra, dec, lat, lon, jd) {
  const lst = mod360(gmst(jd) + lon);
  const ha = mod360(lst - ra);
  const sinAlt = sin(lat) * sin(dec) + cos(lat) * cos(dec) * cos(ha);
  const alt = asin(sinAlt);
  return alt;
}

// Get sun altitude using enhanced calculations
function getSunAltitude(date, lat, lon) {
  const jd = dateToJD(date);
  const sun = calculateSunPosition(jd);
  return equatorialToHorizontal(sun.ra, sun.dec, lat, lon, jd);
}

// Get moon altitude using enhanced calculations
function getMoonAltitude(date, lat, lon) {
  const jd = dateToJD(date);
  const moon = calculateMoonPosition(jd);
  return equatorialToHorizontal(moon.ra, moon.dec, lat, lon, jd);
}

// Main calculation function
async function calculateIntervals(sunThreshold = -18, lat = 42.550639, lon = -72.876444) {
  const DAYS = 40,
        STEP_MIN = 5,
        REFINE_MS = 1 * 60 * 1000;
  const { DateTime } = luxon;

  // Timezone lookup
  const tzJson = await fetch(`https://timezone.bertold.org/timezone?lat=${lat}&lon=${lon}`)
                  .then(r => r.json());
  const tz = tzJson.Zones?.[0]?.TimezoneId;
  if (!tz) return alert("Timezone lookup failed");

  const now = DateTime.now().setZone(tz);
  const night0 = now.startOf("day").set({ hour:16, minute:0, second:0, millisecond:0 });

  // Binary refine helper
  function refine(getAlt, target, a, b, dir) {
    let lo = a, hi = b;
    while (hi - lo > REFINE_MS) {
      const mid = new Date((lo.valueOf() + hi.valueOf()) / 2);
      const alt = getAlt(mid);
      if ((alt < target && dir === "down") || (alt > target && dir === "up")) hi = mid;
      else lo = mid;
    }
    return hi;
  }

  // Build intervals
  const intervals = [];
  let totalDarkHours = 0;
  let longestInterval = 0;
  let shortestInterval = Infinity;

  console.group(`Enhanced precision sun/moon crossings (Sun threshold: ${sunThreshold}°)`);
  for (let d = 0; d < DAYS; d++) {
    const dayStart = night0.plus({ days: d });
    const label = dayStart.toFormat("ccc MMM dd");
    
    // Sample from 4 PM to 11 AM (19 hours)
    const samples = [];
    for (let m = 0; m <= 19 * 60; m += STEP_MIN) {
      const dt = dayStart.plus({ minutes: m }).toJSDate();
      const sun = getSunAltitude(dt, lat, lon);
      const moon = getMoonAltitude(dt, lat, lon);
      samples.push({ dt, sun, moon, dark: sun < sunThreshold && moon < 0 });
    }

    // Find crossings
    let sdI=-1, suI=-1, msI=-1, mrI=-1;
    for (let i = 1; i < samples.length; i++) {
      if (sdI<0 && samples[i-1].sun > sunThreshold && samples[i].sun <= sunThreshold) sdI = i;
      if (suI<0 && samples[i-1].sun < sunThreshold && samples[i].sun >= sunThreshold) suI = i;
      if (msI<0 && samples[i-1].moon > 0 && samples[i].moon <= 0) msI = i;
      if (mrI<0 && samples[i-1].moon < 0 && samples[i].moon >= 0) mrI = i;
    }

    const fmt = dt => DateTime.fromJSDate(dt).setZone(tz).toFormat("h:mm a");
    const sunDown = sdI<0 ? "(none)" : fmt(refine(
                    d=>getSunAltitude(d,lat,lon), sunThreshold,
                    samples[sdI-1].dt, samples[sdI].dt, "down"));
    const sunUp = suI<0 ? "(none)" : fmt(refine(
                  d=>getSunAltitude(d,lat,lon), sunThreshold,
                  samples[suI-1].dt, samples[suI].dt, "up"));
    const moonSet = msI<0 ? "(none)" : fmt(refine(
                    d=>getMoonAltitude(d,lat,lon), 0,
                    samples[msI-1].dt, samples[msI].dt, "down"));
    const moonRise = mrI<0 ? "(none)" : fmt(refine(
                     d=>getMoonAltitude(d,lat,lon), 0,
                     samples[mrI-1].dt, samples[mrI].dt, "up"));

    console.log(`${label} → Sun↓ ${sunDown} (${sunThreshold}°), Sun↑ ${sunUp} (${sunThreshold}°), Moon↓ ${moonSet}, Moon↑ ${moonRise}`);

    // Find dark intervals
    for (let i = 1; i < samples.length; i++) {
      if (!samples[i-1].dark && samples[i].dark) {
        // Start of dark interval
        let a = samples[i-1].dt, b = samples[i].dt;
        const startJS = refine(
          d => {
            const sunAlt = getSunAltitude(d, lat, lon);
            const moonAlt = getMoonAltitude(d, lat, lon);
            return (sunAlt < sunThreshold && moonAlt < 0) ? sunThreshold - 1 : sunThreshold + 1;
          },
          sunThreshold, a, b, "down"
        );

        // Find end of dark interval
        let j = i + 1;
        while (j < samples.length && samples[j].dark) {
          j++;
        }
        
        let endJS;
        if (j < samples.length) {
          a = samples[j-1].dt; 
          b = samples[j].dt;
          endJS = refine(
            d => {
              const sunAlt = getSunAltitude(d, lat, lon);
              const moonAlt = getMoonAltitude(d, lat, lon);
              return (sunAlt > sunThreshold || moonAlt > 0) ? sunThreshold + 1 : sunThreshold - 1;
            },
            sunThreshold, a, b, "up"
          );
        } else {
          endJS = samples[samples.length-1].dt;
        }

        const startDT = DateTime.fromJSDate(startJS).setZone(tz);
        const endDT = DateTime.fromJSDate(endJS).setZone(tz);
        const duration = endDT.diff(startDT, 'hours').hours;
        
        totalDarkHours += duration;
        longestInterval = Math.max(longestInterval, duration);
        shortestInterval = Math.min(shortestInterval, duration);

        intervals.push({
          dayLabel: dayStart.toFormat("MMM dd"),
          yIndex: d,
          startDT: startDT,
          endDT: endDT,
          duration: duration
        });
        break;
      }
    }
  }
  console.groupEnd();

  // Convert to numeric offsets
  intervals.forEach(iv => {
    const baseMs = night0.plus({ days: iv.yIndex }).toJSDate().valueOf();
    iv.x0 = (iv.startDT.toJSDate().valueOf() - baseMs) / (3600*1000);
    iv.x1 = (iv.endDT.toJSDate().valueOf() - baseMs) / (3600*1000);
  });

  return {
    intervals,
    totalDarkHours,
    longestInterval,
    shortestInterval: shortestInterval === Infinity ? 0 : shortestInterval,
    sunThreshold
  };
}