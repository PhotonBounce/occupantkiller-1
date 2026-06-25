window.LauncestonCastle = (function() {
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

    function addbox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcylinder(rt, rb, h, color, x, y, z, segs) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, segs || 16);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addsphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 16, 16);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addcone(r, h, color, x, y, z, segs) {
        var geo = new THREE.ConeGeometry(r, h, segs || 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function addwire(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color, wireframe: true });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function build() {
        var ox = 8800;
        var oz = 0;

        // 1. Castle motte — rounded earthen mound: SphereGeometry 15r (half buried)
        addsphere(15, 0x7A6A40, ox + 0, -5, oz + 0);

        // 2. Norman keep — circular shell keep on motte
        // Outer shell keep cylinder
        addcylinder(6, 6, 10, 0x888870, ox + 0, 12, oz + 0, 16);
        // Inner tower taller cylinder
        addcylinder(4, 4, 14, 0x777060, ox + 0, 14, oz + 0, 12);

        // 3. Castle gateway — gatehouse at motte base
        // Main gatehouse box
        addbox(8, 6, 10, 0x888870, ox - 10, 3, oz + 8);
        // Portcullis groove — thin vertical box
        addbox(0.2, 6, 0.5, 0x555544, ox - 10, 3, oz + 3);
        // Archway gap simulation — dark thin box inside gatehouse
        addbox(3, 3, 0.3, 0x333322, ox - 10, 1.5, oz + 3.1);

        // 4. Town walls — partial medieval wall: 4 box sections
        addbox(8, 4, 0.8, 0x887060, ox - 20, 2, oz + 15);
        addbox(8, 4, 0.8, 0x887060, ox - 28, 2, oz + 20);
        addbox(8, 4, 0.8, 0x887060, ox - 32, 2, oz + 28);
        addbox(8, 4, 0.8, 0x887060, ox - 28, 2, oz + 36);
        // 2 projecting wall towers
        addbox(3, 6, 3, 0x887060, ox - 24, 3, oz + 18);
        addbox(3, 6, 3, 0x887060, ox - 30, 3, oz + 32);

        // 5. St Mary Magdalene Church — heavily carved granite box
        addbox(18, 10, 12, 0x8A7860, ox + 20, 5, oz - 15);
        // Carved facade detail — 4 box panels
        addbox(3, 4, 0.2, 0x7A6850, ox + 12, 5, oz - 21.1);
        addbox(3, 4, 0.2, 0x7A6850, ox + 17, 5, oz - 21.1);
        addbox(3, 4, 0.2, 0x7A6850, ox + 22, 5, oz - 21.1);
        addbox(3, 4, 0.2, 0x7A6850, ox + 27, 5, oz - 21.1);
        // Square tower
        addbox(5, 16, 5, 0x8A7860, ox + 30, 8, oz - 15);
        // Tower pinnacle cone
        addcone(2.5, 4, 0x777060, ox + 30, 18, oz - 15, 4);

        // 6. South Gate arch — medieval gate
        // Left tower
        addbox(4, 8, 4, 0x887060, ox - 38, 4, oz + 5);
        // Right tower
        addbox(4, 8, 4, 0x887060, ox - 30, 4, oz + 5);
        // Arch bridge on top
        addbox(8, 3, 2, 0x887060, ox - 34, 9.5, oz + 5);
        // Arch opening gap (dark box)
        addbox(3, 4, 2.2, 0x222211, ox - 34, 5, oz + 5);

        // 7. Medieval market square — 8 buildings on sloping hillside
        addbox(5, 6, 5, 0xAA9977, ox + 5, 3, oz + 25);
        addbox(5, 6, 5, 0xAA9977, ox + 12, 3.4, oz + 25);
        addbox(5, 6, 5, 0xAA9977, ox + 19, 3.8, oz + 25);
        addbox(5, 6, 5, 0xAA9977, ox + 26, 4.2, oz + 25);
        addbox(5, 6, 5, 0xAA9977, ox + 5, 4.6, oz + 32);
        addbox(5, 6, 5, 0xAA9977, ox + 12, 5.0, oz + 32);
        addbox(5, 6, 5, 0xAA9977, ox + 19, 5.4, oz + 32);
        addbox(5, 6, 5, 0xAA9977, ox + 26, 5.8, oz + 32);
        // Roof cones for market buildings
        addcone(3.5, 3, 0x886655, ox + 5, 9, oz + 25, 4);
        addcone(3.5, 3, 0x886655, ox + 12, 9.4, oz + 25, 4);
        addcone(3.5, 3, 0x886655, ox + 19, 9.8, oz + 25, 4);
        addcone(3.5, 3, 0x886655, ox + 26, 10.2, oz + 25, 4);

        // 8. Lawrence House Museum — Georgian townhouse
        addbox(10, 9, 8, 0xDDCC99, ox + 35, 4.5, oz + 10);
        // Pilastered facade — decorative pilasters
        addbox(0.5, 8, 0.5, 0xCCBB88, ox + 30.5, 4, oz + 6.1);
        addbox(0.5, 8, 0.5, 0xCCBB88, ox + 33, 4, oz + 6.1);
        addbox(0.5, 8, 0.5, 0xCCBB88, ox + 37, 4, oz + 6.1);
        addbox(0.5, 8, 0.5, 0xCCBB88, ox + 39.5, 4, oz + 6.1);
        // Georgian pediment
        addcone(5.5, 2.5, 0xCCBB88, ox + 35, 10.5, oz + 6.1, 3);

        // 9. Corn market hall — open-sided market
        // 6 column cylinders
        addcylinder(0.4, 0.4, 4, 0xBBAA88, ox - 5, 2, oz + 45, 8);
        addcylinder(0.4, 0.4, 4, 0xBBAA88, ox + 1, 2, oz + 45, 8);
        addcylinder(0.4, 0.4, 4, 0xBBAA88, ox + 7, 2, oz + 45, 8);
        addcylinder(0.4, 0.4, 4, 0xBBAA88, ox - 5, 2, oz + 53, 8);
        addcylinder(0.4, 0.4, 4, 0xBBAA88, ox + 1, 2, oz + 53, 8);
        addcylinder(0.4, 0.4, 4, 0xBBAA88, ox + 7, 2, oz + 53, 8);
        // Box roof supported by columns
        addbox(12, 0.3, 8, 0xBBAA88, ox + 1, 4.15, oz + 49);

        // 10. Castle walk viewpoint — stone parapet wall
        addbox(20, 1.2, 0.8, 0x888870, ox - 8, 0.6, oz - 12);
        // Cannon box pointing outward
        addbox(1, 0.6, 0.6, 0x555544, ox - 2, 0.3, oz - 12.7);
        // Additional parapet merlons (crenellations)
        addbox(1.5, 0.8, 0.8, 0x888870, ox - 17, 1.6, oz - 12);
        addbox(1.5, 0.8, 0.8, 0x888870, ox - 12, 1.6, oz - 12);
        addbox(1.5, 0.8, 0.8, 0x888870, ox - 7, 1.6, oz - 12);
        addbox(1.5, 0.8, 0.8, 0x888870, ox - 2, 1.6, oz - 12);
        addbox(1.5, 0.8, 0.8, 0x888870, ox + 3, 1.6, oz - 12);
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
