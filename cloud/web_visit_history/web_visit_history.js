const { validationAdminRules } = require('../roles/validation_roles');

Parse.Cloud.define('web-visit-history', async (request) => {
  const { user } = request;

  const query = new Parse.Query("WebsiteVisitHistory");

  const response = await query.findAll({ sessionToken: user.getSessionToken() });

  return response.map((item) => {
    return {
      objectId: item.id,
      website: item.get("website") ?? null,
      ip: item.get("ip") ?? null,
      userAgent: item.get("userAgent") ?? null,
      country: item.get("country") ?? null,
      countryCode: item.get("countryCode") ?? null,
      countryFlag: item.get("countryCode") == null ? null : `https://flagcdn.com/w320/${item.get("countryCode").toLowerCase()}.png`,
      region: item.get("region") ?? null,
      regionName: item.get("regionName") ?? null,
      city: item.get("city") ?? null,
      zip: item.get("zip") ?? null,
      lat: item.get("lat") ?? null,
      lon: item.get("lon") ?? null,
      timezone: item.get("timezone") ?? null,
      isp: item.get("isp") ?? null,
      org: item.get("org") ?? null,
      as: item.get("as") ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString(),
    };
  });
}, validationAdminRules, {
  requireUser: true
});