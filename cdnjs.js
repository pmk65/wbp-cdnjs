/**
 * Lookup keyword at cdnjs.com and add latest JavaScript to document
 *
 * Type in a keyword like "jquery" and activate the plugin.
 * The plugin will then find the latest verston of jquery at cdnjs.com
 * and replace the keyword with a link to the JavaScript file.
 *
 * @category  WeBuilder Plugin
 * @package   CDNJS Lookup
 * @author    Peter Klein <pmk@io.dk>
 * @copyright 2018 Peter Klein
 * @license   http://www.freebsd.org/copyright/license.html  BSD License
 * @version   2.0
 */

/**
 * [CLASS/FUNCTION INDEX of SCRIPT]
 *
 *     52   function OnAutoComplete(CodeType, ACType, Strings, AKey, AllowPopup, ShowImages)
 *    132   function OnAutoCompleteInsert(ACType, ListItemAtCursorAC, s, ACWordStart, ACWordLength, ACLineOffset, Handled)
 *    164   function AdjustCursorPosition(Sender)
 *    179   function LookupKeyword(Strings, keyword, validExt)
 *    256   function ParseJson(jsonStr)
 *    287   function AddLocalFiles(Strings, folder, validExt, prevFolder)
 *    333   function GetFilesFoldersList(folder, mode)
 *    347   function OnInstalled()
 *
 * TOTAL FUNCTIONS: 8
 * (This index is automatically created/updated by the WeBuilder plugin "DocBlock Comments")
 *
 */

 /**
  * Global var for storing cursor position adjustment value
  *
  * @var cursorAdjust
  */
 var cursorAdjust = 0;

/**
 * Callback function for when AutoComplete is triggered
 *
 * @param  int      CodeType
 * @param  int      ACType
 * @param  object   Strings
 * @param  string   AKey
 * @param  bool     AllowPopup
 * @param  bool     ShowImages
 *
 * @return void
 */
function OnAutoComplete(CodeType, ACType, Strings, AKey, AllowPopup, ShowImages) {

	// If AKey = "!", then user has manually triggered the autocompleter

	if ((ACType == 2) && (CodeType == 1) && (Strings[0] == "{\\rtf\\b Choose URL... }")) {

		var uSel = Editor.Selection;

		// Get content to the left of the cursor position
		var leftText = Copy(Editor.Lines[uSel.SelStartLine], 1, uSel.SelStartColReal);

		var validExt = "";
		if (RegexMatch(leftText, "<script(?![\\s\\S]*<script)[\\s\\S]*$", true) != "") {
			validExt = ".js";
		}
		else if (RegexMatch(leftText, "<link(?![\\s\\S]*<link)[\\s\\S]*$", true) != "") {
			validExt = ".css";
		}

		if (validExt != "") {

			var keyword = AutoComplete.GetwordBeforeCursor(".-_");

			// Minimum 2 chars required
			if (Length(Trim(keyword)) > 1) {

				AutoComplete.Clear(Strings);
	 			var j = AutoComplete.AddItem(Strings, "Choose URL...", "{\\rtf\\b Choose URL... }");
				AutoComplete.SetImageIndex(j, 0);

				ShowImages = true;
				AllowPopup = true;

				var res = LookupKeyword(Strings, keyword, validExt);
				if (res != "") {
					AutoComplete.Clear(Strings);
					AllowPopup = false;

					// Direct match found, so replace everything between the quotes with the result.
 					uSel.SelStartColReal = Length(Replace(leftText, RegexReplace(leftText, ".*=(\"|'?)", "", true), ""));
					uSel.SelEndColReal = Length(leftText);
					Editor.Selection = uSel;
					Editor.SelText = res;
				}
			}
			else {
				// No keyword, so we try to find files relative to current document.
				AutoComplete.Clear(Strings);
	 			var k = AutoComplete.AddItem(Strings, "Choose URL...", "{\\rtf\\b Choose URL... }");
				AutoComplete.SetImageIndex(k, 0);

				ShowImages = true;
				AllowPopup = true;

				var docFolder = ExtractFilePath(Document.Filename);
				if (docFolder == "") {
					// Document not saved yet or on FTP
					return;
				}

				// Scan local folder and add files to AutoCompleter
				AddLocalFiles(Strings, docFolder, validExt, "");
			}
		}
	}
}

