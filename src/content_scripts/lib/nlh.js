/*
  NiusLittleHelper Klasse


*/
"use strict";

console.debug("define NLH");

var NLH;
if (NLH === undefined) {

  class NiusLittleHelper {

    constructor() {
      this.addins = new Object;
      this.waitingFor = new Object;
      this.activeAddins = new Array;
      this.activeNames = new Array;
      this.ready = false;
      this.db = new PouchDB(POUCHDB_DB_NAME);
      this.url = window.location.href;
      this.options = [{
        Name : "Experimental Addins",
        Description : "Sollen experimentelle Features aktiviert werden?",
        Type : Boolean
      }];
    }


    /*
      Registriert ein NiuHelperAddin
      @param {NiuHelperAddin} - das NiuHelperAddin, dass registriert werden soll
    */
    registerAddin(addin) {

      if (addin.name === undefined) {
        throw "Error passed object (addin) must have a NAME attribute!";
      }
      this.addins[addin.name] = addin;
      this.canStart(addin, 0);
    }


    canStart(addin, count) {
      if (count > 10) {
        throw "Error zu stark verschachtelte Abhängikeiten oder LOOP!";
      }
      count =+ 1;
      let fullfilled = true;


      //check ob addin experimentell, wenn ja nur dann starten, wenn experimentell aktiv!
      if (addin.experimental && !this.isExperimentalActivated()) {
        fullfilled = false;
        return false;
      }

      //TODO: check ob addin in configuration aktiv

      //TODO: check ob addin url match!
      if (Array.isArray(addin.urls)) {
        for (let regex of addin.urls) {
          if (this.url.match(regex)) {
            fullfilled = true;  //erster match reicht...
            break;
          } else {
            return false;
          }
        }
      } else {
        console.warn("Kein Array urls gesetzt bei addin! Bitte property urls setzen und mit Regulären Expressions befüllen!\n" +
            "Dieses Addin " + addin + " wird ignoriert!");
        return false;
      }


      //check required addins...
      if (Array.isArray(addin.requires)) {
        for (let require of addin.requires) {
          if (!this.activeNames.includes(require)) {
            console.info("Required addin with name [" + require + "] not found or not active yet!");
            fullfilled = false;
            if (!Array.isArray(this.waitingFor[require])) {
              this.waitingFor[require] = new Array;
            }
            this.waitingFor[require].includes(addin.name) || this.waitingFor[require].push(addin.name);
            break;
            return false;
          }
        }
      }



      if (fullfilled) {
        console.info("Aktiviere addin: " + addin.name);


        this.activeNames.push(addin.name);
        this.activeAddins.push(addin);

        //entferne mich selbst von den wartelisten...
        if (Array.isArray(addin.requires)) {
          for (let req of addin.requires) {
            if (Array.isArray(this.waitingFor[req]) && this.waitingFor[req].indexOf(addin.name) > -1) {
              this.waitingFor[req].splice(this.waitingFor[req].indexOf(addin.name), 1);
            }
          }
        }

        addin.onActivate();

        //arbeite alle addins ab, die auf dieses addin warten...
        if (Array.isArray(this.waitingFor[addin.name])) {
          for (let waiting of this.waitingFor[addin.name]) {
              this.addins[waiting] && this.canStart(this.addins[waiting], count);
          }
        }

      }

    };

    /*
      wird aufgerufen, alls callback von $(document).ready
    */
    onReady() {
      console.debug("NLH.onReady() --> function called");
      this.ready = true;
      console.debug("NLH.onReady() --> iterate over: " + this.activeAddins);
      for (let addin of this.activeAddins) {
        console.debug("NLH.onReady() --> calling onReady of addin: " + JSON.stringify(addin));
          addin.onReady();
      }
    }

    getDB() {
      //var db = new PouchDB(POUCHDB_DB_NAME);
      //window.PouchDB = PouchDB;
      return this.db;
    }

    isExperimentalActivated() {
      //TODO: config fragen
      return true;
    }

    //console.debug("NLH --> register document.ready callback");

  };
  NLH = new NiusLittleHelper();

//###############################

  /*
  *  Repräsentiert ein NiuHelperAddin
  *  @constructor
  *  @param {string} name - Eindeutiger Name für diese Erweiterung
  */
  NiusLittleHelper.prototype.NiuHelperAddin = class {

    constructor (name) {
      this.name = name;
      this.urls = [];
    }

    onReady() {
      //do nothing...
    }

    onActivate() {
      //do nothing...
    }

    get experimental() {
      return true;
    }

    toString() {
      return "Addin: " + this.name;
    }

  };


  NLH.registerAddin(new class extends NLH.NiuHelperAddin {

    constructor() {
      super("nlh.options");
      this.urls = ["Header.aspx"];
    }

    onReady() {
      let b = $('<span id="nlh_options_button">NLH Options</span>');
      $("#pageTitle").after(b);
      $("#nlh_options_button").button();
      $("#nlh_options_button").click(function() {
        //TODO: optionen weg auslagern vom PLUGIN code hinzu web only code...
        //TODO: show options dialog....
        //TODO: hide framesset und zeige optionen an

        //TODO: generiere optionen seite

        //TODO: nach dem schließen zeige frameset wieder normal an!


        // vex.dialog.open({
        //   message: "NIU's little Helper Optionen",
        //   input: [
        //     '<input name="experimental" type="checkbox" checked/>',
        //   ].join(''),
        //   buttons: [
        //     $.extend({}, vex.dialog.buttons.YES, { text: "speichern"}),
        //     $.extend({}, vex.dialog.buttons.NO, { text: "abbrechen"})
        //   ],
        //   callback: function(data) {
        //     if (!data) {
        //       console.log("cancelled!")
        //     } else {
        //       console.log("gespeichert!")
        //     }
        //   }
        // });


      });

    }


  }());


  $(document).ready(function(){
    NLH.onReady();
  });

}
