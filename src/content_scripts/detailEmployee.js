$(document).ready(function() {
  console.log("detailEmployee content script called");
  var dekretAlarm = [];
  $("#ctl00_main_m_Employee_m_ccPromotionDecorations_m_tblPromotionDecorationsMain span[id$='_m_DescriptionLabel']:contains('nicht ausgefolgt')").each(function() {
    var dekretName = $(this).parent().parent().parent().parent().find("td").first().text();
    var dekretDatum = $(this).parent().parent().parent().parent().find("input").first().val();
    var dekretDurch = $(this).parent().parent().parent().parent().find("td").eq(3).text();
    dekretAlarm.push(dekretName + " vom " + dekretDatum + " durch " + dekretDurch);
  });
  console.log(dekretAlarm);
});
