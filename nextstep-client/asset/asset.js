var gameAsset = (function() {
	var asset = {};

	asset.buffer = document.createElement("canvas");
	asset.buffer.width = 1000;
	asset.buffer.height = 1000;

	var g = asset.buffer.getContext("2d");
	g.clearRect(0, 0, asset.buffer.width, asset.buffer.height);

	// main getter function
	asset.renderAsset = function(name, g) {
		g.drawImage(asset.buffer, asset[name].offsetX, asset[name].offsetY, asset[name].width, asset[name].height,
					-asset[name].width/2, -asset[name].height/2, asset[name].width, asset[name].height);
	}

	// wind compass
	asset["wind_compass"] = {
		offsetX : 0,
		offsetY : 0,
		width : 100,
		height : 100,
	}

	// draw wind compass
	g.save();
	g.translate(asset["wind_compass"].offsetX, asset["wind_compass"].offsetY);
	g.fillStyle = "rgba(0,0,0,0.5)";
	g.lineWidth = 5;
	g.beginPath();
	g.arc(asset["wind_compass"].width/2, asset["wind_compass"].width/2, asset["wind_compass"].width/2-5, 0, 2*Math.PI);
	g.fill();
	g.stroke();
	g.beginPath();
	g.fillStyle = "rgba(22, 170, 131, 0.8)";
	g.moveTo(asset["wind_compass"].width/2, asset["wind_compass"].width/2 + 20);
	g.lineTo(asset["wind_compass"].width/2 - 20, asset["wind_compass"].width/2 + 30);
	g.lineTo(asset["wind_compass"].width/2, asset["wind_compass"].width/2 - 30);
	g.lineTo(asset["wind_compass"].width/2 + 20, asset["wind_compass"].width/2 + 30);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();



	// green terrain bits
	asset["green_terrain_bits"] = {
		offsetX : 100,
		offsetY : 0,
		width : 40,
		height : 40,
	}
	g.save();
	g.fillStyle = "green";
	g.lineWidth = 3;
	g.translate(100, 0);
	g.beginPath();
	g.moveTo(13,9);
	g.lineTo(7,17);
	g.lineTo(5,26);
	g.lineTo(12,32);
	g.lineTo(20,32);
	g.lineTo(26,36);
	g.lineTo(33,31);
	g.lineTo(32,19);
	g.lineTo(33,9);
	g.lineTo(24,8);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();


	// degree circle
	asset["degree_circle"] = {
		offsetX : 0,
		offsetY : 100,
		width : 30,
		height : 30,
	}
	g.save();
	g.translate(0, 100);
	g.font = "bold 20px Arial";
	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.lineWidth = 1;
	g.fillText("o", 10, 15);
	g.strokeText("o", 10, 15);
	g.restore();

	// angle protractor
	asset["angle_protractor"] = {
		offsetX : 30,
		offsetY : 100,
		width : 100,
		height : 100,
	}
	g.save();
	g.translate(30, 100);

	g.fillStyle = "rgba(240, 240, 0, 0.3)";
	g.beginPath();
	g.moveTo(0,100);
	//g.lineTo(80,100);
	g.arc(0, 100, 80, 0, Math.PI/2, true);
	//g.lineTo(0,80);
	g.closePath();
	g.fill();

	

	g.beginPath();
	g.fillStyle = "rgba(0,0,0,0.5)";
	g.strokeStyle = "rgba(0,0,0,0.5)";
	g.lineWidth = 2;
	g.arc(0, 100, 80, 0, Math.PI/2, true);
	g.stroke();
	g.fillRect(0, 20, 2, 30);
	g.fillRect(50, 98, 30, 2);

	g.restore();


	// DUAL
	asset["dual"] = {
		offsetX : 160,
		offsetY : 100,
		width : 200,
		height : 60,
	}
	g.save();
	g.translate(160, 100);

	g.beginPath();
	g.moveTo(30, 0);
	g.lineTo(170, 0);
	g.lineTo(200, 20);
	g.lineTo(200, 40);
	g.lineTo(170, 60);
	g.lineTo(30, 60);
	g.lineTo(0, 40);
	g.lineTo(0, 20);
	g.closePath();
	g.globalAlpha = 0.6;
	g.fillStyle = "#FC7C69";
	g.fill();
	g.lineWidth = 6;
	g.strokeStyle = "#FF2814";
	g.stroke();
	g.globalAlpha = 1;

	g.save();
	g.restore();

	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.font = "bold 35px Arial";
	g.fillText("Dual", 55, 30);
	g.lineWidth = 2;
	g.strokeText("Dual", 55, 30);
	g.font = "bold 55px Arial";
	g.lineWidth = 3;
	g.fillText("Dual", 40, 50);
	g.strokeText("Dual", 40, 50);
	g.restore();



	// power
	asset["power"] = {
		offsetX : 370,
		offsetY : 100,
		width : 200,
		height : 60,
	}
	g.save();
	g.translate(370, 100);

	g.beginPath();
	g.moveTo(30, 0);
	g.lineTo(170, 0);
	g.lineTo(200, 20);
	g.lineTo(200, 40);
	g.lineTo(170, 60);
	g.lineTo(30, 60);
	g.lineTo(0, 40);
	g.lineTo(0, 20);
	g.closePath();
	g.fillStyle = "#001BFF";
	g.globalAlpha = 0.5;
	g.fill();
	g.lineWidth = 6;
	g.strokeStyle = "#001BFF";
	g.stroke();
	g.globalAlpha = 1;

	g.save();
	g.restore();

	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.font = "bold 43px Arial";
	g.lineWidth = 3;
	g.fillText("Power", 33, 45);
	g.strokeText("Power", 33, 45);
	g.restore();


	// health
	asset["health"] = {
		offsetX : 570,
		offsetY : 100,
		width : 200,
		height : 60,
	}
	g.save();
	g.translate(570, 100);

	g.beginPath();
	g.moveTo(30, 0);
	g.lineTo(170, 0);
	g.lineTo(200, 20);
	g.lineTo(200, 40);
	g.lineTo(170, 60);
	g.lineTo(30, 60);
	g.lineTo(0, 40);
	g.lineTo(0, 20);
	g.closePath();
	g.globalAlpha = 0.6;
	g.fillStyle = "red";
	g.fill();
	g.lineWidth = 6;
	g.strokeStyle = "red";
	g.stroke();
	g.globalAlpha = 1;


	g.save();
	g.restore();

	g.fillStyle = "white";
	g.strokeStyle = "black";
	g.font = "bold 43px Arial";
	g.lineWidth = 3;
	g.fillText("Health", 33, 45);
	g.strokeText("Health", 33, 45);
	g.restore();


	// pointer arrow
	asset["pointer_arrow"] = {
		offsetX : 0,
		offsetY : 170,
		width : 60,
		height : 60,
	}
	g.save();
	g.translate(0, 170);
	g.clearRect(0,0,60, 60);
	g.beginPath();
	g.lineWidth = 3;
	g.fillStyle = "red";
	g.moveTo(12, 8);
	g.lineTo(48, 8);
	g.lineTo(30, 45);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();


	// hot terrain bits
	asset["hot_terrain_bits"] = {
		offsetX : 0,
		offsetY : 240,
		width : 40,
		height : 40,
	}
	g.save();
	g.fillStyle = "#EB3725";
	g.lineWidth = 3;
	g.translate(0, 240);
	g.clearRect(0,0,40, 40);
	g.beginPath();
	g.moveTo(13,9);
	g.lineTo(7,17);
	g.lineTo(5,26);
	g.lineTo(12,32);
	g.lineTo(20,32);
	g.lineTo(26,36);
	g.lineTo(33,31);
	g.lineTo(32,19);
	g.lineTo(33,9);
	g.lineTo(24,8);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();



	// snowy terrain bits
	asset["snowy_terrain_bits"] = {
		offsetX : 50,
		offsetY : 240,
		width : 40,
		height : 40,
	}
	g.save();
	g.fillStyle = "#E8FFEE";
	g.lineWidth = 3;
	g.translate(50, 240);
	g.clearRect(0,0,40, 40);
	g.beginPath();
	g.moveTo(13,9);
	g.lineTo(7,17);
	g.lineTo(5,26);
	g.lineTo(12,32);
	g.lineTo(20,32);
	g.lineTo(26,36);
	g.lineTo(33,31);
	g.lineTo(32,19);
	g.lineTo(33,9);
	g.lineTo(24,8);
	g.closePath();
	g.fill();
	g.stroke();
	g.restore();


	// audio
	asset["lobby"] = {
		main : new Audio('asset/lobby_long.mp3'),
		play : function() {
			this.main.volume = 0.21;
			this.main.play();
		}
	}
	asset["lobby"].main.addEventListener('ended', function() {
		this.currentTime = 0;
		this.play();
	});

	return asset;
})();