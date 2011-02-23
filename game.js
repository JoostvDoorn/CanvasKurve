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
	this.BORDER_WIDTH = 8;
	this.FPS = 60;
	this.INTERVAL = 1000/this.FPS;
	this.SPEED = 2/36*this.INTERVAL;
	this.TURNING_SPEED = 1/1200*this.INTERVAL;
	this.LEFT = -1;
	this.RIGHT = 1;
	this.STRAIGHT = 0;
	this.LINE_WIDTH = 5;
	this.COL_DISTANCE = 4;
	//Gap constants
	this.GAP_WIDTH = 3 * this.LINE_WIDTH;
	this.MIN_GAP_SPACING = 2 * this.FPS * this.SPEED; //2 is number of seconds
	this.MAX_GAP_SPACING = 2 * this.MIN_GAP_SPACING;
	//Glow constants
	this.GLOW = true; // Turns glow on or off
	this.GLOW_COUNT = 8; // Higher glow count gives a better quality glow
	this.GLOW_ALPHA = 0.1/this.GLOW_COUNT;
	this.GLOW_WIDTH = 3;
	//Set to true to paint the solid points
	this.PAINT_COLLISIONS = false;
	//Default colors
	this.DEFAULT_COLORS = new Array('#08e000', //Green
									'#0098d8', //Blue
									'#ff68c1', //Pink
									'#ff3535', //Red
									'#ff762b', //Orange
									'#60ffe7', //Cyan
									'#ffee1e', //Yellow
									'#ffffff', //White
									'#b668ff'  //Purple
									);
	
	
	this.intervalID;
	this.canvas;
	this.background;
	this.ctx;                       //foreground contex
	this.ctxB;                      // background context
	// Stores players and their snakes
	this.snakes = new Array();
	this.numberOfSnakesAlive;
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
		
		//Register spacebar
		this.inputUp[32] = new Array();
		this.inputUp[32][this.inputUp[32].length] = this.spacebarUp.bind(this);

		
		//TODO: implement interface to create players and assign keys
		//this.addRandomSnake("Nick", 0, 38, 40, "orange");	// up down
		//this.addRandomSnake("Thomas", 0, 65, 83, "#08e000");	// a s
		//this.addRandomSnake("Joost", 0, 37, 39, "red");		// left right
		
		for(i = 0; i < 8; i++) {
			this.addRandomSnake("Speler " + i, 0, 37, 39, this.DEFAULT_COLORS[i]);
		}
		
		this.initRound();
	}
	
	this.initRound = function() {
		// Prepare canvasses
		this.canvas.width = this.canvas.width;
		this.background.width = this.background.width;
		this.ctx.fillStyle = "black";
		this.ctxB.fillStyle = "yellow";
		this.ctxB.fillRect(0,0,this.background.width,this.background.height);
		this.ctxB.fillStyle = "black";
		this.ctxB.fillRect(this.BORDER_WIDTH,this.BORDER_WIDTH,this.background.width-2*this.BORDER_WIDTH,this.background.height-2*this.BORDER_WIDTH);
		
		
		this.solid = new Array();
		for(i in this.snakes) {
			this.snakes[i].resetToRandomPosition();
			this.snakes[i].startStep();
		}
		this.drawDots();
		this.numberOfSnakesAlive = -1;
		this.updateScoreBoard();
		
	}
	
	this.startRound = function() {
		this.numberOfSnakesAlive = this.snakes.length;
		for(i in this.snakes) {
			this.snakes[i].setInterval();
		}
		this.intervalID = window.setInterval(this.drawDots.bind(this), this.INTERVAL);
	}
	
	this.spacebarUp = function() {
		if(this.numberOfSnakesAlive == 0) {
			this.initRound();
		} else if(this.numberOfSnakesAlive == -1) {
			this.startRound();
		} else {
			//this.pause();
		}
	}
	
	this.addSnake = function(name, score, keyLeft, keyRight, x, y, angle, color) {
		this.snakes[this.snakes.length] = new this.Snake(this, name, score, keyLeft, keyRight, x, y, angle, color);
		this.numberOfSnakesAlive++;
	}
	
	this.addRandomSnake = function(name, score, keyLeft, keyRight, color) {
		this.addSnake(name, score, keyLeft, keyRight, 0, 0, 0, color);
		this.snakes[this.snakes.length - 1].resetToRandomPosition();
	}
	
	this.updateScore = function(snake) {
		this.numberOfSnakesAlive--;		
		for(i = 0; i < this.snakes.length; i++){
			if(!this.snakes[i].isDead) {
				this.snakes[i].score++;					// give point to living players
				if(this.numberOfSnakesAlive <= 1) {     // kill last snake
					clearInterval(this.snakes[i].intervalID);
					clearInterval(this.intervalID);		// clear interval for the dots
					this.numberOfSnakesAlive = 0;		// gamestate = END_OF_ROUND
				}
			}
		}
		this.updateScoreBoard();
	}
	
	this.updateScoreBoard = function() {
		this.sortedScoreArray = new Array();
		for(i in this.snakes) {
			this.sortedScoreArray[i] = new Array(this.snakes[i].score,this.snakes[i].name, this.snakes[i].color);
		}
		this.scoreHTML = '';
		this.sortedScoreArray.sort(function(a,b){return b[0] - a[0];});
		for(i in this.sortedScoreArray)
		{
			this.scoreHTML += '<tr style="color:'+this.sortedScoreArray[i][2]+'"><td>'+this.sortedScoreArray[i][1]+'</td><td>'+this.sortedScoreArray[i][0]+'</td></tr>';
		}
		document.getElementById('score-table').innerHTML = this.scoreHTML;
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
	* Registers points solid based on this.COL_DISTANCE, returns false if it passes a solid pixel.
	*/
	this.makeSolid = function(x, y, difX, difY, angle) {
		newX = parseInt(x + difX);
		newY = parseInt(y + difY);
		intX = parseInt(x);
		intY = parseInt(y);
		angleWidth = angle + 1/2*Math.PI;
		for(k = -Math.sqrt(Math.pow(difX,2) + Math.pow(difY, 2)); k <= 0; k++) {
			for(i = -this.COL_DISTANCE; i <= this.COL_DISTANCE; i++) {
				otherX = parseInt(x + i*Math.cos(angleWidth) + k*Math.cos(angle));
				otherY =  parseInt(y + i*Math.sin(angleWidth) + k*Math.sin(angle));

				this.makeSolidPoint(otherX, otherY);
			}
		}
		return (intX == newX && intY == newY) ? true : this.isSolid(newX, newY); //Placeholder
	}
	/**
	* Makes a certain pixel solid, returns false if the pixel is solid
	*/
	this.makeSolidPoint = function(x, y) {
		if(this.solid[x] == undefined) {
			this.solid[x] = new Array();
		}
		if(this.PAINT_COLLISIONS) {
			this.paintPink(x,y);
		}
		return (this.solid[x][y] == true) ? false : this.solid[x][y] = true;
	}
	this.isSolid = function(x, y) {
		if(this.solid[x] == undefined) {
			this.solid[x] = new Array();
		}
		return (this.solid[x][y] == true) ? false : true;
	}
	
	this.isSolid = function(x,y) {
		if(this.solid[x] == undefined) {
			this.solid[x] = new Array();
		}
		return (this.solid[x][y] == true) ? false : true;
	}
	
	this.paintPink = function(x,y) {
		this.ctxB.save();
		this.ctxB.fillStyle = "pink";
		this.ctxB.fillRect(x, y, 1, 1);
		this.ctxB.restore();
	}
	
	this.Snake = function(parent, name, score, left, right, x, y, angle, color) {
	
		this.parent = parent;
		
		//Constants
		this.BORDER_WIDTH = this.parent.BORDER_WIDTH;
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
			var extraWideBorder = 3;
			if(!this.isGap) {
				this.drawSnake(1.0, 1);
				if(this.parent.makeSolid(this.x,this.y, this.difx, this.dify, this.angle) == false ||
						this.x < this.BORDER_WIDTH + extraWideBorder ||
						this.y < this.BORDER_WIDTH + extraWideBorder ||
						this.x > this.parent.canvas.height - this.BORDER_WIDTH - extraWideBorder ||
						this.y > this.parent.canvas.width - this.BORDER_WIDTH - extraWideBorder) {
					clearInterval(this.intervalID);
					this.isDead = true;
					this.parent.updateScore(this);
				}
			}
			this.updateGap();
			this.x += this.difx; this.y += this.dify;
			this.angle += this.direction*this.TURNING_SPEED*Math.PI;
		};
			
		this.drawSnake = function(factorForwards, factorBackwards) {
			this.parent.ctxB.save();
			this.parent.ctxB.beginPath();
			this.parent.ctxB.lineWidth = this.LINE_WIDTH;
			this.parent.ctxB.lineCap = "butt";
			this.parent.ctxB.strokeStyle= this.color;
			this.parent.ctxB.moveTo(this.x - factorBackwards*this.difx, this.y - factorBackwards*this.dify);
			this.parent.ctxB.lineTo(this.x + factorForwards*this.difx, this.y + factorForwards*this.dify);
			this.parent.ctxB.closePath();
			this.parent.ctxB.stroke();
			this.parent.ctxB.restore();
			//Handles the glow effect
			if(this.parent.GLOW == true)
			{
				for(var i = 0; i<this.parent.GLOW_COUNT; i++) {
					this.parent.ctxB.save();
					this.parent.ctxB.beginPath();
					this.parent.ctxB.fillStyle= this.color;
					this.parent.ctxB.arc(this.x, this.y, this.parent.LINE_WIDTH + i*i*i/(this.parent.GLOW_COUNT*this.parent.GLOW_COUNT)*this.parent.GLOW_WIDTH, 0, Math.PI*2, true); 
					this.parent.ctxB.closePath();
					this.parent.ctxB.globalAlpha = this.parent.GLOW_ALPHA;
					this.parent.ctxB.fill();
					this.parent.ctxB.restore();
				}
			}
		};
			
		this.drawDot = function() {
			this.parent.ctx.fillStyle = "yellow";
			this.parent.ctx.beginPath();
			this.parent.ctx.arc(this.x, this.y,this.LINE_WIDTH/2 * 1.15,0,Math.PI*2,true);
			this.parent.ctx.closePath();
			this.parent.ctx.fill();
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
		
		this.resetToRandomPosition = function(){
			var minSpace = 15;
			this.x = (this.parent.canvas.width - 2*this.BORDER_WIDTH - 2*minSpace) * Math.random() + this.BORDER_WIDTH + minSpace;
			this.y = (this.parent.canvas.height - 2*this.BORDER_WIDTH - 2*minSpace) * Math.random() + this.BORDER_WIDTH + minSpace;
			this.angle = Math.random() * 2 * Math.PI;
			this.isDead = false;
			this.gapSpacing = this.MIN_GAP_SPACING + Math.random() * (this.MAX_GAP_SPACING - this.MIN_GAP_SPACING);
		}
		
		this.startStep = function() {
			this.difx = 8*Math.cos(this.angle); //step 8 pixels
			this.dify = 8*Math.sin(this.angle);
			this.drawSnake(1.1, 0);
			this.x += this.difx; this.y += this.dify;
			this.parent.makeSolid(this.x, this.y, this.difx, this.dify, this.angle);
		}
		
		this.setInterval = function() {
			this.intervalID = window.setInterval(this.update.bind(this), this.INTERVAL);
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
		this.name = name;
		this.score = score;
		this.color = color;
		this.isDead = false;
		this.registerKeys(left, right);
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
