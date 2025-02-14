
// Global Variables
let panelData; // = panelDataAll.ispfData.PNL; // All of the 'panel' data
// Use screenWidth/screenHeight to autosize the GUI?
let screenName; // panelData.NME // Name of the panel currently displayed ie: ISR@PRIM (ISPF Primary Options Menu)
let screenNumber; // panelData.SCR // Number identifing the screen (tab) we are on (1 digit max len)
let screenWidth; // = panelData.RWS; // Number of panel rows (204 max)
let screenHeight; // = panelData.CLS; // Number of panel columns (160 max)
let screenHandle; // = panelData.HDL; // Used internally by ISPF
let screenTitle; // = panelData.TLE; // Panel title

let cursorData; // = panelData.CUR; // Cursor position after load
let curActData; // = panelData.IFY; // Identify currently active for this panel display
let msgsData; // = panelData.MSG;   // Message for panel
let areaData; // = panelData.ARE;    // The scrollable, dynamic, and table model areas defined for this panel
let colorData; // = panelData.CHA;    // The color and highlighting defined for the character level attributes used in dynamic areas
let menuData; // = panelData.MNU;   // The action bar choices and pull-down menus for the panel
let fieldsData; // = panelData.FLD; // The input/output/point-and-shoot/text fields displayed on this panel
let pfKeyData; // = panelData.KEY;  // The function keys defined for display with this panel

let buffer = ''; // Used for GenerativeAI to hold 'chunk' data until complete words/sentences are formed
let screenRows = 24; // To track how many rows the screen is (Y)
let screenCols = 80; // To track how many cols the screen is (X)

let isDarkMode = true;
let isDOMLoaded = false; // Check if the page is loaded before element changes
let isPASField = false; // Will determine whether clicking a cell does anything or not

// Main Program Logic
async function main() {
    console.log("main() started");
    // Need it global, gets created later, 2D array 
    let grid;
    // Get the ISPF Primary Options Menu
    // We are going to wait here until we 
    // get all of the data from the API
    let panelDataAll = await getISPFData();
    
    // Parse out the Panel data then parse each piece
    panelData = panelDataAll.ispfData.PNL; // All of the 'panel' data
    screenName = panelData.NME; // Name of the Panel
    screenNumber = panelData.SCR; // Active screen number (tab)
    screenWidth = panelData.RWS; // Number of panel rows (204 max)
    screenHeight = panelData.CLS; // Number of panel columns (160 max)
    screenHandle = panelData.HDL; // Used internally by ISPF
    screenTitle = panelData.TLE; // Panel title

    // Update the web browser title to show the current screen 
    document.title = "GenInsight - " + screenTitle;
    
    cursorData = panelData.CUR; // Cursor position after load
    curActData = panelData.IFY; // Identify currently active for this panel display
    msgsData = panelData.MSG;   // Message for panel
    areaData = panelData.ARE;    // The scrollable, dynamic, and table model areas defined for this panel
    colorData = panelData.CHA;    // The color and highlighting defined for the character level attributes used in dynamic areas
    menuData = panelData.MNU;   // The action bar choices and pull-down menus for the panel
    fieldsData = panelData.FLD; // The input/output/point-and-shoot/text fields displayed on this panel
    pfKeyData = panelData.KEY;  // The function keys defined for display with this panel
    
    // We are going to set some default profile settings that 
    // later can be changed with a GUI settings page
    setDefaultProfileSettings();
    
    loadPage();
} // end async function main

// Whole page (document) event listeners
document.addEventListener('DOMContentLoaded', function() {
    isDomLoaded = true;
});

/**********************************************************************/
// NodeJS Server Data Functions
/**********************************************************************/

async function getISPFData() {
    console.log("getISPFData() started");
    let hackURL = "http://10.252.109.223:3443/api/all";
    
    let response;
    
    try {
        // await before fetch
        response =  await fetch(hackURL, {
            headers: {
            }
        }); // end let response
    } catch (error) {
        // TypeError: Failed to fetch
        console.log("Fetch error:", error);
        let appNameHeader = document.getElementById("appNameHeader");
        appNameHeader.innerHTML = "SERVER ERROR - Check if the NodeJS server is up - GenInsight";
    } // end try
    
    if (response.ok) {
        // await before response
        let json = await response.json();
        console.log("json=" + json);
        console.log("json.ispfData.PNL=" + json.ispfData.PNL);
        // return all of the json, and filter out ispfData, etc. later
        return json; 
    } else {
        console.log("Error getting ISPF data from Hackathon Server, check VPN, make sure server up, and javascript running");
        console.log(response.status);
        console.log(response.statusCode);
        console.log(response.statusText);
    } // end if (response.ok)
} // end async function getISPFData()


// This will create the JSON we need to send to ISPF for any
// panel change request. The screen id is the 'tab' or window
// for a given instance
function createClientToISPFJSON(inScreenId, inName, responseType, responseId, curRow, curCol, inFields) {
    console.log("createClientToISPFJSON()");
    console.log("inFields0=" + inFields[0].NAME + "," + inFields[0].DATA + " array length=" + inFields.length + ", ObjKeysLen=" + Object.keys(inFields[0]).length);
    // Start as a string, then convert to JSON and return the JSON
    let clientToISPFString = "";
    
    //****************************************************
    // Handle the inFields variable as an array of objects
    // Each object has a NAME and a DATA property
    //****************************************************
    // Get the number of objects --- or just copy array to array?
    let inFieldsLen = inFields.length;
    // Make sure the array has something in it first before
    // iterating through it
    let inFieldsObj;
    
    let inFieldsStr = inFields[0];
    console.log("inFieldsStr=" + inFieldsStr + ", typeof=" + typeof inFieldsStr);
    
    for (let r = 0; r < inFieldsLen; r++) {
        inFieldsObj =  inFields[r];
        console.log("inFieldsObj=" + inFieldsObj.NAME + "," + inFieldsObj.DATA);
        // Some way to concatenate?
    }
    
    console.log("inFields in function=" + inFields + ", typeof=" + typeof inFields);
    
    let ctiScreenId = inScreenId; //"1";  This is the active 'tab'
    let ctiName = inName; //"ISR@PRIM"; // This is the Primary Options menu?
    let ctiResponse = {TYPE:responseType, ID:responseId}; 
    let ctiCursor = {ROW:curRow, COLUMN:curCol};
    
    // Concatenate the string and objects together
    clientToISPFString = {PANEL:{SCREENID:ctiScreenId,NAME:ctiName,RESPONSE:ctiResponse,CURSOR:ctiCursor,FIELDS:inFields}};
    console.log("clientToISPFString=" + clientToISPFString);
    //let clientToISPFJSON = JSON.stringify(clientToISPFString);
    //return clientToISPFJSON;
    return clientToISPFString;
}

