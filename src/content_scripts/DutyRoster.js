$(document).ready(function() {

  // sucht eigene NIU IDs
  // returns array of IDs
  function getOwnIDs() {
    var ownIDs = [];
    $('select[name="ctl00$main$ddProposeEmployeeNumber"] option').each(function (key, val) {
      if ($(val).text() !== 'DEAKTIV.') {
        ownIDs.push($(val).text());
      }
    });
    return ownIDs;
  }

  function isSelf(str, ownIDs) {
    var r = false;
    $(ownIDs).each(function(key, id) {
      if (str.includes(id)) {
        r = true;
      }
    });
    return r;
  }

  // scrapes the table data
  // and enriches the rows with metadata
  // to enable filtering
  function prepareTable() {
    var ownIDs = getOwnIDs();
    var rtrn = {NKTW: false, Kurzdienst: false, Permanenz: false, myDienst: false};
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
      var permanenzBS = 'ha';
      var isMyDienst = false;
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

            var typeCode = $(this).parent().attr('class');
            if (typeCode.includes('West')) { permanenzBS = 'west'; }
            if (typeCode.includes('Nord')) { permanenzBS = 'nord'; }
            if (typeCode.includes('DDL')) { permanenzBS = 'ddl'; }
            if (typeCode.includes('VS')) { permanenzBS = 'vs'; }
            if (typeCode.includes('BVS')) { permanenzBS = 'bvs'; }
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

            if (isSelf(val, ownIDs)) {
              isMyDienst = true;
              rtrn.myDienst = true;
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
      $('tr#' + dienstID).attr('permanenzBS', permanenzBS);
      $('tr#' + dienstID).attr('dienstLaenge', dienstLaenge);
      $('tr#' + dienstID).attr('isMyDienst', isMyDienst);
    });

    return rtrn;
  }

  function filterTable() {

    if ($('select[name=permanenzBS] option:selected').val() === '-') { $('#DutyRosterTable > tbody > tr').show(); }

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

    if ($('select[name=permanenzBS] option:selected').val() !== '-') {
      $('#DutyRosterTable > tbody > tr[permanenzBS!=' + $('select[name=permanenzBS] option:selected').val() + ']').hide();
    }

    if ($('#DutyRosterFiltermyDienst').is(':checked')) {
      $('tr[isMyDienst=false]').hide();;
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

  $('.DutyRoster').css('max-width', '100%');

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
  if (tbl.myDienst) {
    $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFiltermyDienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">nur eigene Dienste</div>');
  }
  // Makes no sense to offer this
  // if (tbl.Permanenz) {
  //   $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterPermanenz" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">nur Permanenzen</div>');
  // }

  $('div.whitebox:not([id])').append('<div id="rdColumn" style="float:left;font-weight:bold;padding:5px;"></div>');  // div box for radio buttons
  $('#rdColumn').append(plcDiv + '<input type="radio" name="dienstTyp" value="isTagdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">Tagdienste</div>');
  $('#rdColumn').append(plcDiv + '<input type="radio" name="dienstTyp" value="isNachtdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">Nachtdienste</div>');
  $('#rdColumn').append(plcDiv + '<input type="radio" name="dienstTyp" value="alle" class="TableHack" style="margin-right:0.3em;vertical-align:middle;" checked>Alle Dienste</div>');

  $('#rdColumn').append(plcDiv + '<select id="permanenzBSsel" name="permanenzBS" class="TableHack" style="margin-right:0.3em;vertical-align:middle;"><option value="-">-</option><option value="ha">nur HA Permanenzen</option><option value="west">nur West Permanenzen</option><option value="ddl">nur DDL Permanenzen</option><option value="vs">nur VS Permanenzen</option><option value="nord">nur Nord Permanenzen</option><option value="bvs">nur BVS Permanenzen</option></div>');

  if ($('#ctl00_main_ddDutyType option:selected').text().indexOf('RK') === -1) { $('#permanenzBSsel').hide(); }

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
