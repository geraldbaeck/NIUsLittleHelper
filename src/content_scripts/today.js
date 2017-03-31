Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
}

var cal = ics();
var department = {
  LV: 'Wiener Rotes Kreuz Zentrale - Nottendorfergasse 21, 1030 Wien',
  DDL:'Wiener Rotes Kreuz Zentrale - Nottendorfergasse 21, 1030 Wien',
  West:'Wiener Rotes Kreuz Bezirksstelle West - Spallartgasse 10a, 1140 Wien',
  Nord:'Wiener Rotes Kreuz Bezirksstelle Nord - Karl-Schäfer-Straße 8, 1210 Wien',
  VS:'Wiener Rotes Kreuz Bezirksstelle Van Swieten - Landgutgasse 8, 1100 Wien',
  BVS:'Wiener Rotes Kreuz Bezirksstelle Bertha von Suttner - Negerlegasse 8, 1020 Wien',
  RD:'Wiener Rotes Kreuz Zentrale - Nottendorfergasse 21, 1030 Wien'
}
var icsDLButton = '<a class="getCal">Meinen Dienstplan für die nächsten 14 Tage herunterladen</a>';

$('body').on('click', '.getCal', function() {
  cal.download('Dienstplan');
});
$(document).ready(function() {
  getRDDuty();
  getAmbulanceDuty();
});

function cleanName(name) {
  if (name) {
    name = name.replace('\n', '').replace('\r', '').replace('\t', '');
    while (name.includes('  ')) {
      name = name.replace('  ', ' ');
    }
  } else {
    name = 'unbekannt';
  }
  return name;
}

var getAmbulanceDuty = function() {
    //TODO: Derzeit passiert das ganze async, wenn also noch nicht alle ambulanzen geladen sind, sind nicht alle in der ICS datei drinnen.
    //Der Call sollte daher geändert werden.
    var ambulance = $('.AmbulanceTable tbody').children();
    var ambcount = ambulance.length - 1;
    var parsedamb = 0;
    $('td.MessageBody, td.MessageBodyRightAlign').css('vertical-align', 'middle').css('display', 'table-cell').css('border', '1px').css('border-collapse', 'separate');
    $(ambulance).each(function(key, amb) {
        if (key === 0) {
          $(amb).append('<td class="MessageHeaderCenter" width="100px"></td>');
        } else {
          var parts   = $(amb).children();
          var detailUri = 'https://niu.wrk.at/' + $(parts[10]).children().attr('href');
          var ambID = $(parts[0]).text().replace('/', '_').trim();
          $(amb).attr('id', ambID);

          $.ajax({
            url: detailUri,
            context: document.body
          }).done(function(data) {
              var title       = $(data).find('#ctl00_main_m_AmbulanceDisplay_m_Webinfo').children().html();
              var desc        = 'Sub ' + $(parts[1]).html();
              var germanDate  = $(parts[5]).html();
              var timeVon     = $(parts[6]).html();
              var duration    = $(parts[9]).html().replace(',','.');
              var pattern     = new RegExp('(<b>Wo:<\/b>).*');
              var res         = pattern.exec(data);
              var location    = res[0].substr(10).replace(/(<([^>]+)>)/ig,'');;

              var tmpDate     = germanDate.split('.');
              var usDate      = tmpDate[1] + '/' + tmpDate[0] + '/' + tmpDate[2];

              var startDate   = new Date(usDate + ' ' + timeVon);
              var endDate     = new Date(usDate + ' ' + timeVon).addHours(duration);
              cal.addEvent('Ambulanz ' + title, desc, location, startDate.toISOString(), endDate.toISOString());
              parsedamb++;
              if (parsedamb == ambcount) {
                $('.MultiDutyRoster').prepend(icsDLButton);
              }

              var calDienst = createCalendar({
                options: {
                  class: 'calExport',
                  id: ambID, // You can pass an ID. If you don't, one will be generated
                  linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
                },
                data: {
                  title: title,
                  start: startDate,
                  duration: duration * 60,
                  // end: new Date('June 15, 2013 23:00'), // If an end time is set, this will take precedence over duration
                  address: location,
                  description: desc
                }
              });
              $('#' + ambID).append('<td class="MessageBody" id="exportCal_' + ambID + '"></td>');
              $('#exportCal_' + ambID).append(calDienst);
            });
        }
      });
  }

