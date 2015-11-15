// Menu object
(function() {
    function Menu() {
	  this.playRect = {x:0,y:0,w:200,h:200};
	  this.click = false;
	  this.y = canvas.height/2;
	  this.indexLetter = 0;
	  this.tick = 0;
	};
		
	Menu.prototype = {
		input: function(pos){
			this.click=true;
		},
		
		update: function(dt){
		     this.tick += animSpeedMenu *dt;
			 if (this.click){
			    setState(state["INIT"]);
				this.click=false;
			 }
		},
		
		render: function(ctx){
			ctx.fillStyle=terrainPattern;
			ctx.fillRect(0, 0, canvas.width, canvas.height);	

			ctx.fillStyle="Gray";
			ctx.globalAlpha=0.4;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.globalAlpha=1;
		
			//var lingrad = ctx.createLinearGradient(0,0,0,canvas.height);
			//lingrad.addColorStop(0, '#000');
			//lingrad.addColorStop(1, '#023');
			//ctx.fillStyle = lingrad;
			//ctx.fillRect(0,0,canvas.width, canvas.height);
			ctx.textAlign = "center";
			ctx.fillStyle = "White";
			
			var y = this.y;
			//title
			var size=24;
			ctx.font = Math.floor(size*1.3).toString() + "px Times New Roman";
			ctx.fillText("Hit the Blue guy", canvas.width/2, y);
			y += 80;
		   
			size = Math.floor(size*(DetectIphoneOrIpod()?0.7:0.8));
			var v = Math.floor((Math.random() * 255)+1);
			//ctx.fillStyle = "rgba(255,255,"+v.toString()+",255)";
			
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
			
			//ctx.font = size.toString() + "px Times New Roman";
			this.playRect.x = canvas.width/2;
			this.playRect.y = y;
			if (DetectIphoneOrIpod()){
				ctx.fillText("Tap screen to play", canvas.width/2-size, y);
			}else{
				ctx.fillText("Click to play", canvas.width/2-size, y);
			}
			var size2 = Math.floor(size*0.7);
		    ctx.fillStyle = "White";
			ctx.textAlign = "left";
			ctx.font = Math.floor(size2).toString() + "px Times New Roman";
			if (DetectIphoneOrIpod()){
				ctx.fillText("Instructions: Tap screen / Red moves, Move on screen / Red shoots, you lose if you touch Blue", 0, canvas.height-size2);
			}else{
				ctx.fillText("Instructions: left click / Red moves, right click / Red shoots, you lose if you touch Blue", 0, canvas.height-size2);
			}
			
		}
	};
 window.Menu = Menu;
})();
