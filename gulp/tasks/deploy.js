// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

const gulp = require('gulp');

const fs = require('fs');
const request = require('request');

const config = require('../config').deploy;

// get auth code
// https://accounts.google.com/o/oauth2/auth?response_type=code&scope=https://www.googleapis.com/auth/chromewebstore&client_id=128541779160-kluj57pq14a9b63a58rp4v34eanponav.apps.googleusercontent.com&redirect_uri=urn:ietf:wg:oauth:2.0:oob

// get token
// curl "https://accounts.google.com/o/oauth2/token" -d "client_id=128541779160-kluj57pq14a9b63a58rp4v34eanponav.apps.googleusercontent.com&client_secret=jK5c8FNxC9ZJArFO1nQ7Qt70&code=$CODE&grant_type=authorization_code&redirect_uri=urn:ietf:wg:oauth:2.0:oob"

// https://developer.chrome.com/webstore/using_webstore_api
// https://chrome.google.com/webstore/detail/nius-litte-helper/fdldehahkijcfpmjhgnkggopliakcknj?hl=de

gulp.task('deploy', function(cb) {
  // Create new access token with refresh token
  // https://developers.google.com/identity/protocols/OAuth2WebServer#offline
  var options = {
    method: 'POST',
    url: 'https://www.googleapis.com/oauth2/v4/token',
    headers: {
      'cache-control': 'no-cache',
      'content-type': 'application/x-www-form-urlencoded'
    },
    form: {
      refresh_token: config.OAuth.refreshToken,
      client_id: config.OAuth.clientID,
      client_secret: config.OAuth.clientSecret,
      grant_type: 'refresh_token',
      redirect_uri: 'urn:ietf:wg:oauth:2.0:oob'
    }
  };

  request(options, function (error, response, body) {
    if (error) {
      console.log("Error getting access token.")
      console.log(error);
      throw new Error(error);
    }

    console.log(body);

    var tokenAuth = JSON.parse(body).access_token;
    var options = {
      method: 'PUT',
      url: 'https://www.googleapis.com/upload/chromewebstore/v1.1/items/' + config.appID,
      headers: {
        'cache-control': 'no-cache',
        'x-goog-api-version': '2',
        authorization: 'Bearer ' + tokenAuth
      },
      body: fs.createReadStream('release/niuslittehelper.zip')
    };
    request(options, function (error, response, body) {
      if (error) {
        throw new Error(error);
      }

      if (JSON.parse(body).uploadState === 'SUCCESS') {
        var options = {
          method: 'POST',
          url: 'https://www.googleapis.com/chromewebstore/v1.1/items/' + config.appID + '/publish',
          headers: {
            'cache-control': 'no-cache',
            'Content-Length': 0,
            'x-goog-api-version': '2',
            authorization: 'Bearer ' + tokenAuth,
          }
        };
        request(options, function (error, response, body) {
          if (error) {
            throw new Error(error);
          }

          console.log(body);
          cb(null);
        });
      }
    });

  });

});
