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

    console.log(scrapeAmbulance());

  });
