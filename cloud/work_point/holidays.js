const axios = require('axios');
const { catchError } = require('../crashlytics');

const checkHoliday = async (month, year) => {
  try {
    const response = await axios.get(`https://date.nager.at/api/v3/PublicHolidays/${year}/BR`);
    const data = response.data;
    return data.filter((holiday) => {
      const holidayMonth = holiday.date.split("-")[1];
      return parseInt(holidayMonth) == month;
    });
  } catch (error) {
    catchError(error);
    return [];
  }
}

module.exports = { checkHoliday };