var intervalID;
var rotation;
var green;
var canvas;
var background;
var ctx;
var ctxB;

function init() {
	canvas = document.getElementById("canvas");
	background = document.getElementById("background");
	ctx = canvas.getContext("2d");
	ctxB = background.getContext("2d");

	ctx.fillStyle = "black";
	
	
	drawTrans(ctx);
	rotation = -10;
	green = 0;
	intervalID = window.setInterval("drawRot(ctx);",1000/60);
}

function drawCircle(ctx, x, y){
	ctx.beginPath();
	ctx.arc(x, y, 4, 0, Math.PI*2, true);
	ctx.closePath();
	ctx.fill();
}

function clearAndDrawCircle(ctx, x, y) {
}

function drawTrans(ctx) {
	ctx.save();
	ctx.translate(50,50);
	ctx.beginPath();
	ctx.lineTo(120, 120);
	// was: ctx.quadraticCurveTo(60, 70, 70, 150); which is wrong.
	ctx.bezierCurveTo(30, 50, 30, 40, 40, 120); // <- this is right formula for the image on the right ->
	ctx.lineTo(0, 0);
	ctx.fill();
	ctx.restore();
}

function drawRot(ctx) {
	ctx.save();
	canvas.width = canvas.width;
	//drawTrans(ctx);
	drawCircle(ctx,75,75);
	ctx.globalCompositeOperation = "xor";
	ctx.lineJoin = "round";
	ctx.strokeStyle = 'rgb(0,' + green + ',0)';
	ctx.lineWidth = 3.0;
	ctx.translate(140,140);
	ctx.rotate(rotation * Math.PI / 180);
	rotation += 1;
	green = (green + 1) % 256;
	ctx.beginPath();
	ctx.lineTo(120, 120);
	// was: ctx.quadraticCurveTo(60, 70, 70, 150); which is wrong.
	ctx.lineTo(30,100);
	ctx.lineTo(0, 0);
	ctx.closePath();
	ctx.stroke();
	ctx.restore();
}