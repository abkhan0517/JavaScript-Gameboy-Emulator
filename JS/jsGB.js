jsGB = {
    _interval: null,
    
    reset: function() {
        console.clear();
        GPU.reset();
        MMU.reset();
        Z80.reset();
        //MMU.load("test.gb");
        //MMU.load("ttt.gb");
        //MMU.load("gbpng.gb");
        //MMU.load('Tetris (Japan) (En).gb');
        //MMU.load("Super Mario Land (World).gb");
        //MMU.load("Dr. Mario (World).gb");

        //Blargg Test Roms
        //MMU.load("01-special.gb");
        //MMU.load("02-interrupts.gb");
        //MMU.load("03-op sp,hl.gb");
        MMU.load("test.gb");
        //MMU.load("05-op rp.gb");
        //MMU.load("06-ld r,r.gb");
        //MMU.load("07-jr,jp,call,ret,rst.gb");
        //MMU.load("08-misc instrs.gb");
        //MMU.load("09-op r,r.gb");
        //MMU.load("10-bit ops.gb");
        //MMU.load("11-op a,(hl).gb");
        //MMU.load("cpu_instrs.gb");

        jsGB.skipBoot(); // Skip BIOS

        // Simulate what BIOS would normally do
        //MMU.wb(0xFF40, 0x91); // LCDC: LCD on, BG on, tile data at 0x8000
        //MMU.wb(0xFF47, 0xFC); // BGP: 11 10 01 00 -> black → white
        //MMU.wb(0xFF44, 0x00); // LY = 0 (current scanline)

    },

    skipBoot: function() {
        MMU._inbios = 0;
        Z80._r.a = 0x01;
        Z80._r.f = 0xB0;
        Z80._r.c = 0x13;
        Z80._r.e = 0xD8;
        Z80._r.h = 0x01;
        Z80._r.l = 0x4D;
        Z80._r.pc = 0x100;
        Z80._r.sp = 0xFFFE;
    },

    frame: function() {
        var fclk = Z80._clock.t + 70224;
        do {
            const pc = Z80._r.pc;
            const ope = MMU.rb(pc);
            //console.log(`PC=${pc.toString(16).padStart(4, '0')} Opcode=${ope.toString(16).padStart(2, '0')}`);
            Z80._r.pc++;
            Z80._map[ope]();
            Z80._r.pc &= 65535;
            Z80._clock.m += Z80._r.m;
            Z80._clock.t += Z80._r.t;
            GPU.step();
            Z80._r.m = 0;
            Z80._r.t = 0;
            if (Z80._r.ime && MMU._ie && MMU._if) {
                var ifired = MMU._ie & MMU._if;
                if (ifired){
                    //console.log("ime");
                    MMU._if &= (255 - 0x01);
                    Z80._ops.RST40();
                }
            }
            Z80._clock.m += Z80._r.m;
            Z80._clock.t += Z80._r.t;
        } while (Z80._clock.t < fclk && Z80._stop == 0);
        //console.log("Done");
    },

    run: function() {
        if (!jsGB._interval) {
            jsGB._interval = setTimeout(jsGB.frame, 1);
            document.getElementById('run').innerHTML = 'Pause';
        }
        else {
            clearInterval(jsGB._interval);
            jsGB._interval = null;
            document.getElementById('run').innerHTML = 'Run';
        }
    },

    play: function() {
        if (jsGB._interval) {
            clearInterval(jsGB._interval);
            jsGB._interval = null;
            console.log("Stopped");
            document.getElementById('play').innerHTML = 'Play';
        }
        
        else {
            console.log("Playing");
            jsGB._interval = setInterval(jsGB.frame, 25);
            document.getElementById('play').innerHTML = 'Stop';
        }
    }
}

window.onload = function() {
    document.getElementById('reset').onclick = jsGB.reset;
    document.getElementById('frame').onclick = jsGB.frame;
    document.getElementById('play').onclick = jsGB.play;
    jsGB.reset();
}
