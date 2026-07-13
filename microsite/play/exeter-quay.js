window.ExeterQuay = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];

    var X_OFFSET = 14080;

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

    function buildQuayside() {
        var i, m, g;

        // Cobbled quay surface
        g = new THREE.BoxGeometry(120, 0.4, 40);
        m = makeMesh(g, 0x8a7a6a);
        m.position.set(X_OFFSET + 0, 0.2, 0);
        addObj(m);

        // Quayside warehouses - 17th century
        var warehousePositions = [
            [-40, 0], [-20, 0], [0, 0], [20, 0], [40, 0]
        ];
        for (i = 0; i < warehousePositions.length; i++) {
            // Warehouse body
            g = new THREE.BoxGeometry(16, 10, 12);
            m = makeMesh(g, 0x8b6343);
            m.position.set(X_OFFSET + warehousePositions[i][0], 5, -16);
            addObj(m);
            // Warehouse roof
            g = new THREE.BoxGeometry(17, 2.5, 13);
            m = makeMesh(g, 0x5a3e2b);
            m.position.set(X_OFFSET + warehousePositions[i][0], 11, -16);
            addObj(m);
            // Warehouse door
            g = new THREE.BoxGeometry(3, 5, 0.5);
            m = makeMesh(g, 0x3d2b1a);
            m.position.set(X_OFFSET + warehousePositions[i][0], 2.5, -9.7);
            addObj(m);
            // Warehouse window
            g = new THREE.BoxGeometry(2.5, 2, 0.5);
            m = makeMesh(g, 0x8ab4cc);
            m.position.set(X_OFFSET + warehousePositions[i][0] + 4, 7, -9.7);
            addObj(m);
        }

        // Canal basin water
        g = new THREE.BoxGeometry(80, 0.3, 30);
        m = makeMesh(g, 0x1a5276);
        m.position.set(X_OFFSET + 0, 0.15, 24);
        addObj(m);

        // Swing bridge
        g = new THREE.BoxGeometry(30, 1.2, 4);
        m = makeMesh(g, 0x4a4a4a);
        m.position.set(X_OFFSET + 0, 1.0, 10);
        addObj(m);
        // Bridge railings left
        g = new THREE.BoxGeometry(30, 1.5, 0.3);
        m = makeMesh(g, 0x666666);
        m.position.set(X_OFFSET + 0, 2.0, 8.1);
        addObj(m);
        // Bridge railings right
        g = new THREE.BoxGeometry(30, 1.5, 0.3);
        m = makeMesh(g, 0x666666);
        m.position.set(X_OFFSET + 0, 2.0, 11.9);
        addObj(m);
        // Bridge pivot post
        g = new THREE.CylinderGeometry(0.5, 0.5, 3, 8);
        m = makeMesh(g, 0x555555);
        m.position.set(X_OFFSET + 15, 1.5, 10);
        addObj(m);

        // Bollards
        var bollardX = [-50, -40, -30, -20, -10, 0, 10, 20, 30, 40, 50];
        for (i = 0; i < bollardX.length; i++) {
            g = new THREE.CylinderGeometry(0.3, 0.4, 1.2, 8);
            m = makeMesh(g, 0x2c2c2c);
            m.position.set(X_OFFSET + bollardX[i], 0.6, 2);
            addObj(m);
            // Bollard top cap
            g = new THREE.SphereGeometry(0.35, 8, 6);
            m = makeMesh(g, 0x2c2c2c);
            m.position.set(X_OFFSET + bollardX[i], 1.3, 2);
            addObj(m);
        }

        // Working cranes - 2 cranes
        var cranePositions = [-25, 25];
        for (i = 0; i < cranePositions.length; i++) {
            // Crane base
            g = new THREE.BoxGeometry(3, 0.8, 3);
            m = makeMesh(g, 0x3a3a3a);
            m.position.set(X_OFFSET + cranePositions[i], 0.4, 3);
            addObj(m);
            // Crane mast
            g = new THREE.BoxGeometry(1, 14, 1);
            m = makeMesh(g, 0x4a5a3a);
            m.position.set(X_OFFSET + cranePositions[i], 7.4, 3);
            addObj(m);
            // Crane jib horizontal
            g = new THREE.BoxGeometry(12, 0.6, 0.6);
            m = makeMesh(g, 0x4a5a3a);
            m.position.set(X_OFFSET + cranePositions[i] - 3, 14.6, 3);
            addObj(m);
            // Crane counter jib
            g = new THREE.BoxGeometry(5, 0.5, 0.5);
            m = makeMesh(g, 0x4a5a3a);
            m.position.set(X_OFFSET + cranePositions[i] + 4, 14.6, 3);
            addObj(m);
            // Crane hook cable
            g = new THREE.BoxGeometry(0.15, 6, 0.15);
            m = makeMesh(g, 0x222222);
            m.position.set(X_OFFSET + cranePositions[i] - 7, 11.6, 3);
            addObj(m);
            // Crane hook
            g = new THREE.SphereGeometry(0.4, 6, 6);
            m = makeMesh(g, 0x888888);
            m.position.set(X_OFFSET + cranePositions[i] - 7, 8.3, 3);
            addObj(m);
        }
    }

    function buildCathedral() {
        var g, m;
        var cx = X_OFFSET + 60;
        var cz = -60;

        // Cathedral nave floor
        g = new THREE.BoxGeometry(30, 0.5, 70);
        m = makeMesh(g, 0xd4c5a9);
        m.position.set(cx, 0.25, cz);
        addObj(m);

        // Nave walls - north
        g = new THREE.BoxGeometry(2, 18, 70);
        m = makeMesh(g, 0xc8b89a);
        m.position.set(cx - 16, 9, cz);
        addObj(m);
        // Nave walls - south
        g = new THREE.BoxGeometry(2, 18, 70);
        m = makeMesh(g, 0xc8b89a);
        m.position.set(cx + 16, 9, cz);
        addObj(m);
        // Nave end west wall
        g = new THREE.BoxGeometry(30, 18, 2);
        m = makeMesh(g, 0xc8b89a);
        m.position.set(cx, 9, cz + 35);
        addObj(m);
        // Nave end east wall (chancel end)
        g = new THREE.BoxGeometry(30, 18, 2);
        m = makeMesh(g, 0xc8b89a);
        m.position.set(cx, 9, cz - 35);
        addObj(m);

        // Nave roof
        g = new THREE.BoxGeometry(34, 3, 72);
        m = makeMesh(g, 0xa08060);
        m.position.set(cx, 19, cz);
        addObj(m);
        // Nave ridge
        g = new THREE.BoxGeometry(2, 5, 72);
        m = makeMesh(g, 0x907050);
        m.position.set(cx, 23, cz);
        addObj(m);

        // Twin Norman towers (square)
        var towerZ = [cz + 20, cz - 20];
        var t;
        for (t = 0; t < 2; t++) {
            // Tower body
            g = new THREE.BoxGeometry(14, 36, 14);
            m = makeMesh(g, 0xb8a888);
            m.position.set(cx, 18, towerZ[t]);
            addObj(m);
            // Tower top battlement base
            g = new THREE.BoxGeometry(15, 2, 15);
            m = makeMesh(g, 0xa09070);
            m.position.set(cx, 37, towerZ[t]);
            addObj(m);
            // Tower corner turrets x4
            var tcx = [-8, 8, -8, 8];
            var tcz = [-8, -8, 8, 8];
            var tc;
            for (tc = 0; tc < 4; tc++) {
                g = new THREE.CylinderGeometry(1.2, 1.2, 6, 8);
                m = makeMesh(g, 0xa09070);
                m.position.set(cx + tcx[tc], 41, towerZ[t] + tcz[tc]);
                addObj(m);
                g = new THREE.ConeGeometry(1.5, 3, 8);
                m = makeMesh(g, 0x706050);
                m.position.set(cx + tcx[tc], 45.5, towerZ[t] + tcz[tc]);
                addObj(m);
            }
            // Tower window arches (tall lancet shapes approximated as box)
            var tw;
            for (tw = 0; tw < 2; tw++) {
                g = new THREE.BoxGeometry(3, 8, 0.5);
                m = makeMesh(g, 0x8ab4cc);
                m.position.set(cx + (tw === 0 ? -5 : 5), 20, towerZ[t] + 7.1);
                addObj(m);
            }
        }

        // Great west window
        g = new THREE.BoxGeometry(20, 14, 0.8);
        m = makeMesh(g, 0x4a7a9b);
        m.position.set(cx, 12, cz + 35.4);
        addObj(m);
        // West door (open)
        g = new THREE.BoxGeometry(5, 8, 1);
        m = makeMesh(g, 0x2a1a0a);
        m.position.set(cx, 4, cz + 35.5);
        addObj(m);

        // Flying buttresses - north side
        var fb;
        for (fb = 0; fb < 5; fb++) {
            // Buttress pier
            g = new THREE.BoxGeometry(2, 12, 2);
            m = makeMesh(g, 0xb0a080);
            m.position.set(cx - 22, 6, cz - 24 + fb * 12);
            addObj(m);
            // Buttress arch (diagonal approximation)
            g = new THREE.BoxGeometry(8, 1.5, 2);
            m = makeMesh(g, 0xb0a080);
            m.rotation.z = 0.5;
            m.position.set(cx - 19, 14, cz - 24 + fb * 12);
            addObj(m);
        }
        // Flying buttresses - south side
        for (fb = 0; fb < 5; fb++) {
            g = new THREE.BoxGeometry(2, 12, 2);
            m = makeMesh(g, 0xb0a080);
            m.position.set(cx + 22, 6, cz - 24 + fb * 12);
            addObj(m);
            g = new THREE.BoxGeometry(8, 1.5, 2);
            m = makeMesh(g, 0xb0a080);
            m.rotation.z = -0.5;
            m.position.set(cx + 19, 14, cz - 24 + fb * 12);
            addObj(m);
        }

        // Bishop's throne (visible inside through west door)
        g = new THREE.BoxGeometry(3, 0.6, 3);
        m = makeMesh(g, 0x6b4226);
        m.position.set(cx, 0.3, cz - 20);
        addObj(m);
        g = new THREE.BoxGeometry(3, 8, 0.5);
        m = makeMesh(g, 0x6b4226);
        m.position.set(cx, 4.6, cz - 21.5);
        addObj(m);
        // Throne canopy
        g = new THREE.BoxGeometry(3.5, 0.4, 2);
        m = makeMesh(g, 0x5a3520);
        m.position.set(cx, 9.1, cz - 20.7);
        addObj(m);
        g = new THREE.ConeGeometry(2, 4, 4);
        m = makeMesh(g, 0x7a5535);
        m.position.set(cx, 11.5, cz - 20.7);
        addObj(m);

        // Chancel / choir end apse
        g = new THREE.BoxGeometry(20, 16, 14);
        m = makeMesh(g, 0xc0b090);
        m.position.set(cx, 8, cz - 42);
        addObj(m);
        g = new THREE.BoxGeometry(22, 1.5, 16);
        m = makeMesh(g, 0xa09070);
        m.position.set(cx, 17, cz - 42);
        addObj(m);
    }

    function buildCityWalls() {
        var g, m, i;
        var wx = X_OFFSET - 60;

        // Red sandstone wall sections - main run
        var wallSections = [
            { x: -20, z: -80, w: 40, h: 8, d: 3 },
            { x: 20, z: -80, w: 40, h: 8, d: 3 },
            { x: 60, z: -80, w: 40, h: 8, d: 3 },
            { x: 100, z: -80, w: 40, h: 8, d: 3 }
        ];
        for (i = 0; i < wallSections.length; i++) {
            g = new THREE.BoxGeometry(wallSections[i].w, wallSections[i].h, wallSections[i].d);
            m = makeMesh(g, 0x8b3a2a);
            m.position.set(wx + wallSections[i].x, wallSections[i].h / 2, wallSections[i].z);
            addObj(m);
            // Wall walk parapet
            g = new THREE.BoxGeometry(wallSections[i].w + 1, 1.5, wallSections[i].d + 1);
            m = makeMesh(g, 0x7a3020);
            m.position.set(wx + wallSections[i].x, wallSections[i].h + 0.75, wallSections[i].z);
            addObj(m);
        }

        // Merlons (crenellations) along top
        for (i = 0; i < 16; i++) {
            g = new THREE.BoxGeometry(2, 1.5, 1);
            m = makeMesh(g, 0x8b3a2a);
            m.position.set(wx - 20 + i * 8, 9.75, -80);
            addObj(m);
        }

        // Wall turrets
        var turretPositions = [-20, 60, 140];
        for (i = 0; i < turretPositions.length; i++) {
            g = new THREE.CylinderGeometry(3, 3.5, 10, 10);
            m = makeMesh(g, 0x8b3a2a);
            m.position.set(wx + turretPositions[i], 5, -80);
            addObj(m);
            // Turret top
            g = new THREE.CylinderGeometry(3.2, 3, 2, 10);
            m = makeMesh(g, 0x7a3020);
            m.position.set(wx + turretPositions[i], 11, -80);
            addObj(m);
            // Turret cone
            g = new THREE.ConeGeometry(3.2, 4, 10);
            m = makeMesh(g, 0x5a2010);
            m.position.set(wx + turretPositions[i], 14, -80);
            addObj(m);
        }

        // South Gate (gatehouse)
        g = new THREE.BoxGeometry(12, 12, 6);
        m = makeMesh(g, 0x8b3a2a);
        m.position.set(wx + 0, 6, -90);
        addObj(m);
        // Gate arch opening
        g = new THREE.BoxGeometry(5, 7, 7);
        m = makeMesh(g, 0x1a0a00);
        m.position.set(wx + 0, 3.5, -90);
        addObj(m);
        // Gate towers flanking
        g = new THREE.BoxGeometry(5, 16, 5);
        m = makeMesh(g, 0x7a3020);
        m.position.set(wx - 8, 8, -90);
        addObj(m);
        g = new THREE.BoxGeometry(5, 16, 5);
        m = makeMesh(g, 0x7a3020);
        m.position.set(wx + 8, 8, -90);
        addObj(m);
        // Gate battlements
        g = new THREE.BoxGeometry(22, 2, 7);
        m = makeMesh(g, 0x8b3a2a);
        m.position.set(wx + 0, 17, -90);
        addObj(m);

        // Roman east gate (different style - more square)
        g = new THREE.BoxGeometry(14, 8, 5);
        m = makeMesh(g, 0x9a4a3a);
        m.position.set(wx + 160, 4, -80);
        addObj(m);
        // Roman arch
        g = new THREE.BoxGeometry(5, 6, 6);
        m = makeMesh(g, 0x1a0a00);
        m.position.set(wx + 160, 3, -80);
        addObj(m);
        // Roman gate lintel
        g = new THREE.BoxGeometry(7, 1, 6);
        m = makeMesh(g, 0x9a4a3a);
        m.position.set(wx + 160, 7, -80);
        addObj(m);
    }

    function buildGuildhall() {
        var g, m, i;
        var gx = X_OFFSET + 10;
        var gz = -120;

        // Ground floor (granite columns)
        g = new THREE.BoxGeometry(24, 4, 14);
        m = makeMesh(g, 0xb0b0b0);
        m.position.set(gx, 2, gz);
        addObj(m);

        // Granite columns - front facade
        for (i = 0; i < 5; i++) {
            g = new THREE.CylinderGeometry(0.6, 0.8, 4.5, 8);
            m = makeMesh(g, 0x909090);
            m.position.set(gx - 9 + i * 4.5, 2.25, gz + 7.1);
            addObj(m);
            // Column capital
            g = new THREE.BoxGeometry(1.5, 0.5, 1.5);
            m = makeMesh(g, 0x808080);
            m.position.set(gx - 9 + i * 4.5, 4.75, gz + 7.1);
            addObj(m);
        }

        // Overhanging upper floor (jettied - Tudor style)
        g = new THREE.BoxGeometry(26, 5, 15);
        m = makeMesh(g, 0x8b6343);
        m.position.set(gx, 7, gz);
        addObj(m);
        // Jettied overhang front
        g = new THREE.BoxGeometry(26, 0.8, 2);
        m = makeMesh(g, 0x7a5535);
        m.position.set(gx, 4.6, gz + 8.5);
        addObj(m);

        // Tudor facade - timber framing pattern (dark stripes)
        var tf;
        for (tf = 0; tf < 6; tf++) {
            g = new THREE.BoxGeometry(0.4, 5, 0.3);
            m = makeMesh(g, 0x2a1a0a);
            m.position.set(gx - 10 + tf * 4, 7, gz + 7.4);
            addObj(m);
        }
        // Horizontal beams
        g = new THREE.BoxGeometry(26, 0.4, 0.3);
        m = makeMesh(g, 0x2a1a0a);
        m.position.set(gx, 5.5, gz + 7.4);
        addObj(m);
        g = new THREE.BoxGeometry(26, 0.4, 0.3);
        m = makeMesh(g, 0x2a1a0a);
        m.position.set(gx, 9.5, gz + 7.4);
        addObj(m);

        // Guildhall roof
        g = new THREE.BoxGeometry(27, 1.5, 16);
        m = makeMesh(g, 0x5a3e2b);
        m.position.set(gx, 10, gz);
        addObj(m);
        // Roof gable ridge
        g = new THREE.BoxGeometry(2, 4, 16);
        m = makeMesh(g, 0x4a3020);
        m.position.set(gx, 13, gz);
        addObj(m);

        // Council chamber sign area - small gable
        g = new THREE.BoxGeometry(8, 4, 0.5);
        m = makeMesh(g, 0x8b6343);
        m.position.set(gx, 11, gz + 7.5);
        addObj(m);

        // Guildhall door
        g = new THREE.BoxGeometry(3, 4, 0.5);
        m = makeMesh(g, 0x3d2b1a);
        m.position.set(gx, 2, gz + 7.5);
        addObj(m);
        // Door arch
        g = new THREE.SphereGeometry(1.5, 8, 4, 0, Math.PI);
        m = makeMesh(g, 0x5a3e2b);
        m.position.set(gx, 4.2, gz + 7.5);
        addObj(m);

        // Windows upper floor
        var gw;
        for (gw = 0; gw < 4; gw++) {
            g = new THREE.BoxGeometry(2.5, 2.5, 0.4);
            m = makeMesh(g, 0x8ab4cc);
            m.position.set(gx - 7.5 + gw * 5, 7.5, gz + 7.5);
            addObj(m);
        }
    }

    function buildShipCanal() {
        var g, m, i;
        var cx = X_OFFSET - 100;
        var cz = 30;

        // Canal water channel
        g = new THREE.BoxGeometry(200, 0.4, 14);
        m = makeMesh(g, 0x1a5276);
        m.position.set(cx + 100, 0.2, cz);
        addObj(m);

        // Canal banks - north
        g = new THREE.BoxGeometry(200, 1.2, 4);
        m = makeMesh(g, 0x5a7a3a);
        m.position.set(cx + 100, 0.6, cz - 9);
        addObj(m);
        // Canal banks - south (towpath side)
        g = new THREE.BoxGeometry(200, 1.2, 4);
        m = makeMesh(g, 0x5a7a3a);
        m.position.set(cx + 100, 0.6, cz + 9);
        addObj(m);

        // Towpath
        g = new THREE.BoxGeometry(200, 0.5, 6);
        m = makeMesh(g, 0x8a7a5a);
        m.position.set(cx + 100, 0.25, cz + 14);
        addObj(m);

        // Canal lock gates - left lock
        g = new THREE.BoxGeometry(2, 3, 14);
        m = makeMesh(g, 0x5a3e2b);
        m.position.set(cx + 40, 1.5, cz);
        addObj(m);
        // Lock gate beam
        g = new THREE.BoxGeometry(10, 0.5, 0.5);
        m = makeMesh(g, 0x4a3020);
        m.position.set(cx + 46, 3, cz);
        addObj(m);

        // Canal lock gates - right lock
        g = new THREE.BoxGeometry(2, 3, 14);
        m = makeMesh(g, 0x5a3e2b);
        m.position.set(cx + 70, 1.5, cz);
        addObj(m);
        g = new THREE.BoxGeometry(10, 0.5, 0.5);
        m = makeMesh(g, 0x4a3020);
        m.position.set(cx + 76, 3, cz);
        addObj(m);

        // Lock walls
        g = new THREE.BoxGeometry(32, 3, 2);
        m = makeMesh(g, 0x8a7a6a);
        m.position.set(cx + 55, 1.5, cz - 8);
        addObj(m);
        g = new THREE.BoxGeometry(32, 3, 2);
        m = makeMesh(g, 0x8a7a6a);
        m.position.set(cx + 55, 1.5, cz + 8);
        addObj(m);

        // Lock keeper's cottage
        g = new THREE.BoxGeometry(10, 5, 8);
        m = makeMesh(g, 0xc8b89a);
        m.position.set(cx + 90, 2.5, cz + 18);
        addObj(m);
        // Cottage roof
        g = new THREE.BoxGeometry(11, 1.5, 9);
        m = makeMesh(g, 0x5a3e2b);
        m.position.set(cx + 90, 5.75, cz + 18);
        addObj(m);
        g = new THREE.BoxGeometry(1.5, 3, 9);
        m = makeMesh(g, 0x4a3020);
        m.position.set(cx + 90, 7.5, cz + 18);
        addObj(m);
        // Cottage door
        g = new THREE.BoxGeometry(1.5, 2.5, 0.5);
        m = makeMesh(g, 0x3d2b1a);
        m.position.set(cx + 90, 1.25, cz + 13.7);
        addObj(m);
        // Cottage chimney
        g = new THREE.BoxGeometry(1.5, 3, 1.5);
        m = makeMesh(g, 0xaa5533);
        m.position.set(cx + 92, 8, cz + 18);
        addObj(m);

        // Narrowboats - 2 boats
        var boatPositions = [20, 130];
        for (i = 0; i < boatPositions.length; i++) {
            // Boat hull
            g = new THREE.BoxGeometry(18, 1.8, 5);
            m = makeMesh(g, 0x8b1a1a + i * 0x001000);
            m.position.set(cx + boatPositions[i], 0.9, cz);
            addObj(m);
            // Boat cabin
            g = new THREE.BoxGeometry(10, 2.5, 4.2);
            m = makeMesh(g, 0xcc7722);
            m.position.set(cx + boatPositions[i] - 2, 2.75, cz);
            addObj(m);
            // Boat cabin roof
            g = new THREE.BoxGeometry(10.5, 0.6, 4.5);
            m = makeMesh(g, 0x555555);
            m.position.set(cx + boatPositions[i] - 2, 4.3, cz);
            addObj(m);
            // Boat bow
            g = new THREE.BoxGeometry(3, 1.5, 5);
            m = makeMesh(g, 0x7a1515 + i * 0x001000);
            m.position.set(cx + boatPositions[i] + 9, 0.75, cz);
            addObj(m);
        }
    }

    function buildDoubleLocksPub() {
        var g, m;
        var px = X_OFFSET - 140;
        var pz = 50;

        // Pub building
        g = new THREE.BoxGeometry(20, 8, 14);
        m = makeMesh(g, 0xd4c5a9);
        m.position.set(px, 4, pz);
        addObj(m);
        // Pub roof
        g = new THREE.BoxGeometry(22, 2, 16);
        m = makeMesh(g, 0x5a3e2b);
        m.position.set(px, 9, pz);
        addObj(m);
        g = new THREE.BoxGeometry(2, 5, 16);
        m = makeMesh(g, 0x4a3020);
        m.position.set(px, 11.5, pz);
        addObj(m);

        // Pub sign
        g = new THREE.BoxGeometry(4, 3, 0.3);
        m = makeMesh(g, 0x2a6633);
        m.position.set(px, 7, pz + 7.1);
        addObj(m);
        // Sign post
        g = new THREE.CylinderGeometry(0.15, 0.15, 4, 6);
        m = makeMesh(g, 0x3d2b1a);
        m.position.set(px + 1.5, 7, pz + 7.1);
        addObj(m);

        // Pub door
        g = new THREE.BoxGeometry(2, 4, 0.5);
        m = makeMesh(g, 0x3d2b1a);
        m.position.set(px - 3, 2, pz + 7.1);
        addObj(m);
        // Pub windows
        g = new THREE.BoxGeometry(3, 3, 0.4);
        m = makeMesh(g, 0x8ab4cc);
        m.position.set(px + 3, 4, pz + 7.1);
        addObj(m);
        g = new THREE.BoxGeometry(3, 3, 0.4);
        m = makeMesh(g, 0x8ab4cc);
        m.position.set(px - 3, 4, pz - 7.1);
        addObj(m);

        // Beer garden tables
        var bt;
        for (bt = 0; bt < 4; bt++) {
            g = new THREE.CylinderGeometry(1.2, 1.2, 0.2, 8);
            m = makeMesh(g, 0x8b6343);
            m.position.set(px - 8 + bt * 4, 1, pz + 10);
            addObj(m);
            // Table leg
            g = new THREE.CylinderGeometry(0.15, 0.15, 1, 6);
            m = makeMesh(g, 0x6b4226);
            m.position.set(px - 8 + bt * 4, 0.5, pz + 10);
            addObj(m);
            // Seat
            g = new THREE.BoxGeometry(3, 0.2, 0.6);
            m = makeMesh(g, 0x8b6343);
            m.position.set(px - 8 + bt * 4, 0.8, pz + 12);
            addObj(m);
        }

        // Chimney stacks
        g = new THREE.BoxGeometry(1.5, 4, 1.5);
        m = makeMesh(g, 0xaa5533);
        m.position.set(px + 6, 13, pz);
        addObj(m);
        g = new THREE.BoxGeometry(1.5, 4, 1.5);
        m = makeMesh(g, 0xaa5533);
        m.position.set(px - 6, 13, pz);
        addObj(m);
    }

    function buildPrincesshay() {
        var g, m, i;
        var px = X_OFFSET + 120;
        var pz = 20;

        // Shopping mall ground surface
        g = new THREE.BoxGeometry(80, 0.3, 50);
        m = makeMesh(g, 0xd8d0c8);
        m.position.set(px, 0.15, pz);
        addObj(m);

        // Glass canopy supports
        var cs;
        for (cs = 0; cs < 6; cs++) {
            g = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
            m = makeMesh(g, 0x888888);
            m.position.set(px - 30 + cs * 12, 4, pz);
            addObj(m);
        }

        // Glass canopy roof panels
        g = new THREE.BoxGeometry(72, 0.4, 20);
        m = makeMesh(g, 0x88aacc);
        m.position.set(px, 8.2, pz);
        addObj(m);

        // Shop units - north row
        for (i = 0; i < 5; i++) {
            g = new THREE.BoxGeometry(14, 8, 10);
            m = makeMesh(g, 0xddd8d0);
            m.position.set(px - 28 + i * 14, 4, pz - 20);
            addObj(m);
            // Shop front glass
            g = new THREE.BoxGeometry(10, 5, 0.4);
            m = makeMesh(g, 0x6699bb);
            m.position.set(px - 28 + i * 14, 3.5, pz - 14.7);
            addObj(m);
        }

        // Shop units - south row
        for (i = 0; i < 5; i++) {
            g = new THREE.BoxGeometry(14, 8, 10);
            m = makeMesh(g, 0xddd8d0);
            m.position.set(px - 28 + i * 14, 4, pz + 20);
            addObj(m);
            g = new THREE.BoxGeometry(10, 5, 0.4);
            m = makeMesh(g, 0x6699bb);
            m.position.set(px - 28 + i * 14, 3.5, pz + 14.7);
            addObj(m);
        }

        // Central fountain
        g = new THREE.CylinderGeometry(4, 4.5, 0.8, 12);
        m = makeMesh(g, 0xaaaaaa);
        m.position.set(px, 0.4, pz);
        addObj(m);
        // Fountain basin water
        g = new THREE.CylinderGeometry(3.5, 3.5, 0.2, 12);
        m = makeMesh(g, 0x1a5276);
        m.position.set(px, 0.9, pz);
        addObj(m);
        // Fountain jet column
        g = new THREE.CylinderGeometry(0.2, 0.2, 3, 6);
        m = makeMesh(g, 0x4a90b8);
        m.position.set(px, 2.5, pz);
        addObj(m);
        // Fountain top sphere
        g = new THREE.SphereGeometry(0.5, 8, 6);
        m = makeMesh(g, 0x5aafdd);
        m.position.set(px, 4.2, pz);
        addObj(m);

        // Mall benches
        var bn;
        for (bn = 0; bn < 4; bn++) {
            g = new THREE.BoxGeometry(4, 0.3, 1);
            m = makeMesh(g, 0x8b6343);
            m.position.set(px - 15 + bn * 10, 0.8, pz - 6);
            addObj(m);
            // Bench legs
            g = new THREE.BoxGeometry(3.5, 0.8, 0.2);
            m = makeMesh(g, 0x6b4226);
            m.position.set(px - 15 + bn * 10, 0.4, pz - 6);
            addObj(m);
        }
    }

    function buildUniversityCampus() {
        var g, m, i;
        var ux = X_OFFSET + 80;
        var uz = -120;

        // Main campus building
        g = new THREE.BoxGeometry(40, 12, 24);
        m = makeMesh(g, 0xc8c0b0);
        m.position.set(ux, 6, uz);
        addObj(m);
        // Building roof
        g = new THREE.BoxGeometry(42, 2, 26);
        m = makeMesh(g, 0x7a7a7a);
        m.position.set(ux, 13, uz);
        addObj(m);

        // Campus windows grid
        for (i = 0; i < 8; i++) {
            var wr;
            for (wr = 0; wr < 3; wr++) {
                g = new THREE.BoxGeometry(3, 2.5, 0.4);
                m = makeMesh(g, 0x8ab4cc);
                m.position.set(ux - 17 + i * 5, 4 + wr * 3.5, uz + 12.1);
                addObj(m);
            }
        }

        // Campus entrance portico
        g = new THREE.BoxGeometry(12, 1, 5);
        m = makeMesh(g, 0xb0b0b0);
        m.position.set(ux, 6, uz + 14.5);
        addObj(m);
        // Portico columns
        for (i = 0; i < 3; i++) {
            g = new THREE.CylinderGeometry(0.5, 0.6, 6, 8);
            m = makeMesh(g, 0xa0a0a0);
            m.position.set(ux - 4 + i * 4, 3, uz + 16);
            addObj(m);
        }

        // Campus library building
        g = new THREE.BoxGeometry(24, 10, 18);
        m = makeMesh(g, 0xd0c8b8);
        m.position.set(ux + 40, 5, uz);
        addObj(m);
        g = new THREE.BoxGeometry(25, 1.5, 19);
        m = makeMesh(g, 0x888878);
        m.position.set(ux + 40, 11, uz);
        addObj(m);

        // Campus green lawn
        g = new THREE.BoxGeometry(80, 0.2, 30);
        m = makeMesh(g, 0x3a7a2a);
        m.position.set(ux + 20, 0.1, uz + 30);
        addObj(m);

        // Campus paths
        g = new THREE.BoxGeometry(4, 0.15, 30);
        m = makeMesh(g, 0xb0a888);
        m.position.set(ux, 0.075, uz + 30);
        addObj(m);
        g = new THREE.BoxGeometry(80, 0.15, 4);
        m = makeMesh(g, 0xb0a888);
        m.position.set(ux + 20, 0.075, uz + 20);
        addObj(m);
    }

    function build() {
        buildQuayside();
        buildCathedral();
        buildCityWalls();
        buildGuildhall();
        buildShipCanal();
        buildDoubleLocksPub();
        buildPrincesshay();
        buildUniversityCampus();
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
