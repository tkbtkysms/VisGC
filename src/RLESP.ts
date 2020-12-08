import SpreadSheet = GoogleAppsScript.Spreadsheet.Spreadsheet
import Sheet = GoogleAppsScript.Spreadsheet.Sheet

export class RLESP {
    stLine: number;
    numAR: number;
    c2v: { [key: string]: number; };
    v2c: { [key: number]: string; };
    dict: { [key: number]: number };
    rdict: { [key: number]: number };
    dictLen: { [key: number]: number };
    varSeq: number[][];
    loop: number;
    labels: number[][][];

    constructor(inputString: string, stLine1: number, numAlph: number) {
        this.stLine = stLine1;
        this.numAR = numAlph;
        this.c2v = {};
        this.v2c = {};
        this.dict = {};
        this.rdict = {};
        this.dictLen = {};
        this.varSeq = [];
        this.varSeq.push(this.inputCharSeq2VarSeq(inputString));
        this.initDictLen();
        this.loop = 0;
        this.labels = [];
        while (this.varSeq[this.loop].length > 1) {
            this.varSeq.push([]);
            this.rle();
            this.loop++;
            this.labels.push([]);
            this.computeLabels();
            this.replaceSeqNIR();
            this.loop++;
        }
        this.printESPSeq2();
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

    rle() {
        let count: number = 1;
        this.varSeq.push([]);
        for (let i = 0; i < this.varSeq[this.loop].length - 1; i++) {
            if (this.varSeq[this.loop][i] == this.varSeq[this.loop][i + 1]) {
                count++;
            }
            else {
                if (count > 1) {
                    let var1: number = this.rdict[this.varSeq[this.loop][i] * 1000 + 50 * count];
                    if (!var1) {
                        var1 = Object.keys(this.rdict).length + Object.keys(this.c2v).length + 1;
                        this.rdict[this.varSeq[this.loop][i] * 1000 + 50 * count] = var1;
                        this.dict[var1] = this.varSeq[this.loop][i] * 1000 + 50 * count;
                        this.addDictLen2(var1);
                    }
                    this.varSeq[this.loop + 1].push(var1);
                }
                else {
                    this.varSeq[this.loop + 1].push(this.varSeq[this.loop][i]);
                }
                count = 1;
            }
        }

        if (this.varSeq[this.loop].length != 1) {
            if (count > 1) {
                let var1: number = this.rdict[this.varSeq[this.loop][this.varSeq[this.loop].length - 1] * 1000 + 50 * count];
                if (!var1) {
                    var1 = Object.keys(this.rdict).length + Object.keys(this.c2v).length + 1;
                    this.rdict[this.varSeq[this.loop][this.varSeq[this.loop].length - 1] * 1000 + 50 * count] = var1;
                    this.dict[var1] = this.varSeq[this.loop][this.varSeq[this.loop].length - 1] * 1000 + 50 * count;
                    this.addDictLen2(var1);
                }
                this.varSeq[this.loop + 1].push(var1);
            }
            else {
                this.varSeq[this.loop + 1].push(this.varSeq[this.loop][this.varSeq[this.loop].length - 1]);
            }
        }
        else {
            this.varSeq[this.loop + 1].push(this.varSeq[this.loop][0]);
        }
    }


    addDictLen2(var1: number) {
        this.dictLen[var1] = this.dictLen[Math.floor(this.dict[var1] / 1000)] * Math.floor((this.dict[var1] % 1000) / 50);
    }

    computeLabels() {
        const pre: number[] = [];

        for (let i = 0; i <= this.numAR; i++) {
            //   for (let i = 0; i < this.numAR; i++) {
            pre.push(1023);
        }
        for (let i = 0; i < this.varSeq[this.loop].length; i++) {
            this.labels[(this.loop >> 1)].push([]);
            //for (let j = 0; j < this.numAR; j++) {
            for (let j = 0; j <= this.numAR; j++) {
                if (j == 0) {
                    this.labels[(this.loop >> 1)][i].push(this.varSeq[this.loop][i]);
                    //this.labels[(this.loop >> 1)][i].push(this.alphReduction(pre[j], this.varSeq[this.loop][i]));
                    //pre[j] = this.varSeq[this.loop][i];
                }
                else {
                    this.labels[(this.loop >> 1)][i].push(this.alphReduction(pre[j - 1], this.labels[(this.loop >> 1)][i][j - 1]));
                    pre[j - 1] = this.labels[(this.loop >> 1)][i][j - 1];
                }
            }
        }
    }

    alphReduction(a: number, b: number) {
        let diffBitPos: number = this.tcz(a ^ b);
        return (diffBitPos << 1) + ((b >> diffBitPos) & 1);
    }

    tcz(num: number) {
        let ret: number = 0;
        for (let i: number = 0; !(num & 1) && i < 64; i++) {
            ret++;
            num = (num >> 1);
        }
        return ret;
    }

    replaceSeqNIR() {
        let i = 0;
        for (; i < this.varSeq[this.loop].length - 5;) {
            if (this.isPair(i)) {
                this.build2Tree(i);
                i += 2;
            }
            else {
                this.build2_2Tree(i);
                i += 3;
            }
        }
        //tmp = this.varSeq[this.loop].length - i;
        //console.log("remaining length: " + tmp);
        if (this.varSeq[this.loop].length - i == 5) {
            this.build2Tree(i);
            i += 2;
            this.build2_2Tree(i);
            i += 3;
        }
        else if (this.varSeq[this.loop].length - i == 4) {
            this.build2Tree(i);
            i += 2;
            this.build2Tree(i);
            i += 2;
        }
        else if (this.varSeq[this.loop].length - i == 3) {
            this.build2_2Tree(i);
            i += 3;
        }
        else if (this.varSeq[this.loop].length - i == 2) {
            this.build2Tree(i);
            i += 2;
        }
        else {
            this.varSeq[this.loop + 1].push(this.varSeq[this.loop][i]);
        }
    }

    isPair(i: number) {
        let pre: number = 1023;
        if (i != 0) {
            //pre = this.labels[(this.loop >> 1)][i - 1][this.numAR - 1];
            pre = this.labels[(this.loop >> 1)][i - 1][this.numAR];
        }

        //let first: number = this.labels[(this.loop >> 1)][i][this.numAR - 1];
        let first: number = this.labels[(this.loop >> 1)][i][this.numAR];
        //let second: number = this.labels[(this.loop >> 1)][i + 1][this.numAR - 1];
        let second: number = this.labels[(this.loop >> 1)][i + 1][this.numAR];
        //let third: number = this.labels[(this.loop >> 1)][i + 2][this.numAR - 1];
        let third: number = this.labels[(this.loop >> 1)][i + 2][this.numAR];

        if (this.isMaximal(pre, first, second)) {
            return true;
        }
        if (this.isMaximal(first, second, third)) {
            return false;
        }
        if (this.isMinimal(pre, first, second)) {
            return true;
        }
        return true;
    }

    isMaximal(a: number, b: number, c: number) {
        return ((a < b) && (b > c));
    }

    isMinimal(a: number, b: number, c: number) {
        return ((a > b) && (b < c));
    }

    build2Tree(i: number) {
        let var1: number = this.rdict[this.varSeq[this.loop][i] * 1000 + this.varSeq[this.loop][i + 1]];
        if (!var1) {
            var1 = Object.keys(this.rdict).length + Object.keys(this.c2v).length + 1;
            this.rdict[this.varSeq[this.loop][i] * 1000 + this.varSeq[this.loop][i + 1]] = var1
            this.dict[var1] = this.varSeq[this.loop][i] * 1000 + this.varSeq[this.loop][i + 1];
            this.addDictLen1(var1);
        }
        this.varSeq[this.loop + 1].push(var1);
    }

    build2_2Tree(i: number) {
        let var1: number = this.rdict[this.varSeq[this.loop][i + 1] * 1000 + this.varSeq[this.loop][i + 2]];
        if (!var1) {
            var1 = Object.keys(this.rdict).length + Object.keys(this.c2v).length + 1;
            this.rdict[this.varSeq[this.loop][i + 1] * 1000 + this.varSeq[this.loop][i + 2]] = var1;
            this.dict[var1] = this.varSeq[this.loop][i + 1] * 1000 + this.varSeq[this.loop][i + 2];
            this.addDictLen1(var1);
        }
        let var2: number = this.rdict[this.varSeq[this.loop][i] * 1000 + var1];
        if (!var2) {
            var2 = Object.keys(this.rdict).length + Object.keys(this.c2v).length + 1;
            this.rdict[this.varSeq[this.loop][i] * 1000 + var1] = var2;
            this.dict[var2] = this.varSeq[this.loop][i] * 1000 + var1;
            this.addDictLen1(var2);
        }
        this.varSeq[this.loop + 1].push(var2);
    }

    addDictLen1(i: number) {
        this.dictLen[i] = this.dictLen[Math.floor(this.dict[i] / 1000)] + this.dictLen[this.dict[i] % 1000];
    }

    printESPSeq() {
        const ss: SpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
        const sh: Sheet = ss.getActiveSheet();
        ss.insertRowsBefore(this.stLine, this.varSeq.length + 1);
        this.stLine = Number(this.stLine);
        // Browser.msgBox(typeof (this.stLine));
        // Browser.msgBox("abcd");
        // Browser.msgBox(this.stLine + " " + this.varSeq.length);
        for (let i: number = this.varSeq.length - 1; i > -1; i--) {
            //Browser.msgBox(String(this.stLine + this.varSeq.length - 1 - i));
            // console.log("output_set[i].length: " + this.varSeq[i].length);
            if (i % 2 == 0) {
                sh.getRange(this.stLine + (this.varSeq.length - 1 - i), 1).setValue("$S_" + (i >> 1) + "$");
            }
            else {
                sh.getRange(this.stLine + (this.varSeq.length - 1 - i), 1).setValue("$RLE(S_" + (i >> 1) + ")$");
            }
            let printPos: number = 2;
            for (let j: number = 0; j < this.varSeq[i].length; j++) {
                if (this.dictLen[this.varSeq[i][j]] > 1) {
                    //console.log("this.dictLen[this.varSeq[i][j]]: " + this.dictLen[this.varSeq[i][j]]);        
                    for (let k: number = 0; k < this.dictLen[this.varSeq[i][j]]; k++) {
                        sh.getRange((this.stLine + (this.varSeq.length - 1 - i)), printPos).setValue("$X_{" + (this.varSeq[i][j] - Object.keys(this.v2c).length) + "}$");
                        printPos++;
                    }
                    let colST: number = (this.stLine + (this.varSeq.length - 1 - i));
                    let rowST: number = printPos - this.dictLen[this.varSeq[i][j]];
                    let numCol: number = 1;
                    let numRow: number = this.dictLen[this.varSeq[i][j]];
                    // console.log("range: " + row_st + " , " + row_st + num_row - 1);
                    sh.getRange(colST, rowST, numCol, this.dictLen[this.varSeq[i][j]]).merge();
                    // console.log("rng: " + (4 + (this.varSeq.length - 1 - i)) + " , " + printPos + " , " + (4 + (this.varSeq.length - 1 - i)) + " , " + (printPos + this.dictLen[this.varSeq[i][j]]- 1) );
                }
                else {
                    // console.log("rng: " + ( 4 + (this.varSeq.length - 1 - i)) + " , " + printPos);
                    sh.getRange((this.stLine + (this.varSeq.length - 1 - i)), printPos).setValue(this.v2c[this.varSeq[i][j]]);
                    printPos++;
                }
            }
        }
    }

    printESPSeq2() {
        const ss: SpreadSheet = SpreadsheetApp.getActiveSpreadsheet();
        const sh: Sheet = ss.getActiveSheet();
        this.numAR = Number(this.numAR);
        ss.insertRowsBefore(this.stLine, this.varSeq.length + this.labels.length * (this.numAR + 1) + 1);
        this.stLine = Number(this.stLine);

        //
        // Browser.msgBox("abcd");
        // Browser.msgBox(this.stLine + " " + this.varSeq.length);
        for (let i: number = this.varSeq.length + this.labels.length * (this.numAR + 1) - 1; i > -1; i--) {
            //Browser.msgBox(String(this.stLine + this.varSeq.length - 1 - i));
            // console.log("output_set[i].length: " + this.varSeq[i].length);
            if ((i % (2 + this.numAR + 1)) == 0) {
                sh.getRange(this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i), 1).setValue("$S_" + Math.floor(i / (2 + this.numAR + 1)) + "$");
            }
            else if ((i % (2 + this.numAR + 1)) == 1) {
                sh.getRange(this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i), 1).setValue("$RLE(S_" + Math.floor(i / (2 + this.numAR + 1)) + ")$");
            }
            else {
                for (let j: number = 2; j < (2 + this.numAR + 1); j++) {
                    if ((i % (2 + this.numAR + 1)) == j) {
                        sh.getRange(this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i), 1).setValue("$L_" + Math.floor(i / (2 + this.numAR + 1)) + "[" + (j - 2) + "]$");
                        break;
                    }
                }
            }

