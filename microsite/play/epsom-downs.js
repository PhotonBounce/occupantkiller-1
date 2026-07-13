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
    function addmesh(geo, color, x, y, z, rx, ry, rz, sx, sy, sz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        if (sx !== undefined) mesh.scale.set(sx, sy, sz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    /* ── 1. Main grandstand ── */
    function buildgrandstand() {
        /* Red brick base: 80 wide x 20 deep x 6 tall */
        addmesh(new THREE.BoxGeometry(80, 6, 20), 0x992222, 0, 3, -30);

        /* Cream upper tier: 80 wide x 16 deep x 9 tall */
        addmesh(new THREE.BoxGeometry(80, 9, 16), 0xF5F0E0, 0, 10.5, -28);

        /* Roof ridge: 80 wide x 2 deep x 1.5 tall */
        addmesh(new THREE.BoxGeometry(80, 1.5, 2), 0x888888, 0, 15.75, -21);

        /* 5 arched viewing bay pillars across front — BoxGeometry approximation */
        var bayOffsets = [-32, -16, 0, 16, 32];
        for (var i = 0; i < bayOffsets.length; i++) {
            /* Left pier */
            addmesh(new THREE.BoxGeometry(1.5, 9, 1.5), 0xE0D8C0, bayOffsets[i] - 5, 10.5, -20.5);
            /* Right pier */
            addmesh(new THREE.BoxGeometry(1.5, 9, 1.5), 0xE0D8C0, bayOffsets[i] + 5, 10.5, -20.5);
            /* Arch lintel */
            addmesh(new THREE.BoxGeometry(10, 1.5, 1.5), 0xD0C8B0, bayOffsets[i], 15, -20.5);
        }

        /* Viewing terrace steps — 3 tiers */
        addmesh(new THREE.BoxGeometry(78, 1, 4), 0xCCBB99, 0, 7.5, -22);
        addmesh(new THREE.BoxGeometry(78, 1, 4), 0xCCBB99, 0, 5.5, -18);
        addmesh(new THREE.BoxGeometry(78, 1, 4), 0xCCBB99, 0, 3.5, -14);
    }

    /* ── 2. Parade ring — octagonal fence, grass centre ── */
    function buildparadering() {
        /* Green grass centre 16x0.3x16 */
        addmesh(new THREE.BoxGeometry(16, 0.3, 16), 0x3A7A2A, 40, 0.15, 20);

        /* 8 fence sections forming octagon approximation */
        var fenceAngle = Math.PI / 4;
        var fenceR = 11;
        for (var f = 0; f < 8; f++) {
            var angle = f * fenceAngle;
            var fx = OX + 40 + Math.sin(angle) * fenceR;
            var fz = OZ + 20 + Math.cos(angle) * fenceR;
            var mat = new THREE.MeshLambertMaterial({ color: 0x888855 });
            var geo = new THREE.BoxGeometry(7.5, 1.2, 0.2);
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(fx, 0.6, fz);
            mesh.rotation.y = angle;
            scene.add(mesh);
            objects.push(mesh);
        }
    }

    /* ── 3. Winners' enclosure ── */
    function buildwinnersenclosure() {
        /* Three rail fence sides: front, left, right */
        /* Front rail */
        addmesh(new THREE.BoxGeometry(20, 1.2, 0.2), 0xFFFFFF, -50, 0.6, 10);
        /* Left rail */
        addmesh(new THREE.BoxGeometry(0.2, 1.2, 12), 0xFFFFFF, -60, 0.6, 16);
        /* Right rail */
        addmesh(new THREE.BoxGeometry(0.2, 1.2, 12), 0xFFFFFF, -40, 0.6, 16);

        /* Second rail tier — 0.8m higher */
        addmesh(new THREE.BoxGeometry(20, 1.2, 0.2), 0xFFFFFF, -50, 1.8, 10);
        addmesh(new THREE.BoxGeometry(0.2, 1.2, 12), 0xFFFFFF, -60, 1.8, 16);
        addmesh(new THREE.BoxGeometry(0.2, 1.2, 12), 0xFFFFFF, -40, 1.8, 16);

        /* Presentation podium — 3 steps */
        addmesh(new THREE.BoxGeometry(6, 0.5, 4), 0xE8E0D0, -50, 0.25, 18);
        addmesh(new THREE.BoxGeometry(4, 1.0, 4), 0xD8D0C0, -50, 0.75, 18);
        addmesh(new THREE.BoxGeometry(2, 1.5, 4), 0xC8C0B0, -50, 1.25, 18);
    }

    /* ── 4. Race track rail — 2 parallel fence lines ── */
    function buildtrackrail() {
        /* White track rails, thin boxes 60x0.2x1.5 */
        /* Inner rail */
        addmesh(new THREE.BoxGeometry(60, 0.2, 1.5), 0xFFFFFF, 0, 1.0, 5);
        /* Outer rail */
        addmesh(new THREE.BoxGeometry(60, 0.2, 1.5), 0xFFFFFF, 0, 1.0, -5);

        /* Rail posts every 10 units along inner */
        for (var i = -25; i <= 25; i += 10) {
            addmesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), 0xFFFFFF, i, 0.75, 5);
            addmesh(new THREE.BoxGeometry(0.3, 1.5, 0.3), 0xFFFFFF, i, 0.75, -5);
        }
    }

    /* ── 5. Tote building — modern betting hall ── */
    function buildtotebuilding() {
        /* Main hall 25x6x12 */
        addmesh(new THREE.BoxGeometry(25, 6, 12), 0x778899, -80, 3, 40);
        /* Roof overhang */
        addmesh(new THREE.BoxGeometry(27, 0.4, 14), 0x667788, -80, 6.2, 40);
        /* Entrance canopy */
        addmesh(new THREE.BoxGeometry(8, 0.4, 4), 0x5A6A7A, -80, 4, 34);
        /* Signage board */
        addmesh(new THREE.BoxGeometry(12, 2, 0.3), 0x334455, -80, 7.5, 33.8);
    }

    /* ── 6. Water tower ── */
    function buildwatertower() {
        /* Stem */
        addmesh(new THREE.CylinderGeometry(1, 1, 14, 8), 0x999988, 60, 7, -50);
        /* Tank body */
        addmesh(new THREE.CylinderGeometry(4, 4, 6, 12), 0x999988, 60, 17, -50);
        /* Dome cap */
        addmesh(new THREE.SphereGeometry(4, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5), 0x999988, 60, 20, -50);
        /* Legs — 4 supports */
        var legpos = [[3, 3], [-3, 3], [3, -3], [-3, -3]];
        for (var l = 0; l < legpos.length; l++) {
            var lgeo = new THREE.CylinderGeometry(0.25, 0.35, 8, 6);
            var lmat = new THREE.MeshLambertMaterial({ color: 0x888877 });
            var lmesh = new THREE.Mesh(lgeo, lmat);
            lmesh.position.set(OX + 60 + legpos[l][0], 4, OZ - 50 + legpos[l][1]);
            scene.add(lmesh);
            objects.push(lmesh);
        }
    }

    /* ── 7. Hospital / medical tent ── */
    function buildhospitaltent() {
        /* 3 box sections forming tent floor */
        addmesh(new THREE.BoxGeometry(10, 0.2, 6), 0xFFFFFF, 80, 0.1, 30);
        /* Wall sections */
        addmesh(new THREE.BoxGeometry(10, 3, 0.2), 0xFFFFFF, 80, 1.5, 27);
        addmesh(new THREE.BoxGeometry(10, 3, 0.2), 0xFFFFFF, 80, 1.5, 33);
        addmesh(new THREE.BoxGeometry(0.2, 3, 6), 0xFFFFFF, 75, 1.5, 30);
        addmesh(new THREE.BoxGeometry(0.2, 3, 6), 0xFFFFFF, 85, 1.5, 30);
        /* Raised roof ridge box */
        addmesh(new THREE.BoxGeometry(10, 0.4, 0.4), 0xEEEEEE, 80, 4.0, 30);
        /* Roof slopes: two slanted boxes */
        addmesh(new THREE.BoxGeometry(10, 0.2, 3.6), 0xFFFFFF, 80, 3.25, 28.2, -0.45, 0, 0);
        addmesh(new THREE.BoxGeometry(10, 0.2, 3.6), 0xFFFFFF, 80, 3.25, 31.8, 0.45, 0, 0);
    }

    /* ── 8. Surrey Downs trees — 15 wind-sculpted ── */
    function buildtrees() {
        var treedata = [
            [20, 60], [-30, 70], [50, 80], [-60, 55], [10, 90],
            [-20, 100], [40, 65], [-50, 90], [70, 75], [-10, 50],
            [30, 110], [-40, 45], [60, 95], [-70, 65], [15, 75]
        ];
        for (var t = 0; t < treedata.length; t++) {
            var tx = treedata[t][0];
            var tz = treedata[t][1];
            /* Trunk */
            var trgeo = new THREE.CylinderGeometry(0.25, 0.4, 2.5, 6);
            var trmat = new THREE.MeshLambertMaterial({ color: 0x5A3A1A });
            var trmesh = new THREE.Mesh(trgeo, trmat);
            trmesh.position.set(OX + tx, 1.25, OZ + tz);
            scene.add(trmesh);
            objects.push(trmesh);
            /* Canopy sphere, slightly flattened */
            var cgeo = new THREE.SphereGeometry(2, 8, 6);
            var cmat = new THREE.MeshLambertMaterial({ color: 0x4A7A2A });
            var cmesh = new THREE.Mesh(cgeo, cmat);
            cmesh.position.set(OX + tx + (t % 3 - 1) * 0.4, 4.0, OZ + tz);
            cmesh.scale.set(1.0, 0.7, 1.0);
            scene.add(cmesh);
            objects.push(cmesh);
        }
    }

    /* ── 9. Car park — 4 rows x 3 cars, 12 total ── */
    function buildcarpark() {
        var carcolors = [0x334466, 0x773333, 0x555555, 0x446644, 0x886633, 0x444466,
                         0x663344, 0x336655, 0x776644, 0x445566, 0x664433, 0x556644];
        var carindex = 0;
        for (var row = 0; row < 4; row++) {
            for (var col = 0; col < 3; col++) {
                if (carindex >= 12) break;
                var cx = -100 + col * 4;
                var cz = 50 + row * 5;
                addmesh(new THREE.BoxGeometry(2, 1.2, 4), carcolors[carindex], cx, 0.6, cz);
                /* Cabin roof */
                addmesh(new THREE.BoxGeometry(1.6, 0.6, 2.4), carcolors[carindex], cx, 1.5, cz);
                carindex++;
            }
        }
    }

    /* ── 10. Race day hospitality marquees — 6 tents ── */
    function buildmarquees() {
        var marqueepos = [
            [20, -60], [38, -60], [56, -60],
            [20, -75], [38, -75], [56, -75]
        ];
        for (var m = 0; m < marqueepos.length; m++) {
            var mx = marqueepos[m][0];
            var mz = marqueepos[m][1];
            /* Main body 10x4x6 */
            addmesh(new THREE.BoxGeometry(10, 4, 6), 0xF5F0E8, mx, 2, mz);
            /* Tent ridge: narrow box along top */
            addmesh(new THREE.BoxGeometry(10, 0.5, 0.4), 0xE0D8D0, mx, 4.25, mz);
            /* Two roof slope panels */
            addmesh(new THREE.BoxGeometry(10, 0.2, 3.4), 0xF8F4EE, mx, 4.0, mz - 1.7, -0.35, 0, 0);
            addmesh(new THREE.BoxGeometry(10, 0.2, 3.4), 0xF8F4EE, mx, 4.0, mz + 1.7, 0.35, 0, 0);
        }
    }

    /* ── LineSegments bounding box outline for orientation ── */
    function buildoutline() {
        var pts = [
            /* Ground rectangle perimeter */
            -90, 0, -50,   90, 0, -50,
             90, 0, -50,   90, 0, 120,
             90, 0, 120,  -90, 0, 120,
            -90, 0, 120,  -90, 0, -50
        ];
        var buf = new Float32Array(pts.length);
        for (var i = 0; i < pts.length; i++) buf[i] = pts[i];
        var geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.BufferAttribute(buf, 3));
        var lmat = new THREE.LineBasicMaterial({ color: 0x444433 });
        var lines = new THREE.LineSegments(geom, lmat);
        lines.position.set(OX, 0, OZ);
        scene.add(lines);
        objects.push(lines);
    }

    /* ── Flat ground slab for the whole area ── */
    function buildground() {
        addmesh(new THREE.BoxGeometry(220, 0.5, 200), 0x5A8A40, 0, -0.25, 35);
    }

    /* ── init / build / update / reset ── */
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
        /* static scene — no per-frame animation needed */
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
