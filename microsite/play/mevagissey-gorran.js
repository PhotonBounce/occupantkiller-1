window.MevagisseyGorran = (function() {
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
        mesh.position.set(8920 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecylinder(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8920 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makesphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 8, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8920 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makecone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(8920 + x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        // 1. Inner harbour — 4 quay wall boxes 8×2×3, stone grey 0x888870
        makebox(8, 2, 3, 0x888870, -20, 1, -10);
        makebox(8, 2, 3, 0x888870, -20, 1, -3);
        makebox(8, 2, 3, 0x888870, -28, 1, -6.5);
        makebox(8, 2, 3, 0x888870, -12, 1, -6.5);

        // mooring rings — small boxes on quay tops
        makebox(0.4, 0.3, 0.4, 0x555544, -17, 2.15, -10);
        makebox(0.4, 0.3, 0.4, 0x555544, -23, 2.15, -10);
        makebox(0.4, 0.3, 0.4, 0x555544, -17, 2.15, -3);
        makebox(0.4, 0.3, 0.4, 0x555544, -23, 2.15, -3);

        // 2. Outer harbour — 5 longer quay sections 10×2×3, 0x887760
        makebox(10, 2, 3, 0x887760, 0, 1, -20);
        makebox(10, 2, 3, 0x887760, 10, 1, -20);
        makebox(10, 2, 3, 0x887760, -10, 1, -20);
        makebox(10, 2, 3, 0x887760, -15, 1, -14);
        makebox(10, 2, 3, 0x887760, 15, 1, -14);

        // harbour light — cylinder 0.4r×4h + sphere 0.3r top, red
        makecylinder(0.4, 0.4, 4, 0x887760, 18, 3, -20);
        makesphere(0.3, 0xCC2222, 18, 5.3, -20);

        // 3. Fishing trawlers — 6 boats
        // Trawler 1
        makebox(6, 1.5, 2.5, 0x225588, -18, 0.75, -7);
        makebox(2, 2, 2, 0xEEEEDD, -17, 2.5, -7);
        makecylinder(0.2, 0.2, 6, 0x888888, -19, 4, -7);

        // Trawler 2
        makebox(6, 1.5, 2.5, 0xCC3322, -18, 0.75, -4);
        makebox(2, 2, 2, 0xEEEEDD, -17, 2.5, -4);
        makecylinder(0.2, 0.2, 6, 0x888888, -19, 4, -4);

        // Trawler 3
        makebox(6, 1.5, 2.5, 0x225588, 2, 0.75, -18);
        makebox(2, 2, 2, 0xEEEEDD, 3, 2.5, -18);
        makecylinder(0.2, 0.2, 6, 0x888888, 1, 4, -18);

        // Trawler 4
        makebox(6, 1.5, 2.5, 0xEEEEDD, 8, 0.75, -18);
        makebox(2, 2, 2, 0x225588, 9, 2.5, -18);
        makecylinder(0.2, 0.2, 6, 0x888888, 7, 4, -18);

        // Trawler 5
        makebox(6, 1.5, 2.5, 0xCC3322, -5, 0.75, -18);
        makebox(2, 2, 2, 0xEEEEDD, -4, 2.5, -18);
        makecylinder(0.2, 0.2, 6, 0x888888, -6, 4, -18);

        // Trawler 6
        makebox(6, 1.5, 2.5, 0x225588, -12, 0.75, -18);
        makebox(2, 2, 2, 0xEEEEDD, -11, 2.5, -18);
        makecylinder(0.2, 0.2, 6, 0x888888, -13, 4, -18);

        // 4. Pilchard cellar — long low building 20×5×4, 0x888870
        makebox(20, 5, 4, 0x888870, 30, 2.5, -5);

        // barrel stack — cylinder 0.5r×0.8h, 8 barrels in 2 rows
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 23, 0.4, -5);
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 25, 0.4, -5);
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 27, 0.4, -5);
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 29, 0.4, -5);
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 23, 1.2, -5);
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 25, 1.2, -5);
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 27, 1.2, -5);
        makecylinder(0.5, 0.5, 0.8, 0x8B6040, 29, 1.2, -5);

        // 5. Lobster pot stacks — 4 piles, 8 small boxes each
        // Pile 1
        makebox(0.6, 0.5, 0.6, 0x8B6040, -5, 0.25, -8);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -5, 0.75, -8);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -5, 1.25, -8);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -5, 1.75, -8);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -4.2, 0.25, -8);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -4.2, 0.75, -8);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -4.2, 1.25, -8);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -4.2, 1.75, -8);

        // Pile 2
        makebox(0.6, 0.5, 0.6, 0x8B6040, -3, 0.25, -10);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -3, 0.75, -10);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -3, 1.25, -10);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -3, 1.75, -10);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -2.2, 0.25, -10);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -2.2, 0.75, -10);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -2.2, 1.25, -10);
        makebox(0.6, 0.5, 0.6, 0x8B6040, -2.2, 1.75, -10);

        // Pile 3
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5, 0.25, -13);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5, 0.75, -13);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5, 1.25, -13);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5, 1.75, -13);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5.8, 0.25, -13);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5.8, 0.75, -13);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5.8, 1.25, -13);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 5.8, 1.75, -13);

        // Pile 4
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12, 0.25, -11);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12, 0.75, -11);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12, 1.25, -11);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12, 1.75, -11);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12.8, 0.25, -11);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12.8, 0.75, -11);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12.8, 1.25, -11);
        makebox(0.6, 0.5, 0.6, 0x8B6040, 12.8, 1.75, -11);

        // 6. Mevagissey village — 14 fishermen's cottages 3×4×4
        makebox(3, 4, 4, 0xCCBBAA, -35, 2, 5);
        makebox(3, 4, 4, 0xBBAA99, -31, 2, 5);
        makebox(3, 4, 4, 0xCCBBAA, -27, 2, 5);
        makebox(3, 4, 4, 0xBBAA99, -23, 2, 5);
        makebox(3, 4, 4, 0xCCBBAA, -19, 2, 5);
        makebox(3, 4, 4, 0xBBAA99, -15, 2, 5);
        makebox(3, 4, 4, 0xCCBBAA, -11, 2, 5);
        makebox(3, 4, 4, 0xBBAA99, -36, 2, 10);
        makebox(3, 4, 4, 0xCCBBAA, -32, 2, 10);
        makebox(3, 4, 4, 0xBBAA99, -28, 2, 10);
        makebox(3, 4, 4, 0xCCBBAA, -24, 2, 10);
        makebox(3, 4, 4, 0xBBAA99, -20, 2, 10);
        makebox(3, 4, 4, 0xCCBBAA, -16, 2, 10);
        makebox(3, 4, 4, 0xBBAA99, -12, 2, 10);

        // 7. Aquarium building — 8×5×4, 0x336688
        makebox(8, 5, 4, 0x336688, 40, 2.5, 5);

        // display tank windows — blue glass boxes 2×1×0.1 × 4
        makebox(2, 1, 0.1, 0x4499CC, 37, 2, 3.05);
        makebox(2, 1, 0.1, 0x4499CC, 39.5, 2, 3.05);
        makebox(2, 1, 0.1, 0x4499CC, 42, 2, 3.05);
        makebox(2, 1, 0.1, 0x4499CC, 44, 2, 3.05);

        // 8. Gorran Haven beach cove — sand box 25×0.3×10, 0xF5E6A0
        makebox(25, 0.3, 10, 0xF5E6A0, 0, 0.15, 40);

        // 3 upturned boat hulls — box 4×1×2, brown
        makebox(4, 1, 2, 0x8B4513, -8, 0.65, 40);
        makebox(4, 1, 2, 0x8B4513, -2, 0.65, 40);
        makebox(4, 1, 2, 0x8B4513, 4, 0.65, 40);

        // 9. Net drying racks — 4 wooden frames
        // Rack 1
        makecylinder(0.2, 0.2, 3, 0x8B6040, -40, 1.5, -2);
        makecylinder(0.2, 0.2, 3, 0x8B6040, -40, 1.5, 4);
        makecylinder(0.2, 0.2, 3, 0x8B6040, -34, 1.5, -2);
        makecylinder(0.2, 0.2, 3, 0x8B6040, -34, 1.5, 4);
        makebox(0.2, 0.2, 6, 0x8B6040, -40, 3.1, 1);
        makebox(0.2, 0.2, 6, 0x8B6040, -34, 3.1, 1);

        // Rack 2
        makecylinder(0.2, 0.2, 3, 0x8B6040, -50, 1.5, -2);
        makecylinder(0.2, 0.2, 3, 0x8B6040, -50, 1.5, 4);
        makecylinder(0.2, 0.2, 3, 0x8B6040, -44, 1.5, -2);
        makecylinder(0.2, 0.2, 3, 0x8B6040, -44, 1.5, 4);
        makebox(0.2, 0.2, 6, 0x8B6040, -50, 3.1, 1);
        makebox(0.2, 0.2, 6, 0x8B6040, -44, 3.1, 1);

        // 10. Shark tank theme park — 8×6×5, 0x445566
        makebox(8, 6, 5, 0x445566, 55, 3, 0);

        // shark fin prop — ConeGeometry 2r×3h + box fin 1×2×0.2, dark grey
        makecone(2, 3, 0x333333, 55, 7.5, 0);
        makebox(1, 2, 0.2, 0x333333, 55, 6, 0);
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
