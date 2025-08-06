/**
 * Noon Julian Date Calculator
 * Calculates the Julian Date for local noon at any coordinate and date
 * Supports timezone detection via API with fallback to coordinate-based estimation
 */

class NoonJulianCalculator {
    constructor() {
        // Predefined timezone offsets (standard time in hours)
        this.timezoneOffsets = {
            "Africa/Abidjan": 0, "Africa/Accra": 0, "Africa/Addis_Ababa": 3, "Africa/Algiers": 1,
            "Africa/Asmara": 3, "Africa/Bamako": 0, "Africa/Bangui": 1, "Africa/Blantyre": 2,
            "Africa/Brazzaville": 1, "Africa/Cairo": 2, "Africa/Casablanca": 1, "Africa/Conakry": 0,
            "Africa/Dakar": 0, "Africa/Dar_es_Salaam": 3, "Africa/Douala": 1, "Africa/El_Aaiun": 1,
            "Africa/Freetown": 0, "Africa/Gaborone": 2, "Africa/Harare": 2, "Africa/Johannesburg": 2,
            "Africa/Juba": 2, "Africa/Khartoum": 2, "Africa/Kinshasa": 1, "Africa/Lagos": 1,
            "Africa/Libreville": 1, "Africa/Luanda": 1, "Africa/Lubumbashi": 2, "Africa/Lusaka": 2,
            "Africa/Maputo": 2, "Africa/Maseru": 2, "Africa/Mogadishu": 3, "Africa/Monrovia": 0,
            "Africa/Nairobi": 3, "Africa/Ndjamena": 1, "Africa/Niamey": 1, "Africa/Nouakchott": 0,
            "Africa/Ouagadougou": 0, "Africa/Tripoli": 2, "Africa/Windhoek": 2,
            "America/New_York": -5, "America/Chicago": -6, "America/Denver": -7, "America/Los_Angeles": -8,
            "America/Anchorage": -9, "America/Adak": -10, "America/Halifax": -4, "America/Toronto": -5,
            "America/Vancouver": -8, "America/Winnipeg": -6, "America/Edmonton": -7, "America/Montreal": -5,
            "America/Mexico_City": -6, "America/Havana": -5, "America/Nassau": -5, "America/Jamaica": -5,
            "America/Bogota": -5, "America/Lima": -5, "America/Santiago": -4, "America/Sao_Paulo": -3,
            "America/Argentina/Buenos_Aires": -3, "America/Montevideo": -3, "America/La_Paz": -4,
            "America/Caracas": -4, "America/Guyana": -4, "America/Paramaribo": -3, "America/Manaus": -4,
            "Europe/London": 0, "Europe/Paris": 1, "Europe/Berlin": 1, "Europe/Rome": 1,
            "Europe/Madrid": 1, "Europe/Amsterdam": 1, "Europe/Brussels": 1, "Europe/Vienna": 1,
            "Europe/Warsaw": 1, "Europe/Prague": 1, "Europe/Budapest": 1, "Europe/Zurich": 1,
            "Europe/Stockholm": 1, "Europe/Oslo": 1, "Europe/Copenhagen": 1, "Europe/Helsinki": 2,
            "Europe/Athens": 2, "Europe/Bucharest": 2, "Europe/Sofia": 2, "Europe/Moscow": 3,
            "Europe/Istanbul": 3, "Europe/Kiev": 2, "Europe/Minsk": 3, "Europe/Dublin": 1,
            "Asia/Tokyo": 9, "Asia/Shanghai": 8, "Asia/Hong_Kong": 8, "Asia/Singapore": 8,
            "Asia/Seoul": 9, "Asia/Taipei": 8, "Asia/Bangkok": 7, "Asia/Jakarta": 7,
            "Asia/Manila": 8, "Asia/Kuala_Lumpur": 8, "Asia/Mumbai": 5.5, "Asia/Kolkata": 5.5,
            "Asia/Delhi": 5.5, "Asia/Karachi": 5, "Asia/Dubai": 4, "Asia/Tehran": 3.5,
            "Asia/Baghdad": 3, "Asia/Riyadh": 3, "Asia/Jerusalem": 2, "Asia/Damascus": 2,
            "Australia/Sydney": 10, "Australia/Melbourne": 10, "Australia/Brisbane": 10,
            "Australia/Perth": 8, "Australia/Adelaide": 9.5, "Australia/Darwin": 9.5,
            "Pacific/Auckland": 12, "Pacific/Fiji": 12, "Pacific/Honolulu": -10, "Pacific/Tahiti": -10,
            "Etc/UTC": 0, "Etc/GMT": 0
        };

        // Daylight saving time observance
        this.daylightSavings = {
            "America/New_York": true, "America/Chicago": true, "America/Denver": true, 
            "America/Los_Angeles": true, "America/Anchorage": true, "America/Adak": true,
            "America/Halifax": true, "America/Toronto": true, "America/Vancouver": true,
            "America/Winnipeg": true, "America/Edmonton": true, "America/Montreal": true,
            "Europe/London": true, "Europe/Paris": true, "Europe/Berlin": true, "Europe/Rome": true,
            "Europe/Madrid": true, "Europe/Amsterdam": true, "Europe/Brussels": true, "Europe/Vienna": true,
            "Europe/Warsaw": true, "Europe/Prague": true, "Europe/Budapest": true, "Europe/Zurich": true,
            "Europe/Stockholm": true, "Europe/Oslo": true, "Europe/Copenhagen": true, "Europe/Helsinki": true,
            "Europe/Athens": true, "Europe/Bucharest": true, "Europe/Sofia": true, "Europe/Dublin": true,
            "Australia/Sydney": true, "Australia/Melbourne": true, "Australia/Adelaide": true,
            "Pacific/Auckland": true
        };
    }

