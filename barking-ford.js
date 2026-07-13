window.BarkingFord = (function() {
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

    function addbox(gx, gy, gz, px, py, pz, color) {
        var geo = new THREE.BoxGeometry(gx, gy, gz);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, px, py, pz, color) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, px, py, pz, color) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, px, py, pz, color) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(px, py, pz);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 5560;
        var oz = 0;

        // 1. Main factory sheds — 5 huge parallel buildings 80x20x8
        // Corrugated steel 0x667777
        // Each shed is separated by 25 units along Z
        var shedcolor = 0x667777;
        var roofcolor = 0x556666;
        var shedcount = 5;
        var i, j, sx, sz, rx, rz;

        for (i = 0; i < shedcount; i++) {
            sz = oz + (i * 25) - 50;
            sx = ox + 0;
            // Main shed body
            addbox(80, 8, 20, sx, 4, sz, shedcolor);
            // Saw-tooth roof: alternating-height boxes along the top
            // 8 segments along the 80-unit length
            for (j = 0; j < 8; j++) {
                rx = sx - 35 + (j * 10);
                rz = sz;
                var rh = (j % 2 === 0) ? 3 : 5;
                addbox(10, rh, 20, rx, 8 + rh / 2, rz, roofcolor);
            }
        }

        // 2. River jetty/dock — 3x60x1 wooden dock, 6 bollard cylinders
        var dockcolor = 0x8B6914;
        var dockx = ox + 60;
        var dockz = oz - 10;
        addbox(3, 1, 60, dockx, 0.5, dockz, dockcolor);
        // 6 bollards along the pier
        for (i = 0; i < 6; i++) {
            addcylinder(0.4, 0.4, 2, dockx + 1.5, 1.5, dockz - 25 + (i * 10), 0x5A4010);
        }

        // 3. Stamping plant — 35x25x12 dark industrial 0x445544
        addbox(35, 12, 25, ox - 60, 6, oz + 20, 0x445544);
        // Add a few rooftop ventilation boxes
        addbox(6, 3, 6, ox - 60, 13.5, oz + 15, 0x334433);
        addbox(6, 3, 6, ox - 55, 13.5, oz + 25, 0x334433);

        // 4. Power station chimney stacks — 4 tall CylinderGeometry 3r x 30 tall, brick 0x884422
        var chimneycolor = 0x884422;
        var chimneypositions = [
            [ox - 80, oz - 20],
            [ox - 88, oz - 20],
            [ox - 80, oz - 28],
            [ox - 88, oz - 28]
        ];
        for (i = 0; i < 4; i++) {
            addcylinder(3, 3, 30, chimneypositions[i][0], 15, chimneypositions[i][1], chimneycolor);
            // Chimney cap ring
            addcylinder(3.3, 3.3, 1, chimneypositions[i][0], 30.5, chimneypositions[i][1], 0x663311);
        }

        // 5. Barking Creek flood barrier — 3 gate structures across creek
        // Each gate = 2 pillar boxes 4x2x10 + crossbar 14x2x2, steel 0x556677
        var gatecolor = 0x556677;
        for (i = 0; i < 3; i++) {
            var gx = ox + 40 + (i * 18);
            var gz = oz + 70;
            // Left pillar
            addbox(4, 10, 2, gx - 7, 5, gz, gatecolor);
            // Right pillar
            addbox(4, 10, 2, gx + 7, 5, gz, gatecolor);
            // Crossbar
            addbox(14, 2, 2, gx, 10, gz, gatecolor);
        }

        // 6. Railway sidings — 8 parallel box rails (thin 40x1x0.5), 0x333333
        var railcolor = 0x333333;
        for (i = 0; i < 8; i++) {
            addbox(40, 1, 0.5, ox - 20, 0.25, oz - 80 + (i * 3), railcolor);
        }

        // 7. Worker housing estate — 3 blocks of council flats 15x10x18, postwar concrete 0x999988
        var flatcolor = 0x999988;
        var windowcolor = 0x778899;
        for (i = 0; i < 3; i++) {
            var bx = ox + (i * 22) - 22;
            var bz = oz - 100;
            addbox(15, 18, 10, bx, 9, bz, flatcolor);
            // Windows on each block (small boxes inset slightly)
            addbox(2, 2, 0.3, bx - 4, 12, bz + 5, windowcolor);
            addbox(2, 2, 0.3, bx + 4, 12, bz + 5, windowcolor);
            addbox(2, 2, 0.3, bx - 4, 6, bz + 5, windowcolor);
            addbox(2, 2, 0.3, bx + 4, 6, bz + 5, windowcolor);
        }

        // 8. Abbey ruins — Barking Abbey fragment: 2 partial walls 15x2x8, ancient stone 0xBBBBAA
        var abbeycolor = 0xBBBBAA;
        var abbeyox = ox - 30;
        var abbeyoz = oz - 130;
        // Wall 1 — solid
        addbox(15, 8, 2, abbeyox, 4, abbeyoz, abbeycolor);
        // Wall 2 — with arch gap approximated by 3 boxes (left block, right block, top lintel)
        addbox(5, 8, 2, abbeyox + 30, 4, abbeyoz, abbeycolor);
        // Left arch pier
        addbox(3, 8, 2, abbeyox + 19, 4, abbeyoz, abbeycolor);
        // Right arch pier
        addbox(3, 8, 2, abbeyox + 37, 4, abbeyoz, abbeycolor);
        // Lintel over arch gap
        addbox(8, 2, 2, abbeyox + 28, 8, abbeyoz, abbeycolor);
        // A ruined corner stub
        addbox(2, 5, 2, abbeyox, 2.5, abbeyoz - 10, abbeycolor);

        // Extra scene dressing to reach target object count
        // Fuel storage tanks near power station
        addsphere(4, ox - 100, 4, oz - 10, 0x445566);
        addsphere(4, ox - 110, 4, oz - 10, 0x445566);
        // Loading crane arm approximated with boxes
        addbox(1, 20, 1, ox + 55, 10, oz + 5, 0x667788);
        addbox(14, 1, 1, ox + 55, 20, oz + 5, 0x667788);
        // Security gatehouse
        addbox(5, 4, 5, ox - 45, 2, oz - 5, 0x888877);
        // Roof of gatehouse
        addcone(4, 3, ox - 45, 5.5, oz - 5, 0x777766);
        // Scrap metal heap approximation
        addbox(10, 3, 8, ox - 70, 1.5, oz + 50, 0x556655);
        addbox(6, 2, 5, ox - 68, 4, oz + 50, 0x667766);
        // Car transporter trailer bodies
        addbox(20, 2, 5, ox + 10, 1, oz + 55, 0x888888);
        addbox(20, 2, 5, ox + 10, 4, oz + 55, 0x888888);
        // Factory water tower
        addcylinder(4, 4, 8, ox - 50, 10, oz + 45, 0x888899);
        addcylinder(0.5, 0.5, 6, ox - 47, 3, oz + 45, 0x777788);
        addcylinder(0.5, 0.5, 6, ox - 53, 3, oz + 45, 0x777788);
        addcylinder(0.5, 0.5, 6, ox - 50, 3, oz + 48, 0x777788);
        addcylinder(0.5, 0.5, 6, ox - 50, 3, oz + 42, 0x777788);
        // Boundary fence posts
        for (i = 0; i < 5; i++) {
            addcylinder(0.2, 0.2, 3, ox - 100 + (i * 10), 1.5, oz + 80, 0x666655);
        }
        // Fence rails between posts
        for (i = 0; i < 4; i++) {
            addbox(10, 0.2, 0.2, ox - 95 + (i * 10), 2.5, oz + 80, 0x666655);
        }
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
