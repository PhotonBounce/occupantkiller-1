window.IlfracombeHarbour = (function() {
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
        var ox = 9400;
        var oz = 0;

        // 1. Verity sculpture — Damien Hirst statue at harbour entrance
        // Pedestal
        makecylinder(1.5, 1.5, 3, 12, 0x888880, ox + 0, 1.5, oz + 5);
        // Torso
        makebox(0.6, 2, 0.4, 0xB87333, ox + 0, 4, oz + 5);
        // Head
        makesphere(0.35, 8, 8, 0xB87333, ox + 0, 5.35, oz + 5);
        // Left arm
        makebox(0.2, 0.8, 0.15, 0xB87333, ox - 0.45, 4.2, oz + 5);
        // Right arm raised
        makebox(0.2, 0.8, 0.15, 0xB87333, ox + 0.45, 4.6, oz + 5);
        // Legs suggestion
        makebox(0.25, 1.5, 0.25, 0xB87333, ox - 0.15, 2.25, oz + 5);
        makebox(0.25, 1.5, 0.25, 0xB87333, ox + 0.15, 2.25, oz + 5);
        // Scales of justice prop (sword/scales above)
        makebox(0.05, 1.2, 0.05, 0xB87333, ox + 0.5, 5.8, oz + 5);
        makebox(0.6, 0.05, 0.05, 0xB87333, ox + 0.5, 6.4, oz + 5);

        // 2. Capstone Hill — rocky granite promontory
        makebox(12, 8, 10, 0x777060, ox + 30, 4, oz - 20);
        makebox(8, 10, 8, 0x777060, ox + 36, 5, oz - 18);
        // Hill cap rocks
        makebox(5, 3, 5, 0x666050, ox + 34, 11, oz - 19);

        // 3. Ilfracombe harbour — Victorian stone quay
        makebox(10, 2, 3, 0x888870, ox - 20, 1, oz + 0);
        makebox(10, 2, 3, 0x888870, ox - 30, 1, oz + 5);
        makebox(10, 2, 3, 0x888870, ox - 25, 1, oz - 5);
        // Lighthouse cylinder
        makecylinder(1, 1, 10, 8, 0xFFFFEE, ox - 35, 5, oz + 10);
        // Lighthouse cone top
        makecone(0.8, 2, 8, 0xCC2222, ox - 35, 11, oz + 10);
        // Lighthouse light sphere
        makesphere(0.4, 6, 6, 0xFFFF88, ox - 35, 11.5, oz + 10);

        // 4. Tunnels beaches — cliff face and tunnel entrances
        // Cliff face
        makebox(20, 10, 8, 0x888870, ox + 60, 5, oz + 30);
        // Three tunnel entrances (dark openings)
        makebox(2, 3, 4, 0x444444, ox + 52, 1.5, oz + 28);
        makebox(2, 3, 4, 0x444444, ox + 60, 1.5, oz + 28);
        makebox(2, 3, 4, 0x444444, ox + 68, 1.5, oz + 28);
        // Tidal pool
        makebox(15, 0.5, 10, 0x44AACC, ox + 60, -0.25, oz + 20);

        // 5. Victorian Hotels — seafront row of 8
        makebox(6, 8, 10, 0xEEDDBB, ox - 10, 4, oz - 15);
        makebox(6, 8, 10, 0xEEDDBB, ox - 17, 4, oz - 15);
        makebox(6, 8, 10, 0xEEDDBB, ox - 24, 4, oz - 15);
        makebox(6, 8, 10, 0xEEDDBB, ox - 31, 4, oz - 15);
        makebox(6, 8, 10, 0xEEDDBB, ox - 38, 4, oz - 15);
        makebox(6, 8, 10, 0xEEDDBB, ox - 45, 4, oz - 15);
        makebox(6, 8, 10, 0xEEDDBB, ox - 52, 4, oz - 15);
        makebox(6, 8, 10, 0xEEDDBB, ox - 59, 4, oz - 15);
        // Iron balconies on hotels
        makebox(4, 0.1, 1, 0x444444, ox - 10, 6, oz - 10.5);
        makebox(4, 0.1, 1, 0x444444, ox - 17, 6, oz - 10.5);
        makebox(4, 0.1, 1, 0x444444, ox - 24, 6, oz - 10.5);
        makebox(4, 0.1, 1, 0x444444, ox - 31, 6, oz - 10.5);
        // Bay windows on hotels (projecting boxes)
        makebox(2, 5, 1, 0xDDCC99, ox - 10, 4, oz - 20.5);
        makebox(2, 5, 1, 0xDDCC99, ox - 17, 4, oz - 20.5);

        // 6. Harbour boats — tourist and fishing
        // Tourist trip boat hull
        makebox(8, 2, 3, 0xEEEECC, ox - 15, 0, oz + 8);
        // Mast
        makecylinder(0.08, 0.08, 5, 6, 0xAA8844, ox - 15, 3.5, oz + 8);
        // Cabin on tourist boat
        makebox(3, 1.5, 2, 0xCCBB88, ox - 14, 1.75, oz + 8);
        // Fishing boat 1
        makebox(5, 1, 2, 0x886644, ox - 5, 0, oz + 12);
        makecylinder(0.06, 0.06, 4, 5, 0x664422, ox - 5, 2.5, oz + 12);
        // Fishing boat 2
        makebox(5, 1, 2, 0x558844, ox + 3, 0, oz + 14);
        makecylinder(0.06, 0.06, 4, 5, 0x446622, ox + 3, 2.5, oz + 14);
        // Fishing boat 3
        makebox(5, 1, 2, 0x774422, ox - 22, 0, oz + 12);
        // Small rowing boat
        makebox(3, 0.8, 1.5, 0x995533, ox - 28, 0, oz + 8);

        // 7. Steep hillside town — 10 cottages terraced up slope
        makebox(3, 4, 4, 0xCC9966, ox - 5, 2, oz - 25);
        makebox(3, 4, 4, 0xBBAA77, ox - 9, 3, oz - 28);
        makebox(3, 4, 4, 0xCC9966, ox - 13, 4, oz - 31);
        makebox(3, 4, 4, 0xBBAA77, ox - 17, 5, oz - 34);
        makebox(3, 4, 4, 0xCC9966, ox - 21, 6, oz - 37);
        makebox(3, 4, 4, 0xBBAA77, ox - 5, 2, oz - 32);
        makebox(3, 4, 4, 0xCC9966, ox - 9, 3, oz - 36);
        makebox(3, 4, 4, 0xBBAA77, ox - 13, 4, oz - 40);
        makebox(3, 4, 4, 0xCC9966, ox - 17, 5, oz - 43);
        makebox(3, 4, 4, 0xBBAA77, ox - 21, 6, oz - 46);

        // 8. Damien Hirst gallery — converted building
        makebox(12, 8, 6, 0xEEEEEE, ox + 15, 4, oz - 20);
        // Abstract sculpture outside: large sphere
        makesphere(2, 10, 10, 0xCCAA00, ox + 10, 2, oz - 25);
        // Abstract box sculpture
        makebox(3, 2, 2, 0x885500, ox + 16, 1, oz - 25);
        // Sign/board
        makebox(4, 2, 0.1, 0xCCCCCC, ox + 15, 5, oz - 17);

        // 9. Sea caves — cliff face with dark openings
        // Limestone cliff
        makebox(25, 15, 6, 0x888870, ox + 80, 7.5, oz + 10);
        // Cave opening 1
        makebox(3, 2, 4, 0x222222, ox + 72, 1, oz + 8);
        // Cave opening 2
        makebox(3, 2, 4, 0x222222, ox + 86, 1.5, oz + 8);

        // 10. Coastal path benches — 4 benches with viewpoints
        makebox(2, 0.3, 0.5, 0x886633, ox + 40, 8.15, oz - 5);
        makebox(2, 0.3, 0.5, 0x886633, ox + 45, 8.15, oz - 8);
        makebox(2, 0.3, 0.5, 0x886633, ox + 50, 8.15, oz - 11);
        makebox(2, 0.3, 0.5, 0x886633, ox + 55, 8.15, oz - 14);
        // Bench legs
        makebox(0.1, 0.8, 0.1, 0x664411, ox + 39.4, 7.8, oz - 5);
        makebox(0.1, 0.8, 0.1, 0x664411, ox + 40.6, 7.8, oz - 5);
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
