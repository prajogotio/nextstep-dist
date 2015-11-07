var terrainAssets = {
	get : function(name) {
		terrainBuffer = document.createElement("canvas");
		this[name](terrainBuffer);
		return terrainBuffer;
	},
	"test_asset01" : function(terrainBuffer) {
		var width = 1000;
		var height = 600;
		terrainBuffer.width = width;
		terrainBuffer.height = height;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, width, height);
		g.fillStyle = "green";
		g.lineWidth = 5;
		g.save();
		g.translate(0, 100);
		g.beginPath();
		g.moveTo(238,410);
		g.lineTo(174,404);
		g.lineTo(112,370);
		g.lineTo(91,336);
		g.lineTo(86,285);
		g.lineTo(129,241);
		g.lineTo(168,227);
		g.lineTo(211,211);
		g.lineTo(237,200);
		g.lineTo(255,184);
		g.lineTo(270,153);
		g.lineTo(285,114);
		g.lineTo(295,79);
		g.lineTo(311,61);
		g.lineTo(338,50);
		g.lineTo(358,48);
		g.lineTo(377,57);
		g.lineTo(394,79);
		g.lineTo(411,104);
		g.lineTo(436,147);
		g.lineTo(456,180);
		g.lineTo(475,203);
		g.lineTo(514,226);
		g.lineTo(560,240);
		g.lineTo(594,242);
		g.lineTo(634,238);
		g.lineTo(653,229);
		g.lineTo(690,208);
		g.lineTo(715,187);
		g.lineTo(729,172);
		g.lineTo(764,148);
		g.lineTo(774,142);
		g.lineTo(790,138);
		g.lineTo(835,137);
		g.lineTo(892,145);
		g.lineTo(917,160);
		g.lineTo(949,185);
		g.lineTo(970,221);
		g.lineTo(985,253);
		g.lineTo(989,276);
		g.lineTo(978,316);
		g.lineTo(949,344);
		g.lineTo(917,369);
		g.lineTo(877,395);
		g.lineTo(811,416);
		g.lineTo(749,427);
		g.lineTo(665,435);
		g.lineTo(610,435);
		g.lineTo(530,428);
		g.lineTo(464,424);
		g.lineTo(401,414);
		g.lineTo(353,410);
		g.lineTo(297,404);
		g.closePath();
		g.fill();
		g.stroke();
		g.restore();
	},
	"test_asset02" : function(terrainBuffer) {
		var width = 1800;
		var height = 600;
		terrainBuffer.width = width;
		terrainBuffer.height = height;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, width, height);
		g.fillStyle = "green";
		g.lineWidth = 5;
		g.save();
		g.beginPath();
		g.moveTo(504,516);
		g.lineTo(444,519);
		g.lineTo(344,523);
		g.lineTo(271,515);
		g.lineTo(205,506);
		g.lineTo(150,482);
		g.lineTo(125,455);
		g.lineTo(104,424);
		g.lineTo(90,392);
		g.lineTo(79,337);
		g.lineTo(79,276);
		g.lineTo(79,237);
		g.lineTo(96,198);
		g.lineTo(134,175);
		g.lineTo(195,153);
		g.lineTo(232,150);
		g.lineTo(287,167);
		g.lineTo(328,201);
		g.lineTo(368,208);
		g.lineTo(409,221);
		g.lineTo(449,225);
		g.lineTo(511,237);
		g.lineTo(572,240);
		g.lineTo(607,242);
		g.lineTo(658,242);
		g.lineTo(696,229);
		g.lineTo(718,198);
		g.lineTo(752,185);
		g.lineTo(801,179);
		g.lineTo(834,190);
		g.lineTo(871,204);
		g.lineTo(901,227);
		g.lineTo(945,235);
		g.lineTo(981,233);
		g.lineTo(1033,233);
		g.lineTo(1074,208);
		g.lineTo(1075,176);
		g.lineTo(1080,139);
		g.lineTo(1120,121);
		g.lineTo(1179,121);
		g.lineTo(1236,138);
		g.lineTo(1263,167);
		g.lineTo(1290,191);
		g.lineTo(1320,224);
		g.lineTo(1343,270);
		g.lineTo(1326,326);
		g.lineTo(1295,358);
		g.lineTo(1263,364);
		g.lineTo(1201,384);
		g.lineTo(1145,388);
		g.lineTo(1073,408);
		g.lineTo(997,426);
		g.lineTo(939,442);
		g.lineTo(882,456);
		g.lineTo(854,402);
		g.lineTo(843,370);
		g.lineTo(816,340);
		g.lineTo(785,306);
		g.lineTo(745,275);
		g.lineTo(704,290);
		g.lineTo(689,330);
		g.lineTo(675,385);
		g.lineTo(661,425);
		g.lineTo(633,452);
		g.lineTo(591,480);
		g.lineTo(556,494);
		g.closePath();
		g.fill();
		g.stroke();
		g.restore();
	},
	"test_asset03" : function(terrainBuffer) {
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(200,475);
		g.lineTo(131,418);
		g.lineTo(100,353);
		g.lineTo(93,277);
		g.lineTo(122,192);
		g.lineTo(221,161);
		g.lineTo(308,170);
		g.lineTo(386,201);
		g.lineTo(443,221);
		g.lineTo(519,248);
		g.lineTo(583,260);
		g.lineTo(657,265);
		g.lineTo(724,267);
		g.lineTo(785,267);
		g.lineTo(845,264);
		g.lineTo(891,246);
		g.lineTo(944,211);
		g.lineTo(999,183);
		g.lineTo(1043,169);
		g.lineTo(1094,169);
		g.lineTo(1218,209);
		g.lineTo(1256,220);
		g.lineTo(1294,232);
		g.lineTo(1341,248);
		g.lineTo(1390,249);
		g.lineTo(1448,242);
		g.lineTo(1516,203);
		g.lineTo(1583,148);
		g.lineTo(1615,131);
		g.lineTo(1643,121);
		g.lineTo(1682,115);
		g.lineTo(1720,117);
		g.lineTo(1755,125);
		g.lineTo(1792,135);
		g.lineTo(1828,161);
		g.lineTo(1864,195);
		g.lineTo(1890,243);
		g.lineTo(1909,302);
		g.lineTo(1893,364);
		g.lineTo(1845,434);
		g.lineTo(1633,508);
		g.lineTo(1477,512);
		g.lineTo(1278,471);
		g.lineTo(1123,409);
		g.lineTo(1030,381);
		g.lineTo(864,391);
		g.lineTo(744,416);
		g.lineTo(662,436);
		g.lineTo(584,447);
		g.lineTo(505,437);
		g.lineTo(452,413);
		g.lineTo(351,397);
		g.lineTo(292,409);
		g.lineTo(246,458);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"test_asset04" : function(terrainBuffer) {
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(259,484);
		g.lineTo(187,459);
		g.lineTo(158,425);
		g.lineTo(130,378);
		g.lineTo(125,328);
		g.lineTo(149,281);
		g.lineTo(193,275);
		g.lineTo(237,285);
		g.lineTo(291,300);
		g.lineTo(347,298);
		g.lineTo(388,273);
		g.lineTo(419,241);
		g.lineTo(464,212);
		g.lineTo(509,216);
		g.lineTo(529,251);
		g.lineTo(524,292);
		g.lineTo(503,338);
		g.lineTo(458,389);
		g.lineTo(413,440);
		g.lineTo(356,471);
		g.lineTo(311,477);
		g.closePath();
		g.fill();
		g.moveTo(742,530);
		g.lineTo(687,485);
		g.lineTo(665,447);
		g.lineTo(655,410);
		g.lineTo(657,366);
		g.lineTo(676,314);
		g.lineTo(729,279);
		g.lineTo(787,286);
		g.lineTo(831,328);
		g.lineTo(861,369);
		g.lineTo(912,405);
		g.lineTo(981,415);
		g.lineTo(1068,409);
		g.lineTo(1113,437);
		g.lineTo(1121,498);
		g.lineTo(1077,529);
		g.lineTo(1014,562);
		g.lineTo(928,568);
		g.lineTo(860,565);
		g.lineTo(815,555);
		g.closePath();
		g.fill();
		g.moveTo(1293,391);
		g.lineTo(1335,373);
		g.lineTo(1385,339);
		g.lineTo(1427,302);
		g.lineTo(1460,272);
		g.lineTo(1526,261);
		g.lineTo(1591,272);
		g.lineTo(1636,290);
		g.lineTo(1689,304);
		g.lineTo(1722,302);
		g.lineTo(1765,293);
		g.lineTo(1816,297);
		g.lineTo(1843,341);
		g.lineTo(1844,393);
		g.lineTo(1796,437);
		g.lineTo(1740,475);
		g.lineTo(1684,499);
		g.lineTo(1610,500);
		g.lineTo(1531,501);
		g.lineTo(1464,494);
		g.lineTo(1390,497);
		g.lineTo(1351,518);
		g.lineTo(1293,523);
		g.lineTo(1267,493);
		g.lineTo(1247,455);
		g.lineTo(1237,420);
		g.lineTo(1255,389);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"lindbulm" : function(terrainBuffer) {
		state.backgroundColor = "#FBF9FF";
		state.terrainBitsName = "green_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(95,454);
		g.lineTo(28,410);
		g.lineTo(4,288);
		g.lineTo(18,218);
		g.lineTo(31,174);
		g.lineTo(56,157);
		g.lineTo(85,130);
		g.lineTo(145,117);
		g.lineTo(215,85);
		g.lineTo(259,40);
		g.lineTo(295,18);
		g.lineTo(362,6);
		g.lineTo(434,1);
		g.lineTo(485,11);
		g.lineTo(540,35);
		g.lineTo(576,59);
		g.lineTo(622,69);
		g.lineTo(685,70);
		g.lineTo(756,51);
		g.lineTo(820,32);
		g.lineTo(868,11);
		g.lineTo(947,9);
		g.lineTo(1018,32);
		g.lineTo(1192,48);
		g.lineTo(1240,38);
		g.lineTo(1286,28);
		g.lineTo(1329,12);
		g.lineTo(1401,7);
		g.lineTo(1538,33);
		g.lineTo(1594,54);
		g.lineTo(1655,64);
		g.lineTo(1720,48);
		g.lineTo(1769,20);
		g.lineTo(1845,15);
		g.lineTo(1909,19);
		g.lineTo(1953,59);
		g.lineTo(1985,91);
		g.lineTo(1981,148);
		g.lineTo(1982,216);
		g.lineTo(1928,287);
		g.lineTo(1901,338);
		g.lineTo(1883,426);
		g.lineTo(1874,517);
		g.lineTo(1856,581);
		g.lineTo(1698,587);
		g.lineTo(1596,582);
		g.lineTo(1549,548);
		g.lineTo(1469,526);
		g.lineTo(1367,532);
		g.lineTo(1273,544);
		g.lineTo(1030,552);
		g.lineTo(965,539);
		g.lineTo(896,493);
		g.lineTo(775,473);
		g.lineTo(579,416);
		g.lineTo(425,426);
		g.lineTo(347,450);
		g.lineTo(275,487);
		g.lineTo(171,479);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"hearow": function(terrainBuffer) {
		// background: FFA230
		state.backgroundColor = "#FFA230";
		state.terrainBitsName = "hot_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "#EB3725";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(370,358);
		g.lineTo(260,354);
		g.lineTo(185,395);
		g.lineTo(140,474);
		g.lineTo(38,449);
		g.lineTo(21,388);
		g.lineTo(20,328);
		g.lineTo(43,248);
		g.lineTo(81,206);
		g.lineTo(157,162);
		g.lineTo(233,156);
		g.lineTo(327,156);
		g.lineTo(388,163);
		g.lineTo(428,115);
		g.lineTo(452,64);
		g.lineTo(511,12);
		g.lineTo(576,18);
		g.lineTo(617,53);
		g.lineTo(657,90);
		g.lineTo(703,153);
		g.lineTo(704,242);
		g.lineTo(660,294);
		g.lineTo(548,336);
		g.lineTo(454,353);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(588,439);
		g.lineTo(659,442);
		g.lineTo(735,432);
		g.lineTo(798,390);
		g.lineTo(834,337);
		g.lineTo(882,303);
		g.lineTo(977,253);
		g.lineTo(1058,244);
		g.lineTo(1156,253);
		g.lineTo(1229,280);
		g.lineTo(1275,326);
		g.lineTo(1329,361);
		g.lineTo(1381,376);
		g.lineTo(1439,380);
		g.lineTo(1477,457);
		g.lineTo(1477,518);
		g.lineTo(1368,556);
		g.lineTo(1271,576);
		g.lineTo(1151,583);
		g.lineTo(1045,551);
		g.lineTo(971,570);
		g.lineTo(915,577);
		g.lineTo(817,562);
		g.lineTo(715,563);
		g.lineTo(621,575);
		g.lineTo(571,526);
		g.lineTo(550,473);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1458,208);
		g.lineTo(1343,195);
		g.lineTo(1297,151);
		g.lineTo(1274,98);
		g.lineTo(1313,52);
		g.lineTo(1369,31);
		g.lineTo(1466,15);
		g.lineTo(1578,17);
		g.lineTo(1655,40);
		g.lineTo(1702,78);
		g.lineTo(1781,100);
		g.lineTo(1853,101);
		g.lineTo(1907,111);
		g.lineTo(1949,133);
		g.lineTo(1992,189);
		g.lineTo(1991,256);
		g.lineTo(1974,331);
		g.lineTo(1923,369);
		g.lineTo(1815,386);
		g.lineTo(1748,314);
		g.lineTo(1655,290);
		g.lineTo(1583,268);
		g.lineTo(1525,246);
		g.closePath();
		g.fill();
		g.stroke();
	},
	"herbestus" : function(terrainBuffer) {
		state.backgroundColor = "#F5FFFF";
		state.terrainBitsName = "snowy_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "#E8FFEE";
		g.lineWidth = "5";
		g.beginPath();
		g.moveTo(85,502);
		g.lineTo(58,478);
		g.lineTo(33,437);
		g.lineTo(25,402);
		g.lineTo(13,345);
		g.lineTo(2,297);
		g.lineTo(3,226);
		g.lineTo(0,136);
		g.lineTo(0,54);
		g.lineTo(17,20);
		g.lineTo(63,4);
		g.lineTo(136,2);
		g.lineTo(175,22);
		g.lineTo(216,48);
		g.lineTo(268,84);
		g.lineTo(307,122);
		g.lineTo(366,158);
		g.lineTo(412,181);
		g.lineTo(470,202);
		g.lineTo(535,214);
		g.lineTo(592,221);
		g.lineTo(648,237);
		g.lineTo(720,252);
		g.lineTo(785,261);
		g.lineTo(851,274);
		g.lineTo(937,290);
		g.lineTo(1003,296);
		g.lineTo(1068,299);
		g.lineTo(1131,296);
		g.lineTo(1185,288);
		g.lineTo(1252,275);
		g.lineTo(1306,264);
		g.lineTo(1365,257);
		g.lineTo(1420,237);
		g.lineTo(1474,228);
		g.lineTo(1559,199);
		g.lineTo(1633,182);
		g.lineTo(1690,160);
		g.lineTo(1754,136);
		g.lineTo(1795,111);
		g.lineTo(1835,64);
		g.lineTo(1868,36);
		g.lineTo(1910,25);
		g.lineTo(1948,33);
		g.lineTo(1972,59);
		g.lineTo(1986,92);
		g.lineTo(1995,133);
		g.lineTo(1980,205);
		g.lineTo(1956,271);
		g.lineTo(1892,331);
		g.lineTo(1832,389);
		g.lineTo(1765,424);
		g.lineTo(1672,459);
		g.lineTo(1579,481);
		g.lineTo(1491,497);
		g.lineTo(1413,504);
		g.lineTo(1347,516);
		g.lineTo(1246,521);
		g.lineTo(1151,530);
		g.lineTo(1038,534);
		g.lineTo(967,537);
		g.lineTo(901,521);
		g.lineTo(815,520);
		g.lineTo(717,519);
		g.lineTo(618,519);
		g.lineTo(519,523);
		g.lineTo(467,502);
		g.lineTo(415,436);
		g.lineTo(366,380);
		g.lineTo(305,344);
		g.lineTo(260,353);
		g.lineTo(233,367);
		g.lineTo(194,418);
		g.lineTo(170,454);
		g.lineTo(125,481);
		g.closePath();
		g.fill();
		g.stroke();
	},
	'crepes':function(terrainBuffer) {
		state.backgroundColor = "#FBF9FF";
		state.terrainBitsName = "green_terrain_bits";
		terrainBuffer.width = 2000;
		terrainBuffer.height = 600;
		var g = terrainBuffer.getContext("2d");
		g.clearRect(0, 0, 2000, 600);
		g.fillStyle = "green";
		g.lineWidth = "5";
		g.beginPath();

		g.moveTo(41,70);
		g.lineTo(121,65);
		g.lineTo(204,50);
		g.lineTo(284,59);
		g.lineTo(351,68);
		g.lineTo(410,68);
		g.lineTo(473,68);
		g.lineTo(488,98);
		g.lineTo(462,133);
		g.lineTo(392,139);
		g.lineTo(314,140);
		g.lineTo(248,146);
		g.lineTo(179,154);
		g.lineTo(77,139);
		g.lineTo(36,126);
		g.lineTo(13,99);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(361,236);
		g.lineTo(404,218);
		g.lineTo(455,206);
		g.lineTo(530,204);
		g.lineTo(598,204);
		g.lineTo(647,201);
		g.lineTo(709,201);
		g.lineTo(764,212);
		g.lineTo(816,223);
		g.lineTo(821,275);
		g.lineTo(765,300);
		g.lineTo(688,306);
		g.lineTo(630,302);
		g.lineTo(556,302);
		g.lineTo(469,315);
		g.lineTo(404,279);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(781,133);
		g.lineTo(855,116);
		g.lineTo(899,106);
		g.lineTo(966,99);
		g.lineTo(1018,97);
		g.lineTo(1076,108);
		g.lineTo(1128,110);
		g.lineTo(1184,116);
		g.lineTo(1197,143);
		g.lineTo(1167,167);
		g.lineTo(1099,186);
		g.lineTo(1044,186);
		g.lineTo(965,177);
		g.lineTo(895,178);
		g.lineTo(822,178);
		g.lineTo(778,184);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(723,196);
		g.lineTo(756,170);
		g.lineTo(790,162);
		g.lineTo(822,165);
		g.lineTo(811,215);
		g.lineTo(756,238);
		g.lineTo(699,232);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1137,240);
		g.lineTo(1183,210);
		g.lineTo(1245,180);
		g.lineTo(1304,180);
		g.lineTo(1381,181);
		g.lineTo(1437,181);
		g.lineTo(1512,185);
		g.lineTo(1565,206);
		g.lineTo(1591,250);
		g.lineTo(1560,259);
		g.lineTo(1496,264);
		g.lineTo(1458,243);
		g.lineTo(1390,249);
		g.lineTo(1323,256);
		g.lineTo(1251,241);
		g.lineTo(1200,251);
		g.lineTo(1159,274);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1546,135);
		g.lineTo(1570,117);
		g.lineTo(1631,94);
		g.lineTo(1713,82);
		g.lineTo(1796,81);
		g.lineTo(1851,81);
		g.lineTo(1896,89);
		g.lineTo(1942,99);
		g.lineTo(1963,124);
		g.lineTo(1959,164);
		g.lineTo(1920,170);
		g.lineTo(1873,157);
		g.lineTo(1815,157);
		g.lineTo(1787,154);
		g.lineTo(1741,159);
		g.lineTo(1679,165);
		g.lineTo(1618,167);
		g.lineTo(1559,165);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1493,376);
		g.lineTo(1541,365);
		g.lineTo(1587,352);
		g.lineTo(1652,350);
		g.lineTo(1698,356);
		g.lineTo(1766,361);
		g.lineTo(1820,375);
		g.lineTo(1816,416);
		g.lineTo(1774,434);
		g.lineTo(1721,423);
		g.lineTo(1635,423);
		g.lineTo(1584,430);
		g.lineTo(1519,429);
		g.lineTo(1456,418);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(843,415);
		g.lineTo(886,395);
		g.lineTo(927,385);
		g.lineTo(980,377);
		g.lineTo(1052,371);
		g.lineTo(1103,378);
		g.lineTo(1146,397);
		g.lineTo(1165,429);
		g.lineTo(1150,450);
		g.lineTo(1097,462);
		g.lineTo(1044,460);
		g.lineTo(984,455);
		g.lineTo(900,454);
		g.lineTo(838,444);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(38,463);
		g.lineTo(72,438);
		g.lineTo(114,431);
		g.lineTo(185,428);
		g.lineTo(255,428);
		g.lineTo(317,430);
		g.lineTo(365,447);
		g.lineTo(385,474);
		g.lineTo(364,495);
		g.lineTo(286,506);
		g.lineTo(221,506);
		g.lineTo(148,506);
		g.lineTo(106,501);
		g.lineTo(52,504);
		g.closePath();
		g.fill();
		g.stroke();

		g.beginPath();
		g.moveTo(1028,164);
		g.lineTo(898,198);
		g.lineTo(800,204);
		g.lineTo(726,175);
		g.lineTo(750,106);
		g.lineTo(892,68);
		g.lineTo(1052,58);
		g.lineTo(1153,61);
		g.lineTo(1205,85);
		g.lineTo(1229,131);
		g.lineTo(1151,169);
		g.lineTo(1102,156);
		g.closePath();
		g.fill();
		g.stroke();
	}
}