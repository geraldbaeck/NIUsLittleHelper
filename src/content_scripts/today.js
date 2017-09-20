Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
}

var cal = ics();
var department = {
  LV: 'Wiener Rotes Kreuz Zentrale - Nottendorfergasse 21, 1030 Wien',
  DDL:'Wiener Rotes Kreuz Bezirksstelle DDL - Nottendorfergasse 21, 1030 Wien',
  West:'Wiener Rotes Kreuz Bezirksstelle West - Spallartgasse 10a, 1140 Wien',
  Nord:'Wiener Rotes Kreuz Bezirksstelle Nord - Karl-Schäfer-Straße 8, 1210 Wien',
  KSS:'Wiener Rotes Kreuz Bezirksstelle Nord - Karl-Schäfer-Straße 8, 1210 Wien',
  VS:'Wiener Rotes Kreuz Bezirksstelle Van Swieten - Landgutgasse 8, 1100 Wien',
  BVS:'Wiener Rotes Kreuz Bezirksstelle Bertha von Suttner - Negerlegasse 8, 1020 Wien',
  RD:'Wiener Rotes Kreuz Zentrale - Nottendorfergasse 21, 1030 Wien'
};
var dienststellenKuerzel = {
  LV: 'Nodo',
  DDL:'DDL',
  West:'West',
  Nord:'Nord',
  KSS:'KSS',
  VS:'Nodo',
  BVS:'BvS',
  RD:'Nodo'
};
var icsDLButton = '<a class="getCal">Meinen Dienstplan für die nächsten 14 Tage herunterladen</a>';

$('body').on('click', '.getCal', function() {
  cal.download('Dienstplan');
});

$(document).ready(function() {
  $('table.AmbulanceTable').find('a').attr('target', 'wrk_todayDetail');
  $('#ctl00_main_m_CourseList__CourseTable').find('a').attr('target', 'wrk_todayDetail');
  $.when(getDuty(), getAmbulanceDuty(), getCourses()).done(function() {
    $('.MultiDutyRoster').prepend(icsDLButton);
  });
});

function _cleanName(name) {
  if (name) {
    name = name.replace(/(\r\n|\n|\r)/gm, '').replace('\t', '');
    while (name.includes('  ')) {
      name = name.replace('  ', ' ').trim();
    }
  } else {
    name = '-';
  }
  return name;
}

function _queryEmployee(detailUri, employeeID) {
  $.ajax({
    url: detailUri,
    context: document.body
  }).done(function(rawHtml) {
    return scrapeEmployee($.parseHTML(rawHtml), detailUri);
  });
}

var getCourses = function() {
  var courses = $('#ctl00_main_m_CourseList__CourseTable').find('tr').slice(2)
  for (course of courses) {
    var cols = $(course).find('td');
    var datePattern = /(\d{2})\.(\d{2})\.(\d{4})\ (\d{2})\:(\d{2})/;

    var courseID = 'course_' + $(cols[0]).text();
    $(course).attr('id', courseID);

    var c = {};
    c.title = $(course).find('.CourseTitel').text();
    c.start = new Date($(cols[2]).text().split(',')[1].trim().replace(datePattern,'$3-$2-$1T$4:$5:00'));
    c.end = new Date($(cols[3]).text().split(',')[1].trim().replace(datePattern,'$3-$2-$1T$4:$5:00'));
    // c.duration = Math.floor((Math.abs(c.end - c.start) / 1000) / 60);
    c.address = $(cols[4]).text();
    if (c.address in department) {
      c.address = department[c.address];
    }
    c.description = (new URL($(course).find('a').attr('href'), window.location.href)).href;

    var calDienst = createCalendar({
      options: {
        class: 'calExport',
        id: courseID, // You can pass an ID. If you don't, one will be generated
        linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
      },
      data: c
    });
    $('#' + courseID).append('<td class="MessageBody" id="exportCal_' + courseID + '"></td>');
    $('#exportCal_' + courseID).append(calDienst);
  }
  return courses.length;
};