// Testing zcmdData must be a string and valid, there is no input validation yet
//TODO: rewrite to be more usable---------------------------------------------------------------------------------------------------TODO
async function sendISPFData(sendISPFJson) { // used to be zcmdData
    console.log("sendISPFData() started");
    let hackURL = "http://10.252.109.223:3443/api/sendISPFData";
    
    //let sendISPFJson = JSON.stringify({"PANEL":{"SCREENID":"1","NAME":"ISR@PRIM","RESPONSE":{"TYPE":"KEY","ID":"ENTER"},"CURSOR":{"ROW":4,"COLUMN":18},"FIELDS":[{"NAME":"ZCMD","DATA":zcmdData}]}});
    //console.log("sendISPFJson=" + sendISPFJson + ", typeof=" + typeof sendISPFJson);
    //let temp = JSON.stringify(sendISPFJson);
    //console.log("temp=" + temp + ", type of=" + typeof temp);
    //sendISPFJson = JSON.stringify(temp);
    //console.log("sendISPFJson=" + sendISPFJson + ", type of=" + typeof sendISPFJson);
    
    let tempData = JSON.parse(sendISPFJson);
    
    let response;
    
    try {
        // await before fetch
        response =  await fetch(hackURL, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tempData)
        }); // end let response
    } catch (error) {
        // TypeError: Failed to fetch
        console.log("Fetch error:", error);
    } // end try
    
    if (response.ok) {
        let json = await response.json();
        console.log("sendISPFData - response.text()=" + json.returnedISPFData);
        
        // Need it global, gets created later, 2D array 
        grid;
        // Get the ISPF Primary Options Menu
        // We are going to wait here until we 
        // get all of the data from the API
        panelDataAll = json.returnedISPFData;

        // Parse out the Panel data then parse each piece
        panelData = panelDataAll.ispfData.PNL; // All of the 'panel' data
        screenName = panelData.NME; // Name of the Panel
        screenNumber = panelData.SCR; // Active screen number (tab)
        screenWidth = panelData.RWS; // Number of panel rows (204 max)
        screenHeight = panelData.CLS; // Number of panel columns (160 max)
        screenHandle = panelData.HDL; // Used internally by ISPF
        screenTitle = panelData.TLE; // Panel title

        // Update the web browser title to show the current screen 
        document.title = "GenInsight - " + screenTitle;

        cursorData = panelData.CUR; // Cursor position after load
        curActData = panelData.IFY; // Identify currently active for this panel display
        msgsData = panelData.MSG;   // Message for panel
        areaData = panelData.ARE;    // The scrollable, dynamic, and table model areas defined for this panel
        colorData = panelData.CHA;    // The color and highlighting defined for the character level attributes used in dynamic areas
        menuData = panelData.MNU;   // The action bar choices and pull-down menus for the panel
        fieldsData = panelData.FLD; // The input/output/point-and-shoot/text fields displayed on this panel
        pfKeyData = panelData.KEY;  // The function keys defined for display with this panel
        
        console.log("**************** Panel - " + screenTitle + " - Loaded! ********************************");
        
        loadPage();        
        
    } else {
        // Error getting ISPF Panel, could be z/OSMF or other issue
    } // end if (response.ok)
} // async function sendISPFData

/**********************************************************************/
// This function will keep track of changes made. I think for the proto
//  we track the changes, but ideally we need to figure out a dynamic
//  way checking the panel. Maybe what was loaded versus what it is now
// Changes in the Panel data itself
/**********************************************************************/
function dataChanged() {
    // Should be triggered by an event listener (keyboarddown, mousedown)
}

/**********************************************************************/
// Table Functions
/**********************************************************************/

// This creates the initial blank table during pageload with rows by cols big
function generateTable(rows, cols) {
    console.error("generateTable() started with " + rows + ", and " + cols);
    let table = document.getElementById('dynamicTable');
    let tableHtml = "";
    for(let i = 0; i <= rows; i++) { // -----------------12/6
        let rowId = "rowId" + i;
        tableHtml += "<tr id=" + rowId + ">";
        for(let j = 0; j <= cols; j++) { // -------------12/6
            // We can do finds to know whether a cell's innerHTML has been changed
            // from &nbsp. Adding an id to each cell so that we can also make
            // dynamic changes to just one cell and not an entire row if needed
            // the cell id is (row.col) and actual 1 index values
            let oneRow = i;// + 1; // Create a 1 index row value ---------12/6
            let oneCol = j;// + 1; // Create a 1 index col value ---------12/6
            // cellClicked(i,j) 
            tableHtml += "<td id='" + oneRow + "." + oneCol + "' onclick='cellClicked(" + oneRow + ", " + oneCol + ")'>&nbsp;</td>";
        }
        tableHtml += "</tr>";
    }
    table.innerHTML = tableHtml;
} // end function generateTable


// This updates the cell at row,col with content and makes the text
// color the same as color. If highlight-ing, 
// We are using the 'i' variable from the first 'for' loop in the createInputField() 
// function to create className's so we know all of the cells that are
// meant to be with the same field. Which is passed in as fieldNumber
// fieldType (I,O,P,T) will help us call the fieldNames so we can later determine what the
//  cursor should look like
function updateCell(row, col, content, color, highlight, fieldNumber, fieldType) {
    //console.log("updatedCell(" + row + "," + col + "," + content + "," + color + "," + highlight + ")");
    let table = document.getElementById('dynamicTable');
    //console.log("updateCell - No. of table rows=" + table.rows.length + ", No. of table cols=" + table.rows[row].cells.length);
    //console.log("Cell - row=" + row + ", col=" + col + ", content=" + content + ", content.length + col=" + (content.length + col));
    
    // the following line used to say as of 12/5 1732
    // if(row >= 0 && col >= 0 && row < table.rows.length && col < table.rows[0].cells.length)
    if(row >= 0 && col >= 0 && row < table.rows.length && col < table.rows[row].cells.length) {
        //console.log("content for cell=" + content);
        /*if (highlight != "") {
            console.log("HIGHLIGHT=" + highlight);
            content = "_";
        }*/
        if (content === null) {
            console.log("content at (" + row + ", " + col + ") is null");
            content = "";
        }
        
        if (row===4) {
            console.log("table.rows.length=" + table.rows.length + ", table.rows[0].cells.length=" + table.rows[0].cells.length);
            console.log("table.rows[" + row + "].cells.length=" + table.rows[row].cells.length);
            console.log("cell:(4," + col + "), fieldNumber=(" + fieldNumber + ") with content=" + content);
        }
        
        
        //console.log(table.rows[row].cells[col]);
        table.rows[row].cells[col].innerHTML = content;
        
        /*
        try {
            table.rows[row].cells[col].innerHTML = content;
        } catch (e) {
            console.log("Error - row=" + row + ", col=" + col + ", content=" + content);
            console.log("No. of rows=" + table.rows.length);
            console.log("No. of columns=" + table.rows[0].cells.length);
            console.log("OUTER HTML");
            console.log(table.rows[row].cells[col]);
        }
        */
        table.rows[row].cells[col].style.color = color;
        table.rows[row].cells[col].style.backgroundColor = highlight;
        // add a style.cursor = 
        // context-menu, default = normal arrow 
        // help = normal arrow w/ question mark on right
        // not-allowed = circle with diaganol line
        // pointer = hand with index finger extended 'pointing'
        // text = capital I pointer, like about to highlight text in a paragraph
        // wait = hourglass
        
        // Use hyperlink (underline) for text, need a way to grab all text in field, so
        // we can highlight (underline) it all at the same time
        // *** the &nbsp is from the original 'blank' table
        // spaces do not have a .D
        // So we can go from fieldStart row/col until first &nbsp
        
        // Think we need to just know whether a field is Point-and-shoot
        // or not.
        let classNameFieldNumber = '';
        if (fieldType === "P") {
            classNameFieldNumber = "PSfieldNumber" + fieldNumber;
        } else { // all others handled the same (I, O, T)
            classNameFieldNumber = "fieldNumber" + fieldNumber;
        }
        
        // Using className's should help identify a field regardless
        // of which cell (letter) in the fieldName is hovered over
        // or clicked
        let currentClassList = table.rows[row].cells[col].classList;
        currentClassList += classNameFieldNumber;
        table.rows[row].cells[col].classList = currentClassList;
        
    }
} // end function updateCell

/*
"PANEL":{"SCREENID":"1","NAME":"ISR@PRIM","RESPONSE":{"TYPE":"PS","ID":"0PS-6-5"},"CURSOR":{"ROW":6,"COLUMN":5},"FIELDS":[]}}
*/

// This gets called when a cell is clicked, need to figure out a good way to use this
function cellClicked(row, col) {
    console.log('cell at (' + row + ',' + col + ') was clicked');
    // Check if cell is Point-and-shoot
    //row = row - 1; -- 12/6
    //col = col - 1; -- 12/6
    if (isPASField) {
        // get the field obj for row, col
        let fieldObj = getFieldObj(row, col);
        let fieldObjName = fieldObj.N;
        // Create JSON to send to ISPF
        let strJSON = {"PANEL":{"SCREENID":screenNumber,"NAME":screenName,"RESPONSE":{"TYPE":"PS","ID":fieldObjName},"CURSOR":{"ROW":row,"COL":col},"FIELDS":[]}};
        let jsnJSON = JSON.stringify(strJSON);
        sendISPFData(jsnJSON);
    } else {
        console.log("NOT a PAS Field!");
    }
} // end function cellClicked 

