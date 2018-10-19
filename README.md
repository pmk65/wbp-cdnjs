# wbp-cdnjs
Plugin for Blumentals WeBuilder/RapidPHP/RapidCSS/HTMLPad editors

This is a plugin for the following editors:

Webuilder: http://www.webuilderapp.com/<br/>
RapidPHP: http://www.rapidphpeditor.com/<br/>
RapidCSS: https://www.rapidcsseditor.com/<br/>
HTMLPad: https://www.htmlpad.net/


#### Function:

Lookup keyword at cdnjs.com and add latest JavaScript or CSS to AutoCompleter.
Bonus: If no keyword is entered, the plugin will list all valid local files in current folder and subfolders.

**Example of AutoCompleter triggered with keyword:**

![AutoCompleter triggered with keyword](http://i.imgur.com/H23jg0A.png "AutoCompleter triggered with keyword")

**Example of AutoCompleter triggered without keyword:**

![AutoCompleter triggered without keyword](http://i.imgur.com/V79BaJS.png "AutoCompleter triggered without keyword")


#### Usage:
Place the cursor inside a <script> SRC attribute or a <link> HREF attribute and type in a keyword like "jque" and activate the AutoCompleter (Press Ctrl + Space). The plugin then add the matching urls found at CDNJS to the WeBuilder AutoCompleter.
If no keyword is entered, the plugin will add any matching files in the current folder to the WeBuilder AutoCompleter.

Note: Plugin got 3 options: "Return immediately on exact match", "Remove URI Scheme" and "Show CDNJS library description", which you can change via the Plugin Manager. All options is enabled by default.


#### Installation:
1) Download plugin .ZIP file.
2) Open editor and select "Plugins -> Manage Plugins" from the menu.
3) Click "Install" and select the .ZIP file you downloaded in step 1.
