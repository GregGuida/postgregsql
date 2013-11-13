var db = Database(14);

var createCAP2 = (function(){
    var customer = [];
    customer[0] = {name:"cid", type:"chr4", nullable:false};
    customer[1] = {name:"name", type:"chr8", nullable:true};
    customer[2] = {name:"city", type:"chr8", nullable:true};
    customer[3] = {name:"discount", type:"int2", nullable:true};
    db.createTable( "Customer" , customer );

    var agent = [];
    agent[0] = {name:"aid", type:"chr3", nullable:false};
    agent[1] = {name:"name", type:"chr8", nullable:true};
    agent[2] = {name:"city", type:"chr8", nullable:true};
    agent[3] = {name:"percent", type:"int2", nullable:true};
    db.createTable( "Agent" , agent );

    var product = [];
    product[0] = {name:"pid", type:"chr3", nullable:false};
    product[1] = {name:"name", type:"chr8", nullable:true};
    product[2] = {name:"city", type:"chr8", nullable:true};
    product[3] = {name:"quantity", type:"int6", nullable:true};
    product[4] = {name:"priceUSD", type:"chr6", nullable:true};
    db.createTable( "Product" , product );
    
    var order = [];
    order[0] = {name:"ordno", type:"int4", nullable:false};
    order[1] = {name:"mon", type:"chr3", nullable:true};
    order[2] = {name:"cid", type:"chr4", nullable:false};
    order[3] = {name:"aid", type:"chr3", nullable:false};
    order[4] = {name:"pid", type:"chr3", nullable:false};
    order[5] = {name:"qty", type:"int4", nullable:true};
    order[6] = {name:"dollars", type:"chr6", nullable:true};
    db.createTable( "Order" , order );

    
    //begin inserts
    db.insertInto("Customer", ["c001", "Tiptop",  "Duluth", 10] );
    db.insertInto("Customer", ["c002", "Basics",  "Dallas", 12] );
    db.insertInto("Customer", ["c003", "Allied",  "Dallas", 8] );
    db.insertInto("Customer", ["c004", "ACME",    "Duluth", 8] );
    db.insertInto("Customer", ["c005", "Weyland", "Acheron", 0] );
    db.insertInto("Customer", ["c006", "ACME",    "Kyoto", 0] );
    
    db.insertInto("Agent", ["a01", "Smith", "New York", 6] );
    db.insertInto("Agent", ["a02", "Jones", "Newark", 6] );
    db.insertInto("Agent", ["a03", "Brown", "Tokyo", 7] );
    db.insertInto("Agent", ["a04", "Gray", "New York", 6] );
    db.insertInto("Agent", ["a05", "Otasi", "Duluth", 5] );
    db.insertInto("Agent", ["a06", "Smith", "Dallas", 5] );
    db.insertInto("Agent", ["a08", "Bond", "London", 7] );

    db.insertInto("Product", ["p01", "comb",   "Dallas", 111400, "0.50"] );
    db.insertInto("Product", ["p02", "brush",  "Newark", 203000, "0.50"] );
    db.insertInto("Product", ["p03", "razor",  "Duluth", 150600, "1.00"] );
    db.insertInto("Product", ["p04", "pen",    "Duluth", 125300, "1.00"] );
    db.insertInto("Product", ["p05", "pencil", "Dallas", 221400, "1.00"] );
    db.insertInto("Product", ["p06", "folder", "Dallas", 123100, "2.00"] );
    db.insertInto("Product", ["p07", "case",   "Newark", 100500, "1.00"] );
    db.insertInto("Product", ["p08", "clip",   "Newark", 200600, "1.25"] );

    db.insertInto("Order", [1011, "jan", "c001", "a01", "p01", 1000, "450.00"] );
    db.insertInto("Order", [1013, "jan", "c002", "a03", "p03", 1000, "880.00"] );
    db.insertInto("Order", [1015, "jan", "c003", "a03", "p05", 1200, "1104.00"] );
    db.insertInto("Order", [1016, "jan", "c006", "a01", "p01", 1000, "500.00"] );
    db.insertInto("Order", [1017, "feb", "c001", "a06", "p03", 600, "540.00"] );
    db.insertInto("Order", [1018, "feb", "c001", "a03", "p04", 600, "540.00"] );
    db.insertInto("Order", [1019, "feb", "c001", "a02", "p02", 400, "180.00"] );
    db.insertInto("Order", [1020, "feb", "c006", "a03", "p07", 600, "600.00"] );
    db.insertInto("Order", [1021, "feb", "c004", "a06", "p01", 1000, "460.00"] );
    db.insertInto("Order", [1022, "mar", "c001", "a05", "p06", 400, "720.00"] );
    db.insertInto("Order", [1023, "mar", "c001", "a04", "p05", 500, "450.00"] );
    db.insertInto("Order", [1024, "mar", "c006", "a06", "p01", 800, "400.00"] );
    db.insertInto("Order", [1025, "apr", "c001", "a05", "p07", 800, "720.00"] );
    db.insertInto("Order", [1026, "may", "c002", "a05", "p03", 800, "704.00"] );

    return true;
})();

var parseSQL = function(){
	// NOOOOOOOO!!!!!!!
    var sqlRegex = /select\s+([a-zA-Z0-9]+(\s*,\s*[a-zA-Z0-9]+)*|\*)\s*from\s*([a-zA-Z0-9]+)\s*(where\s*.*)?/i
    var query = document.getElementById('SQL').value;
    var regexmatch = query.match(sqlRegex);
    var result = db.select(regexmatch[3],regexmatch[1],regexmatch[4]);
    var resultSpace = document.getElementById("results")
    for( i in result){
        for (field in result[i]){
            resultSpace.innerHTML += result[i][field]+" : "
        }
        resultSpace.innerHTML += '<br/>'
    }
};

var unHex = function(){
    var hexToString = function( hex ){

        result = "";

        for ( var i = 0; i < hex.length; i=i+2 ){
            if ( hex.substr(i,2) != "FF" ){
                result += String.fromCharCode( parseInt(hex.substr(i,2), 16));
            }
        }

        return result;

    };
    td = document.getElementsByTagName('td');
    for(var i = 0; i<td.length; i++){
        td[i].innerHTML =  hexToString(td[i].innerHTML)
    }
}