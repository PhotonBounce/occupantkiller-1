window.TruroRoyal = (function() {
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

    function addMesh(geo, color, x, y, z) {
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildCathedral() {
        var ox = 14280;
        var oz = -60;

        // Nave — long central body
        addMesh(new THREE.BoxGeometry(12, 18, 40), 0x8B8680, ox, 9, oz);

        // Chancel — east end
        addMesh(new THREE.BoxGeometry(10, 16, 20), 0x8B8680, ox, 8, oz + 30);

        // Crossing tower base
        addMesh(new THREE.BoxGeometry(10, 24, 10), 0x7A756F, ox, 12, oz - 2);

        // Victoria central spire (tallest)
        addMesh(new THREE.CylinderGeometry(0.1, 2.5, 30, 6), 0x7A756F, ox, 39, oz - 2);

        // West facade twin towers
        addMesh(new THREE.BoxGeometry(5, 22, 5), 0x8B8680, ox - 6, 11, oz - 20);
        addMesh(new THREE.BoxGeometry(5, 22, 5), 0x8B8680, ox + 6, 11, oz - 20);

        // West twin spires
        addMesh(new THREE.CylinderGeometry(0.1, 1.8, 20, 6), 0x7A756F, ox - 6, 31, oz - 20);
        addMesh(new THREE.CylinderGeometry(0.1, 1.8, 20, 6), 0x7A756F, ox + 6, 31, oz - 20);

        // North transept
        addMesh(new THREE.BoxGeometry(10, 16, 8), 0x8B8680, ox - 10, 8, oz);

        // South transept
        addMesh(new THREE.BoxGeometry(10, 16, 8), 0x8B8680, ox + 10, 8, oz);

        // Flying buttresses north — small diagonal supports
        addMesh(new THREE.BoxGeometry(1.5, 6, 4), 0x7A756F, ox - 7.5, 12, oz - 8);
        addMesh(new THREE.BoxGeometry(1.5, 6, 4), 0x7A756F, ox - 7.5, 12, oz + 2);
        addMesh(new THREE.BoxGeometry(1.5, 6, 4), 0x7A756F, ox - 7.5, 12, oz + 12);

        // Flying buttresses south
        addMesh(new THREE.BoxGeometry(1.5, 6, 4), 0x7A756F, ox + 7.5, 12, oz - 8);
        addMesh(new THREE.BoxGeometry(1.5, 6, 4), 0x7A756F, ox + 7.5, 12, oz + 2);
        addMesh(new THREE.BoxGeometry(1.5, 6, 4), 0x7A756F, ox + 7.5, 12, oz + 12);

        // Great west door arch surround
        addMesh(new THREE.BoxGeometry(4, 8, 1), 0x6B6560, ox, 4, oz - 20.5);

        // Rose window frame — circular on west facade
        addMesh(new THREE.CylinderGeometry(2, 2, 0.5, 12), 0x5A5550, ox, 16, oz - 20.5);

        // Ground plane under cathedral
        addMesh(new THREE.BoxGeometry(30, 0.3, 60), 0x6B6B5F, ox, 0.1, oz);
    }

    function buildRoyalCornwallMuseum() {
        var ox = 14295;
        var oz = 20;

        // Main museum building
        addMesh(new THREE.BoxGeometry(28, 12, 20), 0xC8B98A, ox, 6, oz);

        // Neoclassical portico — columns across front
        addMesh(new THREE.BoxGeometry(20, 14, 4), 0xD4C89A, ox, 7, oz - 12);

        // Portico columns — six columns
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 8), 0xE0D4B0, ox - 8, 6, oz - 13);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 8), 0xE0D4B0, ox - 5, 6, oz - 13);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 8), 0xE0D4B0, ox - 2, 6, oz - 13);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 8), 0xE0D4B0, ox + 1, 6, oz - 13);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 8), 0xE0D4B0, ox + 4, 6, oz - 13);
        addMesh(new THREE.CylinderGeometry(0.6, 0.6, 12, 8), 0xE0D4B0, ox + 7, 6, oz - 13);

        // Portico pediment
        addMesh(new THREE.BoxGeometry(22, 3, 3), 0xC8B98A, ox, 15, oz - 12);

        // Triangular pediment top
        addMesh(new THREE.ConeGeometry(11, 4, 4), 0xC0AF85, ox, 18.5, oz - 12);

        // RPSI gallery wing — east extension
        addMesh(new THREE.BoxGeometry(14, 10, 18), 0xBFB080, ox + 20, 5, oz);

        // Museum steps
        addMesh(new THREE.BoxGeometry(22, 1, 3), 0xD0C090, ox, 0.5, oz - 14);
        addMesh(new THREE.BoxGeometry(20, 0.8, 2.5), 0xD0C090, ox, 1.3, oz - 13.5);
    }

    function buildLemonStreet() {
        var ox = 14260;
        var oz = 40;

        // Cobbled street surface
        addMesh(new THREE.BoxGeometry(12, 0.2, 80), 0x8A8070, ox, 0.1, oz);

        // Georgian terraced townhouses — north row
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xC4A882, ox - 10, 7, oz - 30);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xBF9F7A, ox - 10, 7, oz - 18);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xC4A882, ox - 10, 7, oz - 6);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xBF9F7A, ox - 10, 7, oz + 6);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xC4A882, ox - 10, 7, oz + 18);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xBF9F7A, ox - 10, 7, oz + 30);

        // Georgian terraced townhouses — south row
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xBF9F7A, ox + 10, 7, oz - 30);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xC4A882, ox + 10, 7, oz - 18);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xBF9F7A, ox + 10, 7, oz - 6);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xC4A882, ox + 10, 7, oz + 6);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xBF9F7A, ox + 10, 7, oz + 18);
        addMesh(new THREE.BoxGeometry(8, 14, 10), 0xC4A882, ox + 10, 7, oz + 30);

        // Pitched rooftops north row
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox - 10, 17, oz - 30);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox - 10, 17, oz - 18);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox - 10, 17, oz - 6);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox - 10, 17, oz + 6);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox - 10, 17, oz + 18);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox - 10, 17, oz + 30);

        // Pitched rooftops south row
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox + 10, 17, oz - 30);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox + 10, 17, oz - 18);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox + 10, 17, oz - 6);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox + 10, 17, oz + 6);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox + 10, 17, oz + 18);
        addMesh(new THREE.CylinderGeometry(0.1, 5.6, 4, 4), 0x7A6050, ox + 10, 17, oz + 30);

        // Lemon Street Market — covered arcade
        addMesh(new THREE.BoxGeometry(20, 10, 16), 0xC8B090, ox, 5, oz + 50);
        addMesh(new THREE.CylinderGeometry(12, 12, 1, 4), 0xB0986A, ox, 11, oz + 50);
    }

    function buildRiverTruro() {
        var ox = 14280;
        var oz = 100;

        // River bed — long flat water surface
        addMesh(new THREE.BoxGeometry(20, 0.5, 120), 0x2A6090, ox, -1, oz);

        // River banks — both sides
        addMesh(new THREE.BoxGeometry(8, 2, 120), 0x7A8060, ox - 14, 0.5, oz);
        addMesh(new THREE.BoxGeometry(8, 2, 120), 0x7A8060, ox + 14, 0.5, oz);

        // Quay north — Boscawen Street riverside
        addMesh(new THREE.BoxGeometry(18, 3, 10), 0x8A7A6A, ox, 1, oz - 30);
        addMesh(new THREE.BoxGeometry(18, 3, 10), 0x8A7A6A, ox, 1, oz + 30);

        // Quay warehouses
        addMesh(new THREE.BoxGeometry(10, 8, 8), 0xA0907A, ox - 16, 4, oz - 32);
        addMesh(new THREE.BoxGeometry(10, 8, 8), 0xA0907A, ox + 16, 4, oz + 32);

        // Old bridge — stone arch bridge crossing river
        addMesh(new THREE.BoxGeometry(24, 4, 6), 0x9A8870, ox, 3, oz);
        // Bridge arch cutout suggestion — bridge piers
        addMesh(new THREE.BoxGeometry(3, 5, 6), 0x8A7860, ox - 6, 1.5, oz);
        addMesh(new THREE.BoxGeometry(3, 5, 6), 0x8A7860, ox + 6, 1.5, oz);
        // Bridge parapets
        addMesh(new THREE.BoxGeometry(24, 1.5, 1), 0x9A8870, ox, 5.5, oz - 3);
        addMesh(new THREE.BoxGeometry(24, 1.5, 1), 0x9A8870, ox, 5.5, oz + 3);
    }

    function buildCityCentre() {
        var ox = 14280;
        var oz = -10;

        // Boscawen Street — main street surface
        addMesh(new THREE.BoxGeometry(14, 0.2, 60), 0x7A7060, ox, 0.1, oz + 10);

        // Pydar Street surface
        addMesh(new THREE.BoxGeometry(10, 0.2, 50), 0x7A7060, ox - 20, 0.1, oz);

        // Pedestrianised zone
        addMesh(new THREE.BoxGeometry(20, 0.2, 30), 0x8A8070, ox, 0.1, oz - 20);

        // Victorian Market Hall — covered market
        addMesh(new THREE.BoxGeometry(22, 14, 30), 0xA09080, ox, 7, oz - 15);

        // Market Hall roof — pitched iron roof
        addMesh(new THREE.CylinderGeometry(0.5, 15.5, 6, 4), 0x6A6058, ox, 17, oz - 15);

        // Market Hall entrance arches north
        addMesh(new THREE.BoxGeometry(8, 10, 2), 0x908070, ox, 5, oz - 30.5);

        // Market Hall entrance arches south
        addMesh(new THREE.BoxGeometry(8, 10, 2), 0x908070, ox, 5, oz + 0.5);

        // Victorian commercial buildings along Boscawen Street
        addMesh(new THREE.BoxGeometry(10, 12, 8), 0x9A8878, ox - 20, 6, oz);
        addMesh(new THREE.BoxGeometry(10, 12, 8), 0x9A8878, ox - 20, 6, oz + 15);
        addMesh(new THREE.BoxGeometry(10, 12, 8), 0xA09080, ox + 20, 6, oz);
        addMesh(new THREE.BoxGeometry(10, 12, 8), 0xA09080, ox + 20, 6, oz + 15);

        // Shops and civic buildings
        addMesh(new THREE.BoxGeometry(12, 10, 8), 0xB0A088, ox - 30, 5, oz - 10);
        addMesh(new THREE.BoxGeometry(12, 10, 8), 0xB0A088, ox + 30, 5, oz - 10);

        // City Hall / civic building
        addMesh(new THREE.BoxGeometry(18, 16, 14), 0xC8B898, ox - 38, 8, oz);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), 0xC8B898, ox - 38 - 8, 7, oz);
        addMesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 8), 0xC8B898, ox - 38 + 8, 7, oz);
        addMesh(new THREE.ConeGeometry(9, 3, 4), 0x706050, ox - 38, 19.5, oz);

        // Street lamps — Boscawen Street
        addMesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), 0x404040, ox - 6, 3, oz - 5);
        addMesh(new THREE.SphereGeometry(0.4, 6, 6), 0xFFE090, ox - 6, 6.3, oz - 5);
        addMesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), 0x404040, ox + 6, 3, oz - 5);
        addMesh(new THREE.SphereGeometry(0.4, 6, 6), 0xFFE090, ox + 6, 6.3, oz - 5);
        addMesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), 0x404040, ox - 6, 3, oz + 15);
        addMesh(new THREE.SphereGeometry(0.4, 6, 6), 0xFFE090, ox - 6, 6.3, oz + 15);
        addMesh(new THREE.CylinderGeometry(0.1, 0.1, 6, 6), 0x404040, ox + 6, 3, oz + 15);
        addMesh(new THREE.SphereGeometry(0.4, 6, 6), 0xFFE090, ox + 6, 6.3, oz + 15);
    }

    function buildViaduct() {
        var ox = 14280;
        var oz = 160;

        // Viaduct deck — long elevated rail deck
        addMesh(new THREE.BoxGeometry(50, 3, 10), 0x8A7060, ox, 20, oz);

        // Viaduct piers — multiple brick arch piers
        addMesh(new THREE.BoxGeometry(3, 20, 5), 0x9A7A60, ox - 20, 10, oz);
        addMesh(new THREE.BoxGeometry(3, 20, 5), 0x9A7A60, ox - 12, 10, oz);
        addMesh(new THREE.BoxGeometry(3, 20, 5), 0x9A7A60, ox - 4, 10, oz);
        addMesh(new THREE.BoxGeometry(3, 20, 5), 0x9A7A60, ox + 4, 10, oz);
        addMesh(new THREE.BoxGeometry(3, 20, 5), 0x9A7A60, ox + 12, 10, oz);
        addMesh(new THREE.BoxGeometry(3, 20, 5), 0x9A7A60, ox + 20, 10, oz);

        // Arch spans between piers — decorative arch forms
        addMesh(new THREE.BoxGeometry(7, 6, 4), 0x9A7A60, ox - 16, 14, oz);
        addMesh(new THREE.BoxGeometry(7, 6, 4), 0x9A7A60, ox - 8, 14, oz);
        addMesh(new THREE.BoxGeometry(7, 6, 4), 0x9A7A60, ox, 14, oz);
        addMesh(new THREE.BoxGeometry(7, 6, 4), 0x9A7A60, ox + 8, 14, oz);
        addMesh(new THREE.BoxGeometry(7, 6, 4), 0x9A7A60, ox + 16, 14, oz);

        // Arch keystones / crown details
        addMesh(new THREE.SphereGeometry(1, 6, 6), 0x7A6050, ox - 16, 17.5, oz);
        addMesh(new THREE.SphereGeometry(1, 6, 6), 0x7A6050, ox - 8, 17.5, oz);
        addMesh(new THREE.SphereGeometry(1, 6, 6), 0x7A6050, ox, 17.5, oz);
        addMesh(new THREE.SphereGeometry(1, 6, 6), 0x7A6050, ox + 8, 17.5, oz);
        addMesh(new THREE.SphereGeometry(1, 6, 6), 0x7A6050, ox + 16, 17.5, oz);

        // Viaduct parapet rail
        addMesh(new THREE.BoxGeometry(50, 1, 1), 0x7A6050, ox, 22, oz - 5);
        addMesh(new THREE.BoxGeometry(50, 1, 1), 0x7A6050, ox, 22, oz + 5);

        // Valley floor beneath viaduct
        addMesh(new THREE.BoxGeometry(60, 0.3, 30), 0x607050, ox, 0.1, oz);
    }

    function build() {
        buildCathedral();
        buildRoyalCornwallMuseum();
        buildLemonStreet();
        buildRiverTruro();
        buildCityCentre();
        buildViaduct();
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
