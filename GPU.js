GPU = {
    _canvas: {},
    _scrn: {},

    _tileset: [],
    _pal: {
        bg: [],
        obj0: [],
        obj1: []
    },
    _vram: [],
    _oam: [],
    _objdata: [],

    _mode: 0,
    _modeclock: 0,
    _line: 0,
    _scx: 0,
    _scy: 0,
    _switchbg: 0,
    _bgmap: 0,
    _bgtile: 0,
    _switchobj: 0,
    _switchlcd: 0,
    
    reset: function() {
        var c = document.getElementById('screen');
        if (c && c.getContext) {
            GPU._canvas = c.getContext('2d');
            if (GPU._canvas) {
                if (GPU._canvas.createImageData) {
                    GPU._scrn = GPU._canvas.createImageData(160, 144);
                }
                else if (GPU._canvas.getImageData) {
                    GPU._scrn = GPU._canvas.getImageData(0,0, 160, 144);
                }
                else {
                    GPU._scrn = {
                        'width': 160,
                        'height': 144,
                        'data': new Array(160*144*4)
                    };
                }

                for (var i = 0; i < 160*144*4; i++) {
                    GPU._scrn.data[i] = 255;
                }

                GPU._canvas.putImageData(GPU._scrn, 0, 0);
            }
        }

        GPU._tileset = [];
        for (var i = 0; i < 384; i++) {
            GPU._tileset[i] = [];
            for (var j = 0; j < 8; j++) {
                GPU._tileset[i][j] = [0,0,0,0,0,0,0,0];
            }
        }

        GPU._vram = [];
        for (var i = 0; i < 8192; i++) {
            GPU._vram[i] = 0;
        }

        GPU._oam = [];
        for (var i = 0, n = 0; i < 40; i++, n+= 4) {
            GPU._oam[n + 0] = 0;
            GPU._oam[n + 1] = 0;
            GPU._oam[n + 2] = 0;
            GPU._oam[n + 3] = 0;
            GPU._objdata[i] = {'y': -16, 'x': -8, "tile": 0, "palette": 0, "xflip": 0, "yflip": 0, "prio": 0, "num": i};
        }

        GPU._pal.bg = [
            [255, 255, 255, 255],  // White
            [192, 192, 192, 255],  // Light gray
            [96, 96, 96, 255],     // Dark gray
            [0, 0, 0, 255]         // Black
        ];

        GPU._pal.obj0 = [
            [255, 255, 255, 255],  // White
            [192, 192, 192, 255],  // Light gray
            [96, 96, 96, 255],     // Dark gray
            [0, 0, 0, 255]         // Black
        ];

        GPU._pal.obj1 = [
            [255, 255, 255, 255],  // White
            [192, 192, 192, 255],  // Light gray
            [96, 96, 96, 255],     // Dark gray
            [0, 0, 0, 255]         // Black
        ];

        GPU._mode = 0,
        GPU._modeclock = 0,
        GPU._line = 0,
        GPU._scx = 0,
        GPU._scy = 0,
        GPU._switchbg = 0,
        GPU._bgmap = 0,
        GPU._bgtile = 0,
        GPU._switchobj = 0,
        GPU._switchlcd = 0
    },

    step: function() {
        //console.log("Before:", GPU._modeclock);
        GPU._modeclock += Z80._r.t;
        //console.log("After:", GPU._modeclock);
        switch(GPU._mode) {
            case 2:
                if (GPU._modeclock >= 80) {
                    GPU._modeclock = 0;
                    GPU._mode = 3;
                }
                break;
            case 3:
                if (GPU._modeclock >= 172) {
                    GPU._modeclock = 0;
                    GPU._mode = 0;
                    GPU.renderscan();
                }
                break;
            case 0:
                if (GPU._modeclock >= 204) {
                    GPU._modeclock = 0;
                    GPU._line++;

                    if (GPU._line == 143) {
                        GPU.renderscan();
                        GPU._mode = 1;
                        GPU._canvas.putImageData(GPU._scrn, 0, 0);
                    }
                    else {
                        GPU._mode = 2;
                    }
                }
                break;
            case 1:
                if (GPU._modeclock >= 4560) {
                    GPU._modeclock = 0;
                    GPU._line++;

                    if (GPU._line == 153) {
                        GPU._mode = 2;
                        GPU._line = 0;
                    }
                }
                break;
        }
        //console.log("At end:", GPU._modeclock);
    },

    updatetile: function(addr) {
        addr &= 0x1FFF;

        var tile = (addr >> 4) & 511;
        var y = (addr >> 1) & 7;

        var sx;
        for (var x = 0; x < 8; x++) {
            sx = 1 << (7 - x);
            GPU._tileset[tile][y][x] = ((GPU._vram[addr] & sx) ? 1 : 0) + ((GPU._vram[addr + 1] & sx) ? 2 : 0);
        }
    },

    renderscan: function() {
        var colourplace;
        var colour;
        var scanrow = [];
        
        if (GPU._switchbg) {
            var ytilepos = GPU._bgmap ? 0x1C00 : 0x1800;
            ytilepos += (((GPU._line + GPU._scy) >> 3) & 31) << 5;

            var xtilepos = (GPU._scx >> 3) & 31;

            var tile = GPU._vram[ytilepos + xtilepos];
            var y = (GPU._line + GPU._scy) & 7;
            var x = GPU._scx & 7;

            if (GPU._bgtile == 0 && tile < 128) tile += 256;

            colourplace = GPU._line * 160 * 4;
            for (var i = 0; i < 160; i++) {
                colour = GPU._pal.bg[GPU._tileset[tile][y][x]];

                GPU._scrn.data[colourplace + 0] = colour[0];
                GPU._scrn.data[colourplace + 1] = colour[1];
                GPU._scrn.data[colourplace + 2] = colour[2];
                GPU._scrn.data[colourplace + 3] = colour[3];
                colourplace += 4;

                scanrow[i] = GPU._tileset[tile][y][x];

                x++;
                if (x == 8) {
                    x = 0;
                    xtilepos = (xtilepos + 1) & 31;
                    tile = GPU._vram[ytilepos + xtilepos];
                    if (GPU._bgtile == 0 && tile < 128) tile += 256;
                }
            }
        }

        if (GPU._switchobj) {
            for (var i = 0; i < 40; i++) {
                var obj = GPU._objdata[i];
                if (obj.y <= GPU._line && (obj.y + 8) > GPU._line) {
                    var pal = obj.pal ? GPU._pal.obj1 : GPU._pal.obj0;
                    colourplace = (GPU._line * 160 + obj.x) * 4;
                    
                    if (obj.yflip) {
                        var tilerow = GPU._tilesetp[obj.tile][7 - (GPU._line - obj.y)];
                    }
                    else {
                        var tilerow = GPU._tilesetp[obj.tile][GPU._line - obj.y];
                    }

                    for (var x = 0; x < 8; x++) {
                        if((obj.x + x) >= 0 && (obj.x + x) < 160 && tilerow[x] && (obj.prio || !scanrow[obj.x + x])) {
                            colour = pal[tilerow[obj.xflip ? (7 - x) : x]];

                            GPU._scrn.data[colourplace + 0] = colour[0];
                            GPU._scrn.data[colourplace + 1] = colour[1];
                            GPU._scrn.data[colourplace + 2] = colour[2];
                            GPU._scrn.data[colourplace + 3] = colour[3];
                            colourplace += 4;
                        }
                    }
                }
            }
        }
    },

    buildobjdata: function(addr, val) {
        var obj = addr >> 2;
        if (obj >= 0 && obj < 40) {
            switch(addr & 3) {
                case 0:
                    GPU._objdata[obj].y = val - 16;
                    break;
                case 1:
                    GPU._objdata[obj].x = val - 8;
                    break;
                case 2:
                    GPU._objdata[obj].tile = val;
                    break;
                case 3:
                    GPU._objdata[obj].palette = (val & 0x10) ? 1 : 0;
                    GPU._objdata[obj].xflip = (val & 0x20) ? 1 : 0;
                    GPU._objdata[obj].yflip = (val & 0x40) ? 1 : 0;
                    GPU._objdata[obj].prio = (val & 0x80) ? 1 : 0;
                    break;
            }
        }
    },

    rb: function(addr) {
        switch(addr) {
            case 0xFF40:
                return  (GPU._switchbg ? 0x01 : 0x00) | 
                        (GPU._bgmap ? 0x08 : 0x00) | 
                        (GPU._bgtile ? 0x10 : 0x00) | 
                        (GPU._switchobj ? 0x02 : 0x00) |
                        (GPU._switchlcd ? 0x80 : 0x00);
            case 0xFF42:
                return GPU._scy;
            case 0xFF43:
                return GPU._scx;
            case 0xFF44:
                return GPU._line;
        }
    },

    wb: function(addr, val) {
        switch(addr) {
            case 0xFF40:
                GPU._switchbg  = (val & 0x01) ? 1 : 0;
                GPU._bgmap     = (val & 0x08) ? 1 : 0;
                GPU._bgtile    = (val & 0x10) ? 1 : 0;
                GPU._switchobj  = (val & 0x02) ? 1 : 0;
                GPU._switchlcd = (val & 0x80) ? 1 : 0;
                break;
            case 0xFF42:
                GPU._scy = val;
                break;
            case 0xFF43:
                GPU._scx = val;
                break;
            case 0xFF47:
                for(var i = 0; i < 4; i++) {
                    switch((val >> (i * 2)) & 3)
                    {
                        case 0: 
                            GPU._pal.bg[i] = [255,255,255,255]; 
                            break;
                        case 1: 
                            GPU._pal.bg[i] = [192,192,192,255]; 
                            break;
                        case 2: 
                            GPU._pal.bg[i] = [ 96, 96, 96,255]; 
                            break;
                        case 3: 
                            GPU._pal.bg[i] = [  0,  0,  0,255]; 
                            break;
                    }
                }
                break;
            case 0xFF48:
                for(var i = 0; i < 4; i++) {
                    switch((val >> (i * 2)) & 3)
                    {
                        case 0: 
                            GPU._pal.obj0[i] = [255,255,255,255]; 
                            break;
                        case 1: 
                            GPU._pal.obj0[i] = [192,192,192,255]; 
                            break;
                        case 2: 
                            GPU._pal.obj0[i] = [ 96, 96, 96,255]; 
                            break;
                        case 3: 
                            GPU._pal.obj0[i] = [  0,  0,  0,255]; 
                            break;
                    }
                }
                break;
            case 0xFF49:
                for(var i = 0; i < 4; i++) {
                    switch((val >> (i * 2)) & 3)
                    {
                        case 0: 
                            GPU._pal.obj1[i] = [255,255,255,255]; 
                            break;
                        case 1: 
                            GPU._pal.obj1[i] = [192,192,192,255]; 
                            break;
                        case 2: 
                            GPU._pal.obj1[i] = [ 96, 96, 96,255]; 
                            break;
                        case 3: 
                            GPU._pal.obj1[i] = [  0,  0,  0,255]; 
                            break;
                    }
                }
                break;
        }
    }
};