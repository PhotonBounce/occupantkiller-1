window.TunbridgeChalybeate = (function() {
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

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMesh(geo, color) {
        return new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ color: color }));
    }

    function buildPantiles() {
        var i, m, col;
        // Lower paved walkway
        m = makeMesh(new THREE.BoxGeometry(80, 0.3, 12), 0xc8b89a);
        m.position.set(10760, 0.15, 0);
        addMesh(m);

        // Upper walkway deck
        m = makeMesh(new THREE.BoxGeometry(80, 0.4, 8), 0xd4c4a0);
        m.position.set(10760, 3.4, -2);
        addMesh(m);

        // Colonnade columns along front of upper walkway
        for (i = 0; i < 18; i++) {
            col = makeMesh(new THREE.CylinderGeometry(0.3, 0.35, 3.3, 8), 0xe8dcc8);
            col.position.set(10720 + i * 4.5, 1.65, -5.5);
            addMesh(col);
        }

        // Column capitals (small boxes on top of each column)
        for (i = 0; i < 18; i++) {
            m = makeMesh(new THREE.BoxGeometry(0.8, 0.25, 0.8), 0xf0e8d0);
            m.position.set(10720 + i * 4.5, 3.42, -5.5);
            addMesh(m);
        }

        // Shop facades behind upper walkway
        m = makeMesh(new THREE.BoxGeometry(80, 5, 4), 0xd4b896);
        m.position.set(10760, 2.5, -4);
        addMesh(m);

        // Shop roof
        m = makeMesh(new THREE.BoxGeometry(80, 0.5, 5), 0xb0a080);
        m.position.set(10760, 5.25, -3.5);
        addMesh(m);

        // Shop windows
        for (i = 0; i < 10; i++) {
            m = makeMesh(new THREE.BoxGeometry(2.5, 1.8, 0.15), 0x8899bb);
            m.position.set(10724 + i * 8, 2.8, -2.05);
            addMesh(m);
        }

        // Bandstand at east end of Pantiles
        // Bandstand base
        m = makeMesh(new THREE.CylinderGeometry(4, 4.2, 0.5, 8), 0xc8b48a);
        m.position.set(10800, 0.25, 4);
        addMesh(m);

        // Bandstand columns (octagonal)
        for (i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            col = makeMesh(new THREE.CylinderGeometry(0.2, 0.2, 3.5, 6), 0xe0d0b0);
            col.position.set(10800 + Math.cos(angle) * 3.5, 2.0, 4 + Math.sin(angle) * 3.5);
            addMesh(col);
        }

        // Bandstand roof (cone)
        m = makeMesh(new THREE.ConeGeometry(4.5, 2.5, 8), 0x6a8060);
        m.position.set(10800, 4.75, 4);
        addMesh(m);

        // Spring pump room dome structure
        m = makeMesh(new THREE.CylinderGeometry(5, 5, 4, 12), 0xddd0b8);
        m.position.set(10720, 2.0, 8);
        addMesh(m);

        m = makeMesh(new THREE.SphereGeometry(5, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xccc0a8);
        m.position.set(10720, 4.0, 8);
        addMesh(m);

        // Pump room columns
        for (i = 0; i < 6; i++) {
            var ang = (i / 6) * Math.PI * 2;
            col = makeMesh(new THREE.CylinderGeometry(0.3, 0.35, 4, 8), 0xe8dcc8);
            col.position.set(10720 + Math.cos(ang) * 5.2, 2.0, 8 + Math.sin(ang) * 5.2);
            addMesh(col);
        }
    }

    function buildChalybeateSpring() {
        var i, m, col;
        // Wellhead stone canopy base platform
        m = makeMesh(new THREE.BoxGeometry(6, 0.4, 6), 0xb8a888);
        m.position.set(10730, 0.2, 18);
        addMesh(m);

        // Wellhead columns (4 corners)
        var springColPos = [
            [-2, -2], [2, -2], [-2, 2], [2, 2]
        ];
        for (i = 0; i < 4; i++) {
            col = makeMesh(new THREE.CylinderGeometry(0.25, 0.28, 3.5, 8), 0xd0c0a0);
            col.position.set(10730 + springColPos[i][0], 2.15, 18 + springColPos[i][1]);
            addMesh(col);
        }

        // Canopy entablature
        m = makeMesh(new THREE.BoxGeometry(5.5, 0.4, 5.5), 0xc8b898);
        m.position.set(10730, 3.6, 18);
        addMesh(m);

        // Dome on top
        m = makeMesh(new THREE.SphereGeometry(2.5, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc0b090);
        m.position.set(10730, 3.8, 18);
        addMesh(m);

        // Dome finial
        m = makeMesh(new THREE.CylinderGeometry(0.1, 0.15, 0.6, 6), 0x888070);
        m.position.set(10730, 6.35, 18);
        addMesh(m);

        // Iron-stained water trough (orange-brown)
        m = makeMesh(new THREE.BoxGeometry(4, 0.5, 1.5), 0x8b4513);
        m.position.set(10730, 0.55, 20.5);
        addMesh(m);

        // Trough sides
        m = makeMesh(new THREE.BoxGeometry(4, 0.5, 0.15), 0x7a3c10);
        m.position.set(10730, 0.8, 21.2);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(4, 0.5, 0.15), 0x7a3c10);
        m.position.set(10730, 0.8, 19.8);
        addMesh(m);

        // Water surface (orange tinted)
        m = makeMesh(new THREE.BoxGeometry(3.6, 0.08, 1.2), 0xb85c20);
        m.position.set(10730, 1.02, 20.5);
        addMesh(m);

        // Decorative iron pump handle
        m = makeMesh(new THREE.CylinderGeometry(0.08, 0.08, 1.2, 6), 0x444444);
        m.position.set(10730, 1.4, 19.5);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(0.8, 0.1, 0.1), 0x444444);
        m.position.set(10730, 1.9, 19.5);
        addMesh(m);
    }

    function buildHighRocks() {
        var i, m;
        // Dramatic sandstone rock outcrops — tall irregular clusters
        var rockData = [
            [10760, 0, 60, 8, 14, 7, 0xc4834a],
            [10768, 0, 55, 5, 18, 6, 0xb87840],
            [10775, 0, 63, 7, 12, 8, 0xcc8a50],
            [10755, 0, 70, 6, 16, 5, 0xbf7d45],
            [10782, 0, 58, 4, 20, 5, 0xc48048],
            [10750, 0, 58, 9, 10, 8, 0xb87040],
            [10770, 0, 72, 5, 15, 7, 0xca8248],
            [10758, 0, 50, 4, 11, 6, 0xc07844],
            [10788, 0, 66, 6, 13, 7, 0xbb7a42],
            [10745, 0, 65, 7, 17, 6, 0xc6804a]
        ];

        for (i = 0; i < rockData.length; i++) {
            var rd = rockData[i];
            m = makeMesh(new THREE.BoxGeometry(rd[3], rd[4], rd[5]), rd[6]);
            m.position.set(rd[0], rd[4] / 2, rd[2]);
            addMesh(m);
        }

        // Secondary smaller rocks at base
        var smallRocks = [
            [10762, 0, 57, 3, 5, 4, 0xb87845],
            [10772, 0, 68, 4, 7, 3, 0xc07840],
            [10778, 0, 60, 3, 6, 4, 0xbb7a42],
            [10748, 0, 62, 4, 8, 3, 0xc28045]
        ];

        for (i = 0; i < smallRocks.length; i++) {
            var sr = smallRocks[i];
            m = makeMesh(new THREE.BoxGeometry(sr[3], sr[4], sr[5]), sr[6]);
            m.position.set(sr[0], sr[4] / 2, sr[2]);
            addMesh(m);
        }

        // Suspension bridge between rock groups using LineSegments
        var bridgeGeo = new THREE.BufferGeometry();
        var bridgeVerts = [];

        // Bridge deck planks (horizontal lines)
        var j;
        for (i = 0; i < 12; i++) {
            var bx = 10758 + i * 2.5;
            bridgeVerts.push(bx, 13, 60, bx, 13, 62);
        }

        // Main cable left side (catenary curve approximation)
        var cablePoints = 20;
        for (i = 0; i < cablePoints - 1; i++) {
            var t0 = i / (cablePoints - 1);
            var t1 = (i + 1) / (cablePoints - 1);
            var cx0 = 10758 + t0 * 27;
            var cx1 = 10758 + t1 * 27;
            var cy0 = 16 - 4 * (4 * t0 * (1 - t0));
            var cy1 = 16 - 4 * (4 * t1 * (1 - t1));
            bridgeVerts.push(cx0, cy0, 60, cx1, cy1, 60);
        }

        // Second cable
        for (i = 0; i < cablePoints - 1; i++) {
            var ta0 = i / (cablePoints - 1);
            var ta1 = (i + 1) / (cablePoints - 1);
            var cxa0 = 10758 + ta0 * 27;
            var cxa1 = 10758 + ta1 * 27;
            var cya0 = 16 - 4 * (4 * ta0 * (1 - ta0));
            var cya1 = 16 - 4 * (4 * ta1 * (1 - ta1));
            bridgeVerts.push(cxa0, cya0, 62, cxa1, cya1, 62);
        }

        // Vertical suspenders from cable to deck
        for (i = 0; i < 10; i++) {
            var st = i / 9;
            var sx = 10758 + st * 27;
            var sy = 16 - 4 * (4 * st * (1 - st));
            bridgeVerts.push(sx, 13, 60, sx, sy, 60);
            bridgeVerts.push(sx, 13, 62, sx, sy, 62);
        }

        bridgeGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(bridgeVerts), 3));
        var bridgeMat = new THREE.LineBasicMaterial({ color: 0x553322 });
        var bridgeLines = new THREE.LineSegments(bridgeGeo, bridgeMat);
        scene.add(bridgeLines);
        objects.push(bridgeLines);

        // Bridge towers
        m = makeMesh(new THREE.BoxGeometry(0.8, 5, 0.8), 0x886644);
        m.position.set(10758, 15.5, 61);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(0.8, 5, 0.8), 0x886644);
        m.position.set(10785, 15.5, 61);
        addMesh(m);

        // Cross beams on towers
        m = makeMesh(new THREE.BoxGeometry(0.2, 0.4, 3), 0x886644);
        m.position.set(10758, 17, 61);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(0.2, 0.4, 3), 0x886644);
        m.position.set(10785, 17, 61);
        addMesh(m);
    }

    function buildCalverleyPark() {
        var i, m;
        // Park lawn (large green ground)
        m = makeMesh(new THREE.BoxGeometry(70, 0.2, 40), 0x5a8a3a);
        m.position.set(10760, 0.1, -50);
        addMesh(m);

        // Regency terraces in crescent layout — curved row of townhouses
        var numHouses = 9;
        var crescentRadius = 35;
        var crescentCenter = [10760, -50];

        for (i = 0; i < numHouses; i++) {
            var hAngle = (-0.6 + i * (1.2 / (numHouses - 1)));
            var hx = crescentCenter[0] + Math.sin(hAngle) * crescentRadius;
            var hz = crescentCenter[1] - Math.cos(hAngle) * crescentRadius;

            // House body
            m = makeMesh(new THREE.BoxGeometry(6, 8, 5), 0xe8d8b8);
            m.position.set(hx, 4, hz);
            m.rotation.y = hAngle;
            addMesh(m);

            // House roof
            m = makeMesh(new THREE.BoxGeometry(6.4, 1.2, 5.4), 0xb0a080);
            m.position.set(hx, 8.6, hz);
            m.rotation.y = hAngle;
            addMesh(m);

            // Windows (front facing)
            var wx = hx + Math.sin(hAngle) * 2.6;
            var wz = hz + Math.cos(hAngle) * 2.6;

            m = makeMesh(new THREE.BoxGeometry(1.2, 1.5, 0.12), 0x8899bb);
            m.position.set(wx - Math.cos(hAngle) * 1.5, 5, wz + Math.sin(hAngle) * 1.5);
            m.rotation.y = hAngle;
            addMesh(m);

            m = makeMesh(new THREE.BoxGeometry(1.2, 1.5, 0.12), 0x8899bb);
            m.position.set(wx + Math.cos(hAngle) * 1.5, 5, wz - Math.sin(hAngle) * 1.5);
            m.rotation.y = hAngle;
            addMesh(m);

            // Upper windows
            m = makeMesh(new THREE.BoxGeometry(1.2, 1.3, 0.12), 0x8899bb);
            m.position.set(wx - Math.cos(hAngle) * 1.5, 7, wz + Math.sin(hAngle) * 1.5);
            m.rotation.y = hAngle;
            addMesh(m);

            m = makeMesh(new THREE.BoxGeometry(1.2, 1.3, 0.12), 0x8899bb);
            m.position.set(wx + Math.cos(hAngle) * 1.5, 7, wz - Math.sin(hAngle) * 1.5);
            m.rotation.y = hAngle;
            addMesh(m);

            // Door portico column left
            var doorX = hx + Math.sin(hAngle) * 2.55;
            var doorZ = hz + Math.cos(hAngle) * 2.55;
            m = makeMesh(new THREE.CylinderGeometry(0.15, 0.18, 3, 6), 0xf0e8d0);
            m.position.set(doorX - Math.cos(hAngle) * 0.5, 1.5, doorZ + Math.sin(hAngle) * 0.5);
            addMesh(m);

            // Door portico column right
            m = makeMesh(new THREE.CylinderGeometry(0.15, 0.18, 3, 6), 0xf0e8d0);
            m.position.set(doorX + Math.cos(hAngle) * 0.5, 1.5, doorZ - Math.sin(hAngle) * 0.5);
            addMesh(m);
        }

        // Calverley Hotel — larger building at end of crescent
        m = makeMesh(new THREE.BoxGeometry(18, 12, 10), 0xddd0b0);
        m.position.set(10800, 6, -50);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(18.4, 1.5, 10.4), 0xb8aa88);
        m.position.set(10800, 12.75, -50);
        addMesh(m);

        // Hotel pediment
        m = makeMesh(new THREE.CylinderGeometry(0, 9, 3, 4), 0xd0c4a0);
        m.position.set(10800, 15, -50);
        m.rotation.y = Math.PI / 4;
        addMesh(m);

        // Hotel columns (grand entrance)
        for (i = 0; i < 5; i++) {
            m = makeMesh(new THREE.CylinderGeometry(0.4, 0.45, 10, 8), 0xece0c8);
            m.position.set(10793 + i * 3.5, 5, -45.1);
            addMesh(m);
        }

        // Hotel entrance steps
        m = makeMesh(new THREE.BoxGeometry(10, 0.4, 2), 0xc0b090);
        m.position.set(10800, 0.2, -44.5);
        addMesh(m);

        // Park trees (simple cylinder + cone shapes)
        var treePosData = [
            [10740, -40], [10745, -55], [10750, -70],
            [10780, -40], [10785, -68], [10790, -45],
            [10760, -35], [10770, -72], [10755, -62]
        ];

        for (i = 0; i < treePosData.length; i++) {
            var tp = treePosData[i];
            m = makeMesh(new THREE.CylinderGeometry(0.3, 0.4, 3, 6), 0x6b4c2a);
            m.position.set(tp[0], 1.5, tp[1]);
            addMesh(m);

            m = makeMesh(new THREE.ConeGeometry(2.5, 5, 7), 0x2d6e30);
            m.position.set(tp[0], 5.5, tp[1]);
            addMesh(m);
        }

        // Park path
        m = makeMesh(new THREE.BoxGeometry(3, 0.15, 35), 0xd4c89a);
        m.position.set(10760, 0.18, -50);
        addMesh(m);

        // Park bench
        m = makeMesh(new THREE.BoxGeometry(2, 0.15, 0.6), 0x8b6840);
        m.position.set(10750, 0.6, -48);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(2, 1.0, 0.12), 0x8b6840);
        m.position.set(10750, 1.1, -48.3);
        addMesh(m);
    }

    function buildKingCharlesChurch() {
        var i, m;
        // Church nave
        m = makeMesh(new THREE.BoxGeometry(16, 10, 30), 0xd8cbb0);
        m.position.set(10740, 5, -18);
        addMesh(m);

        // Church nave roof (barrel suggestion via box)
        m = makeMesh(new THREE.BoxGeometry(16.4, 3, 30.4), 0xc0b090);
        m.position.set(10740, 11.5, -18);
        addMesh(m);

        // Chancel extension east end
        m = makeMesh(new THREE.BoxGeometry(10, 9, 12), 0xd4c8a8);
        m.position.set(10740, 4.5, -29);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(10.4, 2, 12.4), 0xbcb090);
        m.position.set(10740, 10, -29);
        addMesh(m);

        // Tower on west end (baroque)
        m = makeMesh(new THREE.BoxGeometry(9, 18, 9), 0xdad0b0);
        m.position.set(10740, 9, -3);
        addMesh(m);

        // Tower upper section
        m = makeMesh(new THREE.BoxGeometry(7, 6, 7), 0xe0d4b8);
        m.position.set(10740, 21, -3);
        addMesh(m);

        // Cupola drum
        m = makeMesh(new THREE.CylinderGeometry(2.5, 2.8, 3, 10), 0xd8ccb0);
        m.position.set(10740, 25.5, -3);
        addMesh(m);

        // Cupola dome
        m = makeMesh(new THREE.SphereGeometry(2.5, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2), 0xc8bca0);
        m.position.set(10740, 27, -3);
        addMesh(m);

        // Dome lantern
        m = makeMesh(new THREE.CylinderGeometry(0.6, 0.7, 1.2, 8), 0xd0c4a8);
        m.position.set(10740, 29.5, -3);
        addMesh(m);

        m = makeMesh(new THREE.ConeGeometry(0.6, 1, 8), 0xb8ac90);
        m.position.set(10740, 30.6, -3);
        addMesh(m);

        // Baroque pilasters on tower
        var pilasterXs = [-4, 4];
        for (i = 0; i < 2; i++) {
            m = makeMesh(new THREE.BoxGeometry(0.7, 18, 0.7), 0xe8dcc0);
            m.position.set(10740 + pilasterXs[i], 9, -3 + 4.7);
            addMesh(m);

            m = makeMesh(new THREE.BoxGeometry(0.7, 18, 0.7), 0xe8dcc0);
            m.position.set(10740 + pilasterXs[i], 9, -3 - 4.7);
            addMesh(m);
        }

        // Triple windows on nave (triple lancet)
        var winData = [
            [10733, 5.5, -18], [10747, 5.5, -18]
        ];

        for (i = 0; i < 2; i++) {
            var wRow = winData[i];
            // Three windows side by side
            m = makeMesh(new THREE.BoxGeometry(1.5, 2.8, 0.15), 0x9aaabb);
            m.position.set(wRow[0], wRow[1], wRow[2] - 7);
            addMesh(m);

            m = makeMesh(new THREE.BoxGeometry(1.5, 2.8, 0.15), 0x9aaabb);
            m.position.set(wRow[0], wRow[1], wRow[2]);
            addMesh(m);

            m = makeMesh(new THREE.BoxGeometry(1.5, 2.8, 0.15), 0x9aaabb);
            m.position.set(wRow[0], wRow[1], wRow[2] + 7);
            addMesh(m);
        }

        // East window (large triple)
        for (i = 0; i < 3; i++) {
            m = makeMesh(new THREE.BoxGeometry(2, 3.5, 0.15), 0x9aaabb);
            m.position.set(10740 - 3 + i * 3, 5.5, -8.1);
            addMesh(m);
        }

        // Church entrance doors
        m = makeMesh(new THREE.BoxGeometry(3.5, 4.5, 0.2), 0x7a5a30);
        m.position.set(10740, 2.25, 1.2);
        addMesh(m);

        // Door arch
        m = makeMesh(new THREE.CylinderGeometry(1.75, 1.75, 0.2, 8, 1, false, 0, Math.PI), 0xd4c8a8);
        m.rotation.x = Math.PI / 2;
        m.position.set(10740, 4.75, 1.2);
        addMesh(m);

        // Churchyard wall
        m = makeMesh(new THREE.BoxGeometry(30, 1.5, 0.4), 0xbcb098);
        m.position.set(10740, 0.75, 6);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(0.4, 1.5, 20), 0xbcb098);
        m.position.set(10726, 0.75, -6);
        addMesh(m);

        m = makeMesh(new THREE.BoxGeometry(0.4, 1.5, 20), 0xbcb098);
        m.position.set(10754, 0.75, -6);
        addMesh(m);
    }

    function buildGroundAndRoads() {
        // Base ground
        var m = makeMesh(new THREE.BoxGeometry(200, 0.2, 180), 0x7a8c5a);
        m.position.set(10760, -0.1, -30);
        addMesh(m);

        // Main road along Pantiles
        m = makeMesh(new THREE.BoxGeometry(85, 0.15, 8), 0x888880);
        m.position.set(10760, 0.08, 12);
        addMesh(m);

        // Cross road
        m = makeMesh(new THREE.BoxGeometry(8, 0.15, 60), 0x888880);
        m.position.set(10760, 0.08, -15);
        addMesh(m);
    }

    function build() {
        buildGroundAndRoads();
        buildPantiles();
        buildChalybeateSpring();
        buildHighRocks();
        buildCalverleyPark();
        buildKingCharlesChurch();
    }

    function update(delta) { }

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
