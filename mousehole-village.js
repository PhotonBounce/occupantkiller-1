window.MouseholeVillage = (function() {
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

    function makecone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 8400;
        var oz = 0;

        // 1. Stone harbour — two breakwater arms, 3 box sections each
        // West arm
        makebox(6, 2, 2.5, 0x807060, ox - 12, 1, oz - 5);
        makebox(6, 2, 2.5, 0x807060, ox - 6,  1, oz - 5);
        makebox(6, 2, 2.5, 0x807060, ox,      1, oz - 5);
        // East arm
        makebox(6, 2, 2.5, 0x807060, ox - 12, 1, oz + 15);
        makebox(6, 2, 2.5, 0x807060, ox - 6,  1, oz + 15);
        makebox(6, 2, 2.5, 0x807060, ox,      1, oz + 15);

        // 2. Fishing boats — 5 boats, hulls + masts
        var boatcolors = [0x8B4513, 0x22557A, 0xCC3322, 0x8B4513, 0x22557A];
        var boatx = [ox - 8, ox - 5, ox - 2, ox + 1, ox + 4];
        var boatz = [oz + 2, oz + 4, oz + 2, oz + 6, oz + 4];
        for (var b = 0; b < 5; b++) {
            makebox(3, 0.8, 1.5, boatcolors[b], boatx[b], 0.9, boatz[b]);
            makecylinder(0.15, 0.15, 4, 8, 0x5C3A1E, boatx[b], 3, boatz[b]);
        }

        // 3. Fishermen's cottages — 18 houses in 3 rows of 6
        var cottagecolor = 0x9E8E70;
        for (var row = 0; row < 3; row++) {
            for (var col = 0; col < 6; col++) {
                var cx = ox + 4 + col * 3.5;
                var cz = oz - 8 - row * 4.5;
                var cy = 2.5 + row * 0.8;
                makebox(3, 5, 4, cottagecolor, cx, cy, cz);
            }
        }

        // 4. Old harbour pub — larger building with hanging sign
        makebox(8, 6, 5, 0x6B5040, ox - 8, 3, oz + 8);
        makebox(1, 0.1, 0.5, 0x4A3020, ox - 5, 6.5, oz + 6);

        // 5. Christmas light arch — 4 poles with crossbeams
        makecylinder(0.2, 0.2, 8, 8, 0x444444, ox - 14, 4, oz + 1);
        makecylinder(0.2, 0.2, 8, 8, 0x444444, ox - 14, 4, oz + 9);
        makecylinder(0.2, 0.2, 8, 8, 0x444444, ox + 2,  4, oz + 1);
        makecylinder(0.2, 0.2, 8, 8, 0x444444, ox + 2,  4, oz + 9);
        // crossbeams between poles
        makebox(0.3, 0.3, 6, 0xFFDD44, ox - 14, 8, oz + 5);
        makebox(0.3, 0.3, 6, 0xFFDD44, ox + 2,  8, oz + 5);
        makebox(16, 0.3, 0.3, 0xFFDD44, ox - 6, 8, oz + 1);
        makebox(16, 0.3, 0.3, 0xFFDD44, ox - 6, 8, oz + 9);

        // 6. Village chapel
        makebox(7, 5, 8, 0x887060, ox + 22, 2.5, oz - 5);
        makecone(2, 5, 8, 0x665040, ox + 22, 7.5, oz - 5);
        makecylinder(0.1, 0.1, 2, 6, 0x888888, ox + 22, 11, oz - 5);

        // 7. Coastguard station — 2-storey with lookout windows
        makebox(6, 7, 6, 0x778870, ox + 15, 3.5, oz + 10);
        // lookout windows (thin boxes)
        makebox(1, 1, 0.1, 0xAABBCC, ox + 13, 6, oz + 7.1);
        makebox(1, 1, 0.1, 0xAABBCC, ox + 15, 6, oz + 7.1);
        makebox(1, 1, 0.1, 0xAABBCC, ox + 17, 6, oz + 7.1);

        // 8. Sea stack — offshore rock pillar
        makecylinder(2, 2, 12, 8, 0x707060, ox - 22, 6, oz + 5);
        makesphere(2, 8, 6, 0x707060, ox - 22, 12.5, oz + 5);

        // 9. Cliff path steps — 6 ascending stone boxes
        for (var s = 0; s < 6; s++) {
            makebox(1.5, 0.5, 0.8, 0x908070, ox + 8 + s * 1.2, 0.25 + s * 0.8, oz - 15 - s * 0.5);
        }

        // 10. Fish cellar — low storage building with iron door
        makebox(12, 3, 6, 0x888880, ox + 8, 1.5, oz + 20);
        makebox(1.5, 2, 0.2, 0x333333, ox + 4, 1, oz + 17.1);
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
