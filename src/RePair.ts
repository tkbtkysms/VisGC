import SpreadSheet = GoogleAppsScript.Spreadsheet.Spreadsheet
import Sheet = GoogleAppsScript.Spreadsheet.Sheet

export class RePair {
    c2v: { [key: string]: number; };
    v2c: { [key: number]: string; };
    dict: { [key: number]: number };
    dictLen: { [key: number]: number };
    varSeq: number[][];
    loop: number;
    constructor(inputString: string, stLine: number) {
        this.c2v = {};
        this.v2c = {};
        this.dict = {};
        this.dictLen = {};
        this.varSeq = [];

        this.varSeq.push(this.inputCharSeq2VarSeq(inputString));
        //CheckC2VAndV2C(c2v, v2c);
        let numVar: number = Object.keys(this.c2v).length + 1;
        this.initDictLen();
        this.loop = 0;
        while (this.varSeq[this.loop].length > 1) {
            // console.log("this.loop: " + this.loop);
            const bigrams: { [key: number]: number } = this.countBigrams(this.varSeq[this.loop]);
            //PrintBigrams(bigrams, v2c);
            const maxKey: number = this.getMaxBigram(bigrams);
            if (bigrams[maxKey] < 2) {
                break;
            }
            this.dict[numVar] = maxKey;
            this.dictLen[numVar] = this.dictLen[Math.floor(maxKey / 1000)] + this.dictLen[maxKey % 1000];
            this.repalceMaxBigram(Math.floor(maxKey / 1000), maxKey % 1000, numVar);
            //PrintSeq(varSeq[this.loop + 1]);
            numVar++;
            this.loop++;
        }
        this.printRepairSeq(stLine);
    }

    inputCharSeq2VarSeq(inputString: string) {
        const splitedSTR: string[] = inputString.split('');
        const ret: number[] = new Array(splitedSTR.length);
        let charCount: number = 1;
        for (let i = 0; i < splitedSTR.length; i++) {
            if (!this.c2v[splitedSTR[i]]) {
                //console.log(splitedSTR[i]);
                this.c2v[splitedSTR[i]] = charCount;
                this.v2c[charCount] = splitedSTR[i];
                charCount++;
            }
            ret[i] = this.c2v[splitedSTR[i]];
        }
        return ret;
    }

    initDictLen() {
        for (let i: number = 0; i <= Object.keys(this.c2v).length; i++) {
            this.dictLen[i] = 1;
        }
    }

    countBigrams(varSeq: number[]) {
        const bigrams: { [key: number]: number } = {};
        let pre: number = varSeq[0];
        let countRun: number = 1;
        for (let i: number = 1; i < varSeq.length; i++) {
            if (pre === varSeq[i]) {
                countRun++;
            }
            else {
                if (countRun >= 2) {
                    if (!bigrams[1000 * pre + pre]) {
                        bigrams[1000 * pre + pre] = 0;
                    }
                    bigrams[1000 * pre + pre] += Math.floor(countRun / 2);
                    // add countRun/2 pairs (pre, pre)
                }
                // add pair(pre, varSeq[i]);
                if (!bigrams[1000 * pre + varSeq[i]]) {
                    bigrams[1000 * pre + varSeq[i]] = 0;
                }
                bigrams[1000 * pre + varSeq[i]] += 1;
                countRun = 1;
            }
            pre = varSeq[i];
        }

        if (countRun > 1) {
            if (!bigrams[1000 * pre + pre]) {
                bigrams[1000 * pre + pre] = 0;
            }
            bigrams[1000 * pre + pre] += Math.floor(countRun / 2);
        }
        //console.log("test");
        return bigrams;
    }

    getMaxBigram(bigrams: { [key: number]: number }) {
        let max: number = 0;
        let maxKey: number = 0;
        for (const key of Object.keys(bigrams)) {
            if (bigrams[key] > max) {
                max = bigrams[key];
                maxKey = Number(key);
            }
        }
        return maxKey;
    }


    repalceMaxBigram(left: number, right: number, newVar: number) {
        this.varSeq.push([]);
        // console.log("this.varSeq[this.loop].length  at ReplaceMaxBigram: " + this.varSeq[this.loop].length);
        for (let i: number = 0; i < this.varSeq[this.loop].length - 1; i++) {
            if (this.varSeq[this.loop][i] === left && this.varSeq[this.loop][i + 1] === right) {
                this.varSeq[this.loop + 1].push(newVar);
                i++
                if (i === this.varSeq[this.loop].length - 2) {
                    this.varSeq[this.loop + 1].push(this.varSeq[this.loop][i + 1]);
                }
            }
            else {
                this.varSeq[this.loop + 1].push(this.varSeq[this.loop][i]);
                if (i === this.varSeq[this.loop].length - 2) {
                    this.varSeq[this.loop + 1].push(this.varSeq[this.loop][i + 1]);
                }
            }
        }
    }

    printRepairSeq(stLine: number) {
        const ss: SpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
        const sh: Sheet = ss.getActiveSheet()
        stLine = Number(stLine);
        ss.insertRowsBefore(stLine, this.varSeq.length + 1);
        //const strstLine: string = String(stLine);
        for (let i: number = this.varSeq.length - 1; i > -1; i--) {
            // console.log("output_set[i].length: " + this.varSeq[i].length);
            ///Browser.msgBox(String(stLine) + " " + String(this.varSeq.length) + " " + i);
            //Browser.msgBox(typeof (stLine));
            const num: number = stLine + this.varSeq.length - 1 - i;
            //Browser.msgBox(String(num));
            sh.getRange(num, 1).setValue("$S_" + i + "$");
            let printPos: number = 2;
            for (const ch of this.varSeq[i]) {
                if (this.dictLen[ch] > 1) {
                    // console.log("this.dictLen[this.varSeq[i][j]]: " + this.dictLen[this.varSeq[i][j]]);        
                    for (let k = 0; k < this.dictLen[ch]; k++) {
                        sh.getRange(stLine + this.varSeq.length - 1 - i, printPos).setValue("$X_{" + (ch - Object.keys(this.v2c).length) + "}$");
                        printPos++;
                    }
                    const colST: number = stLine + this.varSeq.length - 1 - i;
                    const rowST: number = printPos - this.dictLen[ch];
                    const numCol: number = 1;
                    const numRow: number = this.dictLen[ch];
                    // console.log("range: " + row_st + " , " + row_st + num_row - 1);
                    sh.getRange(colST, rowST, numCol, this.dictLen[ch]).merge();
                    // console.log("rng: " + (4 + (this.varSeq.length - 1 - i)) + " , " + printPos + " , " + (4 + (this.varSeq.length - 1 - i)) + " , " + (printPos + this.dictLen[this.varSeq[i][j]]- 1) );
                }
                else {
                    // console.log("rng: " + ( 4 + (this.varSeq.length - 1 - i)) + " , " + printPos);
                    sh.getRange((stLine + (this.varSeq.length - 1 - i)), printPos).setValue(this.v2c[ch]);
                    printPos++;
                }
            }
        }
        const rgn: GoogleAppsScript.Spreadsheet.Range = sh.getRange(stLine, 1, this.varSeq.length, this.varSeq[0].length + 1);
        rgn.setBorder(true, true, true, true, true, true);
    }
};
