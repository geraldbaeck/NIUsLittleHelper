// jscs:disable maximumLineLength

$(document).ready(function() {

  // sorts an object by it's value
  // returns array
  function sortProperties(obj) {
    // convert object into array
    var sortable = [];
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        sortable.push([key, obj[key]]); // each item is an array in format [key, value]
      }
    }
    // sort items by value
    sortable.sort(function(a, b) {
      var x = a[1];
      var y = b[1];
      return x < y ? -1 : x > y ? 1 : 0;
    });

    return sortable; // array in format [ [ key1, val1 ], [ key2, val2 ], ... ]
  }

  // scrapes the table data
  // and enriches the rows with metadata
  // to enable filtering
  function prepareTable() {

    // get your own Dienstnummer
    var dienstnummer = $('h3').first().text().substring($('h3').first().text().indexOf('(')).replace('(', '').replace(')', '').trim();
    console.log('Dienstnummer: ' + dienstnummer);

    // iterate data of each row
    var $tables = $('div.MultiDutyRoster');
    $tables.find('table.MessageTable').each(function(i) {

      // add placholder for statistics
      $(this).find('tbody tr').first().after('<tr><td><table class="DutyRoster" cellspacing="0" cellpadding="3" rules="all" border="1"><tbody><tr><td id="charts' + i + '"></td></tr></tbody></table></td></tr>');

      // add header for duty duration
      $(this).find('td.DRCTime').first().after('<td class="DRCDuration" width="50px">Dauer</td>');

      var tableType = $(this).find('td.MessageHeader').text();

      // create statistical counters
      var rawWochentag = new Array();
      var rawDienststellen = new Array();
      var currentDateString;
      var sumDuty = 0; // Gesamtdauer aller Dienste
      var countDienste = 0;
      var rawKollegen = new Array();
      var rawDutyAs = new Array();

      $(this).find('table#DutyRosterTable tbody tr').each(function() {
        countDienste += 1;
        $(this).find('td').each(function(i, val) {
          val = val.innerHTML.replace('&nbsp;', '').replace('<em>', '').replace('</em>', '').trim();
          switch (i) {
            case 0: // Wochentag
              rawWochentag.push(val);
              break;
            case 1: // Datum
              currentDateString = val;
              break;
            case 2: // Zeiten
              hours = getDurationFromTimeString(currentDateString, val);
              $(this).after('<td>' + hours + '</td>');
              sumDuty += hours;
              break;
            case 3: // Dienststellen
              rawDienststellen.push(val);
              break;
            default:
              break;
          }
          if (tableType.includes('geplant')) {
            switch (i) {
              case 4: // Fahrer
              case 5: // SAN1
              case 6: // SAN2, Error Try-Catch um bei 2-spaltigen Dienstarten keinen Programmabbruch zu verursachen.
                try {
                  if (!$(val).text().includes(dienstnummer) && $(val).text() !== '') {
                    var kollege = $(val).text().substring(0, $(val).text().indexOf('(')).replace('Wunschmeldung', '').replace(':', '').replace('>', '').trim();
                    rawKollegen.push(kollege);
                  } else if ($(val).text() !== '') {
                    switch (i) {
                      case 4: // SEF
                        rawDutyAs.push('SEF');
                        break;
                      case 5: // SAN1
                        rawDutyAs.push('SAN1');
                        break;
                      case 6: // SAN2
                        rawDutyAs.push('SAN2');
                        break;
                      default:
                        break;
                    }
                  }
                  break;
                }
                catch (err) {
                  console.log(err);
                  break;
                }
              default:
                break;
            }
          } else if (tableType.includes('fixiert')) {
            switch (i) {
              case 5: // Fahrer
              case 6: // SAN1
              case 7: // SAN2, Error Try-Catch um bei 2-spaltigen Dienstarten keinen Programmabbruch zu verursachen.
                try {
                  if (!$(val).text().includes(dienstnummer) && $(val).text() !== '') {
                    var kollege = $(val).text().substring(0, $(val).text().indexOf('(')).trim();
                    rawKollegen.push(kollege);
                  } else if ($(val).text() !== '') {
                    switch (i) {
                      case 5: // SEF
                        rawDutyAs.push('SEF');
                        break;
                      case 6: // SAN1
                        rawDutyAs.push('SAN1');
                        break;
                      case 7: // SAN2
                        rawDutyAs.push('SAN2');
                        break;
                      default:
                        break;
                    }
                  }
                  break;
                }
                catch (err) {
                  break;
                }
              default:
                break;
            }
          }
        });
      });

      // var countWochentag = {};
      // rawWochentag.forEach(function(x) { countWochentag[x] = (countWochentag[x] || 0) + 1; });
      // $('#charts' + i).append('<span class="WochentagChart' + i + '"></span>');
      // var data = {
      //   labels: Object.keys(countWochentag),
      //   series: Object.values(countWochentag),
      // };
      // var options = {
      //   width: '200',
      //   showLabel: true,
      //   ignoreEmptyValues: true,
      // };
      // new Chartist.Pie('.WochentagChart' + i, data, options);

      var countDienststellen = {};
      var countPercDienststellen = {};
      rawDienststellen.forEach(function(x) { countDienststellen[x] = (countDienststellen[x] || 0) + 1; });
      console.log(countDienststellen);
      Object.keys(countDienststellen).forEach(function(key,index) {
        // calculate percentage
        var perc = key + ' (' + Math.round(countDienststellen[key] / rawDienststellen.length * 100) + '%)';
        countPercDienststellen[perc] = countDienststellen[key];
      });
      $('#charts' + i).append('<table style="float:left;"><thead><tr><td style="text-align:center;"><strong>Dienst auf:</strong></td></tr></thead></tbody><tr><td class="DienststellenChart' + i + '"></td></tr></tbody></table>');
      var data = {
        labels: Object.keys(countPercDienststellen),
        series: Object.values(countPercDienststellen),
      };
      var options = {
        width: '200',
        showLabel: true,
        ignoreEmptyValues: true,
      };
      new Chartist.Pie('.DienststellenChart' + i, data, options);

      var countDutyAs = {};
      var countPercDutyAs = {};
      rawDutyAs.forEach(function(x) { countDutyAs[x] = (countDutyAs[x] || 0) + 1; });
      console.log(countDutyAs);
      Object.keys(countDutyAs).forEach(function(key,index) {
        // calculate percentage
        var perc = key + ' (' + Math.round(countDutyAs[key] / rawDutyAs.length * 100) + '%)';
        countPercDutyAs[perc] = countDutyAs[key];
      });
      $('#charts' + i).append('<table style="float:left;"><thead><tr><td style="text-align:center;"><strong>Dienst als:</strong></td></tr></thead></tbody><tr><td class="DutyAsChart' + i + '"></td></tr></tbody></table>');
      var data = {
        labels: Object.keys(countPercDutyAs),
        series: Object.values(countPercDutyAs),
      };
      var options = {
        width: '200',
        showLabel: true,
        ignoreEmptyValues: true,
      };
      new Chartist.Pie('.DutyAsChart' + i, data, options);

      var countKollegen = {};
      rawKollegen.forEach(function(x) { countKollegen[x] = (countKollegen[x] || 0) + 1; });
      countKollegenSorted = sortProperties(countKollegen);

      // $('text.ct-label').css('color', 'black');
      // $('text.ct-label').css('font-weight', 'bold');  // not working

      $('#charts' + i).append('<table style="float:left;"><thead><tr><td><strong>Übersicht:</strong></td></tr></thead><tbody class="additionalData' + i + '"><tr><td></td></tr></tbody></table>');
      $('.additionalData' + i).append('<tr><td>Dienste: </td><td style="text-align:right;">' + countDienste + '</td></tr>');
      $('.additionalData' + i).append('<tr><td>Gesamtdauer: </td><td style="text-align:right;">' + sumDuty + '</td></tr>');
      $('.additionalData' + i).append('<tr><td>durchschnitt Dauer: </td><td style="text-align:right;">' + Math.round(sumDuty / countDienste) + '</td></tr>');

      $('#charts' + i).append('<table style="float:left;margin-left:20px;"><thead><tr><td><strong>Top KollegInnen:</strong></td></tr></thead><tbody class="topKollegen' + i + '"><tr><td></td></tr></tbody></table>');
      Object.keys(countKollegenSorted.reverse().slice(0,5)).forEach(function(key, object) {
        $('.topKollegen' + i).append('<tr><td>' + countKollegenSorted[key][0] + '</td><td style="text-align:right;">' + countKollegenSorted[key][1] + '</td></tr>');
      });
    });
  }

  function filterTable() {
    $('br').remove();
    $('table.openPositionsSubTable').css('width', '100%');
    $('table.openPositionsSubTable').css('margin-bottom', '0.9em');
    $('table.ambuTable').hide();
    $('.TableHack').each(function() {
      var positionID = $(this).attr('positionID');
      if ($(this).is(':checked')) {
        $('table[' + positionID + '=true]').show();
      }
    });
  }

  tbl = prepareTable();

});
