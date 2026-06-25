window.LewishamClock = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addobj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makebox(w, h, d, color) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geo, mat);
    }

    function makecyl(rt, rb, h, segs, color) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geo, mat);
    }

    function makesphere(r, ws, hs, color) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geo, mat);
    }

    function makecone(r, h, segs, color) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geo, mat);
    }

    function build() {
        var ox = 5640;
        var oz = 0;
        var m;

        // === 1. Lewisham Clock Tower ===
        // Main tower body 4x16x4
        m = makebox(4, 16, 4, 0x993322);
        m.position.set(ox + 0, 8, oz + 0);
        addobj(m);

        // Clock faces — 4 small white boxes, one per side at top
        m = makebox(2.5, 2.5, 0.3, 0xFFFFFF);
        m.position.set(ox + 0, 15, oz + 2.2);
        addobj(m);

        m = makebox(2.5, 2.5, 0.3, 0xFFFFFF);
        m.position.set(ox + 0, 15, oz - 2.2);
        addobj(m);

        m = makebox(0.3, 2.5, 2.5, 0xFFFFFF);
        m.position.set(ox + 2.2, 15, oz + 0);
        addobj(m);

        m = makebox(0.3, 2.5, 2.5, 0xFFFFFF);
        m.position.set(ox - 2.2, 15, oz + 0);
        addobj(m);

        // Pointed cone cap
        m = makecone(4, 5, 8, 0x661100);
        m.position.set(ox + 0, 18.5, oz + 0);
        addobj(m);

        // === 2. Lewisham Shopping Centre ===
        m = makebox(50, 8, 30, 0xCCAA88);
        m.position.set(ox + 30, 4, oz + 20);
        addobj(m);

        // Roof detail strip
        m = makebox(50, 1, 30, 0xBB9977);
        m.position.set(ox + 30, 8.5, oz + 20);
        addobj(m);

        // Entrance canopy
        m = makebox(12, 3, 4, 0xAA8866);
        m.position.set(ox + 5, 1.5, oz + 5);
        addobj(m);

        // === 3. DLR Elevated Track — viaduct ===
        // 12 supporting legs 2x7x2
        var legPositions = [
            -20, -12, -4, 4, 12, 20, 28, 36, 44, 52, 60, 68
        ];
        for (var i = 0; i < legPositions.length; i++) {
            m = makebox(2, 7, 2, 0x888888);
            m.position.set(ox + legPositions[i], 3.5, oz - 30);
            addobj(m);
        }

        // Track deck 60x1x4
        m = makebox(60, 1, 4, 0x999999);
        m.position.set(ox + 14, 7.5, oz - 30);
        addobj(m);

        // Second rail track section
        m = makebox(30, 1, 4, 0x999999);
        m.position.set(ox + 59, 7.5, oz - 30);
        addobj(m);

        // Rail lines (LineSegments)
        var railGeo1 = new THREE.BoxGeometry(90, 0.2, 0.3);
        var railMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var rail1 = new THREE.Mesh(railGeo1, railMat);
        rail1.position.set(ox + 24, 8.1, oz - 29);
        addobj(rail1);

        var railGeo2 = new THREE.BoxGeometry(90, 0.2, 0.3);
        var rail2 = new THREE.Mesh(railGeo2, railMat);
        rail2.position.set(ox + 24, 8.1, oz - 31);
        addobj(rail2);

        // === 4. DLR Station — open-sided 30x5x8 ===
        // Station main deck
        m = makebox(30, 5, 8, 0x88AABB);
        m.position.set(ox + 0, 10, oz - 30);
        addobj(m);

        // Station roof
        m = makebox(32, 0.5, 10, 0x6699AA);
        m.position.set(ox + 0, 12.75, oz - 30);
        addobj(m);

        // Platform surface
        m = makebox(28, 0.5, 6, 0xCCCCCC);
        m.position.set(ox + 0, 7.75, oz - 30);
        addobj(m);

        // Station pillars
        m = makebox(0.5, 5, 0.5, 0x6688AA);
        m.position.set(ox - 14, 10, oz - 27);
        addobj(m);

        m = makebox(0.5, 5, 0.5, 0x6688AA);
        m.position.set(ox + 14, 10, oz - 27);
        addobj(m);

        m = makebox(0.5, 5, 0.5, 0x6688AA);
        m.position.set(ox - 14, 10, oz - 33);
        addobj(m);

        m = makebox(0.5, 5, 0.5, 0x6688AA);
        m.position.set(ox + 14, 10, oz - 33);
        addobj(m);

        // === 5. Market Stalls — 15 stalls ===
        var stallColors = [
            0xDD5533, 0x3355DD, 0xDD5533, 0x3355DD, 0xDD5533,
            0x3355DD, 0xDD5533, 0x3355DD, 0xDD5533, 0x3355DD,
            0xDD5533, 0x3355DD, 0xDD5533, 0x3355DD, 0xDD5533
        ];
        for (var s = 0; s < 15; s++) {
            var col = stallColors[s];
            var sx = ox - 20 + (s % 5) * 5;
            var sz = oz + 45 + Math.floor(s / 5) * 4;
            // Stall base
            m = makebox(3, 2.5, 2, 0xAA8855);
            m.position.set(sx, 1.25, sz);
            addobj(m);
            // Canopy
            m = makebox(3.5, 0.4, 2.5, col);
            m.position.set(sx, 2.7, sz);
            addobj(m);
        }

        // === 6. 1960s Tesco Block ===
        m = makebox(25, 9, 20, 0x999988);
        m.position.set(ox - 30, 4.5, oz + 15);
        addobj(m);

        // Tesco sign strip
        m = makebox(25, 1.5, 0.5, 0xDD2222);
        m.position.set(ox - 30, 8.25, oz + 5.25);
        addobj(m);

        // === 7. Library — Carnegie-era ===
        m = makebox(12, 6, 10, 0xDDD8B8);
        m.position.set(ox - 20, 3, oz - 10);
        addobj(m);

        // Library pediment
        m = makecone(8, 3, 4, 0xCCCBAA);
        m.position.set(ox - 20, 7.5, oz - 10);
        addobj(m);

        // Library columns (4)
        m = makecyl(0.4, 0.4, 5, 8, 0xEEEEDD);
        m.position.set(ox - 17, 2.5, oz - 5.5);
        addobj(m);

        m = makecyl(0.4, 0.4, 5, 8, 0xEEEEDD);
        m.position.set(ox - 19, 2.5, oz - 5.5);
        addobj(m);

        m = makecyl(0.4, 0.4, 5, 8, 0xEEEEDD);
        m.position.set(ox - 21, 2.5, oz - 5.5);
        addobj(m);

        m = makecyl(0.4, 0.4, 5, 8, 0xEEEEDD);
        m.position.set(ox - 23, 2.5, oz - 5.5);
        addobj(m);

        // === 8. Catford shopping block + fibreglass cat ===
        m = makebox(15, 8, 10, 0xBBBBAA);
        m.position.set(ox + 60, 4, oz + 30);
        addobj(m);

        // Cat pillar on roof
        m = makebox(2, 3, 2, 0xAAAAAA);
        m.position.set(ox + 60, 11.5, oz + 30);
        addobj(m);

        // Famous fibreglass cat sculpture — SphereGeometry as body
        m = makesphere(2, 12, 8, 0x888877);
        m.position.set(ox + 60, 15, oz + 30);
        addobj(m);

        // Cat head
        m = makesphere(1.2, 10, 8, 0x888877);
        m.position.set(ox + 60, 17, oz + 29);
        addobj(m);

        // Cat ears (cones)
        m = makecone(0.5, 1.2, 6, 0x888877);
        m.position.set(ox + 59.3, 18.2, oz + 29);
        addobj(m);

        m = makecone(0.5, 1.2, 6, 0x888877);
        m.position.set(ox + 60.7, 18.2, oz + 29);
        addobj(m);

        // === 9. Brownfield residential towers under construction (3) ===
        var towerOffsets = [
            [ox - 50, oz - 20],
            [ox - 60, oz - 20],
            [ox - 55, oz - 30]
        ];
        for (var t = 0; t < 3; t++) {
            // Tower core
            m = makebox(8, 20, 8, 0xCCCCBB);
            m.position.set(towerOffsets[t][0], 10, towerOffsets[t][1]);
            addobj(m);

            // Scaffolding frame — yellow horizontal bands
            m = makebox(9, 0.4, 9, 0xFFAA00);
            m.position.set(towerOffsets[t][0], 5, towerOffsets[t][1]);
            addobj(m);

            m = makebox(9, 0.4, 9, 0xFFAA00);
            m.position.set(towerOffsets[t][0], 10, towerOffsets[t][1]);
            addobj(m);

            m = makebox(9, 0.4, 9, 0xFFAA00);
            m.position.set(towerOffsets[t][0], 15, towerOffsets[t][1]);
            addobj(m);

            m = makebox(9, 0.4, 9, 0xFFAA00);
            m.position.set(towerOffsets[t][0], 20, towerOffsets[t][1]);
            addobj(m);
        }

        // === Ground plane for Lewisham (using boxes as road/pavement) ===
        // Main road surface
        m = makebox(120, 0.2, 8, 0x555555);
        m.position.set(ox + 10, 0.1, oz + 0);
        addobj(m);

        // Pavement
        m = makebox(120, 0.2, 4, 0x888888);
        m.position.set(ox + 10, 0.1, oz + 6);
        addobj(m);

        m = makebox(120, 0.2, 4, 0x888888);
        m.position.set(ox + 10, 0.1, oz - 6);
        addobj(m);

        // Central pedestrian area
        m = makebox(40, 0.2, 20, 0x999988);
        m.position.set(ox + 5, 0.1, oz + 35);
        addobj(m);
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
