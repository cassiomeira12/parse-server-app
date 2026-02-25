Parse.Cloud.beforeFind('WebsiteVisitHistory', (req) => {
  let query = req.query;
  query.descending('createdAt');
});

Parse.Cloud.afterFind('WebsiteVisitHistory', async (request) => {
  request.objects.map((object) => {
    object.unset('ACL');
    const countryCode = object.get('countryCode');
    if (countryCode != undefined) {
      const flag = `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
      object.set('countryFlag', flag);
    }
  });
});