window.RiyadhKingdom = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var BASE_X = 24160;
    var BASE_Y = 0;
    var BASE_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(BASE_X + x, BASE_Y + y, BASE_Z + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildKingdomCentreTower() {
        // Main shaft lower — wide base
        addMesh(new THREE.BoxGeometry(22, 120, 22), 0xCCCCDD, 0, 60, 0);
        // Main shaft mid — slightly narrower
        addMesh(new THREE.BoxGeometry(18, 100, 18), 0xCCCCDD, 0, 170, 0);
        // Main shaft upper — tapered
        addMesh(new THREE.BoxGeometry(14, 80, 14), 0xCCCCDD, 0, 260, 0);
        // Elliptical arch crown — left pillar
        addMesh(new THREE.CylinderGeometry(4, 5, 70, 8), 0xCCCCDD, -10, 335, 0);
        // Elliptical arch crown — right pillar
        addMesh(new THREE.CylinderGeometry(4, 5, 70, 8), 0xCCCCDD, 10, 335, 0);
        // Sky bridge connecting upper sections
        addMesh(new THREE.BoxGeometry(28, 6, 10), 0xBBBBCC, 0, 368, 0);
        // Sky bridge lower beam
        addMesh(new THREE.BoxGeometry(28, 2, 8), 0xAABBCC, 0, 362, 0);
        // Arch top connector
        addMesh(new THREE.CylinderGeometry(3, 3, 20, 8), 0xCCCCDD, 0, 378, 0);
        // Antenna
        addMesh(new THREE.CylinderGeometry(0.5, 0.5, 24, 6), 0xBBBBCC, 0, 400, 0);
        // Base podium
        addMesh(new THREE.BoxGeometry(50, 12, 50), 0xBBBBCC, 0, 6, 0);
        // Glass facade details — horizontal bands
        addMesh(new THREE.BoxGeometry(23, 2, 23), 0xDDDDEE, 0, 100, 0);
        addMesh(new THREE.BoxGeometry(23, 2, 23), 0xDDDDEE, 0, 200, 0);
        addMesh(new THREE.BoxGeometry(19, 2, 19), 0xDDDDEE, 0, 290, 0);
    }

    function buildAlFaisaliyahTower() {
        var ox = 90;
        var oz = 30;
        // Lower tapered shaft
        addMesh(new THREE.CylinderGeometry(14, 18, 100, 8), 0xC8C8A0, ox, 50, oz);
        // Mid tapered shaft
        addMesh(new THREE.CylinderGeometry(10, 14, 90, 8), 0xC8C8A0, ox, 145, oz);
        // Upper tapered shaft
        addMesh(new THREE.CylinderGeometry(6, 10, 70, 8), 0xC8C8A0, ox, 222, oz);
        // Golden sphere at crown — landmark feature
        addMesh(new THREE.SphereGeometry(12, 12, 10), 0xD4AF37, ox, 275, oz);
        // Spire above sphere
        addMesh(new THREE.CylinderGeometry(0.5, 2, 20, 6), 0xC8C8A0, ox, 292, oz);
        // Base podium
        addMesh(new THREE.BoxGeometry(60, 14, 60), 0xBBBBAA, ox, 7, oz);
        // Facade bands
        addMesh(new THREE.CylinderGeometry(14.5, 18.5, 3, 8), 0xDADAB8, ox, 80, oz);
        addMesh(new THREE.CylinderGeometry(10.5, 14.5, 3, 8), 0xDADAB8, ox, 160, oz);
    }

    function buildMasmakFortress() {
        var ox = -160;
        var oz = 80;
        // Main fortress wall — north
        addMesh(new THREE.BoxGeometry(80, 12, 6), 0xD4A850, ox, 6, oz);
        // Main fortress wall — south
        addMesh(new THREE.BoxGeometry(80, 12, 6), 0xD4A850, ox, 6, oz + 60);
        // Main fortress wall — east
        addMesh(new THREE.BoxGeometry(6, 12, 66), 0xD4A850, ox + 37, 6, oz + 33);
        // Main fortress wall — west
        addMesh(new THREE.BoxGeometry(6, 12, 66), 0xD4A850, ox - 37, 6, oz + 33);
        // NW cylindrical watchtower
        addMesh(new THREE.CylinderGeometry(8, 9, 16, 10), 0xC89840, ox - 37, 8, oz);
        // NE cylindrical watchtower
        addMesh(new THREE.CylinderGeometry(8, 9, 16, 10), 0xC89840, ox + 37, 8, oz);
        // SW cylindrical watchtower
        addMesh(new THREE.CylinderGeometry(8, 9, 16, 10), 0xC89840, ox - 37, 8, oz + 60);
        // SE cylindrical watchtower
        addMesh(new THREE.CylinderGeometry(8, 9, 16, 10), 0xC89840, ox + 37, 8, oz + 60);
        // Tower conical caps
        addMesh(new THREE.ConeGeometry(9, 6, 10), 0xB88030, ox - 37, 19, oz);
        addMesh(new THREE.ConeGeometry(9, 6, 10), 0xB88030, ox + 37, 19, oz);
        addMesh(new THREE.ConeGeometry(9, 6, 10), 0xB88030, ox - 37, 19, oz + 60);
        addMesh(new THREE.ConeGeometry(9, 6, 10), 0xB88030, ox + 37, 19, oz + 60);
        // Main gate (original gate with bullet hole from Ibn Saud 1902)
        addMesh(new THREE.BoxGeometry(10, 12, 6), 0xC89840, ox, 6, oz);
        // Gate arch
        addMesh(new THREE.CylinderGeometry(4, 4, 4, 8), 0xD4A850, ox, 14, oz);
        // Interior courtyard floor
        addMesh(new THREE.BoxGeometry(68, 1, 54), 0xC8A060, ox, 0.5, oz + 33);
        // Central mosque/keep
        addMesh(new THREE.BoxGeometry(20, 10, 20), 0xCC9A48, ox, 5, oz + 33);
        // Mosque minaret
        addMesh(new THREE.CylinderGeometry(1.5, 2, 18, 8), 0xCC9A48, ox + 8, 9, oz + 33);
        addMesh(new THREE.ConeGeometry(2.5, 5, 8), 0xB88030, ox + 8, 21, oz + 33);
        // Bullet hole marker (small dark sphere on gate)
        addMesh(new THREE.SphereGeometry(0.4, 6, 6), 0x222222, ox, 8, oz - 1);
    }

    function buildKingFahdFountain() {
        var ox = -80;
        var oz = -200;
        // Red Sea water base — large flat pool (BoxGeometry only, no Plane)
        addMesh(new THREE.BoxGeometry(120, 1, 120), 0x2266AA, ox, 0, oz);
        // Main fountain jet — 300m tall thin water column
        addMesh(new THREE.CylinderGeometry(1.5, 4, 300, 8), 0x88CCFF, ox, 150, oz);
        // Secondary spray jets around main
        addMesh(new THREE.CylinderGeometry(0.8, 2, 180, 6), 0x99DDFF, ox + 10, 90, oz);
        addMesh(new THREE.CylinderGeometry(0.8, 2, 180, 6), 0x99DDFF, ox - 10, 90, oz);
        addMesh(new THREE.CylinderGeometry(0.8, 2, 180, 6), 0x99DDFF, ox, 90, oz + 10);
        addMesh(new THREE.CylinderGeometry(0.8, 2, 180, 6), 0x99DDFF, ox, 90, oz - 10);
        // Mist spray ring at top — sphere
        addMesh(new THREE.SphereGeometry(8, 10, 8), 0xBBEEFF, ox, 302, oz);
        // Smaller surrounding fountains
        addMesh(new THREE.CylinderGeometry(0.4, 1, 80, 6), 0x88CCFF, ox + 18, 40, oz);
        addMesh(new THREE.CylinderGeometry(0.4, 1, 80, 6), 0x88CCFF, ox - 18, 40, oz);
        addMesh(new THREE.CylinderGeometry(0.4, 1, 80, 6), 0x88CCFF, ox, 40, oz + 18);
        addMesh(new THREE.CylinderGeometry(0.4, 1, 80, 6), 0x88CCFF, ox, 40, oz - 18);
        // Seawall/platform
        addMesh(new THREE.CylinderGeometry(14, 16, 4, 12), 0x888888, ox, 2, oz);
    }

    function buildKingAbdulazizHistoricalCentre() {
        var ox = -220;
        var oz = -60;
        // Main museum building — Murabba Palace
        addMesh(new THREE.BoxGeometry(80, 18, 60), 0xD4C8B0, ox, 9, oz);
        // Palace central dome
        addMesh(new THREE.SphereGeometry(12, 10, 8), 0xCCBEA8, ox, 24, oz);
        // Palace flanking towers
        addMesh(new THREE.CylinderGeometry(5, 6, 22, 8), 0xD4C8B0, ox - 35, 11, oz - 25);
        addMesh(new THREE.CylinderGeometry(5, 6, 22, 8), 0xD4C8B0, ox + 35, 11, oz - 25);
        addMesh(new THREE.CylinderGeometry(5, 6, 22, 8), 0xD4C8B0, ox - 35, 11, oz + 25);
        addMesh(new THREE.CylinderGeometry(5, 6, 22, 8), 0xD4C8B0, ox + 35, 11, oz + 25);
        // Museum wing east
        addMesh(new THREE.BoxGeometry(40, 14, 30), 0xCEC2AE, ox + 58, 7, oz);
        // Museum wing west
        addMesh(new THREE.BoxGeometry(40, 14, 30), 0xCEC2AE, ox - 58, 7, oz);
        // Courtyard garden (ground-level box)
        addMesh(new THREE.BoxGeometry(40, 0.5, 40), 0x5A8A3A, ox, 0.25, oz);
        // Entrance gate arch
        addMesh(new THREE.BoxGeometry(20, 10, 4), 0xC8BCA8, ox, 5, oz - 32);
        addMesh(new THREE.CylinderGeometry(4, 4, 4, 8), 0xC8BCA8, ox, 12, oz - 32);
    }

    function buildDiplomaticQuarter() {
        var ox = 180;
        var oz = -120;
        // Embassy buildings cluster
        addMesh(new THREE.BoxGeometry(30, 20, 30), 0x7A9A6A, ox, 10, oz);
        addMesh(new THREE.BoxGeometry(25, 16, 25), 0x6A8A5A, ox + 50, 8, oz);
        addMesh(new THREE.BoxGeometry(28, 18, 28), 0x7A8A6A, ox + 100, 9, oz);
        addMesh(new THREE.BoxGeometry(20, 14, 20), 0x6A8A5A, ox + 50, 7, oz - 50);
        addMesh(new THREE.BoxGeometry(35, 22, 35), 0x3D7A32, ox, 11, oz - 80);
        // Garden strips — green ground boxes
        addMesh(new THREE.BoxGeometry(200, 0.5, 20), 0x4A9A3A, ox + 60, 0.25, oz + 40);
        addMesh(new THREE.BoxGeometry(20, 0.5, 120), 0x4A9A3A, ox + 140, 0.25, oz - 20);
        // Pedestrian boulevard
        addMesh(new THREE.BoxGeometry(6, 0.6, 200), 0xCCBBAA, ox + 25, 0.3, oz - 40);
        // Trees as cylinders + cones
        addMesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), 0x5A3A20, ox + 30, 4, oz + 20);
        addMesh(new THREE.ConeGeometry(5, 10, 6), 0x2A7A20, ox + 30, 13, oz + 20);
        addMesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), 0x5A3A20, ox + 60, 4, oz + 20);
        addMesh(new THREE.ConeGeometry(5, 10, 6), 0x2A7A20, ox + 60, 13, oz + 20);
        addMesh(new THREE.CylinderGeometry(1, 1.5, 8, 6), 0x5A3A20, ox + 90, 4, oz + 20);
        addMesh(new THREE.ConeGeometry(5, 10, 6), 0x2A7A20, ox + 90, 13, oz + 20);
    }

    function buildSaudiAramcoHQ() {
        var ox = 280;
        var oz = 80;
        // Main HQ building
        addMesh(new THREE.BoxGeometry(60, 30, 40), 0x999999, ox, 15, oz);
        // Secondary office block
        addMesh(new THREE.BoxGeometry(40, 24, 30), 0x888888, ox + 55, 12, oz);
        // Tech campus block
        addMesh(new THREE.BoxGeometry(50, 20, 35), 0x9A9A9A, ox, 10, oz + 55);
        // Data center block
        addMesh(new THREE.BoxGeometry(35, 16, 25), 0x888888, ox - 50, 8, oz + 40);
        // Helipad atop main building
        addMesh(new THREE.CylinderGeometry(10, 10, 1, 12), 0xAAAAAA, ox, 31, oz);
        // Campus perimeter fence (thin boxes)
        addMesh(new THREE.BoxGeometry(200, 3, 2), 0x666666, ox, 1.5, oz - 70);
        addMesh(new THREE.BoxGeometry(200, 3, 2), 0x666666, ox, 1.5, oz + 100);
        addMesh(new THREE.BoxGeometry(2, 3, 170), 0x666666, ox - 100, 1.5, oz + 15);
        addMesh(new THREE.BoxGeometry(2, 3, 170), 0x666666, ox + 100, 1.5, oz + 15);
        // Entrance canopy
        addMesh(new THREE.BoxGeometry(30, 4, 8), 0xBBBBBB, ox, 32, oz - 22);
    }

    function buildWadiHanifah() {
        var ox = -50;
        var oz = 120;
        // Green valley floor
        addMesh(new THREE.BoxGeometry(300, 0.5, 40), 0x6B8C42, ox, 0.25, oz);
        // Valley sides — earth banks
        addMesh(new THREE.BoxGeometry(300, 8, 10), 0x8A7050, ox, 4, oz - 25);
        addMesh(new THREE.BoxGeometry(300, 8, 10), 0x8A7050, ox, 4, oz + 25);
        // Stream (thin blue box)
        addMesh(new THREE.BoxGeometry(300, 0.5, 6), 0x4488BB, ox, 0.5, oz);
        // Vegetation clusters — cone trees along valley
        addMesh(new THREE.ConeGeometry(6, 12, 6), 0x4A7A28, ox - 80, 6, oz + 10);
        addMesh(new THREE.ConeGeometry(5, 10, 6), 0x5A8A30, ox - 40, 5, oz - 8);
        addMesh(new THREE.ConeGeometry(7, 14, 6), 0x4A7A28, ox + 20, 7, oz + 12);
        addMesh(new THREE.ConeGeometry(5, 10, 6), 0x5A8A30, ox + 70, 5, oz - 6);
        addMesh(new THREE.ConeGeometry(6, 12, 6), 0x4A7A28, ox + 110, 6, oz + 8);
    }

    function buildDiriyah() {
        var ox = -320;
        var oz = 160;
        // At-Turaif District — UNESCO ruins
        // Main mud-brick ruin walls
        addMesh(new THREE.BoxGeometry(100, 10, 6), 0xD4A870, ox, 5, oz);
        addMesh(new THREE.BoxGeometry(6, 10, 80), 0xD4A870, ox - 47, 5, oz + 37);
        addMesh(new THREE.BoxGeometry(6, 10, 80), 0xD4A870, ox + 47, 5, oz + 37);
        addMesh(new THREE.BoxGeometry(100, 10, 6), 0xD4A870, ox, 5, oz + 74);
        // Najdi architecture — wind towers
        addMesh(new THREE.BoxGeometry(8, 20, 8), 0xCC9A60, ox - 30, 10, oz + 20);
        addMesh(new THREE.BoxGeometry(8, 16, 8), 0xCC9A60, ox + 25, 8, oz + 50);
        addMesh(new THREE.BoxGeometry(6, 18, 6), 0xCC9A60, ox, 9, oz + 60);
        // Ruined towers at corners
        addMesh(new THREE.CylinderGeometry(5, 6, 14, 8), 0xC8964A, ox - 47, 7, oz);
        addMesh(new THREE.CylinderGeometry(5, 6, 14, 8), 0xC8964A, ox + 47, 7, oz);
        addMesh(new THREE.CylinderGeometry(5, 6, 14, 8), 0xC8964A, ox - 47, 7, oz + 74);
        addMesh(new THREE.CylinderGeometry(5, 6, 14, 8), 0xC8964A, ox + 47, 7, oz + 74);
        // Earthen rubble mounds
        addMesh(new THREE.SphereGeometry(8, 8, 6), 0xC4946A, ox + 10, 2, oz + 37);
        addMesh(new THREE.SphereGeometry(6, 8, 6), 0xC4946A, ox - 15, 2, oz + 55);
        // Visitor centre (modern addition)
        addMesh(new THREE.BoxGeometry(30, 8, 20), 0xD8C890, ox + 70, 4, oz + 30);
    }

    function buildKingAbdullahFinancialDistrict() {
        var ox = 160;
        var oz = 200;
        // Cluster of modern glass towers
        addMesh(new THREE.BoxGeometry(16, 160, 16), 0x888899, ox, 80, oz);
        addMesh(new THREE.BoxGeometry(14, 120, 14), 0x9999AA, ox + 30, 60, oz);
        addMesh(new THREE.BoxGeometry(18, 140, 18), 0x7A7A8A, ox + 60, 70, oz + 10);
        addMesh(new THREE.BoxGeometry(12, 100, 12), 0x8888AA, ox + 15, 50, oz + 35);
        addMesh(new THREE.BoxGeometry(16, 130, 16), 0x9999AA, ox - 30, 65, oz + 20);
        addMesh(new THREE.BoxGeometry(14, 90, 14), 0x888899, ox + 45, 45, oz + 40);
        // Connecting sky bridges
        addMesh(new THREE.BoxGeometry(30, 3, 10), 0xAABBCC, ox + 15, 100, oz);
        addMesh(new THREE.BoxGeometry(30, 3, 10), 0xAABBCC, ox + 45, 90, oz + 5);
        // District podium base
        addMesh(new THREE.BoxGeometry(140, 6, 100), 0x777788, ox + 15, 3, oz + 20);
        // Antenna tops
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 16, 6), 0x888888, ox, 168, oz);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 6), 0x888888, ox + 60, 148, oz + 10);
    }

    function build() {
        buildKingdomCentreTower();
        buildAlFaisaliyahTower();
        buildMasmakFortress();
        buildKingFahdFountain();
        buildKingAbdulazizHistoricalCentre();
        buildDiplomaticQuarter();
        buildSaudiAramcoHQ();
        buildWadiHanifah();
        buildDiriyah();
        buildKingAbdullahFinancialDistrict();
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
