window.PikeFort = (function() {
    'use strict';
    var scene = null;
    var camera = null;
    var objects = [];
    var lights = [];

    function init(sceneRef, cameraRef) {
        scene = sceneRef;
        camera = cameraRef;
        objects = [];
        lights = [];
        buildFort();
    }

    function buildFort() {
        // Central training ground base - large box
        var baseGeom = new THREE.BoxGeometry(80, 2, 80);
        var baseMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var base = new THREE.Mesh(baseGeom, baseMat);
        base.position.set(0, 0, 0);
        scene.add(base);
        objects.push(base);

        // Pike wall formation - diagonal spear formation using LineSegments
        var pikeWallGeom = new THREE.BufferGeometry();
        var pikeVertices = new Float32Array([
            -25, 0, -20,  -20, 0, -15,
            -20, 0, -15,  -15, 0, -10,
            -15, 0, -10,  -10, 0, -5,
            -10, 0, -5,   -5, 0, 0,
            -5, 0, 0,     0, 0, 5,
            0, 0, 5,      5, 0, 10,
            5, 0, 10,     10, 0, 15,
            10, 0, 15,    15, 0, 20,
            15, 0, 20,    20, 0, 25
        ]);
        pikeWallGeom.setAttribute('position', new THREE.BufferAttribute(pikeVertices, 3));
        var pikeMat = new THREE.MeshLambertMaterial({ color: 0xD4AF37 });
        var pikeWall = new THREE.LineSegments(pikeWallGeom, pikeMat);
        pikeWall.position.set(-10, 1, -10);
        scene.add(pikeWall);
        objects.push(pikeWall);

        // Polearm weapon rack - thin cylinders in box structure
        var rackBoxGeom = new THREE.BoxGeometry(12, 8, 6);
        var rackBoxMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var rackBox = new THREE.Mesh(rackBoxGeom, rackBoxMat);
        rackBox.position.set(-20, 5, 15);
        scene.add(rackBox);
        objects.push(rackBox);

        // Polearm poles - thin cylinders
        for (var i = 0; i < 4; i++) {
            var poleGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8);
            var poleMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
            var pole = new THREE.Mesh(poleGeom, poleMat);
            pole.position.set(-22 + (i * 3), 5, 15);
            scene.add(pole);
            objects.push(pole);
        }

        // Armorer's forge tower - cylinder with box furnace
        var towerCylinderGeom = new THREE.CylinderGeometry(6, 6, 14, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var towerCylinder = new THREE.Mesh(towerCylinderGeom, towerMat);
        towerCylinder.position.set(25, 8, -20);
        scene.add(towerCylinder);
        objects.push(towerCylinder);

        // Chimney on tower
        var chimneyGeom = new THREE.CylinderGeometry(2, 2.5, 6, 8);
        var chimneyMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var chimney = new THREE.Mesh(chimneyGeom, chimneyMat);
        chimney.position.set(25, 18, -20);
        scene.add(chimney);
        objects.push(chimney);

        // Furnace box attached to tower
        var furnaceGeom = new THREE.BoxGeometry(8, 6, 8);
        var furnaceMat = new THREE.MeshLambertMaterial({ color: 0x8B0000 });
        var furnace = new THREE.Mesh(furnaceGeom, furnaceMat);
        furnace.position.set(32, 4, -20);
        scene.add(furnace);
        objects.push(furnace);

        // Longbow archery range - target bales (spheres on box stands)
        // First target bale stand
        var stand1Geom = new THREE.BoxGeometry(4, 3, 4);
        var standMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var stand1 = new THREE.Mesh(stand1Geom, standMat);
        stand1.position.set(-30, 2, 25);
        scene.add(stand1);
        objects.push(stand1);

        // First target bale
        var bale1Geom = new THREE.SphereGeometry(2.5, 16, 12);
        var baleMat = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var bale1 = new THREE.Mesh(bale1Geom, baleMat);
        bale1.position.set(-30, 5, 25);
        scene.add(bale1);
        objects.push(bale1);

        // Second target bale stand
        var stand2Geom = new THREE.BoxGeometry(4, 3, 4);
        var stand2 = new THREE.Mesh(stand2Geom, standMat);
        stand2.position.set(-5, 2, 30);
        scene.add(stand2);
        objects.push(stand2);

        // Second target bale
        var bale2Geom = new THREE.SphereGeometry(2.5, 16, 12);
        var bale2 = new THREE.Mesh(bale2Geom, baleMat);
        bale2.position.set(-5, 5, 30);
        scene.add(bale2);
        objects.push(bale2);

        // Third target bale stand
        var stand3Geom = new THREE.BoxGeometry(4, 3, 4);
        var stand3 = new THREE.Mesh(stand3Geom, standMat);
        stand3.position.set(20, 2, 28);
        scene.add(stand3);
        objects.push(stand3);

        // Third target bale
        var bale3Geom = new THREE.SphereGeometry(2.5, 16, 12);
        var bale3 = new THREE.Mesh(bale3Geom, baleMat);
        bale3.position.set(20, 5, 28);
        scene.add(bale3);
        objects.push(bale3);

        // Portcullis gate - LineSegments grid
        var portculliGeom = new THREE.BufferGeometry();
        var portculliVerts = new Float32Array([
            -8, 0, 35,   -8, 12, 35,
            -4, 0, 35,   -4, 12, 35,
            0, 0, 35,    0, 12, 35,
            4, 0, 35,    4, 12, 35,
            8, 0, 35,    8, 12, 35,
            -8, 3, 35,   8, 3, 35,
            -8, 6, 35,   8, 6, 35,
            -8, 9, 35,   8, 9, 35,
            -8, 12, 35,  8, 12, 35
        ]);
        portculliGeom.setAttribute('position', new THREE.BufferAttribute(portculliVerts, 3));
        var portculliMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var portculli = new THREE.LineSegments(portculliGeom, portculliMat);
        portculli.position.set(0, 1, 0);
        scene.add(portculli);
        objects.push(portculli);

        // Guard towers at corners
        var tower1Geom = new THREE.CylinderGeometry(3, 3, 10, 8);
        var towerMat2 = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var tower1 = new THREE.Mesh(tower1Geom, towerMat2);
        tower1.position.set(-35, 6, -35);
        scene.add(tower1);
        objects.push(tower1);

        var tower2 = new THREE.Mesh(tower1Geom, towerMat2);
        tower2.position.set(35, 6, -35);
        scene.add(tower2);
        objects.push(tower2);

        var tower3 = new THREE.Mesh(tower1Geom, towerMat2);
        tower3.position.set(-35, 6, 35);
        scene.add(tower3);
        objects.push(tower3);

        var tower4 = new THREE.Mesh(tower1Geom, towerMat2);
        tower4.position.set(35, 6, 35);
        scene.add(tower4);
        objects.push(tower4);

        // Training cone formations
        var cone1Geom = new THREE.ConeGeometry(2, 5, 8);
        var coneMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var cone1 = new THREE.Mesh(cone1Geom, coneMat);
        cone1.position.set(-15, 3, 0);
        scene.add(cone1);
        objects.push(cone1);

        var cone2 = new THREE.Mesh(cone1Geom, coneMat);
        cone2.position.set(0, 3, -15);
        scene.add(cone2);
        objects.push(cone2);

        var cone3 = new THREE.Mesh(cone1Geom, coneMat);
        cone3.position.set(15, 3, 0);
        scene.add(cone3);
        objects.push(cone3);

        // Lighting
        var ambLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        dirLight.position.set(30, 40, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation can be added here
        // For example, rotating training cones
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry && objects[i].geometry.type === 'ConeGeometry') {
                objects[i].rotation.y += delta * 0.5;
            }
        }
    }

    function reset() {
        for (var i = 0; i < objects.length; i++) {
            scene.remove(objects[i]);
        }
        for (var i = 0; i < lights.length; i++) {
            scene.remove(lights[i]);
        }
        objects = [];
        lights = [];
        scene = null;
        camera = null;
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
