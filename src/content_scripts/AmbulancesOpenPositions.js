$(document).ready(function() {

  // scrapes the table data
  // and enriches the rows with metadata
  // to enable filtering
  function prepareTable() {
    var positions = [];

    // set uniqe id for each header table
    var $tables = $('table.InnerBorder');
    $tables.find('a').each(function(i) {
      var tableHeaderID = $(this).attr('id').replace('_AmbNr', '');
      $($tables[i]).attr('id', tableHeaderID); // add id to table
      $('table#' + tableHeaderID).addClass('ambuTable');
    });

    // set uniqe id for each positions table
    $(document).find('table.openPositionsSubTable').each(function(i, $table) {
      var tableHeaderID = $(this).find('tr').first().attr('id').substring(0, $(this).find('tr').first().attr('id').indexOf('_rPositions'));
      $(this).find('tr').each(function() {
        $($table).attr('id', tableHeaderID);  // add id to table
        var position = $(this).find('td span').first().text();  // gesuchte Position zb UO, AZUBI
        $('table#' + tableHeaderID).attr(position, true);
        $('table#' + tableHeaderID).addClass('ambuTable');
        positions.push(position);
      });
    });

    return Array.from(new Set(positions)).sort();
  }

  function filterTable() {
    $('br').remove();
    $('table.openPositionsSubTable').css('width', '100%');
    $('table.openPositionsSubTable').css('margin-bottom', '0.9em');
    if ($('#TableHack input:checkbox:checked').length) {
      $('table.ambuTable').hide();
      $('.TableHack').each(function() {
        var positionID = $(this).attr('positionID');
        if ($(this).is(':checked')) {
          $('table[' + positionID + '=true]').show();
        }
      });
    } else {
      $('table.ambuTable').show();  // no checkbox select show all
    }
  }

  console.log('hello ambulanzis');
  tbl = prepareTable();

  // add selectors
  $('#aspnetForm div').slice(1).first().prepend('<table class="DFTable" style="float:left;margin-bottom:0.9em;margin-top:1em;width:100%;"><tr><td><div id="TableHack" style="text-align:left;"></div></td></tr></table>');
  $.each(tbl, function() {
    $('#TableHack').append('<span style="white-space:nowrap;vertical-align: middle;padding-right:0.5em;"><label for="pos_' + this + '">' + this + '</label>: <input type="checkbox" id="pos_' + this + '" positionID="' + this + '" class="TableHack" style="margin-right:0.6em;vertical-align:middle;top:0.005em;"></span><wbr>')
  });

  $('.TableHack').change(function() {
    filterTable();
  });

});
