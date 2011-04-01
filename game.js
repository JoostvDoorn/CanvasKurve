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
	this.SCORE_DIFF = 2;
	
	this.BORDER_WIDTH = 8;
	this.FPS = 30;
	this.INTERVAL = 1000/this.FPS;
	this.SPEED = 3/36*this.INTERVAL;
	this.TURNING_SPEED = 1/80*this.SPEED;
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
	this.GLOW = false; // Turns glow on or off
	this.GLOW_COUNT = 10; // Higher glow count gives a better quality glow
	this.GLOW_ALPHA = 0.02; // Should be at least 0.05 otherwise it will look different in firefox
	this.GLOW_WIDTH = 20;
	//Set to true to paint the solid points
	this.PAINT_COLLISIONS = false;
	//Default snake names
	this.DEFAULT_NAMES = new Array('Greenlee',
								  'Knucklehead',
								  'Meister',
								  'Mooiboy',
								  'Pedobear',
								  'Player 0',
								  'NULLpointer',
								  '-1 Player'
								  );
	//Default controls (this makes it easy to fill the controls)
	this.DEFAULT_CONTROLS = new Array(new Array(undefined, undefined),
									  new Array(undefined, undefined),
									  new Array(undefined, undefined),
									  new Array(undefined, undefined),
									  new Array(undefined, undefined),
									  new Array(undefined, undefined),
									  new Array(undefined, undefined),
									  new Array(undefined, undefined)
									  );
	//Default colors
	this.DEFAULT_COLORS = new Array('#04cb04', //Green
									'#0369c2', //Blue
									'#ea56ac', //Pink
									'#ea0303', //Red
									'#ea5d03', //Orange
									'#54ebd3', //Cyan
									'#ffee1e', //Yellow
									'#ffffff', //White
									'#de4d9f'  //Purple
									);
	//Colors used if this.GLOW == true
	this.GLOW_COLORS = new Array('#08e000', //Green
								 '#0098d8', //Blue
								 '#ff68c1', //Pink
								 '#ff3535', //Red
								 '#ff762b', //Orange
								 '#60ffe7', //Cyan
								 '#ffee1e', //Yellow
								 '#ffffff', //White
								 '#b668ff'  //Purple
								 );
	// Main game colors
	this.BACKGROUND_COLOR = "black";
	this.BORDER_COLOR = "#EBE54D";
	// Constants for game state
	this.MENU = 0;
	this.RUNNING_GAME = 1;
	this.ROUND_ENDED = 2;
	this.GAME_PAUSED = 3;
	this.ROUND_INITIATED = 4;
	this.GAME_ENDED = 5;
	// Constants for the game state
	this.MENU_START = 0;
	this.SET_CONTROLS = 1;
	// Constants for messages
	this.MESSAGE_MIN_WIDTH  = 62;
	this.MESSAGE_MIN_HEIGHT = 24;
	// Constans for winner message
	this.WINNER_MIN_WIDTH = 50;
	this.WINNER_MIN_HEIGHT = 50;
	this.WINNER_VERTICAL_SPACING = 25;
	
	this.SECONDS_TO_MESSAGE = 2*Math.PI; //Seconds in multiple of 2*Math.PI
	
	// Constants for menu design
	this.MENU_NAMES_X = -200;
	this.MENU_NAMES_Y = 200;
	this.MENU_FONT_SIZE = 22;
	// Stores the string name of keys
	this.keys = {
				8: "BkSp",
				9: "TAB",
				16: "SHIFT",
				17: "CTR",
				18: "ALT",
				19: "PsBr",
				20: "CpsL",
				27: "Esc",
				33: "PgUp",34: "PgDw", 35: "End", 36: "Home",
				37: "LEFT",38: "UP",39: "RIGHT",40: "DOWN",
				45: "Insr", 46: "DEL",
				91: "OS",
				93: "RMB",
				112: "F1",113: "F2",114: "F3",115: "F4",116: "F5",117: "F6",118: "F7",119: "F8",120: "F9",121: "F10",122: "F11",123: "F12",
				144: "NmL",
				145: "ScL",
				173: "Mute",174: "VoDo",175: "VoUp",
				183: "Calc",
				255: "Esc",
				undefined: ""
			   };
	//An array with the colors currently used
	this.focus = true; //Records if the game still has focus
	this.colors;
	this.intervalID;
	this.canvas;
	this.background;
	this.ctx;                       //foreground contex
	this.ctxB;                      // background context
	this.frame = 0; //Counts frames
	this.gamestate = this.MENU;
	this.menustate = this.MENU_START;
	// Stores the names
	this.names = this.DEFAULT_NAMES;
	// Stores the controls
	this.controls = this.DEFAULT_CONTROLS;
	// Stores players and their snakes
	this.snakes = new Array();
	this.numberOfSnakesAlive;
	// Stores the input references
	this.inputUp = new Array();
	this.inputDown = new Array();
	// Registers solid pixels
	this.solid = new Array();
	
	
	/**
	 * Starts the game
	 */
	this.init = function() {
		this.canvas = document.getElementById("canvas");
		this.background = document.getElementById("background");
		
		if(this.GLOW == true) {
			this.colors = this.GLOW_COLORS;
		}
		else {
			this.colors = this.DEFAULT_COLORS;
		}
		
		this.ctx = this.canvas.getContext("2d");
		this.ctxB = this.background.getContext("2d");
		
		//Register events
		addEvent(document.getElementById("toggle-button"), 'click',this.toggleCanvasSize.bind(this));
	
		addEvent(window, 'focus', (function() {this.focus=true;this.setMessage();this.frame=this.SECONDS_TO_MESSAGE*this.FPS+this.FPS*Math.PI;}).bind(this)); 
		addEvent(window, 'blur', (function() {this.focus=false;}).bind(this)); 
		addEvent(window, 'keydown', this.keyDown.bind(this)); 
		addEvent(window, 'keyup', this.keyUp.bind(this)); 
		addEvent(window, 'keypress', this.saveKeyEvent.bind(this)); 
		addEvent(this.canvas, 'click', this.click.bind(this));
		
		this.resetControls();
		
		this.initMenu();
	}
	
	/**
	 * Starts a game
	 */
	this.initGame = function() {
		//Reset snakes
		this.snakes = new Array();
		//Reset context
		this.ctx = this.canvas.getContext("2d");
		//Add random snakes to the game
		for(i = 0; i < 8; i++) {
			if(this.controlsSet(i)) {
				this.addRandomSnake(this.names[i], 0, this.controls[i][0], this.controls[i][1], this.colors[i]);
			}
		}
		//Makes sure there are at least 2 snakes
		if(this.snakes.length <= 1) {
			//Return to menu
			this.initMenu();
		}
		else {
			//Start the round
			this.initRound();
		}
	}
	
	/**
	 * Starts the menu
	 */
	this.initMenu = function() {
	
		//Reset controls, otherwise you can't set controls
		this.resetControls();
	
		this.menustate = this.MENU_START;
		this.drawMenu();
	}
	
	/**
	 * Draws the menu
	 */
	this.drawMenu = function() {
		// Prepare canvasses
		this.canvas.width = this.canvas.width;
		this.background.width = this.background.width;
		// Draw background
		this.drawBackground();
		var ctx = document.getElementById('canvas').getContext('2d');
		var img = new Image();
		img.onload = (function(){
		  this.ctx.drawImage(img,parseInt(this.canvas.width/2)-img.width/2,0);
		}).bind(this);
		img.src = 'banner.gif';
		
		this.ctx.save();
		this.ctx.font = this.MENU_FONT_SIZE+"px \"Helvetica Neue\", Arial, Helvetica, sans-serif";
		for(var i = 0; i<this.names.length; i++) {
			this.ctx.fillStyle = this.colors[i];
			this.ctx.globalAlpha = 1;
			this.ctx.fillText(i+1, parseInt(this.canvas.width/2)+this.MENU_NAMES_X, this.MENU_NAMES_Y+this.MENU_FONT_SIZE*2*i);
			if(this.controlsSet(i) || (this.menustate == this.SET_CONTROLS && this.controls_playerSelected == i)) {
				this.ctx.globalAlpha = 1;
				this.ctx.fillText(this.keyToChar(this.controls[i][0]), parseInt(this.canvas.width/2)+this.MENU_NAMES_X+290, this.MENU_NAMES_Y+this.MENU_FONT_SIZE*2*i);
				this.ctx.fillText(this.keyToChar(this.controls[i][1]), parseInt(this.canvas.width/2)+this.MENU_NAMES_X+360, this.MENU_NAMES_Y+this.MENU_FONT_SIZE*2*i);
			} else {
				this.ctx.globalAlpha = 0.5;
			}
			this.ctx.fillText(this.names[i], parseInt(this.canvas.width/2)+this.MENU_NAMES_X+30, this.MENU_NAMES_Y+this.MENU_FONT_SIZE*2*i);
		}
		this.ctx.restore();
	}
	
	this.click = function(event) {
		if(this.gamestate == this.MENU) {
			for(var i = 0; i<this.names.length; i++) {
				if((parseInt(this.canvas.width/2)+this.MENU_NAMES_X) <= event.layerX && event.layerX <= parseInt(this.canvas.width/2)+this.MENU_NAMES_X+370 &&
					parseInt(this.MENU_NAMES_Y+this.MENU_FONT_SIZE*2*(i-0.7)) <= event.layerY && event.layerY <= parseInt(this.MENU_NAMES_Y+this.MENU_FONT_SIZE*2*(i+0.4))) {
					this.setControls(i);
					event.preventDefault();
					return false;
				}
			}
		}
	}
	
	/**
	 * Clears all the snake controls
	 */
	this.resetControls = function() {
	
		//Reset
		this.inputUp = new Array();
		this.inputDown = new Array();
		
		//Register spacebar
		this.inputUp[32] = new Array();
		this.inputUp[32][this.inputUp[32].length] = this.spacebarUp.bind(this);
	}
	
	/**
	 * Sets the controls of a certain player, disables the controls if they're already set
	 */
	this.setControls = function(i) {
		// If controls are set disable them
		if(this.controlsSet(i)) {
			this.disableControls(i);
		}
		// Else start editing the controls
		else {
			this.menustate = this.SET_CONTROLS;
			this.controls_playerSelected = i;
			this.controls_currentKey = 0;
		}
		// Refresh menu
		this.drawMenu();
	}
	
	/**
	 * Sets the control to the currently selected player
	 */
	this.setControl = function(keyCode) {
		if(this.controls_playerSelected != undefined && this.controls[this.controls_playerSelected] != undefined && this.controls_currentKey < 2) {
			this.controls[this.controls_playerSelected][this.controls_currentKey] = keyCode;
		}
		
		this.controls_currentKey++;
		
		if(this.controls_currentKey == 2) {
			this.menustate = this.MENU_START;
		}
		
		// Refresh menu
		this.drawMenu();
	}
	
	/**
	 * Disables the controls of a certain player
	 */
	this.disableControls = function(i) {
		this.controls[i] = new Array(undefined, undefined);
	}
	
	/**
	 * Display the string representatiion of the controls
	 */
	this.keyToChar = function(keyCode) {
		// Convert key to character
		value = this.keys[keyCode] != undefined ? this.keys[keyCode] : "";
		if((65<=keyCode && keyCode<=90) || (48<=keyCode && keyCode <= 57)) {
			value = String.fromCharCode(keyCode);
		}
		return value;
	}
	
	this.saveKey = function(keyCode) {
		this.currentKeyCode = keyCode
	}
	
	this.saveKeyEvent = function(e) {
		if(this.keys[this.currentKeyCode] == undefined) {
			this.keys[this.currentKeyCode] = String.fromCharCode(e.charCode);
		}
		e.preventDefault();
		return false;
	}
	
	this.controlsSet = function(i) {
		return (this.controls[i][0] != undefined && this.controls[i][1] != undefined);
	}
	
	this.initRound = function() {
		// Prepare canvasses
		this.canvas.width = this.canvas.width;
		this.background.width = this.background.width;
		this.ctx.fillStyle = this.BACKGROUND_COLOR;
		this.drawBackground();
		
		this.setMessage((this.gamestate == this.MENU));
		this.solid = new Array();
		for(i in this.snakes) {
			this.snakes[i].resetToRandomPosition();
			this.snakes[i].startStep();
		}
		this.updateScoreBoard();
		this.gamestate = this.ROUND_INITIATED;
		
		//Reset frame locks
		this.dotsLock = false;
		
	}
	
	this.startRound = function() {
		this.numberOfSnakesAlive = this.snakes.length;
		this.scoreToWin = (this.snakes.length-1)*10;
		for(i in this.snakes) {
			this.snakes[i].setInterval();
		}
		document.getElementById("toggle-button").disabled = true;
		this.intervalID = window.setInterval(this.drawDots.bind(this), this.INTERVAL);
		this.gamestate = this.RUNNING_GAME;
		//Stop displaying the spacebar message
		clearInterval(this.intervalMessage);
	}
	
	/**
	 * Draws the background with a border
	 */
	this.drawBackground = function() {
		this.ctxB.fillStyle = this.BORDER_COLOR;
		this.ctxB.fillRect(0,0,this.background.width,this.background.height);
		this.ctxB.fillStyle = this.BACKGROUND_COLOR;
		this.ctxB.fillRect(this.BORDER_WIDTH,this.BORDER_WIDTH,this.background.width-2*this.BORDER_WIDTH,this.background.height-2*this.BORDER_WIDTH);
	}
	
	this.spacebarUp = function() {
		switch(this.gamestate) {
		case this.MENU:
			this.initGame();
			break;
		case this.ROUND_INITIATED:
			this.startRound();
			break;
		case this.GAME_PAUSED:
			this.gamestate = this.RUNNING_GAME;
			this.intervalID = window.setInterval(this.drawDots.bind(this), this.INTERVAL);
			clearInterval(this.intervalMessage);
			break;
		case this.RUNNING_GAME:
			this.gamestate = this.GAME_PAUSED;
			clearInterval(this.intervalID);
			this.setMessage(true);
			break;
		case this.ROUND_ENDED:
			this.initRound();
			this.frame = 0;
			break;
		case this.GAME_ENDED:
			this.gamestate = this.MENU;
			this.initMenu();
			break;
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
		var roundEnded;
		for(i = 0; i < this.snakes.length; i++){
			if(!this.snakes[i].isDead) {
				this.snakes[i].score++;					// give point to living players
				if(this.numberOfSnakesAlive <= 1) {     // kill last snake
					var roundEnded = true;
					clearInterval(this.snakes[i].intervalID);
				}
			}
		}
		this.updateScoreBoard();
		if(roundEnded == true) {
			this.endRound();
		}
	}
	
	this.endRound = function() {
		clearInterval(this.intervalID);		// clear interval for the dots
		document.getElementById("toggle-button").disabled = false;
		
		var winner = this.checkWinner();
		if(winner == false) {
			this.gamestate = this.ROUND_ENDED;
		
			//Display message
			this.setMessage();
		}
		else {
			this.gamestate = this.GAME_ENDED;
			
			this.endGame(winner);
		}
	}
	
	/**
	 * Called at the end of a round if a player has won
	 */
	this.endGame = function(winner) {
		text = winner.name + " wins!";
		gameOver = "KONEC HRY";
		
		var gameOverHeight = 50;
		var textHeight = 30;
		
		var width = this.WINNER_MIN_WIDTH;
		var height = this.WINNER_MIN_HEIGHT + this.WINNER_VERTICAL_SPACING;
		
		this.ctx.save();
		this.ctx.font = gameOverHeight + "px serif";
		gameOverWidth = this.ctx.measureText(gameOver).width;
		height += gameOverHeight;
		this.ctx.font = textHeight + "px sans-serif";
		textWidth = this.ctx.measureText(text).width;
		height += textHeight;
		this.ctx.restore();
		
		gameOverWidth > textWidth ? width += gameOverWidth : width += textWidth;
		
		this.ctx.save();
		
		this.ctx.translate(.5 * this.canvas.width - .5 * width, .5 * this.canvas.height - .5 * height);
		
		this.ctx.save();
		this.ctx.fillStyle = winner.color;
		this.ctx.strokeStyle = winner.color;
		this.ctx.globalAlpha = .55;
		this.ctx.fillRect(0, 0, width, height);
		this.ctx.globalAlpha = 1;
		var border = 4;
		this.ctx.lineWidth = border;
		this.ctx.strokeRect(.5 * border, .5 * border, width - .5 * border, height - .5 * border);
		this.ctx.restore();
		
		this.ctx.save();
		this.ctx.font = gameOverHeight + "px serif";
		this.ctx.translate(.5 * width - .5 * gameOverWidth, .5 * this.WINNER_MIN_HEIGHT);
		this.ctx.fillText(gameOver, 0, gameOverHeight);
		this.ctx.restore();
		
		this.ctx.save();
		this.ctx.font = textHeight + "px sans-serif";
		this.ctx.translate(.5 * width - .5 * textWidth, .5 * this.WINNER_MIN_HEIGHT + gameOverHeight + this.WINNER_VERTICAL_SPACING);
		this.ctx.fillText(text, 0, textHeight);
		this.ctx.restore();
		
		this.ctx.restore();
	}
	
	/**
	 * Checks if there is a winner and returns the snake object of the winner or false
	 */
	this.checkWinner = function() {
		var firstScore = this.scoreToWin;
		var firstSnake = false;
		var secondScore = 0;
		for(i = 0; i < this.snakes.length; i++){
			if(this.snakes[i].score >= firstScore) {
				if(firstSnake != false) {
					secondScore = firstScore;
				}
				firstSnake = this.snakes[i];
				firstScore = this.snakes[i].score;
			} else if(this.snakes[i].score > secondScore) {
				secondScore = this.snakes[i].score;
			}
		}
		return (firstScore >= (secondScore + this.SCORE_DIFF)) ? firstSnake : false;
	}
	
	this.updateScoreBoard = function() {
		sortedScoreArray = new Array();
		for(i in this.snakes) {
			sortedScoreArray[i] = new Array(this.snakes[i].score, this.snakes[i].name, this.snakes[i].color);
		}
		scoreHTML = '';
		sortedScoreArray.sort(function(a,b){return b[0] - a[0];});
		for(i in sortedScoreArray)
		{
			scoreHTML += '<tr style="color:'+sortedScoreArray[i][2]+'"><td>'+sortedScoreArray[i][1]+'</td><td>'+sortedScoreArray[i][0]+'</td></tr>';
		}
		document.getElementById('score-table').innerHTML = scoreHTML;
	}
	
	this.keyDown = function(e) {
		e.preventDefault();
		if(this.inputDown[e.keyCode]!=undefined) {
			for(a in this.inputDown[e.keyCode]) {
				this.inputDown[e.keyCode][a]();
			}
			return false;
		}
		// Saves the name of the key if needed
		this.saveKey(e.keyCode);
	}
	
	this.keyUp = function(e) {
		e.preventDefault();
		if(this.inputUp[e.keyCode]!=undefined) {
			for(a in this.inputUp[e.keyCode]) {
				this.inputUp[e.keyCode][a]();
			}
			return false;
		}
		if(this.gamestate == this.MENU && this.menustate == this.SET_CONTROLS) {
			this.setControl(e.keyCode);
			return false;
		}
	}
	
	this.drawDots = function() {
		if(this.dotsLock != true) {
			this.dotsLock = true;
			this.canvas.width = this.canvas.width;
			for(snake in this.snakes) {
				this.snakes[snake].drawDot();
			}
			this.dotsLock = false;
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
	
	/**
	 * Checks if a certain pixel is solid
	 */
	this.isSolid = function(x, y) {
		if(this.solid[x] == undefined) {
			this.solid[x] = new Array();
		}
		return (this.solid[x][y] == true) ? false : true;
	}
	
	/**
	 * Paints specific pixels pink
	 */
	this.paintPink = function(x,y) {
		this.ctxB.save();
		this.ctxB.fillStyle = "pink";
		this.ctxB.globalAlpha = 0.5;
		this.ctxB.fillRect(x, y, 1, 1);
		this.ctxB.restore();
	}

	
	this.message = function() {
		//Only draw anything if not completely transparent
		var alpha = 0;
		if((this.frame/this.FPS)>=this.SECONDS_TO_MESSAGE) {
			alpha = 0.5-Math.cos(this.frame/this.FPS)/2;
			if(alpha > 0.95) {
				//Only fade in once
				clearInterval(this.intervalMessage);
				alpha = 1;
			}
		}
		
		if(this.gamestate == this.GAME_PAUSED) {
			this.frame += 10;
		}
		
		if(this.gamestate != this.MENU && ((alpha != 0 && this.focus == true) || this.frame == 0)) {
			
			var text;
			
			switch(this.gamestate)
			{
				case this.ROUND_INITIATED:
					text = "Press spacebar to start the next round";
					break;
				case this.ROUND_ENDED:
					text = "Press spacebar to continue";
					break;
				case this.GAME_PAUSED:
					text = "Paused, press spacebar to continue";
					break;
				default:
					text = "";
			}
			
			if(text!="") {
			
				//Make sure the dots are drawn
				this.drawDots();
				
				//Display message
				this.ctx.save();
				this.ctx.lineCap = "butt";
				this.ctx.font = "10pt Arial";
				
				var width = this.MESSAGE_MIN_WIDTH;
				var height = this.MESSAGE_MIN_HEIGHT;
				width += this.ctx.measureText(text).width;
				
				
				//Draw the border
				
				var x = parseInt((this.background.width-width)/2);
				var y = parseInt((this.background.height-height)/2);
				
				this.ctx.lineWidth = 3;
				this.ctx.strokeStyle = "black";
				this.ctx.fillStyle = "black";
				this.ctx.globalAlpha = alpha;
				this.ctx.beginPath();
				this.ctx.moveTo(x+50,y+16);
				this.ctx.strokeText("Space", x+3, y+15);
				this.ctx.strokeText(text, x+65, y+16);
				this.ctx.arc(x+45,y+16,5,0,Math.PI*.5,false);
				this.ctx.arc(x+0,y+16,5,Math.PI*.5,Math.PI,false);
				this.ctx.arc(x+0,y+6,5,Math.PI,Math.PI*1.5,false);
				this.ctx.arc(x+45,y+6,5,Math.PI*1.5,Math.PI*2,false);
				this.ctx.closePath();
				this.ctx.stroke();
				
				
				//Draw the text
				this.ctx.lineWidth = 2;
				this.ctx.strokeStyle = "white";
				this.ctx.fillStyle = "white";
				this.ctx.globalAlpha = alpha;
				this.ctx.beginPath();
				this.ctx.moveTo(x+50,y+16);
				this.ctx.fillText("Space", x+3, y+15);
				this.ctx.fillText(text, x+65, y+16);
				this.ctx.arc(x+45,y+16,5,0,Math.PI*.5,false);
				this.ctx.arc(x+0,y+16,5,Math.PI*.5,Math.PI,false);
				this.ctx.arc(x+0,y+6,5,Math.PI,Math.PI*1.5,false);
				this.ctx.arc(x+45,y+6,5,Math.PI*1.5,Math.PI*2,false);
				//this.ctx.lineTo(60,25);
				this.ctx.closePath();
				this.ctx.stroke();
				this.ctx.restore();
			}
		}
		this.frame++;
	}
	
	this.setMessage = function(display) {
		if(this.gamestate != this.RUNNING_GAME) {
			this.frame = 0;
			if(display == true) {
				this.frame = this.SECONDS_TO_MESSAGE*this.FPS;
			}
			clearInterval(this.intervalMessage);
			this.intervalMessage = window.setInterval(this.message.bind(this), this.INTERVAL);
		}
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
			if(this.parent.gamestate == this.parent.RUNNING_GAME) {
				this.difx = this.SPEED*Math.cos(this.angle);
				this.dify = this.SPEED*Math.sin(this.angle);
				var extraWideBorder = 3;
				if(!this.isGap) {
					this.drawSnake(1.0, 1);
				}
				if(!this.isGap || this.gapSpacing < (-this.GAP_WIDTH + (this.SPEED*this.FPS/20))) {
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
			}
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
				for(var i = 1; i<=this.parent.GLOW_COUNT; i++) {
				
					this.parent.ctxB.save();
					this.parent.ctxB.beginPath();
					this.parent.ctxB.lineWidth = this.parent.LINE_WIDTH + i*i/(this.parent.GLOW_COUNT*this.parent.GLOW_COUNT)*this.parent.GLOW_WIDTH;
					this.parent.ctxB.lineCap = "butt";
					this.parent.ctxB.strokeStyle= this.color;
					this.parent.ctxB.moveTo(this.x - factorBackwards*this.difx, this.y - factorBackwards*this.dify);
					this.parent.ctxB.lineTo(this.x + factorForwards*this.difx, this.y + factorForwards*this.dify);
					this.parent.ctxB.closePath();
					this.parent.ctxB.globalAlpha = this.parent.GLOW_ALPHA;
					this.parent.ctxB.globalCompositeOperation = "source-over";
					this.parent.ctxB.stroke();
					this.parent.ctxB.restore();
				}
			}
		};
			
		this.drawDot = function() {
			this.parent.ctx.save();
			this.parent.ctx.fillStyle = "yellow";
			this.parent.ctx.beginPath();
			this.parent.ctx.arc(this.x, this.y,this.LINE_WIDTH/2 * 1.15,0,Math.PI*2,true);
			this.parent.ctx.closePath();
			this.parent.ctx.fill();
			this.parent.ctx.restore();
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
			var minSpace = 55;
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

	this.toggleCanvasSize = function() {
		var canvasContainer = document.getElementById('canvas-container');
		if(this.canvas.width == 600){
			this.background.width = this.background.height = this.canvas.width = this.canvas.height = canvasContainer.width = canvasContainer.height = 800;
			document.getElementById('container').style.width='950px';
			document.getElementById('game-bar').style.height='780px';
			this.drawState();
		} else {
			this.background.width = this.background.height = this.canvas.width = this.canvas.height = canvasContainer.width = canvasContainer.height = 600;
			document.getElementById('container').style.width='750px';
			document.getElementById('game-bar').style.height='580px';
			this.drawState();
		}
	}
	
	
	/**
	 * Initialises the current state
	 */
	this.drawState = function() {
		
		switch(this.gamestate) {
		case this.ROUND_INITIATED:
			this.initRound();
			break;
		case this.GAME_PAUSED:
			this.initRound();
			break;
		case this.RUNNING_GAME:
			this.initRound();
			break;
		case this.ROUND_ENDED:
			this.initRound();
			break;
		default:
			this.initMenu();
			break;
		}
	}


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
