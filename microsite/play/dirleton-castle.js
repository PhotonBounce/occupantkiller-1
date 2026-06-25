window.DirletonCastle = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];

    var OX = 20600;
    var OY = 0;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function addMesh(mesh) {
        scene.add(mesh);
        objects.push(mesh);
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeSphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, OY + y, OZ + z);
        addMesh(mesh);
        return mesh;
    }

    function build() {
        buildGround();
        buildMound();
        buildCastleWalls();
        buildDeVauxTowers();
        buildEasternRange();
        buildLodgingRange();
        buildPleasance();
        buildHerborBorder();
        buildVillageGreen();
        buildKirkDirleton();
        buildCottages();
        buildCastleInn();
        buildBeehiveDoocot();
        buildFarmland();
        buildNorthSea();
        buildTrees();
        buildBattlements();
    }

    function buildGround() {
        // Main ground plane approximated as a large flat box
        makeBox(800, 2, 800, 0x5a8a40, 0, -1, 0);
    }

    function buildMound() {
        // Natural rock mound the castle sits on — stepped cylinders
        makeCyl(28, 38, 8, 12, 0x5a7a30, 0, 4, 0);
        makeCyl(22, 28, 6, 12, 0x5a7a30, 0, 10, 0);
        makeCyl(16, 22, 5, 10, 0x5a7a30, 0, 15, 0);
        // Rocky outcrops
        makeBox(10, 3, 6, 0x6b6b5a, -18, 3, 8);
        makeBox(8, 2, 5, 0x6b6b5a, 20, 3, -12);
    }

    function buildCastleWalls() {
        // Curtain walls connecting the towers — castle colour 0x8B7355
        // South wall
        makeBox(44, 10, 2.5, 0x8B7355, 0, 22, -14);
        // North wall
        makeBox(44, 10, 2.5, 0x8B7355, 0, 22, 14);
        // West wall
        makeBox(2.5, 10, 28, 0x8B7355, -22, 22, 0);
        // East wall (partial — eastern range fills much of this)
        makeBox(2.5, 10, 12, 0x8B7355, 22, 22, -6);
        makeBox(2.5, 10, 6, 0x8B7355, 22, 22, 11);
        // Wall-walk parapet on south wall
        makeBox(44, 1.5, 1, 0x8B7355, 0, 27.5, -13.3);
        // Wall-walk parapet on north wall
        makeBox(44, 1.5, 1, 0x8B7355, 0, 27.5, 13.3);
        // Wall-walk parapet on west wall
        makeBox(1, 1.5, 28, 0x8B7355, -21.8, 27.5, 0);
        // Gatehouse entry passage (box gap implied by thicker box)
        makeBox(8, 12, 5, 0x8B7355, 0, 22, -14);
    }

    function buildDeVauxTowers() {
        // Three round De Vaux towers clustered together, 13th century
        // North-west tower
        makeCyl(6, 7, 20, 12, 0x8B7355, -16, 27, 10);
        makeCone(7, 6, 12, 0x5a5a4a, -16, 40, 10);
        // Cap details — small merlon ring
        makeCyl(7.2, 7.2, 1.5, 12, 0x7a6545, -16, 37, 10);

        // South-west tower
        makeCyl(6, 7, 20, 12, 0x8B7355, -16, 27, -10);
        makeCone(7, 6, 12, 0x5a5a4a, -16, 40, -10);
        makeCyl(7.2, 7.2, 1.5, 12, 0x7a6545, -16, 37, -10);

        // Keep tower (central, tallest) — main De Vaux keep
        makeCyl(8, 9, 26, 12, 0x8B7355, -10, 30, 0);
        makeCone(9, 7, 12, 0x4a4a3a, -10, 46, 0);
        makeCyl(9.3, 9.3, 2, 12, 0x7a6545, -10, 43, 0);

        // Connecting spine walls between clustered towers
        makeBox(8, 14, 2.5, 0x8B7355, -13, 24, 5);
        makeBox(8, 14, 2.5, 0x8B7355, -13, 24, -5);
        makeBox(2.5, 14, 10, 0x8B7355, -22, 24, 0);
    }

    function buildEasternRange() {
        // 14th-century eastern range — rectangular block
        makeBox(16, 14, 20, 0x8B7355, 14, 24, 0);
        // Eastern range roof
        makeBox(17, 2, 21, 0x5a5a4a, 14, 31.5, 0);
        // Arrow-loop windows suggested by slight box protrusions
        makeBox(0.5, 1.5, 0.8, 0x3a3a2a, 22.3, 26, -5);
        makeBox(0.5, 1.5, 0.8, 0x3a3a2a, 22.3, 26, 5);
        makeBox(0.5, 1.5, 0.8, 0x3a3a2a, 22.3, 30, 0);
        // Stair turret on eastern range
        makeCyl(2.5, 3, 16, 8, 0x8B7355, 22, 25, -8);
        makeCone(3, 4, 8, 0x5a5a4a, 22, 34, -8);
    }

    function buildLodgingRange() {
        // 16th-century lodging range — more refined, slightly south
        makeBox(18, 12, 10, 0x9a8465, 4, 22, -20);
        // Crow-stepped gable ends (approximated with stepped boxes)
        makeBox(2, 4, 10, 0x9a8465, -5, 29, -20);
        makeBox(1.5, 3, 10, 0x9a8465, -5.8, 32.5, -20);
        makeBox(2, 4, 10, 0x9a8465, 13, 29, -20);
        makeBox(1.5, 3, 10, 0x9a8465, 13.8, 32.5, -20);
        // Lodging range windows (decorative box panels)
        makeBox(1.5, 2, 0.4, 0x7a6040, 0, 24, -15.3);
        makeBox(1.5, 2, 0.4, 0x7a6040, 6, 24, -15.3);
        makeBox(1.5, 2, 0.4, 0x7a6040, 12, 24, -15.3);
        // Lodging range roof
        makeBox(19, 2, 11, 0x5a5a4a, 4, 28.5, -20);
    }

    function buildPleasance() {
        // Ornate garden within castle walls — the Pleasance
        // Garden ground level
        makeBox(20, 0.5, 12, 0x3a6020, 8, 17.5, 4);
        // Formal garden paths (pale stone boxes)
        makeBox(20, 0.6, 1, 0xC8B89A, 8, 17.7, 4);
        makeBox(1, 0.6, 12, 0xC8B89A, 8, 17.7, 4);
        // Flower beds — coloured low boxes
        makeBox(4, 0.8, 3, 0x8B3a8B, 4, 17.7, 2);
        makeBox(4, 0.8, 3, 0xCC4444, 10, 17.7, 2);
        makeBox(4, 0.8, 3, 0xddaa00, 4, 17.7, 7);
        makeBox(4, 0.8, 3, 0xffffff, 10, 17.7, 7);
        // Garden wall / low box hedging
        makeBox(20, 2, 0.5, 0x5a7a30, 8, 18.5, -2);
        makeBox(0.5, 2, 12, 0x5a7a30, -2, 18.5, 4);
    }

    function buildHerborBorder() {
        // World's longest herbaceous border — long strips beside castle
        // North border strip
        makeBox(80, 1, 4, 0x3a6020, 0, 17.5, 30);
        makeBox(80, 1.5, 1, 0xCC4444, 0, 18.3, 28.5);
        makeBox(80, 1.5, 1, 0xddaa00, 0, 18.3, 29.5);
        makeBox(80, 1.5, 1, 0x8B3a8B, 0, 18.3, 30.5);
        makeBox(80, 1.5, 1, 0xff88aa, 0, 18.3, 31.5);
        makeBox(80, 1.5, 1, 0xffffff, 0, 18.3, 32.2);
        // South border strip
        makeBox(80, 1, 4, 0x3a6020, 0, 17.5, -30);
        makeBox(80, 1.5, 1, 0xCC4444, 0, 18.3, -28.5);
        makeBox(80, 1.5, 1, 0xddaa00, 0, 18.3, -29.5);
        makeBox(80, 1.5, 1, 0x8B3a8B, 0, 18.3, -30.5);
        makeBox(80, 1.5, 1, 0xff88aa, 0, 18.3, -31.5);
        makeBox(80, 1.5, 1, 0xffffff, 0, 18.3, -32.2);
        // Border backing wall
        makeBox(80, 3, 0.6, 0xC8B89A, 0, 19, 34);
        makeBox(80, 3, 0.6, 0xC8B89A, 0, 19, -34);
    }

    function buildVillageGreen() {
        // Large open village green — flat green box
        makeBox(120, 0.5, 90, 0x4a7c3f, 90, 0.2, 0);
        // Central feature / war memorial base
        makeBox(3, 1, 3, 0xC8B89A, 90, 0.9, 0);
        makeCyl(0.4, 0.4, 8, 8, 0xC8B89A, 90, 5, 0);
        // Green perimeter low stone wall
        makeBox(120, 1.2, 0.6, 0xaaaaaa, 90, 0.8, -45.3);
        makeBox(120, 1.2, 0.6, 0xaaaaaa, 90, 0.8, 45.3);
        makeBox(0.6, 1.2, 90, 0xaaaaaa, 29.7, 0.8, 0);
        makeBox(0.6, 1.2, 90, 0xaaaaaa, 150.3, 0.8, 0);
    }

    function buildKirkDirleton() {
        // Kirk of Dirleton — Church of Scotland, medieval, square tower
        // Main nave
        makeBox(12, 9, 20, 0xC8B89A, 60, 5.5, -55);
        // Chancel
        makeBox(7, 8, 8, 0xC8B89A, 60, 5, -68);
        // Square tower
        makeBox(7, 20, 7, 0xC8B89A, 55, 11, -48);
        // Tower cap / crenellations suggested by stepped box
        makeBox(8, 2, 8, 0xaaaaaa, 55, 21.5, -48);
        // Nave roof (pitched — two slanted boxes)
        makeBox(13, 2, 21, 0x5a5a5a, 60, 10, -55);
        // Chancel roof
        makeBox(8, 2, 9, 0x5a5a5a, 60, 9.5, -68);
        // Arched doorway (dark recess box)
        makeBox(2.5, 4, 0.5, 0x3a3020, 55, 4, -44.8);
        // Churchyard wall
        makeBox(40, 1.5, 0.5, 0xaaaaaa, 60, 0.75, -44);
        makeBox(0.5, 1.5, 35, 0xaaaaaa, 40, 0.75, -58);
        makeBox(0.5, 1.5, 35, 0xaaaaaa, 80, 0.75, -58);
        // Gravestones — thin tall boxes
        makeBox(0.3, 2, 1, 0x999999, 55, 1.5, -52);
        makeBox(0.3, 2, 1, 0x999999, 58, 1.5, -50);
        makeBox(0.3, 2, 1, 0x999999, 52, 1.5, -55);
        makeBox(0.3, 2, 1, 0x999999, 65, 1.5, -53);
    }

    function buildCottages() {
        // Estate cottages around the village green — single-storey, 0xF5F0E8
        // North side of green
        makeCottage(110, 0, -52, 0);
        makeCottage(130, 0, -52, 0);
        makeCottage(150, 0, -52, 0);
        // South side of green
        makeCottage(110, 0, 52, 0);
        makeCottage(130, 0, 52, 0);
        makeCottage(150, 0, 52, 0);
        // West side
        makeCottage(35, 0, -20, 1);
        makeCottage(35, 0, 20, 1);
    }

    function makeCottage(x, y, z, side) {
        // Walls
        makeBox(10, 5, 8, 0xF5F0E8, x, y + 2.5, z);
        // Roof — pitched approximation using two slanted/rotated boxes
        makeBox(11, 1.5, 9, 0x7a5a3a, x, y + 6.2, z);
        // Chimney
        makeCyl(0.5, 0.6, 3, 6, 0x8B7355, x + 3, y + 8, z);
        // Door
        makeBox(1.2, 2.5, 0.4, 0x5a3a1a, x, y + 1.3, z - 4.3);
        // Windows
        makeBox(1.5, 1.2, 0.4, 0x88bbcc, x - 3, y + 3, z - 4.3);
        makeBox(1.5, 1.2, 0.4, 0x88bbcc, x + 3, y + 3, z - 4.3);
    }

    function buildCastleInn() {
        // Castle Inn — old pub on village green, 0xCD5C5C
        // Main building
        makeBox(16, 7, 12, 0xCD5C5C, 100, 4.5, 50);
        // Roof
        makeBox(17, 2, 13, 0x6a3a2a, 100, 8.5, 50);
        // Chimneys
        makeCyl(0.6, 0.7, 4, 6, 0x8B7355, 106, 11, 48);
        makeCyl(0.6, 0.7, 4, 6, 0x8B7355, 94, 11, 48);
        // Sign post
        makeCyl(0.2, 0.2, 6, 6, 0x5a3a1a, 108, 4, 44.5);
        makeBox(3, 1.5, 0.2, 0xddbb44, 108, 7.5, 44.5);
        // Windows
        makeBox(2, 1.8, 0.4, 0x88bbcc, 94, 5, 44.3);
        makeBox(2, 1.8, 0.4, 0x88bbcc, 100, 5, 44.3);
        makeBox(2, 1.8, 0.4, 0x88bbcc, 106, 5, 44.3);
        // Door
        makeBox(2, 3.5, 0.4, 0x5a3a1a, 100, 2.7, 44.3);
        // Beer garden low wall
        makeBox(20, 1, 0.4, 0xaaaaaa, 100, 0.7, 38);
        makeBox(0.4, 1, 16, 0xaaaaaa, 90, 0.7, 44);
    }

    function buildBeehiveDoocot() {
        // Beehive doocot — large circular corbelled stone dovecot
        // Base cylinder
        makeCyl(4, 5, 8, 16, 0xC8B89A, 70, 5, 60);
        // Corbelled beehive dome — stacked decreasing cylinders
        makeCyl(3.8, 4, 1.5, 16, 0xC8B89A, 70, 9.5, 60);
        makeCyl(3.2, 3.8, 1.5, 16, 0xC8B89A, 70, 11, 60);
        makeCyl(2.5, 3.2, 1.5, 14, 0xC8B89A, 70, 12.5, 60);
        makeCyl(1.8, 2.5, 1.5, 12, 0xC8B89A, 70, 14, 60);
        makeCyl(1.0, 1.8, 1.5, 10, 0xC8B89A, 70, 15.5, 60);
        makeCyl(0.4, 1.0, 1.0, 8, 0xC8B89A, 70, 17, 60);
        // Cap / finial
        makeSphere(0.5, 6, 6, 0xaaaaaa, 70, 17.8, 60);
        // Entry door
        makeBox(1.5, 2.5, 0.4, 0x5a3a1a, 70, 2, 55.3);
    }

    function buildFarmland() {
        // East Lothian arable fields surrounding village
        // North fields
        makeBox(300, 0.5, 80, 0x5a8a40, 90, 0.1, -130);
        makeBox(300, 0.5, 80, 0x6a9a30, 90, 0.1, -220);
        // South fields
        makeBox(300, 0.5, 80, 0x5a8a40, 90, 0.1, 130);
        makeBox(300, 0.5, 80, 0x4a7a20, 90, 0.1, 220);
        // East fields
        makeBox(100, 0.5, 200, 0x5a8a40, 250, 0.1, 0);
        // West fields
        makeBox(100, 0.5, 200, 0x6a9a30, -80, 0.1, 0);
        // Field boundary hedgerows — low dark green boxes
        makeBox(300, 2, 1.5, 0x2a5010, 90, 1.5, -90);
        makeBox(300, 2, 1.5, 0x2a5010, 90, 1.5, 90);
        makeBox(1.5, 2, 200, 0x2a5010, 200, 1.5, 0);
        makeBox(1.5, 2, 200, 0x2a5010, -20, 1.5, 0);
    }

    function buildNorthSea() {
        // North Sea glimpsed to the north — large flat box, 0x005577
        makeBox(600, 0.8, 150, 0x005577, 90, -0.2, -320);
        // Coastal strip — sandy beach
        makeBox(600, 0.6, 20, 0xddcc88, 90, 0.1, -255);
        // Sea horizon suggestion — slightly lighter strip
        makeBox(600, 2, 5, 0x0077aa, 90, 1.2, -390);
    }

    function buildTrees() {
        // Mature trees on village green and around castle
        buildTree(80, 0, 30);
        buildTree(100, 0, 35);
        buildTree(120, 0, -30);
        buildTree(80, 0, -35);
        buildTree(95, 0, 10);
        buildTree(115, 0, -15);
        // Trees along herbaceous border
        buildTree(-30, 0, 40);
        buildTree(-50, 0, 40);
        buildTree(-30, 0, -40);
        buildTree(-50, 0, -40);
        // Trees near church
        buildTree(50, 0, -60);
        buildTree(72, 0, -65);
    }

    function buildTree(x, y, z) {
        // Trunk
        makeCyl(0.6, 0.8, 6, 7, 0x5a3a1a, x, y + 3, z);
        // Canopy — sphere
        makeSphere(4, 8, 8, 0x2d5a1a, x, y + 9, z);
    }

    function buildBattlements() {
        // Merlons along south curtain wall top
        makeBox(2, 2, 1, 0x8B7355, -18, 28.5, -14);
        makeBox(2, 2, 1, 0x8B7355, -10, 28.5, -14);
        makeBox(2, 2, 1, 0x8B7355, -2, 28.5, -14);
        makeBox(2, 2, 1, 0x8B7355, 6, 28.5, -14);
        makeBox(2, 2, 1, 0x8B7355, 14, 28.5, -14);
        // Merlons along north curtain wall top
        makeBox(2, 2, 1, 0x8B7355, -18, 28.5, 14);
        makeBox(2, 2, 1, 0x8B7355, -10, 28.5, 14);
        makeBox(2, 2, 1, 0x8B7355, -2, 28.5, 14);
        makeBox(2, 2, 1, 0x8B7355, 6, 28.5, 14);
        makeBox(2, 2, 1, 0x8B7355, 14, 28.5, 14);
        // Merlons along west wall
        makeBox(1, 2, 2, 0x8B7355, -21.8, 28.5, -10);
        makeBox(1, 2, 2, 0x8B7355, -21.8, 28.5, -2);
        makeBox(1, 2, 2, 0x8B7355, -21.8, 28.5, 6);
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
