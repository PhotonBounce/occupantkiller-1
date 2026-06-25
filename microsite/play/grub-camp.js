window.GrubCamp = (function() {
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
        buildCamp();
    }

    function buildCamp() {
        // Main entrance archway (box geometry)
        var archGeom1 = new THREE.BoxGeometry(12, 16, 2);
        var archMat1 = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var arch1 = new THREE.Mesh(archGeom1, archMat1);
        arch1.position.set(-28, 8, 0);
        scene.add(arch1);
        objects.push(arch1);

        // Secondary entrance archway
        var archGeom2 = new THREE.BoxGeometry(10, 14, 2);
        var archMat2 = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var arch2 = new THREE.Mesh(archGeom2, archMat2);
        arch2.position.set(28, 7, 10);
        scene.add(arch2);
        objects.push(arch2);

        // Larvae cultivation vat 1 (tall cylinder)
        var vatGeom1 = new THREE.CylinderGeometry(4, 4, 12, 16);
        var vatMat1 = new THREE.MeshLambertMaterial({ color: 0x8b6f47 });
        var vat1 = new THREE.Mesh(vatGeom1, vatMat1);
        vat1.position.set(-15, 6, -20);
        scene.add(vat1);
        objects.push(vat1);

        // Larvae cultivation vat 2
        var vatGeom2 = new THREE.CylinderGeometry(3, 3, 10, 16);
        var vatMat2 = new THREE.MeshLambertMaterial({ color: 0x7a5f3a });
        var vat2 = new THREE.Mesh(vatGeom2, vatMat2);
        vat2.position.set(0, 5, -25);
        scene.add(vat2);
        objects.push(vat2);

        // Larvae cultivation vat 3
        var vatGeom3 = new THREE.CylinderGeometry(3.5, 3.5, 11, 16);
        var vatMat3 = new THREE.MeshLambertMaterial({ color: 0x9b7d55 });
        var vat3 = new THREE.Mesh(vatGeom3, vatMat3);
        vat3.position.set(15, 5.5, -22);
        scene.add(vat3);
        objects.push(vat3);

        // Protein processing shed (large box)
        var shedGeom = new THREE.BoxGeometry(20, 8, 14);
        var shedMat = new THREE.MeshLambertMaterial({ color: 0x6b5d4f });
        var shed = new THREE.Mesh(shedGeom, shedMat);
        shed.position.set(-20, 4, 15);
        scene.add(shed);
        objects.push(shed);

        // Supply crate 1
        var crateGeom1 = new THREE.BoxGeometry(4, 4, 4);
        var crateMat1 = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var crate1 = new THREE.Mesh(crateGeom1, crateMat1);
        crate1.position.set(5, 2, 20);
        scene.add(crate1);
        objects.push(crate1);

        // Supply crate 2
        var crateGeom2 = new THREE.BoxGeometry(5, 5, 5);
        var crateMat2 = new THREE.MeshLambertMaterial({ color: 0x9b8365 });
        var crate2 = new THREE.Mesh(crateGeom2, crateMat2);
        crate2.position.set(15, 2.5, 18);
        scene.add(crate2);
        objects.push(crate2);

        // Supply crate 3
        var crateGeom3 = new THREE.BoxGeometry(3.5, 3.5, 3.5);
        var crateMat3 = new THREE.MeshLambertMaterial({ color: 0x7b6345 });
        var crate3 = new THREE.Mesh(crateGeom3, crateMat3);
        crate3.position.set(-5, 1.75, 25);
        scene.add(crate3);
        objects.push(crate3);

        // Camouflaged surface cover 1 (cone)
        var coverGeom1 = new THREE.ConeGeometry(5, 6, 12);
        var coverMat1 = new THREE.MeshLambertMaterial({ color: 0x4a5a2a });
        var cover1 = new THREE.Mesh(coverGeom1, coverMat1);
        cover1.position.set(-30, 3, 25);
        scene.add(cover1);
        objects.push(cover1);

        // Camouflaged surface cover 2 (cone)
        var coverGeom2 = new THREE.ConeGeometry(4, 5, 12);
        var coverMat2 = new THREE.MeshLambertMaterial({ color: 0x5a6a3a });
        var cover2 = new THREE.Mesh(coverGeom2, coverMat2);
        cover2.position.set(25, 2.5, -28);
        scene.add(cover2);
        objects.push(cover2);

        // Underground support pillar 1 (cylinder)
        var pillarGeom1 = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
        var pillarMat1 = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var pillar1 = new THREE.Mesh(pillarGeom1, pillarMat1);
        pillar1.position.set(-10, 10, -10);
        scene.add(pillar1);
        objects.push(pillar1);

        // Underground support pillar 2
        var pillarGeom2 = new THREE.CylinderGeometry(1.2, 1.2, 18, 8);
        var pillarMat2 = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var pillar2 = new THREE.Mesh(pillarGeom2, pillarMat2);
        pillar2.position.set(12, 9, 5);
        scene.add(pillar2);
        objects.push(pillar2);

        // Air ventilation sphere 1
        var ventGeom1 = new THREE.SphereGeometry(2, 8, 8);
        var ventMat1 = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var vent1 = new THREE.Mesh(ventGeom1, ventMat1);
        vent1.position.set(-22, 12, -15);
        scene.add(vent1);
        objects.push(vent1);

        // Air ventilation sphere 2
        var ventGeom2 = new THREE.SphereGeometry(1.8, 8, 8);
        var ventMat2 = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
        var vent2 = new THREE.Mesh(ventGeom2, ventMat2);
        vent2.position.set(20, 11, 22);
        scene.add(vent2);
        objects.push(vent2);

        // Overhead beam (box geometry as beam)
        var beamGeom = new THREE.BoxGeometry(50, 0.8, 1.2);
        var beamMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var beam = new THREE.Mesh(beamGeom, beamMat);
        beam.position.set(0, 18, 0);
        scene.add(beam);
        objects.push(beam);

        // Add lighting
        var ambientLight = new THREE.AmbientLight(0xcccccc);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var pointLight = new THREE.PointLight(0xffffff, 0.8);
        pointLight.position.set(0, 15, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        // Subtle animation of ventilation spheres
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
                objects[i].rotation.x += delta * 0.5;
                objects[i].rotation.y += delta * 0.3;
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
