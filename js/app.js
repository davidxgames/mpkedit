{
const {State, App} = MPKEdit;
/* -----------------------------------------------
function: changeTheme(i)
  Change theme to specified theme
*/
const changeTheme = function(id) {
    if(id) document.body.className = "theme-dark"
    // not the best solution, but it works.
    else if(document.body.className) document.body.className = "";
};

/* -----------------------------------------------
function: elem(options)
  generate a HTMLElement DOM structure from
  supplied array data.
*/
const elem = function(options) {
    let el = document.createDocumentFragment();
    const tag = options[0], prop = options[1];
    
    if(typeof tag === "string") el = document.createElement(tag);
    
    if(typeof prop === "object")
        for(let item in prop) el[item] = prop[item];
    else if(prop) el.innerHTML = prop;
    
    for(let i = 1; i < arguments.length; i++)
        if(arguments[i].nodeType > 0) el.appendChild(arguments[i]);
    
    return el;
};

/* -----------------------------------------------
function: pixicon(t, r)
  generate random pixel icon from a hash
*/
const pixicon = function(t, r) {
    //r=[Math.random()*2**32|0,Math.random()*2**32|0,Math.random()*2**32|0,Math.random()*2**32|0]
    function hsl(t, r, e, i=0) { // HSL color generator.
        const set = [
            [t%360, r%10, 17+e%50],
            [t%360, 24+r%40, 26+e%40],
            [t%360, 12+r%60, 32+e%40]
        ];
        return `hsl(${set[i][0]}, ${set[i][1]}%, ${set[i][2]}%)`;
    }
    function modHSL(str){
        const arr = str.replace(/[^\d,.%]/g, '').split(',').map(x => Number.parseFloat(x, 10));
        return `hsl(${arr[0]-25}, ${arr[1]-10}%, ${arr[2]-7}%)`;
    }
    function rota(arr, mode, w, h) {
        const arr2 = [];
        if(mode === 3) return arr.slice().reverse();
        if(mode === 0 || mode === 1) { // horizontal flip
            for(let i = 0; i < arr.length; i++)
                arr2[i] = arr[i-2*(i%w)+w-1];
        }
        if(mode === 2 || mode === 4) { // rotate 90° CW
            for(let i = 0; i < arr.length; i++)
                arr2[i] = arr[0|(h-1)*w-((i%h)*w)+i/h];
        }
        if(mode === 1 || mode === 4) arr2.reverse();
        return arr2;
    }
    const n = 10, q = n*3, l = n*n, c = t.getContext("2d");
    let a = [];
    // Set canvas dimensions if not already set (performance boost).
    if(t.width !== q) {
        t.width = t.height = q;
        t.style.imageRendering = "-moz-crisp-edges";
        t.style.imageRendering = "pixelated";
    }
    c.setTransform(1, 0, 0, 1, 0, 0); // Reset transformation.
    c.clearRect(0, 0, t.width, t.height); // Erase previous context.
    // Set fill color for pixels.
    const A = (r[0]&0x2000000) ? 1:2, B = (r[1]&0x2000000) ? 1:2,
          color1 = hsl(r[0]&0x1FF, r[0]&0x7E00>>9, r[0]&0x1F8000>>15, (r[0]&0x1E00000>>21)>16 ? 0:A),
          color2 = hsl(r[1]&0x1FF, r[1]&0x7E00>>9, r[1]&0x1F8000>>15, (r[1]&0x1E00000>>21)>16 ? 0:B),
          color3 = modHSL(color1), color4 = modHSL(color2);
    c.fillStyle = color1;
    // Rotate canvas 90 degrees.
    r[0]&0x4000000 && c.rotate(Math.PI * .5)|c.translate(0, -t.width);
    // Generate pixel array
    /*
    let i, h;
    for(i = 0, h = r[2]; i < 32; i++, h>>>=1) a.push(h&1);
    for(i = 0, h = r[3]; i < 18; i++, h>>>=1) a.push(h&1);
    for(i = 0, h = r[1]; i < 25; i++, h>>>=1) a.push(h&1);
    for(i = 0, h = r[0]; i < 25; i++, h>>>=1) a.push(h&1);
    */
    [[2,32], [3,18], [1,25], [0,25]].forEach(item => {
        let i, num = item[1], h = r[item[0]];
        for(i = 0; i < num; i++, h>>>=1) a.push(h&1);
    });
    const goodlist0 = [1,2,3,4,7,8,9,13,14,19];
    let pt1 = a.slice(0,25),
        pt2 = a.slice(25,50),
        pt3 = a.slice(50,75),
        pt4 = a.slice(75,100);
    const mask0 = pt1.slice(),
          mask1 = pt2.slice(),
          mask2 = pt3.slice(),
          mask3 = pt4.slice();
    for(let i = 0; i < 25; i++) {
        if(!goodlist0.includes(i)) {
            mask0[i] = undefined;
            mask1[i] = undefined;
            mask2[i] = undefined;
            mask3[i] = undefined;
        }
    }
    pt1 = rota(pt1,2,5,5), pt1 = rota(pt1,0,5,5);
    pt2 = rota(pt2,2,5,5), pt2 = rota(pt2,0,5,5);
    pt3 = rota(pt3,2,5,5), pt3 = rota(pt3,0,5,5);
    pt4 = rota(pt4,2,5,5), pt4 = rota(pt4,0,5,5);
    for(let i = 0; i < 25; i++) {
        if(goodlist0.includes(i)) {
            pt1[i] = mask0[i];
            pt2[i] = mask1[i];
            pt3[i] = mask2[i];
            pt4[i] = mask3[i];
        }
    }
    // Build pixel array.
    a = [];
    let b = [];
    if(r[0] & 0x8000000) { // symmetry mode
        a = a.concat(pt1);
        a = a.concat(rota(pt1,4,n/2,n/2));
        a = a.concat(rota(pt1,2,n/2,n/2));
        a = a.concat(rota(pt1,3,n/2,n/2));
        b = b.concat(pt2);
        b = b.concat(rota(pt2,4,n/2,n/2));
        b = b.concat(rota(pt2,2,n/2,n/2));
        b = b.concat(rota(pt2,3,n/2,n/2));
    } else {
        a = a.concat(pt1);
        a = a.concat(rota(pt2,4,n/2,n/2));
        a = a.concat(rota(pt2,2,n/2,n/2));
        a = a.concat(rota(pt1,3,n/2,n/2));
        b = b.concat(pt3);
        b = b.concat(rota(pt4,4,n/2,n/2));
        b = b.concat(rota(pt4,2,n/2,n/2));
        b = b.concat(rota(pt3,3,n/2,n/2));
    }
    // Paint canvas.
    const o = t.width/n;
    let Q = 0, y = 0, d;
    for(let i = 0; i < l; i++, d = i%(n/2)) {
        // Change color at halfway point. NOTE: |0 required for odd sizes.
        (i === (0|l/2)) && (c.fillStyle = color3, Q += q/2, y =- 1);
        (i && !d) && y++; // Increment y axis.
        (a[i]) && c.fillRect(Q+o*d, o*y, o, o); // If pixel exists, fill square on canvas (x, y, w, h).
    }
    c.fillStyle = color2; Q = 0, y = 0;
    for(let i = 0; i < l; i++, d = i%(n/2)) {
        // Change color at halfway point. NOTE: |0 required for odd sizes.
        (i === (0|l/2)) && (c.fillStyle = color4, Q += q/2, y =- 1);
        (i && !d) && y++; // Increment y axis.
        (b[i]) && c.fillRect(Q+o*d, o*y, o, o); // If pixel exists, fill square on canvas (x, y, w, h).
    }
};

/* -----------------------------------------------
Note Reorder stuff
*/

// Necessary workaround for Firefox 88 text node issue
if(!Text.prototype.closest) Text.prototype.closest = function(s){return this.parentNode.closest(s);}

let ro_origin, ro_dest;
let leave = function(evt) {
    let tabl = document.getElementsByTagName("table")[0];
    // Node.contains is TRUE even for itself, so another check is needed.
    let withinTable = tabl.contains(evt.relatedTarget) && tabl !== evt.relatedTarget;
    // Cancel ro_dest if outside table with active drag
    if(ro_origin && ro_dest && !withinTable) {
        ro_dest.removeAttribute("style");
        ro_dest = undefined;
    }
}
let enter = function(evt) {
    if(!ro_origin) {return false;} // only proceed if ro_origin is active
    if(ro_dest) ro_dest.removeAttribute("style");
    ro_dest = evt.target.closest("tr");
    ro_dest.style.outline = "2px solid #808080";
}
let start = function(evt) {
    ro_origin = evt.target.closest("tr");
}
let end = function() {
    if(!ro_origin || !ro_dest) {return false;}
    let p0 = 0x300 + 32 * ro_dest.id;
    let p1 = 0x300 + 32 * ro_origin.id;

    if(ro_dest.id !== ro_origin.id) {
		// Swap NoteTable entries
        let tmp = new Uint8Array(State.data);
        for(let j = 0; j < 32; j++) [tmp[j+p0], tmp[j+p1]] = [tmp[j+p1], tmp[j+p0]]; 
		// Swap Note metadata
		let nTabl = State.NoteTable, o = ro_origin.id, d = ro_dest.id;
		[ nTabl[o], nTabl[d] ] = [ nTabl[d], nTabl[o] ];
        MPKEdit.Parser(tmp);
    }
    ro_origin.removeAttribute("style");
    ro_dest.removeAttribute("style");
    ro_origin = undefined;
    ro_dest = undefined;
}

/* -----------------------------------------------
function: buildRow(i)
  build HTMLElement row for NoteTable in MPK
*/
const buildRow = function(i) {
    function fixHTML(str) { // sanitize comments for HTML.
        const rep = '&,amp,<,lt,>,gt,",quot,\',apos'.split(',');
        for(let i=0; i<rep.length; i+=2) str=str.replace(new RegExp(rep[i],'g'),`&${rep[i+1]};`);
        return str;
    }
    // Handle empty rows
    if(!State.NoteTable[i]) {
        const tableRow = elem(["tr",{id:i,className:"empty"}],elem(["td",{innerHTML:i+1,"colSpan":16}]));
        if(App.cfg.reorder) {
            tableRow.ondragenter = enter;
            tableRow.ondragend   = end;
            tableRow.ondragleave = leave;
        }
        return tableRow;
    }

    const cmtIcon = State.NoteTable[i].comment?`<span aria-label='${fixHTML(State.NoteTable[i].comment)}'><span class='fa fa-comment'></span></span>`:"",
          displayName = State.NoteTable[i].noteName + cmtIcon;

    const tableRow =
    elem(["tr",{className:"note",id:i}],
        // start pixicon display
        App.cfg.identicon ?
        elem([],
            elem(["td",{className:"hash"}],elem(["canvas",{width:32,height:32,id:"hash"}])),
            elem(["td",{className:"divider"}],elem(["div"]))
        ) : "",
        // end pixicon display
        elem(["td",{className:"name",innerHTML:displayName}],
            elem(["div",App.codeDB[State.NoteTable[i].serial] || State.NoteTable[i].serial]) // lookup gameCode in codeDB
        ),
        elem(["td",{className:"divider"}],elem(["div"])),
        elem(["td",{className:"region",innerHTML:State.NoteTable[i].region}]),
        elem(["td",{className:"divider"}],elem(["div"])),
        elem(["td",{className:"pgs",innerHTML:State.NoteTable[i].indexes.length}]),
        elem(["td",{className:"divider"}],elem(["div"])),
        elem(["td",{className:"tool"}],
            elem(["span",{className:"fa fa-info-circle",onclick:buildModal}]),
            elem(["span",{className:"fa fa-trash",onclick:() => App.eraseNote(i)}]),
            elem(["span",{
                className: "fa fa-download",
                draggable: true,
                ondragstart: e => App.saveNote(e, i),
                onclick: e => App.saveNote(e, i)
            }])
        )
    );

    if(App.cfg.reorder) {
        tableRow.draggable   = true; 
        tableRow.ondragenter = enter; 
        tableRow.ondragstart = start; 
        tableRow.ondragend   = end;
        tableRow.ondragleave = leave;
    }
    if(App.cfg.identicon) { // produce pixicons
        pixicon(tableRow.querySelector("#hash"), State.NoteTable[i].hash128);
    }
    return tableRow;
};

/* -----------------------------------------------
function: buildModal(i)
  build a multi-purpose Modal popup window.
*/
const buildModal = function(e) {
    //if(e.target.id!=="menu"||e.target.className!=="fa fa-info-circle") return; // only allow execution from specific clickies
    const content = elem(["div",{className:"modalContent"}]);

    const col = ["#713257", "#D9C173", "#5B4DA4", "#3A991B", "#1B696A", "#69532F", "#A52626", "#92C9C0",
               "#1F4F75", "#D6664D", "#F4AD9B", "#BBF637", "#777564", "#497BA5", "#ED6BB2", "#3D4142"];

    // ################ Modal: Settings ################
    if(e.target.id === "menu") {
        const settings =
        elem([],
            elem(["h1","Ajustes"]),
            // SETTING 1: Hide Rows
            elem(["div",{className:"modalBlock"}],
                elem(["span",{className:"state"}],
                    elem(["input",{checked: App.cfg.hideRows,id:"hideRows",onchange:updateSettings,type:"checkbox"}]),
                    elem(["span",{onclick:function(){this.previousSibling.click()},className:"chkb0x"}])
                ),
                elem(["div",{className:"text"}],
                elem(["div",{className:"textLabel",onmousedown:function(e){e.preventDefault()},innerHTML:"Ocultar filas vacías",
                    onclick:function(){this.parentNode.previousSibling.querySelector("input").click()}}]),
                elem(["div",{className:"textInfo",innerHTML:"Controla si se muestran las filas vacías."}])
                )
            ),
            // SETTING 2: Pixicons
            elem(["div",{className:"modalBlock"}],
                elem(["span",{className:"state"}],
                    elem(["input",{checked:App.cfg.identicon,id:"identicon",onchange:updateSettings,type:"checkbox"}]),
                    elem(["span",{onclick:function(){this.previousSibling.click()},className:"chkb0x"}])
                ),
                elem(["div",{className:"text"}],
                elem(["div",{className:"textLabel",onmousedown:function(e){e.preventDefault()},innerHTML:"Mostrar iconos",
                    onclick:function(){this.parentNode.previousSibling.querySelector("input").click()}}]),
                elem(["div",{className:"textInfo",innerHTML:"Identifica las partidas guardadas únicas con un ícono."}])
                )
            ),
            // SETTING 3: Reorder
            elem(["div",{className:"modalBlock"}],
                elem(["span",{className:"state"}],
                    elem(["input",{checked:App.cfg.reorder,id:"reorder",onchange:updateSettings,type:"checkbox"}]),
                    elem(["span",{onclick:function(){this.previousSibling.click()},className:"chkb0x"}])
                ),
                elem(["div",{className:"text"}],
                elem(["div",{className:"textLabel",onmousedown:function(e){e.preventDefault()},innerHTML:"Habilitar el modo de reordenar",
                    onclick:function(){this.parentNode.previousSibling.querySelector("input").click()}}]),
                elem(["div",{className:"textInfo",innerHTML:"Permitir que las notas se reordenen mediante arrastrar y soltar."}])
                )
            ),
            // SETTING 4: Theme
            elem(["div",{className:"modalBlock"}],
                elem(["span",{className:"state"}],
                    elem(["input",{checked: App.cfg.theme,id:"theme",onchange:updateSettings,type:"checkbox"}]),
                    elem(["span",{onclick:function(){this.previousSibling.click()},className:"chkb0x"}])
                ),
                elem(["div",{className:"text"}],
                elem(["div",{className:"textLabel",onmousedown:function(e){e.preventDefault()},innerHTML:"Tema Oscuro",
                    onclick:function(){this.parentNode.previousSibling.querySelector("input").click()}}]),
                elem(["div",{className:"textInfo",innerHTML:"Activa el tema Oscuro"}])
                )
            )
        );
        // Generate the IndexTable visualizer display
        const x = elem(["div",{className:"pageContainer"}]);
        for(let j = 1; j <= 128; j++) {
            x.appendChild(elem(["span",{className:"b0x"}]))
            if(j%32===0) x.appendChild(elem(["br"]));
        }
        // Populate squares of display based on NoteTable data.
        const x2 = x.querySelectorAll("span.b0x");
        for(let i = 0, page, y; i < 16; i++) {
            if(State.NoteTable[i]) {
                y = State.NoteTable[i].indexes;
                for(let j = 0; j < y.length; j++) {
                    page = y[j];
                    x2[page].style.borderColor = col[i];
                    x2[page].style.background = col[i] + "C0";
                }
            }
        }

        // Append IndexTable display to settings.
        settings.appendChild(x);
        // Append Settings to Content
        content.appendChild(settings);
    }

    // ################ Modal: Note Info ################
    if(e.target.className === "fa fa-info-circle") {
        // Get ID of the selected Note and its memory address.
        const i = e.target.parentElement.parentElement.id,
              i2 = 0x300 + (32*i);

        // Print raw bytes of NoteEntry
        let noteData = "<code>";
        for(let j = i2; j < i2+32; j++) {
            noteData += State.data[j].toString(16).toUpperCase().padStart(2, '0');
            noteData += (j-i2===15) ? "<br>" : " ";
        } noteData += "</code>";

        const noteInfo =
        elem([],
            elem(["h1","Note details"]),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Comment",className:"label"}]),
                elem(["textarea",{maxLength:2048,placeholder:"No comment...",oninput:function() {
                    const encoded = new TextEncoder("utf-8").encode(this.value);
                    if(encoded.length <= 4080) {
                        this.style.color = "", State.NoteTable[i].comment = this.value;
                        updateUI();
                    } else this.style.color = "red";
                },className:"content",value:State.NoteTable[i].comment || ""}])
                ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Note name",className:"label"}]),
                elem(["input",{maxLength:16,onkeyup:function(evt){
                    function extractKeyValue(obj, value) {
                        return Object.keys(obj)[Object.values(obj).indexOf(value)];
                    }
                    if(evt.keyCode === 13) {
                         for(let i = 0; i < 16; i++)   {
                            console.log(State.data[i2+16+i], extractKeyValue(App.n64code, this.value[i] || 0))
                            State.data[i2+16+i] = extractKeyValue(App.n64code, this.value[i])
                            }
                    MPKEdit.Parser(State.data);
                    }
                },oninput:function() {
                    this.value = this.value.toUpperCase();
                },className:"content",value:State.NoteTable[i].noteName}])
            ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Game name",className:"label"}]),
                elem(["span",{className:"content",innerHTML:App.codeDB[State.NoteTable[i].serial]}])
            ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Date",className:"label"}]),
                elem(["span",{className:"content",innerHTML: 
                    State.NoteTable[i].timeStamp && new Date(State.NoteTable[i].timeStamp*1000).toString().substr(4,17) || 
                    State.fileDate && new Date(State.fileDate).toString().substr(4,17) ||
                    "None"}])
            ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Game code",className:"label"}]),
                elem(["span",{className:"content fixed",innerHTML:State.NoteTable[i].serial}])
            ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Region",className:"label"}]),
                elem(["span",{className:"content",innerHTML:State.NoteTable[i].region}])
            ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Publisher",className:"label"}]),
                elem(["span",{className:"content",innerHTML:`${App.pubDB[State.NoteTable[i].publisher]} (<code>${State.NoteTable[i].publisher}</code>)`}])
            ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Hash code",className:"label"}]),
                elem(["span",{className:"content fixed",innerHTML:State.NoteTable[i].hash128[0].toString(16).padStart(8,0)+State.NoteTable[i].hash128[1].toString(16).padStart(8,0)}])
            ),
            elem(["div",{className:"modalFlex"}],
                elem(["span",{innerHTML:"Used pages",className:"label"}]),
                elem(["span",{className:"content",innerHTML:`${State.NoteTable[i].indexes.length} (${State.NoteTable[i].indexes.length*256} bytes)`}])
            ),
            elem(["h1","Raw note entry"]),
            elem(["div",{style:"text-align:center;font-size:14px;",innerHTML:noteData}])
        );

        // Append noteInfo block to content.
        content.appendChild(noteInfo);

        // Paint IndexTable display usage for this Note.
        const x = elem(["div",{className:"pageContainer"}])
        for(let j = 0; j < 128; j++) {
            const sty = State.NoteTable[i].indexes.indexOf(j)!==-1?` border-color:${col[i]};background:${col[i]}C0`:"";
            x.appendChild(elem(["span",{className:"b0x",style:sty}]));
            if((j+1)%32===0) x.appendChild(elem(["br"]));
        }
        // Append display to content.
        content.appendChild(x);
    }

    // #### Appending content to Modal ####
    const modal = document.getElementById("modal");
    while(modal.firstChild) modal.removeChild(modal.firstChild); // Clear modal contents first.
    modal.appendChild(content); // Append content to modal.
    modal.style.visibility = ""; // Unhide modal.
    modal.style.opacity = 1;
};

