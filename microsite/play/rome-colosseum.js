window.RomeColosseum = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 23040;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLambert(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeLambert(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        return addMesh(mesh);
    }

    function buildColosseum() {
        var color = 0xD4A870;
        var darkArch = 0x8B6914;
        var cx = -200;
        var cz = 0;

        // Outer wall tier 1 - base ring (elliptical approximated with 16-sided cylinder)
        makeCyl(90, 92, 14, 16, color, cx, 7, cz);
        // Outer wall tier 2
        makeCyl(87, 89, 12, 16, color, cx, 21, cz);
        // Outer wall tier 3
        makeCyl(84, 86, 12, 16, color, cx, 33, cz);
        // Outer wall tier 4 attic level
        makeCyl(81, 83, 10, 16, color, cx, 43, cz);

        // Inner wall ring tier 1
        makeCyl(70, 72, 12, 16, 0xC09860, cx, 6, cz);
        // Inner wall ring tier 2
        makeCyl(67, 69, 10, 16, 0xC09860, cx, 17, cz);

        // Arena floor (sand colored)
        makeCyl(38, 38, 2, 16, 0xD4B896, cx, 1, cz);

        // Hypogeum underground chambers - rows of box pillars under arena
        var hypColors = 0x6B5A3E;
        for (var hi = 0; hi < 8; hi++) {
            var hangle = (hi / 8) * Math.PI * 2;
            var hx = cx + Math.cos(hangle) * 20;
            var hz = cz + Math.sin(hangle) * 12;
            makeBox(4, 6, 4, hypColors, hx, -3, hz);
        }

        // 80 arched entrances approximated as dark boxes around base perimeter
        for (var ai = 0; ai < 16; ai++) {
            var aangle = (ai / 16) * Math.PI * 2;
            var ax = cx + Math.cos(aangle) * 91;
            var az = cz + Math.sin(aangle) * 60;
            makeBox(5, 10, 3, darkArch, ax, 5, az);
        }

        // Velarium poles on top
        for (var vi = 0; vi < 8; vi++) {
            var vangle = (vi / 8) * Math.PI * 2;
            var vx = cx + Math.cos(vangle) * 82;
            var vz = cz + Math.sin(vangle) * 52;
            makeCyl(0.5, 0.5, 8, 6, 0x8B7355, vx, 52, vz);
        }

        // Seating tiers - inner bowl
        makeCyl(60, 68, 4, 16, 0xC8B890, cx, 10, cz);
        makeCyl(50, 58, 4, 16, 0xC8B890, cx, 14, cz);
        makeCyl(40, 48, 4, 16, 0xC8B890, cx, 18, cz);

        // Imperial box platform
        makeBox(12, 3, 8, 0xD4A870, cx + 40, 4, cz);
        makeBox(12, 3, 8, 0xD4A870, cx - 40, 4, cz);
    }

    function buildRomanForum() {
        var color = 0xD4C8A0;
        var cx = 0;
        var cz = 150;

        // Sacred Way paving - wide stone road
        makeBox(200, 1, 12, 0xC8C0A0, cx, 0.5, cz);
        makeBox(12, 1, 200, 0xC8C0A0, cx, 0.5, cz);

        // Temple of Saturn - podium
        makeBox(30, 6, 20, color, cx - 60, 3, cz - 40);
        // Temple of Saturn columns (6 remaining)
        for (var sc = 0; sc < 6; sc++) {
            makeCyl(1.2, 1.4, 14, 8, 0xD4C8A0, cx - 72 + sc * 5, 13, cz - 44);
        }
        // Temple of Saturn entablature
        makeBox(32, 3, 4, color, cx - 60, 20, cz - 44);

        // Arch of Titus - massive triumphal arch
        makeBox(18, 20, 6, color, cx + 60, 10, cz + 30);
        makeBox(6, 20, 6, 0x8B8060, cx + 60, 10, cz + 30);
        // Arch of Titus attic
        makeBox(18, 5, 6, color, cx + 60, 22, cz + 30);

        // Basilica of Maxentius ruins - three massive barrel vault piers
        makeBox(20, 24, 16, 0xC8BCA0, cx + 80, 12, cz - 20);
        makeBox(20, 24, 16, 0xC8BCA0, cx + 105, 12, cz - 20);
        makeBox(20, 24, 16, 0xC8BCA0, cx + 130, 12, cz - 20);
        // Connecting arch remnants
        makeBox(5, 20, 16, 0xB8AC90, cx + 92, 20, cz - 20);
        makeBox(5, 20, 16, 0xB8AC90, cx + 117, 20, cz - 20);

        // Temple of Vesta - round temple
        makeCyl(10, 10, 8, 12, color, cx - 20, 4, cz + 60);
        for (var vc = 0; vc < 12; vc++) {
            var vcangle = (vc / 12) * Math.PI * 2;
            makeCyl(0.8, 0.8, 8, 8, 0xD0C49A, cx - 20 + Math.cos(vcangle) * 11, 9, cz + 60 + Math.sin(vcangle) * 11);
        }
        makeCone(11, 4, 12, 0xC0B080, cx - 20, 16, cz + 60);

        // Column of Phocas - lone column
        makeCyl(1.5, 1.5, 18, 8, 0xD0C89A, cx, 9, cz + 20);
        makeCyl(0.8, 0.8, 4, 8, 0xC0B89A, cx, 20, cz + 20);

        // Rostra - speaker's platform
        makeBox(25, 4, 10, 0xC4B890, cx - 10, 2, cz);
    }

    function buildPalatineHill() {
        var color = 0x8B7355;
        var cx = 80;
        var cz = -80;

        // Main hill mass
        makeCyl(80, 100, 30, 12, color, cx, 15, cz);
        makeCyl(60, 80, 20, 12, 0x7A6245, cx, 40, cz);

        // Imperial Palace ruins - Domus Augustana
        makeBox(60, 12, 40, 0xC4A870, cx, 58, cz - 10);
        makeBox(8, 16, 40, 0xB49860, cx - 26, 62, cz - 10);
        makeBox(8, 16, 40, 0xB49860, cx + 26, 62, cz - 10);
        // Palace columns
        for (var pc = 0; pc < 5; pc++) {
            makeCyl(1.0, 1.0, 14, 8, 0xD0B870, cx - 20 + pc * 10, 66, cz - 30);
        }
        makeBox(60, 3, 4, 0xC4A870, cx, 78, cz - 30);

        // Stadium of Domitian on Palatine
        makeBox(50, 4, 20, 0x9A8560, cx + 10, 48, cz + 50);
        makeBox(2, 10, 20, 0x8B7550, cx - 15, 51, cz + 50);
        makeBox(2, 10, 20, 0x8B7550, cx + 35, 51, cz + 50);

        // Circus Maximus in valley below
        makeBox(250, 3, 50, 0x8B7040, cx - 20, 1.5, cz + 140);
        // Circus Maximus spine
        makeBox(180, 5, 6, 0xC4A060, cx - 20, 3, cz + 140);
        // Circus Maximus turning posts
        makeCyl(3, 3, 8, 8, 0xD4A850, cx - 110, 5, cz + 140);
        makeCyl(3, 3, 8, 8, 0xD4A850, cx + 70, 5, cz + 140);
        // Circus obelisk on spine
        makeCone(1.5, 2, 4, 0xA08040, cx - 20, 10, cz + 140);
        makeCyl(1, 1, 12, 4, 0xA08040, cx - 20, 4, cz + 140);

        // Palatine terracing walls
        makeBox(200, 8, 4, 0x7A6040, cx - 20, 4, cz + 20);
        makeBox(4, 20, 80, 0x7A6040, cx - 120, 10, cz - 20);
    }

    function buildPantheon() {
        var color = 0xD3C8A8;
        var cx = -120;
        var cz = -180;

        // Drum base - rotunda
        makeCyl(26, 26, 22, 16, color, cx, 11, cz);
        // Dome - hemispherical
        makeSphere(26, 16, 8, 0xC8BDA0, cx, 22, cz);
        // Oculus ring at dome top
        makeCyl(3, 3, 2, 12, 0x8B8060, cx, 47, cz);

        // Portico steps
        makeBox(32, 2, 8, 0xC8C0A8, cx, 1, cz - 30);
        // Portico floor
        makeBox(32, 1, 18, 0xD0C8A8, cx, 2, cz - 22);
        // 8 granite columns
        for (var panc = 0; panc < 8; panc++) {
            var colX = cx - 17.5 + panc * 5;
            makeCyl(1.5, 1.6, 14, 8, 0x8A7050, colX, 10, cz - 22);
        }
        // Portico entablature
        makeBox(34, 4, 4, color, cx, 18, cz - 22);
        // Triangular pediment
        makeCone(18, 8, 3, 0xC8BDA0, cx, 25, cz - 22);

        // Connection between portico and rotunda
        makeBox(16, 22, 10, color, cx, 11, cz - 12);

        // Piazza in front
        makeBox(60, 1, 40, 0xC8C4B0, cx, 0.5, cz - 50);
        // Obelisk in piazza
        makeCyl(0.8, 1.5, 16, 4, 0x5A4A30, cx, 9, cz - 52);
        makeCone(0.8, 2, 4, 0x5A4A30, cx, 18, cz - 52);
    }

    function buildTreviFountain() {
        var color = 0xF0EDE0;
        var cx = -60;
        var cz = -280;

        // Main facade - triumphal arch form
        makeBox(40, 30, 8, color, cx, 15, cz);
        // Central arch
        makeBox(10, 22, 8, 0xD8D4C8, cx, 11, cz);
        // Side columns
        makeCyl(2, 2, 28, 8, 0xE8E4D8, cx - 16, 14, cz);
        makeCyl(2, 2, 28, 8, 0xE8E4D8, cx - 8, 14, cz);
        makeCyl(2, 2, 28, 8, 0xE8E4D8, cx + 8, 14, cz);
        makeCyl(2, 2, 28, 8, 0xE8E4D8, cx + 16, 14, cz);

        // Attic with statues
        makeBox(40, 6, 8, color, cx, 33, cz);
        // Neptune statue on chariot
        makeCyl(1.5, 1.5, 8, 8, 0xE0DDD0, cx, 28, cz - 4);
        makeSphere(2.5, 8, 6, 0xDDD8C8, cx, 37, cz - 4);
        // Flanking allegory statues
        makeCyl(1, 1, 6, 6, 0xE0DDD0, cx - 12, 28, cz - 4);
        makeSphere(2, 8, 6, 0xDDD8C8, cx - 12, 35, cz - 4);
        makeCyl(1, 1, 6, 6, 0xE0DDD0, cx + 12, 28, cz - 4);
        makeSphere(2, 8, 6, 0xDDD8C8, cx + 12, 35, cz - 4);

        // Water basin
        makeBox(50, 4, 30, 0xE8F0F8, cx, 2, cz - 14);
        // Pool water surface
        makeBox(46, 1, 26, 0x2A7AB0, cx, 4.5, cz - 14);

        // Rocks/sea horse sculptures in basin
        makeSphere(3, 6, 5, 0xC8C0B0, cx - 10, 5, cz - 12);
        makeSphere(3, 6, 5, 0xC8C0B0, cx + 10, 5, cz - 12);

        // Side buildings framing fountain
        makeBox(14, 30, 20, 0xE0D8C8, cx - 34, 15, cz);
        makeBox(14, 30, 20, 0xE0D8C8, cx + 34, 15, cz);
    }

    function buildStPetersSquare() {
        var color = 0xF5F0E8;
        var cx = -350;
        var cz = -150;

        // Basilica facade
        makeBox(80, 50, 20, color, cx, 25, cz);
        // Basilica central dome drum
        makeCyl(22, 24, 20, 16, 0xECE8DC, cx, 72, cz);
        // Dome
        makeSphere(22, 16, 8, 0xE4E0D4, cx, 82, cz);
        // Dome lantern
        makeCyl(4, 4, 8, 8, 0xF0EDE4, cx, 103, cz);
        makeCone(4, 5, 8, 0xD4C8A0, cx, 111, cz);

        // Basilica flanking towers
        makeCyl(8, 8, 40, 8, 0xE8E4D8, cx - 36, 20, cz - 8);
        makeCyl(8, 8, 40, 8, 0xE8E4D8, cx + 36, 20, cz - 8);
        makeCone(8, 10, 8, 0xDDD8CC, cx - 36, 45, cz - 8);
        makeCone(8, 10, 8, 0xDDD8CC, cx + 36, 45, cz - 8);

        // Basilica portico columns
        for (var bpc = 0; bpc < 8; bpc++) {
            makeCyl(2, 2, 18, 8, 0xEAE6DA, cx - 35 + bpc * 10, 9, cz - 10);
        }
        makeBox(82, 4, 4, color, cx, 20, cz - 10);

        // Piazza steps
        makeBox(100, 2, 20, 0xE0DCD0, cx, 1, cz - 30);

        // Egyptian obelisk in center of piazza
        makeCyl(1.5, 3, 28, 4, 0x5A5040, cx, 15, cz - 80);
        makeCone(1.5, 3, 4, 0x5A5040, cx, 30, cz - 80);
        // Obelisk base
        makeBox(8, 4, 8, 0x6A6050, cx, 2, cz - 80);

        // Bernini's colonnade - left arc
        for (var lc = 0; lc < 10; lc++) {
            var lcangle = (lc / 9) * (Math.PI * 0.7) + Math.PI * 0.15;
            var lcx = cx - 80 + Math.cos(lcangle) * 90;
            var lcz = cz - 80 + Math.sin(lcangle) * 60;
            makeCyl(2, 2, 16, 8, 0xEAE6DA, lcx, 8, lcz);
        }
        // Bernini's colonnade - right arc
        for (var rc = 0; rc < 10; rc++) {
            var rcangle = (rc / 9) * (Math.PI * 0.7) + Math.PI * 1.15;
            var rcx = cx + 80 + Math.cos(rcangle) * 90;
            var rcz = cz - 80 + Math.sin(rcangle) * 60;
            makeCyl(2, 2, 16, 8, 0xEAE6DA, rcx, 8, rcz);
        }
        // Colonnade entablature arcs (approximated as boxes)
        makeBox(160, 4, 4, 0xE0DCD0, cx, 17, cz - 50);
    }

    function buildCastelSantAngelo() {
        var color = 0xC8B890;
        var cx = -280;
        var cz = -60;

        // Massive drum base (Hadrian's Mausoleum)
        makeCyl(38, 40, 20, 16, color, cx, 10, cz);
        // Second drum tier
        makeCyl(30, 32, 16, 16, 0xBCA880, cx, 28, cz);
        // Medieval fortification top
        makeCyl(25, 26, 10, 12, 0xB09870, cx, 41, cz);
        // Battlements ring
        makeCyl(27, 27, 3, 16, 0xA89060, cx, 47, cz);

        // Corner towers of medieval addition
        makeCyl(6, 6, 20, 8, 0xB09860, cx - 28, 10, cz - 28);
        makeCyl(6, 6, 20, 8, 0xB09860, cx + 28, 10, cz - 28);
        makeCyl(6, 6, 20, 8, 0xB09860, cx - 28, 10, cz + 28);
        makeCyl(6, 6, 20, 8, 0xB09860, cx + 28, 10, cz + 28);
        // Tower cones
        makeCone(7, 6, 8, 0x8B7050, cx - 28, 21, cz - 28);
        makeCone(7, 6, 8, 0x8B7050, cx + 28, 21, cz - 28);
        makeCone(7, 6, 8, 0x8B7050, cx - 28, 21, cz + 28);
        makeCone(7, 6, 8, 0x8B7050, cx + 28, 21, cz + 28);

        // Angel statue on top
        makeCyl(2, 2, 8, 8, 0xD4C8A0, cx, 51, cz);
        makeSphere(3, 8, 6, 0xD0C49A, cx, 60, cz);
        // Wings approximated as boxes
        makeBox(14, 6, 1.5, 0xD4C8A0, cx, 59, cz);

        // Passetto wall connecting to Vatican
        makeBox(160, 10, 4, 0xB8AC88, cx + 110, 5, cz - 50);
        makeBox(4, 10, 60, 0xB8AC88, cx + 190, 5, cz - 80);

        // Bridge - Ponte Sant'Angelo
        makeBox(100, 4, 14, 0xC8C0A0, cx + 54, 2, cz + 70);
        // Bridge piers
        makeCyl(5, 6, 8, 8, 0xB0A880, cx + 20, 1, cz + 70);
        makeCyl(5, 6, 8, 8, 0xB0A880, cx + 50, 1, cz + 70);
        makeCyl(5, 6, 8, 8, 0xB0A880, cx + 80, 1, cz + 70);
        // Angel statues on bridge
        for (var ba = 0; ba < 5; ba++) {
            makeCyl(1, 1, 5, 6, 0xD4C8A8, cx + 15 + ba * 17, 6, cz + 63);
            makeSphere(1.5, 6, 5, 0xD0C4A4, cx + 15 + ba * 17, 12, cz + 63);
        }
    }

    function buildTiberRiver() {
        var color = 0x2A5A7A;
        var cx = -260;
        var cz = 60;

        // Main river channel
        makeBox(600, 2, 40, color, cx + 100, -0.5, cz);
        // River banks
        makeBox(600, 3, 6, 0x6B5A3A, cx + 100, 1, cz - 23);
        makeBox(600, 3, 6, 0x6B5A3A, cx + 100, 1, cz + 23);
        // Shallow ripple effect - slight variation boxes
        makeBox(120, 1, 36, 0x3A6A8A, cx - 60, 0.5, cz);
        makeBox(120, 1, 36, 0x2A5070, cx + 60, 0.5, cz);
        makeBox(120, 1, 36, 0x3A6A8A, cx + 160, 0.5, cz);
    }

    function buildTrajansColumn() {
        var color = 0xD4C8B0;
        var cx = 30;
        var cz = -60;

        // Pedestal base
        makeBox(12, 8, 12, color, cx, 4, cz);
        // Column shaft - tall
        makeCyl(2.5, 2.8, 40, 16, color, cx, 28, cz);
        // Capital
        makeCyl(3.5, 3, 4, 12, 0xC8BCA0, cx, 50, cz);
        // Statue of Trajan (originally)
        makeCyl(1.5, 1.5, 5, 8, 0xD4C8B0, cx, 54, cz);
        makeSphere(2.5, 8, 6, 0xCEC2AA, cx, 60, cz);

        // Small decorative trophies at base corners
        makeCyl(1, 1.5, 4, 6, 0xC4B8A0, cx - 5, 9, cz - 5);
        makeCyl(1, 1.5, 4, 6, 0xC4B8A0, cx + 5, 9, cz - 5);
        makeCyl(1, 1.5, 4, 6, 0xC4B8A0, cx - 5, 9, cz + 5);
        makeCyl(1, 1.5, 4, 6, 0xC4B8A0, cx + 5, 9, cz + 5);

        // Trajan's Forum plaza
        makeBox(80, 1, 60, 0xC8C0A0, cx, 0.5, cz + 20);
        // Basilica Ulpia ruins
        makeBox(70, 10, 20, 0xCCC0A0, cx, 5, cz + 60);
        // Basilica Ulpia columns
        for (var tfc = 0; tfc < 6; tfc++) {
            makeCyl(1.5, 1.5, 12, 8, 0xD4C8B0, cx - 25 + tfc * 10, 11, cz + 52);
        }
    }

    function buildVictorEmmanuel() {
        var color = 0xF5F0E0;
        var cx = 60;
        var cz = 30;

        // Massive podium
        makeBox(100, 10, 60, color, cx, 5, cz);

        // Main colonnaded facade
        for (var vmc = 0; vmc < 10; vmc++) {
            makeCyl(3, 3.2, 24, 8, 0xF0EBD8, cx - 45 + vmc * 10, 18, cz - 28);
        }
        // Entablature
        makeBox(102, 6, 8, color, cx, 32, cz - 28);

        // Attic with quadrigas
        makeBox(102, 12, 8, color, cx, 42, cz - 28);
        // Quadriga on left
        makeSphere(5, 8, 6, 0xE8D890, cx - 40, 58, cz - 28);
        makeCyl(1.5, 1.5, 6, 6, 0xE8D890, cx - 40, 55, cz - 28);
        // Quadriga on right
        makeSphere(5, 8, 6, 0xE8D890, cx + 40, 58, cz - 28);
        makeCyl(1.5, 1.5, 6, 6, 0xE8D890, cx + 40, 55, cz - 28);

        // Side wings
        makeBox(30, 30, 20, 0xF0EBD8, cx - 65, 15, cz);
        makeBox(30, 30, 20, 0xF0EBD8, cx + 65, 15, cz);
        // Wing towers
        makeCyl(8, 8, 36, 8, 0xECE8D4, cx - 72, 18, cz - 20);
        makeCyl(8, 8, 36, 8, 0xECE8D4, cx + 72, 18, cz - 20);

        // Tomb of Unknown Soldier - altar area
        makeBox(20, 5, 15, 0xE8E4D0, cx, 13, cz + 20);
        makeBox(8, 8, 8, 0xF0EBD8, cx, 20, cz + 20);
        // Equestrian statue of Victor Emmanuel II
        makeCyl(2, 3, 12, 8, 0xD4C870, cx, 7, cz - 10);
        makeSphere(4, 8, 6, 0xC8BC60, cx, 20, cz - 10);

        // Grand staircase
        makeBox(60, 2, 8, 0xECE8D4, cx, 11, cz - 35);
        makeBox(60, 2, 8, 0xECE8D4, cx, 9, cz - 44);
        makeBox(60, 2, 8, 0xECE8D4, cx, 7, cz - 53);
    }

    function build() {
        buildColosseum();
        buildRomanForum();
        buildPalatineHill();
        buildPantheon();
        buildTreviFountain();
        buildStPetersSquare();
        buildCastelSantAngelo();
        buildTiberRiver();
        buildTrajansColumn();
        buildVictorEmmanuel();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) {
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
