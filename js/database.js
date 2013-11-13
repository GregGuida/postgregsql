//          _____                    _____
//         /\    \                  /\    \         This is the database class
//        /::\    \                /::\    \        It deserves an A+
//       /::::\    \              /::::\    \       
//      /::::::\    \            /::::::\    \
//     /:::/\:::\    \          /:::/\:::\    \
//    /:::/  \:::\    \        /:::/__\:::\    \
//   /:::/   /\:::\    \      /::::\   \:::\    \
//  /:::/   /  \:::\    \    /::::::\   \:::\    \
// /:::/   /    \:::\ ___\  /:::/\:::\   \:::\ ___\
///:::/___/      \:::|    |/:::/__\:::\   \:::|    |
//\:::\    \     /:::|____|\:::\   \:::\__/:::|____|
// \:::\    \   /:::/    /  \:::\   \::::::::/    /
//  \:::\    \ /:::/    /    \:::\   \::::::/    /
//   \:::\    /:::/    /      \:::\   |::|~~~~~~
//    \:::\  /:::/    /        \:::\  |::|    |
//     \:::\/:::/    /          \:::\/:::|____|
//      \::::::/    /            \::::::/    /
//       \::::/    /              \::::/    /
//        \::/____/                \::/____/




function Database ( numberOfBlocks ){

    // Private CONSTANTS
    var STORAGE_SIZE = numberOfBlocks * 256;
    var SYSTABLES_ID = "00";
    var SYSCOLS_ID = "01";

    // Private variables
    var nextTableId = 2;
    var memory = Memory( numberOfBlocks );
    var storageBytes = [];

    var db = {};

    db.memory = memory;

    var validTableID = function( hex ){
        num = parseInt(hex);
        if ( !!num && num >= 0 && num <= 253){
            return true
        } else {
            return false;
        }
    }

    var getNextValidTableID = function() {
        var id = intToHex( nextTableId, 2 );
        nextTableId++;
        return id;
    }

    var hexToString = function( hex ){

        result = "";

        for ( var i = 0; i < hex.length; i=i+2 ){
            if ( hex.substr(i,2) != "FF" ){
                result += String.fromCharCode( parseInt(hex.substr(i,2), 16));
            }
        }

        return result;

    };
    var hexToInt = function( hex ){

        return parseInt(hex, 16);

    };

    var intToHex = function( number, len ){
        var hex =  Math.floor(number).toString(16).toUpperCase();
        while (hex.length < len){
            hex = "0"+hex;
        }
        return hex;
    };

    var stringToHex = function( str, len ){
        var resultStr = "";

        for( var i = 0; i < len; i++ ) {
            if (i < str.length){
                resultStr += str.charCodeAt(i).toString(16).toUpperCase();
            } else {
                resultStr += "FF";
            }
        }

        return resultStr;
    };

    
    var initSystemTables = function() {
        //Add SysTables to the DB
        memory.writeRecord(SYSTABLES_ID,SYSTABLES_ID+stringToHex("SysTbls",8));
        memory.writeRecord(SYSTABLES_ID,SYSCOLS_ID+stringToHex("SysCols",8));

        //add systables collumns to syscolls
        memory.writeRecord(SYSCOLS_ID, SYSTABLES_ID + stringToHex("tid",8) + stringToHex("int2",4) + intToHex(0,2));
        memory.writeRecord(SYSCOLS_ID, SYSTABLES_ID + stringToHex("name",8) + stringToHex("chr8",4) + intToHex(0,2));

        //add syscolls cols to syscolls
        memory.writeRecord(SYSCOLS_ID, SYSCOLS_ID + stringToHex("tid",8) + stringToHex("int2",4) + intToHex(0,2));
        //CID not necessary... tid + name is compound key.
        memory.writeRecord(SYSCOLS_ID, SYSCOLS_ID + stringToHex("name",8) + stringToHex("chr8",4) + intToHex(0,2));
        memory.writeRecord(SYSCOLS_ID, SYSCOLS_ID + stringToHex("type",8) + stringToHex("chr8",4) + intToHex(0,2));
        memory.writeRecord(SYSCOLS_ID, SYSCOLS_ID + stringToHex("nullable",8) + stringToHex("int2",4) + intToHex(0,2));
    }
    
    initSystemTables();


    var getTableIdByName = function( name ){
        var tables = memory.readRecords("00");
        for( var i in tables ){
            if( hexToString(tables[i].substr(2,16)) == name ) {
                return tables[i].substr(0,2);
            }
        }
        return false;
    }

    var getTableCols = function ( tableID ){
        var tableCols = [];
        var sysCols = memory.readRecords( SYSCOLS_ID );
        //console.log(sysCols);
        for ( var i in sysCols ) {
            if ( sysCols[i].substr(0,2) == tableID ) {
                var fieldName = hexToString(sysCols[i].substr(2,16));
                var fieldType = hexToString(sysCols[i].substr(18,8));
                var nullable = hexToInt(sysCols[i].substr(26,2));
                //console.log( fieldName+" "+fieldType+" "+nullable );
                //console.log( i+" : "+sysCols[i] );

                tableCols[fieldName] = {};

                tableCols[fieldName].fieldType = fieldType;
                tableCols[fieldName].nullable = nullable;
            }
        }

        return tableCols;
    }
    db.getTableCols = getTableCols

    var writeTableCol = function ( tableID, name, type, nullable ){
        //first check tableID
        if ( !validTableID(tableID) ) {
            return {status:"error",message:"Invalid Table"};
        }

        //check that name doesn't already exist
        var petc = getTableCols(tableID);
        if ( !!petc[name] ) {
            return {status:"error",message:"Collumn "+name+" already exists"};
        }

        //check that type is correct
        if ( type.substr(0,3) != "chr" && type.substr(0,3) != "int" ){
            return {status:"error",message: type+" is invalid type (0)"};
        } else if (type.substr(0,3) == "chr" && ( parseInt(type.charAt(3)) < 1 || parseInt(type.charAt(3)) > 16 )){
            return {status:"error",message:type+" is invalid type (1)"};
        } else if (type.substr(0,3) == "int" && (type.charAt(3) != "2" && type.charAt(3) != "4" && type.charAt(3) != "6" && type.charAt(3) != "8")){
            return {status:"error",message:type+" is invalid type (2)"};
        }

        if( typeof nullable != "boolean" ){
            return {status:"error",message:"nullable must either be true or false"};
        }

        //everything checks out, add the collumn

        var rowData = ""+tableID+stringToHex(name,8)+ stringToHex(type,4);
        rowData += (nullable)? "01" : "00";
        memory.writeRecord( SYSCOLS_ID, rowData );
        return {status:"sucess", message: rowData };
    }

    var writeRow = function( tableID, values ) {
        if ( !validTableID(tableID) ){
            return {status:"error",message:"Invalid Table"};
        }
        //console.log(tableID)
        var tableCols = getTableCols(tableID);

        var tempRowString = "";

        for (var fieldName in tableCols){
            var fieldType = tableCols[fieldName].fieldType.substr(0,3);
            var fieldTypeLength = tableCols[fieldName].fieldType.charAt(3);
            var nullable = tableCols[fieldName].nullable;

            if( nullable === 0 && !values[fieldName] ){
                return {status:"error", message: "Field \""+fieldName+"\" Cannot Be Null"}
            } else if ( nullable === 1 && !values[fieldName] ){
                 if ( fieldType == "int" ) {
                    tempRowString += intToHex(0, fieldTypeLength );
                } else if ( fieldType == "chr" ) {
                    tempRowString += stringToHex("",fieldTypeLength);
                }
            } else {
                if ( fieldType == "int" ) {

                    tempRowString += intToHex(values[fieldName], fieldTypeLength );

                } else if ( fieldType == "chr" ) {

                    tempRowString += stringToHex(values[fieldName],fieldTypeLength);

                }
            }
        }

        memory.writeRecord( tableID, tempRowString );
        return {status:"sucess", message:tempRowString};
    }
    db.writeRow = writeRow;
    
    var readTable = function( tableID ) {
        if ( !validTableID(tableID) ){
            return {status:"error",message:"Invalid Table"};
        }

        var tableCols = getTableCols( tableID );
        var hexRows = memory.readRecords( tableID );
        var rows = []

        for ( var rowNum in hexRows){
            var scanner = 0;
            rows[rowNum] = [];

            //console.log( rowNum+" : "+hexRows[rowNum] );

            for (var fieldName in tableCols){
                var fieldType = tableCols[fieldName].fieldType.substr(0,3);
                var fieldTypeLength = parseInt(tableCols[fieldName].fieldType.charAt(3));

                if ( fieldType == "int" ) {
                    rows[rowNum][fieldName] = hexToInt(hexRows[rowNum].substr(scanner, fieldTypeLength));
                    scanner = scanner + fieldTypeLength;
                } else if ( fieldType == "chr" ) {
                    rows[rowNum][fieldName] = hexToString(hexRows[rowNum].substr(scanner,fieldTypeLength *2));
                    scanner = scanner + fieldTypeLength*2;
                }
            }
        }

        return rows;
    }
    db.readTable = readTable;

    var PGScreateTable = function( tableName, cols ) {

        var tableID = getNextValidTableID();
        // WOHOOOO we made a table!!
        for (var i = 0; i < cols.length; i++){
            var result = writeTableCol( tableID, cols[i].name, cols[i].type, cols[i].nullable );
            if (result.status === "error"){
                console.log("ERROR: "+result.mesage);
                nextTableId--;
                return result;
            }
        }

        memory.writeRecord( SYSTABLES_ID, tableID + stringToHex(tableName ,8) );
        return tableID;
    }
    db.createTable = PGScreateTable;

    //var PGSdeleteRows = function( from, where ) {
    //
    //}
    //db.deleteRows = PGSdeleteRows;

    var PGSinsertInto = function( tableName, vals, cols ) {
        var tableID = getTableIdByName( tableName );

        if( !!cols ){
            // we are specifying the collumns to write into the db
            if( cols.length !== vals.length ){
               alert("ERROR: Incorrect number of values for columns specified")
            }

            newRow = {};
            for( var i = 0; i < vals.length; i++ ){
                newRow[cols[i]] = vals[i];
            }

        } else {
            //assume that they are imputing values for each coll
            var tableCols = getTableCols( tableID );
            var i = 0, newRow = {};
            for( var fieldName in tableCols ){
                newRow[fieldName] = vals[i];
                i++;
            }
        }
        
        return db.writeRow( tableID, newRow);
    }
    db.insertInto = PGSinsertInto;

    var PGSselect = function( tableName, cols /*, joins */, where ) {

        //console.log(tableName+" "+cols+" "+where)

        var tableID = getTableIdByName( tableName )
        var table = readTable( tableID );
        var matchingTable = [];
        
        //parse where clause
        var parseWhere = function( where ){
            
            var comparison = function( string ) {
                string = string.replace(/\s/g,'');
                var pos;

                if ( (pos = string.search(/=/)) !== -1){
                    return (table[row][string.slice(0,pos)] == string.slice(pos+1));
                } else if ( (pos = string.search(/<>/)) !== -1){
                    return (table[row][string.slice(0,pos)] != string.slice(pos+2));
                } else if ( (pos = string.search(/>/)) !== -1){
                    return (table[row][string.slice(0,pos)] > string.slice(pos+1));
                } else if ( (pos = string.search(/>=/)) !== -1){
                    return (table[row][string.slice(0,pos)] >= string.slice(pos+2));
                } else if ( (pos = string.search(/</)) !== -1){
                    return (table[row][string.slice(0,pos)] < string.slice(pos+1));
                } else if ( (pos = string.search(/<=/)) !== -1){
                    return (table[row][string.slice(0,pos)] <= string.slice(pos+2));
                } else {
                    return "Error"
                }
            };
            
            var pos;
            if((pos = where.search(/and/i)) !== -1 ){
                return (parseWhere(where.slice(0,pos)) && parseWhere(where.slice(pos+3)));
            }else if( (pos = where.search(/or/i)) !== -1){
                return (comparison(where.slice(0,pos)) || parseWhere(where.slice(pos+2)));
            }else{
                return comparison(where)
            }
            
        }

        for( var row in table ){
            if( !!where && parseWhere(where) ){
                matchingTable[matchingTable.length] = table[row];
            } else if (!where){
                matchingTable[matchingTable.length] = table[row];
            }
        }



        if (cols == "*"){
            return matchingTable;
        } else {
            var selectedTable = [];
            cols = cols.replace(/\s*/g,'').split(",");
            for( var j = 0; j < matchingTable.length; j++ ){
                selectedTable[j] = [];
                for( var k = 0; k < cols.length; k++ ){
                    selectedTable[j][cols[k]] = matchingTable[j][cols[k]];
                }
            }
            return selectedTable;
        }

    }
    db.select = PGSselect;

    var PGSdelete = function( tableName, cols, where ) {
        //TODO

    }

    return db;
}