/**********************************************************************/
// Field Functions
/**********************************************************************/

// Triggered from loadPage()
// Iterate through all of the ISPF Fields we got from the original call
// that has all of the panel information in the main() 
// We do need an array of just the fields, and we need a 2D array of all
// of the panel data
function createIspfFields() {
    console.log("createIspfFields() started");

    // The FLD array is: PNL > FLD
    for (let i = 0; i < fieldsData.length; i++) {
        let curField = fieldsData[i];
        // Testing ternary operators, 
        let curFieldType = curField ? curField.T : ''; // Field Type (Input, Output, Text, Point-and-shoot) - string
        let curFieldPAS = curField ? curField.P : ''; // Indicates field is also Point-and-shoot (TRUE) - string
        let curFieldCMD = curField ? curField.Z : ''; // Indicates this is a command field (TRUE) - string
        let curFieldSDM = curField ? curField.A : ''; // The name of the scrollable, dynamic, or table model area where this field is located - string
        let curFieldYRow = curField.Y; // Row (1-24) - (max:204) integer
        let curFieldXCol = curField.X; // Col (1-80) - (max:160) integer
        let curFieldColor = curField ? curField.C : ''; // Color of field - "AQUA","BLUE","GREEN","PINK","RED","WHITE","YELLOW" - string
        let curFieldInten = curField ? curField.I : ''; // Intensity of field - "HIGH","LOW","NON" - string
        let curFieldHighlight = curField.H !== undefined ? curField.H : ''; // Highlighting of field - "BLINK","RVIDEO","USCORE" - string
        let curFieldLength = curField.L; // Length of field - integer
        let curFieldSFLen = curField ? curField.LX : 0; // Length of scrollable field - (max:32767) - integer
        let curFieldName = curField ? curField.N : ''; // Name associated with field - (max:14) - string
        let curFieldData = curField ? curField.D : ''; // Data for field - (max:32767) - string
        
        // We need to check if curField.SL is null before any type of processing
        let curFieldCBRB = curField.SL !== undefined ? curField.SL : {};
        
        //let curFieldCBRB = curField ? curField.SL : {}; // Selection field defined as checkbox or radio button - object
        // Check if there is any data in the object
        if (Object.keys(curFieldCBRB).length > 0) {
            let curFieldCBRBType = curFieldCBRB.T; // Type of selection field - "CB","RD" - string
            let curFieldCBRDValue = curFieldCBRB.V; // Data value associated with selecting this field - string
            let curFieldCBRDName = curFieldCBRB.N; // Name of input field to be updated - RD only - (max:8) - string
            let curFieldCBRDGroup = curFieldCBRB.G; // Group No. used to identify related selection fields - RD only - (max:99) - integer
        } // end if (Object...)
        
        let curFieldSHS = curField.SHS !== undefined ? curField.SHS : []; // For a field in a dynamic area, identifies the sections of the field that are highlighted using character level attributes - array
        // Check if there is any data in the array
        if (curFieldSHS.length > 0) {
            for (let i = 0; i < curFieldSHS.length; i++) {
                let curFieldSHSStart = curFieldSHS[i].STA; // Starting position for a set of characters to be highlighted - integer
                let curFieldSHSLen = curFieldSHS[i].LEN; // No. of characters from start to highlight - integer
                let curFieldSHSAtt = curFieldSHS[i].ATT; // No. in the CHA array. Identifies type of highlighting to use - integer
            } // end for (let x = 0...)
        } // end if (curFieldSHS.length...)
        /* All the data for 1 row/col position on a panel */
        
        // So we know if the data is meant for a SHS field (ie: Calendar)
        let isSHSData = false;
        
        // Save the data in a different variable because we need to check different attributes
        let cellData = curFieldData; // .D

        console.log("Data to put in table:" + curFieldData + " at row:" + curFieldYRow + ", and col:" + curFieldXCol + ", color:" + curFieldColor);
        console.log("rowId=rowId" + curFieldYRow + ", curFieldType=" + curFieldType + ", curFieldLen=" + curFieldLength);
        
        let rowId = 'rowId' + curFieldYRow;
        
        // First we check the field type
        if (curFieldType === "I") {
            // Check what kind of highlight (most are USCORE it seems)
            if (curFieldHighlight === "USCORE") {
                // Check if it is the command line or not
                if (curFieldCMD === "TRUE") {
                    // Go ahead and create a textfield, make sure the attributes are all set
                    // This should only be handling the command line Option ==>
                    createInputField(0, rowId, curFieldYRow, curFieldXCol, curFieldLength, curFieldName, curFieldCBRB, curFieldSHS, curFieldData);
                    
                } else { // not the ZCMD line
                    // Check if it is a checkbox or radio button
                    if (Object.keys(curFieldCBRB).length > 0) {
                        // Means it is either a checkbox or radio button
                        if (curFieldCBRB.T === "CB") { // Use .V
                            if (curFieldData === "/") {
                                // Checkbox should appear 'checked'
                                createInputField(1, rowId, curFieldYRow, curFieldXCol, curFieldLength, curFieldName, curFieldCBRB, curFieldSHS, curFieldData);
                                
                            } else {
                                // Checkbox should appear 'unchecked'
                                createInputField(1, rowId, curFieldYRow, curFieldXCol, curFieldLength, curFieldName, curFieldCBRB, curFieldSHS, curFieldData);
                            } // end if (curFieldData === "/")
                        } else { // has to be "RD"
                            // get the .G
                            // check if .V 
                            // check if .N
                        } // end if (curFieldCBRB.T === "CB")
                    } else { // not a checkbox or radio button, so its textfield
                        if (curField.D != "") { // there is data to display
                            // Display curField.D in the textbox
                            createInputField(0, rowId, curFieldYRow, curFieldXCol, curFieldLength, curFieldName, curFieldCBRB, curFieldSHS, curFieldData);
                        } else { // the textbox should be displayed w/o data
                            createInputField(0, rowId, curFieldYRow, curFieldXCol, curFieldLength, curFieldName, curFieldCBRB, curFieldSHS, curFieldData);
                        } // if (curField.D <> "")
                    } // end if (Object.keys(curFieldCBRB).length > 0)
                } // end if (curFieldCMD === "TRUE")
            } else if (curFieldHighlight === "BLINK") {
            } else if (curFieldHighlight === "RVIDEO") {
            } // end if (curFieldHighlight === "USCORE")
        } else if (curFieldType === "O") {
            // function updateCell(row, col, content, color, highlight, fieldNumber)
            /*
                {
                    "T": "O",
                    "Y": 3,
                    "X": 2,
                    "C": "AQUA",
                    "I": "LOW",
                    "L": 78,
                    "N": "ZDLTITLE",
                    "D": "DSLIST - Data Sets Matching JF893404.JCL.CNTL                       Row 1 of 2"
                },
            */
            
            // <<<--- Still create an input field for Output, (3), make sure to check for 80
            console.log("type=3, rowId=" + rowId + ", yRow=" + curFieldYRow + ", xCol=" + curFieldXCol + ", fieldLen=" + curFieldLength + ", fieldName=" + curFieldName + ", fieldData=" + curFieldData);
            //createInputField(3, rowId, curFieldYRow, curFieldXCol, curFieldLength, curFieldName, curFieldCBRB, curFieldSHS, curFieldData);
            // Iterate through the curFieldLength, does the name matter on Output type?
            //for (let s = 0; s < curFieldLength; s++) {
            //    updateCell((curFieldYRow), (curFieldXCol + s), curFieldData[s], curFieldColor, curFieldHighlight, i); // <================ Listing DSNs in 3.4
            //}
            // Seems to only be associated to radio buttons
        } else if (curFieldType === "P") {
            if (curFieldSHS.length > 0) {
                isSHSData = true;
                //let curSHS = curFieldSHS[0];
                //let curSHSSTA = curSHS.STA;
                //let curSHSLEN = curSHS.LEN;
                //let curSHSATT = curSHS.ATT; // index of colorData array
                // For example 'today' on the calendar

            } else {
                isSHSData = false;
                // curFieldSHS is empty
            } // end if (curFieldSHS.length > 0)
        } else { // curFieldType === "T"
            console.log("curFieldType=" + curFieldType + ", expected 'T'. cell(" + curFieldYRow + "," + curFieldXCol + ") curFieldLength=" + curFieldLength + ", curFieldData=" + curFieldData);
            for (let s = 0; s < curFieldLength; s++) {
                console.log("Before updateCell-" + curFieldYRow + ", " + (curFieldXCol + s) + ", " + curFieldData[s] + ", " + curFieldColor + ", " + curFieldHighlight + ", " + i + ", " + curFieldType);
                // This this needs to create a field, even a label of text only
                updateCell((curFieldYRow), (curFieldXCol + s), curFieldData[s], curFieldColor, curFieldHighlight, i, curFieldType); // <================ Listing DSNs in 3.4
                
            }
            
        } // end if (curFieldType === "I")
        
        /*****************************************************
        * This for loop is iterating through the curFieldData
        * which is only found at the 'left-most' cell of a 
        * field. So we are moving left to right one cell at a
        * time. 
        *****************************************************/
        let useSHSData = false; // Needs to be outside data for loop
        let shsCounter = 0; 
        for (let k = 0; k < curFieldData.length; k++) {
            //console.log("k(letter in word)=" + k);
            
            if (curFieldData[k] == null) {
                console.log("NULL");
                // Consider handling null values appropriately here
            /*} else if (curFieldData[k] === "/") {*/
                
            } else if (curFieldType === "I") {
                
            } else {
                if (isSHSData) {
                    useSHSData = true;
                    if (isDarkMode) {
                        /* SHS DATA */
                        let tempSHS = curFieldSHS[0]; // maybe a for loop later?
                        let tempSHSSTA = tempSHS.STA; // kinda ignoring
                        let tempSHSLEN = tempSHS.LEN;
                        let tempSHSATT = tempSHS.ATT - 1;
                        // Get CHA data from element tempSHSATT
                        let tempSHSATTObj = colorData[tempSHSATT];
                        let tempSHSATTObjCOL = tempSHSATTObj.COL; // color
                        let tempSHSATTObjHIL = tempSHSATTObj.HIL; // highlight
                        
                        curFieldColor = tempSHSATTObjCOL;
                        curFieldHighlight = tempSHSATTObjHIL;
                        if (curFieldHighlight === "RVIDEO") {
                            curFieldHighlight = "WHITE";
                            curFieldColor = "BLACK";
                        }
                        
                        updateCell(curFieldYRow, (curFieldXCol + k), curFieldData[k], curFieldColor, curFieldHighlight, i, curFieldType);
                        shsCounter++;
                        if (shsCounter > tempSHSLEN) {
                            useSHSData = false;
                        }
                        //continue;
                    } else {
                        // Update for RVIDEO, same as above, just handle highlight opposite
                        updateCell(curFieldYRow, (curFieldXCol + k), curFieldData[k], curFieldColor, curFieldHighlight, i, curFieldType);
                    } // end if (isDarkMode)
                } else {
                    useSHSData = false;
                    shsCounter = 0;
                    
                    updateCell(curFieldYRow, (curFieldXCol + k), curFieldData[k], curFieldColor, curFieldHighlight, i, curFieldType);
                } // end if (isSHSData)
                
            } // end if (curFieldData...)
        } // end for (let k = 0)...
        
        // colorData
        // This loop will iterate through the curSHSEN starting at curSHSSTA
        if (isSHSData) { //*********************************************************************Look at this? Why is it here? Page loads fine w/o
            //updateCellFormatting(curFieldYRow, curFieldXCol, curFieldSHS);
        } // end if (isSHSData)
        
    } // end for (let i = 0)
} // end function createIspfFields


