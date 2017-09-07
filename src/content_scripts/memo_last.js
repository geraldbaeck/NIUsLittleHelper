$(document).ready(function() {

var counter = 0;

$("th:contains('Memo über')").each(function( index ) {

var tableObj = this;

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
counter++;
});

});