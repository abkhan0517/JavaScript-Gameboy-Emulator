Key = {
    _rows: [0xF, 0xF],
    _column: 0,
    
    reset: function() {
        Key._rows = [0xF, 0xF];
        Key._column = 0;
    },
    
    rb: function() {
        switch (Key._column) {
            case 0x10:
                return Key._rows[0];
            case 0x20:
                return Key._rows[1];
            default: 
                return 0xFF;
        }
    },

    wb: function(addr, val) {
        Key._column = val & 0x30;
    },

    kdown: function(e) {
        switch(e.keyCode) {
            case 39: KEY._rows[1] &= 0xE; break;
            case 37: KEY._rows[1] &= 0xD; break;
            case 38: KEY._rows[1] &= 0xB; break;
            case 40: KEY._rows[1] &= 0x7; break;
            case 90: KEY._rows[0] &= 0xE; break;
            case 88: KEY._rows[0] &= 0xD; break;
            case 32: KEY._rows[0] &= 0xB; break;
            case 13: KEY._rows[0] &= 0x7; break;
	    }
    },

    kup: function(e) {
        switch(e.keyCode) {
            case 39: KEY._rows[1] |= 0x1; break;
            case 37: KEY._rows[1] |= 0x2; break;
            case 38: KEY._rows[1] |= 0x4; break;
            case 40: KEY._rows[1] |= 0x8; break;
            case 90: KEY._rows[0] |= 0x1; break;
            case 88: KEY._rows[0] |= 0x2; break;
            case 32: KEY._rows[0] |= 0x4; break;
            case 13: KEY._rows[0] |= 0x8; break;
	    }
    }
}

window.onkeydown(Key.kdown);
window.onkeyup(Key.kup);
