window.WarCove = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var searchlights = [];
    var time = 0;

    function addMesh(geo, mat, x, y, z) {
        var m = new THREE.Mesh(geo, mat);
        m.position.set(x, y, z);
        scene.add(m);
        objects.push(m);
        return m;
    }

    function addLight(light) {
        scene.add(light);
        lights.push(light);
        return light;
    }

    function buildCliffs() {
        var cliffColor = new THREE.MeshLambertMaterial({ color: 0x555555 });

        // Left cliff formation
        var leftCliffX = -35;
        for (var i = 0; i < 18; i++) {
            for (var j = 0; j < 6; j++) {
                var offsetX = (Math.random() - 0.5) * 8;
                var offsetZ = (Math.random() - 0.5) * 6;
                var width = 5 + Math.random() * 4;
                var height = 4 + Math.random() * 3;
                var depth = 4 + Math.random() * 3;
                var geo = new THREE.BoxGeometry(width, height, depth);
                addMesh(geo, cliffColor, leftCliffX + offsetX, i * 4, -30 + offsetZ);
            }
        }

        // Right cliff formation
        var rightCliffX = 35;
        for (var i = 0; i < 18; i++) {
            for (var j = 0; j < 6; j++) {
                var offsetX = (Math.random() - 0.5) * 8;
                var offsetZ = (Math.random() - 0.5) * 6;
                var width = 5 + Math.random() * 4;
                var height = 4 + Math.random() * 3;
                var depth = 4 + Math.random() * 3;
                var geo = new THREE.BoxGeometry(width, height, depth);
                addMesh(geo, cliffColor, rightCliffX + offsetX, i * 4, -30 + offsetZ);
            }
        }
    }

    function buildCoveWater() {
        var waterColor = new THREE.MeshLambertMaterial({ color: 0x1a4d6d });

        // Water surface main body
        var waterGeo = new THREE.BoxGeometry(70, 2, 50);
        addMesh(waterGeo, waterColor, 0, -2, 10);

        // Wave ripples with spheres
        for (var i = 0; i < 15; i++) {
            var x = (Math.random() - 0.5) * 60;
            var z = (Math.random() - 0.5) * 40 + 10;
            var rippleGeo = new THREE.SphereGeometry(2 + Math.random() * 1.5, 8, 6);
            addMesh(rippleGeo, waterColor, x, 0, z);
        }
    }

    function buildGunEmplacements() {
        var concreteColor = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var gunColor = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var sandbagColor = new THREE.MeshLambertMaterial({ color: 0xccaa55 });

        var emplacementPositions = [
            { x: -20, z: -15 },
            { x: 0, z: -20 },
            { x: 20, z: -15 }
        ];

        for (var e = 0; e < emplacementPositions.length; e++) {
            var pos = emplacementPositions[e];

            // Concrete base platform
            var baseGeo = new THREE.BoxGeometry(12, 1, 12);
            addMesh(baseGeo, concreteColor, pos.x, 5, pos.z);

            // Gun pivot base box
            var pivotGeo = new THREE.BoxGeometry(8, 3, 8);
            addMesh(pivotGeo, concreteColor, pos.x, 7, pos.z);

            // Gun barrel - large cylinder
            var barrelGeo = new THREE.CylinderGeometry(1.2, 1.2, 20, 16);
            var barrel = addMesh(barrelGeo, gunColor, pos.x, 9.5, pos.z);
            barrel.rotation.z = Math.PI / 6;

            // Gun breech box
            var breechGeo = new THREE.BoxGeometry(3, 2, 3);
            addMesh(breechGeo, gunColor, pos.x, 8, pos.z);

            // Sandbag perimeter (4 stacks around emplacement)
            var sandbagOffsets = [
                { x: 8, z: 0 },
                { x: -8, z: 0 },
                { x: 0, z: 8 },
                { x: 0, z: -8 }
            ];

            for (var s = 0; s < sandbagOffsets.length; s++) {
                var sbOff = sandbagOffsets[s];
                for (var layer = 0; layer < 3; layer++) {
                    var bagGeo = new THREE.BoxGeometry(3, 1.5, 3);
                    addMesh(bagGeo, sandbagColor, pos.x + sbOff.x, 5.5 + layer * 1.5, pos.z + sbOff.z);
                }
            }

            // Concrete ring around emplacement
            var ringGeo = new THREE.CylinderGeometry(14, 14, 0.5, 32);
            addMesh(ringGeo, concreteColor, pos.x, 4.75, pos.z);
        }
    }

    function buildBunkerComplex() {
        var concreteColor = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var airColor = new THREE.MeshLambertMaterial({ color: 0x000000 });

        // Three bunkers in a triangle
        var bunkerPositions = [
            { x: -12, z: 5 },
            { x: 12, z: 5 },
            { x: 0, z: 20 }
        ];

        for (var b = 0; b < bunkerPositions.length; b++) {
            var bp = bunkerPositions[b];

            // Main bunker box (thick walls = large outer, inner void)
            var outerGeo = new THREE.BoxGeometry(10, 8, 10);
            addMesh(outerGeo, concreteColor, bp.x, 10, bp.z);

            // Firing slits (air gaps) - 2 per bunker
            var slitGeo = new THREE.BoxGeometry(1.5, 2, 0.5);
            addMesh(slitGeo, airColor, bp.x - 3, 11, bp.z - 4.5);
            addMesh(slitGeo, airColor, bp.x + 3, 11, bp.z - 4.5);

            // Entrance ramp
            var rampGeo = new THREE.BoxGeometry(6, 1, 8);
            addMesh(rampGeo, concreteColor, bp.x, 6, bp.z + 7);
        }

        // Tunnel connections between bunkers
        var tunnelColor = new THREE.MeshLambertMaterial({ color: 0x555555 });

        // Tunnel from bunker 1 to bunker 3
        var tunnel1Geo = new THREE.BoxGeometry(2, 3, 15);
        addMesh(tunnel1Geo, tunnelColor, 0, 8, 10);

        // Tunnel from bunker 2 to bunker 3
        var tunnel2Geo = new THREE.BoxGeometry(2, 3, 15);
        addMesh(tunnel2Geo, tunnelColor, 0, 8, 10);

        // Cross tunnel
        var tunnel3Geo = new THREE.BoxGeometry(24, 2, 2);
        addMesh(tunnel3Geo, tunnelColor, 0, 8, 5);
    }

    function buildPier() {
        var woodColor = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
        var metalColor = new THREE.MeshLambertMaterial({ color: 0x444444 });

        // Main pier deck - long box extending over water
        var deckGeo = new THREE.BoxGeometry(50, 1.5, 6);
        addMesh(deckGeo, woodColor, 0, 0, 35);

        // Pier railings - boxes along sides
        var railing1Geo = new THREE.BoxGeometry(50, 1, 0.8);
        addMesh(railing1Geo, metalColor, 0, 1.5, 32);

        var railing2Geo = new THREE.BoxGeometry(50, 1, 0.8);
        addMesh(railing2Geo, metalColor, 0, 1.5, 38);

        // Piling supports - cylinders every 4 units
        for (var p = -24; p <= 24; p += 4) {
            var pilingGeo = new THREE.CylinderGeometry(0.6, 0.8, 15, 12);
            addMesh(pilingGeo, metalColor, p, -5, 35);
        }

        // Mooring posts
        for (var m = -20; m <= 20; m += 8) {
            var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
            addMesh(postGeo, metalColor, m, 1.2, 31);
            addMesh(postGeo, metalColor, m, 1.2, 39);
        }

        // Pier support structure underneath
        var supportGeo = new THREE.BoxGeometry(48, 1, 4);
        addMesh(supportGeo, metalColor, 0, -2, 35);
    }

    function buildPatrolBoats() {
        var hullColor = new THREE.MeshLambertMaterial({ color: 0x1a3a4a });
        var cabinColor = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var gunColor = new THREE.MeshLambertMaterial({ color: 0x222222 });

        var boatPositions = [
            { x: -15, z: 25 },
            { x: 15, z: 30 }
        ];

        for (var b = 0; b < boatPositions.length; b++) {
            var bp = boatPositions[b];

            // Hull - elongated box
            var hullGeo = new THREE.BoxGeometry(4, 2, 12);
            addMesh(hullGeo, hullColor, bp.x, 1, bp.z);

            // Cabin box
            var cabinGeo = new THREE.BoxGeometry(3, 2.5, 4);
            addMesh(cabinGeo, cabinColor, bp.x, 2.5, bp.z - 2);

            // Engine cylinder
            var engineGeo = new THREE.CylinderGeometry(0.8, 0.8, 2, 12);
            addMesh(engineGeo, gunColor, bp.x, 1.5, bp.z + 4);

            // Gun barrel - thin cylinder on top
            var barrelGeo = new THREE.CylinderGeometry(0.3, 0.3, 4, 8);
            var barrel = addMesh(barrelGeo, gunColor, bp.x, 4, bp.z - 1);
            barrel.rotation.z = Math.PI / 8;

            // Gun mount box
            var gunBoxGeo = new THREE.BoxGeometry(1, 1, 1);
            addMesh(gunBoxGeo, cabinColor, bp.x, 3, bp.z - 1);
        }
    }

    function buildSearchlights() {
        var baseColor = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var lampColor = new THREE.MeshLambertMaterial({ color: 0xffff99 });

        var searchlightPositions = [
            { x: -25, z: -10 },
            { x: 25, z: -10 },
            { x: -25, z: 20 },
            { x: 25, z: 20 }
        ];

        for (var sl = 0; sl < searchlightPositions.length; sl++) {
            var slp = searchlightPositions[sl];

            // Tower base - cylinder
            var baseGeo = new THREE.CylinderGeometry(1.5, 2, 12, 16);
            addMesh(baseGeo, baseColor, slp.x, 8, slp.z);

            // Lamp head - box
            var lampGeo = new THREE.BoxGeometry(2, 2, 2);
            var lamp = addMesh(lampGeo, lampColor, slp.x, 15, slp.z);
            searchlights.push(lamp);

            // Lamp reflector - cone
            var reflectorGeo = new THREE.ConeGeometry(1.8, 1.5, 16);
            addMesh(reflectorGeo, baseColor, slp.x, 16, slp.z);
        }
    }

    function buildMineField() {
        var mineColor = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var tetherColor = new THREE.MeshLambertMaterial({ color: 0x555555 });

        // 12 mines at cove entrance
        for (var mine = 0; mine < 12; mine++) {
            var mineX = (Math.random() - 0.5) * 40 - 15;
            var mineZ = (Math.random() - 0.5) * 20 - 40;

            // Mine sphere
            var mineGeo = new THREE.SphereGeometry(1.2, 10, 8);
            addMesh(mineGeo, mineColor, mineX, 0.2, mineZ);

            // Tether cylinder down to seabed
            var tetherGeo = new THREE.CylinderGeometry(0.15, 0.15, 8, 6);
            addMesh(tetherGeo, tetherColor, mineX, -4, mineZ);
        }
    }

    function setupLighting() {
        // Dark ambient for night/dusk
        var ambientLight = new THREE.AmbientLight(0x1a3a5a, 0.4);
        addLight(ambientLight);

        // Moonlight directional
        var moonLight = new THREE.DirectionalLight(0x4488ff, 0.6);
        moonLight.position.set(40, 60, -40);
        moonLight.castShadow = false;
        addLight(moonLight);

        // Searchlight cone lights
        var searchlightPositions = [
            { x: -25, z: -10 },
            { x: 25, z: -10 },
            { x: -25, z: 20 },
            { x: 25, z: 20 }
        ];

        for (var sl = 0; sl < searchlightPositions.length; sl++) {
            var slp = searchlightPositions[sl];
            var light = new THREE.PointLight(0xffff99, 0.8, 50);
            light.position.set(slp.x, 15, slp.z);
            addLight(light);
        }
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        searchlights = [];
        time = 0;

        buildCliffs();
        buildCoveWater();
        buildGunEmplacements();
        buildBunkerComplex();
        buildPier();
        buildPatrolBoats();
        buildSearchlights();
        buildMineField();
        setupLighting();
    }

    function update(delta) {
        time += delta;

        // Rotate searchlights with sine wave oscillation
        for (var i = 0; i < searchlights.length; i++) {
            var searchlight = searchlights[i];
            searchlight.rotation.y += Math.sin(time * 0.8) * 0.02;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        searchlights = [];
        scene = null;
        camera = null;
        time = 0;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