    /**
     * Get timezone ID from coordinates using external API
     * @param {number} lat - Latitude in decimal degrees
     * @param {number} lon - Longitude in decimal degrees
     * @returns {Promise<string>} - Timezone ID (e.g., "America/New_York")
     */
    async getTimezoneFromAPI(lat, lon) {
        const apiUrl = `https://timezone.bertold.org/timezone?lat=${lat}&lon=${lon}`;
        
        try {
            const response = await fetch(apiUrl);
            const data = await response.json();
            
            if (data.Zones && data.Zones.length > 0) {
                return data.Zones[0].TimezoneId;
            } else {
                throw new Error('No timezone data available');
            }
        } catch (error) {
            console.warn('Failed to fetch timezone data, using fallback:', error);
            // Fallback to basic longitude-based estimation
            const offsetHours = Math.round(lon / 15);
            return `Etc/GMT${offsetHours <= 0 ? '+' + Math.abs(offsetHours) : '-' + offsetHours}`;
        }
    }

    /**
     * Check if daylight saving time is in effect for a given date and timezone
     * @param {Date} date - Date to check
     * @param {string} timezoneId - Timezone ID
     * @returns {boolean} - True if DST is in effect
     */
    isDaylightSavingTime(date, timezoneId) {
        // For US timezones, DST runs from second Sunday in March to first Sunday in November
        if (timezoneId.startsWith('America/')) {
            const year = date.getFullYear();
            
            // Second Sunday of March at 2 AM
            const dstStart = new Date(year, 2, 8); // March 8th
            dstStart.setDate(dstStart.getDate() + (7 - dstStart.getDay()) % 7); // Next Sunday
            if (dstStart.getDate() <= 7) {
                dstStart.setDate(dstStart.getDate() + 7); // Make it second Sunday
            }
            dstStart.setHours(2);
            
            // First Sunday of November at 2 AM
            const dstEnd = new Date(year, 10, 1); // November 1st
            dstEnd.setDate(dstEnd.getDate() + (7 - dstEnd.getDay()) % 7); // Next Sunday
            dstEnd.setHours(2);
            
            return date >= dstStart && date < dstEnd;
        }
        
        // For European timezones, DST runs from last Sunday in March to last Sunday in October
        if (timezoneId.startsWith('Europe/')) {
            const year = date.getFullYear();
            
            // Last Sunday of March at 2 AM
            const dstStart = new Date(year, 2, 31); // March 31st
            dstStart.setDate(dstStart.getDate() - dstStart.getDay()); // Previous Sunday
            dstStart.setHours(2);
            
            // Last Sunday of October at 2 AM
            const dstEnd = new Date(year, 9, 31); // October 31st
            dstEnd.setDate(dstEnd.getDate() - dstEnd.getDay()); // Previous Sunday
            dstEnd.setHours(2);
            
            return date >= dstStart && date < dstEnd;
        }
        
        // For other timezones, return false (most don't observe DST)
        return false;
    }

