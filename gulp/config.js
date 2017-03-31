// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

module.exports = {
  deploy: {
    packageName: 'niuslittehelper.zip',
    packItems: ['manifest.json', 'icons/**', 'img/**', 'js/**', 'src/**'],
    appID: 'fdldehahkijcfpmjhgnkggopliakcknj',
    OAuth: {
      clientSecret: process.env.CHROMESTORE_CLIENT_SECRET,
      tokenUri: 'https://accounts.google.com/o/oauth2/token',
      clientID: process.env.CHROMESTORE_CLIENT_ID,
      refreshToken: process.env.CHROMESTORE_REFRESH_TOKEN
    },
  },
  notify: {
    slack: {
      url: process.env.SLACK_INCOMING_WEBHOOK_URL,
      channel: '#general', // Optional
      user: 'DeployBot', // Optional
      icon_url: 'https://upload.wikimedia.org/wikipedia/commons/5/53/Google_Chrome_Material_Icon-450x450.png', // Optional
      icon_emoji: ':package:' // Optional
    },
  },
};
