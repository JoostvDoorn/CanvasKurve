var canvasKurve;
function CanvasKurve() { 
	this.intervalID;
	this.rotation;
	this.green;
	this.canvas;
	this.background;
	this.ctx;
	this.ctxB;
	this.init = function() {
		this.canvas = document.getElementById("canvas");
		this.background = document.getElementById("background");
		this.ctx = this.canvas.getContext("2d");
		this.ctxB = this.background.getContext("2d");

		this.ctx.fillStyle = "black";
		
		
		this.drawTrans(this.ctx);
		this.rotation = -10;
		this.green = 0;
		this.intervalID = window.setInterval(this.drawRot.bind(this, this.ctx),1000/60);
	}
	this.drawCircle = function(ctx, x, y){
		ctx.beginPath();
		ctx.arc(x, y, 4, 0, Math.PI*2, true);
		ctx.closePath();
		ctx.fill();
	}
	this.clearAndDrawCircle = function(ctx, x, y) {
	}
	this.drawTrans = function(ctx) {
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
	this.drawRot = function(ctx) {
		ctx.save();
		this.canvas.width = this.canvas.width;
		//drawTrans(ctx);
		this.drawCircle(ctx,75,75);
		ctx.globalCompositeOperation = "xor";
		ctx.lineJoin = "round";
		ctx.strokeStyle = 'rgb(0,' + this.green + ',0)';
		ctx.lineWidth = 3.0;
		ctx.translate(140,140);
		ctx.rotate(this.rotation * Math.PI / 180);
		this.rotation += 1;
		this.green = (this.green + 1) % 256;
		ctx.beginPath();
		ctx.lineTo(120, 120);
		// was: ctx.quadraticCurveTo(60, 70, 70, 150); which is wrong.
		ctx.lineTo(30,100);
		ctx.lineTo(0, 0);
		ctx.closePath();
		ctx.stroke();
		ctx.restore();
	}
	this.init();
}
function load() {
	canvasKurve = new CanvasKurve()
}
if (window.attachEvent) {window.attachEvent('onload', load);}
else if (window.addEventListener) {window.addEventListener('load', load, false);}
else {document.addEventListener('load', load, false);}