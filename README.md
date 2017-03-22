# NIU's little helper

Chrome Erweiterung zur einfacheren Bedienung des internen Verwaltungssystems des Wiener Roten Kreuz ([NIU](https://niu.wrk.at/)).

Derzeit werden folgende Funktionen unterstützt:

### Erweiterte Filter für den Dienstplan
![Erweiterte Filter für den Dienstplan](screenshots/dienstplan.png)

### Erweiterte Filter für offene Positionen (Ambulanzen & KHD)
![Erweiterte Filter für offene Positionen](screenshots/offene_positionen.png)

### Zusätzliche Daten zur Dienststatistik (Statistik, EmployeeDutyStatistic.aspx)
![Zusätzliche Daten zur Dienststatistik](screenshots/mitarbeiterbezogene_dienststatistik.png)

### Zusätzliche Daten zur LV-Statistik (LVStatistik, LVStatistic.aspx)
Eine zusätzliche Tabelle gruppiert die Anzahl der Dienste und Ausfahrten nach der
Dienstart (KTW, RTW) und der Position (Fahrer, SAN1, SAN2). Damit ist es leichter möglich die
benötigten Mindestausfahrten für Ausbildungen zu prüfen. Allerdings wird diese Statistik nur
quartalsweise abgeschlossen!

### Kurssuche

* Bei der Kurssuche wird für das Suchergebnis eine Volltextsuche in der Tabelle mit den gefundenen Kursen ermöglicht.

### Kursdetails

* Es wird die zuletzt verwendete Kostenstelle gespeichert
* Es wird automatisch ein Kürzel eingetragen, das über die Optionen des Browser Plugins gesetzt werden kann
* Das Drop-Down select Menü unterstützt jetzt eine Volltextsuche nach den Mitarbeiternamen bzw. der Dienstnummer

### Download von Kontaktdaten als VCF file
![VCF Download](screenshots/vcf_download.png)

## Getting Started

Diese Anleitung ermöglicht Dir, die Erweiterung direkt in Google Chrome zu testen, bevor sie im [Google Store](https://chrome.google.com/webstore/detail/nius-litte-helper/fdldehahkijcfpmjhgnkggopliakcknj?hl=de) erscheint. Der empfohlene Weg ist, die Extension über den [Google Store](https://chrome.google.com/webstore/detail/nius-litte-helper/fdldehahkijcfpmjhgnkggopliakcknj?hl=de) zu installieren.

### Prerequisites

[Google Chrome Browser](https://www.google.com/chrome/browser/desktop/)

### Installing

1. [Gepackte Extension herunterladen](https://github.com/geraldbaeck/NIUsLittleHelper/archive/master.zip)
2. Zip file in beliebiges Verzeichnis entpacken
3. Gehe zu [chrome://extensions/](chrome://extensions/) und Developer mode oben rechts einschalten.
4. Klick auf den Load unpacked extension button und wähle das vorher entpackte Verzeichnis aus.

![Extension Setup im Developer Mode](screenshots/extension_setup.png)

## Version History

+ *0.1* initial commit
+ *0.2* VCF Download
+ *0.21* Kurzdienstselector wird nur mehr angezeigt, wenn es Kurzdienste gibt
+ *0.22* Die Kontakttabelle der Dienstführung wird jetzt standardmäßig ausgeblendet
+ *0.30* [NIU+ Features](#zusätzliche-daten-zur-lv-statistik-lvstatistik-lvstatisticaspx) eingebaut
+ *0.31* Zusätzliche Filter für geplante Dienste, Seite aufgeräumt

## Built With

* [Atom](https://github.com/atom/atom) - Code Editor
* [Javascript](https://en.wikipedia.org/wiki/JavaScript) - I love you, but I hate you too
* [JQuery](https://jquery.com/) - I most definitely hate you

## Contributing

Always welcome just fork and commit.

## Authors

* **Gerald Bäck** - *Coinomentum* - [github](https://github.com/geraldbaeck) - [blog](http://dev.baeck.at/)

## License

This is free and unencumbered software released into the public domain - see the [UNLICENSE.md](UNLICENSE.md) file for details. NIU is probably intellectual property of the Austrian Red Cross, but that's not relevant at all.
