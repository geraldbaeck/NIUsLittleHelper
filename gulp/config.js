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
    }
  }
};