// screenCols (24), screenRows (80)
// Need to get the current tableRowId regardless of function
// row 1-24, col 1-80
// Think it best to pass the curFieldCBRB as the whole object so it would
// be easier to handle the checkbox and radio button requirements
// shsObject is the object from the SL array index 0

// Need to see if inputField takes us to 80, if so do not add the 'tail' text

function createInputField(type, tableRowId, row, col, fieldLen, fieldName, cbrbObject, shsObject, inFieldData) {
    console.log("createInputField() started, tableRowId=" + tableRowId + ", row=" + row + ", col=" + col + ", fieldLen=" + fieldLen + ", type=" + type);
    
    // Need to get the current tableRowId regardless 
    let tableRowElement = document.getElementById(tableRowId);
    // The actual tableRow
    let tableRow = tableRowElement.innerHTML;
    
    // Split the tableRow <td> tags into an array (likely 80)
    const regex = /<td.*?>.*?<\/td>/g;
    const tdElements = tableRow.match(regex);   
    
    let colCounter = 0;
    let inputRowCells = [screenCols]; // Set array to the number of cells in a row
    let newTableRow = '';
    //************ Start to New Field *********************************
    // Save the current tableRow data to the start 'col' of the new field
    // remember, we are on the same row the whole time, just navigating cols
    for (let i = 0; i < col; i++) {
        // Copy the tdElements up until the col that has the new field
        inputRowCells[i] = tdElements[i];
        colCounter = i;
    } // end for (let i = 0...)
    
    console.error("colCounter after front=" + colCounter + ", tdElements.length=" + tdElements.length);
    
    //*************** Middle (New Field) *****************************
    // Holds the inputField <td> that we dynamically create
    let inputTextField = '';
    
    // Check if a fieldName has been passed in
    let inputFieldName = fieldName ? fieldName : 'inputFieldNameR' + row + 'C' + col;
    console.log("createInputField - inputFieldName=" + inputFieldName);
    
    let isChecked;
    let checkValue;
    let checkName;
    let radioGroup;
    // Check if the inputFieldCBRBObject is empty -- DELETE? 
    if (Object.keys(cbrbObject).length > 0) {
    } // end if (Object...)
    
    // Create the inputField based on the type var passed
    // This is just the 'middle' part
    if (type === 0) { // textfield
        // Check if inFieldData contains anything
        if (inFieldData.length != 0) { // textfield should be populated with inFieldData
            inputTextField = '<td colspan="' + fieldLen + '"><input class="w3-input w3-black w3-hover-white" type="text" id="' + inputFieldName + '" value="' + inFieldData + '" style="padding:0px"></td>';
        } else { // textField shoud be blank
            inputTextField = '<td colspan="' + fieldLen + '"><input class="w3-input w3-black w3-hover-white" type="text" id="' + inputFieldName + '" style="padding:0px"></td>';
        } // end if (inFieldData.length != 0)
        
    } else if (type === 1) { // checkbox
        // If the fieldData has '/' it means it is mean to be 'checked', so set isChecked to true, else set to false
        isChecked = inFieldData.includes("/") ? true : false;
        console.log("isChecked=" + isChecked + ", type=" + typeof isChecked);
        //TODO: Add inline style width and height to 8px, or ratio based on screen size/font size
        let inputChecked = '<td colspan="' + fieldLen + '"><input class="w3-check" type="checkbox" id="' + inputFieldName + '" value="' + cbrbObject.V + '" checked></td>';
        let inputUnChecked = '<td colspan="' + fieldLen + '"><input class="w3-check" type="checkbox" id="' + inputFieldName + '" value="' + cbrbObject.V + '"></td>';
        // If isChecked is true use inputChecked, if false use inputUnChecked
        inputTextField = isChecked ? inputChecked : inputUnChecked;
        console.log("Checkbox at (" + row + "," + col + ")=" + isChecked + ", inFieldData=" + inFieldData + ", fieldLen=" + fieldLen);
    } else if (type === 2) { // radiobutton/dropdown
        inputTextField = '<td colspan="' + fieldLen + '"><input class="w3-radio" type="radio" id="' + inputFieldName + '" name="' + cbrbObject.N + '" value="' + cbrbObject.V + '" groupNumber="' + cbrbObject.G + '"></td>';
    } else if (type === 3) { // Output, still created as an 'input' field, doesn't seem to be a difference
        
        // This is previous code below 12/5/23 - 6pm pst
        //inputTextField = '<td colspan="' + fieldLen + '"><p id="' + inputFieldName + '">' + inFieldData + '</p></td>';
        inputTextField = '<td colspan="' + fieldLen + '"><span id="' + inputFieldName + '">' + inFieldData + '</span></td>';
        console.log("OUT createInputField(" + row + "," + col + ") - fieldLen=" + fieldLen + ", inputFieldName=" + inputFieldName + ", inFieldData=" + inFieldData);
    }
    // end if (type...)
    
    // row 4 of 3.4 dsn listing: inputRowCells.length = 32, tdElements.length = 80
    // Add the 'middle part' inputTextField to the inputRowCells array and
    // increment the counter, to count this addition
    //             This is correct, but creates 1 cell replacing between the start of
    //             this new field until the End, skipping a bunch of columns because we
    //             used colspan to combine, but this causes issues with the array being
    //             something like 32 elements instead of 80, because we did not include
    //             the cells that were a part of the colspan.
    //             So we need to update the array without changing the new tableRow
    inputRowCells[colCounter] = inputTextField;
    
    colCounter++;
    //******************** New Field to End (if applicable) ********************
    // Check if colCounter + fieldLen = 80, means no more room after inputField
    console.log("row=" + row + ", colCounter(" + colCounter + ")+fieldLen(" + fieldLen + ")=" + (colCounter+fieldLen) + ", type=" + type + ", inFieldData=" + inFieldData);
    if (((colCounter - 0) + fieldLen) < tdElements.length) {
        //colCounter++;
        
        // Do both have to be colCounter + fieldLen?
        for (let j = (colCounter + fieldLen); j < screenCols; j++) {

            inputRowCells[j] = tdElements[j];
            if (row===4) {
                console.log("ROW4 - colCounter=" + colCounter + ", colCounter + fieldLen=" + (colCounter + fieldLen) + ", screenCols=" + screenCols + ", j=" + j);
                console.log("ROW4 - inputTextField=" + inputTextField);
            }
            colCounter++;
        } // end for (let j...)        
        
    } else {
        console.error("Out of bounds if we continue: tableRowId=" + tableRowId + " col=" + (colCounter + fieldLen));
    }
    
    //********* Convert the inputRowCells array to a string ******************************
    // Create 1 string from the inputRowCells array
    //*** if inputRowCells does not have data skip it
    for (let k = 0; k < inputRowCells.length; k++) {
        if (inputRowCells[k] === undefined) {
            console.log("cell(" + row + "," + k + ") is UNDEFINED");
        } else {
            newTableRow += inputRowCells[k];
        }
    } // end for (let k = 0)...
    
    console.error("newTableRow(" + inputRowCells.length + ")=" + tdElements.length);
    if (row===4){
        console.log("ROW4 - newTableRow=" + newTableRow);
    }
    
    // Put the new tableRow back in the webpage
    tableRowElement.innerHTML = newTableRow;
    
    
    // Multiple input field testing/debugging **************************************************************************************
    // Split the tableRow <td> tags into an array
    const regexTR = /<td.*?>.*?<\/td>/g;
    const newTableRowElements = newTableRow.match(regexTR);   
    console.log("TEST - New row for tableRowId=" + tableRowId + ", created. The number of <td> elements in this row are=" + newTableRowElements.length + " previous was=" + tdElements.length);
    
    //************************** END ***********************************************************************************************************
    
    // Decide which 'types' need an event listener and what kind. Text = onmousedown?
    
    // Create Event Listeners? textfield (enter?) can we handle as a page at a time?
    //TODO: Create event listener at webpage level
    // needs to be dynamic inputFieldName ('zcmd')
    let elemInputField = document.getElementById(inputFieldName);
    console.log("elemInputField=" + elemInputField);
    let elemInputFieldValue = elemInputField.value;
    document.getElementById(inputFieldName).addEventListener("keydown", 
        function(event) {
            if (!event) {
                let event = window.event;
            } // end if (!event)
            if (event.keyCode == 13) {
                // Need to create json payload by calling createClientToISPFJSON();
                //createClientToISPFJSON(inScreenId, inName, responseType, responseId, curRow, curCol, inFields)
                // curRow, curCol are numbers, inFields is an array
                //TODO: Need the 4 and 14 to be updated
                
                // Needs to be inside the event.keyCode
                let elemInputFieldValue = elemInputField.value;
                
                let ispfFields = [];
                console.log("inputFieldName=" + inputFieldName + ", elemInputField=" + elemInputFieldValue);
                let ispfFieldObj = {"NAME":inputFieldName,"DATA":elemInputFieldValue};
                ispfFields[0] = ispfFieldObj;
                
                let strISPFFields = ispfFields.toString();
                console.log("strISPFFields=" + ispfFields + ".len=" + ispfFields.length + ", 0=" + ispfFields[0]);
                
                // Call another function to get all fields that have been changed (local/sessionStorage?)
                let strISPFJSON = createClientToISPFJSON("1", screenName, "KEY", "ENTER", "4", "14", ispfFields);
                let ispfJSON = JSON.stringify(strISPFJSON);
                
                sendISPFData(ispfJSON);
            } // end if (event.keyCode)
        },
    false); // end eventlistener
    
} // end function createInputField...

