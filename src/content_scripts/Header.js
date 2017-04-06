

class Test1 extends NLH.NiuHelperAddin {

  constructor(name) {
    super(name);
    this.urls = ["Header.aspx"];
    this.options = {
      "addin1.fun_button" : {
        category: "Test.Button",
        name: "Hallo welt",
        //id: "nlh.delete_cache",
        description: "",
        type: 'Button',
        callback: function() {
          console.log("Hallo WELT!");
          alert("nerv.....!");
        }
      }
    };
  }

  onReady() {

      $("#pageTitle").after('<b><a target="_blank" style="color:white;border-bottom: 1px white dotted; text-decoration: none;" ">nlh test1 aktiv</a></b>');
  }

}

var Test3 = new NLH.NiuHelperAddin("Test3");
Test3["requires"] = ["hallowelt"];
Test3.onReady = function() {};


NLH.registerAddin(Test3);

NLH.registerAddin( new Test1("Test1"));

NLH.registerAddin( new NLH.NiuHelperAddin("Test2"));

NLH.registerAddin( new NLH.NiuHelperAddin("hallowelt"));






$(document).ready(function() {

$("#pageTitle").after('<b><a target="_blank" style="color:white;border-bottom: 1px white dotted; text-decoration: none;" href="https://github.com/geraldbaeck/NIUsLittleHelper#readme">NIU\'s little helper ist derzeit aktiv.</a></b>');

});
