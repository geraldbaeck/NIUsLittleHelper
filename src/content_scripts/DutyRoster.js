$(document).ready(function() {

  // scrapes the table data
  // and enriches the rows with metadata
  // to enable filtering
  function prepareTable() {
    var rtrn = {NKTW: false, Kurzdienst: false, Permanenz: false};
    var $table = $('table#DutyRosterTable tbody');

    $table.find('tr').each(function(key, val) {

      // create placholder vars
      var dienstID = $(this).attr('id');
      var isEmpty = true;
      var isNotMeldable = true;
      var isNKTW = false;
      var currentDateString;
      var isKurzdienst = false;
      var isTagdienst = false;
      var isNachtdienst = false;
      var isPermanenz = false;
      var dienstLaenge;

      $(this).find('td').each(function(key, val) {
        val = val.innerHTML.replace('&nbsp;', '').replace('<em>', '').replace('</em>', '').trim();
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
            var typeCode = $(this).attr('class');
            if (typeCode.includes('Short')) {
              isKurzdienst = true;
              rtrn.Kurzdienst = true;
            }
            if (typeCode.includes('Day')) {
              isTagdienst = true;
            } else if (typeCode.includes('Night')) {
              isNachtdienst = true;
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
          case 9: // P = Permanenz
            if (val === 'P') {
              isPermanenz = true;
              rtrn.Permanenz = true;
            }
            break;
          case 8: // PAL
          case 10: // Dienstführung Funktionen
          default:
            break;
        }
      });

      $('tr#' + dienstID).attr('isEmpty', isEmpty);
      $('tr#' + dienstID).attr('isMeldable', !isNotMeldable);
      $('tr#' + dienstID).attr('isNKTW', isNKTW);
      $('tr#' + dienstID).attr('isKurzdienst', isKurzdienst);
      $('tr#' + dienstID).attr('isTagdienst', isTagdienst);
      $('tr#' + dienstID).attr('isNachtdienst', isNachtdienst);
      $('tr#' + dienstID).attr('isPermanenz', isPermanenz);
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

    if ($('#DutyRosterFilterKurzdienst').is(':checked')) {
      $('tr[isKurzdienst=false]').hide();
    }

    if ($('#DutyRosterFilterPermanenz').is(':checked')) {
      $('tr[isPermanenz=false]').hide();
    }

    $('tr[' + $('input[name=dienstTyp]:checked').val() + '=false]').hide();
  }

  function dfToggle() {
    $('.DFTable').parent().parent().toggle();
    if ($('.DFTable').parent().parent().is(':visible')) {
      $('#DFToggle').text('DF ausblenden');
    } else {
      $('#DFToggle').text('DF einblenden');
    }
  }

  function selectorToggle() {
    $('div.whitebox:not([id])').toggle();
    if ($('div.whitebox:not([id])').is(':visible')) {
      $('#SelToggle').hide();
    } else {
      $('#SelToggle').show();
    }
  }

  function readValuefromStorage(val) {
    chrome.storage.sync.get(val, function(x) {
      console.log('Storage Read: ' + x[val]);
      return x[val];
    });
  }

  function saveValueToStorage(val) {
    console.log('Storage Write: ' + JSON.stringify(val));
    chrome.storage.sync.set(val)
  }

  // hide dienstführungstabelle
  $('.DFTable').parent().parent().hide();

  // hide show top menu
  $('h1').before('<a href="#" style="font-size:8px;margin-left:2em;float:right;" id="DFToggle">DF einblenden</a>');
  $('h1').before('<a href="#" style="font-size:8px;margin-left:2em;float:right;" id="SelToggle" class="hideSelectors">Suchoptionen einblenden</a>');
  $('#SelToggle').hide();

  $('.DutyRoster').css('max-width', '900px');

  tbl = prepareTable();

  // add selectors
  $('div.whitebox:not([id])').append('<div id="chkColumn" style="float:left;font-weight:bold;padding:5px;"></div>');  // div box for checkboxes
  var plcDiv = '<div style="vert-align:middle;">';
  $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterEmpty" class="TableHack" style="margin-right:0.3em;vertical-align:middle;top:0.005em;">Leerzeilen filtern</div>');
  $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterMeldable" class="TableHack" style="margin-right:0.3em;vertical-align:middle;top:0.005em;">nur meldbare Dienste</div>');
  if (tbl.NKTW) {
    $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterNKTW" class="TableHack" style="margin-right:0.3em;vertical-align:middle;top:0.005em;">nur NKTW</div>');
  }
  if (tbl.Kurzdienst) {
    $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterKurzdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">nur Kurzdienste</div>');
  }
  // Makes no sense to offer this
  // if (tbl.Permanenz) {
  //   $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterPermanenz" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">nur Permanenzen</div>');
  // }

  $('div.whitebox:not([id])').append('<div id="rdColumn" style="float:left;font-weight:bold;padding:5px;"></div>');  // div box for radio buttons
  $('#rdColumn').append(plcDiv + '<input type="radio" name="dienstTyp" value="isTagdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">Tagdienste</div>');
  $('#rdColumn').append(plcDiv + '<input type="radio" name="dienstTyp" value="isNachtdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">Nachtdienste</div>');
  $('#rdColumn').append(plcDiv + '<input type="radio" name="dienstTyp" value="alle" class="TableHack" style="margin-right:0.3em;vertical-align:middle;" checked>Alle Dienste</div>');

  // add hide selector
  $('div.whitebox:not([id])').append('<div style="float:right;padding-right:3px;"><a class="hideSelectors">&#10006;</a></div>');  // div box for checkboxes

  $('.TableHack').change(function() {
    filterTable();
  });

  $('#DFToggle').click(function() {
    dfToggle();
  });

  $('.hideSelectors').click(function() {
    selectorToggle();
  });

});