// This creates a two dimensional array holding all of the field data for
// a given cell. The grid[x][y] array can be called with the getFieldObj
// function to get the object saved at x/y
function create2DFieldArray() {
    console.log("create2DFieldArray() Started");
     // Create 2 dimensional array for FLD data
    const fldObjects = fieldsData;

    // Determine the dimensions of the 2D array
    const maxX = Math.max(...fldObjects.map(obj => obj.X));
    const maxY = Math.max(...fldObjects.map(obj => obj.Y));

    // Initialize the 2D array with null values
    // global, getting defined now
    grid = Array.from({ length: maxY + 1 }, () => Array(maxX + 1).fill(null));

    // Populate the 2D array with the JSON objects
    fldObjects.forEach(obj => {
        grid[obj.Y][obj.X] = obj;
    });

    // Print a small section of the grid for illustration purposes
    // first .slice is rows (up/down), second .slide is columns (left/right)
    // the .slice(<start>,<end>)
    //console.log(grid.slice(4, 6).map(row => row.slice(0, 20)));

    //console.log("grid[4][2]");
    //console.log(grid[4][2]); // 4,3 = null
    //let jsonObj = grid[4][2];
    //console.log("jsonObj.D=" + jsonObj.D);
    /*
        <--- x (col) ----> y (row) = up/down
    */

} // end function create2DFieldArray

// This gets the object stored in the grid two dimensional array by row/col
function getFieldObj(row, col) {
    console.log("getFieldObj() started")
    let fieldObj = grid[row][col];
    return fieldObj;
} // end function getFieldObj

/**********************************************************************/
// GUI Functions
/**********************************************************************/

