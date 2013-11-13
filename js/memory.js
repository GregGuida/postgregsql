function Memory( numberOfBlocks ) {

    if( numberOfBlocks > 14 ){
        alert('max mem size 14 blocks');
        return;
    }

    var memObject = {}
    var memory = [];
    var container = document.getElementById("Memory");


    //This is where we make the tables that act as our memory blocks
    //By using document.createElement we can grab a reference to the element that persists even after we attach it to the DOM
    //I place all those references in an array so that we can have easy access to their innerHTML without tree traversal or calling getElementByID all the time

    for ( var block = 0; block < numberOfBlocks; block++ ){
        var blockContainer = document.createElement('div');
        blockContainer.id = "block"+block+"container";
        blockContainer.className = "blockContainer";
        blockContainer.innerHTML = '<h4>BLOCK '+block+'</h4>';

        var blockEl = blockContainer.appendChild( document.createElement('table') );
        memory[block] = [];
        blockEl.id="block"+block;
        blockEl.className="block";

        blockEl.innerHTML = '<tr class="header"><td></td><td>00</td><td>01</td><td>02</td><td>03</td><td>04</td><td>05</td><td>06</td><td>07</td><td>08</td><td>09</td><td>0A</td><td>0B</td><td>0C</td><td>0D</td><td>0E</td><td>0F</td></tr>';

        for ( var line = 0; line < 16; line++ ){
            memory[block][line] = [];
            var lineEL = blockEl.appendChild( document.createElement('tr') );
            lineEL.innerHTML = '<td class="rowNumber">'+block.toString(16).toUpperCase()+line.toString(16).toUpperCase()+'</td>';

            for ( var word = 0; word < 16; word++ ){
                memory[block][line][word] = lineEL.appendChild( document.createElement('td') );
                memory[block][line][word].innerHTML = "FF";
            }
        }
 
        container.appendChild(blockContainer);
 
    }

    // Takes an array of DOM objects and returns a concatenation of all their innerHTML's
    var htmlImplode = function( arr, start, end ) {

        var result = ""

        for( var i = start; i <= end; i++){
            result += arr[i].innerHTML
        }

        return result;

    };

    var hexToInt = function( hex ){

        return parseInt(hex, 16);

    };

    var intToHex = function( number ){
        var hex =  number.toString(16).toUpperCase();
        return hex;
    };

    var stringToHex = function( str ){
        var resultArr = [];

        for( var i = 0; i < str.length; i++ ) {
            resultArr[i] = str.charCodeAt(i).toString(16).toUpperCase();
        }

        return resultArr;
    };

    var findEmptySpace = function(){
        for ( var block = 0; block < numberOfBlocks; block++ ) {
            for ( var frame = 0; frame < 16; frame++ ) {
                if ( memory[block][frame][0].innerHTML == "FF" ){
                    return [ block, frame ];
                }
            }
        }
        alert('OUT OF MEMORY');
    }


    //read records is for pulling all of the records with id = "recordID"
    memObject.readRecords = function( recordID ){
        var record = [];
        var foundRecords = 0;

        // memory has fixed frame sizes so if we need to store more than 1
        // frame's worth of info we need to use more than frame.
        // we acheive this by using the last 2 bytes in the frame and storing
        // the address of the next frame

        // This function follows those links and concatenates the data
        var followLink = function( block, frame ) {
            var nextLinkAddr = memory[block][frame][15].innerHTML;

            if ( nextLinkAddr == "FF" ){
                return htmlImplode( memory[block][frame], 1, 14 );
            } else {
                return htmlImplode( memory[block][frame], 1, 14 ) + followLink(hexToInt(nextLinkAddr.charAt(0)),hexToInt(nextLinkAddr.charAt(1)));
            }
        }

        for( var block = 0; block < numberOfBlocks; block++ ) {
            for( var frame = 0; frame < 16; frame++ ){
                if ( memory[block][frame][0].innerHTML == recordID ){
                    record[ intToHex(block)+intToHex(frame) ] = htmlImplode( memory[block][frame], 1, 14 );
                    var linkAddr = memory[block][frame][15].innerHTML;
                    
                    if (linkAddr != "FF") {
                        record[intToHex(block)+intToHex(frame)] += followLink(hexToInt(linkAddr.charAt(0)),hexToInt(linkAddr.charAt(1)));
                    }

                    foundRecords++;
                }
            }
        }

        return record;
    };

    memObject.writeRecord = function(recordID, recordData){
        
        var memAdr = findEmptySpace();
        memory[memAdr[0]][memAdr[1]][0].innerHTML = recordID;
        
        var wordNo = 1;
        for ( var i = 0; i < recordData.length; i=i+2 ) {
            if ( wordNo == 15 ){
                // if we run out of space in one frame, find another free frame
                var oldMemAddr = memAdr
                wordNo = 1;
                memAdr = findEmptySpace();
                memory[memAdr[0]][memAdr[1]][0].innerHTML = "FE";
                // but dont forget to link the frame before it v
                memory[oldMemAddr[0]][oldMemAddr[1]][15].innerHTML = intToHex(memAdr[0])+intToHex(memAdr[1])
            }
            
            memory[memAdr[0]][memAdr[1]][wordNo].innerHTML = recordData.substr(i,2);
            wordNo++
        }

         memory[memAdr[0]][memAdr[1]][15].innerHTML = "FF"
    };

    var resetFrame = function (addr) {
        var block = parseInt(addr.charAt(0),16);
        var frame = parseInt(addr.charAt(1),16);
        for( var word = 0; word < 15; ){
            memory[block][frame][word].innerHTML = "FF";
        }

        if(memory[block][frame][15].innerHTML !== "FF"){
            resetFrame(memory[block][frame][15].innerHTML);
        }
    }
    memObject.resetFrame = resetFrame;

    return memObject;
}