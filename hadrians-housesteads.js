window.HadriansHousesteads = (function() {
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

    function addMesh(geo, mat, x, y, z, rx, ry, rz) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        if (rx !== undefined) mesh.rotation.x = rx;
        if (ry !== undefined) mesh.rotation.y = ry;
        if (rz !== undefined) mesh.rotation.z = rz;
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildWhinSillRidge() {
        var rockMat = new THREE.MeshLambertMaterial({ color: 0x2a2a35 });
        var darkRockMat = new THREE.MeshLambertMaterial({ color: 0x1a1a22 });
        var grassMat = new THREE.MeshLambertMaterial({ color: 0x4a6b3a });
        var i, x, z, w, h, d;

        // Main ridge running east-west
        for (i = 0; i < 30; i++) {
            x = 15320 + (i - 15) * 80;
            z = 0;
            // Ridge base
            addMesh(new THREE.BoxGeometry(90, 18, 40), rockMat, x, 2, z, 0, 0, 0);
            // Craggy top
            addMesh(new THREE.BoxGeometry(70, 8, 30), darkRockMat, x + Math.sin(i) * 5, 14, z + Math.cos(i) * 3, 0, Math.sin(i) * 0.1, 0);
            // Jagged outcrops
            addMesh(new THREE.BoxGeometry(15, 12, 10), rockMat, x + (i % 3 - 1) * 20, 16, z + (i % 2) * 8, Math.sin(i * 0.7) * 0.2, 0, Math.cos(i * 0.5) * 0.15);
            // South slope grass
            addMesh(new THREE.BoxGeometry(85, 5, 60), grassMat, x, -1, z + 45, 0.15, 0, 0);
        }

        // Steep north face outcrops
        for (i = 0; i < 20; i++) {
            x = 15320 + (i - 10) * 110;
            addMesh(new THREE.BoxGeometry(30, 20, 15), darkRockMat, x, 0, -25, 0.3, Math.random() * 0.2, 0);
            addMesh(new THREE.ConeGeometry(8, 16, 4), rockMat, x + 15, 5, -30, 0, Math.random() * 0.5, 0);
        }

        // Ground plane south
        addMesh(new THREE.BoxGeometry(2500, 2, 400), grassMat, 15320, -10, 150, 0, 0, 0);
        // Ground plane north
        addMesh(new THREE.BoxGeometry(2500, 2, 200), grassMat, 15320, -8, -100, 0, 0, 0);
    }

    function buildHadriansWall() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8a8070 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x6a6055 });
        var i, x, z;

        z = 0;

        // Main wall running east-west - segments
        for (i = 0; i < 50; i++) {
            x = 15320 + (i - 25) * 48;
            // Wall body
            addMesh(new THREE.BoxGeometry(50, 6, 2), stoneMat, x, 12, z, 0, 0, 0);
            // Wall walkway top
            addMesh(new THREE.BoxGeometry(50, 1, 2.5), darkStoneMat, x, 15.5, z, 0, 0, 0);
        }

        // Milecastles every ~150 units (representing 1 mile spacing)
        for (i = 0; i < 8; i++) {
            x = 15320 + (i - 4) * 300;
            buildMilecastle(x, z);
        }

        // Turrets every ~100 units (third of a mile)
        for (i = 0; i < 20; i++) {
            x = 15320 + (i - 10) * 110;
            // Skip positions that overlap with milecastles
            if (i % 3 !== 0) {
                buildTurret(x, z);
            }
        }
    }

    function buildMilecastle(x, z) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8a8070 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x5a5248 });

        // Milecastle walls - rectangular enclosure
        // North wall
        addMesh(new THREE.BoxGeometry(22, 7, 2.5), stoneMat, x, 12, z - 8, 0, 0, 0);
        // South wall
        addMesh(new THREE.BoxGeometry(22, 7, 2.5), stoneMat, x, 12, z + 8, 0, 0, 0);
        // East wall
        addMesh(new THREE.BoxGeometry(2.5, 7, 18), stoneMat, x + 10, 12, z, 0, 0, 0);
        // West wall
        addMesh(new THREE.BoxGeometry(2.5, 7, 18), stoneMat, x - 10, 12, z, 0, 0, 0);
        // Gate arch indicator
        addMesh(new THREE.BoxGeometry(4, 2, 2.5), darkStoneMat, x, 16, z + 8, 0, 0, 0);
        // Interior small building
        addMesh(new THREE.BoxGeometry(8, 3, 6), darkStoneMat, x, 10.5, z, 0, 0, 0);
    }

    function buildTurret(x, z) {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x7a7265 });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x5a5248 });

        // Turret base
        addMesh(new THREE.BoxGeometry(5, 8, 5), stoneMat, x, 13, z, 0, 0, 0);
        // Turret top
        addMesh(new THREE.BoxGeometry(6, 1.5, 6), darkStoneMat, x, 17.5, z, 0, 0, 0);
        // Battlements
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), stoneMat, x + 2, 19, z + 2, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), stoneMat, x - 2, 19, z + 2, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), stoneMat, x + 2, 19, z - 2, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(1.5, 2, 1.5), stoneMat, x - 2, 19, z - 2, 0, 0, 0);
    }

    function buildHousesteadsFort() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x9a8c7a });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x6e6255 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8b5e3c });
        var floorMat = new THREE.MeshLambertMaterial({ color: 0xa09080 });
        var cx = 15320;
        var cz = 80;
        var i;

        // Fort perimeter walls - playing card shape (rounded corners implied by corner towers)
        // North wall
        addMesh(new THREE.BoxGeometry(130, 5, 3), stoneMat, cx, 10, cz - 55, 0, 0, 0);
        // South wall
        addMesh(new THREE.BoxGeometry(130, 5, 3), stoneMat, cx, 10, cz + 55, 0, 0, 0);
        // East wall
        addMesh(new THREE.BoxGeometry(3, 5, 112), stoneMat, cx + 65, 10, cz, 0, 0, 0);
        // West wall
        addMesh(new THREE.BoxGeometry(3, 5, 112), stoneMat, cx - 65, 10, cz, 0, 0, 0);

        // Corner towers
        addMesh(new THREE.BoxGeometry(7, 7, 7), darkStoneMat, cx + 65, 12, cz - 55, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(7, 7, 7), darkStoneMat, cx - 65, 12, cz - 55, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(7, 7, 7), darkStoneMat, cx + 65, 12, cz + 55, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(7, 7, 7), darkStoneMat, cx - 65, 12, cz + 55, 0, 0, 0);

        // Gates - North gate
        addMesh(new THREE.BoxGeometry(12, 8, 5), stoneMat, cx, 13, cz - 55, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(4, 2, 5), darkStoneMat, cx, 18, cz - 55, 0, 0, 0);
        // South gate
        addMesh(new THREE.BoxGeometry(12, 8, 5), stoneMat, cx, 13, cz + 55, 0, 0, 0);

        // Headquarters building (principia) - centre of fort
        addMesh(new THREE.BoxGeometry(35, 4, 28), stoneMat, cx, 11, cz, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(30, 2, 24), floorMat, cx, 13.5, cz, 0, 0, 0);
        // Headquarters courtyard walls
        addMesh(new THREE.BoxGeometry(35, 3, 1.5), darkStoneMat, cx, 12, cz - 10, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(35, 3, 1.5), darkStoneMat, cx, 12, cz + 10, 0, 0, 0);
        // Strong room
        addMesh(new THREE.BoxGeometry(8, 5, 8), darkStoneMat, cx, 12, cz + 8, 0, 0, 0);

        // Granaries - raised on pillars
        addMesh(new THREE.BoxGeometry(30, 1, 12), stoneMat, cx - 30, 9.5, cz - 25, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(30, 1, 12), stoneMat, cx + 30, 9.5, cz - 25, 0, 0, 0);
        // Granary support pillars
        for (i = 0; i < 5; i++) {
            addMesh(new THREE.BoxGeometry(1.5, 3, 1.5), darkStoneMat, cx - 30 + (i - 2) * 6, 8, cz - 25 - 4, 0, 0, 0);
            addMesh(new THREE.BoxGeometry(1.5, 3, 1.5), darkStoneMat, cx - 30 + (i - 2) * 6, 8, cz - 25 + 4, 0, 0, 0);
            addMesh(new THREE.BoxGeometry(1.5, 3, 1.5), darkStoneMat, cx + 30 + (i - 2) * 6, 8, cz - 25 - 4, 0, 0, 0);
            addMesh(new THREE.BoxGeometry(1.5, 3, 1.5), darkStoneMat, cx + 30 + (i - 2) * 6, 8, cz - 25 + 4, 0, 0, 0);
        }
        // Granary walls
        addMesh(new THREE.BoxGeometry(30, 5, 12), stoneMat, cx - 30, 12, cz - 25, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(30, 5, 12), stoneMat, cx + 30, 12, cz - 25, 0, 0, 0);

        // Barrack blocks - rows of long buildings
        for (i = 0; i < 4; i++) {
            addMesh(new THREE.BoxGeometry(12, 4, 40), stoneMat, cx - 50 + i * 12, 11, cz + 20, 0, 0, 0);
        }
        // North barracks
        for (i = 0; i < 4; i++) {
            addMesh(new THREE.BoxGeometry(12, 4, 20), stoneMat, cx - 50 + i * 12, 11, cz - 30, 0, 0, 0);
        }

        // Hospital building
        addMesh(new THREE.BoxGeometry(20, 4, 20), stoneMat, cx + 40, 11, cz + 20, 0, 0, 0);
        // Hospital courtyard
        addMesh(new THREE.BoxGeometry(12, 1, 12), floorMat, cx + 40, 13.2, cz + 20, 0, 0, 0);

        // Latrine block - NE corner
        addMesh(new THREE.BoxGeometry(12, 3, 10), darkStoneMat, cx + 50, 10.5, cz - 40, 0, 0, 0);
        // Latrine channel
        addMesh(new THREE.BoxGeometry(10, 0.5, 8), floorMat, cx + 50, 12, cz - 40, 0, 0, 0);
    }

    function buildVindolanda() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x7a6e5a });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x5a5040 });
        var soilMat = new THREE.MeshLambertMaterial({ color: 0x6b4c2a });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x3a5a7a });
        var markerMat = new THREE.MeshLambertMaterial({ color: 0xc8a855 });
        var cx = 15320 - 600;
        var cz = 250;
        var i;

        // Fort outline walls
        addMesh(new THREE.BoxGeometry(100, 4, 2), stoneMat, cx, 9, cz - 40, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(100, 4, 2), stoneMat, cx, 9, cz + 40, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(2, 4, 82), stoneMat, cx + 50, 9, cz, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(2, 4, 82), stoneMat, cx - 50, 9, cz, 0, 0, 0);

        // Excavation trenches
        for (i = 0; i < 6; i++) {
            addMesh(new THREE.BoxGeometry(15, 1, 8), soilMat, cx - 40 + i * 16, 8, cz + 60 + (i % 2) * 10, 0, 0, 0);
        }

        // Praetorium (commander's house)
        addMesh(new THREE.BoxGeometry(24, 4, 20), stoneMat, cx, 10, cz - 15, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(16, 0.5, 12), darkStoneMat, cx, 12.5, cz - 15, 0, 0, 0);

        // Vicus civilian settlement
        for (i = 0; i < 8; i++) {
            addMesh(new THREE.BoxGeometry(8, 3, 6), stoneMat, cx - 80 + i * 18, 9, cz + 70, 0, 0, 0);
        }

        // Temple
        addMesh(new THREE.BoxGeometry(12, 6, 10), stoneMat, cx + 70, 11, cz - 20, 0, 0, 0);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 6), stoneMat, cx + 66, 12, cz - 20, 0, 0, 0);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 8, 6), stoneMat, cx + 74, 12, cz - 20, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(14, 1.5, 2), darkStoneMat, cx + 70, 17, cz - 20, 0, 0, 0);

        // Bathhouse
        addMesh(new THREE.BoxGeometry(18, 4, 14), stoneMat, cx - 70, 10, cz + 10, 0, 0, 0);
        addMesh(new THREE.SphereGeometry(4, 6, 4), stoneMat, cx - 65, 15, cz + 10, 0, 0, 0);
        addMesh(new THREE.SphereGeometry(3.5, 6, 4), stoneMat, cx - 75, 14.5, cz + 10, 0, 0, 0);

        // Writing tablet discovery site marker - golden post
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 3, 6), markerMat, cx + 20, 10.5, cz + 55, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(2, 1.5, 0.2), markerMat, cx + 20, 12.5, cz + 55, 0, 0, 0);
    }

    function buildChestersRomanFort() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8a7c6a });
        var darkStoneMat = new THREE.MeshLambertMaterial({ color: 0x5c5040 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x2a4a6a });
        var bathMat = new THREE.MeshLambertMaterial({ color: 0x9a8a78 });
        var cx = 15320 + 700;
        var cz = 200;
        var i;

        // North Tyne river
        addMesh(new THREE.BoxGeometry(600, 1, 40), waterMat, cx, 5, cz + 80, 0, 0, 0);

        // Fort perimeter
        addMesh(new THREE.BoxGeometry(110, 4, 2), stoneMat, cx, 9, cz - 45, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(110, 4, 2), stoneMat, cx, 9, cz + 45, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(2, 4, 92), stoneMat, cx + 55, 9, cz, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(2, 4, 92), stoneMat, cx - 55, 9, cz, 0, 0, 0);

        // Cavalry barracks - longer than infantry
        for (i = 0; i < 3; i++) {
            addMesh(new THREE.BoxGeometry(14, 4, 50), stoneMat, cx - 35 + i * 35, 10, cz + 5, 0, 0, 0);
        }

        // Headquarters
        addMesh(new THREE.BoxGeometry(28, 4, 22), stoneMat, cx, 10, cz - 18, 0, 0, 0);

        // Bathhouse - exterior (beside the fort)
        addMesh(new THREE.BoxGeometry(30, 5, 20), bathMat, cx + 80, 10, cz + 20, 0, 0, 0);
        // Bathhouse interior walls
        addMesh(new THREE.BoxGeometry(28, 3, 1.5), darkStoneMat, cx + 80, 11, cz + 12, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(28, 3, 1.5), darkStoneMat, cx + 80, 11, cz + 28, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(1.5, 3, 8), darkStoneMat, cx + 68, 11, cz + 20, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(1.5, 3, 8), darkStoneMat, cx + 92, 11, cz + 20, 0, 0, 0);
        // Changing room
        addMesh(new THREE.BoxGeometry(10, 4, 8), bathMat, cx + 68, 10, cz + 20, 0, 0, 0);
        // Hypocaust pillars
        for (i = 0; i < 4; i++) {
            addMesh(new THREE.CylinderGeometry(0.4, 0.4, 2, 5), stoneMat, cx + 76 + i * 4, 8.5, cz + 22, 0, 0, 0);
            addMesh(new THREE.CylinderGeometry(0.4, 0.4, 2, 5), stoneMat, cx + 76 + i * 4, 8.5, cz + 26, 0, 0, 0);
        }

        // Bridge abutment in river
        addMesh(new THREE.BoxGeometry(8, 6, 8), darkStoneMat, cx + 10, 7, cz + 80, 0, 0, 0);
        addMesh(new THREE.BoxGeometry(8, 6, 8), darkStoneMat, cx - 10, 7, cz + 80, 0, 0, 0);
        // Bridge piers
        addMesh(new THREE.BoxGeometry(4, 4, 4), darkStoneMat, cx, 7, cz + 85, 0, 0, 0);
    }

    function buildRomanWallPath() {
        var stoneMat = new THREE.MeshLambertMaterial({ color: 0x9a9080 });
        var markerMat = new THREE.MeshLambertMaterial({ color: 0x4a6a3a });
        var signMat = new THREE.MeshLambertMaterial({ color: 0xd4c48a });
        var skinMat = new THREE.MeshLambertMaterial({ color: 0xe8c89a });
        var clothMat = new THREE.MeshLambertMaterial({ color: 0x5a7a9a });
        var postMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
        var i, x, z;

        // Stone path slabs along wall line
        for (i = 0; i < 40; i++) {
            x = 15320 + (i - 20) * 60;
            z = 15;
            addMesh(new THREE.BoxGeometry(55, 0.4, 3), stoneMat, x, 9.8, z, 0, 0, 0);
        }

        // Way markers - stone posts with carved arrows
        for (i = 0; i < 10; i++) {
            x = 15320 + (i - 5) * 220;
            z = 15;
            addMesh(new THREE.BoxGeometry(1.2, 4, 1.2), stoneMat, x, 12, z, 0, 0, 0);
            addMesh(new THREE.BoxGeometry(3, 0.8, 0.3), signMat, x, 14.5, z, 0, 0, 0);
        }

        // National Trail acorn markers - small brown posts
        for (i = 0; i < 15; i++) {
            x = 15320 + (i - 7) * 145;
            z = 12;
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2.5, 5), postMat, x, 11.3, z, 0, 0, 0);
            addMesh(new THREE.SphereGeometry(0.5, 5, 4), markerMat, x, 12.7, z, 0, 0, 0);
        }

        // Information boards
        for (i = 0; i < 4; i++) {
            x = 15320 + (i - 2) * 400;
            z = 20;
            addMesh(new THREE.CylinderGeometry(0.25, 0.25, 3.5, 5), postMat, x - 2, 11.8, z, 0, 0, 0);
            addMesh(new THREE.CylinderGeometry(0.25, 0.25, 3.5, 5), postMat, x + 2, 11.8, z, 0, 0, 0);
            addMesh(new THREE.BoxGeometry(6, 3, 0.3), signMat, x, 13.5, z, 0, 0, 0);
        }

        // Walkers on path - cylinder body, sphere head
        for (i = 0; i < 6; i++) {
            x = 15320 + (i - 3) * 180 + 30;
            z = 15;
            // Body
            addMesh(new THREE.CylinderGeometry(0.4, 0.35, 1.6, 6), clothMat, x, 11.3, z, 0, i * 0.8, 0);
            // Head
            addMesh(new THREE.SphereGeometry(0.4, 6, 5), skinMat, x, 12.5, z, 0, 0, 0);
            // Backpack
            addMesh(new THREE.BoxGeometry(0.5, 0.8, 0.4), markerMat, x + 0.2, 11.5, z - 0.3, 0.2, 0, 0);
        }

        // Car parks - gravel areas with small barrier posts
        for (i = 0; i < 2; i++) {
            x = 15320 + (i - 1) * 800;
            z = 120;
            addMesh(new THREE.BoxGeometry(50, 0.5, 30), stoneMat, x, 8.7, z, 0, 0, 0);
            // Parking barrier posts
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 5), postMat, x - 22, 9.7, z - 13, 0, 0, 0);
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 5), postMat, x + 22, 9.7, z - 13, 0, 0, 0);
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 5), postMat, x - 22, 9.7, z + 13, 0, 0, 0);
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 2, 5), postMat, x + 22, 9.7, z + 13, 0, 0, 0);
            // Info sign at car park
            addMesh(new THREE.BoxGeometry(5, 2.5, 0.3), signMat, x, 10.5, z - 14, 0, 0, 0);
        }
    }

    function build() {
        buildWhinSillRidge();
        buildHadriansWall();
        buildHousesteadsFort();
        buildVindolanda();
        buildChestersRomanFort();
        buildRomanWallPath();
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