    /**
     * Convert a Date object to Julian Date
     * @param {Date} date - Date object in UTC
     * @returns {number} - Julian Date
     */
    dateToJulianDate(date) {
        const year = date.getUTCFullYear();
        const month = date.getUTCMonth() + 1;
        const day = date.getUTCDate();
        const hour = date.getUTCHours();
        const minute = date.getUTCMinutes();
        const second = date.getUTCSeconds();
        const millisecond = date.getUTCMilliseconds();
        
        // Julian Date calculation
        const a = Math.floor((14 - month) / 12);
        const y = year + 4800 - a;
        const m = month + 12 * a - 3;
        
        let jd = day + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
        
        // Add time component as fraction of day
        const timeAsFraction = (hour + minute/60 + second/3600 + millisecond/3600000) / 24;
        jd += timeAsFraction - 0.5; // Subtract 0.5 because JD starts at noon UTC
        
        return jd;
    }

    /**
     * Calculate Julian Date for local noon at given coordinates and date
     * @param {number} latitude - Latitude in decimal degrees (-90 to 90)
     * @param {number} longitude - Longitude in decimal degrees (-180 to 180)
     * @param {string} dateString - Date string in YYYY-MM-DD format
     * @param {boolean} useAPI - Whether to use timezone API (default: true)
     * @returns {Promise<Object>} - Object containing Julian Date and metadata
     */
    async calculateNoonJulianDate(latitude, longitude, dateString, useAPI = true) {
        // Validate inputs
        if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
            throw new Error('Latitude must be a number between -90 and 90');
        }
        if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
            throw new Error('Longitude must be a number between -180 and 180');
        }
        if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            throw new Error('Date must be in YYYY-MM-DD format');
        }

        let timezoneId;
        if (useAPI) {
            timezoneId = await this.getTimezoneFromAPI(latitude, longitude);
        } else {
            // Simple fallback based on longitude
            const offsetHours = Math.round(longitude / 15);
            timezoneId = `Etc/GMT${offsetHours <= 0 ? '+' + Math.abs(offsetHours) : '-' + offsetHours}`;
        }
        
        // Get base UTC offset for this timezone
        const baseOffset = this.timezoneOffsets[timezoneId] || 0;
        
        // Create a date object for the specified date
        const inputDate = new Date(dateString + 'T00:00:00Z');
        
        // Check if DST is in effect on this date
        const isDST = this.isDaylightSavingTime(inputDate, timezoneId) && this.daylightSavings[timezoneId];
        
        // Calculate total offset (including DST)
        const totalOffsetHours = isDST ? baseOffset + 1 : baseOffset;
        
        // Create local noon time and convert to UTC
        // Local noon means 12:00 in the local timezone
        // To convert to UTC: UTC = Local - offset
        const noonUTC = new Date(dateString + 'T12:00:00Z');
        noonUTC.setUTCHours(12 - totalOffsetHours);
        
        // Calculate Julian Date
        const julianDate = this.dateToJulianDate(noonUTC);
        
        // Return comprehensive result
        return {
            julianDate: julianDate,
            julianDateFormatted: julianDate.toFixed(6),
            localTime: {
                date: dateString,
                time: '12:00:00',
                timezone: timezoneId,
                offset: totalOffsetHours,
                isDST: isDST
            },
            utcTime: {
                date: noonUTC.toISOString().split('T')[0],
                time: noonUTC.toISOString().split('T')[1].split('.')[0],
                datetime: noonUTC.toISOString()
            },
            coordinates: {
                latitude: latitude,
                longitude: longitude
            }
        };
    }
}

// Export for different module systems
if (typeof module !== 'undefined' && module.exports) {
    // Node.js
    module.exports = NoonJulianCalculator;
} else if (typeof define === 'function' && define.amd) {
    // AMD
    define([], function() { return NoonJulianCalculator; });
} else {
    // Browser global
    window.NoonJulianCalculator = NoonJulianCalculator;
}