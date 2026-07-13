window.FlintWall = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];
    var excavationArm = null;
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

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        time = 0;

        buildGroundTerrain();
        buildFlintWalls();
        buildTowers();
        buildExcavationPits();
        buildArtifactShelters();
        buildMilitaryTents();
        buildSniperPositions();
        buildFlintDeposits();
        setupLighting();
    }

    function buildGroundTerrain() {
        var groundMat = new THREE.MeshLambertMaterial({ color: 0xCCBB99 });
        var tileSize = 40;
        var tileCount = 8;
        var spacing = 5;

        for (var gx = 0; gx < tileCount; gx++) {
            for (var gz = 0; gz < tileCount; gz++) {
                var geoGround = new THREE.BoxGeometry(spacing, 0.5, spacing);
                var posX = gx * spacing - (tileCount * spacing) / 2;
                var posZ = gz * spacing - (tileCount * spacing) / 2;
                addMesh(geoGround, groundMat, posX, 0, posZ);
            }
        }

        var flintChipMat = new THREE.MeshLambertMaterial({ color: 0x998844 });
        for (var i = 0; i < 30; i++) {
            var chipGeo = new THREE.BoxGeometry(0.3, 0.1, 0.2);
            var chipX = Math.random() * 30 - 15;
            var chipZ = Math.random() * 30 - 15;
            addMesh(chipGeo, flintChipMat, chipX, 0.3, chipZ);
        }
    }

    function buildFlintWalls() {
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x888877 });
        var blockW = 2;
        var blockH = 1.5;
        var blockD = 1;

        var perimeter = [
            { x: 0, z: -20, len: 30, rot: 0 },
            { x: 15, z: 0, len: 30, rot: Math.PI / 2 },
            { x: 0, z: 20, len: 30, rot: 0 },
            { x: -15, z: 0, len: 30, rot: Math.PI / 2 }
        ];

        for (var p = 0; p < perimeter.length; p++) {
            var segment = perimeter[p];
            var isVert = Math.abs(segment.rot) > 0.1;
            var stepSize = isVert ? blockW : blockW;
            var blockCount = Math.floor(segment.len / stepSize);

            for (var b = 0; b < blockCount; b++) {
                if (Math.random() > 0.1) {
                    var offsetX = isVert ? segment.x : segment.x + (b - blockCount / 2) * stepSize;
                    var offsetZ = isVert ? segment.z + (b - blockCount / 2) * stepSize : segment.z;

                    var blockHeight = 1 + Math.floor(Math.random() * 3);

                    for (var layer = 0; layer < blockHeight; layer++) {
                        var wallBlockGeo = new THREE.BoxGeometry(blockW, blockH, blockD);
                        addMesh(wallBlockGeo, wallMat, offsetX, blockH / 2 + layer * blockH, offsetZ);
                    }
                }
            }
        }

        var tallWallIndices = [5, 15, 25, 35];
        for (var tw = 0; tw < tallWallIndices.length; tw++) {
            var idx = tallWallIndices[tw];
            var tallX = Math.sin(idx * 0.3) * 15;
            var tallZ = Math.cos(idx * 0.3) * 15;
            for (var tl = 0; tl < 6; tl++) {
                var tallGeo = new THREE.BoxGeometry(2, 1.5, 1);
                addMesh(tallGeo, wallMat, tallX, 1.5 + tl * 1.5, tallZ);
            }
        }
    }

    function buildTowers() {
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x777766 });
        var capMat = new THREE.MeshLambertMaterial({ color: 0x666655 });

        var towerPositions = [
            { x: 15, z: 15 },
            { x: -15, z: 15 },
            { x: -15, z: -15 }
        ];

        for (var tower = 0; tower < towerPositions.length; tower++) {
            var pos = towerPositions[tower];

            var towerBaseGeo = new THREE.CylinderGeometry(2, 2.5, 8, 8);
            addMesh(towerBaseGeo, towerMat, pos.x, 4, pos.z);

            var capGeo = new THREE.BoxGeometry(4, 1, 4);
            addMesh(capGeo, capMat, pos.x, 8.5, pos.z);

            for (var cap = 0; cap < 4; cap++) {
                var capBlockGeo = new THREE.BoxGeometry(1.5, 0.8, 1);
                var capX = pos.x + Math.cos(cap * Math.PI / 2) * 1.5;
                var capZ = pos.z + Math.sin(cap * Math.PI / 2) * 1.5;
                addMesh(capBlockGeo, capMat, capX, 9.5, capZ);
            }
        }
    }

    function buildExcavationPits() {
        var pitMat = new THREE.MeshLambertMaterial({ color: 0xAA9966 });
        var ropeColor = 0x8B4513;
        var crateMat = new THREE.MeshLambertMaterial({ color: 0xDEB887 });

        var pitPositions = [
            { x: -10, z: -10 },
            { x: 5, z: -8 },
            { x: 8, z: 5 },
            { x: -8, z: 8 },
            { x: 0, z: 0 }
        ];

        for (var pit = 0; pit < pitPositions.length; pit++) {
            var ppos = pitPositions[pit];

            var pitGeo = new THREE.BoxGeometry(6, 2, 6);
            addMesh(pitGeo, pitMat, ppos.x, -0.5, ppos.z);

            var ropeGeometry = new THREE.BufferGeometry();
            var ropeVertices = new Float32Array([
                ppos.x - 2.5, 2, ppos.z - 2.5,
                ppos.x + 2.5, 2, ppos.z - 2.5,
                ppos.x + 2.5, 2, ppos.z + 2.5,
                ppos.x - 2.5, 2, ppos.z + 2.5,
                ppos.x - 2.5, 2, ppos.z - 2.5
            ]);
            ropeGeometry.setAttribute('position', new THREE.BufferAttribute(ropeVertices, 3));
            var ropeLineMat = new THREE.LineBasicMaterial({ color: ropeColor });
            var ropeLine = new THREE.LineSegments(ropeGeometry, ropeLineMat);
            scene.add(ropeLine);
            objects.push(ropeLine);

            for (var crate = 0; crate < 2; crate++) {
                var crateGeo = new THREE.BoxGeometry(1.5, 1.2, 1.5);
                var crateX = ppos.x - 1.5 + crate * 1.5;
                var crateZ = ppos.z - 1.5;
                addMesh(crateGeo, crateMat, crateX, 0.5, crateZ);
            }
        }

        excavationArm = buildExcavationArm(-10, 3, -10);
    }

    function buildExcavationArm() {
        var armMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var basePosX = -10;
        var basePosY = 3;
        var basePosZ = -10;

        var armBase = new THREE.Group();
        var baseMesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), armMat);
        armBase.add(baseMesh);
        armBase.position.set(basePosX, basePosY, basePosZ);

        var armSegment = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), armMat);
        armSegment.position.y = 2;
        armBase.add(armSegment);

        scene.add(armBase);
        objects.push(armBase);

        return armBase;
    }

    function buildArtifactShelters() {
        var frameMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0xFFFACD });

        var shelterPositions = [
            { x: 10, z: -5 },
            { x: -5, z: 10 },
            { x: -10, z: -5 }
        ];

        for (var shelter = 0; shelter < shelterPositions.length; shelter++) {
            var spos = shelterPositions[shelter];

            for (var frame = 0; frame < 4; frame++) {
                var frameGeo = new THREE.BoxGeometry(0.3, 3, 0.3);
                var frameX = spos.x + (frame % 2) * 3 - 1.5;
                var frameZ = spos.z + Math.floor(frame / 2) * 3 - 1.5;
                addMesh(frameGeo, frameMat, frameX, 1.5, frameZ);
            }

            var roofGeo = new THREE.BoxGeometry(4, 0.5, 4);
            addMesh(roofGeo, roofMat, spos.x, 3.5, spos.z);

            for (var roofPanel = 0; roofPanel < 2; roofPanel++) {
                var panelGeo = new THREE.BoxGeometry(4, 2, 0.5);
                var panelZ = spos.z + (roofPanel - 0.5) * 2;
                addMesh(panelGeo, roofMat, spos.x, 2.5, panelZ);
            }
        }
    }

    function buildMilitaryTents() {
        var tentBodyMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var tentRoofMat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
        var equipMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });

        var tentPositions = [
            { x: -12, z: 12 },
            { x: -8, z: 12 },
            { x: -4, z: 12 },
            { x: 0, z: 12 },
            { x: 12, z: -10 },
            { x: 12, z: -6 },
            { x: 12, z: -2 },
            { x: 12, z: 2 }
        ];

        for (var tent = 0; tent < tentPositions.length; tent++) {
            var tpos = tentPositions[tent];

            var tentBodyGeo = new THREE.BoxGeometry(3, 2.5, 3);
            addMesh(tentBodyGeo, tentBodyMat, tpos.x, 1.25, tpos.z);

            var roofGeo = new THREE.BoxGeometry(3.2, 1.5, 0.3);
            addMesh(roofGeo, tentRoofMat, tpos.x, 3, tpos.z - 1.5);

            var roofGeo2 = new THREE.BoxGeometry(3.2, 1.5, 0.3);
            addMesh(roofGeo2, tentRoofMat, tpos.x, 3, tpos.z + 1.5);

            if (tent % 2 === 0) {
                var equipGeo = new THREE.BoxGeometry(1, 1, 1);
                addMesh(equipGeo, equipMat, tpos.x - 2.5, 0.5, tpos.z - 2.5);
            }
        }
    }

    function buildSniperPositions() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x999988 });
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x996633 });

        var sniperPositions = [
            { x: 18, z: 15 },
            { x: -18, z: 15 },
            { x: -18, z: -18 },
            { x: 15, z: -18 }
        ];

        for (var sniper = 0; sniper < sniperPositions.length; sniper++) {
            var spos = sniperPositions[sniper];

            var platformGeo = new THREE.BoxGeometry(6, 0.8, 6);
            addMesh(platformGeo, stoneMat, spos.x, 6.5, spos.z);

            for (var support = 0; support < 4; support++) {
                var supportGeo = new THREE.CylinderGeometry(0.4, 0.5, 6, 6);
                var supX = spos.x + (support % 2) * 2.5 - 1.25;
                var supZ = spos.z + Math.floor(support / 2) * 2.5 - 1.25;
                addMesh(supportGeo, stoneMat, supX, 3, supZ);
            }

            for (var sandbag = 0; sandbag < 5; sandbag++) {
                var sandbagGeo = new THREE.BoxGeometry(1.5, 0.8, 0.8);
                var sbX = spos.x - 2 + sandbag * 0.9;
                addMesh(sandbagGeo, sandbagMat, sbX, 7, spos.z - 2.5);
            }
        }
    }

    function buildFlintDeposits() {
        var flintMat = new THREE.MeshLambertMaterial({ color: 0x666655 });
        var exposedMat = new THREE.MeshLambertMaterial({ color: 0x555544 });

        for (var deposit = 0; deposit < 12; deposit++) {
            var depX = Math.sin(deposit * 0.5) * 16;
            var depZ = Math.cos(deposit * 0.5) * 16;

            var noduleGeo = new THREE.SphereGeometry(1.2, 6, 6);
            addMesh(noduleGeo, flintMat, depX, 1, depZ);

            var exposedGeo = new THREE.BoxGeometry(1.5, 0.6, 1.5);
            addMesh(exposedGeo, exposedMat, depX, 1.5, depZ + 1);

            for (var fragment = 0; fragment < 2; fragment++) {
                var fragGeo = new THREE.BoxGeometry(0.5, 0.2, 0.4);
                var fragX = depX - 1 + fragment * 2;
                var fragZ = depZ - 1 + Math.random() * 0.5;
                addMesh(fragGeo, flintMat, fragX, 0.8, fragZ);
            }
        }
    }

    function setupLighting() {
        var ambientLight = new THREE.AmbientLight(0x8B7040, 0.5);
        addLight(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFD700, 0.6);
        directionalLight.position.set(10, 15, 10);
        addLight(directionalLight);

        var workLampPositions = [
            { x: -10, y: 4, z: -10 },
            { x: 10, y: 4, z: -10 },
            { x: -10, y: 4, z: 10 },
            { x: 10, y: 4, z: 10 },
            { x: 0, y: 5, z: 0 }
        ];

        for (var lamp = 0; lamp < workLampPositions.length; lamp++) {
            var lpos = workLampPositions[lamp];
            var pointLight = new THREE.PointLight(0xFFE066, 0.8, 20);
            pointLight.position.set(lpos.x, lpos.y, lpos.z);
            addLight(pointLight);
        }
    }

    function update(delta) {
        time += delta;

        if (excavationArm) {
            var armOffset = Math.sin(time * 0.8) * 0.5;
            if (excavationArm.children[1]) {
                excavationArm.children[1].position.y = 2 + armOffset;
            }
        }

        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += 0.0001 * delta;
            }
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
        excavationArm = null;
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
