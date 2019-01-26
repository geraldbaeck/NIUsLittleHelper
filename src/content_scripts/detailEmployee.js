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

  getOwnName().then(function(name) {
    person_data.admin_name = name;
  });

  getOwnDNRs().then(function(dnrs){
    person_data.admin_dnr = dnrs[0];
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

  person_data.dienstgrad_kurz = $('#ctl00_main_m_Employee_m_ccEmployeeMain__rank  option:selected').text();
  person_data.dienstgrad = dienstgrade[person_data.dienstgrad_kurz];
  person_data.mindestdienstzahl = $('#ctl00_main_m_Employee_m_ccEmployeeExtention__annualMinDuties').val();

  person_data.geburtsdatum = $('#ctl00_main_m_Employee_m_ccEmployeeExtention__birthday_m_Textbox').val();

  person_data.ad_benutzername = $('#ctl00_main_m_Employee_m_ccEmployeeExtention_m_Employee tr:contains("AD Benutzername:") td:last').text();


  // Volle Anschrift mit Zeilenübrüchen
  person_data.anschrift = person_data.strasse + " " + person_data.hausnummer + "\n" + person_data.plz + " " + person_data.ort + "\n" + person_data.land;

  // Kontodaten
  person_data.konto_inhaber = $('#ctl00_main_m_Employee_m_ucAccount_m_Name').val();
  person_data.konto_iban = $('#ctl00_main_m_Employee_m_ucAccount_m_Iban').val();
  person_data.konto_bank = $('#ctl00_main_m_Employee_m_ucAccount_m_BankName').val();
  person_data.konto_bic = $('#ctl00_main_m_Employee_m_ucAccount_m_Bic').val();

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

  console.log(person_data);

  // Template Box erstellen
  $('#ctl00_main_m_Employee_m_ccEmployeeMain__employeeMain').after('<hr><span id="template_box"><h2>Brief erstellen:</h2></span>');
  $('#template_box').append('<input type="file" id="upload_select_docx" accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document" /><a href="' + chrome.extension.getURL("/src/webcontent/template_help.html") + '" rel="modal:open">' + helpImage + '</a>');

  // Copybox für Adresse
  new ClipboardJS('#adr_copy');
  $('#template_box').before('<span id="copybox" style="float:right;display:inline-flex;;"><textarea rows="4" cols="77" style="font-size:80%;" id="copycontent">' + person_data.name + "\n" + person_data.anschrift + '</textarea><span>');
  $('#copybox').append('<a href="#" id="adr_copy" data-clipboard-target="#copycontent">' + copyImage + '</a>');
  
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
      var filedate = (new Date()).toISOString().slice(0,10).replace(/-/g,"");
      var template_name = $("#upload_select_docx").val().replace("C:\\fakepath\\", "");
      var output_filename = [filedate, person_data.dienstnummer, person_data.nachname, person_data.vorname, template_name].join("_");
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
      saveAs(out, output_filename)
  });
  }
});
