/*
* Support for bind taken from https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Function/bind
*/
// Function.prototype.bind polyfill
if ( !Function.prototype.bind ) {

	Function.prototype.bind = function( obj ) {
		var slice = [].slice,
			args = slice.call(arguments, 1), 
			self = this, 
			nop = function () {}, 
			bound = function () {
			  return self.apply( this instanceof nop ? this : ( obj || {} ), 
								  args.concat( slice.call(arguments) ) );    
			};

		nop.prototype = self.prototype;

		bound.prototype = new nop();

		return bound;
	};
}
var canvasKurve;
function CanvasKurve() { 

	//Constants
	this.FPS = 60;
	this.INTERVAL = 1000/this.FPS;
	this.SPEED = 2/36*this.INTERVAL;
	this.TURNING_SPEED = 1/1200*this.INTERVAL;
	this.LEFT = -1;
	this.RIGHT = 1;
	this.STRAIGHT = 0;
	this.LINE_WIDTH = 4;
	//Gap constants
	this.GAP_WIDTH = 3 * this.LINE_WIDTH;
	this.MIN_GAP_SPACING = 2 * this.FPS * this.SPEED; //2 is number of seconds
	this.MAX_GAP_SPACING = 2 * this.MIN_GAP_SPACING;
	
	
	this.intervalID;
	this.canvas;
	this.background;
	this.ctx;                       //foreground contex
	this.ctxB;                      // background context
	this.snakes = new Array();
	// Stores the input references
	this.inputUp = new Array();
	this.inputDown = new Array();
	// Registers solid pixels
	this.solid = new Array();
	
	
	this.init = function() {
		this.canvas = document.getElementById("canvas");
		this.background = document.getElementById("background");
		this.ctx = this.canvas.getContext("2d");
		this.ctxB = this.background.getContext("2d");
		
		this.ctx.fillStyle = "black";
		this.ctxB.fillStyle = "yellow";
		this.ctxB.fillRect(0,0,this.background.width,this.background.height);
		this.ctxB.fillStyle = "black";
		var borderWidth = 4;
		this.ctxB.fillRect(borderWidth,borderWidth,this.background.width-2*borderWidth,this.background.height-2*borderWidth);
		
		this.addSnake(38, 40, 20, 30, 0, "green");
		this.addSnake(65, 83, 180, 180, 10/9*Math.PI, "orange");
		this.addSnake(37, 39, 85, 180, 0.6*Math.PI, "red");
		
		this.intervalID = window.setInterval(this.drawDots.bind(this), this.INTERVAL);
	}
	
	this.addSnake = function(keyLeft, keyRight, x, y, angle, color) {
		this.snakes[this.snakes.length] = new this.Snake(this, keyLeft, keyRight, x, y, angle, color);
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
	
	this.drawDots = function() {
		this.canvas.width = this.canvas.width;
		for(snake in this.snakes) {
			this.snakes[snake].drawDot();
		}
	}
	
	/**
	* Registers points solid based on this.LINE_WIDTH, returns false if it passes a solid pixel.
	*/
	this.makeSolid = function(x, y, difX, difY) {
		newX = parseInt(x + difX);
		newY = parseInt(y + difY);
		intX = parseInt(x);
		intY = parseInt(y);
		return (intX == newX && intY == newY) ? true : this.makeSolidPoint(newX, newY); //Placeholder
	}
	/**
	* Makes a certain pixel solid, returns false if the pixel is solid
	*/
	this.makeSolidPoint = function(x, y) {
		if(this.solid[x] == undefined) {
			this.solid[x] = new Array();
		}
		return (this.solid[x][y] == true) ? false : this.solid[x][y] = true;
	}
	
	this.Snake = function(parent, left, right, x, y, angle, color) {
	
		this.parent = parent;
		
		//Constants
		this.FPS = this.parent.FPS;
		this.INTERVAL = this.parent.INTERVAL;
		this.SPEED = this.parent.SPEED;
		this.TURNING_SPEED = this.parent.TURNING_SPEED;
		this.LEFT = this.parent.LEFT;
		this.RIGHT = this.parent.RIGHT;
		this.STRAIGHT = this.parent.STRAIGHT;
		this.LINE_WIDTH = this.parent.LINE_WIDTH;
		//Gap constants
		this.GAP_WIDTH = this.parent.GAP_WIDTH;
		this.MIN_GAP_SPACING = this.parent.MIN_GAP_SPACING;
		this.MAX_GAP_SPACING = this.parent.MAX_GAP_SPACING;
		
		
		this.update = function() {
			this.difx = this.SPEED*Math.cos(this.angle);
			this.dify = this.SPEED*Math.sin(this.angle);
			this.updateGap();
			if(!this.isGap) {
					this.drawSnake();
			}
			this.x += this.difx; this.y += this.dify;
			this.angle += this.direction*this.TURNING_SPEED*Math.PI;
		};
			
		this.drawSnake = function() {
			this.parent.ctxB.save();
			this.parent.ctxB.beginPath();
			this.parent.ctxB.lineWidth = this.LINE_WIDTH;
			this.parent.ctxB.lineCap = "round";
			this.parent.ctxB.strokeStyle= this.color;
			this.parent.ctxB.moveTo(this.x, this.y);
			if(this.parent.makeSolid(this.x,this.y, this.difx, this.dify) == false) {
				clearInterval(this.intervalID);
			}
			this.parent.ctxB.lineTo(this.x + this.difx * 2, this.y + this.dify * 2);
			this.parent.ctxB.closePath();
			this.parent.ctxB.stroke();
			this.parent.ctxB.restore();
		};
			
		this.drawDot = function() {
			this.parent.ctxB.save();
			this.parent.ctx.fillStyle = "yellow";
			this.parent.ctx.beginPath();
			this.parent.ctx.arc(this.x, this.y,this.LINE_WIDTH/2 + .1,0,Math.PI*2,true);
			this.parent.ctx.closePath();
			this.parent.ctx.fill();
			this.parent.ctxB.restore();
		};
			
		this.updateGap = function() {
			if(this.gapSpacing < 0 && this.isGap) {
				this.gapSpacing += this.SPEED;
			} else if(this.gapSpacing < 0) {
				this.gapSpacing = -this.GAP_WIDTH;
				this.isGap = true;
			} else if (this.gapSpacing >= 0 && this.isGap) {
				this.isGap = false;
				this.gapSpacing = this.MIN_GAP_SPACING + Math.random() * (this.MAX_GAP_SPACING - this.MIN_GAP_SPACING); //determine new spacing
			} else {
				this.gapSpacing -= this.SPEED;
			}
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
		this.angle = angle;
		this.x = x;
		this.y = y;
		this.difx;
		this.dify;
		this.gapSpacing = this.MIN_GAP_SPACING + Math.random() * (this.MAX_GAP_SPACING - this.MIN_GAP_SPACING);
		this.isGap = false;
		this.direction = 0;
		this.color = color;
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
