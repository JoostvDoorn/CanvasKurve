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
	this.inputUp = new Array();
	this.inputDown = new Array();
	this.init = function() {
		this.canvas = document.getElementById("canvas");
		this.background = document.getElementById("background");
		this.ctx = this.canvas.getContext("2d");
		this.ctxB = this.background.getContext("2d");

		this.ctx.fillStyle = "black";
		this.ctxB.fillStyle = "black";
		
		this.snakes[this.snakes.length] = new this.Snake(this, 37, 39);
	}
	
	this.keyDown = function(e) {
		if(this.inputDown[e.keyCode]!=undefined) {
			for(a in this.inputDown[e.keyCode]) {
				this.inputDown[e.keyCode][a]();
			}
		}
	}
	
	this.keyUp = function(e) {
		if(this.inputUp[e.keyCode]!=undefined) {
			for(a in this.inputUp[e.keyCode]) {
				this.inputUp[e.keyCode][a]();
			}
		}
	}
	
	this.Snake = function(parent, left, right) {
		
		//Constants
		this.INTERVAL = 1000/60;
		this.SPEED = 2/36*this.INTERVAL;
		this.TURNING_SPEED = 1/1200*this.INTERVAL;
		this.LEFT = -1;
		this.RIGHT = 1;
		this.STRAIGHT = 0;
		
		this.update = function() {
			this.parent.ctxB.save();
            this.parent.ctxB.lineWidth = 4;
            this.parent.ctxB.lineCap = "round";
            this.parent.ctxB.translate(this.x, this.y);
            this.x += this.SPEED*Math.cos(this.angle);
            this.y += this.SPEED*Math.sin(this.angle);
            this.parent.ctxB.lineTo(this.SPEED*Math.cos(this.angle), this.SPEED*Math.sin(this.angle));
            this.parent.ctxB.stroke();
            this.parent.ctxB.restore();
			this.angle += this.direction*this.TURNING_SPEED*Math.PI;
		};
		
		this.turn = function(direction, old) {
			if(this.direction == old || direction != this.STRAIGHT) {
				this.direction = direction;
			}
		}
		
		this.registerKeys = function(left, right) {
			if(this.parent.inputUp[left] == undefined) {
				this.parent.inputUp[left] = new Array();
				this.parent.inputDown[left] = new Array();
			}
			if(this.parent.inputUp[right] == undefined) {
				this.parent.inputUp[right] = new Array();
				this.parent.inputDown[right] = new Array();
			}
			this.parent.inputDown[left][this.parent.inputDown[left].length] = this.turn.bind(this, this.LEFT, this.STRAIGHT);
			this.parent.inputDown[right][this.parent.inputDown[right].length] = this.turn.bind(this, this.RIGHT, this.STRAIGHT);
			this.parent.inputUp[left][this.parent.inputUp[left].length] = this.turn.bind(this, this.STRAIGHT, this.LEFT);
			this.parent.inputUp[right][this.parent.inputUp[right].length] = this.turn.bind(this, this.STRAIGHT, this.RIGHT);
		}
		
		//Constructor
		this.angle = 0;
		this.x = 10;
		this.y = 10;
		this.direction = 0;
		this.parent = parent;
		this.registerKeys(left, right);
		this.intervalID = window.setInterval(this.update.bind(this), this.INTERVAL);
	};
	addEvent(window, 'keydown', this.keyDown.bind(this)); 
	addEvent(window, 'keyup', this.keyUp.bind(this)); 
	this.init();
}
function load() {
	canvasKurve = new CanvasKurve();
}
function addEvent(obj, type, fn) {
  if (obj.attachEvent) {
    obj['e'+type+fn] = fn;
    obj[type+fn] = function(){obj['e'+type+fn]( window.event );}
    obj.attachEvent( 'on'+type, obj[type+fn] );
  } else
    obj.addEventListener(type, fn, false);
}
function removeEvent(obj, type, fn) {
  if (obj.detachEvent) {
    obj.detachEvent('on'+type, obj[type+fn]);
    obj[type+fn] = null;
  } else
    obj.removeEventListener(type, fn, false);
}
addEvent(window, 'load', load); 
