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
      this.onload = false;
      this.db = new PouchDB(POUCHDB_DB_NAME);
      this.url = window.location.href;
      // this.options = [{
      //   Name : "Experimental Addins",
      //   Description : "Sollen experimentelle Features aktiviert werden?",
      //   Type : Boolean
      // }];

      this.nlhoptions = {
          'nlh.experimental' : {
          category: "Allgemein",
          name: "Experimentelle Features",
          //id: 'nlh.experimental',
          description: 'Aktiviere experimentelle Erweiterungen',
          default: false,
          type: Boolean
        }, 'nlh.cache_active' : {
          category: "Allgemein.Cache",
          name: "Aktiviere Cache",
          default: true,
  //        id: 'nlh.cache_active',
          description: 'Aktiviere den Zwischenspeicherzeit, dieser speichert Anfragen an das NIU im Browser, damit werden Anfragen reduziert und das Tempo bei der 2. Anfrage beschleunigt',
          type: Boolean
        }, 'nlh.max_cache_time' : {
          category: "Allgemein.Cache",
          name: "Maximale Zwischenspeicherzeit in ganzen minuten",
          default: 60 * 24,
          // id: 'nlh.max_cache_time',
          description: 'Die maximale, Zeit die die Anfrage zwischengespeichert werden soll',
          type: "Integer"
        }, "nlh.delete_cache" : {
          category: "Allgemein.Cache",
          name: "Cache löschen",
          //id: "nlh.delete_cache",
          description: "Löscht den Cache",
          type: 'Button',
          callback: function() {
            console.log("lösche cache....");
            NLH.deleteCache();
          }
        }
      };

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
        //TODO: optionen laden....


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
      this.onload = true;
      this.isExperimentalActivated().then(function(experimental){
        for (let addin of NLH.activeAddins) {
          //TODO: vergleiche URL!
          if ((addin.experimental && experimental) || !addin.experimental) {
            console.debug("NLH.onReady() --> iterate over: " + NLH.activeAddins);
            addin.onReady();
            // for (let addin of this.activeAddins) {
            //   console.debug("NLH.onReady() --> calling onReady of addin: " + JSON.stringify(addin));
            //   try {
            //     addin.onReady();
            //   }catch (e) {  //fange eventuelle Fehler im addin ab...
            //     console.error("Error: " + e);
            //   }
            // }
          }
        }
      });
    }

    /*
      wird aufgerufen, wen event $(window).on("load", function() {})
    */
    onLoad() {
      this.isExperimentalActivated().then(function(experimental){
        for (let addin of NLH.activeAddins) {
          //TODO: vergleiche URL!
          if ((addin.experimental && experimental) || !addin.experimental) {
            console.debug("NLH.onLoad() --> calling onLoad of addin: " + JSON.stringify(addin));
            addin.onLoad();
            // }catch (e) {  //fange eventuelle Fehler im addin ab...
            //   console.error("Error: " + e);
            //   throw e;
            // }
          }
        }
      });
    }

    getDB() {
      //var db = new PouchDB(POUCHDB_DB_NAME);
      //window.PouchDB = PouchDB;
      return this.db;
    }

    isExperimentalActivated() {
      return this.loadOption('nlh.experimental');
    }

    isCacheActive() {
      return this.loadOption('nlh.cache_active');
    }

    loadOption(key) {
      if (key in this.options) {
        var def = this.options[key].default;

        return NLH.getDB().get(key).then(function(doc) {
          return doc.option;
        }).catch(function (err) {
          return def;
        });
      } else {
        throw "option not defined!";
      }
    }

    saveOption(key, value) {
      if (key in this.options) {
        NLH.getDB().get(key).catch(function(err){
          if (err.name === 'not_found') {
            return {
              _id: key,
              option: value
            };
          } else {
            //unbekanter fehler...
            throw err;
          }
        }).then(function (doc) {
          console.log("get successfull: " + JSON.stringify(doc));
          doc.option = value;
          return NLH.getDB().put(doc);
        }).catch( function(err) {
          console.log("error in saveOption: " + err);
          if (err.name === 'conflict') {

          } else {
            // return NLH.getDB().put({
            //   _id : key,
            //   option: value
            // });
          }

        });

      } else {
        throw "option not found!";
      }
    }

    deleteCache() {
      console.log("deleteCache --> start");
      NLH.getDB().allDocs({
        startkey: 'cache_',
        endkey: 'cache_\uffff'
      }).then(function (result) {
        console.debug("allDocs result: " + JSON.stringify(result));
        for (let r of result.rows) {
          console.debug("row: " + r);
          r.id;
          r.rev;
          NLH.getDB().remove({
              _id : r.id,
              _rev : r.value.rev
            }).then(function(result) {
              console.info("successfully deleted");
            }).catch(function(err) {
              console.log(err);
            });

        }
      }).catch(function(err) {
        console.log(err);
      });
    }

    get options() {
      var options = Object.assign({}, this.nlhoptions);
      for (let addinkey in this.addins) {
        if (this.addins[addinkey].options !== undefined) {
          options = Object.assign(options, this.addins[addinkey].options);
        }
      }

      return options;


    }//ende get options

    getFromCache(prefix, id, args, callback, classobject) {
      console.debug("NLH.getFromCache --> lade vom cache: " + prefix + id);
      var db = this.getDB();
      var key = "cache_" + prefix + id;

      //promise verkettet
      return this.isCacheActive()
        .then(function(cache) {
          console.debug("isCacheActive: " + cache);
          if (!cache) { return Promise.reject("cache ist ausgeschalten!"); }
        })
        .then(function() {
          return db.get(key);
        })
        .then(function(doc){
          return NLH.loadOption("nlh.max_cache_time").then(function(time) {
              return {doc: doc, max_cache_time: (time * 60 * 1000)}; //zeit von minuten auf millisekunden umrechnen!
          });
        })
        .then(function(dict){
          var doc = dict.doc;
          var max_cache_time = dict.max_cache_time;
          console.debug("NLH.getFromCache --> doc: " + JSON.stringify(doc));
          var now = new Date().getTime();
          if (now - doc.lastchange > max_cache_time) {
            console.debug("NLH.getFromCache --> fail weil cache ablauf!");
            return Promise.reject("maximale cache zeit " + max_cache_time + "ms abgelaufen!");
          }
          if (classobject === undefined) {
            //console.log("just as it is....");
            return doc.object;
          } else {
            //console.log("parse from json string...: " + doc.object);
            return classobject.fromJson(doc.object);
          }
        })
        .catch(function(reason) {  //promise rejected, jetzt lade von niu!
         console.debug("NLH.getFromCache --> fail: " + reason);
         return callback(args).then(function(object) {
           console.debug("NLH.getFromCache --> lade von niu: " + JSON.stringify(object));
           var save = object;
           if (classobject != undefined) {
             save = object.toJson();
           }
           isCacheActive().then(function(active) {
             active && NLH.saveToCache(prefix, id, save).then(function() {});
           });

           return object;
        });

         //return saveToCache(prefix, id, promise);
        });
    }

    saveToCache(prefix, id, object) {
      console.debug("NLH.saveToCache --> called");
      var db = this.getDB();

      var key = "cache_" +prefix + id;
      var dict = {};
      dict['object'] = object;
      dict['lastchange'] = new Date().getTime();
      dict['_id'] = key;

      return db.get(key)
      .catch(function(error) {
          if (error.name === 'not_found') {
              return dict;
          }
      })
      .then(function(olddoc) {
          if (olddoc.hasOwnProperty('_rev')) {
            dict['_rev'] = olddoc['_rev'];
          }

          return db.put(dict)
            .then(function() {
              console.debug("NLH.saveToCache --> erfolgreich gespeichert: " + JSON.stringify(dict));
              return object;
          }).catch(function(error) {
              console.debug("NLH.saveToCache --> fehler beim speichern in pouchdb!: " + dict + " error: " +  error);
              return object; //auch im fehlerfalle
          });
      })
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
      this.experimental = true;
    }

    onLoad() {
      //do nothgin...
    }

    onReady() {
      //do nothing...
    }

    onActivate() {
      //do nothing...
    }

    // get experimental() {
    //   return true;
    // }

    toString() {
      return "Addin: " + this.name;
    }

  };


  NLH.registerAddin(new class extends NLH.NiuHelperAddin {

    constructor() {
      super("nlh.options");
      this.urls = ["Header.aspx"];
      this.experimental = false;
    }


    onLoad() {
      let b = $('<span id="nlh_options_button">NLH Options</span>');
      $("#pageTitle").after(b);
      $("#nlh_options_button").button();

      //console.debug("parent frames: " + $(parent.frames));

      console.debug("showing options dialog");

      //lade $ von main frame -> vorsicht das geht nur wenn window.on("load") event, document.ready reicht nicht aus!
      var jqMain = top.frames['main'].$;
      //TODO: abbrechen, wenn dialog bereits geöffnet


      var createForm = function(id, opt) {
        var input = '<input class="nlh-option" type="text" id="nlh-option-' + id + '">'
        if (opt.type == "Button") {
          input = '<input type="submit" class="nlh-button" value="' + opt.name + '" id="nlh-option-'+ id + '">';
        } else if (opt.type == Boolean) {
          input = '<input class="nlh-option" type="checkbox" id="nlh-option-'+ id + '">';
        }
        return ['<p>',
        opt.name, ':<br>' ,
        input,
        '<span class="option-description">', opt.description,'</span></p>'
        ].join('');
      };

      var options = NLH.options;
      console.debug("NLH.options: " + JSON.stringify(options));
      var dialogString = "";
      for (let key in options) {
        dialogString = [dialogString, createForm(key, options[key])].join('');
      }

      console.debug("prepend: " + dialogString);

      jqMain('body').prepend(
        ['<div id="options-dialog">',
          '<p><input type="submit" value="Einstellungen speichern" id="nlh-option-save"></p>',
          dialogString,
          '</div>'
        ]
        .join(''));

      //setze alle buttons mit den jeweiligen callbacks
      jqMain('.nlh-button').each(function(index) {
        var key = $(this)[0].id;
        key = key.replace("nlh-option-", "");
        $(this).on("click", function() {
          options[key].callback();
        });
      });

      //setze daten der input fields aus der DB
      jqMain('.nlh-option').each(function(index) {
        //$(this).id;
        console.log("element is:" + $(this)[0].id);
        var elem = $(this);
        var key = $(this)[0].id;
        key = key.replace("nlh-option-", "");
        if (options[key] === undefined) {
          return;
        }
        //var load = {};
        //load[key] = options[key].default;
        var opt = options[key];
        NLH.loadOption(key).then(function(result) {
          console.debug("loaded from db with key: " + key + " result: " + result);
          //let elem = jqMain('#nlh-option-'+key);
          console.debug("element is: " + elem + " html: " + elem.html());
          if (opt.type === Boolean) {
            elem.prop('checked', result);
          } else {
            elem.val(result);
          }
        });

        options[key];

      });

      //TODO: handle save button...
      jqMain("#nlh-option-save").click(function() {
        console.debug("save button clicked!");
        jqMain('.nlh-option').each(function(index) {
          var elem = $(this);
          var key = $(this)[0].id;
          key = key.replace("nlh-option-", "");
          if (options[key] === undefined) {
            return;
          }
          var value;
          var opt = options[key];
          if (opt.type === Boolean) {
            value = elem.prop('checked');
          } else if (opt.type === "Integer") {
            value = parseInt(elem.val());
            if (isNaN(value)) {
              //TODO: warn user!
              return;
            }
          } else {
            value = elem.val();
          }
          NLH.saveOption(key, value);


        });



      });

      var dialog = jqMain('#options-dialog');
      dialog = dialog.dialog({
          autoOpen: false,
          modal: true
      });

      $("#nlh_options_button").click(function() {



        //öffne dialog...

        //console.debug("dialog ist: " + JSON.stringify(dialog.html()));

        dialog.dialog("open");
      });


      //$("#nlh_options_button").click(); //wenn debug einfach setze, dann wird dialog gleich geöffnet!

    }


  }());

  $(top).on("load", function() {
    console.log("window on load...");
    NLH.onLoad();
  })

  $(document).ready(function(){
    NLH.onReady();
  });

}





class CourseDetailExtensions extends NLH.NiuHelperAddin {

  constructor() {
    super("Kursdetails");
    this.options = {
      "course.kuerzel" : {
        category: "Kursdetails",
        name: "Kürzel setzen",
        id: "course.kuerzel",
        default: "",
        description: "Setzt das Kürzel unter Bemerkungen bei der Kursanmeldung",
        type: String
      }
    };
    this.experimental = false;
  }



  onReady() {
    var bemerkung = $("#ctl00_main_m_NewAssignment_m_Notice");

    NLH.loadOption("course.kuerzel").then(function(kuerzel) {
      console.log("getKuerzel then [" + kuerzel + "]");
      bemerkung.val(kuerzel);
    });

  }

}

NLH.registerAddin(new CourseDetailExtensions());