async function loadPage() {
    console.log("loadPage() started");
 
    await Promise.race([
        new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (isDomLoaded) {
                    clearInterval(checkInterval);
                    resolve('DOM loaded');
                }
            }, 50); // Check every 50ms
        }),
        new Promise((resolve) => setTimeout(() => resolve('Timeout after 3 seconds'), 3000))
    ]);
    
    
    
    // Create the unformatted table (rows,cols). 
    //TODO: read profile prefs
    generateTable(screenRows, screenCols); // TERM: IBM-3278-3-E
    
    let table = document.getElementById('dynamicTable');
    
    // When mouse stops, then we want more data. Otherwise, we are just
    // doing a GUI update based on User GUI moves, no data changes
    
    // Mouseover - needed to update GUI (hyperlinks) and other elements
    // dynamically while use is moving mouse. <<<<==========================================make sure it is a point-and-shoot field, not all fields
    table.addEventListener('mouseover', function(event) {        
        // need to get row/col then highlight, this is table wide
        // Get the cell we 'mouseovered'
        let cell = event.target;
        // Get the className (fieldNumberXX)
        let cellClassName = cell.className;
        // Check if the cellClassName starts with 'PS"
        let isPointAndShoot = false;
        if (cellClassName.startsWith("PS")) {
            isPointAndShoot = true;
            highlightWord(cellClassName, isPointAndShoot);
        } 

        isPointAndShoot = false;
        //TODO: This likely needs to go somewhere else or as a 
        // different function. This creates a (row/col) display 
        // in the header area by GenInisght
        let appNameHeader = document.getElementById('appNameHeader');
        // This is statement makes sure we do not display the word 'undefined' in the
        // header if the mouse is hovering over a textfield
        if (cell.parentNode.rowIndex !== undefined || cell.cellIndex !== undefined){
            appNameHeader.innerHTML = "(" + cell.parentNode.rowIndex + "," + cell.cellIndex + ") - " + screenTitle + " - GenInsight"
        }
    });
    
    // Mouseout - needed to reset anything we updated with mouseover
    table.addEventListener('mouseout', function(event) {
        // need to get row/col then highlight, this is table wide
        // Get the cell we 'mouseovered'
        let cell = event.target;
        // Get the className (fieldNumberXX)
        let cellClassName = cell.className;
        // Get all cells with the same className if there is a className
        if (cellClassName.length > 0) {
            unHighlightWord(cellClassName);
        }
    });
    
    // Functions for the mouseover/mouseout event listeners
    function highlightWord(className, isPointAndShoot) {
        let tableElementsByClass = table.getElementsByClassName(className);
        
        // Use this to get the field data 1 letter at a time and concatenate the whole word
        
        for (let i = 0; i < tableElementsByClass.length; i++) {
            cell = tableElementsByClass[i];
            cell.classList.add('highlightText');
            // Since the mouse is over what looks like a hyperlink
            // we are changing the cursor to the hand with the index
            // finger extended 'pointing'
            if (isPointAndShoot) {
                cell.style.cursor = 'pointer';
                isPASField = true;
            } else {
                cell.style.cursor = '';
                isPASField = false;
            }
        }; // end document.query...
    } // end function highlightWord...

    function unHighlightWord(className) {
        let tableElementsByClass = table.getElementsByClassName(className);
        
        for (let i = 0; i < tableElementsByClass.length; i++) {
            cell = tableElementsByClass[i];
            cell.classList.remove('highlightText');
            isPASField = false; 
            // When we leave the field, we will change the cursor
            // back to what it was before kicking off the mouseover
            cell.style.cursor = '';
        }; // end document.query...
    } // end function unHighlightWord...
    
    
    //* Needs to also act like mouseover vvvvvvvvvvvv
    
    // Track mouse movement so we know when the user stops the mouse and
    // 'hovers' over the panel
    let mouseMoveTimeout;
    table.addEventListener('mousemove', function(event) {
        clearTimeout(mouseMoveTimeout);  // Clearing timeout on each mouse move

        mouseMoveTimeout = setTimeout(() => {
            // Fetching cell info when mouse stops moving for 500ms
            let cell = event.target;
            if(cell.tagName === 'TD') {
                let row = cell.parentNode.rowIndex;
                let col = cell.cellIndex;
                let className = cell.className; // classList
                console.log(`Mouse stopped over cell: [${row}, ${col}]`);
                // The mouse has stopped and the user is 'hovering' over data
                //  so we need to get the data from the field they are over
                //  by using the className to get the other cells of the same
                //  className and the concatenate their 'innerHTML' values

                // Get the text for the className we are over. If the className has 
                // highlightText ignore that part, just get the first word
                let cellClassName = className.split(" ")[0];
                
                // Get all elements that have that same cellClassName (array)
                let classElements = document.getElementsByClassName(cellClassName);
                let fieldData = '';
                for (let q = 0; q < classElements.length; q++) {
                    fieldData += classElements[q].innerHTML;
                }
                //console.log("fieldData=" + fieldData);
                
                // From here we send this fieldData to create a prompt and then
                // insert into the GenAI text prompt field
                createPrompt(fieldData);
                
            } // end if (cell.tagName....)
        }, 500);  // 500ms delay to check for stop in movement
    }); // end table.addEventListener...

    // Get the PF Key preferences
    let isPFKeysVisible = localStorage.getItem("isPFKeysVisible");
    let isPFKeysOnTop = localStorage.getItem("isPFKeysOnTop");
    
    
    createIspfFields();
    getMenuTitlesAndChoices();
    getPFKeys(true, true);
    create2DFieldArray();
//});
} // end function loadPage



/*****************************************************************************
 Generative AI functions
*****************************************************************************/
// DO NOT call this directly! Use sendMessage()
function getChatCompletions(prompt) {
    console.log("getChatCompletions() started");
    const eventSource = new EventSource(`http://10.252.109.223:3443/get-completions?prompt=${encodeURIComponent(prompt)}`);
    
    eventSource.onmessage = function(event) {
        console.log(event);
        const data = JSON.parse(event.data);
        updateResponse(data);
    };
    
    eventSource.onerror = function(error) {
        // Display and remaining data in the buffer if a complete sentence
        // was not created and there is a streaming error
        if (buffer.length > 0) {
            displaySentence(buffer);
        }
        console.error('EventSource failed:', error);
        eventSource.close();
    };
}
// Called whenever we get an update from the API, mostly meant
// to grab the 'pieces' of the result, save to a buffer and when
// a complete sentence has been received, we will display the
// sentence.
function updateResponse(data) {
    console.log("updateResponse() started");
    buffer += data;
    
    // Check for the end of a sentence
    if (/[.!?]\s*$/.test(buffer)) {
        displaySentence(buffer);
        buffer = ''; // Reset the buffer
    }
}

// If this is called after clicking submit or hitting enter in the
// 'userInput' textbox, we pass sender=user, otherwise pass bot
function sendMessage(sender, message) {
    let input = document.getElementById("userInput");
    if (sender === "user") {
        appendMessage(sender, message);
        // Clear the textbox for a new entry
        input.value = '';
        // Call the getChatCompletions() function 
        getChatCompletions(message);
    } else { // has to be "bot"
        appendMessage("bot", message);
    }
}

function appendMessage(sender, message) {
    let chatWindow = document.getElementById("chatWindow");
    let msgElement = document.createElement("div");

    msgElement.className = sender === "user" ? "w3-right-align" : "w3-left-align";
    msgElement.innerHTML = `<div class="w3-panel"><b>${message}</b></div>`;

    chatWindow.appendChild(msgElement);

    // Scroll to the bottom
    chatWindow.scrollTop = chatWindow.scrollHeight;
}

// The getChatCompletions() -> updateResponse() -> displaySentence()
function displaySentence(sentence) {
    // Call sendMessage() using 'bot'
    sendMessage("bot", sentence);
}

// Pass in screen name?
function createPrompt(fieldData) {
    
    // First, remove excess whitespace from fieldData
    fieldData = fieldData.trim();
    
    let prompt = "What does " + fieldData + " do on the " + screenTitle + " in ISPF on the Mainframe?";
    let userInputElement = document.getElementById('userInput');
    userInputElement.value = prompt;
    // Create an event listener for 'Enter' so the user can more
    // easily submit a prompt 
    userInputElement.addEventListener('keydown', function(event) {
        if (!event) {
            let event = window.event;
        }
        event.preventDefault();
        switch (event.keyCode) {
            case 13: // Enter
                // We use the userInputElement.value in case
                // the prompt we received has changed. We dont
                // care, but we will send whatever is in the
                // .value 
                sendMessage("user", userInputElement.value)
                userInputElement.value = '';
                break;
            default:
        }
    });
    userInputElement.focus();
}

// To clear the chat window, we have to remove all of the child elements
function clearChat() {
    // GUI Prompt confirmation?
    alert("Are you sure you want to clear the Turing chat window?");
    let chatWindow = document.getElementById("chatWindow");
    // loop while chatWindow if has a child, remove it
    while (chatWindow.firstChild) {
        chatWindow.removeChild(chatWindow.firstChild);
    }
}

/********************** END GEN AI FUNCTIONS *******************************************************/

// This is the position of the cursor after the panel load
// This needs to be highlighted or 'blinking' 
function getCursorStartPosition() {
    console.log("getCursorStartPosition() started");
    let cursorStartXPos = cursorData.CLM;
    let cursorStartYPos = cursorData.ROW;
    let cursorStartPos = [cursorStartXPos, cursorStartYPos];
    return cursorStartPos;
} // end function getCursorStartPosition

