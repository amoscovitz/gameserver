// Replay by snapshot
var canvas = document.createElement("canvas");
var ctx = canvas.getContext("2d");
canvas.width = 512;
canvas.height = 480;
canvas.addEventListener("mousedown",doMouseDown);
canvas.addEventListener("contextmenu",function(e){ e.preventDefault();return false;});// do not show context menu when right click
// mobile use only
canvas.addEventListener('touchmove', function(event) {isTouchmove=true;}, false);
canvas.addEventListener('touchend', function(event) {isTouchmove=false;}, false);

img = new Image();
img.src = 'tail.PNG';
document.getElementById("game1").appendChild(canvas);

var sb;
var img;
var terrainPattern;
var posRed={x:0,y:0};
var posBlue={x:canvas.width-32,y:canvas.height-32};

var playerSpeed = 15;
var animSpeed=15;

var animSpeedMenu=5;
var debug=true;
var message="";

var mytimeout=300; // ms default

var playerBlue;
var playerRed;

var menu;
var gameover;

var icecreamAudio;

var score=0;

var isTouchmove=false;

var state= {
  current: 'menu',
  previous: null,
  MENU: 'menu',
  INIT: 'init',
  PLAY: 'playing',
  SCORE: 'score',
  STANDBY: 'standby',
  BACKTOBASE: 'backtobase',
  GAMEOVER: 'gameover',
  REPLAY: 'replay'
};

var inputBinder={
   leftButtonMouse: null,
   rightButtonMouse: null,
   touchMove: null
};

var players={
  RED:{id :-1,name:'RED'},
  BLUE:{id :-1,name:'BLUE'}
}

var spriteBall;
var ballx = 10;

window.InputEvent = null;

var framesRedFireS;
var framesRedFireN;
var framesRedFireW;
var framesRedFireE;

var events=[];
var receivedEvents=[];


var eventsCode={
CREATEPLAYER : 515771650,
GETPLAYERDATA : 515771651,
GETMOVE :515771652,
TIMEOUT :1,
MOVE    :515771649,
SCORE   :2994948032,
END     :2396952138
};

// store history of the 10 last seconds
// 10 seconds at 60 frames/ secs = 600 frames to save
//1 Frame = 
// pos of player red / pos of player blue / pos of ball
var replaybuffer= new Queue(600);

var uagent = navigator.userAgent.toLowerCase();

var imageLoaded = false;

function DetectIphoneOrIpod()
{
  return uagent.search("iphone") > -1 || uagent.search("ipod") > -1 || uagent.search("android") > -1;
}

