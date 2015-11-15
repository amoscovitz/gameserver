//handle input
(function() {
    function Command() {
	};
		
	Command.prototype = {
		execute: function(actor){
		}
	};
 window.Command = Command;
})();

fireCommand = new Command();
fireCommand.execute = function(actor) {
   actor.fire();
};

moveCommand = new Command();
moveCommand.execute = function(actor) {
   actor.move();
};
