var department = {
  LV: 'Wiener Rotes Kreuz Zentrale - Nottendorfergasse 21, 1030 Wien',
  DDL:'Wiener Rotes Kreuz Bezirksstelle DDL - Nottendorfergasse 21, 1030 Wien',
  West:'Wiener Rotes Kreuz Bezirksstelle West - Spallartgasse 10a, 1140 Wien',
  Nord:'Wiener Rotes Kreuz Bezirksstelle Nord - Karl-Schäfer-Straße 8, 1210 Wien',
  KSS:'Wiener Rotes Kreuz Bezirksstelle Nord - Karl-Schäfer-Straße 8, 1210 Wien',
  VS:'Wiener Rotes Kreuz Bezirksstelle Van Swieten - Landgutgasse 8, 1100 Wien',
  BVS:'Wiener Rotes Kreuz Bezirksstelle Bertha von Suttner - Negerlegasse 8, 1020 Wien',
  RD:'Wiener Rotes Kreuz Zentrale - Nottendorfergasse 21, 1030 Wien'
};
var dienststellenKuerzel = {
  LV: 'Nodo',
  DDL:'DDL',
  West:'West',
  Nord:'Nord',
  KSS:'KSS',
  VS:'VS',
  BVS:'BvS',
  RD:'Nodo'
};
var dienstTypen = {
  RKS:'Rettungsstation Arsenal, Arsenalstraße 7, 1030 Wien',
  RKP:'Rettungsstation Penzing, Baumgartenstraße 7, 1140 Wien',
  'BT-SAN': ''
}
var mailImage = '<img style="vertical-align:middle;opacity:.65;" height="19" src="' + chrome.extension.getURL("/img/ic_mail_outline_black_24dp_2x.png") + '" />';
var whatsappImage = '<img style="vertical-align:middle;filter:grayscale(75%);margin-left:0.2em;" height="18" src="' + chrome.extension.getURL("/img/whatsapp-logo.png") + '" />';
var xlsxImage = '<img style="vertical-align:middle;opacity:.65;" height="19" src="' + chrome.extension.getURL("/img/xlsx_icon.png") + '" />';
var copyImage = '<img style="vertical-align:middle;opacity:.65;" height="19" src="' + chrome.extension.getURL("/img/copy-icon.png") + '" />';
var docImage = '<img style="vertical-align:middle;opacity:.65;" height="19" src="' + chrome.extension.getURL("/img/doc_icon.png") + '" />';
var helpImage = '<img style="vertical-align:middle;opacity:.65;" height="19" src="' + chrome.extension.getURL("/img/help.png") + '" />';

var dienstgrade = {
  RKJ1: 'RK-Jugend-1.Jahr',
  RKJ2: 'RK-Jugend-2.Jahr',
  RKJ3: 'RK-Jugend-3.Jahr',
  RKJ4: 'RK-Jugend-4.Jahr',
  PH: 'Probehelfer',
  H: 'Helfer',
  OH: 'Oberhelfer',
  HH: 'Haupthelfer',
  ZGF: 'Zugsführer',
  OZF: 'Oberzugsführer',
  HZF: 'Hauptzugsführer',
  SM: 'Sanitätsmeister',
  OSM: 'Obersanitätsmeister',
  HSM: 'Hauptsanitätsmeister',
  BK: 'Bereitschaftskommandant',
  AK: 'Abteilungskommandant',
  KK: 'Kolonnenkommandant',
  RR: 'Rettungsrat',
  ORR: 'Oberrettungsrat',
  LRR: 'Landesrettungsrat',
  BRR: 'Bundesrettungsrat',
  'BK-A': 'Bereitschaftskommandant-Arzt',
  'AK-A': 'Abteilungskommandant-Arzt',
  'KK-A': 'Kolonnenkommandant-Arzt',
  'RR-A': 'Rettungsrat-Arzt',
  'ORR-A': 'Oberrettungsrat-Arzt',
  'LRR-A': 'Landesrettungsrat-Arzt',
  'vPRÄS': 'Vizepräsident',
  'PRÄS': 'Präsident'
}