/**
 * Signal fired when user selects an item from auto-complete.
 *
 * @param  int      ACType
 * @param  string   ListItemAtCursorAC
 * @param  string   &s
 * @param  int      &ACWordStart
 * @param  int      &ACWordLength
 * @param  int      &ACLineOffset
 * @param  bool    &Handled
 *
 * @return void
 */
function OnAutoCompleteInsert(ACType, ListItemAtCursorAC, s, ACWordStart, ACWordLength, ACLineOffset, Handled) {

    // HTML type and string starting with numbered sorting "fix" padding
	if ((ACType == 2) && (RegexMatch(s, "^<\\d+>", true) != "")) {

        s = RegexReplace(s, "(^<\\d+>)", "", true); // Remove the numbered sorting "fix" padding

        cursorAdjust = 1;
        if (ACWordLength != 0) {
            // Word is quoted
            ACWordStart++;
            cursorAdjust++;
        }

        ACWordLength = Length(ListItemAtCursorAC);  // Set length to word length without quotes

        Handled = true;

        Script.TimeOut(10, "AdjustCursorPosition");

    }

}

/**
 * Adjust cursor position after inserting string
 * So that cursor is placed outside quotes
 *
 * @param  object   Sender
 *
 * @return void
 */
function AdjustCursorPosition(Sender) {
    var sel = Editor.Selection;
    sel.SelStart += cursorAdjust;
    Editor.Selection = sel;
}

/**
 * Make a lookup at cdnjs.com and add results to AutoComplete object
 *
 * @param  object   Strings
 * @param  string   keyword
 * @param  string   validExt
 *
 * @return string
 */
function LookupKeyword(Strings, keyword, validExt) {

	// Fields to query at cdnjs.com. The "latest" and "name" fields are always included
	var fields = "version";
	var showDesc = Script.ReadSetting("Show CDNJS library description", "1");
	if (showDesc == "1") {
		fields += ",description";
	}

	// Make lookup at cdnjs.com
	var uri = "http://api.cdnjs.com/libraries?fields=" + fields + "&search=" + keyword;
    var xhr = CreateOleObject("MSXML2.ServerXMLHTTP");
    xhr.open("GET", uri, false);
	xhr.setRequestHeader("Content-Type", "application/json");
	xhr.setRequestHeader("Cache-Control", "max-age=3600");
    xhr.send();
	if (xhr.status != 200) {
		Script.Message("XHR Error: " + xhr.statusText);
		return "";
	}

	// Parse Json response
	var objJson = ParseJson(xhr.responseText);

	// Populate AutoComplete Object with Json results
	var resObj = objJson.getProp("results");
	var len = resObj.length;
	var plen = _t(Length(_t(len))); // "fix"

	for (var i=0;i<len;i++) {
		var item = resObj.getProp(i);
		var cdnUri = item.latest;

		// Skip files that doesn't have the correct file extension
		if (RegexMatch(cdnUri,"(\\.[^.]+)$", true) != validExt) {
			continue;
		}

		// Remove URI Scheme
		if (Script.ReadSetting("Remove URI Scheme", "1") == "1") {
			cdnUri = RegexReplace(cdnUri, "^[^\\/]*", "", true);
	   	}

		// Return if exact match is found
		if ((Script.ReadSetting("Return immediately on exact match", "1") == "1")  && (item.name == keyword)) {
			return cdnUri;
		}

		var desc = "";
		if (showDesc == "1") {
		 	desc = "  [" + item.description + "]";
		}

		var label = "{\\colortbl\\red128\\green128\\blue128}{\\rtf\\cf0 CDN }{\\rtf\\b " + item.name + "}  {\\rtf\\cf0 " + item.version + desc + " }";

		// "Fix" to display the items in unsorted order. Adds numbered padding front of URI
		// Drawback is that the padding must be removed afterwards
		cdnUri = format("<%." + plen + "d>", [i]) + cdnUri;

		var j = AutoComplete.AddItem(Strings, cdnUri, label);
		AutoComplete.SetImageIndex(j, 4);
	}

	return "";
}

