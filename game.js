var canvasKurve;
function CanvasKurve() { 
	this.intervalID;
	this.rotation;
	this.green;
	this.canvas;
	this.background;
	this.ctx;
	this.ctxB;
	this.snakes = new Array();
	this.init = function() {
		this.canvas = document.getElementById("canvas");
		this.background = document.getElementById("background");
		this.ctx = this.canvas.getContext("2d");
		this.ctxB = this.background.getContext("2d");

		this.ctx.fillStyle = "black";
		this.ctxB.fillStyle = "black";
		
		this.snakes[this.snakes.length] = new this.Snake(this);
	}
	this.Snake = function(parent) {
	
		this.update = function() {
			this.parent.ctxB.beginPath();
			this.parent.ctxB.lineWidth = 4;
			this.parent.ctxB.lineCap = "round";
			this.parent.ctxB.moveTo(this.x, this.y);
            this.parent.ctxB.lineTo(this.x+1, this.y+1);
			this.parent.ctxB.stroke();
			this.x++;
			this.y++;
		};
	
		this.angle = 0;
		this.x = 0;
		this.y = 0;
		this.parent = parent;
		this.intervalID = window.setInterval(this.update.bind(this),1000/60);
	};
	this.init();
}
function load() {
	canvasKurve = new CanvasKurve();
}
if (window.attachEvent) {window.attachEvent('onload', load);}
else if (window.addEventListener) {window.addEventListener('load', load, false);}
else {document.addEventListener('load', load, false);}