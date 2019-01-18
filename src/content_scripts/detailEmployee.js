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

  var person_data = {};

  getKuerzel().then(function(kuerzel) {
    person_data.admin_kuerzel = kuerzel;
  });

  person_data.anrede = $('#ctl00_main_m_Employee_m_ccEmployeeMain__salutation option:selected').text();  // Herr/Frau
  person_data.vorname = $('#ctl00_main_m_Employee_m_ccEmployeeMain__firstName').val();
  person_data.nachname = $('#ctl00_main_m_Employee_m_ccEmployeeMain__lastName').val();
  person_data.berufstitel = $('#ctl00_main_m_Employee_m_ccEmployeeMain__professionTitle option:selected').text();
  person_data.titel = $('ctl00_main_m_Employee_m_ccEmployeeMain__preAcademicTitle option:selected').text();
  person_data.PGtitel = $('ctl00_main_m_Employee_m_ccEmployeeMain__postAcademicTitle option:selected').text();

  person_data.strasse = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Street').val();
  person_data.hausnummer = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_StreetNumber').val();
  person_data.plz = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_PostalCode').val();
  person_data.ort = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_City').val();
  person_data.land = $('#ctl00_main_m_Employee_m_ccPersonAddress_m_ccAddress0_m_Country option:selected').text();

  // Volle Anschrift mit Zeilenübrüchen
  person_data.anschrift = person_data.strasse + " " + person_data.hausnummer + "\n" + person_data.plz + " " + person_data.ort + "\n" + person_data.land;

  // Geschlecht
  person_data.geschlecht = "";
  person_data.anrede_lieber = "Hallo";
  if (person_data.anrede == "Herr") {
    person_data.geschlecht = "m";
    person_data.anrede_lieber = "Lieber";
  }
  else if (person_data.anrede == "Frau") {
    person_data.geschlecht = "w";
    person_data.anrede_lieber = "Liebe";
  }

  // generiert den vollen Namen eg Oberstudienrätin Dr. Mag. Karin Muster, MBA
  person_data.name = "";
  if (person_data.berufstitel != '<Berufstitel>') {
    person_data.name += person_data.berufstitel + " ";
  }
  if (person_data.titel != '<Titel>') {
    person_data.name += person_data.titel + " ";
  }
  person_data.name += person_data.vorname + " ";
  person_data.name += person_data.nachname + " ";
  if (person_data.PGtitel != '<Titel>' && person_data.PGtitel.trim() != "") {
    person_data.name += ", " + person_data.PGtitel;
  }
  person_data.name = person_data.name.trim();

  // dienstnummer
  person_data.dienstnummer = $('h1').text().substring($('h1').text().indexOf('(') + 1, $('h1').text().indexOf(')'));

  new ClipboardJS('#adr_copy');
  $('#Kontakte_box').after('<div class="Whitebox" id="copybox"><textarea rows="4" cols="77" style="font-size:80%;" id="copycontent">' + person_data.name + "\n" + person_data.anschrift + '</textarea><div>');
  $('#copybox').append('<a href="#" id="adr_copy" data-clipboard-target="#copycontent" style="float:right">' + copyImage + '</a>');


  $('#copybox').append('<input type="file" id="upload_select_docx" accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document" />');
  //event listener for when the input changes
  document.querySelector("#upload_select_docx").addEventListener('change',loadDocX, false);

  function loadFile(url,callback){
    JSZipUtils.getBinaryContent(url,callback);
  }

  function loadDocX(evt){
    var url;
    var file;
    file = evt.target.files[0];
    reader = new FileReader();
    //we need to instantiate a new FileReader object
    reader.addEventListener("load", readDocx, false);
    //we add an event listener for when a file is loaded by the FileReader
    //this will call our function 'readDocx()'
    
    reader.readAsDataURL(file);
    //we now read the data
  }
  function readDocx(event) {
    // event.target.result;
    //the event has a target property, the FileReader with a property 'result',
    //which is where the value we read is located

    loadFile(event.target.result,function(error, content){
      console.log("File loaded");
      if (error) { throw error };
      var zip = new JSZip(content);
      var doc = new Docxtemplater().loadZip(zip)
      doc.setData(person_data);
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
  }
});
