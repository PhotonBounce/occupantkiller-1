window.NavanHill = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 18720;
    var CY = 0;
    var CZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeboxrot(w, h, d, color, x, y, z, ry) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        mesh.rotation.y = ry;
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildNavanTown();
        buildBoyneRiver();
        buildBlackwaterRiver();
        buildNavanFort();
        buildHillOfTara();
        buildBectiveAbbey();
        buildHedgerows();
        buildFarmFields();
    }

    // ── Ground / Plateau ──────────────────────────────────────────────────────
    function buildGround() {
        // Main fertile Meath plain — large flat base
        makebox(2400, 2, 2400, 0x228B22, 0, -1, 0);
        // Road east-west through Navan town
        makebox(600, 1, 14, 0x555555, -100, 0, 0);
        // Road north toward Tara
        makebox(14, 1, 400, 0x555555, 80, 0, -280);
    }

    // ── Navan Town (An Uaimh) ─────────────────────────────────────────────────
    function buildNavanTown() {
        // Georgian market town core — terrace blocks
        // Main Street north side row
        makebox(30, 12, 14, 0xCD5C5C, -60, 6, -30);
        makebox(30, 10, 14, 0xCD5C5C, -28, 5, -30);
        makebox(30, 14, 14, 0xCD5C5C, 4, 7, -30);
        makebox(30, 10, 14, 0xCD5C5C, 36, 5, -30);
        makebox(30, 12, 14, 0xCD5C5C, 68, 6, -30);
        // Main Street south side row
        makebox(30, 10, 14, 0xCD5C5C, -60, 5, 30);
        makebox(30, 12, 14, 0xCD5C5C, -28, 6, 30);
        makebox(30, 10, 14, 0xCD5C5C, 4, 5, 30);
        makebox(30, 14, 14, 0xCD5C5C, 36, 7, 30);
        makebox(30, 10, 14, 0xCD5C5C, 68, 5, 30);
        // Market square paving
        makebox(40, 1, 40, 0x888877, 0, 0, 0);
        // Market cross column
        makecyl(0.6, 0.6, 8, 8, 0xAAAAAA, 0, 4, 0);
        makebox(6, 1, 1, 0xAAAAAA, 0, 8, 0);
        makebox(1, 1, 6, 0xAAAAAA, 0, 8, 0);
        // Town hall — slightly larger Georgian block
        makebox(24, 16, 18, 0xCC7755, 100, 8, -16);
        makebox(24, 1, 18, 0x888877, 100, 16, -16);
        // Town hall pediment
        makecone(13, 6, 4, 0xAA6644, 100, 19, -16);
        // St Mary's Church
        makebox(18, 18, 30, 0x888888, -140, 9, -20);
        // St Mary's nave extension
        makebox(10, 14, 18, 0x888888, -140, 7, -42);
        // St Mary's tower
        makebox(8, 24, 8, 0x777777, -140, 12, -14);
        // St Mary's steeple spire
        makecone(4, 18, 8, 0x666666, -140, 30, -14);
        // Church buttresses
        makebox(3, 16, 4, 0x999999, -133, 8, -28);
        makebox(3, 16, 4, 0x999999, -147, 8, -28);
        // Small shop blocks east side
        makebox(18, 8, 12, 0xCC8866, 130, 4, -24);
        makebox(18, 8, 12, 0xCC8866, 150, 4, -24);
        makebox(18, 8, 12, 0xCC8866, 130, 4, 24);
        // Pub / inn block
        makebox(20, 10, 14, 0xAA7755, -100, 5, 30);
    }

    // ── River Boyne ───────────────────────────────────────────────────────────
    function buildBoyneRiver() {
        // Boyne flows roughly east-west through town
        makebox(600, 1, 18, 0x006994, -50, -0.5, 80);
        makebox(200, 1, 14, 0x006994, 220, -0.5, 60);
        makebox(100, 1, 20, 0x006994, -200, -0.5, 100);
        // Riverbanks
        makebox(600, 2, 4, 0x5C3317, -50, 0, 71);
        makebox(600, 2, 4, 0x5C3317, -50, 0, 89);
        // Boyne bridge at Navan
        makebox(22, 4, 18, 0x888877, 0, 1, 80);
        makebox(4, 8, 4, 0x888877, -10, 4, 80);
        makebox(4, 8, 4, 0x888877, 10, 4, 80);
        // Confluence point — wider pool
        makecyl(20, 22, 1, 12, 0x006994, -200, -0.5, 120);
    }

    // ── River Blackwater ──────────────────────────────────────────────────────
    function buildBlackwaterRiver() {
        // Blackwater flows south into the Boyne at Navan
        makebox(14, 1, 300, 0x006994, -200, -0.5, -30);
        makebox(14, 2, 4, 0x5C3317, -207, 0, -30);
        makebox(14, 2, 4, 0x5C3317, -193, 0, -30);
    }

    // ── Navan Fort / Emain Macha ──────────────────────────────────────────────
    function buildNavanFort() {
        // Located west of Navan town — 0xF0 offset
        // Archaeological plateau base (slightly raised)
        makecyl(90, 95, 4, 24, 0x228B22, -280, 2, -200);
        // Circular earthwork ring — 16 BoxGeometry segments forming a ring
        // radius ~70 from fort centre
        var ringRadius = 70;
        var ringSegs = 16;
        var segLen = 2 * Math.PI * ringRadius / ringSegs;
        var i;
        for (i = 0; i < ringSegs; i++) {
            var angle = (i / ringSegs) * 2 * Math.PI;
            var rx = Math.sin(angle) * ringRadius;
            var rz = Math.cos(angle) * ringRadius;
            var ry = angle;
            makeboxrot(segLen + 2, 8, 10, 0x5C3317, -280 + rx, 6, -200 + rz, -ry);
        }
        // Inner ditch — dark depression represented by dark cylinder
        makecyl(62, 64, 2, 24, 0x3A2510, -280, 3, -200);
        // Central mound (the great mound of Emain Macha)
        makecyl(24, 28, 10, 16, 0x228B22, -280, 7, -200);
        makesphere(22, 12, 8, 0x228B22, -280, 16, -200);
        // Outer bank (second earthwork)
        var outerRadius = 86;
        for (i = 0; i < 12; i++) {
            var oangle = (i / 12) * 2 * Math.PI;
            var orx = Math.sin(oangle) * outerRadius;
            var orz = Math.cos(oangle) * outerRadius;
            makeboxrot(46, 4, 6, 0x5C3317, -280 + orx, 3, -200 + orz, -oangle);
        }
        // Entrance causeway on east side
        makebox(30, 4, 8, 0x5C3317, -218, 3, -200);
        // Archaeological timber post markers (upright cylinders)
        makecyl(1, 1, 6, 6, 0x5C3317, -268, 5, -200);
        makecyl(1, 1, 6, 6, 0x5C3317, -292, 5, -200);
        makecyl(1, 1, 6, 6, 0x5C3317, -280, 5, -188);
        makecyl(1, 1, 6, 6, 0x5C3317, -280, 5, -212);
    }

    // ── Hill of Tara (Teamhair) ───────────────────────────────────────────────
    function buildHillOfTara() {
        // Tara is north of Navan — offset in -Z direction
        // Gently rising hill — layered cylinders for rounded profile
        makecyl(110, 120, 6, 24, 0x228B22, 80, 3, -500);
        makecyl(80, 95, 6, 24, 0x228B22, 80, 9, -500);
        makecyl(55, 68, 6, 24, 0x228B22, 80, 14, -500);
        makecyl(34, 44, 4, 20, 0x228B22, 80, 18, -500);
        // Summit plateau cap
        makecyl(28, 32, 3, 20, 0x228B22, 80, 21, -500);

        // Ráith na Ríogh — Royal Enclosure: large circular earthwork
        var rnaRRadius = 80;
        var rnaRSegs = 18;
        var j;
        for (j = 0; j < rnaRSegs; j++) {
            var rra = (j / rnaRSegs) * 2 * Math.PI;
            var rrx = Math.sin(rra) * rnaRRadius;
            var rrz = Math.cos(rra) * rnaRRadius;
            makeboxrot((2 * Math.PI * rnaRRadius / rnaRSegs) + 2, 5, 7, 0x4A7A22, 80 + rrx, 4, -500 + rrz, -rra);
        }

        // Banqueting Hall — two parallel north-south earthwork banks
        makebox(6, 4, 120, 0x228B22, 48, 3, -500);
        makebox(6, 4, 120, 0x228B22, 64, 3, -500);
        // Banqueting hall end banks
        makebox(22, 3, 6, 0x228B22, 56, 3, -440);
        makebox(22, 3, 6, 0x228B22, 56, 3, -560);

        // Mound of the Hostages (Dumha na nGiall) — passage tomb
        makecyl(12, 14, 7, 16, 0x5C3317, 88, 24, -488);
        makesphere(11, 10, 6, 0x5C3317, 88, 30, -488);
        // Passage tomb entrance stones
        makebox(2, 4, 1, 0x777777, 84, 23, -478);
        makebox(2, 4, 1, 0x777777, 92, 23, -478);
        makebox(8, 1, 1, 0x777777, 88, 26, -478);

        // Lia Fáil — Stone of Destiny: tall upright phallic stone
        makecyl(1.2, 1.6, 18, 8, 0x808080, 80, 28, -498);
        makecyl(1.6, 1.2, 4, 8, 0x909090, 80, 38, -498);

        // Ráith na Seanaid — northern enclosure ring
        var rnsRadius = 40;
        var rnsSegs = 14;
        for (j = 0; j < rnsSegs; j++) {
            var rnsa = (j / rnsSegs) * 2 * Math.PI;
            var rnsx = Math.sin(rnsa) * rnsRadius;
            var rnsz = Math.cos(rnsa) * rnsRadius;
            makeboxrot((2 * Math.PI * rnsRadius / rnsSegs) + 1, 4, 5, 0x4A6A1A, 80 + rnsx, 20, -520 + rnsz, -rnsa);
        }

        // Ráith Laoghaire — southern enclosure ring
        var rlRadius = 36;
        var rlSegs = 12;
        for (j = 0; j < rlSegs; j++) {
            var rla = (j / rlSegs) * 2 * Math.PI;
            var rlx = Math.sin(rla) * rlRadius;
            var rlz = Math.cos(rla) * rlRadius;
            makeboxrot((2 * Math.PI * rlRadius / rlSegs) + 1, 4, 5, 0x4A6A1A, 80 + rlx, 18, -468 + rlz, -rla);
        }

        // Standing stones around summit
        makecyl(0.8, 1.0, 5, 6, 0x808080, 66, 22, -510);
        makecyl(0.7, 0.9, 4, 6, 0x808080, 94, 22, -512);
        makecyl(0.9, 1.1, 6, 6, 0x808080, 72, 22, -490);
        makecyl(0.8, 1.0, 5, 6, 0x707070, 60, 21, -500);

        // Tara's lane — sunken road leading up north approach
        makebox(8, 1, 160, 0x6B8E23, 80, 3, -380);

        // Ferta — small satellite mounds on the hill
        makecyl(8, 10, 3, 12, 0x5C3317, 108, 16, -510);
        makecyl(6, 8, 3, 12, 0x5C3317, 52, 16, -506);
        makecyl(7, 9, 3, 12, 0x5C3317, 96, 15, -475);
    }

    // ── Bective Abbey ─────────────────────────────────────────────────────────
    function buildBectiveAbbey() {
        // Cistercian abbey ruin east of Navan along the Boyne
        // Abbey church nave
        makebox(22, 14, 40, 0x808080, 340, 7, 60);
        // Chancel / east end
        makebox(14, 12, 16, 0x808080, 340, 6, 34);
        // North transept
        makebox(16, 12, 12, 0x808080, 328, 6, 56);
        // Tower over crossing
        makebox(10, 22, 10, 0x777777, 340, 11, 56);
        // Cloister south wall
        makebox(30, 8, 3, 0x808080, 340, 4, 82);
        // Cloister west wall
        makebox(3, 8, 30, 0x808080, 325, 4, 67);
        // Cloister east wall
        makebox(3, 8, 30, 0x808080, 355, 4, 67);
        // Cloister garth (open grass court)
        makebox(28, 1, 28, 0x228B22, 340, 0, 67);
        // Cloister arcade pillars
        makecyl(0.8, 0.8, 7, 6, 0x888888, 330, 3, 74);
        makecyl(0.8, 0.8, 7, 6, 0x888888, 336, 3, 74);
        makecyl(0.8, 0.8, 7, 6, 0x888888, 344, 3, 74);
        makecyl(0.8, 0.8, 7, 6, 0x888888, 350, 3, 74);
        makecyl(0.8, 0.8, 7, 6, 0x888888, 330, 3, 60);
        makecyl(0.8, 0.8, 7, 6, 0x888888, 336, 3, 60);
        makecyl(0.8, 0.8, 7, 6, 0x888888, 344, 3, 60);
        makecyl(0.8, 0.8, 7, 6, 0x888888, 350, 3, 60);
        // Ruined gable wall remnant
        makebox(3, 18, 18, 0x707070, 318, 9, 56);
        // Chapter house
        makebox(16, 8, 14, 0x808080, 356, 4, 56);
    }

    // ── Hedgerows ─────────────────────────────────────────────────────────────
    function buildHedgerows() {
        // Field boundary hedgerows — dark brown earth banks topped with green
        // Hedgerow east of town
        makebox(4, 3, 120, 0x5C3317, 180, 1, -100);
        makebox(4, 2, 120, 0x228B22, 180, 4, -100);
        // Hedgerow north
        makebox(160, 3, 4, 0x5C3317, 100, 1, -160);
        makebox(160, 2, 4, 0x228B22, 100, 4, -160);
        // Hedgerow south
        makebox(200, 3, 4, 0x5C3317, 60, 1, 160);
        makebox(200, 2, 4, 0x228B22, 60, 4, 160);
        // Diagonal field boundary NW
        makeboxrot(4, 3, 100, 0x5C3317, -80, 1, -120, 0.4);
        makeboxrot(4, 2, 100, 0x228B22, -80, 4, -120, 0.4);
        // West boundary
        makebox(4, 3, 160, 0x5C3317, -350, 1, -100);
        makebox(4, 2, 160, 0x228B22, -350, 4, -100);
    }

    // ── Farm Fields ───────────────────────────────────────────────────────────
    function buildFarmFields() {
        // Typical Royal Meath pasture — alternating green patches
        makebox(100, 1, 100, 0x2E8B2E, 220, 0, -200);
        makebox(100, 1, 100, 0x3A9A3A, 340, 0, -200);
        makebox(100, 1, 100, 0x2E8B2E, 220, 0, -320);
        makebox(100, 1, 100, 0x3A9A3A, 340, 0, -320);
        // South pastures
        makebox(120, 1, 80, 0x2E8B2E, 220, 0, 200);
        makebox(120, 1, 80, 0x3A9A3A, 360, 0, 200);
        // West fields near Navan Fort area
        makebox(120, 1, 100, 0x2E8B2E, -400, 0, -100);
        makebox(120, 1, 100, 0x3A9A3A, -400, 0, 20);
        // Small farmhouses (plain cubes)
        makebox(10, 6, 8, 0xCC9966, 240, 3, -230);
        makecone(6, 4, 4, 0x884422, 240, 9, -230);
        makebox(10, 6, 8, 0xCC9966, 360, 3, -340);
        makecone(6, 4, 4, 0x884422, 360, 9, -340);
        makebox(10, 6, 8, 0xCC9966, -420, 3, -130);
        makecone(6, 4, 4, 0x884422, -420, 9, -130);
    }

    function update(delta) {
        // static environment — no per-frame logic needed
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
