window.ClaphamCommon = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function addobj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addobj(mesh);
        return mesh;
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addobj(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addobj(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        addobj(mesh);
        return mesh;
    }

    // 1. Bandstand — 8 columns + 8 roof panels = 16 objects
    function buildbandstand(ox, oz) {
        var i, angle, cx, cz, panel;
        for (i = 0; i < 8; i++) {
            angle = (i / 8) * Math.PI * 2;
            cx = ox + Math.cos(angle) * 6;
            cz = oz + Math.sin(angle) * 6;
            makecyl(0.5, 0.5, 6, 8, 0x2D6A2D, cx, 3, cz);
        }
        for (i = 0; i < 8; i++) {
            angle = (i / 8) * Math.PI * 2 + (Math.PI / 8);
            cx = ox + Math.cos(angle) * 5;
            cz = oz + Math.sin(angle) * 5;
            panel = makebox(4, 0.3, 1.5, 0x2D6A2D, cx, 6.5, cz);
            panel.rotation.y = angle;
        }
    }

    // 2. Park trees — 8 trees × 2 (trunk + canopy) = 16 objects
    function buildtrees(ox, oz) {
        var i, tx, tz;
        var treepos = [
            [10, 5], [-10, 5], [20, 15], [-20, 15],
            [15, -10], [-15, -10], [25, -5], [-25, -5]
        ];
        for (i = 0; i < 8; i++) {
            tx = ox + treepos[i][0];
            tz = oz + treepos[i][1];
            makecyl(0.5, 0.5, 4, 6, 0x5C3A1E, tx, 2, tz);
            makesphere(2.5, 0x2D6A1A, tx, 6, tz);
        }
    }

    // 3. Georgian townhouses — 2 terraces × 3 houses = 6 body + 6 basement = 12 objects
    function buildtownhouses(ox, oz) {
        var terrace, house, tx, tz;
        var terraceoffsets = [
            [60, 20],
            [-60, 20]
        ];
        for (terrace = 0; terrace < 2; terrace++) {
            for (house = 0; house < 3; house++) {
                tx = ox + terraceoffsets[terrace][0] + house * 6;
                tz = oz + terraceoffsets[terrace][1];
                makebox(5, 9, 10, 0xF8F8F0, tx, 4.5, tz);
                makebox(5, 2, 10, 0x333322, tx, -0.5, tz);
            }
        }
    }

    // 4. Clapham Junction station — 1 main building + 4 canopies = 5 objects
    function buildjunction(ox, oz) {
        var i;
        makebox(40, 15, 8, 0x885522, ox - 120, 7.5, oz + 60);
        for (i = 0; i < 4; i++) {
            makebox(30, 5, 4, 0x778888, ox - 120, 17, oz + 50 + i * 8);
        }
    }

    // 5. Church — nave + tower + spire = 3 objects
    function buildchurch(ox, oz) {
        makebox(18, 10, 12, 0xCCBBA8, ox + 80, 5, oz - 40);
        makebox(5, 16, 5, 0xCCBBA8, ox + 76, 8, oz - 40);
        makecone(4, 10, 8, 0xCCBBA8, ox + 76, 21, oz - 40);
    }

    // 6. Tube station — entrance + roundel = 2 objects
    function buildtubestation(ox, oz) {
        makebox(10, 4, 8, 0xDDD8CC, ox - 30, 2, oz - 50);
        makebox(3, 3, 0.5, 0xCC2200, ox - 30, 4.5, oz - 46);
    }

    // 7. Café kiosk — 1 object
    function buildkiosk(ox, oz) {
        makebox(6, 3.5, 4, 0x8B5E3C, ox + 5, 1.75, oz + 10);
    }

    // 8. Football pitches — 2 pitches × 4 corner posts = 8 objects
    function buildfootballpitches(ox, oz) {
        var p, corners, c, cx, cz;
        var pitches = [
            [0, 50],
            [50, 50]
        ];
        for (p = 0; p < 3; p++) {
            corners = [
                [-15, -25],
                [15, -25],
                [15, 25],
                [-15, 25]
            ];
            for (c = 0; c < 4; c++) {
                cx = ox + pitches[p][0] + corners[c][0];
                cz = oz + pitches[p][1] + corners[c][1];
                makebox(0.5, 2, 0.5, 0xFFFFFF, cx, 1, cz);
            }
        }
    }

    // 9. Victorian pub — 1 object
    function buildpub(ox, oz) {
        makebox(12, 7, 10, 0x1A4A1A, ox + 50, 3.5, oz - 30);
    }

    // Total: 16 + 16 + 12 + 5 + 3 + 2 + 1 + 8 + 1 = 64 objects

    function build() {
        var ox = 5720;
        var oz = 0;
        buildbandstand(ox, oz);
        buildtrees(ox, oz);
        buildtownhouses(ox, oz);
        buildjunction(ox, oz);
        buildchurch(ox, oz);
        buildtubestation(ox, oz);
        buildkiosk(ox, oz);
        buildfootballpitches(ox, oz);
        buildpub(ox, oz);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function update(delta) { }

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
