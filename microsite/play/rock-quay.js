window.RockQuay = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var fishingBoats = [];
    var lighthouses = [];
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

    function buildQuayWall() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var postMat = new THREE.MeshLambertMaterial({ color: 0x444433 });
        var hookMat = new THREE.MeshLambertMaterial({ color: 0x333333 });

        // Main quay wall - 3 high, 50 long
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 10; col++) {
                var x = -25 + col * 5;
                var y = 0.5 + row * 1;
                addMesh(new THREE.BoxGeometry(5, 1, 3), stoneMat, x, y, -15);
            }
        }

        // Mooring posts along quay
        for (var i = 0; i < 8; i++) {
            var xpos = -20 + i * 6;
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2), postMat, xpos, 1.5, -16);
            addMesh(new THREE.CylinderGeometry(0.25, 0.25, 2.2), postMat, xpos, 1.6, -16);

            // Iron ring hooks on posts
            for (var j = 0; j < 2; j++) {
                addMesh(new THREE.BoxGeometry(0.1, 0.1, 0.1), hookMat, xpos + 0.35, 1 + j * 0.5, -16);
            }
        }
    }

    function buildHarborWater() {
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A3A5A });
        addMesh(new THREE.BoxGeometry(80, 1, 60), waterMat, 0, -0.5, 0);

        // Gentle wave ripples as spheres
        for (var i = 0; i < 15; i++) {
            var rx = Math.random() * 60 - 30;
            var rz = Math.random() * 50 - 10;
            var rippleGeo = new THREE.SphereGeometry(2 + Math.random() * 2, 8, 8);
            var rippleMat = new THREE.MeshLambertMaterial({ color: 0x2A5A7A, transparent: true, opacity: 0.3 });
            var ripple = new THREE.Mesh(rippleGeo, rippleMat);
            ripple.position.set(rx, 0.1, rz);
            scene.add(ripple);
            objects.push(ripple);
        }
    }

    function buildFishingBoats() {
        var hullMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var cabinMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var ropeColor = 0xCCCCAA;

        for (var i = 0; i < 6; i++) {
            var bx = -15 + i * 7;
            var by = 0.3;
            var bz = 10 + i * 3;

            // Hull
            var hull = addMesh(new THREE.BoxGeometry(4, 2, 8), hullMat, bx, by, bz);
            fishingBoats.push({ mesh: hull, index: i });

            // Cabin
            addMesh(new THREE.BoxGeometry(2.5, 2, 3), cabinMat, bx + 0.5, by + 1.5, bz - 1);

            // Mast
            addMesh(new THREE.CylinderGeometry(0.15, 0.15, 8), mastMat, bx, by + 5, bz);

            // Rigging with LineSegments
            var rigGeometry = new THREE.BufferGeometry();
            var rigPositions = new Float32Array([
                0, 0, 0,
                -1.5, -3, 1,
                0, 0, 0,
                1.5, -3, 1,
                0, 0, 0,
                -1.5, -3, -1,
                0, 0, 0,
                1.5, -3, -1
            ]);
            rigGeometry.setAttribute('position', new THREE.BufferAttribute(rigPositions, 3));
            var rigMat = new THREE.LineBasicMaterial({ color: ropeColor, linewidth: 2 });
            var rigLines = new THREE.LineSegments(rigGeometry, rigMat);
            rigLines.position.set(bx, by + 4, bz);
            scene.add(rigLines);
            objects.push(rigLines);

            // Fishing nets draped
            for (var n = 0; n < 3; n++) {
                var netGeo = new THREE.BufferGeometry();
                var netPos = new Float32Array([
                    -2, -2 - n, 0,
                    2, -2 - n, 0,
                    -2, -2 - n, 2,
                    2, -2 - n, 2
                ]);
                netGeo.setAttribute('position', new THREE.BufferAttribute(netPos, 3));
                var netMat = new THREE.LineBasicMaterial({ color: 0xAABBAA, linewidth: 1 });
                var netLines = new THREE.LineSegments(netGeo, netMat);
                netLines.position.set(bx + 1, by + 3, bz);
                scene.add(netLines);
                objects.push(netLines);
            }
        }
    }

    function buildNetSheds() {
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x8B6630 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var netMat = new THREE.LineBasicMaterial({ color: 0xBBAA88, linewidth: 1 });

        for (var i = 0; i < 4; i++) {
            var sx = -30 + i * 15;
            var sy = 0;
            var sz = -25;

            // Wooden shed walls
            addMesh(new THREE.BoxGeometry(6, 4, 5), woodMat, sx, sy + 2, sz);

            // Roof overhang
            addMesh(new THREE.BoxGeometry(7, 0.5, 6), roofMat, sx, sy + 4.3, sz);

            // Support poles
            for (var j = 0; j < 2; j++) {
                addMesh(new THREE.CylinderGeometry(0.2, 0.2, 4), woodMat, sx - 3 + j * 6, sy + 2, sz);
            }

            // Fishing nets draped over frame as LineSegments
            for (var n = 0; n < 4; n++) {
                var netGeo = new THREE.BufferGeometry();
                var netPos = new Float32Array([
                    -3, 4 - n, -2,
                    3, 4 - n, -2,
                    -3, 4 - n, 2,
                    3, 4 - n, 2,
                    -3, 4 - n, -2,
                    -3, 4 - n, 2,
                    3, 4 - n, -2,
                    3, 4 - n, 2
                ]);
                netGeo.setAttribute('position', new THREE.BufferAttribute(netPos, 3));
                var netLine = new THREE.LineSegments(netGeo, netMat);
                netLine.position.set(sx, sy, sz);
                scene.add(netLine);
                objects.push(netLine);
            }
        }
    }

    function buildRockyBreakwater() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x555544 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x444433 });

        // Irregular stone pile extending into harbor
        for (var i = 0; i < 12; i++) {
            var bx = -5 + i * 3;
            var by = Math.floor(Math.random() * 2) * 1 + 0.5;
            var bz = 25;
            var size = 1.5 + Math.random() * 1;

            if (i % 3 === 0) {
                addMesh(new THREE.SphereGeometry(size, 8, 8), stoneMat, bx, by, bz);
            } else {
                addMesh(new THREE.BoxGeometry(size, size * 0.8, size * 0.6), darkStoneMat, bx, by, bz);
            }

            // Second layer
            if (i % 2 === 0) {
                addMesh(new THREE.SphereGeometry(size * 0.7, 6, 6), darkStoneMat, bx + 0.5, by + size, bz);
            }
        }
    }

    function buildMilitiaPost() {
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xC9B88B });
        var metalMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x8B6630 });
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x3A3A2A });

        // Sandbagged bunker
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 6; col++) {
                addMesh(new THREE.BoxGeometry(1.2, 0.8, 1), sandbagMat, -20 + col * 1.3, 0.4 + row * 0.9, -30);
            }
        }

        // MG nest
        addMesh(new THREE.BoxGeometry(1, 1, 1.5), metalMat, -18, 2.5, -30);
        addMesh(new THREE.CylinderGeometry(0.1, 0.1, 2), metalMat, -17.5, 3, -30);

        // Ammunition crates
        for (var i = 0; i < 4; i++) {
            addMesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), crateMat, -15 + i, 0.4, -28);
        }

        // Barrel clusters
        for (var j = 0; j < 3; j++) {
            addMesh(new THREE.CylinderGeometry(0.4, 0.4, 1), barrelMat, -13 + j * 1.2, 0.5, -30);
        }

        // Flag pole
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 6), metalMat, -25, 3, -30);

        // Flag as box
        addMesh(new THREE.BoxGeometry(1.5, 1, 0.1), new THREE.MeshLambertMaterial({ color: 0xFF0000 }), -24, 5.5, -30);
    }

    function buildLighthouse() {
        var towerMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var redMat = new THREE.MeshLambertMaterial({ color: 0xFF4444 });
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });

        var lhx = 40;
        var lhy = 0;
        var lhz = -35;

        // Main tower - cylinder
        addMesh(new THREE.CylinderGeometry(1.5, 1.5, 20), towerMat, lhx, lhy + 10, lhz);

        // Red-white striped bands
        for (var i = 0; i < 10; i++) {
            var stripeMat = i % 2 === 0 ? redMat : whiteMat;
            addMesh(new THREE.CylinderGeometry(1.5, 1.5, 0.8), stripeMat, lhx, lhy + 1 + i * 2, lhz);
        }

        // Lantern room
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), new THREE.MeshLambertMaterial({ color: 0xFFFF99 }), lhx, lhy + 21, lhz);

        // Store light reference for rotation
        var lanternLight = new THREE.PointLight(0xFF8800, 2, 80);
        lanternLight.position.set(lhx, lhy + 21, lhz);
        addLight(lanternLight);
        lighthouses.push({ light: lanternLight, position: { x: lhx, y: lhy + 21, z: lhz } });
    }

    function buildFishMarket() {
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x8B6630 });
        var awningMat = new THREE.MeshLambertMaterial({ color: 0xFF6600 });
        var crateMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x4A4A3A });

        var mx = 20;
        var my = 0;
        var mz = -22;

        // Market stalls with box overhangs
        for (var stall = 0; stall < 4; stall++) {
            var stallx = mx - 8 + stall * 5;

            // Stall counter
            addMesh(new THREE.BoxGeometry(4, 1.5, 3), woodMat, stallx, my + 0.75, mz);

            // Awning overhang
            addMesh(new THREE.BoxGeometry(5, 0.3, 3.5), awningMat, stallx, my + 2.5, mz);

            // Support poles
            for (var p = 0; p < 2; p++) {
                addMesh(new THREE.CylinderGeometry(0.2, 0.2, 2.5), woodMat, stallx - 2 + p * 4, my + 1.25, mz);
            }

            // Crate displays
            for (var c = 0; c < 3; c++) {
                addMesh(new THREE.BoxGeometry(1, 1, 1), crateMat, stallx - 1.5 + c * 1.5, my + 1, mz + 1.5);
            }
        }

        // Barrel clusters
        for (var b = 0; b < 6; b++) {
            var bx = mx - 5 + b * 2;
            var bz = mz + 4;
            addMesh(new THREE.CylinderGeometry(0.5, 0.5, 1.2), barrelMat, bx, my + 0.6, bz);
        }
    }

    function setupLighting() {
        // Ambient light - coastal morning soft blue-white
        var ambientLight = new THREE.AmbientLight(0x7799BB, 0.8);
        addLight(ambientLight);

        // Directional sun - warm, low angle
        var sunLight = new THREE.DirectionalLight(0xFFCC88, 0.6);
        sunLight.position.set(50, 20, 40);
        sunLight.target.position.set(0, 0, 0);
        addLight(sunLight);

        // Additional subtle light
        var fillLight = new THREE.DirectionalLight(0xBBCCFF, 0.4);
        fillLight.position.set(-30, 15, -50);
        addLight(fillLight);
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        fishingBoats = [];
        lighthouses = [];
        time = 0;

        buildQuayWall();
        buildHarborWater();
        buildFishingBoats();
        buildNetSheds();
        buildRockyBreakwater();
        buildMilitiaPost();
        buildLighthouse();
        buildFishMarket();
        setupLighting();
    }

    function update(delta) {
        time += delta;

        // Rock fishing boats on water with sine wave
        for (var i = 0; i < fishingBoats.length; i++) {
            var boat = fishingBoats[i];
            var rockAmount = Math.sin(time * 1.5 + boat.index) * 0.02;
            boat.mesh.rotation.z = rockAmount;
        }

        // Rotate lighthouse beam
        for (var l = 0; l < lighthouses.length; l++) {
            var lh = lighthouses[l];
            var angle = time * 1.2;
            lh.light.position.x = lh.position.x + Math.cos(angle) * 5;
            lh.light.position.z = lh.position.z + Math.sin(angle) * 5;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var j = 0; j < lights.length; j++) {
            scene.remove(lights[j]);
        }
        objects = [];
        lights = [];
        fishingBoats = [];
        lighthouses = [];
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
