window.PlymouthBarbican = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14160;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addObj(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildBarbican() {
        var i, mesh, geo;

        // Harbour cobbled ground
        geo = new THREE.BoxGeometry(120, 1, 80);
        mesh = makeMesh(geo, 0x8B7355);
        mesh.position.set(X_OFFSET + 0, 0, 0);
        addObj(mesh);

        // Harbour wall - north side
        geo = new THREE.BoxGeometry(130, 5, 4);
        mesh = makeMesh(geo, 0x888888);
        mesh.position.set(X_OFFSET + 0, 2.5, -42);
        addObj(mesh);

        // Harbour wall - east side
        geo = new THREE.BoxGeometry(4, 5, 84);
        mesh = makeMesh(geo, 0x888888);
        mesh.position.set(X_OFFSET + 62, 2.5, 0);
        addObj(mesh);

        // Elizabethan merchant houses - row of buildings
        var houseColors = [0xCC8844, 0xBB7733, 0xDD9955, 0xC87830, 0xAA6622];
        var houseWidths = [10, 12, 9, 11, 10];
        var houseHeights = [14, 18, 12, 16, 14];
        var houseX = X_OFFSET - 50;
        for (i = 0; i < 5; i++) {
            // Main body
            geo = new THREE.BoxGeometry(houseWidths[i], houseHeights[i], 12);
            mesh = makeMesh(geo, houseColors[i]);
            mesh.position.set(houseX, houseHeights[i] / 2, -30);
            addObj(mesh);
            // Roof
            geo = new THREE.BoxGeometry(houseWidths[i] + 1, 2, 13);
            mesh = makeMesh(geo, 0x5C3317);
            mesh.position.set(houseX, houseHeights[i] + 1, -30);
            addObj(mesh);
            // Chimney
            geo = new THREE.BoxGeometry(2, 4, 2);
            mesh = makeMesh(geo, 0x777777);
            mesh.position.set(houseX + 2, houseHeights[i] + 4, -30);
            addObj(mesh);
            houseX += houseWidths[i] + 2;
        }

        // Second row of houses
        houseX = X_OFFSET - 48;
        for (i = 0; i < 4; i++) {
            geo = new THREE.BoxGeometry(12, 15, 10);
            mesh = makeMesh(geo, houseColors[(i + 2) % 5]);
            mesh.position.set(houseX, 7.5, -48);
            addObj(mesh);
            geo = new THREE.BoxGeometry(13, 2, 11);
            mesh = makeMesh(geo, 0x5C3317);
            mesh.position.set(houseX, 16, -48);
            addObj(mesh);
            houseX += 15;
        }

        // Fish market building
        geo = new THREE.BoxGeometry(40, 6, 18);
        mesh = makeMesh(geo, 0xCCCCBB);
        mesh.position.set(X_OFFSET + 30, 3, -20);
        addObj(mesh);
        geo = new THREE.BoxGeometry(42, 2, 20);
        mesh = makeMesh(geo, 0xAA9988);
        mesh.position.set(X_OFFSET + 30, 7, -20);
        addObj(mesh);

        // Jetty 1
        geo = new THREE.BoxGeometry(6, 1, 30);
        mesh = makeMesh(geo, 0x8B6914);
        mesh.position.set(X_OFFSET - 20, 0.5, 20);
        addObj(mesh);

        // Jetty 2
        geo = new THREE.BoxGeometry(6, 1, 30);
        mesh = makeMesh(geo, 0x8B6914);
        mesh.position.set(X_OFFSET + 10, 0.5, 20);
        addObj(mesh);

        // Jetty 3
        geo = new THREE.BoxGeometry(6, 1, 30);
        mesh = makeMesh(geo, 0x8B6914);
        mesh.position.set(X_OFFSET + 40, 0.5, 20);
        addObj(mesh);

        // Fishing boats moored
        var boatPositions = [
            [X_OFFSET - 20, 10], [X_OFFSET + 10, 15], [X_OFFSET + 40, 12],
            [X_OFFSET - 10, 25], [X_OFFSET + 25, 28]
        ];
        for (i = 0; i < boatPositions.length; i++) {
            // Hull
            geo = new THREE.BoxGeometry(8, 2, 3);
            mesh = makeMesh(geo, 0x4444AA);
            mesh.position.set(boatPositions[i][0], 1, boatPositions[i][1]);
            addObj(mesh);
            // Cabin
            geo = new THREE.BoxGeometry(3, 2, 2.5);
            mesh = makeMesh(geo, 0xCCCCCC);
            mesh.position.set(boatPositions[i][0] - 1, 3, boatPositions[i][1]);
            addObj(mesh);
            // Mast
            geo = new THREE.CylinderGeometry(0.1, 0.1, 8, 4);
            mesh = makeMesh(geo, 0x8B6914);
            mesh.position.set(boatPositions[i][0] + 2, 6, boatPositions[i][1]);
            addObj(mesh);
        }
    }

    function buildMayflowerSteps() {
        var geo, mesh;

        // Flagstone plaza
        geo = new THREE.BoxGeometry(30, 0.5, 20);
        mesh = makeMesh(geo, 0xBBBBBB);
        mesh.position.set(X_OFFSET + 80, 0.25, 0);
        addObj(mesh);

        // Arch left pillar
        geo = new THREE.BoxGeometry(3, 10, 3);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(X_OFFSET + 76, 5, 0);
        addObj(mesh);

        // Arch right pillar
        geo = new THREE.BoxGeometry(3, 10, 3);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(X_OFFSET + 84, 5, 0);
        addObj(mesh);

        // Arch top lintel
        geo = new THREE.BoxGeometry(12, 2, 3);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(X_OFFSET + 80, 10.5, 0);
        addObj(mesh);

        // Arch pediment
        geo = new THREE.BoxGeometry(14, 1, 4);
        mesh = makeMesh(geo, 0xDDDDDD);
        mesh.position.set(X_OFFSET + 80, 12, 0);
        addObj(mesh);

        // Memorial plaques (box slabs on ground)
        var plaqueX = X_OFFSET + 73;
        var plaqueZ = -5;
        var p;
        for (p = 0; p < 4; p++) {
            geo = new THREE.BoxGeometry(3, 0.3, 2);
            mesh = makeMesh(geo, 0x888888);
            mesh.position.set(plaqueX, 0.65, plaqueZ + p * 3);
            addObj(mesh);
        }

        // Steps down to water
        geo = new THREE.BoxGeometry(12, 1, 3);
        mesh = makeMesh(geo, 0xAAAAAA);
        mesh.position.set(X_OFFSET + 80, 0.5, 8);
        addObj(mesh);
        geo = new THREE.BoxGeometry(12, 1, 3);
        mesh = makeMesh(geo, 0xAAAAAA);
        mesh.position.set(X_OFFSET + 80, -0.5, 11);
        addObj(mesh);
        geo = new THREE.BoxGeometry(12, 1, 3);
        mesh = makeMesh(geo, 0xAAAAAA);
        mesh.position.set(X_OFFSET + 80, -1.5, 14);
        addObj(mesh);

        // Flagpole
        geo = new THREE.CylinderGeometry(0.15, 0.15, 14, 6);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(X_OFFSET + 95, 7, 0);
        addObj(mesh);

        // Flag
        geo = new THREE.BoxGeometry(4, 2.5, 0.1);
        mesh = makeMesh(geo, 0xCC0000);
        mesh.position.set(X_OFFSET + 97, 13, 0);
        addObj(mesh);
    }

    function buildPlymouthHoe() {
        var geo, mesh, i;

        // Hoe promenade flat ground
        geo = new THREE.BoxGeometry(160, 0.5, 60);
        mesh = makeMesh(geo, 0x88AA66);
        mesh.position.set(X_OFFSET + 80, 8, -80);
        addObj(mesh);

        // Paved path along front
        geo = new THREE.BoxGeometry(160, 0.6, 8);
        mesh = makeMesh(geo, 0xCCCCBB);
        mesh.position.set(X_OFFSET + 80, 8.3, -52);
        addObj(mesh);

        // Naval War Memorial column
        geo = new THREE.CylinderGeometry(1, 1.5, 30, 8);
        mesh = makeMesh(geo, 0xDDDDDD);
        mesh.position.set(X_OFFSET + 60, 23, -80);
        addObj(mesh);

        // Memorial column base
        geo = new THREE.BoxGeometry(8, 3, 8);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(X_OFFSET + 60, 9.5, -80);
        addObj(mesh);

        // Sphere on top of column
        geo = new THREE.SphereGeometry(2, 8, 6);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(X_OFFSET + 60, 39, -80);
        addObj(mesh);

        // Armada Memorial - obelisk
        geo = new THREE.BoxGeometry(3, 2, 3);
        mesh = makeMesh(geo, 0x999999);
        mesh.position.set(X_OFFSET + 100, 9, -80);
        addObj(mesh);
        geo = new THREE.BoxGeometry(2, 20, 2);
        mesh = makeMesh(geo, 0xAAAAAA);
        mesh.position.set(X_OFFSET + 100, 19, -80);
        addObj(mesh);
        geo = new THREE.ConeGeometry(1.5, 4, 4);
        mesh = makeMesh(geo, 0x888888);
        mesh.position.set(X_OFFSET + 100, 31, -80);
        addObj(mesh);

        // Benches along promenade
        var benchPositions = [
            X_OFFSET + 20, X_OFFSET + 40, X_OFFSET + 70, X_OFFSET + 90, X_OFFSET + 120, X_OFFSET + 140
        ];
        for (i = 0; i < benchPositions.length; i++) {
            // Bench seat
            geo = new THREE.BoxGeometry(3, 0.3, 1);
            mesh = makeMesh(geo, 0x8B6914);
            mesh.position.set(benchPositions[i], 8.9, -55);
            addObj(mesh);
            // Bench back
            geo = new THREE.BoxGeometry(3, 1.2, 0.2);
            mesh = makeMesh(geo, 0x8B6914);
            mesh.position.set(benchPositions[i], 9.6, -55.4);
            addObj(mesh);
            // Bench legs
            geo = new THREE.BoxGeometry(0.2, 0.8, 1);
            mesh = makeMesh(geo, 0x555555);
            mesh.position.set(benchPositions[i] - 1.3, 8.5, -55);
            addObj(mesh);
            geo = new THREE.BoxGeometry(0.2, 0.8, 1);
            mesh = makeMesh(geo, 0x555555);
            mesh.position.set(benchPositions[i] + 1.3, 8.5, -55);
            addObj(mesh);
        }

        // Hoe cliff face
        geo = new THREE.BoxGeometry(160, 12, 6);
        mesh = makeMesh(geo, 0x999977);
        mesh.position.set(X_OFFSET + 80, 2, -50);
        addObj(mesh);
    }

    function buildSmeatonsTowr() {
        var geo, mesh, i;
        var baseX = X_OFFSET + 60;
        var baseZ = -95;
        var baseY = 8;

        // Lighthouse base plinth
        geo = new THREE.CylinderGeometry(4, 5, 3, 12);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(baseX, baseY + 1.5, baseZ);
        addObj(mesh);

        // Red and white alternating bands (stacked cylinders)
        var bandColors = [0xCC2222, 0xFFFFFF, 0xCC2222, 0xFFFFFF, 0xCC2222, 0xFFFFFF, 0xCC2222, 0xFFFFFF];
        var bandHeight = 3;
        var startY = baseY + 3;
        for (i = 0; i < bandColors.length; i++) {
            var radius = 3 - i * 0.15;
            geo = new THREE.CylinderGeometry(radius - 0.15, radius, bandHeight, 12);
            mesh = makeMesh(geo, bandColors[i]);
            mesh.position.set(baseX, startY + i * bandHeight + bandHeight / 2, baseZ);
            addObj(mesh);
        }

        // Lantern room gallery
        var lanternY = startY + bandColors.length * bandHeight;
        geo = new THREE.CylinderGeometry(2.8, 2.8, 1, 12);
        mesh = makeMesh(geo, 0x444444);
        mesh.position.set(baseX, lanternY + 0.5, baseZ);
        addObj(mesh);

        // Lantern room glass
        geo = new THREE.CylinderGeometry(2.2, 2.5, 3, 12);
        mesh = makeMesh(geo, 0xAAAAFF);
        mesh.position.set(baseX, lanternY + 2.5, baseZ);
        addObj(mesh);

        // Lantern dome
        geo = new THREE.ConeGeometry(2.2, 3, 12);
        mesh = makeMesh(geo, 0x333333);
        mesh.position.set(baseX, lanternY + 5.5, baseZ);
        addObj(mesh);

        // Vane spike
        geo = new THREE.CylinderGeometry(0.1, 0.1, 3, 4);
        mesh = makeMesh(geo, 0x333333);
        mesh.position.set(baseX, lanternY + 8.5, baseZ);
        addObj(mesh);
    }

    function buildRoyalCitadel() {
        var geo, mesh, i;
        var cx = X_OFFSET + 140;
        var cz = -60;
        var wallH = 10;
        var wallT = 5;

        // Main curtain walls - south face
        geo = new THREE.BoxGeometry(80, wallH, wallT);
        mesh = makeMesh(geo, 0x888866);
        mesh.position.set(cx, wallH / 2, cz);
        addObj(mesh);

        // North face
        geo = new THREE.BoxGeometry(80, wallH, wallT);
        mesh = makeMesh(geo, 0x888866);
        mesh.position.set(cx, wallH / 2, cz - 60);
        addObj(mesh);

        // East face
        geo = new THREE.BoxGeometry(wallT, wallH, 64);
        mesh = makeMesh(geo, 0x888866);
        mesh.position.set(cx + 40, wallH / 2, cz - 30);
        addObj(mesh);

        // West face
        geo = new THREE.BoxGeometry(wallT, wallH, 64);
        mesh = makeMesh(geo, 0x888866);
        mesh.position.set(cx - 40, wallH / 2, cz - 30);
        addObj(mesh);

        // Bastion corners - four corner towers (star fort points)
        var bastionPositions = [
            [cx + 45, cz + 5], [cx - 45, cz + 5],
            [cx + 45, cz - 65], [cx - 45, cz - 65]
        ];
        for (i = 0; i < bastionPositions.length; i++) {
            geo = new THREE.BoxGeometry(14, wallH + 2, 14);
            mesh = makeMesh(geo, 0x777755);
            mesh.position.set(bastionPositions[i][0], (wallH + 2) / 2, bastionPositions[i][1]);
            addObj(mesh);
            // Bastion top parapet
            geo = new THREE.BoxGeometry(16, 2, 16);
            mesh = makeMesh(geo, 0x666644);
            mesh.position.set(bastionPositions[i][0], wallH + 2, bastionPositions[i][1]);
            addObj(mesh);
        }

        // Gatehouse - main entrance south wall centre
        geo = new THREE.BoxGeometry(12, 14, 8);
        mesh = makeMesh(geo, 0x999977);
        mesh.position.set(cx, 7, cz + 1);
        addObj(mesh);

        // Gate arch opening
        geo = new THREE.BoxGeometry(5, 7, 10);
        mesh = makeMesh(geo, 0x333322);
        mesh.position.set(cx, 3.5, cz + 1);
        addObj(mesh);

        // Gatehouse towers either side
        geo = new THREE.CylinderGeometry(3, 3, 16, 8);
        mesh = makeMesh(geo, 0x888866);
        mesh.position.set(cx - 7, 8, cz);
        addObj(mesh);
        geo = new THREE.CylinderGeometry(3, 3, 16, 8);
        mesh = makeMesh(geo, 0x888866);
        mesh.position.set(cx + 7, 8, cz);
        addObj(mesh);

        // Gun emplacements along south seafront wall
        var gunPositions = [cx - 30, cx - 15, cx + 15, cx + 30];
        for (i = 0; i < gunPositions.length; i++) {
            // Platform
            geo = new THREE.BoxGeometry(6, 1, 4);
            mesh = makeMesh(geo, 0x777755);
            mesh.position.set(gunPositions[i], wallH + 0.5, cz - 2);
            addObj(mesh);
            // Cannon barrel (cylinder on side approximated as rotated box)
            geo = new THREE.BoxGeometry(4, 1.2, 1.2);
            mesh = makeMesh(geo, 0x333333);
            mesh.position.set(gunPositions[i], wallH + 1.6, cz + 0.5);
            addObj(mesh);
        }

        // Interior parade ground
        geo = new THREE.BoxGeometry(70, 0.5, 52);
        mesh = makeMesh(geo, 0x998877);
        mesh.position.set(cx, 0.25, cz - 30);
        addObj(mesh);

        // Barracks building inside
        geo = new THREE.BoxGeometry(30, 8, 12);
        mesh = makeMesh(geo, 0xBBAA88);
        mesh.position.set(cx + 10, 4, cz - 50);
        addObj(mesh);
        geo = new THREE.BoxGeometry(32, 1.5, 14);
        mesh = makeMesh(geo, 0x8B6914);
        mesh.position.set(cx + 10, 8.75, cz - 50);
        addObj(mesh);
    }

    function buildTheSound() {
        var geo, mesh, i;

        // Sea water plane
        geo = new THREE.BoxGeometry(300, 0.5, 120);
        mesh = makeMesh(geo, 0x003366);
        mesh.position.set(X_OFFSET + 80, -1, 60);
        addObj(mesh);

        // Shallow harbour water (lighter)
        geo = new THREE.BoxGeometry(120, 0.4, 40);
        mesh = makeMesh(geo, 0x004488);
        mesh.position.set(X_OFFSET + 0, -0.7, 20);
        addObj(mesh);

        // Drakes Island - small island
        geo = new THREE.CylinderGeometry(20, 22, 3, 10);
        mesh = makeMesh(geo, 0x667744);
        mesh.position.set(X_OFFSET + 10, 0.5, 90);
        addObj(mesh);

        // Drake's Island ruins - small wall remnants
        var ruinPositions = [
            [X_OFFSET + 5, 90], [X_OFFSET + 15, 85], [X_OFFSET - 5, 95], [X_OFFSET + 20, 95]
        ];
        for (i = 0; i < ruinPositions.length; i++) {
            geo = new THREE.BoxGeometry(3, 3, 2);
            mesh = makeMesh(geo, 0x888877);
            mesh.position.set(ruinPositions[i][0], 3.5, ruinPositions[i][1]);
            addObj(mesh);
        }

        // Breakwater - long low wall across the Sound
        geo = new THREE.BoxGeometry(200, 2, 6);
        mesh = makeMesh(geo, 0x888888);
        mesh.position.set(X_OFFSET + 80, 0, 140);
        addObj(mesh);

        // Breakwater lighthouse end
        geo = new THREE.CylinderGeometry(2, 2.5, 8, 8);
        mesh = makeMesh(geo, 0xCCCCCC);
        mesh.position.set(X_OFFSET + 180, 4, 140);
        addObj(mesh);
        geo = new THREE.ConeGeometry(2, 3, 8);
        mesh = makeMesh(geo, 0xCC2222);
        mesh.position.set(X_OFFSET + 180, 9.5, 140);
        addObj(mesh);

        // Mooring buoys
        var buoyPositions = [
            [X_OFFSET - 30, 40], [X_OFFSET + 50, 55], [X_OFFSET + 120, 45]
        ];
        for (i = 0; i < buoyPositions.length; i++) {
            geo = new THREE.SphereGeometry(1.5, 6, 4);
            mesh = makeMesh(geo, 0xFF6600);
            mesh.position.set(buoyPositions[i][0], 0.5, buoyPositions[i][1]);
            addObj(mesh);
        }
    }

    function build() {
        buildBarbican();
        buildMayflowerSteps();
        buildPlymouthHoe();
        buildSmeatonsTowr();
        buildRoyalCitadel();
        buildTheSound();
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
