window.WolverhamptonBase = (function() {
    'use strict';

    var WORLD_X = 3250;
    var WORLD_Z = 2200;

    function createMesh(geometry, color) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        return new THREE.Mesh(geometry, mat);
    }

    function placeAt(mesh, x, y, z) {
        mesh.position.set(WORLD_X + x, y, WORLD_Z + z);
        return mesh;
    }

    function buildChurch(scene) {
        // Main nave body
        var nave = createMesh(new THREE.BoxGeometry(22, 10, 14), 0xD4A97A);
        placeAt(nave, 0, 5, 0);
        scene.add(nave);

        // Tower base
        var tower = createMesh(new THREE.BoxGeometry(4, 20, 4), 0x2A2A2A);
        placeAt(tower, -13, 10, 0);
        scene.add(tower);

        // Four pinnacles atop the tower
        var pinnacleOffsets = [
            [1.5, 1.5],
            [-1.5, 1.5],
            [1.5, -1.5],
            [-1.5, -1.5]
        ];
        for (var i = 0; i < pinnacleOffsets.length; i++) {
            var px = pinnacleOffsets[i][0];
            var pz = pinnacleOffsets[i][1];
            var pinnacle = createMesh(new THREE.BoxGeometry(1, 3, 1), 0x1A1A1A);
            placeAt(pinnacle, -13 + px, 22.5, pz);
            scene.add(pinnacle);
        }

        // Chancel extension
        var chancel = createMesh(new THREE.BoxGeometry(8, 8, 10), 0xD4A97A);
        placeAt(chancel, 12, 4, 0);
        scene.add(chancel);
    }

    function buildBlackCountryMuseum(scene) {
        // Six terraced back-to-back houses
        var housePositions = [
            [-60, 0],
            [-52, 0],
            [-44, 0],
            [-60, -6],
            [-52, -6],
            [-44, -6]
        ];
        for (var i = 0; i < housePositions.length; i++) {
            var hx = housePositions[i][0];
            var hz = housePositions[i][1];
            var house = createMesh(new THREE.BoxGeometry(6, 4, 4), 0x8A4A4A);
            placeAt(house, hx, 2, hz + 60);
            scene.add(house);
        }

        // Chain-making workshop
        var workshop = createMesh(new THREE.BoxGeometry(12, 6, 8), 0x6A4A3A);
        placeAt(workshop, -55, 3, 75);
        scene.add(workshop);

        // Limestone cavern entrance (dark box)
        var cavern = createMesh(new THREE.BoxGeometry(5, 4, 3), 0x1A1A1A);
        placeAt(cavern, -70, 2, 80);
        scene.add(cavern);

        // Trolleybus pole (cylinder)
        var pole = createMesh(new THREE.CylinderGeometry(0.15, 0.15, 6, 8), 0x5A5A5A);
        placeAt(pole, -50, 3, 65);
        scene.add(pole);

        // Trolleybus overhead wire (LineSegments)
        var wirePoints = [
            WORLD_X + -65, 6, WORLD_Z + 65,
            WORLD_X + -35, 6, WORLD_Z + 65
        ];
        var wireGeo = new THREE.BufferGeometry();
        var wireVerts = new Float32Array(wirePoints);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wireVerts, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0xAAAAAA });
        var wire = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wire);
    }

    function buildRAFCosford(scene) {
        // Main hangar
        var hangar = createMesh(new THREE.BoxGeometry(60, 8, 30), 0x7A7A7A);
        placeAt(hangar, 80, 4, -60);
        scene.add(hangar);

        // Three aircraft silhouettes inside/near hangar
        var aircraftZ = [-70, -60, -50];
        for (var i = 0; i < 3; i++) {
            var az = aircraftZ[i];
            // Fuselage
            var fuselage = createMesh(new THREE.BoxGeometry(14, 1.5, 2), 0x6A6A6A);
            placeAt(fuselage, 80, 5.5, az);
            scene.add(fuselage);

            // Wings
            var wings = createMesh(new THREE.BoxGeometry(2, 0.5, 12), 0x6A6A6A);
            placeAt(wings, 80, 5.5, az);
            scene.add(wings);

            // Tail fin
            var tail = createMesh(new THREE.BoxGeometry(2, 2, 0.5), 0x6A6A6A);
            placeAt(tail, 80 + 6, 6.5, az);
            scene.add(tail);
        }
    }

    function buildBilstonSteelworks(scene) {
        // Blast furnace skeleton (tall cylinder)
        var furnace = createMesh(new THREE.CylinderGeometry(3, 3, 18, 12), 0x3A3A3A);
        placeAt(furnace, 40, 9, 80);
        scene.add(furnace);

        // Slag heap boxes
        var slagHeaps = [
            [50, 0, 85, 10, 4, 8],
            [62, 0, 80, 8, 3, 6],
            [55, 0, 92, 6, 2, 5]
        ];
        for (var i = 0; i < slagHeaps.length; i++) {
            var s = slagHeaps[i];
            var slag = createMesh(new THREE.BoxGeometry(s[3], s[4], s[5]), 0x4A4040);
            placeAt(slag, s[0], s[4] / 2, s[2]);
            scene.add(slag);
        }

        // Furnace support legs
        var legAngles = [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2];
        for (var j = 0; j < legAngles.length; j++) {
            var lx = Math.cos(legAngles[j]) * 4;
            var lz = Math.sin(legAngles[j]) * 4;
            var leg = createMesh(new THREE.CylinderGeometry(0.4, 0.6, 6, 6), 0x3A3A3A);
            placeAt(leg, 40 + lx, 3, 80 + lz);
            scene.add(leg);
        }
    }

    function buildPennCommon(scene) {
        // Open heathland flat box
        var heath = createMesh(new THREE.BoxGeometry(80, 0.5, 60), 0x7A6A4A);
        placeAt(heath, -30, 0.25, -80);
        scene.add(heath);

        // WW2 anti-aircraft battery concrete platforms
        var platformPositions = [
            [-15, -70],
            [-30, -70],
            [-45, -70],
            [-15, -90],
            [-30, -90],
            [-45, -90]
        ];
        for (var i = 0; i < platformPositions.length; i++) {
            var ppx = platformPositions[i][0];
            var ppz = platformPositions[i][1];
            var platform = createMesh(new THREE.BoxGeometry(5, 0.6, 5), 0x9A9A8A);
            placeAt(platform, ppx, 0.8, ppz);
            scene.add(platform);

            // Small gun mount stub
            var mount = createMesh(new THREE.CylinderGeometry(0.5, 0.7, 1.2, 8), 0x6A6A6A);
            placeAt(mount, ppx, 1.7, ppz);
            scene.add(mount);
        }

        // Heathland shrub mounds (low boxes)
        var shrubPositions = [
            [-20, -75],
            [-35, -82],
            [-50, -78],
            [-25, -88]
        ];
        for (var k = 0; k < shrubPositions.length; k++) {
            var sx = shrubPositions[k][0];
            var sz = shrubPositions[k][1];
            var shrub = createMesh(new THREE.BoxGeometry(3, 1, 3), 0x5A6A3A);
            placeAt(shrub, sx, 1, sz);
            scene.add(shrub);
        }
    }

    function buildWolverhamptonTownCentre(scene) {
        // Civic buildings cluster
        var civic = createMesh(new THREE.BoxGeometry(20, 12, 15), 0xB0A080);
        placeAt(civic, 20, 6, -20);
        scene.add(civic);

        // Market hall box
        var market = createMesh(new THREE.BoxGeometry(18, 7, 12), 0xC0A070);
        placeAt(market, 45, 3.5, -10);
        scene.add(market);

        // Grand Theatre
        var theatre = createMesh(new THREE.BoxGeometry(14, 10, 10), 0xA09070);
        placeAt(theatre, 30, 5, 10);
        scene.add(theatre);

        // Industrial chimney stacks
        var chimneyPositions = [
            [25, 30],
            [35, 35]
        ];
        for (var i = 0; i < chimneyPositions.length; i++) {
            var cx = chimneyPositions[i][0];
            var cz = chimneyPositions[i][1];
            var chimney = createMesh(new THREE.CylinderGeometry(0.8, 1.0, 16, 8), 0x4A4040);
            placeAt(chimney, cx, 8, cz);
            scene.add(chimney);
        }
    }

    function buildStreetNetwork(scene) {
        // Major road surface boxes
        var roads = [
            [0, -30, 100, 0.2, 8],
            [-30, 0, 8, 0.2, 100]
        ];
        for (var i = 0; i < roads.length; i++) {
            var r = roads[i];
            var road = createMesh(new THREE.BoxGeometry(r[2], r[3], r[4]), 0x3A3A3A);
            placeAt(road, r[0], 0.1, r[1]);
            scene.add(road);
        }

        // Street lamp poles
        var lampPositions = [
            [-10, -20],
            [10, -20],
            [-10, 20],
            [10, 20]
        ];
        for (var j = 0; j < lampPositions.length; j++) {
            var lp = lampPositions[j];
            var lampPole = createMesh(new THREE.CylinderGeometry(0.1, 0.1, 5, 6), 0x8A8A8A);
            placeAt(lampPole, lp[0], 2.5, lp[1]);
            scene.add(lampPole);

            var lampHead = createMesh(new THREE.BoxGeometry(0.8, 0.3, 0.3), 0xFFEE88);
            placeAt(lampHead, lp[0] + 0.5, 5.1, lp[1]);
            scene.add(lampHead);
        }
    }

    function init(scene) {
        buildChurch(scene);
        buildBlackCountryMuseum(scene);
        buildRAFCosford(scene);
        buildBilstonSteelworks(scene);
        buildPennCommon(scene);
        buildWolverhamptonTownCentre(scene);
        buildStreetNetwork(scene);
    }

    return {
        init: init,
        WORLD_X: WORLD_X,
        WORLD_Z: WORLD_Z
    };
}());
