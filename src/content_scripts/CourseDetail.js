$(document).ready(function() {

    var input = $('#ctl00_main_m_NewAssignment_m_NewEmployee');
    var KEY_NAME_LETZTE_KOSTENSTELLE = 'letzte_kostenstelle';

    /**
    letzte Kostenstelle merken:
    */
    var selectKostenstelle = $('#ctl00_main_m_NewAssignment_m_CostCenter');

    //TODO: verwende chrome.sync.get set mit callback!! -> https://developer.chrome.com/extensions/storage#property-sync

    //chrome.sync.get("letzteKostenstelle");

    chrome.storage.sync.get(KEY_NAME_LETZTE_KOSTENSTELLE, function(item) {
      console.log('Lade letzte Kostenstelle:' + item[KEY_NAME_LETZTE_KOSTENSTELLE]);
      if (KEY_NAME_LETZTE_KOSTENSTELLE in item) {
        console.log('Letzte Kostenstelle ist ' + item[KEY_NAME_LETZTE_KOSTENSTELLE]);
        selectKostenstelle.val(item[KEY_NAME_LETZTE_KOSTENSTELLE]);
      }
    });

    selectKostenstelle.change(function() {
        var letzteKostenstelle = selectKostenstelle.val();
        var save = {};
        save[KEY_NAME_LETZTE_KOSTENSTELLE] = letzteKostenstelle;
        chrome.storage.sync.set(save, function () {
          console.log('saved: [' + save[KEY_NAME_LETZTE_KOSTENSTELLE] + ']');
        });

        //chrome.sync.set('kursdetails_letztekostenstelle', letzteKostenstelle);
      });

    //var letzteKostenstelle = ""; //chrome.sync.getItem('kursdetails_letztekostenstelle');
    //if (letzteKostenstelle) {
    //    selectKostenstelle.val(letzteKostenstelle);
    //}

    /**
    Kuerzel setzen:

    */
    var bemerkung = $('#ctl00_main_m_NewAssignment_m_Notice');

    //TODO: importiere tools.js
    //console.log("set bemerkung to " + getKuerzel());
    getKuerzel().then(function(kuerzel) {
      bemerkung.val(kuerzel);
    });

    makeEmployeeSearchField(input);

    var scrapeCourse = function() {
      var course = {
        Termine: [],
        Url: window.location.href,
        queryDate: new Date()
      };
      course.titel = $('h5').text();
      course.id = course.titel.split('-')[0].trim();
      $.each($($('table.MessageTable')[0]).find('tr').slice(2), function(key, tr) {
        var mh = $(tr).find('.MessageHeader').text().trim().slice(0, -1);
        var md = $(tr).find('.MessageBodyLeftBorder');
        switch (mh) {
          case '':
          case undefined:
          case null:
            break;

          case 'Kursbeginn':
          case 'Kursende':
          case 'Anmeldeschluss':
            if ($(md).text().trim() != '' && $(md).text().trim() != '-') {
              var datePattern = /(\d{2})\.(\d{2})\.(\d{4})\ (\d{2})\:(\d{2})/;
              course[mh] = new Date($(md).text().trim().split(',')[1].trim().replace(datePattern,'$3-$2-$1T$4:$5:00'));
            }
            break;

          case 'Kursstunden':
            course[mh] = parseInt($(md).text().trim().replace('Stunde(n)', '').trim());
            break;

          case 'Termine':
            var tcount = 0;
            $.each($(tr).find('table.MessageTable').find('tr').slice(1), function(key, t) {
              var termin = {
                id: course.id + '_' + tcount.toString(),
                titel: course.titel,
              };
              $(this).attr('id', 'termin_' + termin.id);
              tds = $(t).find('td');

              var rawDate = $($(t).find('td')[0]).text().trim();
              var datePattern = /(\d{2})\.(\d{2})\.(\d{4})/;
              if (rawDate.length == 9) {
                rawDate = '0' + rawDate;
              }
              console.log(rawDate);
              console.log(rawDate.length);
              termin.start = new Date(rawDate.replace(datePattern,'$3-$2-$1') + 'T' + $($(t).find('td')[1]).text().trim().split('-')[0].trim() + ':00');
              termin.ende = new Date(rawDate.replace(datePattern,'$3-$2-$1') + 'T' + $($(t).find('td')[1]).text().trim().split('-')[1].trim() + ':00');

              termin.ort = $($(t).find('td')[2]).text().trim();
              if ($($(t).find('td')[3]).text().trim() != '') {
                termin.ort += ', ' + $($(t).find('td')[3]).text().trim();
              }
              if ($($(t).find('td')[4]).text().trim() != '') {
                termin.ort += ', ' + $($(t).find('td')[4]).text().trim();
              }
              if ($($(t).find('td')[5]).text().trim() != '') {
                termin.ort += ' (' + $($(t).find('td')[5]).text().trim() + ')';
              }
              course['Termine'].push(termin);
              tcount++;
            });
            break;

          case 'Qualifikationen':
            break;

          default:
            if ($(md).text().trim() != '') {
              course[mh] = $(md).text().trim();
            }
        }
      });
      if (course.Termine.length == 0) {
        var termin = {
          id: course.id + '_' + tcount.toString(),
          titel: course.titel,
          start: course.Kursbeginn,
          ende: course.Kursende,
          ort: course.Kursort
        };
        if (course.Sonstiges) {
          termin.beschreibung = course.Sonstiges;
        }
        course.Termine.push(termin);
      }

      // Termin export unter der Überschrift für single event Termine
      if (course.Termine.length == 1) {
        var termin = $.extend({}, course.Termine[0]);
        termin.id = course.Termine[0].id + '_head';
        var cal = createCalElement(termin);
        $('h1').append('<div id="exportCal_' + termin.id + '"></div>');
        $('#exportCal_' + termin.id).append(cal);
      }

      $('td.MessageHeaderCenter:contains(\'Bezeichnung\')').after('<td class="MessageHeaderCenter" width="90">&nbsp;</td>')

      // Termin export in die Termintabelle
      for (termin of course.Termine) {
        if (course.Sonstiges) {
          termin.beschreibung = course.Sonstiges;
        }
        console.log(termin);
        var cal = createCalElement(termin);
        $('#termin_' + termin.id).append('<td id="ttt_' + termin.id + '" class="MessageBodyLeftBorder"></td>');
        $('#ttt_' + termin.id).append(cal);
      }

      return course;
    };

    function createCalElement(termin) {
      var calData = {
        title: termin.titel,
        start: termin.start,
        end: termin.ende,
        address: termin.ort,
      }
      if (termin.beschreibung) {
        calData.description = termin.beschreibung;
      }
      return createCalendar({
        options: {
          class: 'calExport',
          id: termin.id, // You can pass an ID. If you don't, one will be generated
          linkText: '<img src="' + chrome.extension.getURL('/img/addCal.png') + '" style="margin-right:0.2em;"><span style="display:table-cell;vertical-align:middle;">Export</span>',
        },
        data: calData
      });
      // $('#' + ambID).append('<td class="MessageBody" id="exportCal_' + ambID + '"></td>');
      // $('#exportCal_' + ambID).append(calDienst);
    }

    console.log(scrapeCourse());

  });
