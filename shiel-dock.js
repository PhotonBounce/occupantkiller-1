window.ShielDock = (function() {
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
        buildDock();
    }

    function buildDock() {
        var lightA = new THREE.PointLight(0xffffff, 1.0, 100);
        lightA.position.set(20, 40, 20);
        scene.add(lightA);
        lights.push(lightA);

        var lightB = new THREE.AmbientLight(0x666666, 0.8);
        scene.add(lightB);
        lights.push(lightB);

        buildShielingHuts();
        buildSupplyDropZone();
        buildWeaponCrates();
        buildMountainBlockade();
        buildFuelDrums();
        buildParachutePacks();
        buildAntennaRelayTower();
        buildPerimeterFence();
    }

    function buildShielingHuts() {
        var hut1BoxGeom = new THREE.BoxGeometry(8, 6, 10);
        var hut1Mat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var hut1Box = new THREE.Mesh(hut1BoxGeom, hut1Mat);
        hut1Box.position.set(-25, 3, -20);
        scene.add(hut1Box);
        objects.push(hut1Box);

        var hut1RoofGeom = new THREE.ConeGeometry(5.5, 4, 12);
        var hut1RoofMat = new THREE.MeshLambertMaterial({ color: 0x556633 });
        var hut1Roof = new THREE.Mesh(hut1RoofGeom, hut1RoofMat);
        hut1Roof.position.set(-25, 8, -20);
        scene.add(hut1Roof);
        objects.push(hut1Roof);

        var hut2BoxGeom = new THREE.BoxGeometry(8, 6, 10);
        var hut2Mat = new THREE.MeshLambertMaterial({ color: 0x9b8365 });
        var hut2Box = new THREE.Mesh(hut2BoxGeom, hut2Mat);
        hut2Box.position.set(-10, 3, -22);
        scene.add(hut2Box);
        objects.push(hut2Box);

        var hut2RoofGeom = new THREE.ConeGeometry(5.5, 4, 12);
        var hut2RoofMat = new THREE.MeshLambertMaterial({ color: 0x446622 });
        var hut2Roof = new THREE.Mesh(hut2RoofGeom, hut2RoofMat);
        hut2Roof.position.set(-10, 8, -22);
        scene.add(hut2Roof);
        objects.push(hut2Roof);
    }

    function buildSupplyDropZone() {
        var padGeom = new THREE.BoxGeometry(20, 0.5, 20);
        var padMat = new THREE.MeshLambertMaterial({ color: 0xcccccc });
        var pad = new THREE.Mesh(padGeom, padMat);
        pad.position.set(5, 0.25, 0);
        scene.add(pad);
        objects.push(pad);

        var points = [
            new THREE.Vector3(-8, 0.5, 0),
            new THREE.Vector3(8, 0.5, 0),
            new THREE.Vector3(0, 0.5, -8),
            new THREE.Vector3(0, 0.5, 8)
        ];
        var linesGeom = new THREE.BufferGeometry().setFromPoints(points);
        var linesMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        var crossLines = new THREE.LineSegments(linesGeom, linesMat);
        crossLines.position.set(5, 1, 0);
        scene.add(crossLines);
        objects.push(crossLines);
    }

    function buildWeaponCrates() {
        var crateGeom = new THREE.BoxGeometry(4, 4, 4);
        var crateMat = new THREE.MeshLambertMaterial({ color: 0x555500 });

        var crate1 = new THREE.Mesh(crateGeom, crateMat);
        crate1.position.set(20, 2, -15);
        scene.add(crate1);
        objects.push(crate1);

        var crate2 = new THREE.Mesh(crateGeom, crateMat);
        crate2.position.set(20, 6, -15);
        scene.add(crate2);
        objects.push(crate2);

        var crate3 = new THREE.Mesh(crateGeom, crateMat);
        crate3.position.set(20, 10, -15);
        scene.add(crate3);
        objects.push(crate3);

        var crate4 = new THREE.Mesh(crateGeom, crateMat);
        crate4.position.set(25, 2, -15);
        scene.add(crate4);
        objects.push(crate4);
    }

    function buildMountainBlockade() {
        var boulder1Geom = new THREE.SphereGeometry(3, 16, 16);
        var boulderMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
        var boulder1 = new THREE.Mesh(boulder1Geom, boulderMat);
        boulder1.position.set(-30, 3, 15);
        scene.add(boulder1);
        objects.push(boulder1);

        var boulder2Geom = new THREE.SphereGeometry(2.5, 16, 16);
        var boulder2 = new THREE.Mesh(boulder2Geom, boulderMat);
        boulder2.position.set(-25, 2.5, 18);
        scene.add(boulder2);
        objects.push(boulder2);

        var bargeGeom = new THREE.BoxGeometry(15, 2, 3);
        var bargeMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var barge = new THREE.Mesh(bargeGeom, bargeMat);
        barge.position.set(-27, 1, 20);
        scene.add(barge);
        objects.push(barge);
    }

    function buildFuelDrums() {
        var drumGeom = new THREE.CylinderGeometry(1.5, 1.5, 3, 12);
        var drumMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });

        var drum1 = new THREE.Mesh(drumGeom, drumMat);
        drum1.position.set(15, 1.5, 10);
        scene.add(drum1);
        objects.push(drum1);

        var drum2 = new THREE.Mesh(drumGeom, drumMat);
        drum2.position.set(20, 1.5, 10);
        scene.add(drum2);
        objects.push(drum2);

        var drum3 = new THREE.Mesh(drumGeom, drumMat);
        drum3.position.set(25, 1.5, 10);
        scene.add(drum3);
        objects.push(drum3);

        var drum4 = new THREE.Mesh(drumGeom, drumMat);
        drum4.position.set(17.5, 4.5, 10);
        scene.add(drum4);
        objects.push(drum4);
    }

    function buildParachutePacks() {
        var packGeom = new THREE.SphereGeometry(2, 16, 16);
        var packMat = new THREE.MeshLambertMaterial({ color: 0xcccc00 });

        var pack1 = new THREE.Mesh(packGeom, packMat);
        pack1.position.set(-15, 2, 5);
        scene.add(pack1);
        objects.push(pack1);

        var pack2 = new THREE.Mesh(packGeom, packMat);
        pack2.position.set(-10, 2, 8);
        scene.add(pack2);
        objects.push(pack2);

        var pack3 = new THREE.Mesh(packGeom, packMat);
        pack3.position.set(-5, 2, 5);
        scene.add(pack3);
        objects.push(pack3);
    }

    function buildAntennaRelayTower() {
        var mastGeom = new THREE.CylinderGeometry(0.8, 0.8, 25, 12);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x888888 });
        var mast = new THREE.Mesh(mastGeom, mastMat);
        mast.position.set(0, 12.5, -25);
        scene.add(mast);
        objects.push(mast);

        var armGeom = new THREE.BoxGeometry(12, 1, 1);
        var armMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var arm1 = new THREE.Mesh(armGeom, armMat);
        arm1.position.set(0, 16, -25);
        scene.add(arm1);
        objects.push(arm1);

        var arm2 = new THREE.Mesh(armGeom, armMat);
        arm2.position.set(0, 20, -25);
        scene.add(arm2);
        objects.push(arm2);
    }

    function buildPerimeterFence() {
        var postGeom = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x666666 });

        var post1 = new THREE.Mesh(postGeom, postMat);
        post1.position.set(-32, 1.5, -32);
        scene.add(post1);
        objects.push(post1);

        var post2 = new THREE.Mesh(postGeom, postMat);
        post2.position.set(32, 1.5, -32);
        scene.add(post2);
        objects.push(post2);

        var post3 = new THREE.Mesh(postGeom, postMat);
        post3.position.set(32, 1.5, 32);
        scene.add(post3);
        objects.push(post3);

        var fencePoints = [
            new THREE.Vector3(-32, 2, -32),
            new THREE.Vector3(32, 2, -32),
            new THREE.Vector3(32, 2, 32),
            new THREE.Vector3(-32, 2, 32),
            new THREE.Vector3(-32, 2, -32)
        ];
        var fenceGeom = new THREE.BufferGeometry().setFromPoints(fencePoints);
        var fenceMat = new THREE.LineBasicMaterial({ color: 0x333333, linewidth: 1 });
        var fenceWire = new THREE.LineSegments(fenceGeom, fenceMat);
        scene.add(fenceWire);
        objects.push(fenceWire);
    }

    function update(delta) {
        if (objects.length > 0) {
            for (var i = 0; i < objects.length; i++) {
                if (objects[i] && objects[i].rotation) {
                    objects[i].rotation.y += delta * 0.05;
                }
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
