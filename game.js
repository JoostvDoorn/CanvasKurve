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
	//Stores the input references
	this.input = new Array();
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
		
		//Constants
		this.SPEED = 4;
		this.TURNING_SPEED = 1/40;
		
		this.update = function() {
			this.parent.ctxB.save();
			this.parent.ctxB.beginPath();
			this.parent.ctxB.lineWidth = 4;
			this.parent.ctxB.lineCap = "round";
			this.parent.ctxB.translate(this.x, this.y);
			//this.x += this.SPEED*Math.sin(this.angle);
			//this.y += this.SPEED*Math.cos(this.angle);
            this.parent.ctxB.lineTo(this.SPEED*Math.cos(this.angle), this.SPEED*Math.sin(this.angle));
			this.parent.endPath();
			this.parent.ctxB.stroke();
			this.parent.ctxB.restore();
		};
		
		this.turn = function(direction) {
			this.angle += direction*this.TURNING_SPEED*Math.PI;
		}
	
		//Constructor
		this.angle = 0;
		this.x = 10;
		this.y = 10;
		this.keyLeft = "A";
		this.keyRight = "S";
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