window.SwanageSteam = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 13560;

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

    function makeMesh(geo, color, emissive) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        if (emissive) { mat.emissive = new THREE.Color(emissive); }
        return new THREE.Mesh(geo, mat);
    }

    function buildCorfeCastle() {
        var i, mesh, geo;

        // Castle hill — chalk mound
        geo = new THREE.CylinderGeometry(60, 90, 55, 8);
        mesh = makeMesh(geo, 0x8fbc8f);
        mesh.position.set(OX + 0, 27, -400);
        addObj(mesh);

        // Hill top platform
        geo = new THREE.CylinderGeometry(40, 60, 8, 8);
        mesh = makeMesh(geo, 0x9da89d);
        mesh.position.set(OX + 0, 56, -400);
        addObj(mesh);

        // Keep tower — half collapsed, main body
        geo = new THREE.BoxGeometry(24, 48, 24);
        mesh = makeMesh(geo, 0xb8a090);
        mesh.position.set(OX + 0, 84, -400);
        addObj(mesh);

        // Keep tower — collapsed upper half (tilted stump)
        geo = new THREE.BoxGeometry(20, 22, 20);
        mesh = makeMesh(geo, 0xa09080);
        mesh.position.set(OX + 4, 120, -398);
        mesh.rotation.z = 0.18;
        addObj(mesh);

        // Keep — remaining corner turret
        geo = new THREE.CylinderGeometry(5, 6, 36, 6);
        mesh = makeMesh(geo, 0xb0a090);
        mesh.position.set(OX + 10, 96, -410);
        addObj(mesh);

        // Inner ward wall — north
        geo = new THREE.BoxGeometry(70, 14, 4);
        mesh = makeMesh(geo, 0xb8a090);
        mesh.position.set(OX + 0, 63, -425);
        addObj(mesh);

        // Inner ward wall — south
        geo = new THREE.BoxGeometry(70, 12, 4);
        mesh = makeMesh(geo, 0xb8a090);
        mesh.position.set(OX + 0, 62, -375);
        addObj(mesh);

        // Inner ward wall — west
        geo = new THREE.BoxGeometry(4, 14, 50);
        mesh = makeMesh(geo, 0xb8a090);
        mesh.position.set(OX - 35, 63, -400);
        addObj(mesh);

        // Inner ward wall — east (partial ruin)
        geo = new THREE.BoxGeometry(4, 10, 30);
        mesh = makeMesh(geo, 0xb8a090);
        mesh.position.set(OX + 35, 61, -395);
        addObj(mesh);

        // Gatehouse — twin towers
        geo = new THREE.BoxGeometry(10, 22, 10);
        mesh = makeMesh(geo, 0xb0a080);
        mesh.position.set(OX - 6, 71, -380);
        addObj(mesh);

        geo = new THREE.BoxGeometry(10, 22, 10);
        mesh = makeMesh(geo, 0xb0a080);
        mesh.position.set(OX + 6, 71, -380);
        addObj(mesh);

        // Gatehouse arch body
        geo = new THREE.BoxGeometry(8, 14, 6);
        mesh = makeMesh(geo, 0x706050);
        mesh.position.set(OX + 0, 64, -379);
        addObj(mesh);

        // Outer bailey walls
        geo = new THREE.BoxGeometry(110, 10, 4);
        mesh = makeMesh(geo, 0xaa9880);
        mesh.position.set(OX + 0, 56, -455);
        addObj(mesh);

        geo = new THREE.BoxGeometry(4, 10, 100);
        mesh = makeMesh(geo, 0xaa9880);
        mesh.position.set(OX - 55, 56, -410);
        addObj(mesh);

        geo = new THREE.BoxGeometry(4, 10, 100);
        mesh = makeMesh(geo, 0xaa9880);
        mesh.position.set(OX + 55, 56, -410);
        addObj(mesh);

        // Outer bailey corner towers
        var cornerPos = [
            [OX - 55, -455],
            [OX + 55, -455]
        ];
        for (i = 0; i < cornerPos.length; i++) {
            geo = new THREE.CylinderGeometry(6, 7, 18, 6);
            mesh = makeMesh(geo, 0xb0a080);
            mesh.position.set(cornerPos[i][0], 60, cornerPos[i][1]);
            addObj(mesh);
        }

        // Chalk scarp — white chalk face
        geo = new THREE.BoxGeometry(200, 30, 20);
        mesh = makeMesh(geo, 0xf0ece0);
        mesh.position.set(OX + 0, 25, -350);
        mesh.rotation.x = 0.1;
        addObj(mesh);

        // Village below castle — cottages
        var villageX = [OX - 50, OX - 25, OX + 10, OX + 40, OX + 65];
        for (i = 0; i < villageX.length; i++) {
            geo = new THREE.BoxGeometry(10, 8, 10);
            mesh = makeMesh(geo, 0xd4c8a8);
            mesh.position.set(villageX[i], 4, -340);
            addObj(mesh);
            geo = new THREE.ConeGeometry(8, 5, 4);
            mesh = makeMesh(geo, 0x8b4040);
            mesh.position.set(villageX[i], 11, -340);
            mesh.rotation.y = Math.PI / 4;
            addObj(mesh);
        }

        // Village church
        geo = new THREE.BoxGeometry(12, 14, 18);
        mesh = makeMesh(geo, 0xd0c8b0);
        mesh.position.set(OX - 70, 7, -345);
        addObj(mesh);
        geo = new THREE.CylinderGeometry(3, 3, 18, 4);
        mesh = makeMesh(geo, 0xc8c0a8);
        mesh.position.set(OX - 70, 23, -352);
        addObj(mesh);
    }

    function buildSwanageRailway() {
        var i, mesh, geo;

        // Swanage Station building
        geo = new THREE.BoxGeometry(40, 14, 16);
        mesh = makeMesh(geo, 0xd4c090);
        mesh.position.set(OX + 0, 7, 200);
        addObj(mesh);

        // Station roof
        geo = new THREE.BoxGeometry(44, 4, 20);
        mesh = makeMesh(geo, 0x806040);
        mesh.position.set(OX + 0, 15, 200);
        addObj(mesh);

        // Station canopy
        geo = new THREE.BoxGeometry(44, 2, 10);
        mesh = makeMesh(geo, 0x906050);
        mesh.position.set(OX + 0, 13, 210);
        addObj(mesh);

        // Platform
        geo = new THREE.BoxGeometry(80, 2, 8);
        mesh = makeMesh(geo, 0xe0d8c0);
        mesh.position.set(OX + 10, 1, 208);
        addObj(mesh);

        // Railway track — embankment south
        for (i = 0; i < 12; i++) {
            geo = new THREE.BoxGeometry(2, 1, 4);
            mesh = makeMesh(geo, 0x604030);
            mesh.position.set(OX + 0, 0.5, 220 + i * 18);
            addObj(mesh);
        }

        // Steam locomotive — boiler
        geo = new THREE.CylinderGeometry(4, 4, 18, 10);
        mesh = makeMesh(geo, 0x222222);
        mesh.rotation.z = Math.PI / 2;
        mesh.position.set(OX + 0, 6, 205);
        addObj(mesh);

        // Loco — cab
        geo = new THREE.BoxGeometry(8, 8, 7);
        mesh = makeMesh(geo, 0x1a1a1a);
        mesh.position.set(OX - 6, 8, 204);
        addObj(mesh);

        // Loco — funnel/chimney
        geo = new THREE.CylinderGeometry(1.2, 1.8, 5, 8);
        mesh = makeMesh(geo, 0x111111);
        mesh.position.set(OX + 7, 12, 205);
        addObj(mesh);

        // Loco — dome
        geo = new THREE.SphereGeometry(2.2, 8, 6);
        mesh = makeMesh(geo, 0x111111);
        mesh.position.set(OX + 2, 11, 205);
        addObj(mesh);

        // Loco — driving wheels
        var wheelZ = [202, 205, 208];
        for (i = 0; i < wheelZ.length; i++) {
            geo = new THREE.CylinderGeometry(3.5, 3.5, 1, 12);
            mesh = makeMesh(geo, 0x333333);
            mesh.rotation.z = Math.PI / 2;
            mesh.position.set(OX + 0, 3.5, wheelZ[i]);
            addObj(mesh);
        }

        // Passenger coaches — 3 coaches
        var coachZ = [215, 232, 249];
        for (i = 0; i < coachZ.length; i++) {
            geo = new THREE.BoxGeometry(8, 8, 14);
            mesh = makeMesh(geo, 0x8b2020);
            mesh.position.set(OX + 0, 6, coachZ[i]);
            addObj(mesh);
            geo = new THREE.BoxGeometry(9, 1, 15);
            mesh = makeMesh(geo, 0x5a1010);
            mesh.position.set(OX + 0, 10.5, coachZ[i]);
            addObj(mesh);
        }

        // Corfe Castle Halt — small platform
        geo = new THREE.BoxGeometry(30, 2, 6);
        mesh = makeMesh(geo, 0xe0d8c0);
        mesh.position.set(OX + 0, 1, -300);
        addObj(mesh);

        // Halt shelter
        geo = new THREE.BoxGeometry(8, 8, 6);
        mesh = makeMesh(geo, 0xd4c090);
        mesh.position.set(OX - 8, 5, -300);
        addObj(mesh);
        geo = new THREE.BoxGeometry(10, 2, 8);
        mesh = makeMesh(geo, 0x806040);
        mesh.position.set(OX - 8, 9.5, -300);
        addObj(mesh);

        // Embankment through Purbeck hills
        for (i = 0; i < 8; i++) {
            geo = new THREE.BoxGeometry(14, 6 + i, 18);
            mesh = makeMesh(geo, 0x7a8a70);
            mesh.position.set(OX + 0, (6 + i) / 2, -280 - i * 20);
            addObj(mesh);
        }

        // Track on embankment
        for (i = 0; i < 8; i++) {
            geo = new THREE.BoxGeometry(2, 1, 4);
            mesh = makeMesh(geo, 0x604030);
            mesh.position.set(OX + 0, 7 + i, -278 - i * 20);
            addObj(mesh);
        }

        // Viaduct arch piers
        for (i = 0; i < 5; i++) {
            geo = new THREE.BoxGeometry(3, 16, 3);
            mesh = makeMesh(geo, 0xb8a090);
            mesh.position.set(OX - 15 + i * 8, 8, -260);
            addObj(mesh);
        }

        // Viaduct deck
        geo = new THREE.BoxGeometry(44, 2, 6);
        mesh = makeMesh(geo, 0xc0b098);
        mesh.position.set(OX + 0, 17, -260);
        addObj(mesh);
    }

    function buildSwanageBay() {
        var i, mesh, geo;

        // Sea — bay
        geo = new THREE.BoxGeometry(400, 1, 300);
        mesh = makeMesh(geo, 0x1a6080);
        mesh.position.set(OX + 0, -1, 350);
        addObj(mesh);

        // Beach — sand
        geo = new THREE.BoxGeometry(350, 2, 60);
        mesh = makeMesh(geo, 0xe8d89c);
        mesh.position.set(OX + 0, 0, 210);
        addObj(mesh);

        // Victorian Pier — main deck
        geo = new THREE.BoxGeometry(10, 2, 120);
        mesh = makeMesh(geo, 0x8b7050);
        mesh.position.set(OX + 80, 2, 290);
        addObj(mesh);

        // Pier — legs
        for (i = 0; i < 6; i++) {
            geo = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
            mesh = makeMesh(geo, 0x705030);
            mesh.position.set(OX + 76, -2, 240 + i * 20);
            addObj(mesh);
            geo = new THREE.CylinderGeometry(0.8, 0.8, 8, 6);
            mesh = makeMesh(geo, 0x705030);
            mesh.position.set(OX + 84, -2, 240 + i * 20);
            addObj(mesh);
        }

        // Pier head pavilion
        geo = new THREE.BoxGeometry(16, 8, 16);
        mesh = makeMesh(geo, 0xd4c8a0);
        mesh.position.set(OX + 80, 7, 346);
        addObj(mesh);
        geo = new THREE.ConeGeometry(12, 8, 4);
        mesh = makeMesh(geo, 0x8b4040);
        mesh.position.set(OX + 80, 15, 346);
        mesh.rotation.y = Math.PI / 4;
        addObj(mesh);

        // Town Hall with London Stone facade
        geo = new THREE.BoxGeometry(28, 18, 16);
        mesh = makeMesh(geo, 0xd8c898);
        mesh.position.set(OX - 60, 9, 170);
        addObj(mesh);

        // Town Hall facade columns
        for (i = 0; i < 4; i++) {
            geo = new THREE.CylinderGeometry(1.2, 1.4, 18, 8);
            mesh = makeMesh(geo, 0xe0d8b8);
            mesh.position.set(OX - 72 + i * 8, 9, 178);
            addObj(mesh);
        }

        // Town Hall pediment
        geo = new THREE.ConeGeometry(16, 7, 4);
        mesh = makeMesh(geo, 0xd0c888);
        mesh.position.set(OX - 60, 21, 174);
        mesh.rotation.y = Math.PI / 4;
        addObj(mesh);

        // Wellington Clock Tower
        geo = new THREE.BoxGeometry(7, 32, 7);
        mesh = makeMesh(geo, 0xc8b890);
        mesh.position.set(OX + 30, 16, 175);
        addObj(mesh);

        // Clock tower cap
        geo = new THREE.ConeGeometry(5, 8, 4);
        mesh = makeMesh(geo, 0x4a3828);
        mesh.position.set(OX + 30, 36, 175);
        mesh.rotation.y = Math.PI / 4;
        addObj(mesh);

        // Clock face (sphere approximation)
        geo = new THREE.SphereGeometry(2.5, 8, 6);
        mesh = makeMesh(geo, 0xf0f0e0);
        mesh.position.set(OX + 30, 24, 178.5);
        addObj(mesh);

        // Victorian seafront hotels
        var hotelX = [OX - 110, OX - 80, OX - 30, OX + 5, OX + 50];
        for (i = 0; i < hotelX.length; i++) {
            geo = new THREE.BoxGeometry(18, 22, 14);
            mesh = makeMesh(geo, 0xd8d0b0);
            mesh.position.set(hotelX[i], 11, 168);
            addObj(mesh);
            geo = new THREE.BoxGeometry(20, 3, 16);
            mesh = makeMesh(geo, 0xc0b898);
            mesh.position.set(hotelX[i], 23, 168);
            addObj(mesh);
        }
    }

    function buildPurbeckHills() {
        var i, mesh, geo;

        // Chalk ridge — main escarpment
        var ridgeSegs = [
            [OX - 200, 0, -500, 80, 40, 100],
            [OX - 100, 0, -520, 80, 50, 100],
            [OX + 0, 0, -530, 80, 55, 100],
            [OX + 100, 0, -520, 80, 50, 100],
            [OX + 200, 0, -500, 80, 40, 100]
        ];
        for (i = 0; i < ridgeSegs.length; i++) {
            geo = new THREE.BoxGeometry(ridgeSegs[i][3], ridgeSegs[i][4], ridgeSegs[i][5]);
            mesh = makeMesh(geo, 0x9aac90);
            mesh.position.set(ridgeSegs[i][0], ridgeSegs[i][4] / 2, ridgeSegs[i][2]);
            addObj(mesh);
        }

        // Chalk escarpment face — white
        geo = new THREE.BoxGeometry(500, 35, 12);
        mesh = makeMesh(geo, 0xf4f0e4);
        mesh.position.set(OX + 0, 20, -460);
        addObj(mesh);

        // Heathland — flat areas
        geo = new THREE.BoxGeometry(400, 2, 200);
        mesh = makeMesh(geo, 0x8b7a50);
        mesh.position.set(OX + 0, 1, -620);
        addObj(mesh);

        // Heather clumps
        var heatherPos = [
            [OX - 120, -600],
            [OX - 60, -580],
            [OX + 40, -610],
            [OX + 100, -590],
            [OX + 160, -570]
        ];
        for (i = 0; i < heatherPos.length; i++) {
            geo = new THREE.SphereGeometry(8, 6, 4);
            mesh = makeMesh(geo, 0x8040a0);
            mesh.position.set(heatherPos[i][0], 4, heatherPos[i][1]);
            mesh.scale.y = 0.4;
            addObj(mesh);
        }

        // Poole Harbour view — distant water shimmer
        geo = new THREE.BoxGeometry(600, 1, 200);
        mesh = makeMesh(geo, 0x2060a0);
        mesh.position.set(OX + 100, 2, -720);
        addObj(mesh);

        // Hill tracks — chalk paths
        for (i = 0; i < 5; i++) {
            geo = new THREE.BoxGeometry(3, 1, 60);
            mesh = makeMesh(geo, 0xe8e0c0);
            mesh.position.set(OX - 80 + i * 40, 2, -490);
            mesh.rotation.y = 0.1 * (i - 2);
            addObj(mesh);
        }
    }

    function buildStudlandBeach() {
        var i, mesh, geo;

        // Beach — sand dunes area
        geo = new THREE.BoxGeometry(400, 3, 250);
        mesh = makeMesh(geo, 0xe4d48c);
        mesh.position.set(OX + 300, 1, -200);
        addObj(mesh);

        // Dunes
        var dunePos = [
            [OX + 220, -130, 12, 40, 25],
            [OX + 280, -150, 16, 50, 22],
            [OX + 340, -120, 14, 45, 20],
            [OX + 400, -140, 18, 60, 28],
            [OX + 450, -110, 11, 35, 18]
        ];
        for (i = 0; i < dunePos.length; i++) {
            geo = new THREE.SphereGeometry(dunePos[i][2], 8, 5);
            mesh = makeMesh(geo, 0xd8c878);
            mesh.position.set(dunePos[i][0], dunePos[i][2] * 0.4, dunePos[i][1]);
            mesh.scale.set(dunePos[i][3] / dunePos[i][2], 0.5, dunePos[i][4] / dunePos[i][2]);
            addObj(mesh);
        }

        // Agglestone rock — huge iron sandstone boulder
        geo = new THREE.SphereGeometry(14, 8, 6);
        mesh = makeMesh(geo, 0x8b4020);
        mesh.position.set(OX + 260, 10, -180);
        mesh.scale.set(1.2, 0.9, 1.0);
        addObj(mesh);

        // Agglestone — base boulders
        geo = new THREE.SphereGeometry(8, 7, 5);
        mesh = makeMesh(geo, 0x7a3818);
        mesh.position.set(OX + 268, 5, -176);
        addObj(mesh);

        // NT car park — gravel area
        geo = new THREE.BoxGeometry(60, 1, 40);
        mesh = makeMesh(geo, 0x909088);
        mesh.position.set(OX + 330, 0.5, -100);
        addObj(mesh);

        // Car park trees / hedge
        for (i = 0; i < 6; i++) {
            geo = new THREE.CylinderGeometry(0.6, 0.9, 10, 5);
            mesh = makeMesh(geo, 0x2a5820);
            mesh.position.set(OX + 302 + i * 8, 5, -90);
            addObj(mesh);
            geo = new THREE.SphereGeometry(4, 6, 5);
            mesh = makeMesh(geo, 0x2a6828);
            mesh.position.set(OX + 302 + i * 8, 13, -90);
            addObj(mesh);
        }

        // Studland sea — Old Harry Rocks suggestion
        geo = new THREE.BoxGeometry(500, 1, 300);
        mesh = makeMesh(geo, 0x1a7090);
        mesh.position.set(OX + 350, -1, 100);
        addObj(mesh);

        // Old Harry chalk stacks (distant)
        var stackPos = [
            [OX + 480, 50],
            [OX + 492, 52],
            [OX + 506, 48]
        ];
        for (i = 0; i < stackPos.length; i++) {
            geo = new THREE.CylinderGeometry(3, 5, 20, 7);
            mesh = makeMesh(geo, 0xf4f0e4);
            mesh.position.set(stackPos[i][0], 10, stackPos[i][1]);
            addObj(mesh);
        }
    }

    function buildSwanageTown() {
        var i, mesh, geo;

        // Stone Quay — harbour wall
        geo = new THREE.BoxGeometry(120, 6, 8);
        mesh = makeMesh(geo, 0xb0a080);
        mesh.position.set(OX + 40, 3, 180);
        addObj(mesh);

        // Quay side wall
        geo = new THREE.BoxGeometry(8, 6, 60);
        mesh = makeMesh(geo, 0xb0a080);
        mesh.position.set(OX + 100, 3, 148);
        addObj(mesh);

        // Harbour water
        geo = new THREE.BoxGeometry(140, 1, 80);
        mesh = makeMesh(geo, 0x1a5070);
        mesh.position.set(OX + 50, -1, 130);
        addObj(mesh);

        // Fish market — shed
        geo = new THREE.BoxGeometry(30, 8, 16);
        mesh = makeMesh(geo, 0xc0b090);
        mesh.position.set(OX + 60, 4, 178);
        addObj(mesh);
        geo = new THREE.BoxGeometry(32, 2, 18);
        mesh = makeMesh(geo, 0x606050);
        mesh.position.set(OX + 60, 9, 178);
        addObj(mesh);

        // Lifeboat station
        geo = new THREE.BoxGeometry(16, 12, 20);
        mesh = makeMesh(geo, 0xd0c0a0);
        mesh.position.set(OX + 95, 6, 178);
        addObj(mesh);
        geo = new THREE.BoxGeometry(17, 2, 21);
        mesh = makeMesh(geo, 0x804040);
        mesh.position.set(OX + 95, 13, 178);
        addObj(mesh);

        // Lifeboat ramp
        geo = new THREE.BoxGeometry(10, 1, 24);
        mesh = makeMesh(geo, 0xc8c0a0);
        mesh.position.set(OX + 95, 1, 158);
        mesh.rotation.x = -0.12;
        addObj(mesh);

        // Moored fishing boats — simple hulls
        var boatZ = [140, 128, 118];
        for (i = 0; i < boatZ.length; i++) {
            geo = new THREE.BoxGeometry(6, 3, 14);
            mesh = makeMesh(geo, 0xd04028);
            mesh.position.set(OX + 30 + i * 12, 1.5, boatZ[i]);
            addObj(mesh);
            // Mast
            geo = new THREE.CylinderGeometry(0.3, 0.3, 12, 5);
            mesh = makeMesh(geo, 0xc0b090);
            mesh.position.set(OX + 30 + i * 12, 9, boatZ[i]);
            addObj(mesh);
        }

        // Swanage town streets — terraced houses
        var terraceRows = [
            { zBase: 155, count: 6, xStart: OX - 120 },
            { zBase: 143, count: 5, xStart: OX - 100 },
            { zBase: 132, count: 7, xStart: OX - 130 }
        ];
        for (i = 0; i < terraceRows.length; i++) {
            var row = terraceRows[i];
            for (var j = 0; j < row.count; j++) {
                geo = new THREE.BoxGeometry(12, 16, 12);
                mesh = makeMesh(geo, 0xd0c4a4);
                mesh.position.set(row.xStart + j * 14, 8, row.zBase);
                addObj(mesh);
                geo = new THREE.BoxGeometry(13, 3, 13);
                mesh = makeMesh(geo, 0x806040);
                mesh.position.set(row.xStart + j * 14, 17.5, row.zBase);
                addObj(mesh);
            }
        }

        // Pub / hotel near quay
        geo = new THREE.BoxGeometry(22, 14, 18);
        mesh = makeMesh(geo, 0xd8c8a0);
        mesh.position.set(OX - 20, 7, 174);
        addObj(mesh);
        geo = new THREE.BoxGeometry(24, 3, 20);
        mesh = makeMesh(geo, 0x706040);
        mesh.position.set(OX - 20, 15.5, 174);
        addObj(mesh);

        // Sign board (flat box)
        geo = new THREE.BoxGeometry(8, 4, 0.5);
        mesh = makeMesh(geo, 0x4040c0);
        mesh.position.set(OX - 20, 8, 183.5);
        addObj(mesh);
    }

    function buildGroundPlane() {
        var geo = new THREE.BoxGeometry(1200, 2, 1200);
        var mesh = makeMesh(geo, 0x6a8050);
        mesh.position.set(OX + 50, -1, -200);
        addObj(mesh);
    }

    function build() {
        buildGroundPlane();
        buildCorfeCastle();
        buildSwanageRailway();
        buildSwanageBay();
        buildPurbeckHills();
        buildStudlandBeach();
        buildSwanageTown();
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