var getRDDuty = function() {
  $('#DutyRosterTable thead tr.DutyRosterHeader').append('<td></td>');
  $('.MultiDutyRoster table').each(function(key, dutyTable) {
    dutyType = $(dutyTable).find('.MessageHeader').html();
    var duties = $(dutyTable).find('#DutyRosterTable tbody tr');
    $(duties).each(function(key, duty) {
      var tmp = $(duty).find('td');
      var parts = $(tmp).siblings();
      var timeVon = $(parts[2]).html().substr(0, $(parts[2]).html().indexOf(' - '));
      var timeBis = $(parts[2]).html().substr($(parts[2]).html().indexOf(' - ') + 3);
      timeVon = timeVon.trim() + ':00';
      timeBis = timeBis.trim() + ':00';
      var germanDate = $(parts[1]).html();
      var tmpDate = germanDate.split('.');
      var usDate = tmpDate[1] + '/' + tmpDate[0] + '/' + tmpDate[2];

      var duration = getDurationFromTimeString($(parts[1]).html(), $(parts[2]).html().trim());
      var startDate = new Date(usDate + ' ' + timeVon);
      var endDate = new Date(usDate + ' ' + timeVon).addHours(duration);

      var dienststelle = department[$(parts[3]).html()];
      var dutyID = $(duty).attr('id');

      var dutyClass = $(parts[2]).attr('class');
      var type = '';
      switch (dutyClass) {
        case 'DutyRosterTimeCodeDay':
          if (duration == 2) {
            type = 'Bezirkstellentätigkeit';
          } else if (duration == '8.5') {
            type = 'VM / NM Dienst';
          } else if (duration == '7.5') {
            type = 'Kurz';
          } else if (duration == '12') {
            type = 'Tag';
          }
          break;
        case 'DutyRosterTimeCodeLongNight':
          type = 'Nacht';
          break;
        case 'DutyRosterTimeCodeShortNight':
          type = 'KurzNacht';
          break;
      }
      if (typeof $(parts[4]).find('a').html() !== 'undefined') {
        var lenker = $(parts[4]).find('a').html().trim();
      } else {
        var san2 = $(parts[4]).find('a').html();
      }
      if (typeof $(parts[5]).find('a').html() !== 'undefined') {
        var san1 = $(parts[5]).find('a').html().trim();
      } else {
        var san2 = $(parts[5]).find('a').html();
      }
      if (typeof $(parts[6]).find('a').html() !== 'undefined') {
        var san2 = $(parts[6]).find('a').html().trim();
      } else {
        var san2 = $(parts[6]).find('a').html();
      }

      lenker = cleanName(lenker);
      san1 = cleanName(san1);
      san2 = cleanName(san2);

      var title = '';
      var description = $(parts[7]).html() + '\r\n';
      if (type != 'Bezirkstellentätigkeit') {
        title = 'KTW ' + $(parts[3]).html();
        description = 'Lenker: ' + lenker + '\r\nSAN1: ' + san1 + '\r\nSAN2:' + san2;
      } else {
        title = 'Referate ' + $(parts[3]).html();
        description = 'Referent 1: ' + lenker + '\r\nReferent 2: ' + san1 + '\r\nReferent 3:' + san2;
      }
      cal.addEvent(title, description, dienststelle, startDate.toISOString(), endDate.toISOString());

      var calDienst = createCalendar({
        options: {
          class: 'calExport',
          id: dutyID, // You can pass an ID. If you don't, one will be generated
          linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;margin-top:5px;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
        },
        data: {
          title: title,
          start: startDate,
          duration: duration * 60,
          // end: new Date('June 15, 2013 23:00'), // If an end time is set, this will take precedence over duration
          address: dienststelle,
          description: description
        }
      });
      $('#' + dutyID).append('<td id="exportCal_' + dutyID + '"></td>');
      $('#exportCal_' + dutyID).append(calDienst);

    });
  });
};
