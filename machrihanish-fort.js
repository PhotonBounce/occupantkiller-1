window.MachrihanishFort = (function() {
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
        // Machrihanish runway complex
        var runwayGeo = new THREE.BoxGeometry(40, 1, 8);
        var runwayMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var runway = new THREE.Mesh(runwayGeo, runwayMat);
        runway.position.set(-20, 0.5, 0);
        scene.add(runway);
        objects.push(runway);

        var towerGeo = new THREE.BoxGeometry(4, 12, 4);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(-15, 6, 5);
        scene.add(tower);
        objects.push(tower);

        var tankerGeo = new THREE.CylinderGeometry(2, 2, 6, 8);
        var tankerMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        var tanker = new THREE.Mesh(tankerGeo, tankerMat);
        tanker.position.set(-10, 3, 8);
        scene.add(tanker);
        objects.push(tanker);

        // USAF underground bunker network
        var shelterGeo = new THREE.BoxGeometry(8, 4, 6);
        var shelterMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var shelter = new THREE.Mesh(shelterGeo, shelterMat);
        shelter.position.set(5, 2, -12);
        scene.add(shelter);
        objects.push(shelter);

        var doorsGeo = new THREE.BoxGeometry(3, 4, 0.5);
        var doorsMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var doors = new THREE.Mesh(doorsGeo, doorsMat);
        doors.position.set(8, 2, -10);
        scene.add(doors);
        objects.push(doors);

        var ventGeo = new THREE.CylinderGeometry(1.5, 1.5, 8, 6);
        var ventMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(12, 4, -15);
        scene.add(vent);
        objects.push(vent);

        // Westport Beach perimeter defense
        var seawallGeo = new THREE.BoxGeometry(35, 3, 1);
        var seawallMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        var seawall = new THREE.Mesh(seawallGeo, seawallMat);
        seawall.position.set(0, 1.5, 25);
        scene.add(seawall);
        objects.push(seawall);

        var mineGeo = new THREE.SphereGeometry(1, 6, 6);
        var mineMat = new THREE.MeshLambertMaterial({ color: 0x222222 });
        var mine = new THREE.Mesh(mineGeo, mineMat);
        mine.position.set(-8, 0.5, 28);
        scene.add(mine);
        objects.push(mine);

        var mine2 = new THREE.Mesh(mineGeo, mineMat);
        mine2.position.set(8, 0.5, 28);
        scene.add(mine2);
        objects.push(mine2);

        var cablePoints = [new THREE.Vector3(-20, 2, 25), new THREE.Vector3(20, 2, 25)];
        var cableGeo = new THREE.BufferGeometry().setFromPoints(cablePoints);
        var cableMat = new THREE.LineBasicMaterial({ color: 0x999999, linewidth: 2 });
        var cable = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cable);
        objects.push(cable);

        // Ballygroggan farmstead OP
        var farmhouseGeo = new THREE.BoxGeometry(6, 4, 5);
        var farmhouseMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var farmhouse = new THREE.Mesh(farmhouseGeo, farmhouseMat);
        farmhouse.position.set(-25, 2, 10);
        scene.add(farmhouse);
        objects.push(farmhouse);

        var mastGeo = new THREE.CylinderGeometry(0.4, 0.4, 10, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-22, 5, 12);
        scene.add(mast);
        objects.push(mast);

        var sensorGeo = new THREE.SphereGeometry(0.8, 6, 6);
        var sensorMat = new THREE.MeshLambertMaterial({ color: 0x00aa00 });
        var sensor = new THREE.Mesh(sensorGeo, sensorMat);
        sensor.position.set(-22, 10.5, 12);
        scene.add(sensor);
        objects.push(sensor);

        // Machrihanish Bay coastal battery
        var emplacementGeo = new THREE.BoxGeometry(10, 2, 8);
        var emplacementMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var emplacement = new THREE.Mesh(emplacementGeo, emplacementMat);
        emplacement.position.set(20, 1, -20);
        scene.add(emplacement);
        objects.push(emplacement);

        var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.rotation.z = Math.PI / 4;
        barrel.position.set(22, 4, -18);
        scene.add(barrel);
        objects.push(barrel);

        var magazineGeo = new THREE.BoxGeometry(7, 3, 6);
        var magazineMat = new THREE.MeshLambertMaterial({ color: 0x666666 });
        var magazine = new THREE.Mesh(magazineGeo, magazineMat);
        magazine.position.set(16, 1.5, -25);
        scene.add(magazine);
        objects.push(magazine);

        // Moss Road checkpoint
        var barrierGeo = new THREE.BoxGeometry(2, 1.5, 0.5);
        var barrierMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
        var barrier = new THREE.Mesh(barrierGeo, barrierMat);
        barrier.position.set(25, 0.75, -8);
        scene.add(barrier);
        objects.push(barrier);

        var watchtowerGeo = new THREE.CylinderGeometry(2, 2.5, 8, 8);
        var watchtowerMat = new THREE.MeshLambertMaterial({ color: 0xbebebe });
        var watchtower = new THREE.Mesh(watchtowerGeo, watchtowerMat);
        watchtower.position.set(28, 4, -5);
        scene.add(watchtower);
        objects.push(watchtower);

        var sandbagGeo = new THREE.BoxGeometry(3, 1, 2);
        var sandbagMat = new THREE.MeshLambertMaterial({ color: 0xcc9900 });
        var sandbag = new THREE.Mesh(sandbagGeo, sandbagMat);
        sandbag.position.set(22, 0.5, -3);
        scene.add(sandbag);
        objects.push(sandbag);

        // Mull of Kintyre relay
        var shelterGeo2 = new THREE.BoxGeometry(5, 3, 4);
        var shelterMat2 = new THREE.MeshLambertMaterial({ color: 0x777777 });
        var shelter2 = new THREE.Mesh(shelterGeo2, shelterMat2);
        shelter2.position.set(-18, 1.5, -28);
        scene.add(shelter2);
        objects.push(shelter2);

        var mastGeo2 = new THREE.CylinderGeometry(0.5, 0.5, 14, 8);
        var mastMat2 = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var mast2 = new THREE.Mesh(mastGeo2, mastMat2);
        mast2.position.set(-15, 7, -26);
        scene.add(mast2);
        objects.push(mast2);

        var radomeGeo = new THREE.SphereGeometry(2, 6, 6);
        var radiusMat = new THREE.MeshLambertMaterial({ color: 0xdddddd });
        var radome = new THREE.Mesh(radomeGeo, radiusMat);
        radome.position.set(-15, 14, -26);
        scene.add(radome);
        objects.push(radome);

        // Tangy Loch valley ambush
        var trackGeo = new THREE.BoxGeometry(3, 0.2, 20);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x664422 });
        var track = new THREE.Mesh(trackGeo, trackMat);
        track.position.set(-8, 0.1, 5);
        scene.add(track);
        objects.push(track);

        var iedGeo = new THREE.SphereGeometry(0.6, 6, 6);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x440000 });
        var ied = new THREE.Mesh(iedGeo, iedMat);
        ied.position.set(-7, 0.3, 8);
        scene.add(ied);
        objects.push(ied);

        var wirePoints = [new THREE.Vector3(-10, 0.5, 12), new THREE.Vector3(10, 0.5, 12)];
        var wireGeo = new THREE.BufferGeometry().setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 });
        var wire = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 40, 30);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate objects if needed
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].rotation) {
                objects[i].rotation.y += delta * 0.1;
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

    return { init: init, update: update, reset: reset };
}());
