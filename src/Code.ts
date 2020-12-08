// Compiled using ts2gas 3.6.3 (TypeScript 3.9.7)
import HtmlOutput = GoogleAppsScript.HTML.HtmlOutput
import { RePair } from './RePair'
import { RLESP } from './RLESP'
import SpreadSheet = GoogleAppsScript.Spreadsheet.Spreadsheet
import Sheet = GoogleAppsScript.Spreadsheet.Sheet
let outputString: string = "";

function onOpen(e) {
    let ui = SpreadsheetApp.getUi();
    let menu = ui.createAddonMenu();
    menu.addItem('VisGC', 'Start');
    menu.addItem('TblToTex', 'ConvertGSToTabular');
    menu.addToUi();
}

function onInstall(e) {
    onOpen(e);
}
function Start() {

    const html: HtmlOutput = HtmlService.createHtmlOutputFromFile('dialog');
    SpreadsheetApp.getUi().showModalDialog(html, "input string and settings");
}

function getMsg(form: HTMLFormElement) {
    //Browser.msgBox(form.inputString + " " + form.compType + " " + form.numAlph + " " + form.stLine);
    const vgc = new VisGC(form.inputString, form.compType, form.numAlph, form.stLine);
}

function getOutputString() {
    return outputString;
}

function ConvertGSToTabular() {
    const ss: SpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
    const sh: Sheet = ss.getActiveSheet();
    let range = sh.getActiveRange();
    range.setNumberFormat('@');
    let vals: string[][] = range.getValues();
    let colors = range.getFontColors();
    // Logger.log("end getVal");
    // let outputString: string = "";
    outputString += "\\begin{table}[h]\\n  \\vspace{-0.4cm}\\n  \\small\\n  \\begin{tabular}{|";
    // Logger.log("vals[0].length: " + vals[0].length);
    for (let i = 0; i < vals[0].length; i++) {
        outputString += "c|";
    }
    // Logger.log("start double loop");
    outputString += "} \\hline\\n"
    for (let i: number = 0; i < vals.length; i++) {
        let count: number = 1;
        let pre: string = vals[i][0];
        let preColor: string = colors[i][0];
        outputString += "    ";
        //Logger.log(i);
        for (let j = 0; j < vals[i].length; j++) {
            if (j != (vals[i].length - 1)) {
                if (vals[i][j + 1] == '') {
                    count++;
                }
                else {
                    if (count > 1) {
                        outputString += "\\multicolumn{" + count + "}" + "{c|}{";
                        if (preColor != "#000000") {
                            outputString += "{\\color[HTML]{" + preColor.substr(1, preColor.length - 1) + "}{";
                        }
                        outputString += pre;
                        if (preColor != "#000000") {
                            outputString += "}}";
                        }
                        outputString += "} & ";
                    }
                    else {
                        if (preColor != "#000000") {
                            outputString += "{\\color[HTML]{" + preColor.substr(1, preColor.length - 1) + "}{";
                        }
                        outputString += pre;
                        if (preColor != "#000000") {
                            outputString += "}}"
                        }
                        outputString += " & ";
                    }
                    count = 1;
                    pre = vals[i][j + 1];
                    preColor = colors[i][j + 1];
                }
            }
            else {
                if (count > 1) {
                    outputString += "\\multicolumn{" + count + "}" + "{c|}{";
                    if (preColor != "#000000") {
                        outputString += "{\\color[HTML]{" + preColor.substr(1, preColor.length - 1) + "}{";
                    }
                    outputString += pre;
                    if (preColor != "#000000") {
                        outputString += "}}"
                    }
                    outputString += "}";
                }
                else {
                    if (preColor != "#000000") {
                        outputString += "{\\color[HTML]{" + preColor.substr(1, preColor.length - 1) + "}{";
                    }
                    outputString += pre;
                    if (preColor != "#000000") {
                        outputString += "}}"
                    }
                }
            }
        }
        outputString += "\\\\ \\hline\\n";
    }
    outputString += "  \\end{tabular}\\n\\end{table}";

    //Browser.msgBox("Result", outputString, Brower.Buttons.OK);
    const html: GoogleAppsScript.HTML.HtmlTemplate = HtmlService.createTemplateFromFile('output');
    html.one = outputString.replace(/\\n/g, '<br>');
    //const outputString2: string = "<input id=\"copyTarget\" value = \"" + outputString + "\" readonly > <button onclick=\"copyToClipboard()\">Copy text</button>";
    //html.setContent(outputString2);
    //html.setContent("<p>" + outputString + "</p>");
    // html.append()
    SpreadsheetApp.getUi().showModalDialog(html.evaluate(), "result");

    /*if (res == 'ok') {
        let navi: Navigator = new Navigator();
        navi.clipboard.writeText(outputString)
            .then(() => {
                // Success!
            })
            .catch(err => {
                console.log('Something went wrong', err);
            });
    }*/
}

class VisGC {

    constructor(inputString: string, compType: string, numAlph: number, stLine: number) {
        //Browser.msgBox(inputString + " " + compType + " " + numAlph + " " + stLine);
        switch (compType) {
            case "RePair":
                const obj1: RePair = new RePair(inputString, stLine);
                //console.log("RePair");
                break;
            case "RLESP":
                const obj2: RLESP = new RLESP(inputString, stLine, numAlph);
                //console.log("RLESP");
                break
            default:
                console.log("default");
                break;
        }
    }

};
