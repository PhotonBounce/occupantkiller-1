window.IlfordExchange = (function() {
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

    function makelines(geo, color, x, y, z) {
        var mat = new THREE.LineBasicMaterial({ color: color });
        var mesh = new THREE.LineSegments(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 5520;
        var oz = 0;

        // 1. Exchange Ilford Mall — 45x30x12 blue-tinted glass-effect
        makebox(45, 12, 30, 0x445566, ox + 0, 6, oz + 0);
        // Mall entrance canopy
        makebox(15, 3, 4, 0x556677, ox + 0, 1.5, oz + 17);
        // Mall roof detail panels
        makebox(20, 1, 10, 0x88AABB, ox - 10, 12.5, oz + 0);
        makebox(20, 1, 10, 0x88AABB, ox + 10, 12.5, oz + 0);

        // 2. Ilford Elizabeth Line station — 30x15x4 low canopy with glass panels
        makebox(30, 4, 15, 0x667788, ox + 60, 2, oz + 0);
        // Glass roof panels
        makebox(12, 0.5, 6, 0x88AABB, ox + 54, 4.25, oz - 3);
        makebox(12, 0.5, 6, 0x88AABB, ox + 66, 4.25, oz - 3);
        makebox(12, 0.5, 6, 0x88AABB, ox + 54, 4.25, oz + 3);
        makebox(12, 0.5, 6, 0x88AABB, ox + 66, 4.25, oz + 3);
        // Station platform walls
        makebox(30, 3, 1, 0x556677, ox + 60, 1.5, oz + 8);
        makebox(30, 3, 1, 0x556677, ox + 60, 1.5, oz - 8);
        // Station entrance block
        makebox(8, 5, 6, 0x778899, ox + 45, 2.5, oz + 0);

        // 3. 1960s tower blocks — 4 towers, 10x10x28 concrete gray
        makebox(10, 28, 10, 0x888880, ox - 40, 14, oz - 40);
        makebox(10, 28, 10, 0x888880, ox - 55, 14, oz - 40);
        makebox(10, 28, 10, 0x888880, ox - 40, 14, oz + 40);
        makebox(10, 28, 10, 0x888880, ox - 55, 14, oz + 40);
        // Tower base plinths
        makebox(12, 2, 12, 0x777770, ox - 40, 1, oz - 40);
        makebox(12, 2, 12, 0x777770, ox - 55, 1, oz - 40);
        makebox(12, 2, 12, 0x777770, ox - 40, 1, oz + 40);
        makebox(12, 2, 12, 0x777770, ox - 55, 1, oz + 40);

        // 4. High street shops — 2 rows of 12 shops each, 4x6x5
        // Row 1: north side, mixed facades
        var shopcolors1 = [
            0xCC8844, 0x779944, 0x446699, 0xCC8844, 0x779944, 0x446699,
            0xCC8844, 0x779944, 0x446699, 0xCC8844, 0x779944, 0x446699
        ];
        var i;
        for (i = 0; i < 12; i++) {
            makebox(4, 5, 6, shopcolors1[i], ox - 25 + i * 5, 2.5, oz - 30);
        }
        // Row 2: south side
        var shopcolors2 = [
            0x446699, 0xCC8844, 0x779944, 0x446699, 0xCC8844, 0x779944,
            0x446699, 0xCC8844, 0x779944, 0x446699, 0xCC8844, 0x779944
        ];
        for (i = 0; i < 12; i++) {
            makebox(4, 5, 6, shopcolors2[i], ox - 25 + i * 5, 2.5, oz + 30);
        }

        // 5. Kenneth More Theatre — 18x14x7 brick with curved entrance overhang
        makebox(18, 7, 14, 0x885533, ox - 20, 3.5, oz + 60);
        // Entrance overhang approximated as low box
        makebox(8, 1, 4, 0x664422, ox - 20, 7.5, oz + 53);
        // Entrance pillars
        makecylinder(0.3, 0.3, 4, 8, 0x664422, ox - 23, 2, oz + 53);
        makecylinder(0.3, 0.3, 4, 8, 0x664422, ox - 17, 2, oz + 53);

        // 6. Valentine's Park pavilion — 12x8x5 cream + decorative roof
        makebox(12, 5, 8, 0xF0EAD6, ox + 20, 2.5, oz - 60);
        // Decorative roof structure — pitched roof as cone
        makecone(7, 4, 8, 0xE8E0C8, ox + 20, 7, oz - 60);
        // Corner decorative columns
        makecylinder(0.4, 0.4, 5, 8, 0xE0D8C0, ox + 14, 2.5, oz - 64);
        makecylinder(0.4, 0.4, 5, 8, 0xE0D8C0, ox + 26, 2.5, oz - 64);
        makecylinder(0.4, 0.4, 5, 8, 0xE0D8C0, ox + 14, 2.5, oz - 56);
        makecylinder(0.4, 0.4, 5, 8, 0xE0D8C0, ox + 26, 2.5, oz - 56);
        // Pavilion decorative dome
        makesphere(1.5, 8, 6, 0xF0EAD6, ox + 20, 9, oz - 60);

        // 7. Water pumping station — 15x12x8 Victorian brick industrial
        makebox(15, 8, 12, 0x8B4513, ox + 35, 4, oz - 60);
        // Chimney stack
        makecylinder(1.0, 1.2, 12, 8, 0x7A3D10, ox + 42, 6, oz - 60);
        // Arched windows approximated as small boxes
        makebox(2, 3, 0.5, 0x6B3410, ox + 31, 5, oz - 54);
        makebox(2, 3, 0.5, 0x6B3410, ox + 36, 5, oz - 54);
        makebox(2, 3, 0.5, 0x6B3410, ox + 41, 5, oz - 54);
        // Roof parapet
        makebox(17, 1, 14, 0x7A3D10, ox + 35, 8.5, oz - 60);

        // Additional street furniture and detail
        // Bus shelter near high street
        makebox(4, 2.5, 1.5, 0x446699, ox - 10, 1.25, oz - 22);
        // Street lamp posts
        makecylinder(0.1, 0.1, 5, 6, 0x555555, ox - 5, 2.5, oz - 20);
        makecylinder(0.1, 0.1, 5, 6, 0x555555, ox + 5, 2.5, oz - 20);
        makecylinder(0.1, 0.1, 5, 6, 0x555555, ox - 5, 2.5, oz + 20);
        makecylinder(0.1, 0.1, 5, 6, 0x555555, ox + 5, 2.5, oz + 20);
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
