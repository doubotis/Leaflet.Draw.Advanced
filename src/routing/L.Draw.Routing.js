L.Draw.Routing = L.Class.extend({
    
    initialize: function (greeter) {
        this.greeter = greeter;
        // class constructor
    },
    
    greet: function (name) {
        alert(this.greeter + ', ' + name)
    }
});