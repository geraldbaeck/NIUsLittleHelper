$(document).ready(function () {

  // scrapes the table data
  // and enriches the rows with metadata
  // to enable filtering
  function prepareTable() {
    var positions = [];

    // set uniqe id for each header table
    var $tables = $('table.InnerBorder');
    $tables.find('a').each(function (i) {
      var tableHeaderID = $(this).attr('id').replace('_AmbNr', '');
      $($tables[i]).attr('group', tableHeaderID).attr('row-type', "header"); // add id to table
      $('table[group=' + tableHeaderID + ']').addClass('ambuTable');
    });

    // set uniqe id for each positions table
    $(document).find('table.openPositionsSubTable').each(function (i, $table) {
      var tableHeaderID = $(this).find('tr').first().attr('id').substring(0, $(this).find('tr').first().attr('id').indexOf('_rPositions'));

      $(this).find('tr').each(function () {
        $($table).attr('group', tableHeaderID).attr("row-type", "details");
        var position = $(this).find('td span').first().text();  // gesuchte Position zb UO, AZUBI
        $('table[group=' + tableHeaderID + ']').attr(position, true).addClass('ambuTable');
        positions.push(position);
      });
    });

    return Array.from(new Set(positions)).sort();
  }

  function filterTable() {
    if ($('#TableHack input:checkbox:checked').length) {
      $('table.ambuTable').hide();
      $('.TableHack.Position').each(function () {
        var positionID = $(this).attr('positionID');
        if ($(this).is(':checked')) {
          $('table[' + positionID + '=true]').show();
        }
      });
    } else {
      $('table.ambuTable').show();  // no checkbox select show all
    }

    var hideDays = [];

    $("[name='nlh_day_filter[]']").each(function () {
      var $this = $(this);
      var val = $this.val();
      var $label = $("#label_nlh_day_filter_" + val);

      if (!$this.prop("checked")) {
        hideDays.push(val);
        $label.css("font-weight", "normal");
      }
      else {
        $label.css("font-weight", "bold");
      }
    });

    if (hideDays && hideDays.length) {
      for (var i = 0; i < hideDays.length; i++) {
        var hideDayShort = hideDays[i];
        $("[day*='[" + hideDayShort + "]']").hide();
      }
    }

    $(".TableHack.DayRange").each(function () {
      var $this = $(this);

      if ($this.prop("checked")) {
        switch ($this.attr("id")) {
          case "day_range_id":
            $(".DayRangeSelector").prop("disabled", true);
            break;

          case "day_range_select":
            $(".DayRangeSelector").prop("disabled", false);
            var date_begin = $("[name=range_begin]").val();
            var date_end = $("[name=range_end]").val();
            $('table.ambuTable').each(function () {
              var $this = $(this);
              var row_date = $this.attr("date");

              if (row_date < date_begin || row_date > date_end) {
                $this.hide();
              }
            });
            break;

        }

        console.log($this.attr("id"));
      }
    });
  }

  tbl = prepareTable();
  $(".InnerBorder br").addClass('in_table');

  $("br:not('.in_table')").remove();
  $('table.openPositionsSubTable')
      .css('width', '100%')
      .css('margin-bottom', '0.9em');

  var days = [
    {short: 'So', name: 'Sonntag', order: 7},
    {short: 'Mo', name: 'Montag', order: 1},
    {short: 'Di', name: 'Dienstag', order: 2},
    {short: 'Mi', name: 'Mittwoch', order: 3},
    {short: 'Do', name: 'Donnerstag', order: 4},
    {short: 'Fr', name: 'Freitag', order: 5},
    {short: 'Sa', name: 'Samstag', order: 6}
  ];

  $("[row-type='header']").each(function () {
    $(this).find('td:contains("Einsatzbeginn"),td:contains("Von"),td:contains("Bis")').each(function () {
      var $this = $(this);
      var time = $this.text();
      var EB = false;
      if (time.search(/einsatzbeginn/i) != -1) {
        EB = true;
      }
      time = time.replace(/(einsatzbeginn|von|bis)/i, "");

      time = time.split(" ");
      var date = time[0].split('.');

      date = new Date(date[2] + '-' + date[1] + '-' + date[0] + 'T' + time[1]);
      time = time.join(" ");

      var day = days[date.getDay()].short;

      var html = $this.html().replace(time, day + " " + time);

      $this.html(html);

      var $table = $this.closest("table[row-type='header']");
      var $group = $("[group=" + $table.attr("group") + "]");

      var current = $group.attr("day");

      if (typeof current === 'undefined') {
        current = "";
      }

      day = "[" + day + "]";
      if (current.indexOf(day) == -1) {
        $group.attr("day", (current + day).trim());
      }

      if (EB) {
        $group.attr("date", date.toISOString().slice(0, 10));
      }
    });
  });

  // add selectors
  $('#aspnetForm div').slice(1).first().addClass("amb_list").prepend('<table class="DFTable" style="float:left;margin-bottom:0.9em;margin-top:1em;width:100%;"><tr><td><div id="TableHack" style="text-align:left;"></div></td></tr></table>');
  $.each(tbl, function () {
    $('#TableHack').append('<span style="white-space:nowrap;vertical-align: middle;padding-right:0.5em;"><label for="pos_' + this + '">' + this + '</label>: <input type="checkbox" id="pos_' + this + '" positionID="' + this + '" class="TableHack Position" style="margin-right:0.6em;vertical-align:middle;top:0.005em;"></span><wbr>')
  });

  var FilterContainer =
      "<div style='clear:both; font-weight:bold; text-align:left; border-top: 1px solid red; line-height: 150%;'></div>";

  var $FilterDay = $(FilterContainer)
      .html("Nur Dienste an folgenden Tagen:");
  $("<br/>").appendTo($FilterDay);

  var DayFilters = [];
  for (var dayIndex in days) {
    var day = days[dayIndex];
    var id = "nlh_day_filter_" + day.short;

    var $FilterItem = $("<div/>")
        .css("display", "inline-block")
        .css("padding", "0 2px");

    $("<input/>")
        .attr("type", "checkbox")
        .attr("name", "nlh_day_filter[]")
        .attr("id", id)
        .attr("checked", true)
        .addClass('TableHack Day')
        .val(day.short)
        .appendTo($FilterItem);

    $("<label/>")
        .attr("for", id)
        .attr("id", "label_" + id)
        .html(day.name)
        .css("vertical-align", "top")
        .css("font-weight", "bold")
        .appendTo($FilterItem);

    DayFilters[day.order] = $FilterItem;
  }

  for (dayIndex in DayFilters) {
    $FilterDay.append(DayFilters[dayIndex]);
  }

  var $FilterTable = $("div.amb_list table.DFTable");
  $FilterTable.append($("<tr/>").html("<td/>").html($FilterDay));

  var $FilterDateRange = $(FilterContainer)
      .html("Einsatzbeginn:");
  $("<br/>").appendTo($FilterDateRange);


  $("<div/>")
      .css("display", "inline-block")
      .css("padding", "0 2px")
      .append(
          $("<input/>")
              .addClass("TableHack DayRange")
              .attr("type", "radio")
              .attr("checked", "Checked")
              .attr("name", "day_range")
              .attr("id", "day_range_all")
      )
      .append(
          $("<label/>")
              .attr("for", "day_range_all")
              .html("Alle")
              .css("vertical-align", "top")
      )
      .appendTo($FilterDateRange);
  $("<div/>")
      .css("display", "inline-block")
      .css("padding", "0 2px")
      .append(
          $("<input/>")
              .addClass("TableHack DayRange")
              .attr("type", "radio")
              .attr("name", "day_range")
              .attr("id", "day_range_select")
      )
      .append(
          $("<label/>")
              .attr("for", "day_range_select")
              .html("Zwischen: ")
              .css("vertical-align", "top")
      )
      .appendTo($FilterDateRange);

  var today = new Date();
  var next_month = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      today.getDate(),
      today.getHours(),
      today.getMinutes(),
      today.getSeconds()
  );

  $("<div/>")
      .css("display", "inline-block")
      .css("padding", "0 2px")
      .append(
          $("<input/>")
              .addClass("TableHack DayRangeSelector")
              .css("display", "text-bottom")
              .attr("type", "date")
              .val(today.toISOString().slice(0, 10))
              .attr("name", "range_begin")
              .prop("disabled", true)
      )
      .append(" und ")
      .append(
          $("<input/>")
              .addClass("TableHack DayRangeSelector")
              .css("display", "text-bottom")
              .attr("type", "date")
              .val(next_month.toISOString().slice(0, 10))
              .attr("name", "range_end")
              .prop("disabled", true)
      )
      .appendTo($FilterDateRange);

  $FilterTable.append($("<tr/>").html("<td/>").html($FilterDateRange));

  $('.TableHack').change(function () {
    filterTable();
  });

  $('a[id^="ctl00_main_rAmbulances_ctl"]').attr('target', '_blank');

});