// This is for the ISPF menu for a given panel
// We are going to try and use row 0 for the menu since the data really seems
//  to start on row 1, but row 1 may need to be the menu roww
function getMenuTitlesAndChoices() {
    console.log("getMenuTitlesAndChoices() started");
    // Array of Menu's and submenus
    let mnuData = panelData.MNU;
    // Get the number of menu's to be displayed
    let noOfMenus = mnuData.length;
    let tableCode = '';

    // Create the new table data for row 0
    let tableMenu = document.getElementById("rowId0");
    console.log("tableMenu=" + tableMenu);

    // Get showMenuOnHover option from localStorage to know
    // whether or not to show the menu on a mouse hover or
    // if a click is required to display the menu
    let showOnHover = getLocalStorage("showMenuOnHover");
    
    // Counter var to make unique Ids
    let menuCounter = 0;
    
    // For each menu
    mnuData.forEach(function(menu) {
        // There is a space before each menu title
        let title = menu.PUL + " "; // This adds a space to the end to match the beginning of the string
        let lenTitle = title.length;
        // Dynamically create a drop down menu
        //tableCode += '<td colspan="' + lenTitle + '" class="w3-center w3-text-white">' + title + '</td>'
        
        // Create menuListId for each menu dropdown using the counter which we need
        // to have ID's for if the user wants to click a menu instead of mouse hover
        let menuListId = "menuID" + menuCounter;
        // Increment the counter for the next foreach
        menuCounter++;
        
        // Check the showOnHover options <<===========================================================================click does not work, but hover stop does
        if (showOnHover) {
            tableCode += '<td colspan="' + lenTitle + '" class="w3-center w3-text-white">' +
                '<div class="w3-dropdown-hover">' +
                    '<button class="w3-button w3-black">' + title + '</button>' +
                    '<div class="w3-dropdown-content w3-bar-block w3-border">';            
        } else { // means the user has to click to show menu
            tableCode += '<td colspan="' + lenTitle + '" class="w3-center w3-text-white">' +
                '<div class="w3-dropdown-click">' +
                    '<button class="w3-button w3-black" onclick="showMenuOnClick(&quot;' + menuListId + '&quot;)">' + title + '</button>' +
                    '<div id="' + menuListId + '" class="w3-dropdown-content w3-bar-block w3-border">';
        } // end if (showOnHover)
        
        // Test Menu Data
        let mnuMenuType = "'CHOICE'";
        let mnuMenuId = "'1-3'";
        let mnuCurRow = 4;
        let mnuCurCol = 14;
        let mnuFields = 0; // []
        
        // SAVE to Menu Title array
        menu.CHS.forEach(function(choice) {
            //console.log("  Choice: " + choice.N + ", ID: " + choice.I);
            tableCode += '<button class="w3-bar-item w3-button" onclick="menuTypeAndID(' + screenNumber + ',&quot;' + screenName + '&quot;,' + mnuMenuType + ',&quot;' + choice.I + '&quot;,' + mnuCurRow + ',' + mnuCurCol + ',' + mnuFields + ')">' + choice.N + '</button>';
            //20231116tableCode += '<a href="#" class="w3-bar-item w3-button">' + choice.N + '</a>';
            // SAVE under each Menu Title, as an array of choices
            //console.log("tableCode=" + tableCode);
        }); // end menu.CHS.forEach(function(choice)
        tableCode += '</div>' +
                    '</div>';

    }); // end mnuData.forEach(function(menu)
    //console.log("tableCode:" + tableCode);
    tableMenu.innerHTML = tableCode;
} // end function getMenuTitlesAndChoices

// This will display the menu if the user wants to use clicks and not mouse hover
function showMenuOnClick(menuListId) {
    console.log("showMenuOnClick(" + menuListId + ")");
    // Set a flag to know if 1 menu is visible so we can unselect the menu
    let menuSelected = document.getElementsByClassName("w3-show").length > 0 ? true : false;
    
    let x = document.getElementById(menuListId);

    if (x.className.indexOf("w3-show") == -1) { // not visible
        console.log("not visible, making it visible");
        x.className += " w3-show";
    } else { // is visible
        console.log("is visible, making it not visible");
        x.className = x.className.replace(" w3-show", "");
    } // end (x.className...)
    /*
    if (menuSelected) { // more than one menu currently visible
        // Clear all menus
        // First make sure no other menus are visible
        // Get all of the menus using w3-dropdown-content
        let y = document.getElementsByClassName("w3-dropdown-content");
        // Iterate through each menu and make sure it is not showing
        for (let s = 0; s < y.length; s++) {
            let elem = y[s];
            if (elem.className.indexOf("w3-show") == -1) {
            } else { // Means its visible, so we will make it not visible
                elem.className = elem.className.replace(" w3-show", "");
            } // end if (elem...)
        } // end for (let s = 0...)        
        
        // show just the menu we want
        
        let x = document.getElementById(menuListId);

        if (x.className.indexOf("w3-show") == -1) { // not visible
            console.log("not visible, making it visible");
            x.className += " w3-show";
        } else { // is visible
            console.log("is visible, making it not visible");
            x.className = x.className.replace(" w3-show", "");
        } // end (x.className...)
        
    } // No else
    */
} // end function showMenuOnClick...


//Pressing PF3 {"PANEL":{"SCREENID":"1","NAME":"ISRUTIL","RESPONSE":{"TYPE":"KEY","ID":"3"},"CURSOR":{"ROW":4,"COLUMN":14},"FIELDS":[]}}
//{"PANEL":{"SCREENID":"1","NAME":"ISR@PRIM","RESPONSE":{"TYPE":"CHOICE","ID":"1-3"},"CURSOR":{"ROW":4,"COLUMN":14},"FIELDS":[]}}:
async function menuTypeAndID(screenId, panelName, menuType, menuId, curRow, curCol, fieldsSelected) {
    let menuSelected = {"PANEL":{"SCREENID":screenId,"NAME":panelName,"RESPONSE":{"TYPE":menuType,"ID":menuId},"CURSOR":{"ROW":curRow,"COLUMN":curCol},"FIELDS":[]}};
    console.log("menuSelected=" + menuSelected);
    let menuSelectedJSON = JSON.stringify(menuSelected);
    // Send data to Mainframe indicating a menu selection
    let hackURL = "http://10.252.109.223:3443/api/sendISPFData";
    
    let response;
    
    try {
        // await before fetch
        response =  await fetch(hackURL, {
            method: "PUT",
            headers: {
                'Content-Type': 'application/json',
            },
            body: menuSelectedJSON,
        }); // end let response
    } catch (error) {
        // TypeError: Failed to fetch
        console.log("Fetch error:", error);
    } // end try
    
    if (response.ok) {
        let json = await response.json();
        console.log("response.text()=" + json.returnedISPFData);
        
        // Need it global, gets created later, 2D array 
        grid;
        // Get the ISPF Primary Options Menu
        // We are going to wait here until we 
        // get all of the data from the API
        panelDataAll = json.returnedISPFData;

        // Parse out the Panel data then parse each piece
        panelData = panelDataAll.ispfData.PNL; // All of the 'panel' data
        screenName = panelData.NME; // Name of the Panel
        screenNumber = panelData.SCR; // Active screen number (tab)
        screenWidth = panelData.RWS; // Number of panel rows (204 max)
        screenHeight = panelData.CLS; // Number of panel columns (160 max)
        screenHandle = panelData.HDL; // Used internally by ISPF
        screenTitle = panelData.TLE; // Panel title

        // Update the web browser title to show the current screen 
        document.title = "GenInsight - " + screenTitle;

        cursorData = panelData.CUR; // Cursor position after load
        curActData = panelData.IFY; // Identify currently active for this panel display
        msgsData = panelData.MSG;   // Message for panel
        areaData = panelData.ARE;    // The scrollable, dynamic, and table model areas defined for this panel
        colorData = panelData.CHA;    // The color and highlighting defined for the character level attributes used in dynamic areas
        menuData = panelData.MNU;   // The action bar choices and pull-down menus for the panel
        fieldsData = panelData.FLD; // The input/output/point-and-shoot/text fields displayed on this panel
        pfKeyData = panelData.KEY;  // The function keys defined for display with this panel

        loadPage();        
        
    } else {
        // Error getting ISPF Panel, could be z/OSMF or other issue
        
    } // end if (response.ok)
    
} // end function menuTypeAndID() 



