window.PortsmouthNaval = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var OX = 10040;
    var OZ = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        build();
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCyl(rt, rb, h, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rt, rb, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeSphere(r, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, 12, 8);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function makeCone(r, h, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, 12);
        var mat = new THREE.MeshLambertMaterial({ color: color });
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(OX + x, y, OZ + z);
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildVictory() {
        // Hull
        makeBox(45, 8, 12, 0x1A2255, -80, 4, -60);
        // Gun deck port holes — deck 1
        var i;
        for (i = 0; i < 10; i++) {
            makeBox(0.5, 0.5, 0.1, 0x111111, -80 + (-20 + i * 4.4), 4, -54.1);
            makeBox(0.5, 0.5, 0.1, 0x111111, -80 + (-20 + i * 4.4), 4, -65.9);
        }
        // Gun deck port holes — deck 2
        for (i = 0; i < 10; i++) {
            makeBox(0.5, 0.5, 0.1, 0x111111, -80 + (-20 + i * 4.4), 6.5, -54.1);
            makeBox(0.5, 0.5, 0.1, 0x111111, -80 + (-20 + i * 4.4), 6.5, -65.9);
        }
        // Gun deck port holes — deck 3
        for (i = 0; i < 10; i++) {
            makeBox(0.5, 0.5, 0.1, 0x111111, -80 + (-20 + i * 4.4), 2, -54.1);
            makeBox(0.5, 0.5, 0.1, 0x111111, -80 + (-20 + i * 4.4), 2, -65.9);
        }
        // Mast 1 lower + upper + yard arm
        makeCyl(0.5, 0.5, 20, 0x8B6914, -80, 18, -60);
        makeCyl(0.3, 0.3, 15, 0x8B6914, -80, 35.5, -60);
        makeBox(0.2, 0.2, 12, 0x8B6914, -80, 14, -60);
        // Mast 2
        makeCyl(0.5, 0.5, 20, 0x8B6914, -68, 18, -60);
        makeCyl(0.3, 0.3, 15, 0x8B6914, -68, 35.5, -60);
        makeBox(0.2, 0.2, 12, 0x8B6914, -68, 14, -60);
        // Mast 3
        makeCyl(0.5, 0.5, 20, 0x8B6914, -56, 18, -60);
        makeCyl(0.3, 0.3, 15, 0x8B6914, -56, 35.5, -60);
        makeBox(0.2, 0.2, 12, 0x8B6914, -56, 14, -60);
        // Bowsprit projecting forward
        makeBox(0.4, 0.4, 15, 0x8B6914, -102, 10, -60);
    }

    function buildSpinnaker() {
        // Tower shaft
        makeCyl(2, 2, 30, 0xEEEEEE, 20, 15, -20);
        // Sail wing fins
        makeBox(3, 30, 0.5, 0xEEEEEE, 17, 15, -20);
        makeBox(3, 30, 0.5, 0xEEEEEE, 23, 15, -20);
        // Viewing pod
        makeSphere(4, 0xCCCCCC, 20, 32, -20);
    }

    function buildDockyard() {
        // Dry dock basin
        makeBox(40, 3, 15, 0x555577, 0, 1.5, 20);
        // Dock gates
        makeBox(3, 4, 0.5, 0x444466, -19, 2, 20);
        makeBox(3, 4, 0.5, 0x444466, 19, 2, 20);
        // Dockyard buildings
        makeBox(15, 8, 7, 0x887755, -30, 4, 30);
        makeBox(15, 8, 7, 0x887755, -10, 4, 30);
        makeBox(15, 8, 7, 0x887755, 10, 4, 30);
        makeBox(15, 8, 7, 0x887755, 30, 4, 30);
    }

    function buildWarrior() {
        // Long hull
        makeBox(40, 6, 9, 0x222233, 60, 3, -50);
        // Gun ports (white strips)
        makeBox(38, 0.8, 0.1, 0xFFFFFF, 60, 4, -45.6);
        makeBox(38, 0.8, 0.1, 0xFFFFFF, 60, 4, -54.4);
        // Twin funnels
        makeCyl(1, 1, 6, 0x333333, 52, 9, -50);
        makeCyl(1, 1, 6, 0x333333, 60, 9, -50);
        // Masts
        makeCyl(0.4, 0.4, 18, 0x8B6914, 50, 12, -50);
        makeCyl(0.4, 0.4, 18, 0x8B6914, 68, 12, -50);
    }

    function buildDDayMuseum() {
        // Museum building
        makeBox(18, 10, 7, 0x445566, -40, 5, 60);
        // Sherman tank hull
        makeBox(4, 2, 3, 0x556633, -55, 1, 60);
        // Turret
        makeBox(2, 2, 2, 0x556633, -55, 3, 60);
        // Gun barrel
        makeCyl(0.3, 0.3, 4, 0x445522, -53, 3.5, 60);
    }

    function buildRoundTower() {
        // Main cylinder
        makeCyl(8, 8, 8, 0x888870, -110, 4, 0);
        // Cannon loops
        makeBox(0.8, 0.8, 0.1, 0x555540, -110 + 7, 4, 0.1);
        makeBox(0.8, 0.8, 0.1, 0x555540, -110 - 7, 4, 0.1);
        makeBox(0.8, 0.8, 0.1, 0x555540, -110, 4, 7.1);
        // Gun platform on top
        makeBox(8, 0.5, 8, 0x777760, -110, 8.25, 0);
    }

    function buildCathedral() {
        // Nave
        makeBox(12, 8, 10, 0x888870, 50, 4, 60);
        // Square tower
        makeBox(4, 16, 4, 0x888870, 50, 8, 54);
        // Blue copper dome base
        makeCyl(3, 3, 2, 0x228877, 50, 17, 54);
        // Dome
        makeSphere(3, 0x228877, 50, 20, 54);
    }

    function buildGunwharf() {
        makeBox(20, 8, 6, 0x778899, 10, 4, -80);
        makeBox(20, 8, 6, 0x778899, 34, 4, -80);
        makeBox(20, 8, 6, 0x778899, 58, 4, -80);
        makeBox(20, 8, 6, 0x778899, 82, 4, -80);
    }

    function buildFortifications() {
        // Fort section 1
        makeBox(15, 3, 5, 0x888870, -60, 1.5, 80);
        makeCone(10, 3, 0x777755, -60, 3, 88);
        // Fort section 2
        makeBox(15, 3, 5, 0x888870, -40, 1.5, 80);
        makeCone(10, 3, 0x777755, -40, 3, 88);
    }

    function buildHarbour() {
        // Harbour water surface
        makeBox(80, 0.5, 40, 0x1A3355, -30, 0.25, -30);
        // Cross-channel ferry hull
        makeBox(60, 10, 16, 0xDDDDCC, -30, 5, -30);
        // Ferry funnels
        makeCyl(2, 2, 8, 0xCC3333, -20, 13, -30);
        makeCyl(2, 2, 8, 0xCC3333, -10, 13, -30);
        // Ferry superstructure decks
        makeBox(50, 3, 14, 0xEEEEDD, -30, 12, -30);
        makeBox(40, 3, 12, 0xEEEEDD, -30, 16, -30);
    }

    function build() {
        buildVictory();
        buildSpinnaker();
        buildDockyard();
        buildWarrior();
        buildDDayMuseum();
        buildRoundTower();
        buildCathedral();
        buildGunwharf();
        buildFortifications();
        buildHarbour();
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
