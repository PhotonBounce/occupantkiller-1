window.ArmaghCathedral = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 19240;
    var CY = 0;
    var CZ = 0;

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

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function build() {
        buildGround();
        buildCoIHill();
        buildCoICathedral();
        buildRCHill();
        buildRCCathedral();
        buildTheMall();
        buildObservatory();
        buildGaol();
        buildMarketSquare();
        buildNavanFort();
        buildAppleOrchards();
    }

    function buildGround() {
        // Ground plane approximated with a wide flat box
        makeBox(600, 2, 600, 0x5A7A3A, 0, -1, 0);
        // Road between cathedrals
        makeBox(200, 0.5, 8, 0x444444, 0, 0.5, 0);
        // Cross road
        makeBox(8, 0.5, 200, 0x444444, 0, 0.5, 0);
    }

    function buildCoIHill() {
        // Church of Ireland cathedral sits on a hill to the west
        // Hill base
        makeBox(80, 12, 80, 0x6B8E23, -110, 6, -20);
        // Hill crown
        makeBox(60, 6, 60, 0x556B2F, -110, 15, -20);
    }

    function buildCoICathedral() {
        // St Patrick's Cathedral (Church of Ireland) - sandstone 0x8B7355
        var S = 0x8B7355;
        var SDARK = 0x6B5335;
        var base_x = -110;
        var base_y = 18;
        var base_z = -20;

        // Main nave
        makeBox(36, 14, 18, S, base_x, base_y + 7, base_z);
        // Nave roof (pitched - approximated with box)
        makeBox(38, 5, 6, SDARK, base_x, base_y + 16, base_z);

        // Chancel (east end)
        makeBox(14, 12, 16, S, base_x + 24, base_y + 6, base_z);
        // Chancel roof
        makeBox(16, 4, 6, SDARK, base_x + 24, base_y + 14, base_z);

        // Central tower (battlemented)
        makeBox(12, 28, 12, S, base_x - 4, base_y + 14, base_z);
        // Tower battlements - 4 corner merlons
        makeBox(3, 3, 3, S, base_x - 9, base_y + 29, base_z - 4);
        makeBox(3, 3, 3, S, base_x + 1, base_y + 29, base_z - 4);
        makeBox(3, 3, 3, S, base_x - 9, base_y + 29, base_z + 4);
        makeBox(3, 3, 3, S, base_x + 1, base_y + 29, base_z + 4);
        // Tower top platform
        makeBox(14, 1, 14, S, base_x - 4, base_y + 27.5, base_z);

        // North aisle
        makeBox(32, 10, 8, S, base_x - 2, base_y + 5, base_z - 13);
        // South aisle
        makeBox(32, 10, 8, S, base_x - 2, base_y + 5, base_z + 13);

        // West front porch
        makeBox(10, 16, 8, S, base_x - 22, base_y + 8, base_z);
        // West porch door arch (darker recess)
        makeBox(3, 7, 1, SDARK, base_x - 27, base_y + 6, base_z);

        // Transept north
        makeBox(10, 16, 14, S, base_x - 4, base_y + 8, base_z - 22);
        // Transept south
        makeBox(10, 16, 14, S, base_x - 4, base_y + 8, base_z + 22);

        // Small pinnacles on tower corners
        makeCone(1, 5, 4, SDARK, base_x - 10, base_y + 33, base_z - 5);
        makeCone(1, 5, 4, SDARK, base_x + 2, base_y + 33, base_z - 5);
        makeCone(1, 5, 4, SDARK, base_x - 10, base_y + 33, base_z + 5);
        makeCone(1, 5, 4, SDARK, base_x + 2, base_y + 33, base_z + 5);

        // Chapter house (south side)
        makeBox(12, 10, 12, S, base_x + 10, base_y + 5, base_z + 20);

        // Graveyard wall
        makeBox(100, 3, 2, SDARK, base_x, base_y - 2, base_z - 42);
        makeBox(100, 3, 2, SDARK, base_x, base_y - 2, base_z + 42);
        makeBox(2, 3, 84, SDARK, base_x - 50, base_y - 2, base_z);
        makeBox(2, 3, 84, SDARK, base_x + 50, base_y - 2, base_z);
    }

    function buildRCHill() {
        // Roman Catholic cathedral sits on opposite hill to east
        makeBox(80, 10, 80, 0x6B8E23, 110, 5, 20);
        makeBox(60, 5, 60, 0x556B2F, 110, 12, 20);
    }

    function buildRCCathedral() {
        // St Patrick's RC Cathedral - limestone 0x808080
        var L = 0x808080;
        var LDARK = 0x606060;
        var LGOLD = 0xDAA520;
        var base_x = 110;
        var base_y = 15;
        var base_z = 20;

        // Main body / nave
        makeBox(40, 16, 20, L, base_x, base_y + 8, base_z);
        // Nave pitched roof
        makeBox(42, 5, 7, LDARK, base_x, base_y + 18, base_z);

        // Chancel / apse east end
        makeBox(16, 14, 18, L, base_x + 27, base_y + 7, base_z);

        // TWIN SPIRES — magnificent ConeGeometry spires (height 35)
        // Left spire tower base
        makeBox(8, 24, 8, L, base_x - 22, base_y + 12, base_z - 5);
        // Left spire
        makeCone(4, 38, 8, LDARK, base_x - 22, base_y + 43, base_z - 5);
        // Left spire finial
        makeCone(1, 4, 6, LGOLD, base_x - 22, base_y + 63, base_z - 5);

        // Right spire tower base
        makeBox(8, 24, 8, L, base_x - 22, base_y + 12, base_z + 5);
        // Right spire
        makeCone(4, 38, 8, LDARK, base_x - 22, base_y + 43, base_z + 5);
        // Right spire finial
        makeCone(1, 4, 6, LGOLD, base_x - 22, base_y + 63, base_z + 5);

        // Gothic west facade (between spires)
        makeBox(12, 22, 8, L, base_x - 22, base_y + 11, base_z);
        // Central rose window recess
        makeBox(5, 5, 1, LDARK, base_x - 27, base_y + 16, base_z);

        // North transept
        makeBox(10, 18, 14, L, base_x - 2, base_y + 9, base_z - 20);
        // South transept
        makeBox(10, 18, 14, L, base_x - 2, base_y + 9, base_z + 20);

        // Side aisles
        makeBox(36, 10, 6, L, base_x - 1, base_y + 5, base_z - 13);
        makeBox(36, 10, 6, L, base_x - 1, base_y + 5, base_z + 13);

        // Mosaic decoration panels (gold coloured boxes on facade)
        makeBox(2, 4, 0.5, LGOLD, base_x - 27, base_y + 10, base_z - 3);
        makeBox(2, 4, 0.5, LGOLD, base_x - 27, base_y + 10, base_z + 3);

        // Steps up to entrance
        makeBox(12, 1, 6, L, base_x - 28, base_y + 0.5, base_z);
        makeBox(10, 1, 5, L, base_x - 29, base_y + 1.5, base_z);
        makeBox(8, 1, 4, L, base_x - 30, base_y + 2.5, base_z);

        // Boundary wall
        makeBox(110, 3, 2, LDARK, base_x, base_y - 4, base_z - 46);
        makeBox(110, 3, 2, LDARK, base_x, base_y - 4, base_z + 46);
        makeBox(2, 3, 92, LDARK, base_x - 55, base_y - 4, base_z);
        makeBox(2, 3, 92, LDARK, base_x + 55, base_y - 4, base_z);

        // Corner pinnacles on spire towers
        makeCone(0.8, 4, 4, LDARK, base_x - 26, base_y + 25, base_z - 9);
        makeCone(0.8, 4, 4, LDARK, base_x - 18, base_y + 25, base_z - 9);
        makeCone(0.8, 4, 4, LDARK, base_x - 26, base_y + 25, base_z + 9);
        makeCone(0.8, 4, 4, LDARK, base_x - 18, base_y + 25, base_z + 9);
    }

    function buildTheMall() {
        // The Mall - elegant Georgian parkland between the two cathedral hills
        // Green lawn
        makeBox(80, 0.5, 40, 0x228B22, 0, 0.5, 0);
        // Cricket pitch (lighter green)
        makeBox(40, 0.5, 20, 0x32CD32, 0, 0.6, 0);
        // Cricket wickets (thin boxes)
        makeBox(0.2, 2, 0.2, 0xF5DEB3, -8, 1.5, 0);
        makeBox(0.2, 2, 0.2, 0xF5DEB3, 8, 1.5, 0);

        // Courthouse / Museum on east side of Mall
        makeBox(20, 12, 14, 0xD2B48C, 52, 6, -5);
        // Museum columns (cylinders)
        makeCylinder(0.6, 0.6, 10, 8, 0xE8DCC8, 45, 5, -8);
        makeCylinder(0.6, 0.6, 10, 8, 0xE8DCC8, 45, 5, -3);
        makeCylinder(0.6, 0.6, 10, 8, 0xE8DCC8, 45, 5, 2);
        // Museum pediment
        makeBox(20, 4, 4, 0xD2B48C, 52, 14, -5);
        makeCone(0, 4, 3, 0xD2B48C, 52, 16, -5);

        // Mall perimeter railing (dark iron fence approximated)
        makeBox(80, 2, 1, 0x222222, 0, 1, -22);
        makeBox(80, 2, 1, 0x222222, 0, 1, 22);
        makeBox(1, 2, 44, 0x222222, -40, 1, 0);
        makeBox(1, 2, 44, 0x222222, 40, 1, 0);

        // Trees along Mall (sphere canopies on cylinder trunks)
        makeCylinder(0.4, 0.5, 5, 6, 0x5C4033, -35, 3, -18);
        makeSphere(3, 8, 6, 0x2E8B57, -35, 7, -18);
        makeCylinder(0.4, 0.5, 5, 6, 0x5C4033, -20, 3, -18);
        makeSphere(3, 8, 6, 0x2E8B57, -20, 7, -18);
        makeCylinder(0.4, 0.5, 5, 6, 0x5C4033, -5, 3, -18);
        makeSphere(3, 8, 6, 0x2E8B57, -5, 7, -18);
        makeCylinder(0.4, 0.5, 5, 6, 0x5C4033, 10, 3, -18);
        makeSphere(3, 8, 6, 0x2E8B57, 10, 7, -18);
        makeCylinder(0.4, 0.5, 5, 6, 0x5C4033, 25, 3, -18);
        makeSphere(3, 8, 6, 0x2E8B57, 25, 7, -18);
    }

    function buildObservatory() {
        // Armagh Observatory - Georgian with famous dome, south of town
        var OB = 0x8B7355;
        var base_x = -60;
        var base_z = 80;
        var base_y = 1;

        // Main observatory building
        makeBox(24, 10, 14, OB, base_x, base_y + 5, base_z);
        // Georgian front
        makeBox(24, 1, 14, 0x7A6345, base_x, base_y + 10, base_z);
        // Dome drum
        makeCylinder(5, 5, 5, 12, OB, base_x, base_y + 13, base_z);
        // Observatory dome
        makeSphere(5, 10, 8, 0x9B8365, base_x, base_y + 17, base_z);
        // Dome slit (dark strip)
        makeBox(1, 8, 0.5, 0x333333, base_x, base_y + 17, base_z - 5);
        // Chimney stacks
        makeCylinder(0.5, 0.5, 4, 6, 0x6B5335, base_x - 9, base_y + 14, base_z - 5);
        makeCylinder(0.5, 0.5, 4, 6, 0x6B5335, base_x + 9, base_y + 14, base_z - 5);
        // Garden wall
        makeBox(40, 2, 1, 0x7A6345, base_x, base_y + 1, base_z - 10);
    }

    function buildGaol() {
        // Armagh Gaol - imposing Georgian prison, north of town
        var GC = 0x696969;
        var GCDARK = 0x4A4A4A;
        var base_x = 50;
        var base_z = -80;
        var base_y = 1;

        // Main prison block
        makeBox(40, 18, 20, GC, base_x, base_y + 9, base_z);
        // Wing A
        makeBox(20, 16, 12, GC, base_x - 25, base_y + 8, base_z + 8);
        // Wing B
        makeBox(20, 16, 12, GC, base_x + 25, base_y + 8, base_z + 8);
        // Central gatehouse tower
        makeBox(10, 22, 10, GCDARK, base_x, base_y + 11, base_z - 14);
        // Gatehouse battlements
        makeBox(12, 3, 12, GCDARK, base_x, base_y + 23, base_z - 14);
        // Corner watchtowers
        makeCylinder(2, 2, 20, 8, GCDARK, base_x - 22, base_y + 10, base_z - 12);
        makeCylinder(2, 2, 20, 8, GCDARK, base_x + 22, base_y + 10, base_z - 12);
        // Watchtower caps
        makeCone(3, 4, 8, GCDARK, base_x - 22, base_y + 22, base_z - 12);
        makeCone(3, 4, 8, GCDARK, base_x + 22, base_y + 22, base_z - 12);
        // High perimeter wall
        makeBox(70, 8, 2, GCDARK, base_x, base_y + 4, base_z - 20);
        makeBox(70, 8, 2, GCDARK, base_x, base_y + 4, base_z + 18);
        makeBox(2, 8, 40, GCDARK, base_x - 35, base_y + 4, base_z - 1);
        makeBox(2, 8, 40, GCDARK, base_x + 35, base_y + 4, base_z - 1);
    }

    function buildMarketSquare() {
        // Market Square - central town, Georgian buildings
        var GS = 0xC8A87A;
        var sq_x = 0;
        var sq_z = -50;

        // Square paving
        makeBox(40, 0.5, 40, 0x999999, sq_x, 0.5, sq_z);
        // Market cross / obelisk
        makeBox(1, 14, 1, 0xAAAAAA, sq_x, 7, sq_z);
        makeCone(1.5, 3, 4, 0x888888, sq_x, 15, sq_z);

        // Georgian townhouses surrounding square
        makeBox(12, 14, 8, GS, sq_x - 22, 7, sq_z - 16);
        makeBox(12, 14, 8, GS, sq_x - 8, 7, sq_z - 16);
        makeBox(12, 14, 8, GS, sq_x + 8, 7, sq_z - 16);
        makeBox(12, 14, 8, GS, sq_x + 22, 7, sq_z - 16);
        makeBox(12, 14, 8, GS, sq_x - 22, 7, sq_z + 16);
        makeBox(12, 14, 8, GS, sq_x - 8, 7, sq_z + 16);
        makeBox(12, 14, 8, GS, sq_x + 8, 7, sq_z + 16);
        makeBox(12, 14, 8, GS, sq_x + 22, 7, sq_z + 16);
        // Roofs
        makeBox(12, 3, 4, 0x8B4513, sq_x - 22, 15.5, sq_z - 16);
        makeBox(12, 3, 4, 0x8B4513, sq_x - 8, 15.5, sq_z - 16);
        makeBox(12, 3, 4, 0x8B4513, sq_x + 8, 15.5, sq_z - 16);
        makeBox(12, 3, 4, 0x8B4513, sq_x + 22, 15.5, sq_z - 16);
        // Side Georgian blocks
        makeBox(8, 14, 30, GS, sq_x - 26, 7, sq_z);
        makeBox(8, 14, 30, GS, sq_x + 26, 7, sq_z);
    }

    function buildNavanFort() {
        // Navan Fort (Emain Macha) - prehistoric circular earthwork on horizon
        // Outer circular earthen bank (approximated with cylinder ring via stacked boxes)
        var NX = -180;
        var NZ = -160;
        var NY = 1;
        var segments = 12;
        var radius = 35;

        for (var i = 0; i < segments; i++) {
            var angle = (i / segments) * Math.PI * 2;
            var bx = NX + Math.cos(angle) * radius;
            var bz = NZ + Math.sin(angle) * radius;
            var geo = new THREE.BoxGeometry(12, 4, 6);
            var mat = new THREE.MeshLambertMaterial({ color: 0x6B8E23 });
            var mesh = new THREE.Mesh(geo, mat);
            mesh.position.set(CX + bx, CY + NY + 2, CZ + bz);
            mesh.rotation.y = angle;
            addMesh(mesh);
        }

        // Central mound
        makeSphere(12, 10, 8, 0x556B2F, NX, NY + 6, NZ);
        // Ditch ring (dark flat boxes)
        for (var j = 0; j < 8; j++) {
            var dangle = (j / 8) * Math.PI * 2;
            var dx = NX + Math.cos(dangle) * (radius + 9);
            var dz = NZ + Math.sin(dangle) * (radius + 9);
            var dgeo = new THREE.BoxGeometry(14, 1, 5);
            var dmat = new THREE.MeshLambertMaterial({ color: 0x3B5323 });
            var dmesh = new THREE.Mesh(dgeo, dmat);
            dmesh.position.set(CX + dx, CY + NY - 0.5, CZ + dz);
            dmesh.rotation.y = dangle;
            addMesh(dmesh);
        }

        // Information marker
        makeBox(1, 3, 1, 0x8B4513, NX + 40, NY + 1.5, NZ);
    }

    function buildAppleOrchards() {
        // County Armagh famous apple orchards - clusters of trees with red apples
        var orchardDefs = [
            { ox: 160, oz: -90 },
            { ox: 180, oz: -60 },
            { ox: 200, oz: -110 },
            { ox: -160, oz: 100 },
            { ox: -140, oz: 130 }
        ];

        for (var t = 0; t < orchardDefs.length; t++) {
            var od = orchardDefs[t];
            buildOrchardCluster(od.ox, od.oz);
        }
    }

    function buildOrchardCluster(ox, oz) {
        var treePositions = [
            { tx: 0, tz: 0 },
            { tx: 10, tz: 3 },
            { tx: -8, tz: 5 },
            { tx: 5, tz: -9 },
            { tx: -5, tz: -6 },
            { tx: 18, tz: -4 }
        ];

        for (var k = 0; k < treePositions.length; k++) {
            var tp = treePositions[k];
            var tx = ox + tp.tx;
            var tz = oz + tp.tz;
            // Trunk
            makeCylinder(0.4, 0.5, 5, 6, 0x5C4033, tx, 3, tz);
            // Canopy - green sphere
            makeSphere(3.5, 8, 6, 0x228B22, tx, 8, tz);
            // Apple fruits - red spheres scattered in canopy
            makeSphere(0.4, 4, 4, 0xFF3300, tx + 1.5, 8.5, tz + 1);
            makeSphere(0.4, 4, 4, 0xFF3300, tx - 1.2, 9, tz - 0.8);
            makeSphere(0.4, 4, 4, 0xFF3300, tx + 0.5, 7.5, tz + 2);
            makeSphere(0.4, 4, 4, 0xFF6600, tx - 2, 8, tz + 0.5);
        }
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
