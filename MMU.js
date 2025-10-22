MMU = {
    _inbios: 1,
    _ie: 0,
    _if: 0,

    _bios: [
        0x31, 0xFE, 0xFF, 0xAF, 0x21, 0xFF, 0x9F, 0x32, 0xCB, 0x7C, 0x20, 0xFB, 0x21, 0x26, 0xFF, 0x0E,
        0x11, 0x3E, 0x80, 0x32, 0xE2, 0x0C, 0x3E, 0xF3, 0xE2, 0x32, 0x3E, 0x77, 0x77, 0x3E, 0xFC, 0xE0,
        0x47, 0x11, 0x04, 0x01, 0x21, 0x10, 0x80, 0x1A, 0xCD, 0x95, 0x00, 0xCD, 0x96, 0x00, 0x13, 0x7B,
        0xFE, 0x34, 0x20, 0xF3, 0x11, 0xD8, 0x00, 0x06, 0x08, 0x1A, 0x13, 0x22, 0x23, 0x05, 0x20, 0xF9,
        0x3E, 0x19, 0xEA, 0x10, 0x99, 0x21, 0x2F, 0x99, 0x0E, 0x0C, 0x3D, 0x28, 0x08, 0x32, 0x0D, 0x20,
        0xF9, 0x2E, 0x0F, 0x18, 0xF3, 0x67, 0x3E, 0x64, 0x57, 0xE0, 0x42, 0x3E, 0x91, 0xE0, 0x40, 0x04,
        0x1E, 0x02, 0x0E, 0x0C, 0xF0, 0x44, 0xFE, 0x90, 0x20, 0xFA, 0x0D, 0x20, 0xF7, 0x1D, 0x20, 0xF2,
        0x0E, 0x13, 0x24, 0x7C, 0x1E, 0x83, 0xFE, 0x62, 0x28, 0x06, 0x1E, 0xC1, 0xFE, 0x64, 0x20, 0x06,
        0x7B, 0xE2, 0x0C, 0x3E, 0x87, 0xF2, 0xF0, 0x42, 0x90, 0xE0, 0x42, 0x15, 0x20, 0xD2, 0x05, 0x20,
        0x4F, 0x16, 0x20, 0x18, 0xCB, 0x4F, 0x06, 0x04, 0xC5, 0xCB, 0x11, 0x17, 0xC1, 0xCB, 0x11, 0x17,
        0x05, 0x20, 0xF5, 0x22, 0x23, 0x22, 0x23, 0xC9, 0xCE, 0xED, 0x66, 0x66, 0xCC, 0x0D, 0x00, 0x0B,
        0x03, 0x73, 0x00, 0x83, 0x00, 0x0C, 0x00, 0x0D, 0x00, 0x08, 0x11, 0x1F, 0x88, 0x89, 0x00, 0x0E,
        0xDC, 0xCC, 0x6E, 0xE6, 0xDD, 0xDD, 0xD9, 0x99, 0xBB, 0xBB, 0x67, 0x63, 0x6E, 0x0E, 0xEC, 0xCC,
        0xDD, 0xDC, 0x99, 0x9F, 0xBB, 0xB9, 0x33, 0x3E, 0x3c, 0x42, 0xB9, 0xA5, 0xB9, 0xA5, 0x42, 0x4C,
        0x21, 0x04, 0x01, 0x11, 0xA8, 0x00, 0x1A, 0x13, 0xBE, 0x20, 0xFE, 0x23, 0x7D, 0xFE, 0x34, 0x20,
        0xF5, 0x06, 0x19, 0x78, 0x86, 0x23, 0x05, 0x20, 0xFB, 0x86, 0x20, 0xFE, 0x3E, 0x01, 0xE0, 0x50
    ],
    _rom: [],
    _wram: [],
    _eram: [],
    _zram: [],

    reset: function() {
        MMU._inbios = 1;
        
        for (var i = 0; i < 16384; i++) {
            MMU._rom[i] = 0;
        }

        for (var i = 0; i < 8192; i++) {
            MMU._wram[i] = 0;
            MMU._eram[i] = 0;
        }
        
        for (var i = 0; i < 128; i++) {
            MMU._zram[i] = 0;
        }
    },
    
    load: function(file) {
        var b = new BinFileReader(file);
        let romArray = [];
        for (let i = 0; i < b.getFileSize(); i++) {
            romArray[i] = b.readNumber(1, i);
        }
        MMU._rom = romArray;
        for (let i = 0; i < b.getFileSize(); i++) {
        }
    },    

    rb: function(addr) {
        switch (addr & 0xF000) {
            case 0x0000:
                if (MMU._inbios) {
                    if (addr < 0x0100) return MMU._bios[addr];
                    else if (Z80._r.pc == 0x0100) MMU._inbios = 0;
                }
            case 0x1000:
            case 0x2000:
            case 0x3000:
            case 0x4000:
            case 0x5000:
            case 0x6000:
            case 0x7000:
                return MMU._rom[addr];
            case 0x8000:
            case 0x9000:
                return GPU._vram[addr & 0x1FFF];
            case 0xA000:
            case 0xB000:
                return MMU._eram[addr & 0x1FFF];
            case 0xC000:
            case 0xD000:
            case 0xE000:
                return MMU._wram[addr & 0x1FFF];
            case 0xF000:
                switch(addr & 0x0F00) {
                    case 0xE00:
                        return (addr < 0xFEA0) ? GPU._oam[addr & 0xFF] : 0;
                    case 0xF00:
                        if (addr == 0xFFFF) {
                            return MMU._ie;
                        }
                        else if (addr >= 0xFF80) { 
                            return MMU._zram[addr & 0x7F];
                        }
                        else if (addr >= 0xFF40) {
                            return GPU.rb(addr);
                        }
                        else if (addr == 0xFF0F) {
                            return MMU._if;
                        }
                        else {
                            if ((addr & 0xFF) == 0) return Key.rb();
                            return 0;
                        }
                    default:
                        return MMU._wram[addr & 0x1FFF];
                }
        }
    },

    rw: function(addr) {
        return MMU.rb(addr) + (MMU.rb(addr+1) << 8);
    },

    wb: function(addr, val) {
        switch (addr & 0xF000) {
            case 0x0000:
                if (MMU._inbios && addr < 0x0100) return;
            case 0x1000:
            case 0x2000:
            case 0x3000:
            case 0x4000:
            case 0x5000:
            case 0x6000:
            case 0x7000:
                break;
            case 0x8000:
            case 0x9000:
                GPU._vram[addr & 0x1FFF] = val;
                if (addr >= 0x8000 && addr <= 0x97FF) {
                    GPU.updatetile(addr & 0x1FFE);
                }
                break;
            case 0xA000:
            case 0xB000:
                MMU._eram[addr & 0x1FFF] = val;
                break;
            case 0xC000:
            case 0xD000:
            case 0xE000:
                MMU._wram[addr & 0x1FFF] = val;
                break;
            case 0xF000:
                switch(addr & 0x0F00) {
                    case 0xE00:
                        if (addr < 0xFEA0) GPU._oam[addr & 0xFF] = val;
                        GPU.buildobjdata(addr - 0xFE00, val);
                        break;
                    case 0xF00:
                        if (addr == 0xFFFF) {
                            MMU._ie = val;
                        }
                        else if (addr >= 0xFF80) {
                            MMU._zram[addr & 0x7F] = val;
                        }
                        else if (addr >= 0xFF40) {
                            GPU.wb(addr, val);
                        }
                        else if ((addr & 0xF0) == 0) {
                            switch(addr & 0xF) {
                                case 0:
                                    Key.wb(val);
                                    break;
                                case 4:
                                case 5:
                                case 6:
                                case 7:
                                    break;
                                case 15:
                                    MMU._if = val;
                                    break;
                                default:
                                    break;
                            }
                        }
                        break;
                    default:
                        MMU._wram[addr & 0x1FFF] = val;
                        break;
                }
        }
    },
    
    ww: function(addr, val) {
        MMU.wb(addr, val&255);
        MMU.wb(addr+1, val>>8);
    }
};