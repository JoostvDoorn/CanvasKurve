var toggleCanvasSize = function() {
	var background = document.getElementById('background');
	var canvas = document.getElementById('canvas');
	var canvasContainer = document.getElementById('canvas-container');
	if(canvas.width == 600){
		background.width = background.height = canvas.width = canvas.height = canvasContainer.width = canvasContainer.height = 800;
		document.getElementById('container').style.width='950px';
		document.getElementById('game-bar').style.height='780px';
		canvasKurve.initRound();
	} else {
		background.width = background.height = canvas.width = canvas.height = canvasContainer.width = canvasContainer.height = 600;
		document.getElementById('container').style.width='750px';
		document.getElementById('game-bar').style.height='580px';
		canvasKurve.initRound();
	}
}