function doMouseDown(event){
	var rect = canvas.getBoundingClientRect();
	var pos={x:0,y:0};
	pos.x=Math.round((event.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
	pos.y=Math.round((event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);
	switch (state.current){
	  case state["MENU"]:
		if (imageLoaded){
		  menu.input(pos);
		}else{
		  console.info('Loading...');
		}		
		break;
	  case state["GAMEOVER"]:
		gameover.input(pos);
		break;
	  case state["PLAYING"]:
		// will be handled by input
		window.InputEvent = event;
		
		// player may need it 
		playerRed.event = event;

		//ask server to get blue move
		events.push({eventid:eventsCode['GETMOVE'],
					  type:'GET',
					  playerid:players['BLUE'].id,
		              player:players['BLUE'].name,
					  data:null});
		//inform server red move
		events.push({eventid:eventsCode['MOVE'],
					  type:'POST',
					  playerid:players['RED'].id,
		              player:players['RED'].name,
					  data:pos.x+' '+pos.y+' 0.0'});
	}
		
}

function setImageLoaded(){
	imageLoaded = true;
}

function init() {

	var param = window.location.search.substr(1).split("=");
	if (param[0]=="timeout"){
		mytimeout = param[1];
	}
	terrainPattern = ctx.createPattern(img, 'repeat');
	ctx.fillStyle=terrainPattern;
	lastTime = Date.now();
    sb = new Image();
	sb.onload = setImageLoaded();
    sb.src = 'sbp.PNG';

    icecreamAudio = new Audio("icecream.wav");

	var framesRed={
	    length :4, 
		animRight :[{pos :[32,32]},{pos :[2*32,32]},{pos :[3*32,32]},{pos :[4*32,32]}],
		animLeft :[{pos :[17*32,32]},{pos :[18*32,32]},{pos :[19*32,32]},{pos :[20*32,32]}],
		animUp :[{pos :[16*32,0]},{pos :[17*32,0]},{pos :[18*32,0]},{pos :[19*32,0]}],
		animDown :[{pos :[9*32,32]},{pos :[10*32,32]},{pos :[11*32,32]},{pos :[12*32,32]}],
		animLeftDown :[{pos :[13*32,32]},{pos :[14*32,32]},{pos :[15*32,32]},{pos :[16*32,32]}],
		animLeftUp :[{pos :[21*32,32]},{pos :[22*32,32]},{pos :[0,32*2]},{pos :[32,32*2]}],
		animRightUp :[{pos :[20*32,0]},{pos :[21*32,0]},{pos :[22*32,0]},{pos :[0,32]}],
		animRightDown :[{pos :[5*32,32]},{pos :[6*32,32]},{pos :[7*32,32]},{pos :[8*32,32]}]
	};

	var framesBlue={
	    length :4,
		animRight :[{pos :[6*32,6*32]},{pos :[7*32,6*32]},{pos :[8*32,6*32]},{pos :[9*32,6*32]}],
		animLeft :[{pos :[22*32,6*32]},{pos :[0,7*32]},{pos :[32,7*32]},{pos :[2*32,7*32]}],
		animUp :[{pos :[21*32,5*32]},{pos :[22*32,5*32]},{pos :[0,6*32]},{pos :[32,6*32]}],
		animDown :[{pos :[14*32,6*32]},{pos :[15*32,6*32]},{pos :[16*32,6*32]},{pos :[17*32,6*32]}],
		animLeftDown :[{pos :[18*32,6*32]},{pos :[19*32,6*32]},{pos :[20*32,6*32]},{pos :[21*32,6*32]}],
		animLeftUp :[{pos :[3*32,7*32]},{pos :[4*32,7*32]},{pos :[5*32,7*32]},{pos :[6*32,7*32]}],
		animRightUp :[{pos :[2*32,6*32]},{pos :[3*32,6*32]},{pos :[4*32,6*32]},{pos :[5*32,6*32]}],
		animRightDown :[{pos :[10*32,6*32]},{pos :[11*32,6*32]},{pos :[12*32,6*32]},{pos :[13*32,6*32]}]
	};

	var framesKORed={
	    length :8,
		anim :[{pos :[2*32,4*32]},{pos :[19*32,3*32]},{pos :[20*32,3*32]},{pos :[21*32,3*32]},{pos :[22*32,3*32]},{pos :[0,4*32]},{pos :[32,4*32]},{pos :[2*32,4*32]}]	
	};

	framesRedFireS={
	    length :3,
		anim :[{pos :[15*32,2*32]},{pos :[16*32,2*32]},{pos :[17*32,2*32]}]	
	};
	framesRedFireN={
	    length :3,
		anim :[{pos :[3*32,2*32]},{pos :[4*32,2*32]},{pos :[5*32,2*32]}]	
	};
	framesRedFireE={
	    length :3,
		anim :[{pos :[9*32,2*32]},{pos :[10*32,2*32]},{pos :[11*32,2*32]}]	
	};
	framesRedFireW={
	    length :3,
		anim :[{pos :[21*32,2*32]},{pos :[22*32,2*32]},{pos :[23*32,2*32]}]	
	};

	
	var framesKOBlue={
	    length :8,
		anim :[{pos :[7*32,9*32]},{pos :[32,9*32]},{pos :[2*32,9*32]},{pos :[3*32,9*32]},{pos :[4*32,9*32]},{pos :[5*32,9*32]},{pos :[6*32,9*32]},{pos :[7*32,9*32]}]	
	};
	
	playerRed= new Sprite("Red", sb, [0, 0], [32, 32], animSpeed, playerSpeed, framesRed, [0,0],false);
	playerRed.isFiring=false;
	playerRed.fire =function(){
		if (state.current==state["PLAYING"])
		{
		 if (spriteBall.isPicked()){
			this.stop();
			switch (playerRed.currentDirection){
				case directions['NORTHWEST']:
				case directions['NORTHEAST']:
				case directions['NORTH']:
					playerFireRed.frames = framesRedFireN;
					break;
				case directions['SOUTHWEST']:
				case directions['SOUTHEAST']:
				case directions['SOUTH']:
					playerFireRed.frames = framesRedFireS;
					break;
				case directions['EAST']:
					playerFireRed.frames = framesRedFireE;
					break;
				case directions['WEST']:
					playerFireRed.frames = framesRedFireW;
					break;
			}
			playerRed.isFiring=true;
			// give ball coordinate to start + direction and force to apply
			spriteBall.fire([this.playerPosx, this.playerPosy],this.currentDirection,200);
		 }else{
			console.info("No ball");
		 }
		}
	}
	
	playerRed.stop =function(){
	   // => stop in last direction
	   posRed.x =  this.playerPosx;
	   posRed.y =  this.playerPosy;	
	   switch (this.currentDirection){
		   case directions['NORTH']:
				this.fx = this.frames.animUp[0].pos[0];
				this.fy = this.frames.animUp[0].pos[1];
				break;
		   case directions['SOUTH']:
				this.fx = this.frames.animDown[0].pos[0];
				this.fy = this.frames.animDown[0].pos[1];
				break;
		   case directions['WEST']:
				this.fx = this.frames.animLeft[0].pos[0];
				this.fy = this.frames.animLeft[0].pos[1];
				break;
		   case directions['EAST']:
				this.fx = this.frames.animRight[0].pos[0];
				this.fy = this.frames.animRight[0].pos[1];
				break;
			default:
	   }
	}
		
	playerRed.move =function(){
	   if (state.current==state["PLAYING"]){
			var rect = canvas.getBoundingClientRect();
			posRed.x=Math.round((this.event.clientX-rect.left)/(rect.right-rect.left)*canvas.width);
			posRed.y=Math.round((this.event.clientY-rect.top)/(rect.bottom-rect.top)*canvas.height);		
		}
	//	console.info("Red x:"+posRed.x+" y:"+posRed.y);
	}
	
	playerBlue= new Sprite("Blue", sb, [canvas.width -32, canvas.height-32], [32, 32], animSpeed, playerSpeed, framesBlue,[5*32,5*32],false);
	playerBlue.dead=false;
    playerRedKO = new Sprite("RedKO",sb,[0, 0], [32, 32],animSpeed, playerSpeed, framesKORed, [0,0],true);
	playerBlueKO = new Sprite("BlueKO",sb,[0, 0], [32, 32],animSpeed, playerSpeed, framesKOBlue, [0,0],true);
    playerFireRed = new Sprite("RedFire",sb,[0, 0], [32, 32],animSpeed, playerSpeed, framesRedFireN, [0,0],true);
	
	spriteBall = new Sprite("Ball",null,[canvas.width/2, canvas.height/2], [32, 32],animSpeed, playerSpeed, null, [0,0],false);
	spriteBall.picked = false;
	spriteBall.fired = false;
	spriteBall.amount = 0;
	spriteBall.force = 100; //px
	spriteBall.render = function(ctx) {
	    if (this.isPicked()){
			return;
		}
		ctx.save();			
		ctx.drawImage(sphere, this.pos[0],this.pos[1], 8, 8);

		ctx.beginPath();
		ctx.arc(this.pos[0],this.pos[1],8,0,2*Math.PI,true);
		ctx.clip();
		ctx.closePath();
		ctx.restore();		
	};
	spriteBall.setPicked = function() {
		this.picked = !this.picked;		
	};
	spriteBall.isPicked = function() {
		return this.picked;
	};
	spriteBall.fire =function(startpos, direction, force){
	    this.pos[0] = startpos[0];
	    this.pos[1] = startpos[1];
		this.currentDirection = direction;
		this.force = force <=0 ? 100 : force; // default 100 px in force
		this.fired = true;
		this.setPicked();
	}
	
	spriteBall.update= function(dt,newpos) {
	    if (!this.fired){
		   return;
		}
		if (this.amount >= this.force){
		   this.fired = false;
		   this.amount = 0;
		   return;
		}
		var distance = 5*(this.force/100);
	    if (this.currentDirection == directions["NORTH"] || this.currentDirection == directions["NORTHEAST"] || this.currentDirection == directions["NORTHWEST"]){
		   this.pos[1] -= distance; 
		   this.amount += distance;
		}
		if (this.currentDirection == directions["SOUTH"]|| this.currentDirection == directions["SOUTHEAST"] || this.currentDirection == directions["SOUTHWEST"]){
		   this.pos[1] += distance;
		   this.amount += distance;
		}
		if (this.currentDirection == directions["EAST"] || this.currentDirection == directions["NORTHEAST"] || this.currentDirection == directions["SOUTHEAST"]){
		   this.pos[0] += distance; 
		   this.amount += distance;
		}
		if (this.currentDirection == directions["WEST"] || this.currentDirection == directions["NORTHWEST"]  || this.currentDirection == directions["SOUTHWEST"]){
		   this.pos[0] -= distance;
		   this.amount += distance;
		}
		
		// check boundaries
		if (this.pos[0] < 0){
		  this.pos[0] = 0;
		  this.amount = this.force;
		}
		if(this.pos[0] > canvas.width){
		  this.pos[0] = canvas.width-8;
		  this.amount = this.force;		
		}
		if (this.pos[1] < 0){
		  this.pos[1] = 0;
		  this.amount = this.force;
		}
		if(this.pos[1] > canvas.height){
		  this.pos[1] = canvas.height-8;
		  this.amount = this.force;		
		}
	};
	
	var sphere = new Image();
	sphere.src="mat1_clear_small1.jpg";			
	
	// default input
	if (inputBinder['leftButtonMouse'] == null){
		inputBinder['leftButtonMouse'] = moveCommand;
	}
	if (inputBinder['rightButtonMouse'] == null){
		inputBinder['rightButtonMouse'] = fireCommand;
	}
	if (inputBinder['touchMove'] == null){
		inputBinder['touchMove'] = fireCommand;
	}
	menu= new Menu();	
	gameover = new Menu();
	gameover.update= function(dt){
		     this.tick += animSpeedMenu *dt;
			 if (this.click){
			    setState(state["MENU"]);
				this.click=false;
			 }
		};
		
	gameover.render= function(ctx){
			ctx.fillStyle=terrainPattern;
			ctx.fillRect(0, 0, canvas.width, canvas.height);	
			ctx.fillStyle="Gray";
			ctx.globalAlpha=0.4;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha=1;		
			ctx.textAlign = "center";
			ctx.fillStyle = "White";			
			var y = this.y;
			//title
			var size=32;		   
			size = Math.floor(size*0.8);
			var v = Math.floor((Math.random() * 255)+1);
			var gradient=ctx.createLinearGradient(0,0,canvas.width/2,0);
			if (this.tick%4<2){
				gradient.addColorStop("0","magenta");
				gradient.addColorStop("0.5","blue");
				gradient.addColorStop("1.0","red");
			}else{
				gradient.addColorStop("0","red");
				gradient.addColorStop("0.5","blue");
				gradient.addColorStop("1.0","magenta");			
			}
			if (this.tick>4){
				this.tick=0;
			}			
			ctx.fillStyle = gradient;			
			this.playRect.x = canvas.width/2;
			this.playRect.y = y;
			ctx.fillText("GAME OVER", canvas.width/2-size, y);			
		};
	ctx.fillStyle = "Black";
    ctx.fillText("Loading...",50, 50);
	setTimeout(main, 2000);	
}

function sendEvent(event){
	/*template : events.push=([eventid:0,
					  type:'GET'
		              player:players['BLUE'],
					  data:'0']);*/
    var httpRequestType = (event['type'] == null)?'POST':event['type'];
	var eventid = event['eventid'];
	var playerid = (event['playerid']==null)?-1:event['playerid'];
	var playername = event['player'];
	var data = event['data'];
	var fullData = eventid+' '+playerid+' '+playername;
	if (data != null && data != ''){
	 fullData += ' '+data+ '#';	
	}else{
	  fullData += ' #';	
	}
	if (debug){console.debug('Send event:'+httpRequestType+' '+fullData)};
	if (!window.jQuery) {
	    if (debug){console.debug('No internet, local')};
	    var newevent = {eventid:eventsCode['TIMEOUT'],
					  type:'RESPONSE',
					  playerid:playerid,
					  player:playername,
					  data:null};
		receivedEvents.push(newevent);
		return 1;
	}
	$.ajax({
       url : 'http://0.0.0.0:0000/',
       type : httpRequestType,
	   cache : false,
       dataType : 'text',
	   data : fullData,
	   timeout : mytimeout,
	    success : function(code_html, statut){
		  if (code_html != null && code_html!=''){
		  // send back same event but as a response for the client to treat
		   var newevent = {eventid:eventid,
					  type:'RESPONSE',
					  playerid:playerid,
					  player:playername,
					  data:code_html};
		   receivedEvents.push(newevent);
		     if (debug){ console.info('Received :'+code_html);}
		   }
	       
       },
       error : function(resultat, statut, erreur){
		    var newevent = {eventid:eventsCode['TIMEOUT'],
					  type:'RESPONSE',
					  playerid:playerid,
					  player:playername,
					  data:null};
			receivedEvents.push(newevent);
       }
    });   
}

function setState(newstate){
  state["previous"] = state["current"];
  state["current"] = newstate;
}

function replay(){
	setState(state["REPLAY"]);	
}

function resetPos(){
	 replaybuffer.reset();
     setState(state["BACKTOBASE"]);
	 if (!playerBlue.dead){
		playerRed.playerPosx=playerRedKO.playerPosx;
		playerRed.playerPosy=playerRedKO.playerPosy;
	 }
	 playerBlue.playerPosx=playerBlueKO.playerPosx ;
	 playerBlue.playerPosy=playerBlueKO.playerPosy;

	 playerBlue.dead=false;
	 posRed={x:0,y:0};
     posBlue={x:canvas.width,y:canvas.height};
}

var requestAnimFrame = (function(){
	return window.requestAnimationFrame ||
	window.webkitRequestAnimationFrame ||
	window.mozRequestAnimationFrame ||
	window.oRequestAnimationFrame ||
	window.msRequestAnimationFrame ||
	function(callback){
		window.setTimeout(callback, 1000 / 60);
	};
})();

var lastTime;
var gSpeed = 1000;
var replaytick = 0;
/******************
/* MAIN          */
/*****************/
function main() {
    var now = Date.now();
    var dt = (now - lastTime) / gSpeed;
	switch (state.current){
	    case state["INIT"]:
		    console.info('init');
			playerBlueKO.done = false;
			playerRedKO.done = false;
			playerRed.fx=0;
			playerRed.fy=0;
			playerBlue.fx=5*32;
			playerBlue.fy=5*32;
			if (state.previous != state["BACKTOBASE"]){
				score=0;
				spriteBall.pos[0] = canvas.width/2;
				spriteBall.pos[1] = canvas.height/2;
			}
			spriteBall.picked=false;
			receivedEvents = [];
			events = [];
			//inform server to create players 
			console.info('initRED:'+players['RED'].id+' '+players['RED'].name );
			updateAndRender(dt);
			
			if (players['RED'].id == -1){
				events.push({eventid:eventsCode['CREATEPLAYER'],
					  type:'POST',
					  playerid:players['RED'].id,
		              player:players['RED'].name,
					  data:playerRed.fx+' '+playerRed.fy+' 0.0'});
					  
				events.push({eventid:eventsCode['GETPLAYERDATA'],
					  type:'GET',
					  playerid:players['RED'].id,
		              player:players['RED'].name,
					  data:null});
			}
			if (players['BLUE'].id == -1){
				events.push({eventid:eventsCode['CREATEPLAYER'],
					  type:'POST',
					  playerid:players['BLUE'].id,
		              player:players['BLUE'].name,
					  data:playerBlue.fx+' '+playerBlue.fy+' 0.0'});
				events.push({eventid:eventsCode['GETPLAYERDATA'],
					  type:'GET',
					  playerid:players['BLUE'].id,
		              player:players['BLUE'].name,
					  data:null});

		    }
			
			setState(state["PLAYING"]);
			break;
		case state["MENU"]:
			menu.update(dt);
			if (menu != null){
				menu.render(ctx);
			}
			break;
		case state["GAMEOVER"]:
			gameover.update(dt);
			gameover.render(ctx);
			break;
		case state["REPLAY"]:
			replaytick++;
			if (replaytick%2==0){
			  // get replay buffer into a event buffer as if to play
			  deserializeReplay(replaybuffer.dequeue());
			  replaytick = 0;
	        }
			// end of buffer, clear buffer and start next round
			if (replaybuffer.isEmpty()){
				console.info('No more replay');
				resetPos();
			}
		    update(dt);
			updateAndRender(dt);
            break;
		case state["PLAYING"]:
			manageEvents();   	        
		case state["SCORE"]:
		    addreplay(now);
		case state["BACKTOBASE"]:
		    update(dt);
		case state["STANDBY"]:
	    default:
		   updateAndRender(dt);
	 }

    if (state.current == state["REPLAY"]){
		renderReplaySymbol(dt);
	}
    lastTime = now;

    requestAnimFrame(main);
};

function updateAndRender(dt){
	playerRedUpdate(dt);
	playerBlueUpdate(dt);
	spriteBallUpdate(dt);
	render();
	spriteBall.render(ctx);
	playerBlueRender();	
	playerRedRender();		
}

function addreplay(timestamp){
   // serialize information  TIMESTAMP;BLUE POS;BLUE FRAME;RED POS;RED FRAME;BALL POS;BALL VISIBLE;RED FIRING FRAME;BLUE DEAD FRAME;BLUE DEAD
   var data = timestamp+';'+playerBlue.playerPosx+';'+playerBlue.playerPosy+';'+playerBlue.fx+';'+playerBlue.fy+';'+playerRed.playerPosx+';'+playerRed.playerPosy+';'+playerRed.fx+';'+playerRed.fy+';'+spriteBall.pos[0]+';'+spriteBall.pos[1]+';'+spriteBall.picked+';'+playerRed.isFiring+';'+playerFireRed.fx+';'+playerFireRed.fy+';'+playerBlueKO.fx+';'+playerBlueKO.fy+';'+playerBlue.dead;
   replaybuffer.enqueue(data); 
}

function deserializeReplay(replayevent){
	replayeventarr = replayevent.split(";");
	var ri=0;
	replaytimestamp = replayeventarr[ri];
	ri++;
	playerBlue.playerPosx = playerBlueKO.playerPosx = parseFloat(replayeventarr[ri]);
	ri++;
	playerBlue.playerPosy = playerBlueKO.playerPosy = parseFloat(replayeventarr[ri]);
	ri++;
	playerBlue.fx = replayeventarr[ri];
	ri++;
	playerBlue.fy = replayeventarr[ri];
	ri++;
	
	playerRed.playerPosx = playerFireRed.playerPosx = parseFloat(replayeventarr[ri]);
	ri++;
	playerRed.playerPosy = playerFireRed.playerPosy =  parseFloat(replayeventarr[ri]);
	ri++;
	playerRed.fx = replayeventarr[ri];
	ri++;
	playerRed.fy = replayeventarr[ri];
	ri++;
	
	spriteBall.pos[0] = parseFloat(replayeventarr[ri]);
	ri++;
	spriteBall.pos[1] = parseFloat(replayeventarr[ri]);
	ri++;
	spriteBall.picked = (replayeventarr[ri]=="true");

	ri++;
	playerRed.isFiring = (replayeventarr[ri]=="true");

	ri++;
	playerFireRed.fx = replayeventarr[ri];
	ri++;
	playerFireRed.fy = replayeventarr[ri];

	ri++;
	playerBlueKO.fx = replayeventarr[ri];
	ri++;
	playerBlueKO.fy = replayeventarr[ri];

	ri++;
	playerBlue.dead = (replayeventarr[ri]=="true");
}

function manageEvents(){
	for(var i=0; i<events.length; i++) {
		var event = events.splice(i,1)[0];
		sendEvent(event); 
	}
	
	for(var i=0; i<receivedEvents.length; i++) {
		var event = receivedEvents.splice(i,1)[0];
		// for this sample, events are deserialized here but
		// But actors should listen to events and deal with them.
		var iax,iay;
		if (debug){ console.info('event["eventid"]:'+event.eventid);}
		switch (event['eventid']){
			case eventsCode['TIMEOUT']:
				iax = Math.floor(Math.random() * 1000)%canvas.width;
				iay = Math.floor(Math.random() * 1000)%canvas.height;
				if (debug){ console.info("Request Timeout. x="+iax+";y="+iay)};
				//message = "Request Timeout. x="+iax+";y="+iay;	
				break;
			case eventsCode['GETMOVE']:
			    //Trame example 1#BLUE#22.000#342.000#0.000
			    var data = event['data'].split('#');
				if (data[1]=='BLUE'){
					iax = data[2];
					iay = data[3];				
					if (debug){ console.debug('GETMOVE received x:'+iax+' y:'+iay);}
				}
			    break;
			case eventsCode['CREATEPLAYER']:
				break;
			case eventsCode['GETPLAYERDATA']:
			    var data = event['data'].split('#');
				players[data[1]].id=data[0];
				// todo set pos values ?
				if (debug){ console.info('GETPLAYERDATA received :'+data);}
				break;
			default:
		}
		posBlue.x = iax;
		posBlue.y = iay;
	}
};

/* RED player*/
function playerRedUpdate(dt){
    switch (state.current){
	   case state["PLAYING"]:
	   case state["SCORE"]:
	        var command = handleInput();
			if (command != null){
				command.execute(playerRed);
			}
	   case state["BACKTOBASE"]:
			if (playerRed.isFiring){
				playerFireRed.playerPosx = playerRed.playerPosx;
			    playerFireRed.playerPosy = playerRed.playerPosy;
				playerFireRed.update(dt,posRed);
				if (playerFireRed.done){
					playerRed.isFiring = false;
					playerFireRed.done = false;
				}
			}else{
				playerRed.update(dt,posRed);
			}
			break;
	   case state["STANDBY"]:
			if (playerRedKO.done){
			   playerRedKO.fx = playerRedKO.frames.anim[0].pos[0];
			   playerRedKO.fy = playerRedKO.frames.anim[0].pos[1];
			}else{
				playerRedKO.update(dt,posRed);
			}
			break;
		default:
	}	
}

function playerRedRender(){
    switch (state.current){
	    case state["STANDBY"]:
			playerRedKO.render(ctx);
		    break;
		default:
			if (playerRed.isFiring){
				playerFireRed.render(ctx);
			}else{
				playerRed.render(ctx);
			}		
	}	
}

/* BLUE player*/
function playerBlueUpdate(dt){
     switch (state.current){
	    case state["PLAYING"]:
		case state["BACKTOBASE"]:
		case state["SCORE"]:
			if (playerBlue.dead){
				playerBlueKO.update(dt,posBlue);
			}else{
				playerBlue.update(dt,posBlue);
			}
			break;
		case state["STANDBY"]:
			if (playerBlueKO.done){
				playerBlueKO.fx = playerBlueKO.frames.anim[0].pos[0];
				playerBlueKO.fy = playerBlueKO.frames.anim[0].pos[1];
			}else{
				playerBlueKO.update(dt,posBlue);
			}
			break;
	     default:
		    break;
	 }    
}

function playerBlueRender(){
	if (state.current==state["STANDBY"] || playerBlue.dead){
	 	playerBlueKO.render(ctx);
	}else{
		playerBlue.render(ctx);
	}
}
/* ******* */
function spriteBallUpdate(dt){
     switch (state.current){
	    case state["PLAYING"]:
		case state["BACKTOBASE"]:
		case state["SCORE"]:
		case state["STANDBY"]:
			spriteBall.update(dt,null);	   
			break;
	     default:
		    break;
	 }    
}

function handleInput(){
   var leftclick = window.InputEvent != null ?(window.InputEvent.button == 0):null;
   var rightclick = window.InputEvent != null ?(window.InputEvent.button == 2):null;
   window.InputEvent = null;// command in streams later
   if (leftclick) return inputBinder['leftButtonMouse'];
   if (rightclick) return inputBinder['rightButtonMouse'];
   if (isTouchmove) return inputBinder['touchMove'];
   return null;   
}

function update(dt){
     switch (state.current){
	    case state["PLAYING"]:
			if (boxCollides([playerRed.playerPosx,playerRed.playerPosy], [32,32], [spriteBall.pos[0],spriteBall.pos[1]], [8,8])){
				if (!spriteBall.isPicked() && spriteBall.fired == false ){
					spriteBall.setPicked();
				}
			}
			
			if (boxCollides([playerBlue.playerPosx,playerBlue.playerPosy], [30,30], [spriteBall.pos[0],spriteBall.pos[1]], [8,8])){
				if (spriteBall.fired == true && playerBlue.dead==false){
					console.info("Player Blue hit!");
					// start anim blue fall only
					posBlue.x = playerBlueKO.playerPosx = playerBlue.playerPosx;
					posBlue.y = playerBlueKO.playerPosy = playerBlue.playerPosy;
					playerBlue.dead=true;
					// Wait 2 seconds before replay while animation KO is over
					setTimeout(function(){ replay();},2000);
					events.push({eventid:eventsCode['SCORE'],
						  type:'POST',
						  playerid:players['RED'].id,
						  player:players['RED'],
						  data:''});
					score+=1;
					setState(state["SCORE"]);				
				}
			}
			
			if (boxCollides([playerRed.playerPosx,playerRed.playerPosy], [25,25], [playerBlue.playerPosx,playerBlue.playerPosy], [25,25]) && !playerBlue.dead){
				// where we want the anim to stop (x axis only)
				if (playerRed.playerPosx <posRed.x){
					posRed.x = playerRed.playerPosx-80<0?0:playerRed.playerPosx-80;
				}else{
					posRed.x = playerRed.playerPosx+80>canvas.width?canvas.width-32:playerRed.playerPosx+80;
				}
				posRed.y = playerRed.playerPosy;
				// anim start where player is
				playerRedKO.playerPosx = playerRed.playerPosx;
				playerRedKO.playerPosy = playerRed.playerPosy;
				

				if (playerBlue.playerPosx <posBlue.x){
					posBlue.x = playerBlue.playerPosx-80<0?0:playerBlue.playerPosx-80;
				}else{
					posBlue.x = playerBlue.playerPosx+80>canvas.width?canvas.width-32:playerBlue.playerPosx+80;
				}
				posBlue.y = playerBlue.playerPosy;

				playerBlueKO.playerPosx = playerBlue.playerPosx;
				playerBlueKO.playerPosy = playerBlue.playerPosy;
				if (debug) console.info("hit, return to base!");
				if  (!!icecreamAudio.canPlayType && icecreamAudio.canPlayType('audio/wav') != ""){
					icecreamAudio.play();
				}
				// Wait 2 seconds before returning to base
				setTimeout(function(){ resetPos();},2000);
				setState(state["STANDBY"]);
			}
			break;
			//message=playerRedKO.done+"playerRed.fx:"+playerRed.fx+" playerRedKO.fx:"+playerRedKO.fx;
		case state["BACKTOBASE"]:
				// sb guys are in place, start new game
				if (Math.floor(playerRed.playerPosx)<=0 && Math.floor(playerRed.playerPosy)<=0
				 && Math.floor(playerBlue.playerPosx)>canvas.width-35 && Math.floor(playerBlue.playerPosy)>canvas.height-35){
					// init frame pos
					if (state.previous==state["STANDBY"]){
						events.push({eventid:eventsCode['END'],
						  type:'POST',
						  playerid:players['RED'].id,
						  player:players['RED'],
						  data:''});

						setState(state["GAMEOVER"]);
					}else{
						setState(state["INIT"]);
					}
					message = "";
				}
		default:
	}
};

var tick = 0;
function renderReplaySymbol(dt){
	 tick += animSpeedMenu *dt;
	// make it flash
	if (tick%4<2){
	  ctx.font = '18pt Calibri';
	  ctx.fillStyle = 'black';
	  ctx.textAlign = "left";
	  ctx.fillText("REPLAY", canvas.width/2-30, 18);		
	}
	
	if (tick>4){
		tick=0;
	}			
			
}

function render(){
	ctx.fillStyle=terrainPattern;
	ctx.fillRect(0, 0, canvas.width, canvas.height);	
	
	ctx.font = '18pt Calibri';
	ctx.fillStyle = 'black';
	ctx.textAlign = "left";
	ctx.fillText("Score: " +score, canvas.width-(18*6), 18);
	
	if (debug){
		//ctx.font = '18pt Calibri';
		//ctx.fillStyle = 'black';
		//ctx.textAlign = "left";
		//ctx.fillText("Message =" +message, 0, canvas.height-20);
	}
};

//collisions helpers
function collides(x, y, r, b, x2, y2, r2, b2) {
    return !(r <= x2 || x > r2 ||
             b <= y2 || y > b2);
};

function boxCollides(pos, size, pos2, size2) {
    return collides(pos[0], pos[1],
                    pos[0] + size[0], pos[1] + size[1],
                    pos2[0], pos2[1],
                    pos2[0] + size2[0], pos2[1] + size2[1]);
};