/**
 * Hebrew Clock - Displays current time in Hebrew words with nikud
 */

(function() {
  'use strict';

  // Hebrew hours (12-hour format, 1-12)
  const HOURS = {
    1: 'אַחַת',
    2: 'שְׁתַּיִם',
    3: 'שָׁלוֹשׁ',
    4: 'אַרְבַּע',
    5: 'חָמֵשׁ',
    6: 'שֵׁשׁ',
    7: 'שֶׁבַע',
    8: 'שְׁמוֹנֶה',
    9: 'תֵּשַׁע',
    10: 'עֶשֶׂר',
    11: 'אַחַת עֶשְׂרֵה',
    12: 'שְׁתֵּים עֶשְׂרֵה'
  };

  // Hebrew minutes units (1-9, feminine form)
  const MINUTE_UNITS = {
    1: 'אַחַת',
    2: 'שְׁתַּיִם',
    3: 'שָׁלוֹשׁ',
    4: 'אַרְבַּע',
    5: 'חָמֵשׁ',
    6: 'שֵׁשׁ',
    7: 'שֶׁבַע',
    8: 'שְׁמוֹנֶה',
    9: 'תֵּשַׁע'
  };

  // Hebrew tens (10, 20, 30, 40, 50)
  const MINUTE_TENS = {
    10: 'עֶשֶׂר',
    20: 'עֶשְׂרִים',
    30: 'שְׁלוֹשִׁים',
    40: 'אַרְבָּעִים',
    50: 'חֲמִשִּׁים'
  };

  // Hebrew teens (11-19)
  const MINUTE_TEENS = {
    11: 'אַחַת עֶשְׂרֵה',
    12: 'שְׁתֵּים עֶשְׂרֵה',
    13: 'שְׁלוֹשׁ עֶשְׂרֵה',
    14: 'אַרְבַּע עֶשְׂרֵה',
    15: 'חֲמֵשׁ עֶשְׂרֵה',
    16: 'שֵׁשׁ עֶשְׂרֵה',
    17: 'שְׁבַע עֶשְׂרֵה',
    18: 'שְׁמוֹנֶה עֶשְׂרֵה',
    19: 'תְּשַׁע עֶשְׂרֵה'
  };

  // Time of day periods
  function getTimeOfDay(hour24) {
    if (hour24 >= 5 && hour24 <= 11) {
      return 'בַּבֹּקֶר';
    } else if (hour24 === 12) {
      return 'בַּצָּהֳרַיִם';
    } else if (hour24 >= 13 && hour24 <= 16) {
      return 'אַחֲרֵי הַצָּהֳרַיִם';
    } else if (hour24 >= 17 && hour24 <= 20) {
      return 'בָּעֶרֶב';
    } else {
      // 21-4
      return 'בַּלַּיְלָה';
    }
  }

  // Convert minute to Hebrew
  function minuteToHebrew(minute) {
    if (minute === 0) {
      return '';
    }

    if (minute <= 9) {
      return MINUTE_UNITS[minute];
    }

    if (minute === 10) {
      return MINUTE_TENS[10];
    }

    if (minute >= 11 && minute <= 19) {
      return MINUTE_TEENS[minute];
    }

    const tens = Math.floor(minute / 10) * 10;
    const units = minute % 10;

    if (units === 0) {
      return MINUTE_TENS[tens];
    }

    // Format: tens + וְ + units (e.g., עֶשְׂרִים וְאַחַת)
    return MINUTE_TENS[tens] + ' וְ' + MINUTE_UNITS[units];
  }

  // Convert 24-hour to 12-hour format
  function to12Hour(hour24) {
    if (hour24 === 0) return 12;
    if (hour24 > 12) return hour24 - 12;
    return hour24;
  }

  // Get full Hebrew time string
  function getHebrewTime(date) {
    const hour24 = date.getHours();
    const minute = date.getMinutes();

    const hour12 = to12Hour(hour24);
    const hourHebrew = HOURS[hour12];
    const minuteHebrew = minuteToHebrew(minute);
    const timeOfDay = getTimeOfDay(hour24);

    if (minute === 0) {
      // Just the hour: "שָׁלוֹשׁ בַּבֹּקֶר"
      return hourHebrew + ' ' + timeOfDay;
    }

    // Hour + וְ + minutes + time of day: "שָׁלוֹשׁ וְעֶשְׂרִים בַּבֹּקֶר"
    return hourHebrew + ' וְ' + minuteHebrew + ' ' + timeOfDay;
  }

  // Update the display
  function updateDisplay() {
    const element = document.getElementById('hebrew-time');
    if (!element) return;

    const now = new Date();
    element.textContent = getHebrewTime(now);

    // Schedule next update at the start of the next minute
    const msUntilNextMinute = (60 - now.getSeconds()) * 1000 - now.getMilliseconds();
    setTimeout(updateDisplay, msUntilNextMinute);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateDisplay);
  } else {
    updateDisplay();
  }
})();
