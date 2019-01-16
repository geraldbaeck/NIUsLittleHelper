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
  $('#copybox').append('<a href="#" id="adr_copy" data-clipboard-target="#copycontent">' + copyImage + '</a>');

  $('#copybox').append('<a href="#" id="btn_word">' + copyImage + '</a></div>');
  $('#copybox').append('<input id="template_word" name="Select Template" type="file" accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document">');
  function loadFile(url,callback){
    JSZipUtils.getBinaryContent(url,callback);
  }
  $(document).on('click', '#btn_word', function() { 
    console.log("started?");
    console.log($('#template_word'));
    console.log(chrome.runtime.getURL($('#template_word').val()));
    loadFile("https://docxtemplater.com/tag-example.docx",function(error, content){
        console.log("File loaded");
        if (error) { throw error };
        var zip = new JSZip(content);
        var doc = new Docxtemplater().loadZip(zip)
        doc.setData({
            first_name: 'John',
            last_name: 'Doe',
            phone: '0652455478',
            description: 'New Website'
        });
        try {
            // render the document (replace all occurences of {first_name} by John, {last_name} by Doe, ...)
            doc.render()
        }
        catch (error) {
            var e = {
                message: error.message,
                name: error.name,
                stack: error.stack,
                properties: error.properties,
            }
            console.log(JSON.stringify({error: e}));
            // The error thrown here contains additional information when logged with JSON.stringify (it contains a property object).
            throw error;
        }
        var out=doc.getZip().generate({
            type:"blob",
            mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        }) //Output the document using Data-URI
        saveAs(out,"output.docx")
        console.log("saved?");
    });
  });
});
