$(document).ready(function() {
  console.log("vfm-bescheiderstellung content script called");


  $('#main-content').after('<hr><span id="template_box"><h2>Bescheidvorlage:</h2></span>');
  
  $('#template_box').append('<input type="file" id="upload_select_docx" accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document" /><input type="button" id="generatebutton" value="Bescheid erstellen" /><br /><sub>Sobald hier eine Bescheidvorlage eingefügt wird, startet automatisch der Download des fertig erstellten Bescheids.<br />Die in der Vorlage verwendeten Platzhalter werden automatisch mit den im Formular eingegebenen Daten ersetzt.</sub>');

  //event listener for when the input changes
  document.querySelector("#upload_select_docx").addEventListener('change',loadDocX, false);
  document.querySelector("#generatebutton").addEventListener('click',generateButtonClicked, false);

  function generateButtonClicked()
  {
    document.querySelector("#upload_select_docx").value = "";
    document.querySelector("#upload_select_docx").click();
  }

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
      
      var person_data = {};

      var def_fieldnames = $("#i_fieldnames").val().split(";");
      var def_filename = $("#i_filename").val().split(";");
      var def_dropdowns = $("#i_dropdowns").val().split(";")
      
      var filename_constructed = "";

      for(var i = 0; i < def_filename.length; i++)
      {
        def_filename[i] = $("#i_" + def_filename[i]).val();
      }

      filename_constructed = def_filename.join("_");

      for(var i = 0; i < def_fieldnames.length; i++)
      {
        person_data[def_fieldnames[i]] = $("#i_" + def_fieldnames[i]).val();
      }

      for(var i = 0; i < def_dropdowns.length; i++)
      {
        person_data[def_dropdowns[i]] = $("#i_" + def_dropdowns[i] + " option:selected").text();
      }

      var filedate = (new Date()).toISOString().slice(0,10).replace(/-/g,"");
      var template_name = $("#upload_select_docx").val().replace("C:\\fakepath\\", "");

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
      saveAs(out, filename_constructed + ".docx")
  });
  }

});