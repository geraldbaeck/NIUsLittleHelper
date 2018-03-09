$(document).ready(function() {
  console.log("detailEmployee content script called");

  var load = {};
  load[STORAGE_KEY_DEKRET_ALERT] = DEFAULT_DEKRET_ALERT;
  chrome.storage.sync.get(load, function(item) {
    if (item[STORAGE_KEY_DEKRET_ALERT]) {
      var dekretAlarm = [];
      $("span[id$='_m_DescriptionLabel']:contains('nicht ausgefolgt')").each(function() {
        var dekretName = $(this).parent().parent().parent().parent().find("td").first().text();
        var dekretDatum = $(this).parent().parent().parent().parent().find("input").first().val();
        dekretAlarm.push("<b>" + dekretName + "</b> vom " + dekretDatum);
      });
      if(dekretAlarm.length>0) {
        var modalDiv = '<ul style="margin:10px 0px;list-style-position:inside;padding-left:.5em;">';
        $.each(dekretAlarm, function() {
          modalDiv += '<li style="margin-bottom:10px;">' + this + "</li>";
        });
        modalDiv += '</ul>';
        new PNotify({
          title: 'Dekrete noch nicht ausgefolgt:',
          text: modalDiv,
          type: "info",
          width: "400px",
        });
      }
    }
  });
});
