// Sprite object
var directions={
   NORTH: 'N',
   SOUTH: 'S',
   EAST: 'E',
   WEST: 'W',
   NORTHWEST: 'NW',
   SOUTHWEST: 'SW',
   NORTHEAST: 'NE',
   SOUTHEAST: 'SE'
};


(function() {
    function Sprite(name, url, pos, size, speed, speedRatio, frames, initFrame, oneloop) {
		this.name = name;
        this.pos = pos;
        this.size = size;
        this.speed = typeof speed === 'number' ? speed : 0; // how fast the animation loop
		this.speedRatio = typeof speed === 'number' ? speedRatio : 10; // how fast sprite move
        this.frames = frames;
        this._index = 0;
        this.url = url;
		this.animRightIndex = 0;
		this.animLeftIndex = 0;
		this.animUpIndex = 0;
		this.animDownIndex = 0;
		this.animLeftDownIndex = 0;
		this.animLeftUpIndex = 0;
		this.animRightDownIndex = 0;
		this.animRightUpIndex = 0;
		this.fx=initFrame[0];
		this.fy=initFrame[1];
		this.playerPosx=pos[0];
		this.playerPosy=pos[1];
		this.done=false;
		this.oneloop=oneloop;
		this.frameLength = frames == null ? 0:frames.length;
		this.animIndex=0;
		this.currentDirection=directions['NORTH'];
    };

    Sprite.prototype = {
        update: function(dt,newpos) {
			var left = false;
			var right = false;
			var up = false;
			var down = false;
			var currentAnim=0;

			if(this.oneloop) {	
				if (this.done){
					this.fx = this.frames.anim[currentAnim].pos[0];
					this.fy = this.frames.anim[currentAnim].pos[1];
					return;
				}
				
				if (this.playerPosx < newpos.x-32){
					this.playerPosx += this.speed * dt * this.speedRatio;
				}else if (this.playerPosx > newpos.x){
					this.playerPosx -= this.speed * dt * this.speedRatio;				
				}
				this.animIndex += this.speed * dt;
				currentAnim = Math.floor(this.animIndex)%this.frameLength;
				//console.info(this.name+" done:"+this.done+" this.animIndex:"+this.animIndex+" currentAnim:"+currentAnim+" "+(this.frameLength-1)+" dt:"+dt);
				//alert(this.name+" done:"+this.done+" this.animIndex:"+this.animIndex+" "+(this.frameLength-1)+" pos:"+this.playerPosx+" new:"+newpos);
				if (currentAnim>= this.frameLength-1){
     			 //  console.info("done2:"+this.animIndex+" "+(this.frameLength-1));
					this.done = true;
					this.animIndex=0;
					return;
				}
				this.fx = this.frames.anim[currentAnim].pos[0];
				this.fy = this.frames.anim[currentAnim].pos[1];
				return;
            }
						
			if (this.playerPosx < newpos.x-32){
				this.playerPosx += this.speed * dt * this.speedRatio;
				this.animRightIndex += this.speed * dt;
				//this.animRightIndex += animSpeed * dt;
				animIndex = Math.floor(this.animRightIndex)%this.frameLength;
				this.fx = this.frames.animRight[animIndex].pos[0];
				this.fy = this.frames.animRight[animIndex].pos[1];
				right = true;
				this.currentDirection=directions['EAST'];
			}else if (this.playerPosx > newpos.x){
				this.playerPosx -= this.speed * dt * this.speedRatio;
				this.animLeftIndex += this.speed * dt;
				//this.animLeftIndex += animSpeed * dt;
				animIndex = Math.floor(this.animLeftIndex)%this.frameLength;
				this.fx = this.frames.animLeft[animIndex].pos[0];
				this.fy = this.frames.animLeft[animIndex].pos[1];
				left = true;
  			    this.currentDirection=directions['WEST'];
			}
			
			if (this.playerPosy < newpos.y-32){
				this.playerPosy += this.speed * dt * this.speedRatio;
				this.animDownIndex += this.speed * dt;
				animIndex = Math.floor(this.animDownIndex)%this.frameLength;
				this.fx = this.frames.animDown[animIndex].pos[0];
				this.fy = this.frames.animDown[animIndex].pos[1];
				down = true;
				this.currentDirection=directions['SOUTH'];
			}else if (this.playerPosy > newpos.y){
				this.playerPosy -= this.speed * dt * this.speedRatio;
				this.animUpIndex += this.speed * dt;
				animIndex = Math.floor(this.animUpIndex)%this.frameLength;
				this.fx = this.frames.animUp[animIndex].pos[0];
				this.fy = this.frames.animUp[animIndex].pos[1];
				up = true;
				this.currentDirection=directions['NORTH'];
			}
			
			if (left && down){
				this.animLeftDownIndex += this.speed * dt;
				animIndex = Math.floor(this.animLeftDownIndex)%this.frameLength; 
				this.fx = this.frames.animLeftDown[animIndex].pos[0];
				this.fy = this.frames.animLeftDown[animIndex].pos[1];
				this.currentDirection=directions['SOUTHWEST'];
			}else if (left && up){
				this.animLeftUpIndex += this.speed * dt;
				animIndex = Math.floor(this.animLeftUpIndex)%this.frameLength;
				this.fx = this.frames.animLeftUp[animIndex].pos[0];
				this.fy = this.frames.animLeftUp[animIndex].pos[1];
				this.currentDirection=directions['NORTHWEST'];
			}else if (right && down){
				this.animRightDownIndex += this.speed * dt;
				animIndex = Math.floor(this.animRightDownIndex)%this.frameLength;
				this.fx = this.frames.animRightDown[animIndex].pos[0];
				this.fy = this.frames.animRightDown[animIndex].pos[1];
				this.currentDirection=directions['SOUTHEAST'];
			}else if (right && up){
				this.animRightUpIndex += this.speed * dt;
				animIndex = Math.floor(this.animRightUpIndex)%this.frameLength;
				this.fx = this.frames.animRightUp[animIndex].pos[0];
				this.fy = this.frames.animRightUp[animIndex].pos[1];
				this.currentDirection=directions['NORTHEAST'];
			}				
			
			// reset anim
			if (this.animUpIndex >= this.frameLength){
			  this.animUpIndex=0;
			}
			if (this.animLeftIndex >= this.frameLength){
			  this.animLeftIndex=0;
			}
			if (this.animUpIndex >= this.frameLength){
			  this.animUpIndex=0;
			}
			if (this.animRightIndex >= this.frameLength){
			  this.animRightIndex=0;
			}
			if (this.animRightUpIndex >= this.frameLength){
			  this.animRightUpIndex=0;
			}
			if (this.animLeftDownIndex >= this.frameLength){
			  this.animLeftDownIndex=0;
			}
			if (this.animLeftUpIndex >= this.frameLength){
			  this.animLeftUpIndex=0;
			}
			if (this.animRightDownIndex >= this.frameLength){
			  this.animRightDownIndex=0;
			}
        },

        render: function(ctx) {    
            ctx.drawImage(this.url,
                          this.fx, this.fy,
                          this.size[0], this.size[1],
                          this.playerPosx, this.playerPosy,
                          this.size[0], this.size[1]);
        }
    };

    window.Sprite = Sprite;
})();