/* -----------------------------------------------
function: updateSettings(i)
  Update a localStorage setting individually
*/
const updateSettings = function() {
    App.cfg[this.id] = this.checked;
    localStorage.MPKEdit = JSON.stringify(App.cfg);
    updateUI();
    if(this.id === "theme") changeTheme(App.cfg[this.id]);
};

/* -----------------------------------------------
function: App.updateUI()
  update the MPK data display UI. used when loading new files and
  when modifications occur.
*/
const updateUI = function() {
    document.getElementById("filename").innerHTML = State.filename;
    // Stats bar dynamic CSS
    let w1 = 100 * (State.usedPages / 123), w2 = 100 * (State.usedNotes / 16);
    w1 = `width:${w1}%;${w1===100?"background:#547F96;":""}${w1>0&&w1<100?"border-right:1px solid rgba(0,0,0,0.15)":""}`;
    w2 = `width:${w2}%;${w2===100?"background:#547F96;":""}${w2>0&&w2<100?"border-right:1px solid rgba(0,0,0,0.15)":""}`;
    const status =
    `<span class=statBox>${123-State.usedPages}/123 páginas libres<div class=outerBar><div style='${w1}' class=innerBar></div></div></span>` +
    `<span class=statBox>${16 -State.usedNotes}/16  notas libres<div class=outerBar><div style='${w2}' class=innerBar></div></div></span>`;
    document.getElementById("stats").innerHTML = status;

    const out = document.querySelector("table");
    // remove all elements in the table
    while(out.firstChild) out.removeChild(out.firstChild);

    for(let i = 0; i < 16; i++) {
        // skip if hideRows enabled & Note doesn't exist
        if(App.cfg.hideRows && !State.NoteTable[i]) continue;
        const tableRow = buildRow(i);
        out.appendChild(tableRow);
    }
    // display "Empty" msg if hideRows enabled
    if(out.innerHTML==="") out.innerHTML = "<tr><td class=empty>-Archivo vacío-</td></tr>";
};

App.updateUI = updateUI;
App.buildModal = buildModal;
App.changeTheme = changeTheme;
}
