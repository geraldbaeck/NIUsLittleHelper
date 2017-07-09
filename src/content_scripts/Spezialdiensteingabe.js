$(document).ready(function() {
var d = new Date();
var today = new Date();
var dd = today.getDate();
var mm = today.getMonth()+1; 

var yyyy = today.getFullYear();
if(dd<10){
    dd='0'+dd;
} 
if(mm<10){
    mm='0'+mm;
} 
var today = dd+'.'+mm+'.'+yyyy;

$("input[name='Stundenbis']").val(d.getHours());
$("input[name='Minutenbis']").val((d.getMinutes()<10?'0':'') + d.getMinutes());
$("input[name='Datum']").val(today);
$("select[name='KennzifferID']>option[value='BEZF']").attr('selected', true);
$("input[name='ListeEingabe']").attr('checked', true);
});