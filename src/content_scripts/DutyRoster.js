$(document).ready(function() {

  // scrapes the table data
  // and enriches the rows with metadata
  // to enable filtering
  function prepareTable() {
    var rtrn = {NKTW: false, Kurzdienst: false};
    var $table = $('table#DutyRosterTable tbody');
    $table.find('tr').each(function(key, val) {

      // create placholder vars
      var dienstID = $(this).attr('id');
      var isEmpty = true;
      var isNotMeldable = true;
      var isNKTW = false;
      var currentDateString;
      var isKurzdienst = false;
      var dienstLaenge;

      $(this).find('td').each(function(key, val) {
        val = val.innerHTML.replace('&nbsp;', '').replace('<em>', '').replace('</em>', '').trim();
        console.log(key + ': ' + val);
        var openIndikator = 'title="Melden"';
        switch (key) {
          case 0: // Wochentag
            break;
          case 1: // Datum
            currentDateString = val;
            break;
          case 2: // Uhrzeit
            dienstLaenge = getDurationFromTimeString(currentDateString, val);
            // $(this).after('<td>' + dienstLaenge + '</td>');  // Stunden einblenden nicht nötig
            if (dienstLaenge < 8) {
              isKurzdienst = true;
              rtrn.Kurzdienst = true;
            }
            break;
          case 3: // Ort
            break;
          case 4: // SEW
          case 5: // SAN1
          case 6: // SAN2
            if (val && !val.includes(openIndikator)) {
              isEmpty = false;
            }

            if (val.includes(openIndikator)) {
              isNotMeldable = false;
            }

            break;
          case 7: // Bemerkung
            if (val.includes('NKTW') || val.includes('N-KTW') || val.includes('Notfall-KTW')) {
              isNKTW = true;
              rtrn.NKTW = true;
            }

            break;
          case 8: // PAL
          case 9: // P = Permanenz
          case 10: // no idea
          default:
            break;
        }
      });

      $('tr#' + dienstID).attr('isEmpty', isEmpty);
      $('tr#' + dienstID).attr('isMeldable', !isNotMeldable);
      $('tr#' + dienstID).attr('isNKTW', isNKTW);
      $('tr#' + dienstID).attr('isKurzdienst', isKurzdienst);
      $('tr#' + dienstID).attr('dienstLaenge', dienstLaenge);
    });

    return rtrn;
  }

  function filterTable() {
    $('tr[isEmpty]').show();
    if ($('#DutyRosterFilterEmpty').is(':checked')) {
      $('tr[isEmpty=true]').hide();
    }

    if ($('#DutyRosterFilterMeldable').is(':checked')) {
      $('tr[isMeldable=false]').hide();
    }

    if ($('#DutyRosterFilterNKTW').is(':checked')) {
      $('tr[isNKTW=false]').hide();
    }

    if ($('#DutyRosterFilterKurzDienst').is(':checked')) {
      $('tr[isKurzdienst=false]').hide();
    }
  }

  tbl = prepareTable();

  // add selectors
  var plcDiv = '<div style="float:left; vert-align:middle; font-weight:bold; padding:5px;">';
  $('div.whitebox:not([id])').append(plcDiv + 'Leerzeilen filtern: <input type="checkbox" id="DutyRosterFilterEmpty" class="TableHack" style="padding:0;"></div>');
  $('div.whitebox:not([id])').append(plcDiv + 'Nur meldbare Dienste: <input type="checkbox" id="DutyRosterFilterMeldable" class="TableHack"></div>');
  if (tbl.NKTW) {
    $('div.whitebox:not([id])').append(plcDiv + 'Nur NKTW: <input type="checkbox" id="DutyRosterFilterNKTW" class="TableHack"></div>');
  }
  if (tbl.Kurzdienst) {
    $('div.whitebox:not([id])').append(plcDiv + 'Nur Kurzdienste: <input type="checkbox" id="DutyRosterFilterKurzDienst" class="TableHack"></div>');
  }

  $('.TableHack').change(function() {
    filterTable();
  });

});
