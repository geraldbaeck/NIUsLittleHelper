Date.prototype.addHours = function(h) {
  this.setTime(this.getTime() + (h * 60 * 60 * 1000));
  return this;
}

var cal = ics();
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
  if(courses) {
    // add blank header row for styling to courses table
    $('#ctl00_main_m_CourseList__CourseTable').find('tr').first()
      .append('<td class="MessageHeaderCenter">&nbsp;</td>');
  }
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
    $('#' + courseID).append('<td class="MessageBodyLeftBorder" style="border-right:1px solid gray;" width="63" id="exportCal_' + courseID + '"></td>');
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
  $("a.Wunschmeldung").css("color", "#86aed7");
  $("a.Wunschmeldung").css("font-style", "italic");
  $("td.Wunschmeldung").css("font-size", "9px");
  $("<style>td.Wunschmeldung:after {content: 'Wunschmeldung';}</style>" ).appendTo( "head" );

  var dienste_count = 0;
  var requests = Array();
  var employees = {};
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
        var employeeLink = $(parts[i]).find('a');
        var employeeData = getEmployeeDataFromLink(employeeLink);
        employeeLink.addClass(employeeData.id);
        employeeLink.closest("td").addClass("td_" + employeeData.id);  
        if(employeeLink.closest("td").text().includes("Wunschmeldung")) {
          employeeLink.closest("td").find('em').each(function() {
            $(this).html(employeeLink);
            employeeLink.addClass("Wunschmeldung");
            employeeLink.closest("td").addClass("Wunschmeldung");
          });
        }    
        if (employeeData.url != undefined) {
          description += '<a href="' + employeeData.url + '">' + employeeData.displayName + '</a>';
          employees[employeeData.id] = employeeData;
        } else {
          description += employeeData.displayName;
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

  employees = Object.keys(employees).map(function (key) { return employees[key]; });
  requests = employees.map(a => $.get(a.url));

  var defer = $.when.apply($, requests);
  defer.done(function(){
      // This is executed only after every ajax request has been completed

      $.each(arguments, function(index, responseData){
        // "responseData" will contain an array of response information for each specific request
        var employee = scrapeEmployee($.parseHTML(responseData[0]), employees[index].url);

        if(employee.nameFirst != undefined) {
          var img = $('<img>', { 
            src: employee.imageUrl,
            alt: employee.nameFull,
            height: "40px",
            style: "float:left;height:40px;margin-right:5px",
          });

          var name = employee.nameFull;
          if(name.length >= 20) {
            name = employee.nameFirst.charAt(0) + ". " + employee.nameLast;
          }
          if(name.length >= 20) {
            name = employee.nameLast;
          }

          $("." + employees[index].id).parent().append(img);
          $("." + employees[index].id).text(name);
          $("." + employees[index].id).append("<br /><span style='font-size:10px;'>" + "(" + employee.dienstnummer + ")</span>")
          $("." + employees[index].id).css("white-space", "pre-wrap");
          $("." + employees[index].id).css("display", "inline-block");
          $("." + employees[index].id).css("font-size", "11px");

          // currently too much icons => design overkill
          /* var div = $("<div>", {
            style: "display:block;"
          })
          var aMail = $("<a>", {
            href: "mailto:xxx",
          }).append(mailImage);
          var aWhatsApp = $("<a>", {
            href: "http://xxx",
          }).append(whatsappImage);
          div.append(aMail);
          div.append(aWhatsApp);
          $("." + employees[index].id).parent().append(div); */
        }
      });
  });

  return dienste_count;
};
