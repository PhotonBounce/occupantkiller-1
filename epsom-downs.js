/* ───────────────────────────────────────────────────────────────────────
   EPSOM DOWNS — Epsom Racecourse, Surrey, home of The Derby since 1780.
   World offset: x = +5960, z = 0
   ─────────────────────────────────────────────────────────────────────── */
window.EpsomDowns = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 5960;
    var OZ = 0;

    /* ── helper: make a mesh, add to scene + objects[] ── */
    function addmesh(geo, color, x, y, z, ry) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        if (ry) mesh.rotation.y = ry;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    /* ── 1. Main grandstand — Victorian red brick + cream tiers ── */
    /* Objects: 4 */
    function buildgrandstand() {
        /* Red brick base: 80 wide x 20 deep x 6 tall */
        addmesh(new THREE.BoxGeometry(80, 6, 20), 0x992222, 0, 3, -30);
        /* Cream upper tier: 80 wide x 16 deep x 9 tall */
        addmesh(new THREE.BoxGeometry(80, 9, 16), 0xF5F0E0, 0, 10.5, -28);
        /* Roof ridge beam */
        addmesh(new THREE.BoxGeometry(80, 1.5, 2), 0x888888, 0, 15.75, -21);
        /* Viewing terrace step band */
        addmesh(new THREE.BoxGeometry(78, 2, 6), 0xCCBB99, 0, 1, -18);
    }

    /* ── 2. Parade ring — octagonal fence (4 sections) + grass centre ── */
    /* Objects: 5 */
    function buildparadering() {
        /* Green grass centre */
        addmesh(new THREE.BoxGeometry(16, 0.3, 16), 0x3A7A2A, 40, 0.15, 20);
        /* 4 fence sections on cardinal sides */
        var fa = Math.PI / 2;
        var fr = 11;
        for (var f = 0; f < 4; f++) {
            var ang = f * fa;
            var fmat = new THREE.MeshLambertMaterial({ color: 0x888855 });
            var fgeo = new THREE.BoxGeometry(10, 1.2, 0.25);
            var fm = new THREE.Mesh(fgeo, fmat);
            fm.position.set(OX + 40 + Math.sin(ang) * fr, 0.6, OZ + 20 + Math.cos(ang) * fr);
            fm.rotation.y = ang;
            scene.add(fm);
            objects.push(fm);
        }
    }

    /* ── 3. Winners' enclosure ── */
    /* Objects: 5 */
    function buildwinnersenclosure() {
        addmesh(new THREE.BoxGeometry(20, 2.0, 0.25), 0xFFFFFF, -50, 1.0, 10);
        addmesh(new THREE.BoxGeometry(0.25, 2.0, 12), 0xFFFFFF, -60, 1.0, 16);
        addmesh(new THREE.BoxGeometry(0.25, 2.0, 12), 0xFFFFFF, -40, 1.0, 16);
        /* Presentation podium steps */
        addmesh(new THREE.BoxGeometry(6, 0.5, 4), 0xE8E0D0, -50, 0.25, 18);
        addmesh(new THREE.BoxGeometry(3, 1.2, 3), 0xC8C0B0, -50, 0.85, 18);
    }

    /* ── 4. Race track rail — 2 long parallel rails + 6 posts ── */
    /* Objects: 8 */
    function buildtrackrail() {
        addmesh(new THREE.BoxGeometry(60, 0.2, 1.5), 0xFFFFFF, 0, 1.0, 5);
        addmesh(new THREE.BoxGeometry(60, 0.2, 1.5), 0xFFFFFF, 0, 1.0, -5);
        var px = [-20, 0, 20];
        for (var p = 0; p < 3; p++) {
            addmesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), 0xDDDDDD, px[p], 0.75, 5);
            addmesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), 0xDDDDDD, px[p], 0.75, -5);
        }
    }

    /* ── 5. Tote building — modern betting hall ── */
    /* Objects: 3 */
    function buildtotebuilding() {
        addmesh(new THREE.BoxGeometry(25, 6, 12), 0x778899, -80, 3, 40);
        addmesh(new THREE.BoxGeometry(27, 0.4, 14), 0x667788, -80, 6.2, 40);
        addmesh(new THREE.BoxGeometry(12, 2, 0.3), 0x334455, -80, 7.5, 33.8);
    }

    /* ── 6. Water tower — cylinder stem + tank + sphere dome ── */
    /* Objects: 3 */
    function buildwatertower() {
        addmesh(new THREE.CylinderGeometry(1, 1.2, 14, 8), 0x999988, 60, 7, -50);
        addmesh(new THREE.CylinderGeometry(4, 4, 6, 10), 0x999988, 60, 17, -50);
        addmesh(new THREE.SphereGeometry(4, 10, 6), 0x999988, 60, 20, -50);
    }

    /* ── 7. Hospital / medical tent ── */
    /* Objects: 6 */
    function buildhospitaltent() {
        addmesh(new THREE.BoxGeometry(10, 0.2, 6), 0xFFFFFF, 80, 0.1, 30);
        addmesh(new THREE.BoxGeometry(10, 3, 0.2), 0xFFFFFF, 80, 1.6, 27);
        addmesh(new THREE.BoxGeometry(10, 3, 0.2), 0xFFFFFF, 80, 1.6, 33);
        addmesh(new THREE.BoxGeometry(0.2, 3, 6), 0xFFFFFF, 75, 1.6, 30);
        addmesh(new THREE.BoxGeometry(0.2, 3, 6), 0xFFFFFF, 85, 1.6, 30);
        addmesh(new THREE.BoxGeometry(10, 1.5, 6), 0xF0F0F0, 80, 4.25, 30);
    }

    /* ── 8. Surrey Downs trees — 6 wind-sculpted ── */
    /* Objects: 12 (trunk + canopy each) */
    function buildtrees() {
        var td = [
            [20, 60, 0.9], [-30, 70, 1.0], [50, 80, 0.85],
            [-60, 55, 1.1], [10, 90, 0.95], [-20, 100, 0.8]
        ];
        for (var t = 0; t < td.length; t++) {
            var tx = td[t][0];
            var tz = td[t][1];
            var sc = td[t][2];
            var trgeo = new THREE.CylinderGeometry(0.25, 0.4, 2.5, 6);
            var trmat = new THREE.MeshLambertMaterial({ color: 0x5A3A1A });
            var trmesh = new THREE.Mesh(trgeo, trmat);
            trmesh.position.set(OX + tx, 1.25, OZ + tz);
            scene.add(trmesh);
            objects.push(trmesh);
            var cgeo = new THREE.SphereGeometry(2, 8, 6);
            var cmat = new THREE.MeshLambertMaterial({ color: 0x4A7A2A });
            var cmesh = new THREE.Mesh(cgeo, cmat);
            cmesh.position.set(OX + tx, 4.0, OZ + tz);
            cmesh.scale.set(sc, 0.7, sc);
            scene.add(cmesh);
            objects.push(cmesh);
        }
    }

    /* ── 9. Car park — 6 car shapes ── */
    /* Objects: 6 */
    function buildcarpark() {
        var cdata = [
            [-100, 50, 0x334466], [-95, 50, 0x773333], [-90, 50, 0x555555],
            [-100, 56, 0x446644], [-95, 56, 0x886633], [-90, 56, 0x444466]
        ];
        for (var c = 0; c < cdata.length; c++) {
            addmesh(new THREE.BoxGeometry(2.2, 1.4, 4.5), cdata[c][2], cdata[c][0], 0.7, cdata[c][1]);
        }
    }

    /* ── 10. Race day hospitality marquees — 4 tents ── */
    /* Objects: 8 (body + ridge roof each) */
    function buildmarquees() {
        var mdata = [
            [20, -60], [38, -60], [20, -75], [38, -75]
        ];
        for (var m = 0; m < mdata.length; m++) {
            var mx = mdata[m][0];
            var mz = mdata[m][1];
            addmesh(new THREE.BoxGeometry(10, 4, 6), 0xF5F0E8, mx, 2, mz);
            addmesh(new THREE.BoxGeometry(10, 1.5, 7), 0xE8E4DC, mx, 4.75, mz);
        }
    }

    /* ── LineSegments boundary outline ── */
    /* Objects: 1 */
    function buildoutline() {
        var pts = new Float32Array([
            -90, 0, -50,   90, 0, -50,
             90, 0, -50,   90, 0, 120,
             90, 0, 120,  -90, 0, 120,
            -90, 0, 120,  -90, 0, -50
        ]);
        var geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(pts, 3));
        var lmat = new THREE.LineBasicMaterial({ color: 0x444433 });
        var lines = new THREE.LineSegments(geom, lmat);
        lines.position.set(OX, 0, OZ);
        scene.add(lines);
        objects.push(lines);
    }

    /* ── Ground slab ── */
    /* Objects: 1 */
    function buildground() {
        addmesh(new THREE.BoxGeometry(220, 0.5, 200), 0x5A8A40, 0, -0.25, 35);
    }

    /* ─────────────────────────────────────────────────────────────── */
    /* Total: 4+5+5+8+3+3+6+12+6+8+1+1 = 62  (within 55-70 target)  */
    /* ─────────────────────────────────────────────────────────────── */

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function build() {
        buildground();
        buildgrandstand();
        buildparadering();
        buildwinnersenclosure();
        buildtrackrail();
        buildtotebuilding();
        buildwatertower();
        buildhospitaltent();
        buildtrees();
        buildcarpark();
        buildmarquees();
        buildoutline();
    }

    function update(delta) {
        /* static environment — no per-frame animation */
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
