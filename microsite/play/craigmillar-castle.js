window.CraigmillarCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var CX = 20520;
    var CY = 0;
    var CZ = 0;

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeMat(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMat(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(CX + x, CY + y, CZ + z);
        return addMesh(mesh);
    }

    function buildBasaltRock() {
        // Main volcanic rock the castle sits on - irregular lumpy formation
        makeBox(60, 8, 50, 0x5a4a3a, 0, -4, 0);
        makeBox(50, 5, 40, 0x4a3c2e, 5, -8, 3);
        makeBox(40, 6, 30, 0x6b5a48, -4, -6, -4);
        // Rock outcroppings
        makeBox(15, 4, 12, 0x5a4a3a, -22, -7, 8);
        makeBox(10, 3, 8, 0x4a3c2e, 20, -8, 18);
        makeBox(8, 5, 10, 0x6b5a48, -18, -6, -16);
        makeBox(12, 4, 9, 0x5a4a3a, 25, -7, -10);
        // Craigs (rocky outcrops)
        makeCyl(3, 5, 6, 6, 0x4a3c2e, -28, -4, 12);
        makeCyl(2, 4, 5, 6, 0x5a4a3a, 30, -5, 15);
    }

    function buildPrestonTower() {
        // Main L-plan tower house - Preston Tower
        // Main vertical body of the tower (north wing)
        makeBox(16, 36, 14, 0x8B7355, 0, 18, 0);
        // L-plan wing (east projection)
        makeBox(10, 32, 12, 0x8B7355, 11, 16, -3);
        // Corner buttress
        makeBox(3, 36, 3, 0x7a6445, -7, 18, -6);
        makeBox(3, 36, 3, 0x7a6445, 7, 18, 6);
        // Parapet / wall walk at top
        makeBox(18, 2, 16, 0x9c8465, 0, 37, 0);
        makeBox(12, 2, 14, 0x9c8465, 11, 35, -3);
        // Parapet merlons on main tower
        makeBox(2, 3, 2, 0x8B7355, -7, 39, -7);
        makeBox(2, 3, 2, 0x8B7355, -3, 39, -7);
        makeBox(2, 3, 2, 0x8B7355, 1, 39, -7);
        makeBox(2, 3, 2, 0x8B7355, 5, 39, -7);
        makeBox(2, 3, 2, 0x8B7355, -7, 39, 7);
        makeBox(2, 3, 2, 0x8B7355, -3, 39, 7);
        makeBox(2, 3, 2, 0x8B7355, 1, 39, 7);
        makeBox(2, 3, 2, 0x8B7355, 5, 39, 7);
        // Merlons on L wing
        makeBox(2, 3, 2, 0x8B7355, 7, 37, -9);
        makeBox(2, 3, 2, 0x8B7355, 11, 37, -9);
        makeBox(2, 3, 2, 0x8B7355, 15, 37, -9);
        // Great Hall windows (2nd floor) - dark insets
        makeBox(3, 4, 0.5, 0x2a2018, -3, 22, -7);
        makeBox(3, 4, 0.5, 0x2a2018, 3, 22, -7);
        makeBox(3, 4, 0.5, 0x2a2018, -3, 22, 7);
        makeBox(3, 4, 0.5, 0x2a2018, 3, 22, 7);
        // Upper floor windows
        makeBox(2, 3, 0.5, 0x2a2018, 0, 28, -7);
        makeBox(2, 3, 0.5, 0x2a2018, 0, 28, 7);
        makeBox(2, 3, 0.5, 0x2a2018, 11, 26, -9);
        // Ground floor entrance arch
        makeBox(4, 5, 0.5, 0x1a120a, 0, 5, -7);
        // Cap house / garret at tower top
        makeBox(8, 5, 8, 0x7a6445, 0, 42, 0);
        makeCone(5, 4, 4, 0x6b5a3a, 0, 46, 0);
    }

    function buildInnerCurtainWall() {
        // Oval inner curtain wall - approximate with multiple wall segments
        // North wall
        makeBox(40, 10, 2, 0x8B7355, 0, 5, -28);
        // South wall
        makeBox(40, 10, 2, 0x8B7355, 0, 5, 28);
        // East wall
        makeBox(2, 10, 30, 0x8B7355, 22, 5, 0);
        // West wall
        makeBox(2, 10, 30, 0x8B7355, -22, 5, 0);
        // Diagonal corner walls (to form oval)
        var wallMat = 0x8B7355;
        makeBox(14, 10, 2, 0x8B7355, -15, 5, -25);
        makeBox(2, 10, 14, 0x8B7355, -21, 5, -15);
        makeBox(14, 10, 2, 0x8B7355, 15, 5, -25);
        makeBox(2, 10, 14, 0x8B7355, 21, 5, -15);
        makeBox(14, 10, 2, 0x8B7355, -15, 5, 25);
        makeBox(2, 10, 14, 0x8B7355, -21, 5, 15);
        makeBox(14, 10, 2, 0x8B7355, 15, 5, 25);
        makeBox(2, 10, 14, 0x8B7355, 21, 5, 15);
        // Inner gate passage in south wall
        makeBox(6, 7, 2, 0x6b5a3a, 0, 4, 28);

        // Drum towers at wall junctions
        makeCyl(4, 4, 12, 10, 0x8B7355, -20, 6, -22);
        makeCyl(4, 4, 12, 10, 0x8B7355, 20, 6, -22);
        makeCyl(4, 4, 12, 10, 0x8B7355, -20, 6, 22);
        makeCyl(4, 4, 12, 10, 0x8B7355, 20, 6, 22);
        // Drum tower caps
        makeCone(4.5, 5, 10, 0x7a6445, -20, 14, -22);
        makeCone(4.5, 5, 10, 0x7a6445, 20, 14, -22);
        makeCone(4.5, 5, 10, 0x7a6445, -20, 14, 22);
        makeCone(4.5, 5, 10, 0x7a6445, 20, 14, 22);
        // Wall walk merlons on north curtain
        makeBox(2, 3, 2, 0x8B7355, -12, 11, -28);
        makeBox(2, 3, 2, 0x8B7355, -6, 11, -28);
        makeBox(2, 3, 2, 0x8B7355, 0, 11, -28);
        makeBox(2, 3, 2, 0x8B7355, 6, 11, -28);
        makeBox(2, 3, 2, 0x8B7355, 12, 11, -28);
    }

    function buildOuterEnclosure() {
        // Outer curtain wall ring
        makeBox(90, 7, 2, 0x8B7355, 0, 3.5, -58);
        makeBox(90, 7, 2, 0x8B7355, 0, 3.5, 58);
        makeBox(2, 7, 80, 0x8B7355, 48, 3.5, 0);
        makeBox(2, 7, 80, 0x8B7355, -48, 3.5, 0);
        // Outer wall corner towers
        makeCyl(5, 5, 10, 8, 0x8B7355, 47, 5, -57);
        makeCyl(5, 5, 10, 8, 0x8B7355, -47, 5, -57);
        makeCyl(5, 5, 10, 8, 0x8B7355, 47, 5, 57);
        makeCyl(5, 5, 10, 8, 0x8B7355, -47, 5, 57);
        makeCone(5.5, 4, 8, 0x7a6445, 47, 12, -57);
        makeCone(5.5, 4, 8, 0x7a6445, -47, 12, -57);
        makeCone(5.5, 4, 8, 0x7a6445, 47, 12, 57);
        makeCone(5.5, 4, 8, 0x7a6445, -47, 12, 57);
        // Outer gatehouse (east side)
        makeBox(8, 10, 6, 0x8B7355, 48, 5, 0);
        makeBox(4, 8, 6, 0x1a120a, 48, 4, 0);
    }

    function buildDomesticRanges() {
        // South domestic range along south outer wall - multiple rooms/buildings
        makeBox(20, 8, 8, 0x9c8465, -20, 4, 52);
        makeBox(16, 6, 8, 0x8B7355, 5, 3, 52);
        makeBox(12, 7, 8, 0x9c8465, 28, 3.5, 52);
        // Roofs on domestic ranges
        makeCone(14, 5, 4, 0x6b5a3a, -20, 10, 52);
        makeCone(10, 4, 4, 0x6b5a3a, 5, 9, 52);
        makeCone(9, 4, 4, 0x6b5a3a, 28, 9, 52);
        // Windows in south range
        makeBox(2, 2, 0.5, 0x2a2018, -24, 5, 49);
        makeBox(2, 2, 0.5, 0x2a2018, -18, 5, 49);
        makeBox(2, 2, 0.5, 0x2a2018, 5, 4, 49);
        makeBox(2, 2, 0.5, 0x2a2018, 28, 4, 49);
        // East range (royal apartments - Mary Queen of Scots)
        makeBox(8, 9, 18, 0x9c8465, 42, 4.5, -20);
        // Royal apartment marker - ornate window hood mould
        makeBox(4, 1, 0.5, 0xD4AF37, 42, 10, -11);
        makeBox(5, 3, 0.5, 0x2a2018, 42, 9, -11);
    }

    function buildFishpond() {
        // Rectangular fishpond - unusual historical survivor
        makeBox(22, 1, 14, 0x006994, -10, 0.5, -45);
        // Pond edging/walls
        makeBox(24, 2, 1, 0x8B7355, -10, 1, -52.5);
        makeBox(24, 2, 1, 0x8B7355, -10, 1, -37.5);
        makeBox(1, 2, 14, 0x8B7355, -21.5, 1, -45);
        makeBox(1, 2, 14, 0x8B7355, 1.5, 1, -45);
        // Water shimmer patches (lighter blue)
        makeBox(8, 0.3, 5, 0x1a90cc, -14, 1.2, -43);
        makeBox(6, 0.3, 4, 0x0077aa, -6, 1.2, -47);
    }

    function buildWoodland() {
        // Ancient woodland surrounding castle
        // South woodland
        makeCyl(0.4, 0.6, 12, 6, 0x3d3020, -55, 6, 40);
        makeSphere(6, 7, 6, 0x3d6b30, -55, 14, 40);
        makeCyl(0.4, 0.6, 10, 6, 0x3d3020, -62, 5, 55);
        makeSphere(5, 7, 6, 0x2d5a20, -62, 13, 55);
        makeCyl(0.5, 0.7, 14, 6, 0x3d3020, -45, 7, 65);
        makeSphere(7, 7, 6, 0x3d6b30, -45, 16, 65);
        makeCyl(0.4, 0.5, 11, 6, 0x3d3020, 50, 5.5, 65);
        makeSphere(5, 7, 6, 0x2d5a20, 50, 13, 65);
        makeCyl(0.5, 0.6, 13, 6, 0x3d3020, 60, 6.5, 50);
        makeSphere(6, 7, 6, 0x3d6b30, 60, 15, 50);
        // North woodland
        makeCyl(0.4, 0.6, 12, 6, 0x3d3020, -60, 6, -50);
        makeSphere(6, 7, 6, 0x3d6b30, -60, 14, -50);
        makeCyl(0.5, 0.7, 11, 6, 0x3d3020, 55, 5.5, -60);
        makeSphere(5, 7, 6, 0x2d5a20, 55, 13, -60);
        // West woodland belt
        makeCyl(0.4, 0.6, 10, 6, 0x3d3020, -65, 5, -10);
        makeSphere(5, 7, 6, 0x3d6b30, -65, 13, -10);
        makeCyl(0.4, 0.6, 13, 6, 0x3d3020, -70, 6.5, 10);
        makeSphere(6, 7, 6, 0x2d5a20, -70, 15, 10);
    }

    function buildEdinburghSkyline() {
        // Edinburgh Castle in distance (west/northwest)
        // Castle rock silhouette
        makeBox(30, 12, 20, 0x888888, -200, 6, -80);
        // Half Moon Battery
        makeCyl(8, 10, 18, 8, 0x888888, -200, 9, -80);
        // Castle buildings on rock
        makeBox(12, 16, 10, 0x999999, -196, 8, -85);
        makeBox(8, 20, 8, 0x888888, -202, 10, -82);
        // St Margaret's Chapel (tiny building at top)
        makeBox(4, 6, 4, 0xaaaaaa, -200, 22, -80);
        makeCone(3, 4, 4, 0x777777, -200, 27, -80);
        // Castle esplanade wall
        makeBox(20, 4, 2, 0x888888, -192, 2, -75);

        // Arthur's Seat - extinct volcano hill
        makeSphere(40, 8, 6, 0x5a7040, 150, -8, -180);
        // Lion's Head peak
        makeSphere(20, 8, 6, 0x4a6030, 130, 8, -170);
        makeCone(10, 18, 8, 0x4a5a30, 130, 17, -170);
        // Salisbury Crags ridge
        makeBox(60, 10, 8, 0x6a7050, 155, 2, -160);
    }

    function buildCraigmillarVillage() {
        // Village buildings south and east of castle
        // Terraced houses
        makeBox(10, 6, 7, 0xF5F0E8, 80, 3, 30);
        makeBox(10, 6, 7, 0xF5F0E8, 92, 3, 30);
        makeBox(10, 6, 7, 0xEDEAE0, 104, 3, 30);
        makeBox(10, 6, 7, 0xF5F0E8, 116, 3, 30);
        // Roof ridges
        makeCone(7, 4, 4, 0xCD5C5C, 80, 8, 30);
        makeCone(7, 4, 4, 0xBB4040, 92, 8, 30);
        makeCone(7, 4, 4, 0xCD5C5C, 104, 8, 30);
        makeCone(7, 4, 4, 0xBB4040, 116, 8, 30);
        // Village houses east
        makeBox(8, 5, 6, 0xF5F0E8, 90, 2.5, 55);
        makeBox(8, 5, 6, 0xF0EBE0, 102, 2.5, 55);
        makeCone(5, 3, 4, 0xCD5C5C, 90, 7, 55);
        makeCone(5, 3, 4, 0xBB4040, 102, 7, 55);
        // Farm buildings south
        makeBox(14, 5, 10, 0xD8D3C8, 70, 2.5, 75);
        makeBox(12, 4, 8, 0xD0CBBf, 90, 2, 78);
        makeCone(9, 3, 4, 0xCC8844, 70, 7, 75);
        // Local church / community building
        makeBox(10, 8, 8, 0xE8E4DA, 110, 4, 70);
        makeCone(6, 12, 4, 0x888888, 110, 16, 70);
    }

    function buildInterpretationBoards() {
        // Modern visitor interpretation panels scattered around site
        // Near entrance
        makeBox(3, 2.5, 0.2, 0xD3D3D3, -35, 1.25, 25);
        makeBox(0.2, 2.5, 0.2, 0x888888, -35, 1.25, 25.3);
        // Near fishpond
        makeBox(3, 2.5, 0.2, 0xD3D3D3, -5, 1.25, -52);
        makeBox(0.2, 2.5, 0.2, 0x888888, -5, 1.25, -51.7);
        // By tower
        makeBox(3, 2.5, 0.2, 0xD3D3D3, -25, 1.25, 0);
        makeBox(0.2, 2.5, 0.2, 0x888888, -24.7, 1.25, 0);
        // Royal apartment panel
        makeBox(3, 2.5, 0.2, 0xD3D3D3, 40, 1.25, -5);
        makeBox(0.2, 2.5, 0.2, 0x888888, 40.3, 1.25, -5);
        // By outer gate
        makeBox(3, 2.5, 0.2, 0xD3D3D3, 46, 1.25, 15);
        makeBox(0.2, 2.5, 0.2, 0x888888, 46.3, 1.25, 15);
    }

    function buildGroundAndPaths() {
        // Castle courtyard ground - inner
        makeBox(40, 0.5, 52, 0x9c8465, 0, 0.25, 0);
        // Outer enclosure ground
        makeBox(92, 0.5, 112, 0x7a7060, 0, 0.1, 0);
        // Grassy approaches
        makeBox(200, 0.5, 200, 0x5a7040, 0, -0.3, 0);
        // Stone paths
        makeBox(4, 0.3, 20, 0xb0a890, 0, 0.4, 38);
        makeBox(4, 0.3, 20, 0xb0a890, 0, 0.4, -38);
        makeBox(20, 0.3, 4, 0xb0a890, 30, 0.4, 0);
    }

    function buildStairwellAndInterior() {
        // Turnpike stair in tower corner (spiral stair - approximate with cylinders)
        makeCyl(2, 2, 36, 8, 0x7a6445, 7, 18, 6);
        // Great hall fireplace (south wall of 2nd floor)
        makeBox(5, 4, 1, 0x6b5a3a, -2, 20, -6.8);
        makeBox(3, 2, 0.8, 0x1a0f08, -2, 19, -6.6);
        // Dungeon/pit prison (basement)
        makeBox(6, 4, 6, 0x3a2e20, 8, -2, -3);
        // Well in inner courtyard
        makeCyl(1, 1, 2, 8, 0x8B7355, -5, 1, 12);
        makeCyl(0.1, 0.1, 4, 6, 0x5a3a1a, -5, 3, 12);
        makeBox(4, 0.3, 0.1, 0x5a3a1a, -5, 5, 12);
    }

    function buildDrawbridgeAndGate() {
        // Gatehouse in south inner curtain
        makeBox(10, 12, 6, 0x8B7355, 0, 6, 30);
        // Gate arch
        makeBox(5, 7, 0.5, 0x1a120a, 0, 4.5, 27.5);
        // Drawbridge (lowered)
        makeBox(5, 0.4, 6, 0x6b4a2a, 0, 0.2, 33);
        // Portcullis slot marks
        makeBox(0.4, 7, 0.4, 0x2a1a0a, -2.2, 4.5, 27.4);
        makeBox(0.4, 7, 0.4, 0x2a1a0a, 2.2, 4.5, 27.4);
    }

    function build() {
        buildGroundAndPaths();
        buildBasaltRock();
        buildPrestonTower();
        buildInnerCurtainWall();
        buildOuterEnclosure();
        buildDomesticRanges();
        buildFishpond();
        buildWoodland();
        buildEdinburghSkyline();
        buildCraigmillarVillage();
        buildInterpretationBoards();
        buildStairwellAndInterior();
        buildDrawbridgeAndGate();
    }

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
        if (camera) {
            camera.position.set(CX - 60, CY + 20, CZ + 60);
            camera.lookAt(CX, CY + 15, CZ);
        }
    }

    function update(delta) {
        // Static environment — no per-frame logic needed
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