var getAmbulanceDuty = function() {
  var ambulance = $('.AmbulanceTable tbody').children();
  var ambcount = ambulance.length - 1;
  var parsedamb = 0;
  $('td.MessageBody, td.MessageBodyRightAlign').css('vertical-align', 'middle').css('display', 'table-cell').css('border', '1px').css('border-collapse', 'separate');
  $(ambulance).each(function(key, amb) {
      if (key === 0) {
        $(amb).append('<td class="MessageHeaderCenter" width="100px"></td>');
      } else {
        var parts   = $(amb).children();
        var ambUrl = 'https://niu.wrk.at/' + $(parts[10]).children().attr('href');
        var ambID = $(parts[0]).text().replace('/', '_').trim() + $(parts[1]).text().trim();
        $(amb).attr('id', ambID);

        //console.log('query ambulance ' + ambID + ' @ ' + ambUrl);
        $.ajax({
          url: ambUrl,
          context: document.body
        }).done(function(data) {
          //console.log('done ambulance ' + ambID + ' @ ' + ambUrl);
          var title       = $(data).find('#ctl00_main_m_AmbulanceDisplay_m_Webinfo').children().html();

          var desc        = (ambUrl + '\r\n\r\n\r\n' + $(data).find('#ctl00_main_m_AmbulanceDisplay_m_Webinfo').text()).substring(0,8000);
          var germanDate  = $(parts[5]).html();
          var timeVon     = $(parts[6]).html();
          var duration    = $(parts[9]).html().replace(',','.');
          var pattern     = new RegExp('(<b>Wo:<\/b>).*');
          var res         = pattern.exec(data);
          var location    = '';
          if (res) {
            var location    = res[0].substr(10).replace(/(<([^>]+)>)/ig,'').trim();
          }

          var tmpDate     = germanDate.split('.');
          var usDate      = tmpDate[1] + '/' + tmpDate[0] + '/' + tmpDate[2];

          var startDate   = new Date(usDate + ' ' + timeVon);
          var endDate     = new Date(usDate + ' ' + timeVon).addHours(duration);
          cal.addEvent('Ambulanz ' + title, desc, location, startDate.toISOString(), endDate.toISOString());
          // parsedamb++;
          // if (parsedamb == ambcount) {
          //   c
          // }

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
  return ambulance.length - 1;
}

// "normale Dienste"
var getDuty = function() {
  var dienste_count = 0;
  $('<td style="text-align:center;width:80px;"></td>').appendTo('.DutyRosterHeader');
  $('.MultiDutyRoster table').each(function(key, dutyTable) {
    var dutyType = $(dutyTable).find('.MessageHeader').html();
    var dienste = $(dutyTable).find('#DutyRosterTable tbody tr');
    dienste_count += dienste.length;
    $(dienste).each(function(key, duty) {
      var tmp = $(duty).find('td');
      var parts = $(tmp).siblings();

      var titel = dutyType.replace('fixiert', '').replace('geplant', '').trim();
      if (titel.includes('RTW') || titel.includes('KTW')) {
        if (dutyType.includes('fixiert')) {
          titel += ' &#x1f691; ' + $(parts[4]).text();
        }
        titel += ' (' + dienststellenKuerzel[$(parts[3]).text()] + ')';
      }

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

      var comment = '';
      $(dutyTable).find('.DutyRosterHeader').find('td').each(function(key, val) {
        if ($(val).hasClass('DRCComment')) {
          comment = '\r\n' + $(parts[key]).html();
        }
      });

      var description = '';
      var currentDutyFunctions = getDuties($(dutyTable).find('.DutyRosterHeader'));
      for (i in currentDutyFunctions) {
        description += currentDutyFunctions[i] + ': ';
        var displayName = _cleanName($(parts[i]).find('a').text());
        var rawID = $(parts[i]).find('a').attr('href');
        if (rawID != undefined) {
          var employeeID = rawID.substring(rawID.indexOf('\'') + 1,rawID.lastIndexOf('\''));
          var employeeLink = 'https://niu.wrk.at/Kripo/Employee/shortemployee.aspx?EmployeeNumberID=' + employeeID;
          description += '<a href="' + employeeLink + '">' + displayName + '</a>';
        } else {
          description += displayName;
        }
        description += '\r\n';
      }
      description += comment;

      cal.addEvent(titel, description, dienststelle, startDate.toISOString(), endDate.toISOString());
      var calDienst = createCalendar({
        options: {
          class: 'calExport',
          id: dutyID, // You can pass an ID. If you don't, one will be generated
          linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;margin-top:5px;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
        },
        data: {
          title: titel,
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
  return dienste_count;
};