            if ((i % (2 + this.numAR + 1)) < 2) {
                let printPos: number = 2;
                //Browser.msgBox(String(i));
                //Browser.msgBox((String(2 + this.numAR + 1)));
                //Browser.msgBox(String(Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))));
                for (let j: number = 0; j < this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))].length; j++) {
                    if (this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))][j]] > 1) {
                        //console.log("this.dictLen[this.varSeq[i][j]]: " + this.dictLen[this.varSeq[i][j]]);        
                        for (let k: number = 0; k < this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))][j]]; k++) {
                            sh.getRange((this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i)), printPos).setValue("$X_{" + (this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))][j] - Object.keys(this.v2c).length) + "}$");
                            printPos++;
                        }
                        let colST: number = (this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i));
                        let rowST: number = printPos - this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))][j]];
                        let numCol: number = 1;
                        let numRow: number = this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))][j]];
                        // console.log("range: " + row_st + " , " + row_st + num_row - 1);
                        sh.getRange(colST, rowST, numCol, this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))][j]]).merge();
                        // console.log("rng: " + (4 + (this.varSeq.length - 1 - i)) + " , " + printPos + " , " + (4 + (this.varSeq.length - 1 - i)) + " , " + (printPos + this.dictLen[this.varSeq[i][j]]- 1) );
                    }
                    else {
                        // console.log("rng: " + ( 4 + (this.varSeq.length - 1 - i)) + " , " + printPos);
                        sh.getRange((this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i)), printPos).setValue(this.v2c[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + (i % (2 + this.numAR + 1))][j]]);
                        printPos++;
                    }
                }
            }
            else {
                let printPos: number = 2;
                for (let j: number = 0; j < this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + 1].length; j++) {
                    if (this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + 1][j] + 1] > 1) {
                        //console.log("this.dictLen[this.varSeq[i][j]]: " + this.dictLen[this.varSeq[i][j]]);        
                        for (let k: number = 0; k < this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + 1][j]]; k++) {
                            //Browser.msgBox(String(this.stLine + this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i));
                            sh.getRange((this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i)), printPos).setValue(this.labels[Math.floor(i / (2 + this.numAR + 1))][j][i % (2 + this.numAR + 1) - 2]);
                            printPos++;
                        }
                        let colST: number = (this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i));
                        let rowST: number = printPos - this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + 1][j]];
                        let numCol: number = 1;
                        let numRow: number = this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + 1][j]];
                        // console.log("range: " + row_st + " , " + row_st + num_row - 1);
                        sh.getRange(colST, rowST, numCol, this.dictLen[this.varSeq[2 * Math.floor(i / (2 + this.numAR + 1)) + 1][j]]).merge();
                        // console.log("rng: " + (4 + (this.varSeq.length - 1 - i)) + " , " + printPos + " , " + (4 + (this.varSeq.length - 1 - i)) + " , " + (printPos + this.dictLen[this.varSeq[i][j]]- 1) );
                    }
                    else {
                        // console.log("rng: " + ( 4 + (this.varSeq.length - 1 - i)) + " , " + printPos);
                        sh.getRange((this.stLine + (this.varSeq.length + this.labels.length * (this.numAR + 1) - 1 - i)), printPos).setValue(this.labels[Math.floor(i / (2 + this.numAR + 1))][j][i % (2 + this.numAR + 1) - 2]);
                        printPos++;
                    }
                }
            }
        }
        const rgn: GoogleAppsScript.Spreadsheet.Range = sh.getRange(this.stLine, 1, this.varSeq.length + this.labels.length * (this.numAR + 1), this.varSeq[0].length + 1);
        rgn.setBorder(true, true, true, true, true, true);
    }
};