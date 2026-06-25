window.LandsEndBase = (function() {
    'use strict';

    var WORLD_X = 3730;
    var WORLD_Z = 2200;

    function createCliffFace(scene) {
        // Massive granite cliff face dropping to the Atlantic
        var geo = new THREE.BoxGeometry(40, 20, 4);
        var mat = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(WORLD_X + 0, 0, WORLD_Z + 0);
        scene.add(mesh);

        // Cliff edge detail slabs
        var edgeGeo = new THREE.BoxGeometry(40, 6, 2);
        var edgeMat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
        var edgeMesh = new THREE.Mesh(edgeGeo, edgeMat);
        edgeMesh.position.set(WORLD_X + 0, -7, WORLD_Z - 3);
        scene.add(edgeMesh);

        // Cliff base rock pile
        var baseGeo = new THREE.BoxGeometry(44, 8, 6);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(WORLD_X + 0, -14, WORLD_Z - 5);
        scene.add(baseMesh);
    }

    function createSignpost(scene) {
        // Famous yellow signpost post
        var postGeo = new THREE.BoxGeometry(2, 8, 1);
        var postMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
        var postMesh = new THREE.Mesh(postGeo, postMat);
        postMesh.position.set(WORLD_X + 12, 4, WORLD_Z + 10);
        scene.add(postMesh);

        // Sign arm - London direction
        var londonGeo = new THREE.BoxGeometry(6, 1, 1);
        var londonMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
        var londonMesh = new THREE.Mesh(londonGeo, londonMat);
        londonMesh.position.set(WORLD_X + 15, 9, WORLD_Z + 10);
        scene.add(londonMesh);

        // Sign arm - New York direction
        var nyGeo = new THREE.BoxGeometry(7, 1, 1);
        var nyMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
        var nyMesh = new THREE.Mesh(nyGeo, nyMat);
        nyMesh.position.set(WORLD_X + 8, 7, WORLD_Z + 10);
        scene.add(nyMesh);

        // Sign arm - John o Groats direction
        var jogGeo = new THREE.BoxGeometry(8, 1, 1);
        var jogMat = new THREE.MeshLambertMaterial({ color: 0xFFCC00 });
        var jogMesh = new THREE.Mesh(jogGeo, jogMat);
        jogMesh.position.set(WORLD_X + 16, 5, WORLD_Z + 10);
        scene.add(jogMesh);

        // Signpost cap
        var capGeo = new THREE.BoxGeometry(2, 1, 1);
        var capMat = new THREE.MeshLambertMaterial({ color: 0xFFAA00 });
        var capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(WORLD_X + 12, 8.5, WORLD_Z + 10);
        scene.add(capMesh);
    }

    function createLighthouse(scene) {
        // Rocky outcrop island base
        var islandGeo = new THREE.CylinderGeometry(4, 5, 3, 8);
        var islandMat = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });
        var islandMesh = new THREE.Mesh(islandGeo, islandMat);
        islandMesh.position.set(WORLD_X - 30, -4, WORLD_Z - 20);
        scene.add(islandMesh);

        // Lighthouse tower
        var towerGeo = new THREE.CylinderGeometry(1.5, 1.8, 20, 10);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F5 });
        var towerMesh = new THREE.Mesh(towerGeo, towerMat);
        towerMesh.position.set(WORLD_X - 30, 9, WORLD_Z - 20);
        scene.add(towerMesh);

        // Lighthouse lantern room
        var lanternGeo = new THREE.CylinderGeometry(2, 1.5, 3, 8);
        var lanternMat = new THREE.MeshLambertMaterial({ color: 0xCCCCCC });
        var lanternMesh = new THREE.Mesh(lanternGeo, lanternMat);
        lanternMesh.position.set(WORLD_X - 30, 20.5, WORLD_Z - 20);
        scene.add(lanternMesh);

        // Lighthouse dome
        var domeGeo = new THREE.SphereGeometry(2, 8, 6);
        var domeMat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
        var domeMesh = new THREE.Mesh(domeGeo, domeMat);
        domeMesh.position.set(WORLD_X - 30, 22.5, WORLD_Z - 20);
        scene.add(domeMesh);

        // Lighthouse red stripe band
        var band1Geo = new THREE.CylinderGeometry(1.6, 1.6, 2, 10);
        var band1Mat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
        var band1Mesh = new THREE.Mesh(band1Geo, band1Mat);
        band1Mesh.position.set(WORLD_X - 30, 5, WORLD_Z - 20);
        scene.add(band1Mesh);

        var band2Geo = new THREE.CylinderGeometry(1.6, 1.6, 2, 10);
        var band2Mat = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
        var band2Mesh = new THREE.Mesh(band2Geo, band2Mat);
        band2Mesh.position.set(WORLD_X - 30, 14, WORLD_Z - 20);
        scene.add(band2Mesh);
    }

    function createArmedKnight(scene) {
        // Main granite pillar sea stack
        var pillarGeo = new THREE.BoxGeometry(3, 16, 4);
        var pillarMat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
        var pillarMesh = new THREE.Mesh(pillarGeo, pillarMat);
        pillarMesh.position.set(WORLD_X - 18, 0, WORLD_Z - 15);
        scene.add(pillarMesh);

        // Sea stack top cap irregular rock
        var capGeo = new THREE.BoxGeometry(4, 3, 5);
        var capMat = new THREE.MeshLambertMaterial({ color: 0x5A5A5A });
        var capMesh = new THREE.Mesh(capGeo, capMat);
        capMesh.position.set(WORLD_X - 18, 9, WORLD_Z - 15);
        scene.add(capMesh);

        // Sea stack base submerged rocks
        var baseGeo = new THREE.BoxGeometry(6, 4, 7);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });
        var baseMesh = new THREE.Mesh(baseGeo, baseMat);
        baseMesh.position.set(WORLD_X - 18, -10, WORLD_Z - 15);
        scene.add(baseMesh);

        // Secondary smaller rock to the side
        var rock2Geo = new THREE.BoxGeometry(2, 8, 2);
        var rock2Mat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
        var rock2Mesh = new THREE.Mesh(rock2Geo, rock2Mat);
        rock2Mesh.position.set(WORLD_X - 21, -4, WORLD_Z - 14);
        scene.add(rock2Mesh);
    }

    function createMinackTheatre(scene) {
        // Tiered stone seating rows descending the cliff face
        var rowColors = [0x9A8A78, 0x8A7A68, 0x9A8A78, 0x8A7A68, 0x9A8A78, 0x8A7A68, 0x9A8A78, 0x8A7A68];

        var i;
        for (i = 0; i < 8; i++) {
            var rowGeo = new THREE.BoxGeometry(20, 1.2, 3);
            var rowMat = new THREE.MeshLambertMaterial({ color: rowColors[i] });
            var rowMesh = new THREE.Mesh(rowGeo, rowMat);
            rowMesh.position.set(WORLD_X + 30, 8 - (i * 2.5), WORLD_Z + (i * 3.5));
            scene.add(rowMesh);

            // Row riser stone face
            var riserGeo = new THREE.BoxGeometry(20, 1.2, 0.5);
            var riserMat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });
            var riserMesh = new THREE.Mesh(riserGeo, riserMat);
            riserMesh.position.set(WORLD_X + 30, 7.4 - (i * 2.5), WORLD_Z + (i * 3.5) + 1.5);
            scene.add(riserMesh);
        }

        // Stage box at the bottom
        var stageGeo = new THREE.BoxGeometry(22, 1, 8);
        var stageMat = new THREE.MeshLambertMaterial({ color: 0xBBAA99 });
        var stageMesh = new THREE.Mesh(stageGeo, stageMat);
        stageMesh.position.set(WORLD_X + 30, -11.5, WORLD_Z + 32);
        scene.add(stageMesh);

        // Stage wings left
        var wingLGeo = new THREE.BoxGeometry(3, 3, 8);
        var wingLMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var wingLMesh = new THREE.Mesh(wingLGeo, wingLMat);
        wingLMesh.position.set(WORLD_X + 19.5, -10, WORLD_Z + 32);
        scene.add(wingLMesh);

        // Stage wings right
        var wingRGeo = new THREE.BoxGeometry(3, 3, 8);
        var wingRMat = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
        var wingRMesh = new THREE.Mesh(wingRGeo, wingRMat);
        wingRMesh.position.set(WORLD_X + 40.5, -10, WORLD_Z + 32);
        scene.add(wingRMesh);

        // Retaining wall along the cliff side
        var wallGeo = new THREE.BoxGeometry(1, 20, 32);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
        var wallMesh = new THREE.Mesh(wallGeo, wallMat);
        wallMesh.position.set(WORLD_X + 41.5, -2, WORLD_Z + 18);
        scene.add(wallMesh);
    }

    function createTelegraphStation(scene) {
        // Main Victorian cable station building
        var buildingGeo = new THREE.BoxGeometry(14, 5, 10);
        var buildingMat = new THREE.MeshLambertMaterial({ color: 0xD4A97A });
        var buildingMesh = new THREE.Mesh(buildingGeo, buildingMat);
        buildingMesh.position.set(WORLD_X + 20, 2.5, WORLD_Z + 25);
        scene.add(buildingMesh);

        // Roof
        var roofGeo = new THREE.BoxGeometry(15, 1.5, 11);
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var roofMesh = new THREE.Mesh(roofGeo, roofMat);
        roofMesh.position.set(WORLD_X + 20, 5.75, WORLD_Z + 25);
        scene.add(roofMesh);

        // Roof ridge
        var ridgeGeo = new THREE.BoxGeometry(14, 2, 1);
        var ridgeMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var ridgeMesh = new THREE.Mesh(ridgeGeo, ridgeMat);
        ridgeMesh.position.set(WORLD_X + 20, 7, WORLD_Z + 25);
        scene.add(ridgeMesh);

        // Chimney
        var chimneyGeo = new THREE.BoxGeometry(1.5, 4, 1.5);
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0xAA6644 });
        var chimneyMesh = new THREE.Mesh(chimneyGeo, chimneyMat);
        chimneyMesh.position.set(WORLD_X + 24, 9, WORLD_Z + 25);
        scene.add(chimneyMesh);

        // Cable conduit running towards coast
        var conduitGeo = new THREE.BoxGeometry(1, 0.5, 20);
        var conduitMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var conduitMesh = new THREE.Mesh(conduitGeo, conduitMat);
        conduitMesh.position.set(WORLD_X + 20, 0.25, WORLD_Z + 12);
        scene.add(conduitMesh);

        // Side annexe building
        var annexeGeo = new THREE.BoxGeometry(6, 4, 8);
        var annexeMat = new THREE.MeshLambertMaterial({ color: 0xC49060 });
        var annexeMesh = new THREE.Mesh(annexeGeo, annexeMat);
        annexeMesh.position.set(WORLD_X + 30, 2, WORLD_Z + 25);
        scene.add(annexeMesh);

        // Telegraph pole near station
        var poleGeo = new THREE.CylinderGeometry(0.15, 0.2, 10, 6);
        var poleMat = new THREE.MeshLambertMaterial({ color: 0x5A3A1A });
        var poleMesh = new THREE.Mesh(poleGeo, poleMat);
        poleMesh.position.set(WORLD_X + 16, 5, WORLD_Z + 22);
        scene.add(poleMesh);

        // Telegraph pole crossarm
        var crossarmGeo = new THREE.BoxGeometry(4, 0.3, 0.3);
        var crossarmMat = new THREE.MeshLambertMaterial({ color: 0x5A3A1A });
        var crossarmMesh = new THREE.Mesh(crossarmGeo, crossarmMat);
        crossarmMesh.position.set(WORLD_X + 16, 9.5, WORLD_Z + 22);
        scene.add(crossarmMesh);
    }

    function createAtlanticRocks(scene) {
        // Scattered sea rocks and outcrops around Land's End point
        var rocks = [
            { x: -10, y: -8, z: -8, w: 5, h: 3, d: 4 },
            { x: -5,  y: -9, z: -12, w: 3, h: 2, d: 3 },
            { x: -22, y: -7, z: -5,  w: 4, h: 4, d: 3 },
            { x: 8,   y: -9, z: -10, w: 3, h: 2, d: 4 },
            { x: -35, y: -6, z: -8,  w: 6, h: 5, d: 5 },
            { x: -14, y: -8, z: -18, w: 4, h: 3, d: 3 }
        ];

        var j;
        for (j = 0; j < rocks.length; j++) {
            var r = rocks[j];
            var rockGeo = new THREE.BoxGeometry(r.w, r.h, r.d);
            var rockMat = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
            var rockMesh = new THREE.Mesh(rockGeo, rockMat);
            rockMesh.position.set(WORLD_X + r.x, r.y, WORLD_Z + r.z);
            scene.add(rockMesh);
        }
    }

    function createGroundPlane(scene) {
        // Clifftop ground — thin box stand-in
        var groundGeo = new THREE.BoxGeometry(80, 1, 80);
        var groundMat = new THREE.MeshLambertMaterial({ color: 0x5A7A3A });
        var groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.position.set(WORLD_X + 20, -0.5, WORLD_Z + 20);
        scene.add(groundMesh);

        // Granite path
        var pathGeo = new THREE.BoxGeometry(3, 0.6, 30);
        var pathMat = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
        var pathMesh = new THREE.Mesh(pathGeo, pathMat);
        pathMesh.position.set(WORLD_X + 12, 0.3, WORLD_Z + 18);
        scene.add(pathMesh);
    }

    function build(scene) {
        createGroundPlane(scene);
        createCliffFace(scene);
        createSignpost(scene);
        createLighthouse(scene);
        createArmedKnight(scene);
        createMinackTheatre(scene);
        createTelegraphStation(scene);
        createAtlanticRocks(scene);
    }

    return {
        build: build,
        WORLD_X: WORLD_X,
        WORLD_Z: WORLD_Z
    };

}());
