window.TottenhamDepot = (function() {
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

    function addbox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 5440;
        var oz = 0;

        // 1. Rail yard sheds — 6 sheds, 40x8x5, spaced 12 apart, z from -80 to 80
        var shedZPositions = [-80, -56, -32, 0, 32, 56];
        for (var si = 0; si < 6; si++) {
            // Main shed body
            addbox(40, 5, 8, 0x777788, ox + 0, 2.5, oz + shedZPositions[si]);
            // Shed roof ridge (slightly darker)
            addbox(40, 1, 2, 0x666677, ox + 0, 5.5, oz + shedZPositions[si]);
        }

        // 2. Rail maintenance hall — 60x20x10, dark 0x445566, central
        addbox(60, 10, 20, 0x445566, ox + 10, 5, oz + 0);
        // Maintenance hall roof
        addbox(60, 2, 20, 0x334455, ox + 10, 11, oz + 0);

        // 3. Tottenham Hotspur Stadium — 8 BoxGeometry sections, rough oval, 50x40 footprint, 18 tall
        // North stand
        addbox(40, 18, 8, 0x111122, ox + 120, 9, oz - 16);
        // South stand
        addbox(40, 18, 8, 0x111122, ox + 120, 9, oz + 16);
        // East stand
        addbox(8, 16, 24, 0x111122, ox + 141, 8, oz + 0);
        // West stand
        addbox(8, 16, 24, 0x111122, ox + 99, 8, oz + 0);
        // NE corner
        addbox(10, 14, 10, 0x111122, ox + 138, 7, oz - 13);
        // NW corner
        addbox(10, 14, 10, 0x111122, ox + 102, 7, oz - 13);
        // SE corner
        addbox(10, 14, 10, 0x111122, ox + 138, 7, oz + 13);
        // SW corner
        addbox(10, 14, 10, 0x111122, ox + 102, 7, oz + 13);

        // 4. Alexandra Palace — on a raised hill to the west, raised on 8 hill boxes
        // Hill base layers (raised hill)
        addbox(60, 4, 50, 0x556644, ox - 120, 2, oz - 40);
        addbox(50, 4, 40, 0x667755, ox - 120, 6, oz - 40);
        addbox(42, 3, 32, 0x778866, ox - 120, 9, oz - 40);
        addbox(36, 3, 26, 0x889977, ox - 120, 12, oz - 40);
        addbox(32, 2, 22, 0x99AA88, ox - 120, 14.5, oz - 40);
        addbox(30, 2, 20, 0xAABB99, ox - 120, 16.5, oz - 40);
        addbox(28, 1, 18, 0xBBCCAA, ox - 120, 17.5, oz - 40);
        addbox(26, 1, 16, 0xCCDDBB, ox - 120, 18.5, oz - 40);
        // Palace facade
        addbox(30, 8, 10, 0xF5F5DC, ox - 120, 23, oz - 40);
        // Palace wings
        addbox(8, 5, 8, 0xF5F5DC, ox - 133, 21.5, oz - 40);
        addbox(8, 5, 8, 0xF5F5DC, ox - 107, 21.5, oz - 40);
        // Palace roof
        addbox(30, 2, 10, 0xE8E8CC, ox - 120, 28, oz - 40);
        // TV transmitter tower — CylinderGeometry 2r x 24 tall
        addcylinder(1, 1, 24, 8, 0x999999, ox - 120, 39, oz - 40);
        // Transmitter top
        addcylinder(0.3, 0.3, 6, 6, 0xCCCCCC, ox - 120, 54, oz - 40);

        // 5. Industrial warehouses — 8 units, 20x12x7, rust red 0x8B4513
        var whPositions = [
            [ox + 60, oz + 60],
            [ox + 85, oz + 60],
            [ox + 60, oz + 85],
            [ox + 85, oz + 85],
            [ox + 60, oz - 60],
            [ox + 85, oz - 60],
            [ox + 60, oz - 85],
            [ox + 85, oz - 85]
        ];
        for (var wi = 0; wi < 8; wi++) {
            addbox(20, 7, 12, 0x8B4513, whPositions[wi][0], 3.5, whPositions[wi][1]);
            // Warehouse roof
            addbox(20, 1.5, 12, 0x7A3B0F, whPositions[wi][0], 7.75, whPositions[wi][1]);
        }

        // 6. Water tower — CylinderGeometry 4r x 16 tall with sphere cap, 0x8B8B8B
        addcylinder(0.6, 0.6, 12, 8, 0x8B8B8B, ox + 50, 6, oz - 110);
        addcylinder(4, 4, 8, 12, 0x8B8B8B, ox + 50, 16, oz - 110);
        addsphere(4.2, 12, 8, 0x999999, ox + 50, 20.5, oz - 110);

        // 7. Rail signal gantries — 5 of them, inverted T, spread along rail yard
        var gantryXPositions = [-30, -15, 0, 15, 30];
        for (var gi = 0; gi < 5; gi++) {
            // Vertical post
            addbox(1, 8, 1, 0x333333, ox + gantryXPositions[gi], 4, oz + 95);
            // Horizontal cross-bar
            addbox(14, 1, 1, 0x333333, ox + gantryXPositions[gi], 8, oz + 95);
        }

        // Extra detail: Ground base platform for rail yard
        addbox(100, 0.5, 200, 0x555555, ox + 0, 0, oz + 0);

        // Perimeter fence posts along rail yard
        for (var fi = 0; fi < 5; fi++) {
            addbox(0.5, 3, 0.5, 0x444444, ox - 22 + fi * 10, 1.5, oz + 100);
            addbox(0.5, 3, 0.5, 0x444444, ox - 22 + fi * 10, 1.5, oz - 100);
        }

        // Station platform — Tottenham Hale area
        addbox(40, 1, 6, 0x888888, ox - 40, 0.5, oz + 0);
        addbox(40, 2, 1, 0x999999, ox - 40, 1, oz + 3);

        // Station building
        addbox(12, 5, 8, 0x996644, ox - 55, 2.5, oz + 0);
        addbox(12, 1, 8, 0x885533, ox - 55, 5.5, oz + 0);

        // Substation box
        addbox(8, 4, 6, 0x445533, ox + 45, 2, oz + 110);

        // Rail trackbed markers (flat boxes as track beds)
        for (var ti = 0; ti < 3; ti++) {
            addbox(100, 0.3, 2, 0x4A3728, ox - 10, 0.15, oz - 8 + ti * 8);
        }
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
