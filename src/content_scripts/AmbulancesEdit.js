$(document).ready(function() {

    var scrapeAmbulance = function() {
      var ambulance = {
        url: window.location.href,
        queryDate: new Date()
      };
      ambulance.title = $('h2:first').text().trim() || $('#ctl00_main_m_AmbulanceDisplay_m_Description').text().trim();
      ambulance.id = $('#ctl00_main_m_AmbulanceDisplay_m_Number').text().trim().replace('/', '_') + '_' + $('#ctl00_main_m_AmbulanceDayDisplay_m_SubNumber').text().trim();
      // TODO Einfügen der Url funktioniert nicht Google oder ouical trennen die url nach dem & ab
      // WORKAROUND shortener verwenden
      // ambulance.description = ambulance.url + '\r\n\r\n' + $('#ctl00_main_m_AmbulanceDisplay_m_Webinfo').text().trim();
      ambulance.description = $('#ctl00_main_m_AmbulanceDisplay_m_Webinfo').text().trim();
      ambulance.address = $('#ctl00_main_m_AmbulanceDisplay_m_Ort').text();
      ambulance.start = moment($('#ctl00_main_m_AmbulanceDayDisplay_m_StartWork', '').text().split(',')[1].trim(), 'D.M.YYYY H:mm').toDate();
      ambulance.end = moment($('#ctl00_main_m_AmbulanceDayDisplay_m_EndWork').text().split(',')[1].trim(), 'D.M.YYYY H:mm').toDate();

      // Termin export unter der Überschrift für single event Termine
      var cal = createCalElement(ambulance);
      $('h1:first').append('<div id="exportCal_' + ambulance.id + '"></div>');
      $('#exportCal_' + ambulance.id).append(cal);

      return ambulance;
    };

    var spamEveryone = function(ambulance) {
      var spinner = new Spinner().spin()
      $('body').after(spinner.el);

      var requests = Array();
      var members = Array();
      $('a[href^="Javascript:SEmpFID"]').each(function() {
        var member = getEmployeeDataFromLink(this, 'EmployeeID');
        members.push(member);
        requests.push($.get(member.url));
      });

      var defer = $.when.apply($, requests);
      defer.done(function(){
          // This is executed only after every ajax request has been completed
          var emails = Array();
          $.each(arguments, function(index, responseData){
              // "responseData" will contain an array of response information for each specific request
              var employee = scrapeEmployee($.parseHTML(responseData[0]), members[index].url);
              console.log(employee)
              //"Fred Foo"<foo@example.com>
              var propertyNames = Object.keys(employee).filter(function (propertyName) {
                  if(propertyName.indexOf("EMAIL") === 0) {
                    emails.push('"' + members[index]['displayName'] + '"<' + employee[propertyName] + '>');
                  }
              });
          });
          var bcc = emails.join(',');
          var subject = ambulance.title + " am " + moment(ambulance.start).format('dd, D.M.YY');
          var body = 'Liebe KollegInnen,\n\n'
          var link = 'mailto:?bcc=' + encodeURIComponent(bcc) + '&subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
          window.open(link, target='_blank');
          
          spinner.stop();
      });
    }

    var ambulance = scrapeAmbulance();

    $('h1').append('<a id="spamspamspam"><img style="vertical-align:middle;opacity:.65;" height="19" src="' + chrome.extension.getURL("/img/ic_mail_outline_black_24dp_2x.png") + '" /><span style="position:relative;top:1px;left:1px;">Mail an Alle</span></a>')

    $("#spamspamspam").click(function() {
      spamEveryone(ambulance);
    });



  });
