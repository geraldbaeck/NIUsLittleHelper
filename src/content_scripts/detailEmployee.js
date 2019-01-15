$(document).ready(function() {
  console.log("detailEmployee content script called");

  // Alarm für noch nciht ausgefolgte Urkunden und Dekrete
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

  new ClipboardJS('#adr_copy');

  var address = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Street').val() + " ";  // Straße
  address += $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_StreetNumber').val() + "\n";  // Hausnummer
  address += $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_PostalCode').val() + " ";  // PLZ
  address += $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_City').val() + "\n";  // Ort
  address += $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Country option:selected').text();

  var name = "";
  var berufstitel = $('#ctl00_main_m_Employee_m_ccEmployeeMain__professionTitle option:selected').text();
  if (berufstitel != '<Berufstitel>') {
    name += berufstitel + " ";
  }
  var titel = $('ctl00_main_m_Employee_m_ccEmployeeMain__preAcademicTitle option:selected').text();
  if (titel != '<Titel>') {
    name += titel + " ";
  }
  name += $('#ctl00_main_m_Employee_m_ccEmployeeMain__firstName').val() + " ";  // Vorname
  name += $('#ctl00_main_m_Employee_m_ccEmployeeMain__lastName').val() + " ";  // Nachname
  
  var PGtitel = $('ctl00_main_m_Employee_m_ccEmployeeMain__postAcademicTitle option:selected').text();
  console.log(PGtitel);
  if (PGtitel != '<Titel>' && PGtitel.trim() != "") {
    name += ", " + PGtitel;
  }
  name = name.trim();

  $('#Kontakte_box').after('<div class="Whitebox" id="copybox"><textarea rows="4" cols="77" style="font-size:80%;" id="copycontent">' + name + "\n" + address + '</textarea><div>');
  $('#copybox').append('<a href="#" id="adr_copy" data-clipboard-target="#copycontent">' + copyImage + '</a></div>');
});
