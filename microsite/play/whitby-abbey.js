window.WhitbyAbbey = (function() {
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

    function stoneMat() {
        return new THREE.MeshLambertMaterial({ color: 0x8B8682 });
    }

    function darkStoneMat() {
        return new THREE.MeshLambertMaterial({ color: 0x5C5550 });
    }

    function sandStoneMat() {
        return new THREE.MeshLambertMaterial({ color: 0xC4A882 });
    }

    function build() {
        buildCliff();
        buildWhitbyAbbey();
        buildOneNineNineSteps();
        buildStMarysChurch();
        buildWhitbyHarbour();
        buildWestCliff();
        buildEskValley();
    }

    function buildCliff() {
        var mat = new THREE.MeshLambertMaterial({ color: 0x7A7060 });
        // Main clifftop platform
        addMesh(new THREE.BoxGeometry(300, 60, 200), mat, 15480, -30, -100);
        // Cliff face east
        addMesh(new THREE.BoxGeometry(300, 80, 20), mat, 15480, -40, 0);
        // Cliff base
        addMesh(new THREE.BoxGeometry(400, 20, 300), mat, 15480, -70, 50);
    }

    function buildWhitbyAbbey() {
        var x = 15480;
        var z = -150;
        var sandstone = sandStoneMat();
        var dark = darkStoneMat();

        // North transept - main surviving wall (tall, jagged top)
        addMesh(new THREE.BoxGeometry(8, 55, 40), sandstone, x - 40, 27, z);
        // Jagged top north transept
        addMesh(new THREE.BoxGeometry(3, 10, 8), sandstone, x - 40, 60, z - 10);
        addMesh(new THREE.BoxGeometry(3, 7, 8), sandstone, x - 40, 58, z);
        addMesh(new THREE.BoxGeometry(3, 12, 8), sandstone, x - 40, 61, z + 10);

        // Gothic window tracery in north transept (cross shape approximation)
        addMesh(new THREE.BoxGeometry(1, 20, 3), dark, x - 36, 35, z - 5);
        addMesh(new THREE.BoxGeometry(1, 3, 12), dark, x - 36, 43, z - 5);
        addMesh(new THREE.BoxGeometry(1, 20, 3), dark, x - 36, 35, z + 5);
        addMesh(new THREE.BoxGeometry(1, 3, 12), dark, x - 36, 43, z + 5);

        // South transept stub
        addMesh(new THREE.BoxGeometry(8, 30, 40), sandstone, x + 40, 15, z);
        addMesh(new THREE.BoxGeometry(3, 8, 6), sandstone, x + 40, 34, z - 8);
        addMesh(new THREE.BoxGeometry(3, 6, 6), sandstone, x + 40, 33, z + 8);

        // Nave north wall (long, partial, jagged)
        addMesh(new THREE.BoxGeometry(80, 40, 6), sandstone, x, 20, z - 18);
        // Jagged top of nave wall
        addMesh(new THREE.BoxGeometry(10, 8, 4), sandstone, x - 30, 44, z - 18);
        addMesh(new THREE.BoxGeometry(8, 5, 4), sandstone, x - 10, 42, z - 18);
        addMesh(new THREE.BoxGeometry(10, 10, 4), sandstone, x + 20, 45, z - 18);
        addMesh(new THREE.BoxGeometry(6, 6, 4), sandstone, x + 35, 43, z - 18);

        // Nave south wall (more ruined, lower)
        addMesh(new THREE.BoxGeometry(80, 25, 6), sandstone, x, 12, z + 18);
        addMesh(new THREE.BoxGeometry(8, 8, 4), sandstone, x - 25, 30, z + 18);
        addMesh(new THREE.BoxGeometry(10, 6, 4), sandstone, x + 10, 28, z + 18);

        // East end fragments
        addMesh(new THREE.BoxGeometry(6, 45, 36), sandstone, x + 80, 22, z);
        // East window arch suggestion
        addMesh(new THREE.BoxGeometry(2, 18, 2), dark, x + 77, 25, z - 8);
        addMesh(new THREE.BoxGeometry(2, 18, 2), dark, x + 77, 25, z + 8);
        addMesh(new THREE.BoxGeometry(2, 3, 18), dark, x + 77, 36, z);
        // Jagged east end top
        addMesh(new THREE.BoxGeometry(3, 12, 6), sandstone, x + 80, 52, z - 12);
        addMesh(new THREE.BoxGeometry(3, 8, 6), sandstone, x + 80, 50, z);
        addMesh(new THREE.BoxGeometry(3, 15, 6), sandstone, x + 80, 54, z + 12);

        // Chapter house outline (low walls, rectangular)
        addMesh(new THREE.BoxGeometry(30, 4, 3), sandstone, x - 60, 2, z + 35);
        addMesh(new THREE.BoxGeometry(30, 4, 3), sandstone, x - 60, 2, z + 65);
        addMesh(new THREE.BoxGeometry(3, 4, 30), sandstone, x - 75, 2, z + 50);
        addMesh(new THREE.BoxGeometry(3, 4, 30), sandstone, x - 45, 2, z + 50);

        // Crossing tower remains
        addMesh(new THREE.BoxGeometry(20, 50, 20), sandstone, x, 25, z);
        addMesh(new THREE.BoxGeometry(3, 15, 3), sandstone, x - 8, 62, z - 8);
        addMesh(new THREE.BoxGeometry(3, 12, 3), sandstone, x + 8, 60, z - 8);
        addMesh(new THREE.BoxGeometry(3, 18, 3), sandstone, x - 8, 64, z + 8);
        addMesh(new THREE.BoxGeometry(3, 10, 3), sandstone, x + 8, 59, z + 8);

        // Ground rubble/foundations
        addMesh(new THREE.BoxGeometry(200, 2, 80), dark, x, 1, z);
    }

    function buildOneNineNineSteps() {
        var x = 15480 - 80;
        var mat = new THREE.MeshLambertMaterial({ color: 0x9E9080 });
        var railMat = new THREE.MeshLambertMaterial({ color: 0x6B6055 });
        var lampMat = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });
        var lampGlow = new THREE.MeshLambertMaterial({ color: 0xFFDD88 });
        var i;
        // Steps going up the cliff face (199 steps, grouped into runs)
        // Each step: small box, stacked progressively higher and further west
        for (i = 0; i < 20; i++) {
            addMesh(new THREE.BoxGeometry(6, 0.8, 3), mat, x + i * 2, i * 1.5, 30 - i * 1.0);
        }
        for (i = 0; i < 20; i++) {
            addMesh(new THREE.BoxGeometry(6, 0.8, 3), mat, x + 40 + i * 2, 30 + i * 1.5, 10 - i * 1.0);
        }
        for (i = 0; i < 20; i++) {
            addMesh(new THREE.BoxGeometry(6, 0.8, 3), mat, x + 80 + i * 2, 60 + i * 1.5, -10 - i * 1.0);
        }

        // Landings between runs
        addMesh(new THREE.BoxGeometry(8, 1, 8), mat, x + 42, 31, 8);
        addMesh(new THREE.BoxGeometry(8, 1, 8), mat, x + 82, 61, -12);

        // Handrails (simplified as thin boxes)
        addMesh(new THREE.BoxGeometry(42, 1, 1), railMat, x + 21, 17, 27);
        addMesh(new THREE.BoxGeometry(42, 1, 1), railMat, x + 61, 47, 7);
        addMesh(new THREE.BoxGeometry(42, 1, 1), railMat, x + 101, 77, -13);

        // Gas lamp posts along steps
        for (i = 0; i < 6; i++) {
            addMesh(new THREE.CylinderGeometry(0.2, 0.2, 4, 6), lampMat, x + i * 20, 5 + i * 8, 25 - i * 3);
            addMesh(new THREE.SphereGeometry(0.5, 6, 6), lampGlow, x + i * 20, 7 + i * 8, 25 - i * 3);
        }
    }

    function buildStMarysChurch() {
        var x = 15480 - 50;
        var z = -60;
        var mat = new THREE.MeshLambertMaterial({ color: 0x8A7E6E });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x5A5050 });
        var stoneMate = stoneMat();

        // Main church body
        addMesh(new THREE.BoxGeometry(30, 12, 20), mat, x, 6, z);

        // Roof (gabled, use box tilted suggestion with two boxes)
        addMesh(new THREE.BoxGeometry(32, 2, 22), roofMat, x, 13, z);
        addMesh(new THREE.BoxGeometry(30, 6, 2), roofMat, x, 16, z - 11);
        addMesh(new THREE.BoxGeometry(30, 6, 2), roofMat, x, 16, z + 11);

        // Tower
        addMesh(new THREE.BoxGeometry(8, 20, 8), mat, x - 18, 10, z);
        addMesh(new THREE.BoxGeometry(9, 1, 9), mat, x - 18, 21, z);
        // Tower battlements
        addMesh(new THREE.BoxGeometry(2, 2, 2), mat, x - 21, 22, z - 3);
        addMesh(new THREE.BoxGeometry(2, 2, 2), mat, x - 21, 22, z + 3);
        addMesh(new THREE.BoxGeometry(2, 2, 2), mat, x - 15, 22, z - 3);
        addMesh(new THREE.BoxGeometry(2, 2, 2), mat, x - 15, 22, z + 3);
        addMesh(new THREE.BoxGeometry(2, 2, 2), mat, x - 21, 22, z);
        addMesh(new THREE.BoxGeometry(2, 2, 2), mat, x - 15, 22, z);

        // External gallery stairs (unusual feature of St Mary's)
        addMesh(new THREE.BoxGeometry(4, 6, 2), mat, x + 12, 3, z - 12);
        addMesh(new THREE.BoxGeometry(4, 1, 2), mat, x + 12, 7, z - 12);

        // Churchyard with gravestones (Dracula scene)
        var graveMat = new THREE.MeshLambertMaterial({ color: 0x706860 });
        var gravePos = [
            [x + 20, z + 5],
            [x + 25, z - 5],
            [x + 30, z + 10],
            [x + 35, z - 8],
            [x + 15, z + 15],
            [x + 40, z + 2],
            [x + 28, z + 18],
            [x + 45, z - 3],
            [x + 22, z - 15],
            [x + 38, z + 15]
        ];
        for (var g = 0; g < gravePos.length; g++) {
            addMesh(new THREE.BoxGeometry(1.5, 3, 0.4), graveMat, gravePos[g][0], 1.5, gravePos[g][1]);
        }
        // Churchyard wall
        addMesh(new THREE.BoxGeometry(60, 3, 2), stoneMate, x + 30, 1.5, z + 25);
        addMesh(new THREE.BoxGeometry(2, 3, 50), stoneMate, x, 1.5, z + 1);
    }

    function buildWhitbyHarbour() {
        var x = 15480;
        var z = 150;
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x9A9080 });
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x1A4A6A });
        var lightMat = new THREE.MeshLambertMaterial({ color: 0xEEEECC });
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var boatHullMat = new THREE.MeshLambertMaterial({ color: 0x2A2A6A });
        var blackMat = new THREE.MeshLambertMaterial({ color: 0x111111 });
        var woodMat = new THREE.MeshLambertMaterial({ color: 0x7B5B3A });

        // Harbour water surface
        addMesh(new THREE.BoxGeometry(200, 1, 120), waterMat, x, -1, z);

        // East pier (long, curving - simplified as angled boxes)
        addMesh(new THREE.BoxGeometry(120, 4, 8), pierMat, x + 80, 2, z - 30);
        addMesh(new THREE.BoxGeometry(30, 4, 8), pierMat, x + 148, 2, z - 42);
        // East pier lighthouse
        addMesh(new THREE.CylinderGeometry(2, 2.5, 12, 8), lightMat, x + 163, 6, z - 46);
        addMesh(new THREE.ConeGeometry(2.5, 4, 8), new THREE.MeshLambertMaterial({ color: 0xCC3322 }), x + 163, 14, z - 46);
        addMesh(new THREE.CylinderGeometry(2.8, 2.8, 2, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }), x + 163, 13, z - 46);

        // West pier
        addMesh(new THREE.BoxGeometry(120, 4, 8), pierMat, x - 80, 2, z - 30);
        addMesh(new THREE.BoxGeometry(30, 4, 8), pierMat, x - 148, 2, z - 42);
        // West pier lighthouse
        addMesh(new THREE.CylinderGeometry(2, 2.5, 12, 8), lightMat, x - 163, 6, z - 46);
        addMesh(new THREE.ConeGeometry(2.5, 4, 8), new THREE.MeshLambertMaterial({ color: 0xCCCCCC }), x - 163, 14, z - 46);
        addMesh(new THREE.CylinderGeometry(2.8, 2.8, 2, 8), new THREE.MeshLambertMaterial({ color: 0x333333 }), x - 163, 13, z - 46);

        // Harbour mouth
        addMesh(new THREE.BoxGeometry(8, 4, 30), pierMat, x + 155, 2, z - 15);
        addMesh(new THREE.BoxGeometry(8, 4, 30), pierMat, x - 155, 2, z - 15);

        // Fishing boats in harbour
        // Boat 1
        addMesh(new THREE.BoxGeometry(14, 3, 5), boatHullMat, x + 20, 1.5, z + 20);
        addMesh(new THREE.BoxGeometry(6, 4, 4), boatMat, x + 22, 4, z + 20);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 10, 6), woodMat, x + 18, 7, z + 20);

        // Boat 2
        addMesh(new THREE.BoxGeometry(12, 3, 4), boatHullMat, x - 20, 1.5, z + 15);
        addMesh(new THREE.BoxGeometry(5, 3, 3), boatMat, x - 18, 4, z + 15);
        addMesh(new THREE.CylinderGeometry(0.3, 0.3, 8, 6), woodMat, x - 22, 6, z + 15);

        // Boat 3 (replica Captain Cook ship - Endeavour style)
        addMesh(new THREE.BoxGeometry(18, 4, 6), boatMat, x + 5, 2, z + 40);
        addMesh(new THREE.BoxGeometry(8, 5, 5), boatMat, x + 8, 5, z + 40);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 14, 6), woodMat, x + 3, 9, z + 40);
        addMesh(new THREE.CylinderGeometry(0.4, 0.4, 12, 6), woodMat, x + 10, 8, z + 40);
        // Bowsprit
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 8, 4), woodMat, x - 3, 5, z + 40);

        // Jet workshops (black gemstone industry - small buildings)
        addMesh(new THREE.BoxGeometry(12, 8, 10), new THREE.MeshLambertMaterial({ color: 0x5A4A3A }), x - 60, 4, z + 10);
        addMesh(new THREE.BoxGeometry(10, 8, 10), new THREE.MeshLambertMaterial({ color: 0x4A3A2A }), x - 75, 4, z + 20);
        addMesh(new THREE.BoxGeometry(2, 2, 2), blackMat, x - 58, 9, z + 8);
        // Jet gemstone display suggestion (small dark boxes)
        addMesh(new THREE.BoxGeometry(3, 2, 3), blackMat, x - 60, 8.5, z + 5);
        addMesh(new THREE.BoxGeometry(3, 2, 3), blackMat, x - 75, 8.5, z + 15);

        // Fish market/quayside buildings
        addMesh(new THREE.BoxGeometry(20, 7, 12), new THREE.MeshLambertMaterial({ color: 0xC8B89A }), x + 50, 3.5, z + 5);
        addMesh(new THREE.BoxGeometry(18, 6, 10), new THREE.MeshLambertMaterial({ color: 0xB8A88A }), x + 72, 3, z + 8);

        // Swing bridge suggestion (middle of harbour)
        addMesh(new THREE.BoxGeometry(20, 2, 4), new THREE.MeshLambertMaterial({ color: 0x556655 }), x, 1, z + 55);
    }

    function buildWestCliff() {
        var x = 15480 - 150;
        var z = 50;
        var hotelMat = new THREE.MeshLambertMaterial({ color: 0xE8D8B8 });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var stoneMate = stoneMat();
        var whiteMat = new THREE.MeshLambertMaterial({ color: 0xF5F5F0 });
        var ironMat = new THREE.MeshLambertMaterial({ color: 0x556677 });

        // West cliff elevation
        addMesh(new THREE.BoxGeometry(200, 30, 100), new THREE.MeshLambertMaterial({ color: 0x7A7060 }), x, -15, z);

        // Royal Hotel (large Victorian building)
        addMesh(new THREE.BoxGeometry(40, 20, 20), hotelMat, x - 20, 10, z - 30);
        addMesh(new THREE.BoxGeometry(42, 3, 22), roofMat, x - 20, 21, z - 30);
        // Hotel windows suggestion (rows of dark boxes)
        for (var wi = 0; wi < 4; wi++) {
            addMesh(new THREE.BoxGeometry(3, 4, 1), new THREE.MeshLambertMaterial({ color: 0x334455 }), x - 32 + wi * 9, 14, z - 41);
            addMesh(new THREE.BoxGeometry(3, 4, 1), new THREE.MeshLambertMaterial({ color: 0x334455 }), x - 32 + wi * 9, 7, z - 41);
        }

        // Whalebone Arch (two curving arch pieces)
        addMesh(new THREE.CylinderGeometry(1, 1.5, 15, 6), whiteMat, x + 30, 7, z - 25);
        addMesh(new THREE.CylinderGeometry(1, 1.5, 15, 6), whiteMat, x + 38, 7, z - 25);
        // Arch crosspiece at top
        addMesh(new THREE.BoxGeometry(10, 2, 2), whiteMat, x + 34, 14, z - 25);

        // Captain Cook statue
        addMesh(new THREE.CylinderGeometry(1.5, 2, 6, 8), stoneMate, x + 60, 3, z - 20);
        addMesh(new THREE.CylinderGeometry(0.5, 0.8, 8, 6), stoneMate, x + 60, 10, z - 20);
        addMesh(new THREE.SphereGeometry(1.2, 8, 8), stoneMate, x + 60, 15, z - 20);

        // Bandstand (circular)
        addMesh(new THREE.CylinderGeometry(8, 8, 1, 12), stoneMate, x + 10, 0.5, z - 40);
        addMesh(new THREE.CylinderGeometry(6, 6, 0.3, 12), roofMat, x + 10, 6, z - 40);
        // Bandstand columns
        for (var ci = 0; ci < 8; ci++) {
            var angle = (ci / 8) * Math.PI * 2;
            addMesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 6), ironMat, x + 10 + Math.cos(angle) * 5.5, 3, z - 40 + Math.sin(angle) * 5.5);
        }
        addMesh(new THREE.ConeGeometry(7, 4, 12), roofMat, x + 10, 8, z - 40);

        // Cliff lift / funicular
        addMesh(new THREE.BoxGeometry(3, 25, 3), ironMat, x - 70, 12, z - 10);
        addMesh(new THREE.BoxGeometry(4, 6, 4), new THREE.MeshLambertMaterial({ color: 0xCC4422 }), x - 70, 5, z - 10);
        // Track rails
        addMesh(new THREE.BoxGeometry(1, 25, 1), ironMat, x - 68, 12, z - 8);
        addMesh(new THREE.BoxGeometry(1, 25, 1), ironMat, x - 72, 12, z - 12);

        // Victorian terrace houses along West Cliff
        for (var ti = 0; ti < 6; ti++) {
            addMesh(new THREE.BoxGeometry(10, 16, 12), hotelMat, x - 90 + ti * 12, 8, z - 35);
            addMesh(new THREE.BoxGeometry(11, 3, 13), roofMat, x - 90 + ti * 12, 17, z - 35);
        }

        // Promenade path
        addMesh(new THREE.BoxGeometry(200, 0.5, 6), new THREE.MeshLambertMaterial({ color: 0xCCBBA0 }), x, 0.25, z - 43);
    }

    function buildEskValley() {
        var x = 15480 - 250;
        var z = 80;
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x2A5A7A });
        var viaductMat = new THREE.MeshLambertMaterial({ color: 0x8A7A6A });
        var roofMat = new THREE.MeshLambertMaterial({ color: 0x664A3A });
        var wallMat = new THREE.MeshLambertMaterial({ color: 0xB8A888 });
        var archMat = new THREE.MeshLambertMaterial({ color: 0x7A6A5A });

        // Valley floor
        addMesh(new THREE.BoxGeometry(200, 10, 80), new THREE.MeshLambertMaterial({ color: 0x4A6A3A }), x, -5, z);

        // River Esk
        addMesh(new THREE.BoxGeometry(180, 0.5, 15), waterMat, x, 0.25, z + 10);

        // Railway viaduct (multi-arch)
        // Viaduct deck
        addMesh(new THREE.BoxGeometry(160, 4, 8), viaductMat, x, 25, z);
        // Viaduct piers/arches (8 arches)
        for (var pi = 0; pi < 8; pi++) {
            // Pier
            addMesh(new THREE.BoxGeometry(5, 25, 7), viaductMat, x - 70 + pi * 20, 12, z);
            // Arch void (dark box between piers)
            addMesh(new THREE.BoxGeometry(13, 10, 7), archMat, x - 60 + pi * 20, 8, z);
        }

        // Whitby town rooftops (varied heights, red/orange roofs)
        var roofColors = [0xCC5533, 0xBB4422, 0xDD6644, 0xAA4433, 0xCC6655];
        for (var ri = 0; ri < 12; ri++) {
            var rw = 8 + Math.floor(ri * 1.3) % 6;
            var rh = 10 + (ri * 3) % 8;
            var rc = roofColors[ri % roofColors.length];
            addMesh(new THREE.BoxGeometry(rw, rh, 8), wallMat, x - 80 + ri * 14, rh / 2, z - 20);
            addMesh(new THREE.BoxGeometry(rw + 1, 3, 9), new THREE.MeshLambertMaterial({ color: rc }), x - 80 + ri * 14, rh + 1.5, z - 20);
        }

        // Old town buildings closer to harbour approach
        for (var ot = 0; ot < 8; ot++) {
            addMesh(new THREE.BoxGeometry(7, 12 + ot % 4, 7), wallMat, x + 20 + ot * 9, 6 + ot % 2, z - 15);
            addMesh(new THREE.BoxGeometry(8, 3, 8), new THREE.MeshLambertMaterial({ color: roofColors[ot % roofColors.length] }), x + 20 + ot * 9, 13, z - 15);
        }

        // River bank vegetation suggestion (green cylinders)
        var greenMat = new THREE.MeshLambertMaterial({ color: 0x3A7A2A });
        for (var vi = 0; vi < 10; vi++) {
            addMesh(new THREE.CylinderGeometry(1, 1.5, 5, 6), greenMat, x - 85 + vi * 18, 2.5, z + 20);
            addMesh(new THREE.SphereGeometry(2, 6, 6), greenMat, x - 85 + vi * 18, 7, z + 20);
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

    return { init: init, update: update, reset: reset };
}());
