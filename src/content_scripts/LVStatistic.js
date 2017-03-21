$(document).ready(function() {

    console.log('LV Dienststatistik');

    var dienstAggregate = {};
    dienstAggregate['KTW'] = new RegExp('KTW|Tag |Nacht ');
    dienstAggregate['RTW'] = new RegExp('RKL|RKS|RKP');
    var dienstSum = {};



    var ztable = $("<table class='standard'> <tr> <th>Dienstart</th><th>Funktion</th><th>Anz.Dienst</th><th>Dauer</th><th>Ausfahrten</th><th>Nachtausfahrt</th><th>Blaulicht</th></tr></table>");
    $("h3:contains('Dienste nach Dienstart und Funktion:')")
        .before("<h3>Gruppiert nach Funktion und Dienstart:</h3>")
        .before(ztable);



    var table = $("h3:contains('Dienste nach Dienstart und Funktion:') + table");

    table.find("tr:eq(0)").append("<th>Gruppiert zu</th>");
    table.find("tr:eq(0) ~ tr").append("<td class='gruppiertzu'></td>");

    var cols = table.find("tr");
    //console.log(cols);
    //$("h3:contains('Alle Dienste')")
    cols.each(function(index) {
        console.log("index" + index + " elem" + $(this).text() + " tdinhalt " + $(this).find("td:eq(0)").text());
        for (var k in dienstAggregate) {
            //if (!k in dienstSum) {
            //    dienstSum[k] = new Object();
            //}
            var funktionDienstSum = dienstSum[k];
            if (typeof(funktionDienstSum) == 'undefined') {
                console.log("undefined");
                funktionDienstSum = {};
            }
            console.log("funktionDienstSum: " + funktionDienstSum);

            if ($(this).find("td:eq(0)").text().match(dienstAggregate[k])) {
                var gruppiertzu = $(this).find(".gruppiertzu");
                if (gruppiertzu.text().length > 0) {
                    gruppiertzu.append("," + k);
                } else {
                    gruppiertzu.append(k);
                }
                var funktion = $(this).find("td:eq(1)").text();
                console.log("funktion ist: <" + funktion + ">");
                if (funktion == " ") {
                    console.log("funktion ist leer");
                    funktion = "keine";
                }
                var anz = parseInt($(this).find("td:eq(2)").text());
                var dauer = $(this).find("td:eq(3)").text();
                var dauersplit = dauer.split(" ");

                console.log("dauer " + dauer);

                dauer = parseInt(dauersplit[0]) * 60;
                dauer = dauer + parseInt(dauersplit[3]);
                //console.log("dauermin " + dauer


                console.log("dauer " + dauer);

                var ausfahrten = parseInt($(this).find("td:eq(4)").text());
                var nacht = parseInt($(this).find("td:eq(5)").text());
                var blau = parseInt($(this).find("td:eq(6)").text());

                if (funktion in funktionDienstSum) {
                    funktionDienstSum[funktion]['anz'] = funktionDienstSum[funktion]['anz'] + anz;
                    console.log("addiere ausfahrten: funktion " + funktion + " rechnung " + funktionDienstSum[funktion]['ausfahrten'] + "+" + ausfahrten);
                    funktionDienstSum[funktion]['ausfahrten'] = funktionDienstSum[funktion]['ausfahrten'] + ausfahrten;
                    funktionDienstSum[funktion]['nacht'] = funktionDienstSum[funktion]['nacht'] + nacht;
                    funktionDienstSum[funktion]['blau'] = funktionDienstSum[funktion]['blau'] + blau;
                    funktionDienstSum[funktion]['dauer'] = funktionDienstSum[funktion]['dauer'] + dauer;


                } else {
                    funktionDienstSum[funktion] = {};
                    funktionDienstSum[funktion]['anz'] = anz;
                    funktionDienstSum[funktion]['ausfahrten'] = ausfahrten;
                    funktionDienstSum[funktion]['nacht'] = nacht;
                    funktionDienstSum[funktion]['blau'] = blau;
                    funktionDienstSum[funktion]['dauer'] = dauer;


                    var row = $("<tr id='id_" + k + "_" + funktion + "'></tr>");
                    row.append("<td class='gruppe'>" + k + "</td>");
                    row.append("<td class='funktion'>" + funktion + "</td>");
                    row.append("<td class='anz'>" + 0 + "</td>");
                    row.append("<td class='dauer'>" + 0 + "</td>");
                    row.append("<td class='ausfahrten'>" + 0 + "</td>");
                    row.append("<td class='nacht'>" + 0 + "</td>");
                    row.append("<td class='blau'>" + 0 + "</td>");
                    ztable.append(row);
                }
                var row = ztable.find("#id_" + k + "_" + funktion);
                row.find(".anz").text(funktionDienstSum[funktion]['anz']);
                row.find(".ausfahrten").text(funktionDienstSum[funktion]['ausfahrten']);
                row.find(".nacht").text(funktionDienstSum[funktion]['nacht']);
                row.find(".blau").text(funktionDienstSum[funktion]['blau']);
                row.find(".dauer").text(Math.floor(funktionDienstSum[funktion]['dauer'] / 60) + " h " + funktionDienstSum[funktion]['dauer'] % 60 + " Min");



                console.log("match");
            }
            dienstSum[k] = funktionDienstSum;
        }
    });

});
