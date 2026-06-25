window.ClayDock = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var clayDustMaterial = null;
    var woodMaterial = null;
    var stoneMaterial = null;
    var riverMaterial = null;
    var kilnGlowMaterial = null;
    var smokeParticles = [];
    var boatStates = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        smokeParticles = [];
        boatStates = [];

        initializeMaterials();
        buildRiverBank();
        buildRiverChannel();
        buildDockPlatform();
        buildPotteryKilns();
        buildClayPits();
        buildFerryBoats();
        buildBridgeCrossing();
        buildDefenseWorks();
        buildPotStorage();
        buildGuardTowers();
        setupLighting();
    }

    function initializeMaterials() {
        clayDustMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6347 });
        woodMaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        riverMaterial = new THREE.MeshLambertMaterial({ color: 0x1A3A5A });
        kilnGlowMaterial = new THREE.MeshLambertMaterial({ color: 0xFF6B1A, emissive: 0xFF4500 });
    }

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

    function buildRiverBank() {
        var bankMaterial = new THREE.MeshLambertMaterial({ color: 0x8B6347 });
        var tileGeo = new THREE.BoxGeometry(2, 0.3, 2);

        for (var x = -50; x < 50; x += 2) {
            for (var z = -45; z < 45; z += 2) {
                var offsetX = x + Math.sin(z * 0.05) * 0.3;
                var offsetZ = z + Math.cos(x * 0.05) * 0.3;
                addMesh(tileGeo, bankMaterial, offsetX, 0, offsetZ);
            }
        }

        var soilDepth = new THREE.BoxGeometry(100, 1, 90);
        addMesh(soilDepth, bankMaterial, 0, -1, 0);
    }

    function buildRiverChannel() {
        var riverGeo = new THREE.BoxGeometry(8, 1.5, 90);

        addMesh(riverGeo, riverMaterial, 50, -0.5, 0);
        addMesh(riverGeo, riverMaterial, -50, -0.5, 0);

        var rockGeo = new THREE.BoxGeometry(1.5, 0.5, 1.5);
        for (var i = 0; i < 20; i++) {
            var rx = -48 + Math.random() * 96;
            var rz = -40 + Math.random() * 80;
            var ry = -0.3 + Math.random() * 0.5;
            addMesh(rockGeo, stoneMaterial, rx, ry, rz);
        }
    }

    function buildDockPlatform() {
        var plankGeo = new THREE.BoxGeometry(3, 0.4, 12);
        var pilingGeo = new THREE.CylinderGeometry(0.3, 0.4, 4, 16);

        for (var i = 0; i < 5; i++) {
            addMesh(plankGeo, woodMaterial, -8 + i * 2, 0.8, 20);
            addMesh(plankGeo, woodMaterial, -8 + i * 2, 0.8, 35);
        }

        for (var i = 0; i < 6; i++) {
            for (var j = 0; j < 3; j++) {
                addMesh(pilingGeo, stoneMaterial, -9 + i * 2.5, -1.8, 18 + j * 8);
            }
        }

        var rampGeo = new THREE.BoxGeometry(2, 0.3, 8);
        addMesh(rampGeo, woodMaterial, -10, 1.2, 10);

        var postGeo = new THREE.CylinderGeometry(0.25, 0.25, 2, 8);
        addMesh(postGeo, woodMaterial, -11, 1.5, 18);
        addMesh(postGeo, woodMaterial, -11, 1.5, 32);
    }

    function buildPotteryKilns() {
        buildKiln(-25, 0, -15);
        buildKiln(-15, 0, -20);
        buildKiln(-20, 0, 10);
        buildKiln(-35, 0, 5);
    }

    function buildKiln(cx, cy, cz) {
        var baseGeo = new THREE.BoxGeometry(3, 0.6, 3);
        addMesh(baseGeo, clayDustMaterial, cx, cy, cz);

        var domeGeo = new THREE.CylinderGeometry(1.4, 1.5, 2, 20);
        addMesh(domeGeo, clayDustMaterial, cx, cy + 1.5, cz);

        var chimneyGeo = new THREE.ConeGeometry(0.5, 1.5, 12);
        addMesh(chimneyGeo, stoneMaterial, cx, cy + 3.2, cz);

        var glowGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var glowMesh = addMesh(glowGeo, kilnGlowMaterial, cx, cy + 1.2, cz);

        var smokeMaterial = new THREE.MeshLambertMaterial({ color: 0xCCCCCC, transparent: true, opacity: 0.4 });
        for (var i = 0; i < 3; i++) {
            var smokeGeo = new THREE.SphereGeometry(0.4 + i * 0.2, 8, 8);
            var smokeMesh = addMesh(smokeGeo, smokeMaterial, cx + (Math.random() - 0.5), cy + 3.5 + i * 0.5, cz + (Math.random() - 0.5));
            smokeParticles.push({
                mesh: smokeMesh,
                vy: 0.8 + Math.random() * 0.4,
                baseY: cy + 3.5 + i * 0.5,
                amplitude: 0.3
            });
        }

        addLight(new THREE.PointLight(0xFF6B1A, 2.5, 20));
    }

    function buildClayPits() {
        for (var i = 0; i < 5; i++) {
            var px = -50 + i * 15;
            var pz = -35;

            var pitGeo = new THREE.BoxGeometry(4, 1.5, 4);
            addMesh(pitGeo, new THREE.MeshLambertMaterial({ color: 0x6B4A2A }), px, -1, pz);

            var toolGeo = new THREE.CylinderGeometry(0.1, 0.1, 2, 6);
            addMesh(toolGeo, stoneMaterial, px - 2.5, 0.5, pz - 2);
            addMesh(toolGeo, stoneMaterial, px + 2.5, 0.5, pz + 2);
        }
    }

    function buildFerryBoats() {
        buildBoat(48, -0.2, 15);
        buildBoat(48, -0.2, -15);
    }

    function buildBoat(bx, by, bz) {
        var hullGeo = new THREE.BoxGeometry(3, 0.8, 6);
        var hullMesh = addMesh(hullGeo, woodMaterial, bx, by, bz);
        boatStates.push({
            mesh: hullMesh,
            baseY: by,
            phase: Math.random() * Math.PI * 2
        });

        var deckGeo = new THREE.BoxGeometry(3.2, 0.3, 6.2);
        addMesh(deckGeo, woodMaterial, bx, by + 0.6, bz);

        var postGeo = new THREE.CylinderGeometry(0.15, 0.15, 1.2, 8);
        addMesh(postGeo, woodMaterial, bx - 1, by + 1.2, bz - 2);
        addMesh(postGeo, woodMaterial, bx + 1, by + 1.2, bz - 2);

        var ropeGeo = new THREE.BufferGeometry();
        var ropePoints = [
            new THREE.Vector3(bx - 1, by + 1.2, bz - 2),
            new THREE.Vector3(-11, 2, 18),
            new THREE.Vector3(bx + 1, by + 1.2, bz - 2),
            new THREE.Vector3(-11, 2, 32)
        ];
        ropeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(
            ropePoints.flatMap(p => [p.x, p.y, p.z])
        ), 3));
        var ropeMat = new THREE.LineBasicMaterial({ color: 0x8B4513 });
        var ropeLines = new THREE.LineSegments(ropeGeo, ropeMat);
        scene.add(ropeLines);
        objects.push(ropeLines);
    }

    function buildBridgeCrossing() {
        var archWidth = 12;
        var archHeight = 5;
        var numSegments = 8;

        for (var i = 0; i < numSegments; i++) {
            var angle = (i / (numSegments - 1)) * Math.PI;
            var x = (Math.cos(angle) - 0.5) * archWidth;
            var y = Math.sin(angle) * archHeight + 3;

            var stoneGeo = new THREE.BoxGeometry(2, 1, 1.5);
            addMesh(stoneGeo, stoneMaterial, x, y, 0);
        }

        var deckGeo = new THREE.BoxGeometry(12, 0.5, 8);
        addMesh(deckGeo, stoneMaterial, 0, 4, 0);

        for (var i = 0; i < 4; i++) {
            var railGeo = new THREE.CylinderGeometry(0.15, 0.15, 5, 6);
            addMesh(railGeo, stoneMaterial, -5 + i * 3.5, 5, -4.5);
            addMesh(railGeo, stoneMaterial, -5 + i * 3.5, 5, 4.5);
        }
    }

    function buildDefenseWorks() {
        var rampartMaterial = new THREE.MeshLambertMaterial({ color: 0x6B5B3A });

        for (var i = 0; i < 3; i++) {
            var rampartGeo = new THREE.BoxGeometry(30, 1.5 + i * 0.3, 3);
            addMesh(rampartGeo, rampartMaterial, 25, i * 0.8, -40 + i * 10);
        }

        var stakeGeo = new THREE.BufferGeometry();
        var stakePoints = [];
        for (var i = 0; i < 12; i++) {
            var angle = (i / 12) * Math.PI * 2;
            var sx = Math.cos(angle) * 35;
            var sz = Math.sin(angle) * 35;
            stakePoints.push(new THREE.Vector3(sx, 0, sz));
            stakePoints.push(new THREE.Vector3(sx, 1.5, sz));
        }
        stakeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(
            stakePoints.flatMap(p => [p.x, p.y, p.z])
        ), 3));
        var stakeMat = new THREE.LineBasicMaterial({ color: 0x3D2817, linewidth: 2 });
        var stakeLines = new THREE.LineSegments(stakeGeo, stakeMat);
        scene.add(stakeLines);
        objects.push(stakeLines);
    }

    function buildGuardTowers() {
        buildTower(35, 0, -35);
        buildTower(35, 0, 35);
    }

    function buildTower(tx, ty, tz) {
        var baseGeo = new THREE.CylinderGeometry(2, 2.5, 1, 16);
        addMesh(baseGeo, stoneMaterial, tx, ty, tz);

        var wallGeo = new THREE.CylinderGeometry(1.8, 1.8, 4, 16);
        addMesh(wallGeo, stoneMaterial, tx, ty + 2.5, tz);

        var roofGeo = new THREE.ConeGeometry(2.2, 1.5, 16);
        addMesh(roofGeo, stoneMaterial, tx, ty + 5, tz);

        var platformGeo = new THREE.CylinderGeometry(2.2, 2.2, 0.4, 16);
        addMesh(platformGeo, woodMaterial, tx, ty + 4.6, tz);

        for (var i = 0; i < 4; i++) {
            var angle = (i / 4) * Math.PI * 2;
            var cx = tx + Math.cos(angle) * 1.9;
            var cz = tz + Math.sin(angle) * 1.9;
            var crenelGeo = new THREE.BoxGeometry(0.4, 0.8, 0.4);
            addMesh(crenelGeo, stoneMaterial, cx, ty + 4.8, cz);
        }
    }

    function buildPotStorage() {
        var potMaterial = new THREE.MeshLambertMaterial({ color: 0xA0522D });
        var crateMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        var potCount = 0;
        for (var sx = 0; sx < 5; sx++) {
            for (var sz = 0; sz < 6; sz++) {
                var potGeo = new THREE.CylinderGeometry(0.3, 0.35, 0.6, 12);
                addMesh(potGeo, potMaterial, -32 + sx * 1.2, 0.4, 25 + sz * 1.0);
                potCount++;
            }
        }

        for (var i = 0; i < 4; i++) {
            var crateGeo = new THREE.BoxGeometry(1.8, 1.5, 1.8);
            addMesh(crateGeo, crateMaterial, -30 + i * 2.2, 1, 35);
        }

        for (var i = 0; i < 3; i++) {
            var shelveGeo = new THREE.BoxGeometry(3, 0.4, 4);
            addMesh(shelveGeo, woodMaterial, -28, 2 + i * 1.8, 30);
        }
    }

    function setupLighting() {
        var directional = new THREE.DirectionalLight(0xFFD700, 1.2);
        directional.position.set(60, 50, 40);
        directional.castShadow = false;
        addLight(directional);

        var ambient = new THREE.AmbientLight(0x8B6A40, 0.6);
        addLight(ambient);

        var hemispheric = new THREE.HemisphereLight(0xFFC080, 0x4A3820, 0.5);
        addLight(hemispheric);

        var pointLights = [
            { pos: [-25, 5, -15], color: 0xFF8C00, intensity: 1.5 },
            { pos: [-15, 5, -20], color: 0xFF8C00, intensity: 1.5 },
            { pos: [-20, 5, 10], color: 0xFF8C00, intensity: 1.5 },
            { pos: [-35, 5, 5], color: 0xFF8C00, intensity: 1.5 }
        ];

        for (var i = 0; i < pointLights.length; i++) {
            var pl = new THREE.PointLight(pointLights[i].color, pointLights[i].intensity, 25);
            pl.position.set(pointLights[i].pos[0], pointLights[i].pos[1], pointLights[i].pos[2]);
            addLight(pl);
        }
    }

    function update(delta) {
        for (var i = 0; i < smokeParticles.length; i++) {
            var smoke = smokeParticles[i];
            smoke.mesh.position.y += smoke.vy * delta;
            smoke.mesh.position.x += Math.sin(smoke.mesh.position.y * 0.5) * 0.3 * delta;
            smoke.mesh.position.z += Math.cos(smoke.mesh.position.y * 0.3) * 0.3 * delta;

            if (smoke.mesh.position.y > smoke.baseY + 5) {
                smoke.mesh.position.y = smoke.baseY;
            }

            var fadeDistance = 5;
            var timeSinceStart = (smoke.mesh.position.y - smoke.baseY);
            var fadeAlpha = Math.max(0, 1 - (timeSinceStart / fadeDistance));
            smoke.mesh.material.opacity = 0.4 * fadeAlpha;
        }

        for (var i = 0; i < boatStates.length; i++) {
            var boat = boatStates[i];
            boat.phase += 1.5 * delta;
            var bobAmount = Math.sin(boat.phase) * 0.3;
            boat.mesh.position.y = boat.baseY + bobAmount;
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
        smokeParticles = [];
        boatStates = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
