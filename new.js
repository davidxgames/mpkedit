(function () {
/* ---- */
function MemPak()
{
    function init()
    {
        var i, data = new Uint8Array(32768);
        function A(a) {for(i=0;i<7;++i) {data[a+i]=[1,1,0,1,1,254,241][i];}}
        A(57);A(121);A(153);A(217);
        for(i=4;i<128;i++) {data[256+i*2+1]=3;data[512+i*2+1]=3;}
        data[257]=113;data[513]=113;
        ref.data = data;
        ref.filename = "MemPak.mpk";
    }

function parse(data)
    {
        var i, j, IndexKeys, NoteKeys=[], Notes={}, noteName, n64code, p, p2, a, b, c;
        
        function calculateChecksum(o)
        {
            // X,Y = stored checksum | A,B = calculated checksum
            var i, sumX, sumY, sumA = 0, sumB = 0xFFF2;
            sumX  = (data[o + 28] << 8) + data[o + 29];
            sumY  = (data[o + 30] << 8) + data[o + 31];
        
            for(i = 0; i < 28; i += 2)
            {
                sumA += (data[o + i] << 8) + data[o + i + 1];
                sumA &= 0xFFFF;
            }
        
            sumB -= sumA;
        
            // Repair corrupt DexDrive checksums
            if(sumX === sumA && (sumY ^ 0x0C) === sumB)
            {
                sumY ^= 0xC;
                data[o + 31] ^= 0xC;
            }
            // Detect unset bits.. if they're not set, game gets mad.
            if((data[o + 25] & 1) === 0 || (data[o + 26] & 1) === 0)
            {
                return false;
            }
            return (sumX === sumA && sumY === sumB);
        }
        
        function checkIndexes(o) {
            var Output={}, sum, seq, ends = 0, found = {parsed:[], keys:[], vals:[]};
            
            for(i = o + 0xA; i < o + 0x100; i += 2) {
                p  = data[i + 1]; p2 = data[i];
                // Capture all non-empty indexes
                if (p2 === 0 && p === 1 || p >= 5 && p <= 127 && p !== 3) {
                
                    if(p === 1) {ends += 1;}
                    // Return false if duplicate values found
                    if(p !== 1 && found.vals.indexOf(p) > -1) {
                        return false;
                    }
                    found.vals.push(p);
                    found.keys.push((i - o) / 2);
                    
                } else if (p2 !== 0 || p !== 1 && p !== 3 && p < 5 || p > 127) {
                    return false;
                }
            }
            // Filter out the key indexes
            IndexKeys = found.keys.filter(function(n) {
                return found.vals.indexOf(n) === -1;
            });
            
            // Check the length of NoteKeys, IndexKeys and ends
            if (NoteKeys.length !== IndexKeys.length || NoteKeys.length !== ends) {
                return false;
            }
            // Check that all NoteKeys exist in the list of IndexKeys
            for (i = 0; i < NoteKeys.length; i++) {
                if (NoteKeys.indexOf(IndexKeys[i]) === -1) {
                    return false;
                }
            }
            
            for(i = 0; i < IndexKeys.length; i++) {
                p = IndexKeys[i]; seq = [];
                while(p === 1 || p >= 5 && p <= 127) {
                    if(p === 1) {
                        Output[IndexKeys[i]] = seq;
                        break;
                    }
                    seq.push(p);
                    found.parsed.push(p);
                    p = data[p*2 + o + 1];
                }
            }
            
            // Check parsed indexes against original list
            if(found.parsed.length !== found.keys.length)
            {
                return false;
            }
            for (i = 0; i < found.parsed.length; i++) {
                if (found.parsed.indexOf(found.keys[i]) === -1) {
                    return false;
                }
            }
            
            // Check IndexTable checksum
            for(i = o+0xA, sum = 0; i < o+0x100; i++)
            {
                sum += data[i];
            }
            sum &= 0xFF;
            if (data[o+1] !== sum)
            {
                data[o+1] = sum;
            }
            // Backup or Restore the valid table
            p = (o === 0x100) ? 0x200 : 0x100;
            for(i = 0; i < 0x100; i++)
            {
                data[p + i] = data[o + i];
            }
            
            return Output;
        }
        
        // Check Header ------------------------------------
        var chk, currentLoc, loc, lastValidLoc;
        lastValidLoc = -1;
        loc  = [0x20, 0x60, 0x80, 0xC0];
    
        // Quickly check all locations, saving the last valid one.
        for(i = 0; i < loc.length; i++)
        {
            chk = calculateChecksum(loc[i], data);
            if(chk) { lastValidLoc = loc[i]; }
        }
        
        // Check all locations storing each result.
        for(i = 0; i < loc.length; i++)
        {
            currentLoc = loc[i];
            chk = calculateChecksum(currentLoc, data);
        
            // Detect and replace invalid locations
            if(lastValidLoc > -1 && chk === false)
            {
                for(j = 0; j < 32; j++)
                {
                    data[currentLoc + j] = data[lastValidLoc + j];
                }
                chk = calculateChecksum(currentLoc, data);
            }
        
            loc[i] = chk;
        }
        
        // Check if all checksums are correct
        if(true !== (loc[0] && loc[1] && loc[2] && loc[3]))
        {
            return false;
        }
        n64code = {
              0:  "",   3:  "",  15: " ", 16: "0",  17: "1",  18: "2",  19: "3",  20: "4",
             21: "5",  22: "6",  23: "7", 24: "8",  25: "9",  26: "A",  27: "B",  28: "C",
             29: "D",  30: "E",  31: "F", 32: "G",  33: "H",  34: "I",  35: "J",  36: "K",
             37: "L",  38: "M",  39: "N", 40: "O",  41: "P",  42: "Q",  43: "R",  44: "S",
             45: "T",  46: "U",  47: "V", 48: "W",  49: "X",  50: "Y",  51: "Z",  52: "!",
             53: '"',  54: "#",  55: "'", 56: "*",  57: "+",  58: ",",  59: "-",  60: ".",
             61: "/",  62: ":",  63: "=", 64: "?",  65: "@",  66: "。",  67: "゛",  68: "゜",
             69: "ァ",  70: "ィ",  71: "ゥ",  72: "ェ",  73: "ォ",  74: "ッ",  75: "ャ",  76: "ュ",
             77: "ョ",  78: "ヲ",  79: "ン",  80: "ア",  81: "イ",  82: "ウ",  83: "エ",  84: "オ",
             85: "カ",  86: "キ",  87: "ク",  88: "ケ",  89: "コ",  90: "サ",  91: "シ",  92: "ス",
             93: "セ",  94: "ソ",  95: "タ",  96: "チ",  97: "ツ",  98: "テ",  99: "ト", 100: "ナ",
            101: "ニ", 102: "ヌ", 103: "ネ", 104: "ノ", 105: "ハ", 106: "ヒ", 107: "フ", 108: "ヘ",
            109: "ホ", 110: "マ", 111: "ミ", 112: "ム", 113: "メ", 114: "モ", 115: "ヤ", 116: "ユ",
            117: "ヨ", 118: "ラ", 119: "リ", 120: "ル", 121: "レ", 122: "ロ", 123: "ワ", 124: "ガ",
            125: "ギ", 126: "グ", 127: "ゲ", 128: "ゴ", 129: "ザ", 130: "ジ", 131: "ズ", 132: "ゼ",
            133: "ゾ", 134: "ダ", 135: "ヂ", 136: "ヅ", 137: "デ", 138: "ド", 139: "バ", 140: "ビ",
            141: "ブ", 142: "ベ", 143: "ボ", 144: "パ", 145: "ピ", 146: "プ", 147: "ペ", 148: "ポ"
        };
        // Parse NoteTable
        for(i = 0x300; i < 0x500; i += 32)
        {
            p  = data[i + 0x07];
            
            a = data[i]+data[i+1]+data[i+2]+data[i+3]>0 && data[i+4]+data[i+5]>0;
            b = p>=5 && p<=127 && data[i + 0x06] === 0;
            c = data[i + 0x0A]===0 && data[i + 0x0B]===0;
            
            if(a && b && c)
            {
                // Repair 0x08:2 bit shit.
                if((data[i + 0x08] & 0x02) === 0)
                {
                    console.log("INFO: Fixing bit 0x08:2(%s) in %s", (i - 0x300) / 32);
                    data[i + 0x08] |= 0x02;
                }
                
                for(j = 0, noteName = ""; j < 16; j++)
                {
                    noteName += n64code[data[i + 16 + j]];
                }
                if(data[i + 12] !== 0)
                {
                    noteName += "." + n64code[data[i + 12]];
                    noteName += n64code[data[i + 13]];
                    noteName += n64code[data[i + 14]];
                    noteName += n64code[data[i + 15]];
                }
                NoteKeys.push(p);
                Notes[(i - 0x300) / 32] = {
                    indexes: p,
                    serial: String.fromCharCode(data[i],data[i+1],data[i+2],data[i+3]),
                    publisher: String.fromCharCode(data[i+4],data[i+5]),
                    noteName: noteName
                };
            }
        }
        
        output = checkIndexes(0x100) || checkIndexes(0x200);
        
        if(output)
        {
            for(i = 0; i < Object.keys(Notes).length; i++)
            {
                Notes[Object.keys(Notes)[i]].indexes = output[Notes[Object.keys(Notes)[i]].indexes];
            }
            return Notes;
        } else { return false; }
    }

    var ref   = this;
    ref.init  = init;
    ref.parse = parse; 
};
 
var T = new MemPak();

////////////////////////////////////////////////////////////
window.addEventListener("drop", function(event)
{
    var i, files = event.dataTransfer.files, reader;
    
    for(i = 0; i < files.length; i++)
    {
        reader        = new FileReader();
        reader.name   = files[i].name;
        reader.onload = function(event)
        {
            var data = new Uint8Array(event.target.result);
            if(String.fromCharCode.apply(null, data.subarray(0, 11)) === "123-456-STD") {
                data = data.subarray(0x1040);
            }
            var parsedData = T.parse(data);
            if(parsedData) {
                console.log("%c"+event.target.name,"font:bold 12px DejaVu Sans");
                console.log(parsedData);
                console.log("   ");
            }
            else { console.error("Invalid file: ", event.target.name); }
        };
        reader.readAsArrayBuffer(files[i].slice(0, 36928));
    }
    event.preventDefault();
});
window.addEventListener("dragover",function(event){event.preventDefault();});
/* ---- */
}());
