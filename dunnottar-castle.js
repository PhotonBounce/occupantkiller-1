window.DunnottarCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var seabirds = [];
    var birdTime = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        seabirds = [];
        birdTime = 0;
        build();
    }

    function makeMesh(geo, color, x, y, z, rx, ry, rz) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx) mesh.rotation.x = rx;
        if (ry) mesh.rotation.y = ry;
        if (rz) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var cx = 20440;

        // -------------------------------------------------------
        // NORTH SEA — vast ocean floor surrounding cliff on three sides
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(1200, 4, 1200), 0x005577, cx, -52, 0);
        makeMesh(new THREE.BoxGeometry(600, 6, 400), 0x004466, cx - 400, -50, 200);
        makeMesh(new THREE.BoxGeometry(500, 6, 300), 0x003355, cx + 350, -50, -150);
        makeMesh(new THREE.BoxGeometry(400, 5, 500), 0x004477, cx - 300, -50, -300);
        // deeper trench patches
        makeMesh(new THREE.BoxGeometry(200, 8, 200), 0x002244, cx - 200, -56, 300);
        makeMesh(new THREE.BoxGeometry(180, 8, 180), 0x002244, cx + 250, -56, 280);

        // -------------------------------------------------------
        // SEA STACK / CLIFFTOP PROMONTORY — layered rock base
        // -------------------------------------------------------
        // Main stack base — massive foundation
        makeMesh(new THREE.BoxGeometry(260, 60, 200), 0x5a4a3a, cx, -20, 0);
        // Second tier narrowing
        makeMesh(new THREE.BoxGeometry(230, 30, 175), 0x5a4a3a, cx + 5, 20, 0);
        // Top plateau
        makeMesh(new THREE.BoxGeometry(200, 18, 150), 0x6a5a4a, cx + 5, 44, 0);
        // Sheer cliff face blocks — south side
        makeMesh(new THREE.BoxGeometry(240, 55, 20), 0x4a3a2a, cx, -2, -90);
        // Sheer cliff face — north side
        makeMesh(new THREE.BoxGeometry(240, 55, 20), 0x4a3a2a, cx, -2, 90);
        // Sheer cliff face — east side
        makeMesh(new THREE.BoxGeometry(20, 55, 160), 0x4a3a2a, cx + 120, -2, 0);
        // Western approach — narrow neck of land connecting to mainland
        makeMesh(new THREE.BoxGeometry(80, 15, 40), 0x5a4a3a, cx - 150, 6, 0);
        // Approach ramp slight grade — stepped
        makeMesh(new THREE.BoxGeometry(60, 10, 35), 0x5a4a3a, cx - 190, 1, 0);
        makeMesh(new THREE.BoxGeometry(50, 6, 32), 0x6a5a4a, cx - 220, -4, 0);

        // Rock outcrop lumps on cliff face for realism
        makeMesh(new THREE.BoxGeometry(30, 20, 18), 0x4a3a2a, cx + 100, 10, 40);
        makeMesh(new THREE.BoxGeometry(25, 15, 22), 0x4a3a2a, cx + 105, 5, -35);
        makeMesh(new THREE.BoxGeometry(20, 25, 15), 0x3a2a1a, cx - 100, 0, 70);
        makeMesh(new THREE.BoxGeometry(18, 20, 20), 0x3a2a1a, cx - 95, 5, -60);

        // Natural arch cut through cliff — two pillars and lintel
        makeMesh(new THREE.BoxGeometry(12, 35, 18), 0x3a2a1a, cx + 90, -10, 80);
        makeMesh(new THREE.BoxGeometry(12, 35, 18), 0x3a2a1a, cx + 110, -10, 80);
        makeMesh(new THREE.BoxGeometry(32, 8, 18), 0x3a2a1a, cx + 100, 7, 80);

        // -------------------------------------------------------
        // SEA CAVES — dark openings in cliff base
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(22, 16, 12), 0x222211, cx + 70, -38, 92);
        makeMesh(new THREE.BoxGeometry(16, 12, 10), 0x111100, cx + 85, -40, 93);
        makeMesh(new THREE.BoxGeometry(18, 14, 12), 0x222211, cx - 60, -38, -90);
        makeMesh(new THREE.BoxGeometry(14, 10, 10), 0x111100, cx - 72, -40, -91);

        // -------------------------------------------------------
        // DUNNOTTAR KEEP — L-shaped medieval tower keep
        // -------------------------------------------------------
        // Main keep body
        makeMesh(new THREE.BoxGeometry(40, 45, 30), 0x8B7355, cx + 30, 76, 10);
        // L-shaped wing
        makeMesh(new THREE.BoxGeometry(22, 45, 25), 0x8B7355, cx + 8, 76, 25);
        // Keep battlements — merlons along top
        makeMesh(new THREE.BoxGeometry(5, 6, 30), 0x7a6345, cx + 12, 100, 10);
        makeMesh(new THREE.BoxGeometry(5, 6, 30), 0x7a6345, cx + 20, 100, 10);
        makeMesh(new THREE.BoxGeometry(5, 6, 30), 0x7a6345, cx + 28, 100, 10);
        makeMesh(new THREE.BoxGeometry(5, 6, 30), 0x7a6345, cx + 36, 100, 10);
        makeMesh(new THREE.BoxGeometry(5, 6, 30), 0x7a6345, cx + 44, 100, 10);
        // Side battlements
        makeMesh(new THREE.BoxGeometry(40, 6, 5), 0x7a6345, cx + 30, 100, -2);
        makeMesh(new THREE.BoxGeometry(40, 6, 5), 0x7a6345, cx + 30, 100, 22);
        // Keep entrance arch
        makeMesh(new THREE.BoxGeometry(8, 12, 4), 0x6a5345, cx + 14, 60, -5);

        // -------------------------------------------------------
        // GREAT TOWER — tall separate square tower
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(22, 60, 22), 0x8B7355, cx + 60, 84, -40);
        // Tower top platform
        makeMesh(new THREE.BoxGeometry(26, 4, 26), 0x7a6345, cx + 60, 115, -40);
        // Tower battlements — four sides
        makeMesh(new THREE.BoxGeometry(26, 7, 5), 0x7a6345, cx + 60, 119, -52);
        makeMesh(new THREE.BoxGeometry(26, 7, 5), 0x7a6345, cx + 60, 119, -28);
        makeMesh(new THREE.BoxGeometry(5, 7, 26), 0x7a6345, cx + 47, 119, -40);
        makeMesh(new THREE.BoxGeometry(5, 7, 26), 0x7a6345, cx + 73, 119, -40);
        // Tower arrow loops
        makeMesh(new THREE.BoxGeometry(2, 6, 3), 0x3a2a1a, cx + 60, 95, -51);
        makeMesh(new THREE.BoxGeometry(2, 6, 3), 0x3a2a1a, cx + 60, 80, -51);
        makeMesh(new THREE.BoxGeometry(3, 6, 2), 0x3a2a1a, cx + 74, 95, -40);

        // -------------------------------------------------------
        // CHAPEL RUINS — roofless with pointed window arches
        // -------------------------------------------------------
        // Chapel walls
        makeMesh(new THREE.BoxGeometry(35, 20, 4), 0x8B7355, cx - 20, 64, -50);
        makeMesh(new THREE.BoxGeometry(35, 20, 4), 0x8B7355, cx - 20, 64, -22);
        makeMesh(new THREE.BoxGeometry(4, 20, 32), 0x8B7355, cx - 37, 64, -36);
        makeMesh(new THREE.BoxGeometry(4, 20, 32), 0x8B7355, cx - 3, 64, -36);
        // Pointed arch window shapes — box pairs forming pointed arches
        makeMesh(new THREE.BoxGeometry(6, 10, 5), 0x3a2a1a, cx - 28, 68, -49);
        makeMesh(new THREE.BoxGeometry(6, 10, 5), 0x3a2a1a, cx - 14, 68, -49);
        // Arch capstone
        makeMesh(new THREE.BoxGeometry(5, 4, 5), 0x8B7355, cx - 21, 78, -49);
        makeMesh(new THREE.BoxGeometry(5, 4, 5), 0x8B7355, cx - 7, 78, -49);
        // Ruined partial east wall
        makeMesh(new THREE.BoxGeometry(4, 12, 14), 0x8B7355, cx - 3, 60, -29);

        // -------------------------------------------------------
        // WATERTON'S LODGING — residential range, 16th-century windows
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(50, 28, 18), 0x9B8365, cx - 20, 68, 35);
        // Large window openings — dark recesses
        makeMesh(new THREE.BoxGeometry(6, 9, 4), 0x2a1a0a, cx - 35, 72, 27);
        makeMesh(new THREE.BoxGeometry(6, 9, 4), 0x2a1a0a, cx - 22, 72, 27);
        makeMesh(new THREE.BoxGeometry(6, 9, 4), 0x2a1a0a, cx - 9, 72, 27);
        makeMesh(new THREE.BoxGeometry(6, 9, 4), 0x2a1a0a, cx + 4, 72, 27);
        // Upper floor windows
        makeMesh(new THREE.BoxGeometry(6, 7, 4), 0x2a1a0a, cx - 35, 82, 27);
        makeMesh(new THREE.BoxGeometry(6, 7, 4), 0x2a1a0a, cx - 22, 82, 27);
        makeMesh(new THREE.BoxGeometry(6, 7, 4), 0x2a1a0a, cx - 9, 82, 27);
        // Waterton gable ends
        makeMesh(new THREE.BoxGeometry(18, 10, 4), 0x9B8365, cx - 45, 82, 35);
        makeMesh(new THREE.ConeGeometry(11, 12, 4), 0x7a6345, cx - 45, 97, 35);
        makeMesh(new THREE.BoxGeometry(18, 10, 4), 0x9B8365, cx + 5, 82, 35);
        makeMesh(new THREE.ConeGeometry(11, 12, 4), 0x7a6345, cx + 5, 97, 35);

        // -------------------------------------------------------
        // STABLES RANGE — long low building across inner ward
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(80, 16, 16), 0x8B7355, cx, 62, -10);
        // Stable roof ridge line
        makeMesh(new THREE.BoxGeometry(82, 3, 3), 0x6a5345, cx, 71, -10);
        // Stable door openings
        makeMesh(new THREE.BoxGeometry(5, 9, 5), 0x2a1a0a, cx - 28, 59, -3);
        makeMesh(new THREE.BoxGeometry(5, 9, 5), 0x2a1a0a, cx - 10, 59, -3);
        makeMesh(new THREE.BoxGeometry(5, 9, 5), 0x2a1a0a, cx + 10, 59, -3);
        makeMesh(new THREE.BoxGeometry(5, 9, 5), 0x2a1a0a, cx + 28, 59, -3);

        // -------------------------------------------------------
        // CANNON EMPLACEMENTS — on cliff edge
        // -------------------------------------------------------
        // Emplacement platform east side
        makeMesh(new THREE.BoxGeometry(20, 6, 16), 0x888888, cx + 90, 55, -20);
        // Cannon barrels — cylinders pointing east
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 18, 8), 0x555555, cx + 98, 57, -18, 0, 0, Math.PI / 2);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 18, 8), 0x555555, cx + 98, 57, -25, 0, 0, Math.PI / 2);
        // Cannon wheels
        makeMesh(new THREE.CylinderGeometry(3, 3, 2, 8), 0x443322, cx + 92, 55, -18, Math.PI / 2, 0, 0);
        makeMesh(new THREE.CylinderGeometry(3, 3, 2, 8), 0x443322, cx + 92, 55, -25, Math.PI / 2, 0, 0);
        // Second emplacement north side
        makeMesh(new THREE.BoxGeometry(16, 6, 20), 0x888888, cx - 30, 55, 85);
        makeMesh(new THREE.CylinderGeometry(1.5, 2, 18, 8), 0x555555, cx - 30, 57, 93, Math.PI / 2, 0, 0);
        makeMesh(new THREE.CylinderGeometry(3, 3, 2, 8), 0x443322, cx - 30, 55, 88, 0, 0, Math.PI / 2);

        // -------------------------------------------------------
        // OUTER GATEHOUSE AND CURTAIN WALL
        // -------------------------------------------------------
        // West gatehouse
        makeMesh(new THREE.BoxGeometry(18, 28, 18), 0x8B7355, cx - 90, 65, 0);
        // Gatehouse battlements
        makeMesh(new THREE.BoxGeometry(20, 6, 20), 0x7a6345, cx - 90, 80, 0);
        // Gate arch opening
        makeMesh(new THREE.BoxGeometry(7, 12, 20), 0x1a0a00, cx - 90, 60, 0);
        // Curtain wall segments
        makeMesh(new THREE.BoxGeometry(4, 18, 55), 0x8B7355, cx - 70, 62, 35);
        makeMesh(new THREE.BoxGeometry(4, 18, 55), 0x8B7355, cx - 70, 62, -35);
        // Wall walk merlons
        makeMesh(new THREE.BoxGeometry(5, 6, 4), 0x7a6345, cx - 70, 72, 10);
        makeMesh(new THREE.BoxGeometry(5, 6, 4), 0x7a6345, cx - 70, 72, 20);
        makeMesh(new THREE.BoxGeometry(5, 6, 4), 0x7a6345, cx - 70, 72, 30);
        makeMesh(new THREE.BoxGeometry(5, 6, 4), 0x7a6345, cx - 70, 72, -10);
        makeMesh(new THREE.BoxGeometry(5, 6, 4), 0x7a6345, cx - 70, 72, -20);

        // -------------------------------------------------------
        // CLIFF PATH — narrow descending path to gate
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(8, 3, 60), 0xAA9988, cx - 130, 18, 0);
        makeMesh(new THREE.BoxGeometry(8, 3, 50), 0xAA9988, cx - 165, 8, 5);
        makeMesh(new THREE.BoxGeometry(8, 3, 40), 0x9a8878, cx - 195, -2, 8);
        makeMesh(new THREE.BoxGeometry(8, 3, 35), 0x9a8878, cx - 220, -12, 10);

        // -------------------------------------------------------
        // STONEHAVEN HARBOUR — fishing town to the north
        // -------------------------------------------------------
        // Harbour town buildings cluster
        makeMesh(new THREE.BoxGeometry(18, 14, 14), 0xF5F0E8, cx - 80, 8, -200);
        makeMesh(new THREE.BoxGeometry(14, 12, 12), 0xEDE8DC, cx - 60, 7, -210);
        makeMesh(new THREE.BoxGeometry(16, 16, 14), 0xF5F0E8, cx - 100, 9, -195);
        makeMesh(new THREE.BoxGeometry(12, 10, 12), 0xEDE8DC, cx - 115, 6, -205);
        makeMesh(new THREE.BoxGeometry(20, 13, 16), 0xF5F0E8, cx - 50, 7, -220);
        makeMesh(new THREE.BoxGeometry(14, 11, 12), 0xF5F0E8, cx - 130, 6, -210);
        makeMesh(new THREE.BoxGeometry(12, 18, 12), 0xDDC8A0, cx - 90, 10, -215);
        // Church tower
        makeMesh(new THREE.BoxGeometry(10, 28, 10), 0xEDE8DC, cx - 75, 15, -225);
        makeMesh(new THREE.ConeGeometry(7, 14, 4), 0xCCBB99, cx - 75, 30, -225);
        // Harbour wall / pier
        makeMesh(new THREE.BoxGeometry(90, 5, 8), 0xCCBBAA, cx - 85, 2, -240);
        makeMesh(new THREE.BoxGeometry(8, 5, 60), 0xCCBBAA, cx - 40, 2, -220);
        // Harbour water
        makeMesh(new THREE.BoxGeometry(120, 3, 70), 0x005577, cx - 80, -2, -250);
        // Fishing boats — low flat boxes in harbour
        makeMesh(new THREE.BoxGeometry(14, 4, 5), 0xCC4422, cx - 70, 1, -248);
        makeMesh(new THREE.BoxGeometry(12, 4, 5), 0x2244AA, cx - 90, 1, -252);
        makeMesh(new THREE.BoxGeometry(10, 4, 4), 0xDDAA22, cx - 55, 1, -246);
        // Boat masts
        makeMesh(new THREE.BoxGeometry(1, 16, 1), 0x553311, cx - 70, 10, -248);
        makeMesh(new THREE.BoxGeometry(1, 14, 1), 0x553311, cx - 90, 10, -252);
        // Harbour road / quay
        makeMesh(new THREE.BoxGeometry(80, 2, 20), 0xBBAAAA, cx - 85, 3, -232);

        // -------------------------------------------------------
        // SEABIRDS — flat white box silhouettes circling cliff
        // -------------------------------------------------------
        var birdData = [
            [cx + 20,  90,  60],
            [cx - 10, 100,  50],
            [cx + 50,  85,  30],
            [cx + 40,  95, -50],
            [cx - 30, 105,  20],
            [cx + 10,  88, -40],
            [cx - 50,  92,  70],
            [cx + 70,  98, -10]
        ];
        for (var b = 0; b < birdData.length; b++) {
            var bd = birdData[b];
            // Body
            var bodyGeo = new THREE.BoxGeometry(8, 1.5, 3);
            var bodyMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            var bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
            bodyMesh.position.set(bd[0], bd[1], bd[2]);
            scene.add(bodyMesh);
            objects.push(bodyMesh);
            seabirds.push({ mesh: bodyMesh, baseX: bd[0], baseY: bd[1], baseZ: bd[2], offset: b * 0.8 });
            // Left wing
            var wingGeo = new THREE.BoxGeometry(7, 0.8, 2);
            var wingMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            var wingMesh = new THREE.Mesh(wingGeo, wingMat);
            wingMesh.position.set(bd[0] - 6, bd[1], bd[2]);
            scene.add(wingMesh);
            objects.push(wingMesh);
            seabirds.push({ mesh: wingMesh, baseX: bd[0] - 6, baseY: bd[1], baseZ: bd[2], offset: b * 0.8 + 0.1 });
            // Right wing
            var wingGeo2 = new THREE.BoxGeometry(7, 0.8, 2);
            var wingMat2 = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
            var wingMesh2 = new THREE.Mesh(wingGeo2, wingMat2);
            wingMesh2.position.set(bd[0] + 6, bd[1], bd[2]);
            scene.add(wingMesh2);
            objects.push(wingMesh2);
            seabirds.push({ mesh: wingMesh2, baseX: bd[0] + 6, baseY: bd[1], baseZ: bd[2], offset: b * 0.8 + 0.2 });
        }

        // -------------------------------------------------------
        // AMBIENT ROCK DEBRIS / BOULDERS on plateau
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(5, 3, 5), 0x5a4a3a, cx + 80, 55, 20);
        makeMesh(new THREE.BoxGeometry(4, 2, 4), 0x4a3a2a, cx + 75, 55, -30);
        makeMesh(new THREE.BoxGeometry(6, 4, 5), 0x5a4a3a, cx - 50, 55, 60);
        makeMesh(new THREE.BoxGeometry(3, 3, 3), 0x6a5a4a, cx - 40, 55, -55);
        makeMesh(new THREE.BoxGeometry(5, 3, 6), 0x4a3a2a, cx + 15, 55, 65);

        // -------------------------------------------------------
        // WELL / CISTERN in inner ward
        // -------------------------------------------------------
        makeMesh(new THREE.CylinderGeometry(3, 3, 4, 8), 0x8B7355, cx, 57, 5);
        makeMesh(new THREE.CylinderGeometry(3.5, 3.5, 1, 8), 0x7a6345, cx, 59, 5);

        // -------------------------------------------------------
        // INNER WARD GROUND — flat stone surface on plateau top
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(180, 2, 130), 0x8a7a6a, cx, 54, 0);

        // -------------------------------------------------------
        // ADDITIONAL CLIFF DETAIL — layered sedimentary bands
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(260, 5, 195), 0x6a5a4a, cx, -5, 0);
        makeMesh(new THREE.BoxGeometry(255, 5, 190), 0x5a4a3a, cx + 2, -12, 0);
        makeMesh(new THREE.BoxGeometry(250, 5, 185), 0x4a3a2a, cx + 3, -19, 0);
        makeMesh(new THREE.BoxGeometry(248, 5, 183), 0x5a4a3a, cx + 1, -26, 0);
        makeMesh(new THREE.BoxGeometry(245, 5, 180), 0x6a5a4a, cx, -33, 0);
        makeMesh(new THREE.BoxGeometry(242, 5, 178), 0x4a3a2a, cx + 2, -40, 0);

        // -------------------------------------------------------
        // MAINLAND SHORE APPROACH — ground to the west
        // -------------------------------------------------------
        makeMesh(new THREE.BoxGeometry(400, 10, 300), 0x7a6a58, cx - 350, -8, 0);
        // Mainland grass top
        makeMesh(new THREE.BoxGeometry(400, 3, 300), 0x5a6a4a, cx - 350, -3, 0);
        // Track/road leading to castle
        makeMesh(new THREE.BoxGeometry(200, 3, 10), 0x9a9080, cx - 280, -1, 0);
    }

    function update(delta) {
        birdTime += delta;
        for (var i = 0; i < seabirds.length; i++) {
            var bird = seabirds[i];
            var t = birdTime * 0.4 + bird.offset;
            var radius = 80;
            bird.mesh.position.x = bird.baseX + Math.sin(t) * 12;
            bird.mesh.position.y = bird.baseY + Math.sin(t * 1.3) * 4;
            bird.mesh.position.z = bird.baseZ + Math.cos(t) * 12;
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        objects = [];
        seabirds = [];
        birdTime = 0;
        scene = null;
        camera = null;
    }

    return { init: init, update: update, reset: reset };
}());