// This gets the PF Keys and their action
// also creates the html to display them
//TODO: Allow GenInsight specific assignment
function getPFKeys(isVisible, isTop) {
    console.log("getPFKeys() started");
    
    let htmlStart = '';
    
    // This covers visible/not visible for top or bottom
    //TODO: Make sure only top or bottom will show, not both
    if (isVisible) { // Show PFKeys
        htmlStart = '<div class="w3-row-padding" id="pfKeyRow">' +
                    '<table>' +
                        '<tr>';
    } else { // Do not show PFKeys
        htmlStart = '<div class="w3-row-padding" id="pfKeyRow" style="visibility: hidden">' +
                    '<table>' +
                        '<tr>';
    }
    
    let htmlMid = '';
    // We want to skip displaying "ENTER" as a PFKey of it's own
    pfKeyData.forEach(function(pfKey) {
        console.log("PFKey: " + pfKey.K + " = " + pfKey.N);
        
        if (pfKey.K === "ENTER") {
            return;
        }
        // K = 11, or PF11 from keydown
        // N = Forward
        let pfKeyLabel = "PF" + pfKey.K;
        let pfKeyIdentifier = pfKey.K; // Enter,1,2,3
        let pfName = pfKey.N;
        let pfIcon = ''; // "fa fa-question"
        
        /*************************************************************
        * Key   Name        Icon                AltName     Default
        * Enter Enter       
        * 1     Help        fa fa-question      Help        Help
        * 2     Split       fa fa-clone         Split       Split   
        * 3     End         fa fa-ban           Exit        End
        * 4     Return                                      Return
        * 5     Ifind       find next?                      Rfind    
        * 6     Book                            Actions     Toggle
        * 7     Up          fa fa-arrow-up                  Up
        * 8     Down        fa fa-arrow-down                Down
        * 9     Swap        fa fa-refresh                   Swap    
        * 10    Left        fa fa-arrow-left    Backward    Bref
        * 11    Right       fa fa-arrow-right   Forward     Fref
        * 12    Retrieve                        Cancel      Retrieve
        ****************************************************************/
        
        /*
        if (pfKeyIdentifier === "1") {
            
        } else if (pfKeyIdentifier === "2") {
            
        } else if (pfKeyIdentifier === "3") {
            
        } else if (pfKeyIdentifier === "4") {
            
        } else if (pfKeyIdentifier === "5") {
            
        } else if (pfKeyIdentifier === "6") {
            
        } else if (pfKeyIdentifier === "7") {
            
        } else if (pfKeyIdentifier === "8") {
            
        } else if (pfKeyIdentifier === "9") {
            
        } else if (pfKeyIdentifier === "10") {
            
        } else if (pfKeyIdentifier === "11") {
            
        } else if (pfKeyIdentifier === "12") {
            
        } else if (pfKeyIdentifier === "Enter") {
            // Dont do anything, we do not need to display this as a pfkey
        } else {
            
        }
        */
        
        // Create a new <td> tag for each key
        // For now, we are removing the icon, until there is a better algorithm
        // to figure out what a given PF key is set to: <i class="fa fa-question"></i><br>
        //  Added w3-black so the buttons are not 'see-through'
        htmlMid += '<td><button class="w3-btn w3-border w3-black" onClick="pfKeyPressed(&quot;' + pfKeyIdentifier + '&quot;)"><span>' + pfKeyLabel + '<br>' + pfName + '</span></button></td>'
    });
    
    let htmlEnd = '</tr></table></div>';
    let html = htmlStart + htmlMid + htmlEnd;
    // Get the html element and replace with html
    // Check if key preference is top or bottom
    if (isTop) { // PF Keys on top
        let pfKeyRowDiv = document.getElementById('pfKeyDivTop');
        pfKeyRowDiv.innerHTML = html;
    } else { // PF Keys on bottom
        let pfKeyRowDiv = document.getElementById('pfKeyDivBot');
        pfKeyRowDiv.innerHTML = html;
    } // end if (isTop)
    
} // end function getPFKeys

// pfKeyIdentifier is the 'Enter, 1, 2, 3, ....'
// That gets sent as:
// "RESPONSE":{
//      "TYPE":"KEY",
//      "ID":<pfKeyIdentifier>
//  }
function pfKeyPressed(pfKeyIdentifier) {
    console.log("PFKey-" + pfKeyIdentifier + ", was pressed");
    
    let strJSON = {"PANEL":{"SCREENID": screenNumber, "NAME": screenName, "RESPONSE":{"TYPE":"KEY","ID":pfKeyIdentifier},"CURSOR":{"ROW":"4","COL":"14"},"FIELDS":[]}};
    let jsnJSON = JSON.stringify(strJSON);
    sendISPFData(jsnJSON);
}

/**************************************************************************
* sessionStorage is similar to localStorage ; the difference is that while
* data in localStorage doesn't expire, data in sessionStorage is cleared 
* when the page session ends. Whenever a document is loaded in a particular 
* tab in the browser, a unique page session gets created and assigned to 
* that particular tab. 
* Both are Key/Value pairs
* -----------------------------------------------------------------------
* (L) isDarkMode: bool 
* (L) isTuringVisibleOnLoad: bool 
* (L) isPFKeysVisible: bool
* (L) isPFKeysOnTop: bool 
* (L) isSwapBarVisible: bool 
* (L) isSwapBarOnTop: bool
* (L) showMenuOnHover: bool
* (L) turingDataOrder: [int] (0=GenAI, 1=PF1, 2=QuickRef, 3=Google)
* (S) lastLoggedIn: datetime 
* (S) lastzOSMFStayAlive: datetime
* (S) commandHistory: array/save by screen name?
**************************************************************************/

function setDefaultProfileSettings() {
    // Check if local storage key 'isDarkMode' exists
    // if it does, do not continue
    if (localStorage.getItem("isDarkMode") === null) {
        localStorage.setItem("isDarkMode", true);
        localStorage.setItem("isTuringVisibleOnLoad", true);
        localStorage.setItem("isPFKeysVisible", true);
        localStorage.setItem("isPFKeysOnTop", true);
        localStorage.setItem("isSwapBarVisible", false);
        localStorage.setItem("isSwapBarOnTop", true);
        localStorage.setItem("showMenuOnHover", false);
        localStorage.setItem("turingDataOrder", [0,1,2,3]);
        console.log("Default Profile Settings Created");
    }
}

/*******************************
* Local (permanent/preferences)
*******************************/
function getLocalStorage(lsKey) {
    localStorage.getItem(lsKey);
}

function setLocalStorage(lsKey, lsData) {
    localStorage.setItem(lsKey, lsData);
}

// need removeItem
// need clear 

/**************************
* Session (new every time)
**************************/
function getSessionStorage(ssKey) {
    sessionStorage.getItem(ssKey);
}

function setSessionStorage(ssKey, ssData) {
    sessionStorage.setItem(ssKey, ssData);
}
/*************** END STORAGE SECTION **************************************/

/* Notes, function prototypes, etc

function countColumnsInRow(tableId, rowNumber) {
    // Get the table element
    let table = document.getElementById(tableId);

    // Check if the table exists
    if (!table) {
        console.error('Table not found');
        return;
    }

    // Initialize column count
    let columnCount = 0;

    // Iterate over each cell in the table
    for (let i = 0, row; row = table.rows[i]; i++) {
        // Check if the row is the one we are interested in
        if (i === rowNumber - 1) {
            for (let j = 0, col; col = row.cells[j]; j++) {
                // Check if the cell's ID matches the expected format
                if (col.id === `${rowNumber}.${j + 1}`) {
                    columnCount++;
                }
            }
            break;
        }
    }

    return columnCount;
}

// Example usage
let columnsInRow3 = countColumnsInRow('myTableId', 3);
console.log('Number of columns in row 3:', columnsInRow3);


*/



















