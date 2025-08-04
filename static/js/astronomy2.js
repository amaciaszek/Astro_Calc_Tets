<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Celestial Rise, Set, and Culmination Times</title>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
    <script src="https://cdn.jsdelivr.net/gh/lizard-isana/orb.js@2.3/build/orb.v2.js"></script>
</head>
<body>
    <h1>Celestial Rise, Set, and Culmination Times (Julian Date)</h1>
    <div id="results"></div>

    <script>
        const latitude = 55;
        const longitude = -72;
        const date = new Date(2024, 6, 22); // Months are zero-indexed in JavaScript

        function toJulianDate(date) {
            return (date.getTime() / 86400000) + 2440587.5;
        }

		function getSunAltitude(observer, jd) {
			const time = new Orb.Time(new Date((jd - 2440587.5) * 86400000));
			const position = new Orb.Sun().radec(time.date);
			const horizontal = new Orb.Observation({ observer: observer, target: position }).azel(time.date);
			return horizontal.elevation;
		}

		function findTwilightTimes(observer, jdStart, jdEnd, targetAltitude, isStart) {
			let jdLow = jdStart;
			let jdHigh = jdEnd;
			let jdMid;
			let altitude;

			while (jdHigh - jdLow > 1 / 86400) { // Precision of 1 second
				jdMid = (jdLow + jdHigh) / 2;
				altitude = getSunAltitude(observer, jdMid);

				console.log(`Checking JD: ${jdMid}, Altitude: ${altitude}, Target Altitude: ${targetAltitude}`);

				if (isStart) {
					if (altitude < targetAltitude) {
						jdLow = jdMid; // Sunrise needs to be later
					} else {
						jdHigh = jdMid; // Sunrise needs to be earlier
					}
				} else {
					if (altitude > targetAltitude) {
						jdHigh = jdMid; // Sunset needs to be earlier
					} else {
						jdLow = jdMid; // Sunset needs to be later
					}
				}
			}

			return (jdLow + jdHigh) / 2;
		}

		function calculateTwilightTimes(observer, jdStart, jdEnd) {
			const targetAltitude = -12; // Twilight altitude

			// Morning Twilight Start
			const morningTwilightStart = findTwilightTime(observer, jdStart, jdEnd, targetAltitude, true);

			// Evening Twilight End
			const eveningTwilightEnd = findTwilightTime(observer, jdStart, jdEnd, targetAltitude, false);

			console.log(`Morning Twilight Start JD: ${morningTwilightStart}`);
			console.log(`Evening Twilight End JD: ${eveningTwilightEnd}`);

			return {
				morningTwilightStart,
				eveningTwilightEnd
			};
		}

        function findTransition(body, observer, startJd, endJd, step, transitionType, altitude) {
            let previousAltitude = null;
            let transitionTime = null;
            let jd = startJd;

            while (jd <= endJd) {
                const time = new Orb.Time(new Date((jd - 2440587.5) * 86400000));
                const position = body.radec(time.date);
                const horizontal = new Orb.Observation({ observer: observer, target: position }).azel(time.date);

                if (previousAltitude !== null) {
                    if (transitionType === "rise" && previousAltitude <= altitude && horizontal.elevation > altitude) {
                        transitionTime = jd;
                        break;
                    }
                    if (transitionType === "set" && previousAltitude >= altitude && horizontal.elevation < altitude) {
                        transitionTime = jd;
                        break;
                    }
                }
                previousAltitude = horizontal.elevation;
                jd += step;
            }

            return transitionTime;
        }

        function refineTransition(body, observer, startJd, endJd, transitionType, altitude) {
            let step = (endJd - startJd) / 2;
            let jd = (startJd + endJd) / 2;

            while (step > 1 / 1440) { // Refine until step is smaller than 1 minute
                const time = new Orb.Time(new Date((jd - 2440587.5) * 86400000));
                const position = body.radec(time.date);
                const horizontal = new Orb.Observation({ observer: observer, target: position }).azel(time.date);

                if (transitionType === "rise") {
                    if (horizontal.elevation > altitude) {
                        endJd = jd;
                    } else {
                        startJd = jd;
                    }
                } else if (transitionType === "set") {
                    if (horizontal.elevation < altitude) {
                        startJd = jd;
                    } else {
                        endJd = jd;
                    }
                }

                step /= 2;
                jd = (startJd + endJd) / 2;
            }

            return jd;
        }

        function calculateRiseSetCulminationTimes(body, name, observer, twilightStart, twilightEnd, results) {
            const jd = toJulianDate(date);
            let riseTime = null;
            let setTime = null;

            // First pass: hourly intervals for 0° altitude
            riseTime = findTransition(body, observer, jd, jd + 1, 1 / 24, "rise", 0);

            // Find set time starting from rise time until the end of the next day
            if (riseTime) {
                setTime = findTransition(body, observer, riseTime, riseTime + 1.5, 1 / 24, "set", 0);

                // Refine rise time: 15-minute intervals
                riseTime = refineTransition(body, observer, riseTime - 1 / 24, riseTime + 1 / 24, "rise", 0);

                // Refine set time: 15-minute intervals
                if (setTime) {
                    setTime = refineTransition(body, observer, setTime - 1 / 24, setTime + 1 / 24, "set", 0);
                }
            }

            // Calculate culmination time and altitude
            let culminationTime = null;
            let culminationAltitude = null;

            if (riseTime && setTime) {
                culminationTime = (riseTime + setTime) / 2;
                culminationAltitude = calculateAltitude(body, observer, culminationTime);
            }

            // Apply twilight visibility rules for non-Sun/Moon bodies
            if (name !== 'Sun' && name !== 'Moon') {
                if (riseTime !== null && riseTime < twilightStart) {
                    riseTime = twilightStart;
                }
                if (setTime !== null && setTime > twilightEnd) {
                    setTime = twilightEnd;
                }
                if (culminationTime !== null) {
                    if (culminationTime < twilightStart) {
                        culminationTime = twilightStart;
                    }
                    if (culminationTime > twilightEnd) {
                        culminationTime = twilightEnd;
                    }
                }
            }

            // Display results
            results.innerHTML += `<p>${name}: Rise - ${riseTime !== null ? riseTime.toFixed(5) : 'N/A'}, Set - ${setTime !== null ? setTime.toFixed(5) : 'N/A'}, Culmination - ${culminationTime !== null ? culminationTime.toFixed(5) : 'N/A'} (Altitude: ${culminationAltitude !== null ? culminationAltitude.toFixed(2) : 'N/A'}°) ${name === 'Sun' || name === 'Moon' ? '(Visible)' : (riseTime > twilightEnd || setTime < twilightStart ? '(Not Visible)' : '(Visible)')}</p>`;
        }

        function calculateAltitude(body, observer, jd) {
            const time = new Orb.Time(new Date((jd - 2440587.5) * 86400000));
            const position = body.radec(time.date);
            const horizontal = new Orb.Observation({ observer: observer, target: position }).azel(time.date);
            return horizontal.elevation;
        }

        window.onload = () => {
            if (typeof Orb === 'undefined') {
                console.error('Orb.js library not loaded correctly.');
                return;
            }

            const observer = {
                latitude: latitude,
                longitude: longitude,
                altitude: 0
            };

            const results = document.getElementById('results');

            // Calculate twilight times for the Sun
            const twilightAltitude = -12;
            const twilightTimes = findTwilightTimes(observer, toJulianDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1)), toJulianDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)), twilightAltitude);

            // Refine twilight times
            twilightTimes.twilightStart = refineTwilightTime(observer, twilightTimes.twilightStart, twilightAltitude, true);
            twilightTimes.twilightEnd = refineTwilightTime(observer, twilightTimes.twilightEnd, twilightAltitude, false);

            results.innerHTML += `<p>Morning Twilight Start (JD): ${twilightTimes.twilightStart.toFixed(5)}</p>`;
            results.innerHTML += `<p>Evening Twilight End (JD): ${twilightTimes.twilightEnd.toFixed(5)}</p>`;

            const bodies = [
                { body: new Orb.Sun(), name: 'Sun' },
                { body: new Orb.Moon(), name: 'Moon' },
                { body: new Orb.Mercury(), name: 'Mercury' },
                { body: new Orb.Venus(), name: 'Venus' },
                { body: new Orb.Mars(), name: 'Mars' },
                { body: new Orb.Jupiter(), name: 'Jupiter' },
                { body: new Orb.Saturn(), name: 'Saturn' },
                { body: new Orb.Uranus(), name: 'Uranus' },
                { body: new Orb.Neptune(), name: 'Neptune' }
            ];

            bodies.forEach(({ body, name }) => {
                calculateRiseSetCulminationTimes(body, name, observer, twilightTimes.twilightStart, twilightTimes.twilightEnd, results);
            });
        };
    </script>
</body>
</html>
