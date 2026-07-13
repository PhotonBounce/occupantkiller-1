window.IronbridgeGorge = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecyl(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return addMesh(mesh);
    }

    function build() {
        var cx = 21440;

        // -------------------------------------------------------
        // GROUND BASE - gorge floor
        // -------------------------------------------------------
        makebox(600, 4, 300, 0x5C4A2A, cx, -2, 0);

        // -------------------------------------------------------
        // RIVER SEVERN - wide steel-blue river running through gorge
        // -------------------------------------------------------
        // Main river body
        makebox(600, 1, 60, 0x4682B4, cx, 0.5, 0);
        // River depth variation / shallows
        makebox(580, 0.5, 55, 0x5B92C4, cx, 1.0, 0);
        // River ripple strips
        makebox(500, 0.3, 8, 0x6FA8D6, cx, 1.2, -10);
        makebox(460, 0.3, 6, 0x6FA8D6, cx, 1.2, 8);
        makebox(420, 0.3, 5, 0x6FA8D6, cx, 1.2, -4);

        // -------------------------------------------------------
        // GORGE VALLEY SIDES - steep slopes both banks
        // -------------------------------------------------------
        // North bank embankment
        makebox(620, 80, 120, 0x3A2E1A, cx, 36, -120);
        // South bank embankment
        makebox(620, 80, 120, 0x3A2E1A, cx, 36, 120);
        // North bank upper hillside
        makebox(620, 60, 80, 0x2E2410, cx, 96, -170);
        // South bank upper hillside
        makebox(620, 60, 80, 0x2E2410, cx, 96, 170);

        // -------------------------------------------------------
        // FOREST - dark green trees on both valley sides
        // -------------------------------------------------------
        // North bank forest clusters
        makesphere(18, 7, 6, 0x3A7D44, cx - 120, 58, -105);
        makesphere(15, 7, 6, 0x2E6B38, cx - 60, 55, -110);
        makesphere(20, 7, 6, 0x3A7D44, cx,      62, -108);
        makesphere(16, 7, 6, 0x487D50, cx + 80, 57, -103);
        makesphere(18, 7, 6, 0x3A7D44, cx + 160, 60, -115);
        makesphere(14, 7, 6, 0x2E6B38, cx + 220, 54, -100);
        makesphere(22, 7, 6, 0x3A7D44, cx - 200, 65, -120);
        makesphere(17, 7, 6, 0x487D50, cx - 160, 52, -95);

        // South bank forest clusters
        makesphere(18, 7, 6, 0x3A7D44, cx - 100, 58, 105);
        makesphere(16, 7, 6, 0x2E6B38, cx - 40,  55, 112);
        makesphere(20, 7, 6, 0x3A7D44, cx + 40,  62, 108);
        makesphere(15, 7, 6, 0x487D50, cx + 120, 57, 103);
        makesphere(19, 7, 6, 0x3A7D44, cx + 200, 60, 115);
        makesphere(13, 7, 6, 0x2E6B38, cx - 200, 65, 120);
        makesphere(21, 7, 6, 0x3A7D44, cx - 260, 62, 110);
        makesphere(16, 7, 6, 0x487D50, cx + 270, 55, 105);

        // Upper hillside trees
        makesphere(24, 7, 6, 0x2E6B38, cx - 80,  105, -160);
        makesphere(20, 7, 6, 0x3A7D44, cx + 100, 110, -165);
        makesphere(22, 7, 6, 0x2E6B38, cx + 180, 108, -158);
        makesphere(24, 7, 6, 0x3A7D44, cx - 150, 107, 162);
        makesphere(18, 7, 6, 0x2E6B38, cx + 60,  105, 158);
        makesphere(22, 7, 6, 0x487D50, cx + 240, 110, 167);

        // Tree trunks north bank
        makecyl(1.2, 1.4, 12, 6, 0x5C3D1E, cx - 120, 47, -105);
        makecyl(1.0, 1.2, 10, 6, 0x5C3D1E, cx,       46, -108);
        makecyl(1.4, 1.6, 14, 6, 0x5C3D1E, cx + 160, 48, -115);

        // Tree trunks south bank
        makecyl(1.2, 1.4, 12, 6, 0x5C3D1E, cx - 100, 47, 105);
        makecyl(1.0, 1.2, 10, 6, 0x5C3D1E, cx + 40,  46, 108);
        makecyl(1.4, 1.6, 14, 6, 0x5C3D1E, cx + 200, 48, 115);

        // -------------------------------------------------------
        // IRON BRIDGE (1779) - world's first iron bridge
        // Single cast iron arch spanning River Severn
        // -------------------------------------------------------
        // Bridge deck / roadway
        makebox(80, 2, 8, 0x8B4513, cx, 8, 0);
        // Bridge deck underside beam
        makebox(80, 1.5, 6, 0x6B3410, cx, 6.5, 0);

        // Arch support ribs (approximated with rotated boxes)
        // Left arch rib pair
        var archLeft1 = makebox(44, 2, 2, 0x8B4513, cx - 24, 4, -3);
        archLeft1.rotation.z = Math.PI * 0.18;
        var archLeft2 = makebox(44, 2, 2, 0x8B4513, cx - 24, 4, 3);
        archLeft2.rotation.z = Math.PI * 0.18;
        // Right arch rib pair
        var archRight1 = makebox(44, 2, 2, 0x8B4513, cx + 24, 4, -3);
        archRight1.rotation.z = -Math.PI * 0.18;
        var archRight2 = makebox(44, 2, 2, 0x8B4513, cx + 24, 4, 3);
        archRight2.rotation.z = -Math.PI * 0.18;

        // Arch crown (top of arch)
        makebox(16, 3, 6, 0x7A3C11, cx, 0, 0);

        // Vertical spandrel posts
        makebox(1.5, 6, 6, 0x8B4513, cx - 30, 5, 0);
        makebox(1.5, 8, 6, 0x8B4513, cx - 20, 6, 0);
        makebox(1.5, 9, 6, 0x8B4513, cx - 10, 7, 0);
        makebox(1.5, 9, 6, 0x8B4513, cx + 10, 7, 0);
        makebox(1.5, 8, 6, 0x8B4513, cx + 20, 6, 0);
        makebox(1.5, 6, 6, 0x8B4513, cx + 30, 5, 0);

        // Bridge abutments / piers on each bank
        makebox(12, 14, 14, 0x9B7B5A, cx - 42, 3, 0);
        makebox(12, 14, 14, 0x9B7B5A, cx + 42, 3, 0);

        // Decorative iron railings along bridge
        makebox(78, 3, 0.5, 0x6B3000, cx, 10, -4);
        makebox(78, 3, 0.5, 0x6B3000, cx, 10, 4);

        // -------------------------------------------------------
        // COALBROOKDALE - red brick industrial buildings north bank
        // -------------------------------------------------------
        // Main ironworks building
        makebox(50, 20, 30, 0xC8B89A, cx - 150, 8, -80);
        // Secondary forge building
        makebox(35, 16, 22, 0xBDAA8E, cx - 100, 6, -85);
        // Warehouse
        makebox(40, 18, 25, 0xC2B290, cx - 200, 7, -75);
        // Small outbuilding
        makebox(18, 10, 15, 0xC0AE88, cx - 230, 3, -70);

        // Industrial chimneys
        makecyl(3, 4, 40, 8, 0x8B6F5A, cx - 145, 28, -80);
        makecyl(2.5, 3.5, 35, 8, 0x8B6F5A, cx - 105, 25, -85);
        makecyl(3.5, 4.5, 45, 8, 0x9A7A60, cx - 195, 30, -75);
        // Chimney smoke tops (dark)
        makecyl(4, 3, 4, 8, 0x333333, cx - 145, 50, -80);
        makecyl(3.5, 2.5, 3, 8, 0x333333, cx - 105, 44, -85);
        makecyl(4.5, 3.5, 4, 8, 0x333333, cx - 195, 54, -75);

        // -------------------------------------------------------
        // ABRAHAM DARBY'S BLAST FURNACE - preserved structure
        // -------------------------------------------------------
        // Furnace base structure
        makebox(20, 22, 20, 0x8B4513, cx - 170, 9, -88);
        // Furnace cone/stack
        makecone(8, 18, 8, 0x7A3C11, cx - 170, 26, -88);
        // Furnace mouth opening
        makebox(6, 8, 4, 0x2A1A08, cx - 160, 5, -88);
        // Bellows housing
        makebox(10, 8, 12, 0x9B6B3A, cx - 180, 2, -90);
        // Tapping arch
        makebox(8, 5, 5, 0x6B3410, cx - 162, 4, -84);

        // -------------------------------------------------------
        // MUSEUM OF THE GORGE - large warehouse beside river
        // -------------------------------------------------------
        makebox(60, 22, 35, 0xD4C8A0, cx + 80, 9, -75);
        // Museum roof
        makebox(62, 4, 37, 0xC4B890, cx + 80, 21, -75);
        // Museum windows (dark insets)
        makebox(8, 6, 1, 0x2A2A40, cx + 60, 11, -57);
        makebox(8, 6, 1, 0x2A2A40, cx + 75, 11, -57);
        makebox(8, 6, 1, 0x2A2A40, cx + 90, 11, -57);
        makebox(8, 6, 1, 0x2A2A40, cx + 105, 11, -57);
        // Museum entrance
        makebox(10, 14, 3, 0xC4B890, cx + 80, 5, -57);
        makebox(8, 12, 2, 0x1A1A30, cx + 80, 5, -56);

        // -------------------------------------------------------
        // BLISTS HILL VICTORIAN TOWN - south bank
        // Row of Victorian cottages with cobbled street
        // -------------------------------------------------------
        // Cobbled street
        makebox(80, 1, 12, 0x7A7060, cx + 140, 2.5, 75);
        // Victorian cottages - row of 5
        makebox(14, 14, 12, 0xDEB887, cx + 110, 9, 80);
        makebox(14, 14, 12, 0xD4AC7A, cx + 126, 9, 80);
        makebox(14, 14, 12, 0xDEB887, cx + 142, 9, 80);
        makebox(14, 14, 12, 0xD4AC7A, cx + 158, 9, 80);
        makebox(14, 14, 12, 0xDEB887, cx + 174, 9, 80);
        // Cottage roofs
        makecone(10, 8, 4, 0x8B2020, cx + 110, 20, 80);
        makecone(10, 8, 4, 0x8B2020, cx + 126, 20, 80);
        makecone(10, 8, 4, 0x8B2020, cx + 142, 20, 80);
        makecone(10, 8, 4, 0x8B2020, cx + 158, 20, 80);
        makecone(10, 8, 4, 0x8B2020, cx + 174, 20, 80);
        // Victorian pub / inn
        makebox(20, 16, 14, 0xC8A878, cx + 200, 10, 80);
        // Pub sign post
        makecyl(0.5, 0.5, 10, 6, 0x5C3D1E, cx + 192, 6, 72);

        // -------------------------------------------------------
        // JACKFIELD TILE MUSEUM - red brick Victorian factory
        // -------------------------------------------------------
        makebox(45, 18, 28, 0xCD5C5C, cx + 60, 7, 80);
        // Factory roof sawtooth (north-light roof)
        makebox(47, 3, 30, 0xA84040, cx + 60, 17, 80);
        // Factory chimney
        makecyl(2.5, 3, 36, 8, 0xCD5C5C, cx + 75, 22, 85);
        makecyl(3.5, 2.5, 4, 8, 0x222222, cx + 75, 42, 85);
        // Loading dock
        makebox(14, 8, 10, 0xB85050, cx + 40, 2, 80);
        // Tile display windows
        makebox(6, 5, 1, 0x3A3A5A, cx + 50, 9, 66);
        makebox(6, 5, 1, 0x3A3A5A, cx + 62, 9, 66);
        makebox(6, 5, 1, 0x3A3A5A, cx + 74, 9, 66);

        // -------------------------------------------------------
        // COOLING TOWERS - industrial landmark in distance
        // -------------------------------------------------------
        makecyl(18, 22, 60, 12, 0xAAAAAA, cx - 280, 28, -60);
        makecyl(18, 22, 60, 12, 0xAAAAAA, cx - 240, 28, -60);
        makecyl(18, 22, 60, 12, 0xB8B8B8, cx - 260, 28, -90);
        // Cooling tower tops (open)
        makecyl(20, 16, 8, 12, 0x999999, cx - 280, 60, -60);
        makecyl(20, 16, 8, 12, 0x999999, cx - 240, 60, -60);
        makecyl(20, 16, 8, 12, 0xA0A0A0, cx - 260, 60, -90);
        // Steam/vapour plumes (light spheres)
        makesphere(14, 7, 6, 0xDDDDDD, cx - 280, 76, -60);
        makesphere(12, 7, 6, 0xE0E0E0, cx - 240, 74, -60);
        makesphere(13, 7, 6, 0xDDDDDD, cx - 260, 76, -90);

        // -------------------------------------------------------
        // TELFORD NEW TOWN - modern grid of buildings on hilltop
        // -------------------------------------------------------
        // Hilltop plateau
        makebox(200, 10, 120, 0xA09070, cx + 280, 84, -80);
        // Modern office blocks
        makebox(28, 30, 20, 0xCCCCCC, cx + 260, 103, -70);
        makebox(24, 25, 18, 0xC8C8C8, cx + 295, 100, -70);
        makebox(30, 35, 22, 0xCCCCCC, cx + 330, 106, -75);
        makebox(22, 20, 16, 0xD0D0D0, cx + 275, 97, -100);
        makebox(26, 28, 20, 0xC4C4C4, cx + 315, 102, -100);
        // Shopping centre
        makebox(60, 18, 40, 0xC8C8C8, cx + 290, 92, -130);
        // Roads between buildings
        makebox(150, 0.5, 8, 0x555555, cx + 290, 80, -78);
        makebox(8, 0.5, 100, 0x555555, cx + 290, 80, -100);

        // -------------------------------------------------------
        // RIVER BANK PATHS & WALKWAYS
        // -------------------------------------------------------
        // North bank riverside path
        makebox(200, 1, 8, 0x9B8B70, cx, 2, -35);
        // South bank riverside path
        makebox(200, 1, 8, 0x9B8B70, cx, 2, 35);
        // Steps down to river north
        makebox(8, 2, 6, 0xA09080, cx - 50, 1, -32);
        makebox(8, 2, 6, 0xA09080, cx - 50, 2, -29);
        makebox(8, 2, 6, 0xA09080, cx - 50, 3, -26);

        // -------------------------------------------------------
        // IRONBRIDGE TOLL HOUSE - small gatehouse at bridge end
        // -------------------------------------------------------
        makebox(10, 12, 10, 0xC4A882, cx - 46, 8, -12);
        makecone(6, 6, 4, 0x8B2020, cx - 46, 17, -12);

        // -------------------------------------------------------
        // WHARFAGE BUILDINGS - riverside warehouses
        // -------------------------------------------------------
        makebox(30, 14, 18, 0xBFAA88, cx + 20, 5, -60);
        makebox(25, 12, 16, 0xC2AC8A, cx + 55, 4, -62);
        // Wharfage jetty/dock
        makebox(20, 1.5, 12, 0x5C3D1E, cx + 10, 2, -42);
        makebox(1.5, 8, 1.5, 0x5C3D1E, cx + 2,  4, -40);
        makebox(1.5, 8, 1.5, 0x5C3D1E, cx + 18, 4, -40);

        // -------------------------------------------------------
        // BEDLAM FURNACES - riverside ruins
        // -------------------------------------------------------
        makebox(16, 10, 12, 0x7A6040, cx + 220, 3, -68);
        makebox(12, 14, 10, 0x7A6040, cx + 238, 5, -68);
        makecyl(3, 4, 20, 8, 0x7A6040, cx + 230, 13, -65);

        // -------------------------------------------------------
        // SCENIC VIEWPOINT - hilltop lookout south bank
        // -------------------------------------------------------
        makebox(20, 6, 20, 0x8B7B60, cx, 70, 140);
        // Viewpoint railing
        makebox(20, 2, 1, 0x5C4A30, cx, 74, 130);
        makebox(1, 4, 20, 0x5C4A30, cx - 10, 72, 140);
        makebox(1, 4, 20, 0x5C4A30, cx + 10, 72, 140);
        // Viewing telescope
        makecyl(1, 0.8, 6, 8, 0x4A4A4A, cx, 76, 132);
        makecyl(1.5, 1, 4, 8, 0x5A5A5A, cx, 73, 133);

        // -------------------------------------------------------
        // CHURCH STEEPLE - St Luke's visible on hillside
        // -------------------------------------------------------
        makebox(10, 22, 10, 0xC8BAA0, cx - 80, 11, -90);
        makecone(5, 14, 4, 0x888880, cx - 80, 26, -90);
        // Church nave
        makebox(18, 14, 12, 0xC4B69C, cx - 86, 9, -94);

        // -------------------------------------------------------
        // RIVER ROCKS & SMALL ISLANDS
        // -------------------------------------------------------
        makesphere(4, 6, 5, 0x8B8B7A, cx - 20, 0, 5);
        makesphere(3, 6, 5, 0x9A9A88, cx + 30, 0, -6);
        makesphere(5, 6, 5, 0x8B8B7A, cx - 60, 0, 8);
        makesphere(2.5, 6, 5, 0x9A9A88, cx + 80, 0, -3);
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
