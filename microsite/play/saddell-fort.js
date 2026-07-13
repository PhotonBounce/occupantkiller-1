window.SaddellFort = (function() {
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
        // Saddell Abbey Nave (main building)
        var naveGeom = new THREE.BoxGeometry(15, 12, 25);
        var naveMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var nave = new THREE.Mesh(naveGeom, naveMat);
        nave.position.set(-20, 6, 0);
        scene.add(nave);
        objects.push(nave);

        // Saddell Abbey Cloisters (courtyard structure)
        var cloisterGeom = new THREE.BoxGeometry(18, 8, 18);
        var cloisterMat = new THREE.MeshLambertMaterial({ color: 0xA0826D });
        var cloister = new THREE.Mesh(cloisterGeom, cloisterMat);
        cloister.position.set(-20, 4, -15);
        scene.add(cloister);
        objects.push(cloister);

        // Chapter House (circular, use cylinder)
        var chapterGeom = new THREE.CylinderGeometry(8, 8, 10, 16);
        var chapterMat = new THREE.MeshLambertMaterial({ color: 0x9B7D6D });
        var chapter = new THREE.Mesh(chapterGeom, chapterMat);
        chapter.position.set(-5, 5, -10);
        scene.add(chapter);
        objects.push(chapter);

        // Saddell Castle Tower House
        var towerGeom = new THREE.BoxGeometry(10, 16, 10);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var tower = new THREE.Mesh(towerGeom, towerMat);
        tower.position.set(15, 8, 5);
        scene.add(tower);
        objects.push(tower);

        // Castle Courtyard
        var courtGeom = new THREE.BoxGeometry(20, 2, 20);
        var courtMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var court = new THREE.Mesh(courtGeom, courtMat);
        court.position.set(15, 1, 5);
        scene.add(court);
        objects.push(court);

        // Coastal Battery Gun Emplacement
        var emplacementGeom = new THREE.BoxGeometry(12, 6, 14);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
        emplacement.position.set(25, 3, -20);
        scene.add(emplacement);
        objects.push(emplacement);

        // Gun Barrel (pointing seaward)
        var barrelGeom = new THREE.CylinderGeometry(1, 1, 18, 12);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var barrel = new THREE.Mesh(barrelGeom, barrelMat);
        barrel.position.set(25, 7, -20);
        barrel.rotation.z = Math.PI / 6;
        scene.add(barrel);
        objects.push(barrel);

        // Underwater Cave Mouth (below cliff edge)
        var caveGeom = new THREE.BoxGeometry(10, 8, 12);
        var caveMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
        var cave = new THREE.Mesh(caveGeom, caveMat);
        cave.position.set(30, -2, 25);
        scene.add(cave);
        objects.push(cave);

        // Beach Landing Obstacle - Hedgehog 1
        var hedgehog1Geom = new THREE.BoxGeometry(3, 3, 3);
        var hedgehogMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var hedgehog1 = new THREE.Mesh(hedgehog1Geom, hedgehogMat);
        hedgehog1.position.set(-25, 1, 20);
        scene.add(hedgehog1);
        objects.push(hedgehog1);

        // Beach Landing Obstacle - Hedgehog 2
        var hedgehog2 = new THREE.Mesh(hedgehog1Geom, hedgehogMat);
        hedgehog2.position.set(-15, 1, 22);
        scene.add(hedgehog2);
        objects.push(hedgehog2);

        // Beach Stakes in Sand (cylinder)
        var stakeGeom = new THREE.CylinderGeometry(0.4, 0.4, 4, 8);
        var stakeMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var stake1 = new THREE.Mesh(stakeGeom, stakeMat);
        stake1.position.set(-10, 2, 25);
        scene.add(stake1);
        objects.push(stake1);

        // Sound Detector Post - Microphone Mast
        var mastGeom = new THREE.CylinderGeometry(0.6, 0.6, 14, 10);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(5, 7, 28);
        scene.add(mast);
        objects.push(mast);

        // Sound Detector Operations Hut
        var hutGeom = new THREE.BoxGeometry(8, 6, 8);
        var hutMat = new THREE.MeshLambertMaterial({ color: 0x606060 });
        var hut = new THREE.Mesh(hutGeom, hutMat);
        hut.position.set(5, 3, 28);
        scene.add(hut);
        objects.push(hut);

        // Monastic Fish Pond (rectangular box at base)
        var pondGeom = new THREE.BoxGeometry(16, 1, 12);
        var pondMat = new THREE.MeshLambertMaterial({ color: 0x4A6FA5 });
        var pond = new THREE.Mesh(pondGeom, pondMat);
        pond.position.set(-30, 0.5, 10);
        scene.add(pond);
        objects.push(pond);

        // Oil Drums on Pontoon (spheres on box)
        var drumGeom = new THREE.SphereGeometry(1.5, 12, 12);
        var drumMat = new THREE.MeshLambertMaterial({ color: 0xFF6B00 });
        var drum1 = new THREE.Mesh(drumGeom, drumMat);
        drum1.position.set(-32, 1.5, 8);
        scene.add(drum1);
        objects.push(drum1);

        var drum2 = new THREE.Mesh(drumGeom, drumMat);
        drum2.position.set(-30, 1.5, 8);
        scene.add(drum2);
        objects.push(drum2);

        var drum3 = new THREE.Mesh(drumGeom, drumMat);
        drum3.position.set(-28, 1.5, 8);
        scene.add(drum3);
        objects.push(drum3);

        // Pontoon (support box for drums)
        var pontoonGeom = new THREE.BoxGeometry(8, 1.5, 5);
        var pontoonMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var pontoon = new THREE.Mesh(pontoonGeom, pontoonMat);
        pontoon.position.set(-30, 0.75, 8);
        scene.add(pontoon);
        objects.push(pontoon);

        // Cliff face (tall box)
        var cliffGeom = new THREE.BoxGeometry(8, 20, 2);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x705040 });
        var cliff = new THREE.Mesh(cliffGeom, cliffMat);
        cliff.position.set(30, 10, 20);
        scene.add(cliff);
        objects.push(cliff);

        // Add lights
        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        light1.position.set(20, 30, 20);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xFFFFFF, 0.4);
        scene.add(light2);
        lights.push(light2);
    }

    function update(delta) {
        // Animation can be added here if needed
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