/**
 * JSON parser using "htmlfile" OLE object.
 * The JSON result object is extended with two custom methods, making data fully
 * accessible from FastScript. Custom methods:
 * 	  getProp(key/index) to access properties by index or name
 * 	  getKeys(dummy) to get list of keys
 *
 * @param  string   jsonStr The JSON string to parse
 *
 * @return mixed    variant or empty string if failure
 */
function ParseJson(jsonStr) {

	// Create htmlfile COM object
	var HFO = CreateOleObject("htmlfile"), jsonObj;

	// force htmlfile to load Chakra engine
	HFO.write("<meta http-equiv='x-ua-compatible' content='IE=9' />");

	// Add custom method to objects
	HFO.write("<script type='text/javascript'>Object.prototype.getProp=function(t){return this[t]},Object.prototype.getKeys=function(){return Object.keys(this)};</script>");

	// Parse JSON string
	try jsonObj = HFO.parentWindow.JSON.parse(jsonStr);
	except jsonObj = ""; // JSON parse error

	// Unload COM object
	HFO.close();

	return jsonObj;
}

/**
 * Add local CSS and JavaScript files to AutoCompleter
 *
 * @param  object   Strings
 * @param  string   folder
 * @param  string   validExt
 * @param  string   prevFolder
 *
 * @return void
 */
function AddLocalFiles(Strings, folder, validExt, prevFolder) {
	// Remove trailing backslash
	folder = RegexReplace(folder, "\\\\$", "", true);

	// Get files in current folder
	var FL = new TStringList;
	FL.CommaText = GetFilesFoldersList(folder, 0);
	for (var i=0;i<FL.Count;i++) {

		var item = prevFolder + FL[i];

		// Skip files that doesn't have the correct file extension
		if (RegexMatch(item, "(\\.[^.]+)$", true) != validExt) {
			continue;
		}

		// Add files to autocomplete
		var label = "{\\colortbl\\red128\\green128\\blue128}{\\rtf\\cf0 LOCAL }{\\rtf\\b " + item + "   }";

        item = format("<%.3d>", [i+1]) + item;

 		var k = AutoComplete.AddItem(Strings, item, label);
		AutoComplete.SetImageIndex(k, 1);
	}

	delete FL;

	var DL = new TStringList;
	DL.CommaText = GetFilesFoldersList(folder, 1);

	// loop through each folder recursively and repeat the process of adding files
	for (var j=0;j<DL.Count;j++) {
		AddLocalFiles(Strings, folder + "/" + DL[j], validExt, prevFolder + DL[j] + "/");
	}

	delete DL;
}

/**
 * Get list of files or folders of a given path
 *
 * @param  string   folder  the root folder
 * @param  int      mode    0=files, 1=folders
 *
 * @return string   comma separated list of file or folder names
 */
function GetFilesFoldersList(folder, mode) {
	var type = "Files";
	if (mode) type = "SubFolders";
    SC = CreateOleObject("MSScriptControl.ScriptControl");
    SC.Language = "JScript";
    SC.AddCode("function getFilesFolders(p){var r=[],o=new ActiveXObject('Scripting.FileSystemObject'),f=new Enumerator(o.GetFolder(p)." + type + ");for(;!f.atEnd();f.moveNext()){r.push(f.item().Name);}return r;}");
    return SC.Run("getFilesFolders", folder);
}

/**
 * Show info when plugin is installed
 *
 * @return void
 */
function OnInstalled() {
    if (WeBuilder.BuildNumber < 194) {
        return "Newer editor version is required for this plugin to work";
    }
    alert("CDNJS 2.0 by Peter Klein installed sucessfully!");
}

Script.ConnectSignal("installed", "OnInstalled");
Script.ConnectSignal("auto_complete", "OnAutoComplete");
Script.ConnectSignal("auto_complete_insert", "OnAutoCompleteInsert");
