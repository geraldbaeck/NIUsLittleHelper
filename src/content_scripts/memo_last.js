$(document).ready(function() {

var counter = 0;
var MemoAuthorsNames = [];

$("body > form").append("<br /><b>Memos f&uuml;r den ausgew&auml;hlten Zeitraum nach Autor filtern:</b> <select id='authorfilter'><option value='0'></option></select>");

$("th:contains('Memo über')").each(function( index ) {

var tableObj = this;

var MemoAuthorName = $(this).closest("tbody").children("tr:nth-child(2)").children("th:nth-child(1)").text().trim();

var MemoAuthorOption = new Option(MemoAuthorName, MemoAuthorName);
$(MemoAuthorOption).html(MemoAuthorName);

if(!MemoAuthorsNames.includes(MemoAuthorName)) { MemoAuthorsNames.push(MemoAuthorName); $("#authorfilter").append(MemoAuthorOption); };

$(tableObj).append(" <a id='mailButton" + counter + "'><img src=" + chrome.extension.getURL('/img/envelope.svg') + " width='12'></a>");
$(tableObj).append(" <a id='gearButton" + counter + "'><img src=" + chrome.extension.getURL('/img/gear.svg') + " width='12'></a>");

$("#gearButton" + counter).click(function() {

var buttonObj = this;

$(buttonObj).find("img").attr("src", chrome.extension.getURL('/img/ajax-loader.gif'));

const regex = /.*?\((.*?)\)/g;
var resultDNRs = regex.exec($(tableObj).text());
var resultDNr = resultDNRs[1].split(",")[0];

dnrToIdentifier(resultDNr).then(function(result) {
$(buttonObj).hide();
$(tableObj).append("<br /><div style='font-size:x-small;'><a target='_blank' href='https://niu.wrk.at/Kripo/Employee/summaryemployee.aspx?EmployeeId=" + result.EID + "'>Mitarbeiter</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/Employee/detailEmployee.aspx?EmployeeId=" + result.EID + "'>Details</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/Employee/ListAvailabilities.aspx?EmployeeNumberID=" + result.ENID + "'>Urlaub</a> | <a target='_blank' href='https://niu.wrk.at/df/fahrscheingeld/entschaedigung/entschaedigung.asp?DienstNr=" + resultDNr + "'>Fahrscheingeld</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/Employee/UniformList.aspx?EmployeeId=" + result.EID + "'>Uniform</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/Employee/IssuedKeys.aspx?EmployeeId=" + result.EID + "'>Schl&uuml;ssel</a> | <a target='_blank' href='https://niu.wrk.at/df/memo/memo_eingeben.asp?DienstNr=" + resultDNr + "'>Memo</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/Kufer/SearchCourse.aspx?EmployeeId=" + result.EID + "'>Ausbildung</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/Employee/LVStatistic.aspx?EmployeeId=" + result.EID + "'>LV Statistik</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/DutyRoster/EmployeeDutyStatistic.aspx?EmployeeNumberID=" + result.ENID + "'>Statistik</a> | <a target='_blank' href='https://niu.wrk.at/Kripo/Employee/Conan/ListDocuments.aspx?EmployeeId=" + result.EID + "'>Dokumente</a></div>");
});


});
$("#mailButton" + counter).click(function() {
var buttonObj = this;

$(buttonObj).find("img").attr("src", chrome.extension.getURL('/img/ajax-loader.gif'));

const regex = /.*?\((.*?)\)/g;
var resultDNRs = regex.exec($(tableObj).text());
var resultDNr = resultDNRs[1].split(",")[0];

dnrToIdentifier(resultDNr).then(function(result) {
console.log("dnrToIdentifier result: ENID = " + result.ENID + " / EID = " + result.EID);
return getEmployeeDataSheet(result.ENID) }).then( function(result) {
	window.open("mailto:" + result.Email);
	$(buttonObj).find("img").attr("src", chrome.extension.getURL('/img/envelope.svg'));
});
});
counter++;
});

var select = $('#authorfilter');
  select.html(select.find('option').sort(function(x, y) {
    return $(x).text() > $(y).text() ? 1 : -1;
  }))
  select.val(0);

$("#authorfilter").change(function ()
{
	var selVal = $(this).val();

if(selVal == "0")
	{
		$("body > table, body > table + br").show();
	}
else
	{
		$("body > table, body > table + br").css("display", "none");
		$("body > table:contains('" + selVal + "'), body > table:contains('" + selVal + "') + br").show();
	}

});

});