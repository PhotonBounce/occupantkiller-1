window.Sherbornecastle = (function() {
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

    function stoneMat(hex) {
        return new THREE.MeshLambertMaterial({ color: hex });
    }

    function buildOldCastle() {
        var ox = 13760;
        var oz = -200;
        var keepMat = stoneMat(0x8a7a6a);
        var wallMat = stoneMat(0x7a6a5a);
        var earthMat = stoneMat(0x5a6a3a);
        var waterMat = stoneMat(0x3a5a7a);

        // Ruined keep tower — main body
        addMesh(new THREE.BoxGeometry(14, 22, 14), keepMat, ox, 11, oz);
        // Ruined keep tower — broken top section (offset to simulate ruin)
        addMesh(new THREE.BoxGeometry(10, 8, 10), keepMat, ox + 1, 26, oz - 1);
        // Ruined keep tower — partial wall remnant
        addMesh(new THREE.BoxGeometry(3, 12, 14), keepMat, ox - 8, 6, oz);

        // Curtain wall remains — north section
        addMesh(new THREE.BoxGeometry(40, 6, 2), wallMat, ox + 10, 3, oz - 30);
        // Curtain wall remains — east section
        addMesh(new THREE.BoxGeometry(2, 5, 30), wallMat, ox + 30, 2.5, oz - 15);
        // Curtain wall remains — west fragment
        addMesh(new THREE.BoxGeometry(2, 4, 18), wallMat, ox - 30, 2, oz - 10);
        // Curtain wall — south fragment
        addMesh(new THREE.BoxGeometry(22, 5, 2), wallMat, ox - 5, 2.5, oz + 25);

        // Gatehouse arch piers — left pier
        addMesh(new THREE.BoxGeometry(3, 9, 4), wallMat, ox - 7, 4.5, oz - 30);
        // Gatehouse arch piers — right pier
        addMesh(new THREE.BoxGeometry(3, 9, 4), wallMat, ox - 1, 4.5, oz - 30);
        // Gatehouse lintel
        addMesh(new THREE.BoxGeometry(9, 2, 4), wallMat, ox - 4, 10, oz - 30);

        // Corner tower ruin — NE
        addMesh(new THREE.CylinderGeometry(4, 4.5, 10, 8), keepMat, ox + 30, 5, oz - 30);
        // Corner tower ruin — NW (lower)
        addMesh(new THREE.CylinderGeometry(3.5, 4, 7, 8), keepMat, ox - 30, 3.5, oz - 30);

        // Moat — north channel
        addMesh(new THREE.BoxGeometry(80, 1, 8), waterMat, ox, 0, oz - 35);
        // Moat — east channel
        addMesh(new THREE.BoxGeometry(8, 1, 60), waterMat, ox + 40, 0, oz);
        // Moat — south channel
        addMesh(new THREE.BoxGeometry(80, 1, 8), waterMat, ox, 0, oz + 35);
        // Moat — west channel
        addMesh(new THREE.BoxGeometry(8, 1, 50), waterMat, ox - 40, 0, oz);

        // Earthwork bailey — raised mound
        addMesh(new THREE.CylinderGeometry(18, 25, 4, 8), earthMat, ox + 50, 2, oz + 20);
        // Earthwork rampart — north bank
        addMesh(new THREE.BoxGeometry(70, 3, 6), earthMat, ox + 5, 1.5, oz - 42);
        // Earthwork rampart — south bank
        addMesh(new THREE.BoxGeometry(60, 3, 6), earthMat, ox + 5, 1.5, oz + 42);

        // Ruined interior wall
        addMesh(new THREE.BoxGeometry(8, 7, 1.5), keepMat, ox + 3, 3.5, oz + 5);
    }

    function buildNewCastle() {
        var ox = 13760;
        var oz = 120;
        var stoneMaterial = stoneMat(0x9a8a6a);
        var towerMat = stoneMat(0x8a7a5a);
        var roofMat = stoneMat(0x4a5a3a);
        var lakeMat = stoneMat(0x2a4a6a);
        var parkMat = stoneMat(0x3a6a2a);
        var chimneyMat = stoneMat(0x6a5a4a);

        // Central hexagonal tower — base
        addMesh(new THREE.CylinderGeometry(8, 9, 20, 6), towerMat, ox, 10, oz);
        // Central hexagonal tower — upper
        addMesh(new THREE.CylinderGeometry(7, 8, 10, 6), towerMat, ox, 25, oz);
        // Central tower — cap
        addMesh(new THREE.ConeGeometry(7.5, 6, 6), roofMat, ox, 33, oz);

        // Main mansion body — central block
        addMesh(new THREE.BoxGeometry(30, 12, 20), stoneMaterial, ox, 6, oz);
        // Main mansion — east wing
        addMesh(new THREE.BoxGeometry(14, 10, 18), stoneMaterial, ox + 22, 5, oz);
        // Main mansion — west wing
        addMesh(new THREE.BoxGeometry(14, 10, 18), stoneMaterial, ox - 22, 5, oz);

        // Four corner towers — NE
        addMesh(new THREE.CylinderGeometry(4, 4.5, 18, 8), towerMat, ox + 30, 9, oz - 20);
        addMesh(new THREE.ConeGeometry(4.2, 5, 8), roofMat, ox + 30, 20.5, oz - 20);
        // Four corner towers — NW
        addMesh(new THREE.CylinderGeometry(4, 4.5, 18, 8), towerMat, ox - 30, 9, oz - 20);
        addMesh(new THREE.ConeGeometry(4.2, 5, 8), roofMat, ox - 30, 20.5, oz - 20);
        // Four corner towers — SE
        addMesh(new THREE.CylinderGeometry(4, 4.5, 18, 8), towerMat, ox + 30, 9, oz + 20);
        addMesh(new THREE.ConeGeometry(4.2, 5, 8), roofMat, ox + 30, 20.5, oz + 20);
        // Four corner towers — SW
        addMesh(new THREE.CylinderGeometry(4, 4.5, 18, 8), towerMat, ox - 30, 9, oz + 20);
        addMesh(new THREE.ConeGeometry(4.2, 5, 8), roofMat, ox - 30, 20.5, oz + 20);

        // Chimneys — row on main block
        addMesh(new THREE.CylinderGeometry(0.8, 1, 5, 6), chimneyMat, ox - 8, 17, oz - 5);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 5, 6), chimneyMat, ox, 17, oz - 5);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 5, 6), chimneyMat, ox + 8, 17, oz - 5);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 5, 6), chimneyMat, ox - 4, 17, oz + 5);
        addMesh(new THREE.CylinderGeometry(0.8, 1, 5, 6), chimneyMat, ox + 4, 17, oz + 5);

        // Capability Brown lake — large irregular body
        addMesh(new THREE.BoxGeometry(80, 0.5, 30), lakeMat, ox + 60, 0, oz + 50);
        addMesh(new THREE.BoxGeometry(40, 0.5, 50), lakeMat, ox + 80, 0, oz + 35);
        addMesh(new THREE.BoxGeometry(60, 0.5, 20), lakeMat, ox + 50, 0, oz + 70);

        // Parkland trees — represented as cylinders with sphere tops
        addMesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), stoneMat(0x4a3a2a), ox + 40, 4, oz - 10);
        addMesh(new THREE.SphereGeometry(5, 6, 4), parkMat, ox + 40, 11, oz - 10);
        addMesh(new THREE.CylinderGeometry(1, 1.5, 10, 6), stoneMat(0x4a3a2a), ox + 50, 5, oz);
        addMesh(new THREE.SphereGeometry(6, 6, 4), parkMat, ox + 50, 13, oz);
        addMesh(new THREE.CylinderGeometry(1, 1.5, 9, 6), stoneMat(0x4a3a2a), ox - 40, 4.5, oz - 15);
        addMesh(new THREE.SphereGeometry(5.5, 6, 4), parkMat, ox - 40, 12, oz - 15);
        addMesh(new THREE.CylinderGeometry(1, 1.5, 7, 6), stoneMat(0x4a3a2a), ox - 50, 3.5, oz + 10);
        addMesh(new THREE.SphereGeometry(4.5, 6, 4), parkMat, ox - 50, 10, oz + 10);
        addMesh(new THREE.CylinderGeometry(1, 1.5, 11, 6), stoneMat(0x4a3a2a), ox + 20, 5.5, oz + 45);
        addMesh(new THREE.SphereGeometry(6, 6, 4), parkMat, ox + 20, 14, oz + 45);

        // Entrance gateway
        addMesh(new THREE.BoxGeometry(4, 8, 3), towerMat, ox - 20, 4, oz + 30);
        addMesh(new THREE.BoxGeometry(4, 8, 3), towerMat, ox - 12, 4, oz + 30);
        addMesh(new THREE.BoxGeometry(12, 2, 3), towerMat, ox - 16, 9, oz + 30);

        // Forecourt wall
        addMesh(new THREE.BoxGeometry(20, 3, 1), towerMat, ox - 16, 1.5, oz + 35);
        addMesh(new THREE.BoxGeometry(1, 3, 10), towerMat, ox - 6, 1.5, oz + 30);
        addMesh(new THREE.BoxGeometry(1, 3, 10), towerMat, ox - 26, 1.5, oz + 30);
    }

    function buildAbbey() {
        var ox = 13760;
        var oz = -20;
        var goldenMat = stoneMat(0xc8a84a);
        var roofMat = stoneMat(0x5a5a4a);
        var darkMat = stoneMat(0x6a6a5a);
        var glassMat = stoneMat(0x3a5a8a);

        // Main nave — long body
        addMesh(new THREE.BoxGeometry(18, 20, 60), goldenMat, ox - 40, 10, oz);
        // Nave roof — pitched
        addMesh(new THREE.BoxGeometry(20, 6, 62), roofMat, ox - 40, 23, oz);

        // Great tower — central
        addMesh(new THREE.BoxGeometry(14, 40, 14), goldenMat, ox - 40, 20, oz - 10);
        // Tower upper stage
        addMesh(new THREE.BoxGeometry(12, 12, 12), darkMat, ox - 40, 46, oz - 10);
        // Tower battlements — represented as raised blocks
        addMesh(new THREE.BoxGeometry(14, 3, 2), goldenMat, ox - 40, 55, oz - 17);
        addMesh(new THREE.BoxGeometry(14, 3, 2), goldenMat, ox - 40, 55, oz - 3);
        addMesh(new THREE.BoxGeometry(2, 3, 14), goldenMat, ox - 47, 55, oz - 10);
        addMesh(new THREE.BoxGeometry(2, 3, 14), goldenMat, ox - 33, 55, oz - 10);

        // Choir — east of crossing
        addMesh(new THREE.BoxGeometry(16, 18, 25), goldenMat, ox - 40, 9, oz + 32);
        addMesh(new THREE.BoxGeometry(18, 5, 27), roofMat, ox - 40, 20.5, oz + 32);

        // Lady Chapel — east end apse
        addMesh(new THREE.CylinderGeometry(8, 8, 14, 6), goldenMat, ox - 40, 7, oz + 48);
        addMesh(new THREE.ConeGeometry(9, 5, 6), roofMat, ox - 40, 16, oz + 48);

        // North transept
        addMesh(new THREE.BoxGeometry(16, 19, 12), goldenMat, ox - 56, 9.5, oz - 10);
        addMesh(new THREE.BoxGeometry(18, 4, 14), roofMat, ox - 56, 21, oz - 10);

        // South transept
        addMesh(new THREE.BoxGeometry(16, 19, 12), goldenMat, ox - 24, 9.5, oz - 10);
        addMesh(new THREE.BoxGeometry(18, 4, 14), roofMat, ox - 24, 21, oz - 10);

        // Fan vault ceiling representation — decorative ribs on nave floor level
        addMesh(new THREE.BoxGeometry(16, 0.5, 58), stoneMat(0xd4b86a), ox - 40, 19.5, oz);

        // West front — decorative facade
        addMesh(new THREE.BoxGeometry(20, 22, 3), goldenMat, ox - 40, 11, oz - 30);
        // West window — dark inset
        addMesh(new THREE.BoxGeometry(8, 12, 1), glassMat, ox - 40, 14, oz - 31);
        // West front — twin turrets
        addMesh(new THREE.CylinderGeometry(2.5, 3, 28, 8), darkMat, ox - 50, 14, oz - 30);
        addMesh(new THREE.ConeGeometry(2.7, 5, 8), roofMat, ox - 50, 30.5, oz - 30);
        addMesh(new THREE.CylinderGeometry(2.5, 3, 28, 8), darkMat, ox - 30, 14, oz - 30);
        addMesh(new THREE.ConeGeometry(2.7, 5, 8), roofMat, ox - 30, 30.5, oz - 30);

        // Buttresses along nave
        addMesh(new THREE.BoxGeometry(4, 18, 2), goldenMat, ox - 48, 9, oz - 5);
        addMesh(new THREE.BoxGeometry(4, 18, 2), goldenMat, ox - 48, 9, oz + 5);
        addMesh(new THREE.BoxGeometry(4, 18, 2), goldenMat, ox - 48, 9, oz + 15);
        addMesh(new THREE.BoxGeometry(4, 18, 2), goldenMat, ox - 32, 9, oz - 5);
        addMesh(new THREE.BoxGeometry(4, 18, 2), goldenMat, ox - 32, 9, oz + 5);
        addMesh(new THREE.BoxGeometry(4, 18, 2), goldenMat, ox - 32, 9, oz + 15);
    }

    function buildSchool() {
        var ox = 13760;
        var oz = -100;
        var stoneMaterial = stoneMat(0x9a8a6a);
        var roofMat = stoneMat(0x5a4a3a);
        var quadMat = stoneMat(0x7a7a6a);

        // Main school building — long range
        addMesh(new THREE.BoxGeometry(40, 12, 10), stoneMaterial, ox + 70, 6, oz);
        addMesh(new THREE.BoxGeometry(42, 3, 12), roofMat, ox + 70, 13.5, oz);

        // Dormitory range — north
        addMesh(new THREE.BoxGeometry(30, 10, 8), stoneMaterial, ox + 70, 5, oz - 20);
        addMesh(new THREE.BoxGeometry(32, 3, 10), roofMat, ox + 70, 11.5, oz - 20);

        // Dormitory range — south
        addMesh(new THREE.BoxGeometry(30, 10, 8), stoneMaterial, ox + 70, 5, oz + 20);
        addMesh(new THREE.BoxGeometry(32, 3, 10), roofMat, ox + 70, 11.5, oz + 20);

        // East range closing quad
        addMesh(new THREE.BoxGeometry(8, 10, 42), stoneMaterial, ox + 91, 5, oz);
        addMesh(new THREE.BoxGeometry(10, 3, 44), roofMat, ox + 91, 11.5, oz);

        // Quad courtyard surface
        addMesh(new THREE.BoxGeometry(34, 0.3, 32), quadMat, ox + 74, 0.15, oz);

        // School chapel — small
        addMesh(new THREE.BoxGeometry(10, 14, 20), stoneMaterial, ox + 58, 7, oz - 10);
        addMesh(new THREE.BoxGeometry(12, 4, 22), roofMat, ox + 58, 16, oz - 10);
        // Chapel tower
        addMesh(new THREE.BoxGeometry(6, 22, 6), stoneMaterial, ox + 58, 11, oz - 20);
        addMesh(new THREE.ConeGeometry(4, 5, 4), roofMat, ox + 58, 24, oz - 20);

        // Gateway to school — gatehouse
        addMesh(new THREE.BoxGeometry(5, 11, 4), stoneMaterial, ox + 50, 5.5, oz + 5);
        addMesh(new THREE.BoxGeometry(5, 11, 4), stoneMaterial, ox + 50, 5.5, oz - 5);
        addMesh(new THREE.BoxGeometry(5, 3, 12), stoneMaterial, ox + 50, 13, oz);

        // Cloisters — colonnade represented as thin pillars
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), stoneMat(0x8a7a6a), ox + 62, 4, oz - 8);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), stoneMat(0x8a7a6a), ox + 65, 4, oz - 8);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), stoneMat(0x8a7a6a), ox + 68, 4, oz - 8);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), stoneMat(0x8a7a6a), ox + 71, 4, oz - 8);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 8, 6), stoneMat(0x8a7a6a), ox + 74, 4, oz - 8);
        // Cloister lintel
        addMesh(new THREE.BoxGeometry(14, 0.6, 1), stoneMat(0x8a7a6a), ox + 68, 8.3, oz - 8);
    }

    function buildConduit() {
        var ox = 13760;
        var oz = -50;
        var stoneMaterial = stoneMat(0xb09a6a);
        var roofMat = stoneMat(0x5a5a4a);

        // Conduit house — hexagonal base
        addMesh(new THREE.CylinderGeometry(4, 4.5, 5, 6), stoneMaterial, ox + 15, 2.5, oz);
        // Conduit house — upper octagonal tier
        addMesh(new THREE.CylinderGeometry(3, 4, 4, 8), stoneMaterial, ox + 15, 7, oz);
        // Conduit house — decorative roof
        addMesh(new THREE.ConeGeometry(3.5, 4, 8), roofMat, ox + 15, 11, oz);
        // Conduit — finial
        addMesh(new THREE.SphereGeometry(0.5, 6, 4), stoneMat(0xd4c08a), ox + 15, 13.5, oz);

        // Market town buildings — row along market place
        addMesh(new THREE.BoxGeometry(8, 7, 6), stoneMat(0xb0906a), ox + 5, 3.5, oz - 15);
        addMesh(new THREE.BoxGeometry(8, 3, 8), roofMat, ox + 5, 8.5, oz - 15);
        addMesh(new THREE.BoxGeometry(9, 8, 7), stoneMat(0xa08060), ox + 15, 4, oz - 15);
        addMesh(new THREE.BoxGeometry(9, 3, 9), roofMat, ox + 15, 9.5, oz - 15);
        addMesh(new THREE.BoxGeometry(7, 7, 6), stoneMat(0xb89870), ox + 25, 3.5, oz - 15);
        addMesh(new THREE.BoxGeometry(7, 3, 8), roofMat, ox + 25, 8.5, oz - 15);
        addMesh(new THREE.BoxGeometry(10, 9, 7), stoneMat(0xa89060), ox - 5, 4.5, oz - 15);
        addMesh(new THREE.BoxGeometry(10, 3, 9), roofMat, ox - 5, 10.5, oz - 15);
        addMesh(new THREE.BoxGeometry(8, 6, 6), stoneMat(0xb08a5a), ox - 15, 3, oz - 15);
        addMesh(new THREE.BoxGeometry(8, 3, 8), roofMat, ox - 15, 7.5, oz - 15);

        // South side market buildings
        addMesh(new THREE.BoxGeometry(9, 8, 6), stoneMat(0xa8906a), ox + 8, 4, oz - 25);
        addMesh(new THREE.BoxGeometry(9, 3, 8), roofMat, ox + 8, 9.5, oz - 25);
        addMesh(new THREE.BoxGeometry(7, 7, 5), stoneMat(0xb09870), ox + 18, 3.5, oz - 25);
        addMesh(new THREE.BoxGeometry(7, 3, 7), roofMat, ox + 18, 8.5, oz - 25);

        // Market square paving
        addMesh(new THREE.BoxGeometry(35, 0.2, 18), stoneMat(0x9a9080), ox + 8, 0.1, oz - 18);
    }

    function buildRiverYeo() {
        var ox = 13760;
        var waterMat = stoneMat(0x2a4a6a);
        var bankMat = stoneMat(0x4a6a3a);
        var stoneMaterial = stoneMat(0x8a7a6a);
        var meadowMat = stoneMat(0x5a7a4a);

        // River Yeo — main channel west
        addMesh(new THREE.BoxGeometry(4, 0.4, 120), waterMat, ox - 80, 0.2, oz - 60);
        // River Yeo — main channel east bend
        addMesh(new THREE.BoxGeometry(80, 0.4, 4), waterMat, ox - 40, 0.2, oz - 120);

        // Medieval bridge — west
        addMesh(new THREE.BoxGeometry(6, 2, 12), stoneMaterial, ox - 80, 1, oz - 80);
        // Bridge arch piers
        addMesh(new THREE.BoxGeometry(1.5, 3, 4), stoneMaterial, ox - 78, 1.5, oz - 80);
        addMesh(new THREE.BoxGeometry(1.5, 3, 4), stoneMaterial, ox - 82, 1.5, oz - 80);
        // Bridge parapet
        addMesh(new THREE.BoxGeometry(6, 1, 0.5), stoneMaterial, ox - 80, 2.5, oz - 76);
        addMesh(new THREE.BoxGeometry(6, 1, 0.5), stoneMaterial, ox - 80, 2.5, oz - 84);

        // Medieval bridge — east
        addMesh(new THREE.BoxGeometry(12, 2, 6), stoneMaterial, ox - 50, 1, oz - 120);
        addMesh(new THREE.BoxGeometry(4, 3, 1.5), stoneMaterial, ox - 50, 1.5, oz - 118);
        addMesh(new THREE.BoxGeometry(4, 3, 1.5), stoneMaterial, ox - 50, 1.5, oz - 122);

        // River banks — vegetation strips
        addMesh(new THREE.BoxGeometry(6, 0.5, 120), bankMat, ox - 77, 0.25, oz - 60);
        addMesh(new THREE.BoxGeometry(6, 0.5, 120), bankMat, ox - 83, 0.25, oz - 60);

        // Water meadows — flat grassy areas
        addMesh(new THREE.BoxGeometry(40, 0.3, 30), meadowMat, ox - 60, 0.15, oz - 50);
        addMesh(new THREE.BoxGeometry(30, 0.3, 25), meadowMat, ox - 70, 0.15, oz - 90);
        addMesh(new THREE.BoxGeometry(35, 0.3, 20), meadowMat, ox - 55, 0.15, oz - 100);

        // Almshouses — row near river
        addMesh(new THREE.BoxGeometry(24, 5, 6), stoneMat(0xb09a7a), ox - 65, 2.5, oz - 40);
        addMesh(new THREE.BoxGeometry(24, 2, 7), stoneMat(0x6a5a4a), ox - 65, 6, oz - 40);
        // Almshouse chimneys
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 4, 4), stoneMat(0x7a6a5a), ox - 58, 9, oz - 40);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 4, 4), stoneMat(0x7a6a5a), ox - 65, 9, oz - 40);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 4, 4), stoneMat(0x7a6a5a), ox - 72, 9, oz - 40);

        // Second almshouse row
        addMesh(new THREE.BoxGeometry(20, 5, 6), stoneMat(0xa88a6a), ox - 62, 2.5, oz - 30);
        addMesh(new THREE.BoxGeometry(20, 2, 7), stoneMat(0x5a4a3a), ox - 62, 6, oz - 30);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 4, 4), stoneMat(0x7a6a5a), ox - 56, 9, oz - 30);
        addMesh(new THREE.CylinderGeometry(0.5, 0.6, 4, 4), stoneMat(0x7a6a5a), ox - 68, 9, oz - 30);

        // Mill near river
        addMesh(new THREE.BoxGeometry(8, 8, 10), stoneMat(0x9a8a6a), ox - 85, 4, oz - 55);
        addMesh(new THREE.BoxGeometry(10, 2, 12), stoneMat(0x6a5a4a), ox - 85, 9, oz - 55);
        // Mill wheel — vertical disc
        addMesh(new THREE.CylinderGeometry(4, 4, 1.5, 12), stoneMat(0x5a4a3a), ox - 82, 3, oz - 55);
    }

    function build() {
        buildOldCastle();
        buildNewCastle();
        buildAbbey();
        buildSchool();
        buildConduit();
        buildRiverYeo();
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
