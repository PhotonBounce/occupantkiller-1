window.GreenwichObservatory = (function() {
    'use strict';

    var scene = null;
    var camera = null;
    var objects = [];
    var OFFSET_X = 16680;
    var OFFSET_Z = 0;

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
    }

    function makeMaterial(color) {
        return new THREE.MeshLambertMaterial({ color: color });
    }

    function makeBox(w, h, d, color, x, y, z) {
        var geo = new THREE.BoxGeometry(w, h, d);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCylinder(rTop, rBot, h, segs, color, x, y, z) {
        var geo = new THREE.CylinderGeometry(rTop, rBot, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeSphere(r, segs, color, x, y, z) {
        var geo = new THREE.SphereGeometry(r, segs, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function makeCone(r, h, segs, color, x, y, z) {
        var geo = new THREE.ConeGeometry(r, h, segs);
        var mat = makeMaterial(color);
        var mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y, z);
        return mesh;
    }

    function addToScene(mesh) {
        scene.add(mesh);
        objects.push(mesh);
        return mesh;
    }

    function buildHill() {
        var ox = OFFSET_X;
        var oz = OFFSET_Z;

        var layer1 = makeBox(60, 5, 60, 0x3A8A3A, ox, 2.5, oz);
        addToScene(layer1);

        var layer2 = makeBox(50, 4, 50, 0x3A8A3A, ox, 7, oz);
        addToScene(layer2);

        var layer3 = makeBox(40, 3, 40, 0x3A8A3A, ox, 10.5, oz);
        addToScene(layer3);
    }

    function buildFlamsteedHouse() {
        var ox = OFFSET_X;
        var oz = OFFSET_Z;
        var baseY = 12;

        var mainBuilding = makeBox(18, 14, 12, 0xD4C5A9, ox, baseY + 7, oz);
        addToScene(mainBuilding);

        var turret1 = makeCylinder(4, 4, 18, 8, 0xC4B59A, ox - 10, baseY + 9, oz);
        addToScene(turret1);

        var turret2 = makeCylinder(4, 4, 18, 8, 0xC4B59A, ox + 10, baseY + 9, oz);
        addToScene(turret2);

        var cap1 = makeCone(4, 6, 8, 0xB8A888, ox - 10, baseY + 21, oz);
        addToScene(cap1);

        var cap2 = makeCone(4, 6, 8, 0xB8A888, ox + 10, baseY + 21, oz);
        addToScene(cap2);
    }

    function buildOnionDome() {
        var ox = OFFSET_X + 6;
        var oz = OFFSET_Z - 8;
        var baseY = 12;

        var domeBase = makeCylinder(5, 5, 4, 12, 0x8B2000, ox, baseY + 16 + 2, oz);
        addToScene(domeBase);

        var domeSphere = makeSphere(5, 12, 0x9B3000, ox, baseY + 16 + 4 + 5, oz);
        addToScene(domeSphere);

        var slit = makeBox(2, 6, 0.5, 0x1A1A1A, ox, baseY + 16 + 4 + 5, oz + 5);
        addToScene(slit);
    }

    function buildPrimeMeridian() {
        var ox = OFFSET_X;
        var oz = OFFSET_Z;
        var groundY = 12;

        var line = makeBox(0.3, 0.1, 60, 0xFFD700, ox, groundY + 0.05, oz);
        addToScene(line);

        var plaque1 = makeBox(2, 0.5, 0.3, 0xD4A574, ox, groundY + 0.25, oz - 20);
        addToScene(plaque1);

        var plaque2 = makeBox(2, 0.5, 0.3, 0xD4A574, ox, groundY + 0.25, oz);
        addToScene(plaque2);

        var plaque3 = makeBox(2, 0.5, 0.3, 0xD4A574, ox, groundY + 0.25, oz + 20);
        addToScene(plaque3);
    }

    function buildTimeBall() {
        var ox = OFFSET_X;
        var oz = OFFSET_Z;
        var roofY = 12 + 14;

        var platform = makeBox(5, 0.5, 5, 0xD4C5A9, ox, roofY + 0.25, oz);
        addToScene(platform);

        var mast = makeCylinder(1.5, 1.5, 8, 6, 0x888888, ox, roofY + 0.5 + 4, oz);
        addToScene(mast);

        var ball = makeSphere(3, 8, 0xCC0000, ox, roofY + 0.5 + 8 + 3, oz);
        addToScene(ball);
    }

    function buildGreatEquatorialDome() {
        var ox = OFFSET_X - 8;
        var oz = OFFSET_Z + 10;
        var baseY = 12;

        var domeCylinder = makeCylinder(8, 8, 4, 12, 0xC0C0C0, ox, baseY + 2, oz);
        addToScene(domeCylinder);

        var domeSphere = makeSphere(8, 12, 0xD0D0D0, ox, baseY + 4 + 8, oz);
        addToScene(domeSphere);

        var slit = makeBox(3, 10, 0.5, 0x1A1A1A, ox, baseY + 4 + 8, oz + 8);
        addToScene(slit);
    }

    function buildCuttySark() {
        var ox = OFFSET_X - 20;
        var oz = OFFSET_Z + 40;
        var waterY = 2;

        var hull = makeBox(8, 5, 30, 0x1C3A6B, ox, waterY + 2.5, oz);
        addToScene(hull);

        var mast1 = makeCylinder(0.6, 0.6, 24, 6, 0x4A2C0A, ox - 2, waterY + 5 + 12, oz - 8);
        addToScene(mast1);

        var mast2 = makeCylinder(0.6, 0.6, 20, 6, 0x4A2C0A, ox, waterY + 5 + 10, oz);
        addToScene(mast2);

        var mast3 = makeCylinder(0.6, 0.6, 18, 6, 0x4A2C0A, ox + 2, waterY + 5 + 9, oz + 8);
        addToScene(mast3);

        var yard1 = makeBox(14, 0.5, 0.5, 0x4A2C0A, ox - 2, waterY + 5 + 16, oz - 8);
        addToScene(yard1);

        var yard2 = makeBox(14, 0.5, 0.5, 0x4A2C0A, ox, waterY + 5 + 13, oz);
        addToScene(yard2);

        var yard3 = makeBox(14, 0.5, 0.5, 0x4A2C0A, ox + 2, waterY + 5 + 12, oz + 8);
        addToScene(yard3);

        var sail1 = makeBox(10, 4, 0.4, 0xF5DEB3, ox - 2, waterY + 5 + 12, oz - 8);
        addToScene(sail1);

        var sail2 = makeBox(10, 4, 0.4, 0xF5DEB3, ox, waterY + 5 + 10, oz);
        addToScene(sail2);

        var sail3 = makeBox(10, 4, 0.4, 0xF5DEB3, ox + 2, waterY + 5 + 9, oz + 8);
        addToScene(sail3);
    }

    function buildNationalMaritimeMuseum() {
        var ox = OFFSET_X - 30;
        var oz = OFFSET_Z - 50;
        var groundY = 0;

        var mainBlock = makeBox(50, 18, 20, 0xF0EAD0, ox, groundY + 9, oz);
        addToScene(mainBlock);

        var colSpacing = 50 / 7;
        var i;
        for (i = 0; i < 8; i++) {
            var colX = ox - 25 + (i * colSpacing) + colSpacing * 0.5;
            var col = makeCylinder(2, 2, 14, 8, 0xEEE8C8, colX, groundY + 7, oz + 10);
            addToScene(col);
        }

        var pediment = makeBox(52, 6, 3, 0xEEE8C8, ox, groundY + 18 + 3, oz + 10);
        addToScene(pediment);
    }

    function build() {
        buildHill();
        buildFlamsteedHouse();
        buildOnionDome();
        buildPrimeMeridian();
        buildTimeBall();
        buildGreatEquatorialDome();
        buildCuttySark();
        buildNationalMaritimeMuseum();
    }

    function update(delta) {
        // No animated elements in this environment
    }

    function reset() {
        var i;
        for (i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                objects[i].material.dispose();
            }
        }
        objects = [];
    }

    return {
        init: init,
        build: build,
        update: update,
        reset: reset
    };

}());
