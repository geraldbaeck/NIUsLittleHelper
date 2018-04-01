var exportDict = {};

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
      if ($(str).text().includes(id)) {
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
    var rtrn = {NKTW: false, Kurzdienst: false, Permanenz: false, myDienst: false, isMeldableAs: {}};
    var $header = $('.DutyRosterHeader');
    var $table = $('table#DutyRosterTable tbody');
    var duties = getDuties($header);
    var headerNr = {
      DRCDay: getHeaderNumber($header, 'DRCDay'),
      DRCDate: getHeaderNumber($header, 'DRCDate'),
      DRCTime: getHeaderNumber($header, 'DRCTime'),
      DRCDivision: getHeaderNumber($header, 'DRCDivision'),
      DRCComment: getHeaderNumber($header, 'DRCComment')
    };

    $table.find('tr').each(function() {

      // create placeholder vars
      var dienstID = $(this).attr('id');
	  var $DienstRow = $('tr#' + dienstID);
      var dienstOrt = 'DDL';
      var isEmpty = true;
      var isNotMeldable = true;
      var isMeldableAs = [];
      var isNKTW = false;
      var currentDateString;
      var currentDurationString;
      var isKurzdienst = false;
      var isTagdienst = false;
      var isNachtdienst = false;
      var isPermanenz = false;
      var permanenzBS = 'ha';
      var isMyDienst = false;
      var dienstLaenge;
      var employees = [];

      $(this).find('td').each(function(rowNr, rawTdContent) {
        var tdContent = rawTdContent.innerHTML.replace('&nbsp;', '').replace('<em>', '').replace('</em>', '').trim();
        var openIndikator = 'title="Melden"';
        switch (rowNr) {
          case headerNr['DRCDay']:
            var day = tdContent.toLowerCase();
            $DienstRow.attr("data-day", day);
            break;
          case headerNr['DRCDate']: // Datum
            currentDateString = tdContent;
            break;

          case headerNr['DRCTime']: // Uhrzeit
            currentDurationString = tdContent;
            dienstLaenge = getDurationFromTimeString(currentDateString, tdContent);
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

          case headerNr['DRCDivision']: // Ort
            var typeCode = $(this).parent().attr('class');
            if (typeCode.includes('West')) { permanenzBS = 'west'; }
            if (typeCode.includes('Nord')) { permanenzBS = 'nord'; }
            if (typeCode.includes('DDL')) { permanenzBS = 'ddl'; }
            if (typeCode.includes('VS')) { permanenzBS = 'vs'; }
            if (typeCode.includes('BVS')) { permanenzBS = 'bvs'; }

            dienstOrt = department[$(this).text().trim()];
            break;

          case headerNr['DRCComment']: // Bemerkung
            if (tdContent.includes('NKTW') || tdContent.includes('N-KTW') || tdContent.includes('Notfall-KTW') || tdContent.includes('RKK') || tdContent.includes('rkk')) {
              isNKTW = true;
              rtrn.NKTW = true;
            }
            break;

          default:
            break;
        }

        // muss außerhalb des switch statements erledigt werden, weil es auch
        // dienste mit nur 2 Funktionen gibt
        if (rowNr.toString() in duties) {
          if (tdContent && (!tdContent.includes(openIndikator) || tdContent.includes("Wunschmeldung"))) {
            isEmpty = false;
          }

          if (tdContent.includes(openIndikator)) {
            isNotMeldable = false;
            isMeldableAs.push(rowNr);
            rtrn.isMeldableAs[rowNr.toString()] = duties[rowNr];
          }

          if (isSelf(tdContent, ownIDs)) {
            isMyDienst = true;
            rtrn.myDienst = true;
          }

          var employee = getEmployeeDataFromLink(tdContent);
          employee['dienstFunktion'] = duties[rowNr];
          employees.push(employee);
        }
      });

      $DienstRow.attr('isEmpty', isEmpty);
      $DienstRow.attr('isMeldable', !isNotMeldable);
      $DienstRow.attr('isNKTW', isNKTW);
      $DienstRow.attr('isKurzdienst', isKurzdienst);
      $DienstRow.attr('isTagdienst', isTagdienst);
      $DienstRow.attr('isNachtdienst', isNachtdienst);
      $DienstRow.attr('isPermanenz', isPermanenz);
      $DienstRow.attr('permanenzBS', permanenzBS);
      $DienstRow.attr('dienstLaenge', dienstLaenge);
      $DienstRow.attr('isMyDienst', isMyDienst);

      for (k in isMeldableAs) {
        $DienstRow.attr('isMeldableAs_' + isMeldableAs[k].toString(), true);
      }

      // dienst object zum späteren Cal export
      var dienst = {
        id: dienstID,
        title: $('#ctl00_main_ddDutyType option:selected').text().trim(),
        start: moment(currentDateString + ' ' + currentDurationString.split('-')[0].trim(), 'D.M.YYYY H:mm').toDate(),
        duration: dienstLaenge * 60,
        address: dienstOrt,
        description: ''
      };
      for (employee of employees) {
        var descLine = employee.dienstFunktion + ': ';
        if (employee.url != undefined) {
          descLine += '<a href="' + employee.url + '">' + employee.displayName + '</a>';
        } else {
          descLine += employee.displayName;
        }
        descLine += '\r\n';
        dienst.description += descLine;
      }

      // Termin export in die letzte Spalte
      var cal = createCalElement(dienst);
      $DienstRow.find('td:last').append('<div id="exportCal_' + dienst.id + '" hidden></div>');
      $('#exportCal_' + dienst.id).append(cal);
      exportDict[dienst.id] = $('#exportCal_' + dienst.id)[0].outerHTML;

      if (isMyDienst) {
        //$DienstRow.css('background-color', '#a5c7ea');
        $('#exportCal_' + dienst.id).show();
      }
    });

    return rtrn;
  }

  function filterTable() {

    if ($('select[name=permanenzBS] option:selected').val() === '-') { $('#DutyRosterTable > tbody > tr').show(); }

    $('tr[isEmpty]').show();
    if ($('#DutyRosterFilterEmpty').is(':checked')) {
      $('tr[isEmpty=true]').hide();
    }

    if ($('#chkColumnMeldbar input[type=checkbox]:checked').length > 0) {
      $('tr[isMeldable=false]').hide();   // hide all non meldable stuff
      // hide all non checked columns
      $('#chkColumnMeldbar input[type=checkbox]').not(':checked').each(function () {
        $('tr[isMeldableAs_' + $(this).val() + '=true]').hide();
      });
      // show all checked columns
      $('#chkColumnMeldbar input[type=checkbox]:checked').each(function () {
        if ($('#DutyRosterFilterEmpty').is(':checked')) {
          $('tr[isMeldableAs_' + $(this).val() + '=true][isEmpty=false]').show();
        } else {
          $('tr[isMeldableAs_' + $(this).val() + '=true]').show();
        }
      });
    }

    var hideDays = [];

    $("[name='nlh_day_filter[]']").each(function(){
      var $this = $(this);
      var val = $this.val();
      var $label = $("#label_nlh_day_filter_" + val);

      if (!$this.prop("checked"))
      {
          hideDays.push(val);
          $label.css("font-weight", "normal");
      }
      else
      {
        $label.css("font-weight", "bold");
      }
    });

    if (hideDays && hideDays.length) {
	  for (var i = 0; i < hideDays.length;i++)
      {
        var hideDayShort = hideDays[i];
        $("[data-day='"+hideDayShort+"']").hide();
      }
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

  doMagic();

  function doMagic(){
    // hide dienstführungstabelle
    $('.DFTable').parent().parent().hide();

    // hide show top menu
    $('h1').before('<a href="#" style="font-size:8px;margin-left:2em;float:right;" id="DFToggle">DF einblenden</a>');
    $('h1').before('<a href="#" style="font-size:8px;margin-left:2em;float:right;" id="SelToggle" class="hideSelectors">Suchoptionen einblenden</a>');
    $('#SelToggle').hide();

    $('.DutyRoster').css('max-width', '100%');

    tbl = prepareTable();

    // add selectors
    var $Whitebox = $('div.whitebox:not([id])');
    var $NLHContainer = $("<div>").attr("id", "NiusLittleHelperFilters").css("float", "left").appendTo($Whitebox);

    $NLHContainer.append('<div id="chkColumn"' +
        ' style="float:left;font-weight:bold;padding:5px;"></div>');  // div box for checkboxes
    var plcDiv = '<div style="vert-align:middle;">';
    var $ChkColumn = $('#chkColumn');
    $ChkColumn.append(plcDiv + '<input type="checkbox" id="DutyRosterFilterEmpty" class="TableHack" style="margin-right:0.3em;vertical-align:middle;top:0.005em;">Leerzeilen filtern</div>');
    //$('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterMeldable" class="TableHack" style="margin-right:0.3em;vertical-align:middle;top:0.005em;">nur meldbare Dienste</div>');
    if (tbl.NKTW) {
        $ChkColumn.append(plcDiv + '<input type="checkbox" id="DutyRosterFilterNKTW" class="TableHack" style="margin-right:0.3em;vertical-align:middle;top:0.005em;">nur NKTW</div>');
    }
    if (tbl.Kurzdienst) {
        $ChkColumn.append(plcDiv + '<input type="checkbox" id="DutyRosterFilterKurzdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">nur Kurzdienste</div>');
    }
    if (tbl.myDienst) {
        $ChkColumn.append(plcDiv + '<input type="checkbox" id="DutyRosterFiltermyDienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">nur eigene Dienste</div>');
        $('td.DRCCommands').css('width', '90px');
    }

    // Makes no sense to offer this
    // if (tbl.Permanenz) {
    //   $('#chkColumn').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterPermanenz" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">nur Permanenzen</div>');
    // }

    // Dienstselektion (Tagdienst, Nachtdienst, egal)
    $NLHContainer.append('<div id="rdColumnDienste" style="float:left;font-weight:bold;padding:5px;"></div>');  // div box for radio buttons
    $('#rdColumnDienste').append(plcDiv + '<input type="radio" name="dienstTyp" value="isTagdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">Tagdienste</div>');
    $('#rdColumnDienste').append(plcDiv + '<input type="radio" name="dienstTyp" value="isNachtdienst" class="TableHack" style="margin-right:0.3em;vertical-align:middle;">Nachtdienste</div>');
    $('#rdColumnDienste').append(plcDiv + '<input type="radio" name="dienstTyp" value="alle" class="TableHack" style="margin-right:0.3em;vertical-align:middle;" checked>Alle Dienste</div>');
    $('#rdColumnDienste').append(plcDiv + '<select id="permanenzBSsel" name="permanenzBS" class="TableHack" style="margin-right:0.3em;vertical-align:middle;"><option value="-">-</option><option value="ha">nur HA Permanenzen</option><option value="west">nur West Permanenzen</option><option value="ddl">nur DDL Permanenzen</option><option value="vs">nur VS Permanenzen</option><option value="nord">nur Nord Permanenzen</option><option value="bvs">nur BVS Permanenzen</option></div>');

    // Nur meldbare Dienste als
    if (!$.isEmptyObject(tbl.isMeldableAs)) {
        $NLHContainer.append('<div id="chkColumnMeldbar" style="float:left;font-weight:bold;padding:5px;">Nur meldbare Dienste' +
            ' als:</div>');  // div box for radio buttons
        for (var f in tbl.isMeldableAs) {
            $('#chkColumnMeldbar').append(plcDiv + '<input type="checkbox" id="DutyRosterFilterMeldable_' + f + '" value="' + f + '" class="TableHack" style="margin-left:1.5em;margin-right:0.2em;vertical-align:middle;">' + duties[f] + '</div>');
        }
    }

    if ($('#ctl00_main_ddDutyType option:selected').text().indexOf('RK') === -1) { $('#permanenzBSsel').hide(); }

    // add hide selector
    $NLHContainer.append('<div style="float:right;padding-right:3px;"><a class="hideSelectors">&#10006;</a></div>');  // div box

    var days = [
      {
          short: 'mo',
          name: 'Montag',
      },
      {
          short: 'di',
          name: 'Dienstag',
      },
      {
          short: 'mi',
          name: 'Mittwoch',
      },
      {
          short: 'do',
          name: 'Donnerstag',
      },
      {
          short: 'fr',
          name: 'Freitag',
      },
      {
          short: 'sa',
          name: 'Samstag',
      },
      {
          short: 'so',
          name: 'Sonntag',
      }
    ];

    var $FilterDay = $("<div/>")
	    .append("<hr/>")
	    .append("<div style='font-weight:bold;'>Nur Dienste an folgenden Tagen:</div>")
	    .css({float: "none", clear: "both"});

    for (var dayIndex in days)
    {
        var day = days[dayIndex];
        var id = "nlh_day_filter_" + day.short;

        var $FilterItem = $("<div/>")
	        .css('float','left')
	        .css('padding-right', "7px");

	    $("<input/>")
		    .attr("type", "checkbox")
		    .attr("name", "nlh_day_filter[]")
        .attr("id", id)
        .attr("checked", true)
		    .addClass('TableHack')
		    .val(day.short)
		    .appendTo($FilterItem);

	    $("<label/>")
		    .attr("for", id)
		    .attr("id", "label_" + id)
		    .html(day.name)
		    .css("vertical-align", "top")
		    .css("font-weight", "bold")
		    .appendTo($FilterItem);

	    $FilterDay.append($FilterItem);
    }

    $NLHContainer.append($FilterDay);

    $('.TableHack').change(function() {
        filterTable();
    });

    $('#DFToggle').click(function() {
        dfToggle();
    });

    $('.hideSelectors').click(function() {
        selectorToggle();
    });

    var targetNodes         = $('.DutyRosterItem td:first-child');
    var MutationObserver    = window.MutationObserver || window.WebKitMutationObserver;
    var myObserver          = new MutationObserver (mutationHandler);
    var obsConfig           = {childList: true, characterData: false, attributes: false, subtree: false};

    targetNodes.each (function () {
        myObserver.observe (this, obsConfig);
    });
  }

  function mutationHandler (mutationRecords) {
    try {
      mutationRecords.forEach (function (mutation) {
        var mutationDienstID = $(mutation.target).closest('tr').attr('id');
        setTimeout(function() {
          if (!$('tr#' + mutationDienstID).html().includes('progress.gif'))
          {
            if (isSelf($('tr#' + mutationDienstID).html(), getOwnIDs()))
            {
              $('tr#' + mutationDienstID).children('.noprint').append(exportDict[mutationDienstID]);
              $('#exportCal_' + mutationDienstID).show();
            }
            if($('tr#' + mutationDienstID).html().includes("reEditShifts"))
            {
              expDFActive().then(function(isActive)
              {
                if (!isActive) { return Promise.reject("DF ist ausgeschalten!"); }
                return getOperableDNRs();
              })
                .then(function(result)
                {
                  $('tr#' + mutationDienstID + " input[name*='reEditShifts']").each(function()
                  {
                    var targetCell = $(this);
                    convertDFField(targetCell, result);
                  });
                });
              }
            }
        }, 1500);
      });
    }
    catch(err) { }
  }
});
