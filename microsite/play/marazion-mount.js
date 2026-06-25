window.MarazionMount = (function() {
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

    function makebox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, ws, hs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, ws, hs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 8440;
        var oz = 0;

        // 1. St Michael's Mount — large island mound (in the distance, toward +z)
        makecone(20, 30, 8, 0x888870, ox + 0, 15, oz + 80);
        // Castle on top of mount
        makebox(8, 5, 12, 0x707060, ox + 0, 32.5, oz + 80);

        // 2. Tidal causeway — 8 stone path sections leading from beach toward the Mount
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 14);
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 19);
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 24);
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 29);
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 34);
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 39);
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 44);
        makebox(4, 0.3, 3, 0x998870, ox + 0, 0.15, oz + 49);

        // 3. Marazion beach — pale sand flat stretching along the bay
        makebox(80, 0.5, 20, 0xF5E6B0, ox + 0, -0.25, oz + 0);

        // 4. Town high street buildings — 10 varied commercial buildings
        // Row along main street at z = -18 (north of beach)
        makebox(4, 6, 5, 0xE8D8B0, ox - 30, 3, oz - 18);
        makebox(5, 6, 5, 0xC8A870, ox - 22, 3, oz - 18);
        makebox(6, 6, 5, 0x8B6040, ox - 14, 3, oz - 18);
        makebox(7, 6, 6, 0xE8D8B0, ox - 5, 3, oz - 18);
        makebox(8, 6, 6, 0xC8A870, ox + 5, 3, oz - 18);
        makebox(5, 6, 5, 0x8B6040, ox + 14, 3, oz - 18);
        makebox(6, 6, 6, 0xE8D8B0, ox + 22, 3, oz - 18);
        makebox(4, 6, 5, 0xC8A870, ox + 30, 3, oz - 18);
        makebox(7, 6, 5, 0x8B6040, ox - 38, 3, oz - 18);
        makebox(5, 6, 6, 0xE8D8B0, ox + 38, 3, oz - 18);

        // 5. The Market House — historic octagonal building: 3 cylinder sections stacked
        makecylinder(6, 6, 2, 8, 0xD4C090, ox - 8, 1, oz - 28);
        makecylinder(5, 5, 2, 8, 0xD4C090, ox - 8, 3, oz - 28);
        makecylinder(4, 4, 2, 8, 0xD4C090, ox - 8, 5, oz - 28);
        // Copper roof cone
        makecone(4, 4, 8, 0x228B22, ox - 8, 8, oz - 28);

        // 6. Medieval cross — stone pillar topped with sphere
        makebox(0.5, 4, 0.5, 0x888880, ox + 10, 2, oz - 30);
        makesphere(0.3, 8, 8, 0x888880, ox + 10, 4.3, oz - 30);

        // 7. Beachside cafes — 4 low buildings with parasol canopies
        // Cafe 1
        makebox(6, 4, 3, 0xF5DEB3, ox - 25, 2, oz - 6);
        makecylinder(0.1, 0.1, 3, 6, 0xD2691E, ox - 25, 5, oz - 6);
        makecone(3, 1, 8, 0xFF6633, ox - 25, 6.5, oz - 6);
        // Cafe 2
        makebox(6, 4, 3, 0xF5DEB3, ox - 14, 2, oz - 6);
        makecylinder(0.1, 0.1, 3, 6, 0xD2691E, ox - 14, 5, oz - 6);
        makecone(3, 1, 8, 0xFF9944, ox - 14, 6.5, oz - 6);
        // Cafe 3
        makebox(6, 4, 3, 0xF5DEB3, ox + 14, 2, oz - 6);
        makecylinder(0.1, 0.1, 3, 6, 0xD2691E, ox + 14, 5, oz - 6);
        makecone(3, 1, 8, 0xFF6633, ox + 14, 6.5, oz - 6);
        // Cafe 4
        makebox(6, 4, 3, 0xF5DEB3, ox + 25, 2, oz - 6);
        makecylinder(0.1, 0.1, 3, 6, 0xD2691E, ox + 25, 5, oz - 6);
        makecone(3, 1, 8, 0xFF9944, ox + 25, 6.5, oz - 6);

        // 8. Lifeboat hut — red building with boat launching rails
        makebox(6, 5, 4, 0xCC2222, ox + 40, 2.5, oz - 6);
        // Boat launching rail 1
        makebox(0.2, 0.2, 10, 0x888880, ox + 38.5, 0.4, oz - 1);
        // Boat launching rail 2
        makebox(0.2, 0.2, 10, 0x888880, ox + 41.5, 0.4, oz - 1);

        // 9. Bay surf rollers — 5 foam crest boxes in shallow water
        makebox(8, 0.5, 1, 0xEEEEFF, ox - 20, 0.25, oz + 8);
        makebox(8, 0.5, 1, 0xEEEEFF, ox - 8, 0.25, oz + 10);
        makebox(8, 0.5, 1, 0xEEEEFF, ox + 4, 0.25, oz + 7);
        makebox(8, 0.5, 1, 0xEEEEFF, ox + 16, 0.25, oz + 9);
        makebox(8, 0.5, 1, 0xEEEEFF, ox + 28, 0.25, oz + 8);

        // 10. Tourist info centre — box with display board outside
        makebox(5, 4, 3, 0x4477AA, ox + 20, 2, oz - 28);
        // Display board outside
        makebox(2, 1.5, 0.1, 0xFFFFDD, ox + 18, 2, oz - 26);

        // Extra detail objects to reach 55-65 total count

        // Additional town buildings on back street
        makebox(5, 5, 4, 0xC8A870, ox - 30, 2.5, oz - 28);
        makebox(6, 5, 5, 0xE8D8B0, ox - 20, 2.5, oz - 28);
        makebox(4, 5, 4, 0x8B6040, ox + 30, 2.5, oz - 28);

        // Decorative lampposts on high street
        makebox(0.2, 5, 0.2, 0x444444, ox - 18, 2.5, oz - 14);
        makecone(0.4, 0.5, 6, 0xFFFF88, ox - 18, 5.25, oz - 14);
        makebox(0.2, 5, 0.2, 0x444444, ox + 18, 2.5, oz - 14);
        makecone(0.4, 0.5, 6, 0xFFFF88, ox + 18, 5.25, oz - 14);

        // Harbour wall segments
        makebox(20, 1.5, 1.5, 0x998870, ox + 45, 0.75, oz - 4);
        makebox(1.5, 1.5, 12, 0x998870, ox + 55, 0.75, oz + 4);

        // Beach windbreak posts
        makebox(0.15, 1.5, 0.15, 0x885522, ox - 5, 0.75, oz + 3);
        makebox(0.15, 1.5, 0.15, 0x885522, ox - 3, 0.75, oz + 3);
        makebox(0.15, 1.5, 0.15, 0x885522, ox - 1, 0.75, oz + 3);

        // Seawater boulders on causeway edge
        makebox(1.5, 1, 1.5, 0x776655, ox - 4, 0.5, oz + 20);
        makebox(1.2, 0.8, 1.2, 0x776655, ox + 4, 0.4, oz + 35);

        // Decorative sphere on Market House entrance
        makesphere(0.4, 8, 8, 0xD4C090, ox - 4, 0.4, oz - 26);
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
