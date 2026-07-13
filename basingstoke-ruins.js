window.BasingstokeRuins = (function() {
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

    function addMesh(geo, mat, x, y, z) {
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeLambert(hex) {
        return new THREE.MeshLambertMaterial({ color: hex });
    }

    function buildBasingHouseRuins() {
        var bx = 12800;
        var bz = -200;

        // Earthwork ramparts
        var rampartMat = makeLambert(0x5c4a2a);
        addMesh(new THREE.BoxGeometry(300, 8, 20), rampartMat, bx, 4, bz);
        addMesh(new THREE.BoxGeometry(20, 8, 280), rampartMat, bx - 140, 4, bz + 10);
        addMesh(new THREE.BoxGeometry(20, 8, 280), rampartMat, bx + 140, 4, bz + 10);
        addMesh(new THREE.BoxGeometry(300, 8, 20), rampartMat, bx, 4, bz + 280);

        // Moat outline (flat water plane)
        var moatMat = makeLambert(0x2a4a6b);
        addMesh(new THREE.BoxGeometry(320, 1, 10), moatMat, bx, 0.5, bz - 15);
        addMesh(new THREE.BoxGeometry(320, 1, 10), moatMat, bx, 0.5, bz + 295);
        addMesh(new THREE.BoxGeometry(10, 1, 300), moatMat, bx - 155, 0.5, bz + 140);
        addMesh(new THREE.BoxGeometry(10, 1, 300), moatMat, bx + 155, 0.5, bz + 140);

        // Ruined gatehouse towers
        var towerMat = makeLambert(0x8b6914);
        // Left gatehouse tower - partially collapsed
        addMesh(new THREE.CylinderGeometry(10, 12, 30, 8), towerMat, bx - 25, 15, bz + 5);
        addMesh(new THREE.CylinderGeometry(10, 12, 15, 8), towerMat, bx + 25, 7, bz + 5);

        // Collapsed curtain walls - broken sections
        var wallMat = makeLambert(0x7a5c1e);
        addMesh(new THREE.BoxGeometry(40, 12, 5), wallMat, bx - 70, 6, bz + 5);
        addMesh(new THREE.BoxGeometry(30, 6, 5), wallMat, bx - 115, 3, bz + 5);
        addMesh(new THREE.BoxGeometry(50, 10, 5), wallMat, bx + 65, 5, bz + 5);

        // Corner towers - ruined
        addMesh(new THREE.CylinderGeometry(8, 10, 18, 8), towerMat, bx - 140, 9, bz + 10);
        addMesh(new THREE.CylinderGeometry(8, 10, 10, 8), towerMat, bx + 140, 5, bz + 10);
        addMesh(new THREE.CylinderGeometry(8, 10, 22, 8), towerMat, bx - 140, 11, bz + 270);
        addMesh(new THREE.CylinderGeometry(8, 10, 8, 8), towerMat, bx + 140, 4, bz + 270);

        // Tudor brick remnants - interior walls collapsed
        var brickMat = makeLambert(0xa0522d);
        addMesh(new THREE.BoxGeometry(60, 8, 4), brickMat, bx - 30, 4, bz + 80);
        addMesh(new THREE.BoxGeometry(4, 15, 50), brickMat, bx + 20, 7, bz + 120);
        addMesh(new THREE.BoxGeometry(80, 5, 4), brickMat, bx + 50, 2, bz + 160);
        addMesh(new THREE.BoxGeometry(4, 20, 70), brickMat, bx - 60, 10, bz + 200);
        addMesh(new THREE.BoxGeometry(50, 3, 4), brickMat, bx - 80, 1, bz + 230);

        // Rubble piles
        var rubbleMat = makeLambert(0x6b5a3a);
        addMesh(new THREE.SphereGeometry(8, 6, 4), rubbleMat, bx + 30, 4, bz + 50);
        addMesh(new THREE.SphereGeometry(6, 6, 4), rubbleMat, bx - 50, 3, bz + 100);
        addMesh(new THREE.SphereGeometry(10, 6, 4), rubbleMat, bx + 60, 5, bz + 180);
        addMesh(new THREE.SphereGeometry(7, 6, 4), rubbleMat, bx - 40, 3, bz + 240);

        // Dovecote
        var dovecoteMat = makeLambert(0xc8a870);
        addMesh(new THREE.CylinderGeometry(6, 7, 14, 10), dovecoteMat, bx + 100, 7, bz + 140);
        addMesh(new THREE.ConeGeometry(7, 6, 10), dovecoteMat, bx + 100, 17, bz + 140);

        // Great barn
        var barnMat = makeLambert(0x8b4513);
        addMesh(new THREE.BoxGeometry(60, 10, 20), barnMat, bx - 80, 5, bz + 200);
        addMesh(new THREE.BoxGeometry(62, 1, 22), makeLambert(0x5c3010), bx - 80, 10, bz + 200);
    }

    function buildFestivalPlace() {
        var fx = 12800;
        var fz = 200;

        // Main mall building - large curved frontage
        var glassMat = makeLambert(0x88aacc);
        var concreteMat = makeLambert(0xc8c8c0);
        var steelMat = makeLambert(0x909090);

        // Main building body
        addMesh(new THREE.BoxGeometry(220, 25, 80), concreteMat, fx, 12, fz);

        // Glass front facade sections
        addMesh(new THREE.BoxGeometry(70, 22, 3), glassMat, fx - 70, 11, fz - 41);
        addMesh(new THREE.BoxGeometry(70, 22, 3), glassMat, fx, 11, fz - 41);
        addMesh(new THREE.BoxGeometry(70, 22, 3), glassMat, fx + 70, 11, fz - 41);

        // Atrium roof structure
        addMesh(new THREE.BoxGeometry(160, 2, 60), glassMat, fx, 26, fz);

        // Anchor stores - larger boxes at ends
        var storeMat = makeLambert(0xd0c8b8);
        addMesh(new THREE.BoxGeometry(50, 28, 85), storeMat, fx - 120, 14, fz + 2);
        addMesh(new THREE.BoxGeometry(50, 28, 85), storeMat, fx + 120, 14, fz + 2);

        // Multi-storey car park
        var carParkMat = makeLambert(0xa0a090);
        addMesh(new THREE.BoxGeometry(80, 30, 60), carParkMat, fx + 160, 15, fz + 10);
        // Car park floors visible
        addMesh(new THREE.BoxGeometry(82, 1, 62), makeLambert(0x888880), fx + 160, 10, fz + 10);
        addMesh(new THREE.BoxGeometry(82, 1, 62), makeLambert(0x888880), fx + 160, 20, fz + 10);

        // Entrance canopy
        addMesh(new THREE.BoxGeometry(80, 2, 15), steelMat, fx, 20, fz - 47);

        // Secondary mall wing
        addMesh(new THREE.BoxGeometry(80, 20, 60), concreteMat, fx - 150, 10, fz + 20);
    }

    function buildWarMemorialPark() {
        var wx = 12800;
        var wz = 450;

        // Park ground
        var grassMat = makeLambert(0x4a7a3a);
        addMesh(new THREE.BoxGeometry(200, 1, 200), grassMat, wx, 0, wz);

        // Cenotaph / War memorial cross on plinth
        var stoneMat = makeLambert(0xe0d8c8);
        // Plinth base
        addMesh(new THREE.BoxGeometry(12, 2, 12), stoneMat, wx, 1, wz);
        // Plinth step
        addMesh(new THREE.BoxGeometry(8, 2, 8), stoneMat, wx, 3, wz);
        // Column shaft
        addMesh(new THREE.BoxGeometry(3, 18, 3), stoneMat, wx, 13, wz);
        // Cross arms
        addMesh(new THREE.BoxGeometry(10, 2, 2), stoneMat, wx, 20, wz);
        // Cross top
        addMesh(new THREE.BoxGeometry(2, 6, 2), stoneMat, wx, 25, wz);

        // Ornamental flower beds
        var bedMat = makeLambert(0x8b6050);
        var flowerMat = makeLambert(0xcc4488);
        var flowerMat2 = makeLambert(0xffaa22);
        // Four symmetrical beds around the memorial
        addMesh(new THREE.BoxGeometry(20, 1, 8), bedMat, wx - 25, 0.5, wz - 20);
        addMesh(new THREE.BoxGeometry(20, 1, 8), bedMat, wx + 25, 0.5, wz - 20);
        addMesh(new THREE.BoxGeometry(20, 1, 8), bedMat, wx - 25, 0.5, wz + 20);
        addMesh(new THREE.BoxGeometry(20, 1, 8), bedMat, wx + 25, 0.5, wz + 20);
        // Flowers in beds
        addMesh(new THREE.SphereGeometry(3, 6, 4), flowerMat, wx - 25, 2, wz - 20);
        addMesh(new THREE.SphereGeometry(3, 6, 4), flowerMat2, wx + 25, 2, wz - 20);
        addMesh(new THREE.SphereGeometry(3, 6, 4), flowerMat, wx - 25, 2, wz + 20);
        addMesh(new THREE.SphereGeometry(3, 6, 4), flowerMat2, wx + 25, 2, wz + 20);

        // Fountain basin
        var basinMat = makeLambert(0x7090a0);
        addMesh(new THREE.CylinderGeometry(15, 15, 1, 16), basinMat, wx, 0.5, wz + 60);
        addMesh(new THREE.CylinderGeometry(15, 15, 1, 16), makeLambert(0x3060a0), wx, 0.6, wz + 60);
        // Fountain jet
        addMesh(new THREE.CylinderGeometry(0.5, 1, 8, 6), makeLambert(0xaaccee), wx, 4, wz + 60);

        // Park paths
        var pathMat = makeLambert(0xd8c8a0);
        addMesh(new THREE.BoxGeometry(4, 0.2, 120), pathMat, wx, 0.1, wz);
        addMesh(new THREE.BoxGeometry(120, 0.2, 4), pathMat, wx, 0.1, wz);

        // Park benches (simple)
        var benchMat = makeLambert(0x8b5a2b);
        addMesh(new THREE.BoxGeometry(4, 1, 1.5), benchMat, wx - 20, 0.5, wz - 5);
        addMesh(new THREE.BoxGeometry(4, 1, 1.5), benchMat, wx + 20, 0.5, wz - 5);
        addMesh(new THREE.BoxGeometry(4, 1, 1.5), benchMat, wx - 20, 0.5, wz + 5);
        addMesh(new THREE.BoxGeometry(4, 1, 1.5), benchMat, wx + 20, 0.5, wz + 5);

        // Trees
        var trunkMat = makeLambert(0x5c3a1e);
        var leafMat = makeLambert(0x2d6a1a);
        var treePositions = [
            [wx - 80, wz - 80], [wx + 80, wz - 80],
            [wx - 80, wz + 80], [wx + 80, wz + 80],
            [wx - 40, wz - 80], [wx + 40, wz - 80]
        ];
        for (var ti = 0; ti < treePositions.length; ti++) {
            var tp = treePositions[ti];
            addMesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), trunkMat, tp[0], 4, tp[1]);
            addMesh(new THREE.SphereGeometry(6, 7, 5), leafMat, tp[0], 12, tp[1]);
        }
    }

    function buildCanalBasin() {
        var cx = 12800;
        var cz = 700;

        // Canal water
        var waterMat = makeLambert(0x2a6080);
        addMesh(new THREE.BoxGeometry(200, 1, 30), waterMat, cx, 0, cz);

        // Canal banks
        var bankMat = makeLambert(0x7a6a50);
        addMesh(new THREE.BoxGeometry(200, 2, 6), bankMat, cx, 1, cz - 18);
        addMesh(new THREE.BoxGeometry(200, 2, 6), bankMat, cx, 1, cz + 18);

        // Basin - wider turning area
        addMesh(new THREE.BoxGeometry(60, 1, 60), waterMat, cx + 80, 0, cz);

        // Narrowboats - elongated boxes with colour
        var boat1Mat = makeLambert(0xcc3322);
        var boat2Mat = makeLambert(0x2244aa);
        var boat3Mat = makeLambert(0x228833);
        addMesh(new THREE.BoxGeometry(20, 3, 4), boat1Mat, cx - 60, 1.5, cz - 8);
        addMesh(new THREE.BoxGeometry(20, 3, 4), boat2Mat, cx - 30, 1.5, cz - 8);
        addMesh(new THREE.BoxGeometry(20, 3, 4), boat3Mat, cx - 60, 1.5, cz + 8);
        // Boat cabins
        var cabinMat = makeLambert(0xf0e0c0);
        addMesh(new THREE.BoxGeometry(12, 2, 3), cabinMat, cx - 60, 4, cz - 8);
        addMesh(new THREE.BoxGeometry(12, 2, 3), cabinMat, cx - 30, 4, cz - 8);
        addMesh(new THREE.BoxGeometry(12, 2, 3), cabinMat, cx - 60, 4, cz + 8);

        // Lock gates
        var gateMat = makeLambert(0x4a3520);
        addMesh(new THREE.BoxGeometry(2, 6, 14), gateMat, cx + 20, 3, cz);
        addMesh(new THREE.BoxGeometry(2, 6, 14), gateMat, cx + 40, 3, cz);
        // Gate balance beams
        addMesh(new THREE.BoxGeometry(12, 1, 1), gateMat, cx + 20, 6.5, cz - 7);
        addMesh(new THREE.BoxGeometry(12, 1, 1), gateMat, cx + 20, 6.5, cz + 7);
        addMesh(new THREE.BoxGeometry(12, 1, 1), gateMat, cx + 40, 6.5, cz - 7);
        addMesh(new THREE.BoxGeometry(12, 1, 1), gateMat, cx + 40, 6.5, cz + 7);

        // Wharf buildings
        var wharfMat = makeLambert(0xb87040);
        addMesh(new THREE.BoxGeometry(30, 10, 20), wharfMat, cx - 80, 5, cz + 35);
        addMesh(new THREE.BoxGeometry(25, 8, 20), wharfMat, cx - 40, 4, cz + 35);
        // Wharf roofs
        addMesh(new THREE.BoxGeometry(32, 1, 22), makeLambert(0x6a3820), cx - 80, 10, cz + 35);
        addMesh(new THREE.BoxGeometry(27, 1, 22), makeLambert(0x6a3820), cx - 40, 8, cz + 35);

        // Canal towpath
        var towpathMat = makeLambert(0xc0a870);
        addMesh(new THREE.BoxGeometry(200, 0.2, 8), towpathMat, cx, 0.1, cz + 22);

        // Warehouse
        var warehouseMat = makeLambert(0x8a6840);
        addMesh(new THREE.BoxGeometry(50, 14, 30), warehouseMat, cx + 80, 7, cz + 40);
        addMesh(new THREE.BoxGeometry(52, 1, 32), makeLambert(0x5a3820), cx + 80, 14, cz + 40);
    }

    function buildTownCentre() {
        var tx = 12800;
        var tz = 0;

        // Church Square / St Michael's church tower
        var churchMat = makeLambert(0x9a8060);
        // Main nave body
        addMesh(new THREE.BoxGeometry(30, 14, 20), churchMat, tx - 200, 7, tz - 50);
        // Tower
        addMesh(new THREE.BoxGeometry(10, 30, 10), churchMat, tx - 190, 15, tz - 60);
        // Tower top battlements
        addMesh(new THREE.BoxGeometry(12, 3, 12), churchMat, tx - 190, 31, tz - 60);
        // Spire
        addMesh(new THREE.ConeGeometry(4, 15, 4), churchMat, tx - 190, 42, tz - 60);
        // Church porch
        addMesh(new THREE.BoxGeometry(8, 10, 6), churchMat, tx - 215, 5, tz - 50);
        // Churchyard wall
        var cywallMat = makeLambert(0x7a6a50);
        addMesh(new THREE.BoxGeometry(60, 3, 2), cywallMat, tx - 200, 1.5, tz - 42);
        addMesh(new THREE.BoxGeometry(2, 3, 40), cywallMat, tx - 172, 1.5, tz - 62);

        // The Malls pedestrian area - covered walkways
        var mallsMat = makeLambert(0xd0c8b8);
        var glassMat = makeLambert(0x99bbcc);
        addMesh(new THREE.BoxGeometry(100, 14, 30), mallsMat, tx - 50, 7, tz + 80);
        addMesh(new THREE.BoxGeometry(102, 2, 32), glassMat, tx - 50, 14, tz + 80);
        // Second mall block
        addMesh(new THREE.BoxGeometry(80, 14, 30), mallsMat, tx + 80, 7, tz + 80);
        addMesh(new THREE.BoxGeometry(82, 2, 32), glassMat, tx + 80, 14, tz + 80);
        // Connecting covered walkway
        addMesh(new THREE.BoxGeometry(30, 10, 10), mallsMat, tx + 25, 5, tz + 80);

        // Modern office towers
        var officeMat = makeLambert(0x7090a8);
        var officeGlassMat = makeLambert(0x88aacc);
        // Tower 1
        addMesh(new THREE.BoxGeometry(20, 50, 20), officeMat, tx + 150, 25, tz - 30);
        addMesh(new THREE.BoxGeometry(22, 2, 22), makeLambert(0x606880), tx + 150, 50, tz - 30);
        // Tower 2
        addMesh(new THREE.BoxGeometry(18, 40, 18), officeGlassMat, tx + 180, 20, tz + 20);
        addMesh(new THREE.BoxGeometry(20, 2, 20), makeLambert(0x607090), tx + 180, 40, tz + 20);
        // Tower 3 - taller
        addMesh(new THREE.BoxGeometry(22, 60, 22), officeMat, tx + 120, 30, tz + 50);
        addMesh(new THREE.BoxGeometry(24, 2, 24), makeLambert(0x505868), tx + 120, 60, tz + 50);

        // Retail units ground level
        var retailMat = makeLambert(0xc0b890);
        addMesh(new THREE.BoxGeometry(60, 8, 15), retailMat, tx - 150, 4, tz + 50);
        addMesh(new THREE.BoxGeometry(60, 8, 15), retailMat, tx - 80, 4, tz + 50);

        // Market square / paving
        var pavingMat = makeLambert(0xc8c0a8);
        addMesh(new THREE.BoxGeometry(80, 0.2, 60), pavingMat, tx - 100, 0.1, tz + 10);

        // Town centre bus station
        var busMat = makeLambert(0xb0a890);
        addMesh(new THREE.BoxGeometry(80, 6, 20), busMat, tx + 50, 3, tz - 100);
        // Canopy
        addMesh(new THREE.BoxGeometry(82, 1, 22), makeLambert(0x888870), tx + 50, 6, tz - 100);
    }

    function build() {
        buildBasingHouseRuins();
        buildFestivalPlace();
        buildWarMemorialPark();
        buildCanalBasin();
        buildTownCentre();
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
