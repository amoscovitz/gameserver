// Queue class 
class Queue 
{ 
    // Size is used for data rotation
    constructor(size) 
    { 
	    this.size = size;
        this.items = [];
    } 
                  
	enqueue(element) 
	{  
         // If max size reached, remove the first one and add current to the queue
        if (this.items.length == this.size) {
			this.dequeue();
		}
		// adding element to the queue 
		this.items.push(element); 
	} 

	dequeue() 
	{ 
		// removing element from the queue 
		// returns underflow when called  
		// on empty queue 
		if(this.isEmpty()) 
			return "Underflow"; 
		return this.items.shift(); 
	} 
    front() 
	{ 
		// returns the Front element of  
		// the queue without removing it. 
		if(this.isEmpty()) 
			return "No elements in Queue"; 
		return this.items[0]; 
	} 

    isEmpty() 
	{ 
		// return true if the queue is empty. 
		return this.items.length == 0; 
	} 

	printQueue() 
	{ 
		var str = ""; 
		for(var i = 0; i < this.items.length; i++) 
			str += this.items[i] +" "; 
		return str; 
	} 
	
	size(){
		return this.items.length;
	}
	
	reset(){
		this.items = [];
	}
} 