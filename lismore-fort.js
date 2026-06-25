window.LismoreFort = (function() {
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
        var lightA = new THREE.PointLight(0xffffff, 1, 100);
        lightA.position.set(0, 20, 0);
        scene.add(lightA);
        lights.push(lightA);

        var lightB = new THREE.DirectionalLight(0xffffff, 0.8);
        lightB.position.set(15, 15, 15);
        scene.add(lightB);
        lights.push(lightB);

        // Limestone island terrain base
        var islandGeo = new THREE.BoxGeometry(50, 3, 50);
        var islandMat = new THREE.MeshLambertMaterial({ color: 0xccbb99 });
        var island = new THREE.Mesh(islandGeo, islandMat);
        island.position.set(0, -2, 0);
        scene.add(island);
        objects.push(island);

        // Tirefour Castle broch - cylinder tower
        var brochGeo = new THREE.CylinderGeometry(5, 5.5, 12, 16);
        var brochMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var broch = new THREE.Mesh(brochGeo, brochMat);
        broch.position.set(-20, 6, -15);
        scene.add(broch);
        objects.push(broch);

        // Tirefour outer stone walls
        var outerWallGeo = new THREE.BoxGeometry(20, 4, 20);
        var outerWallMat = new THREE.MeshLambertMaterial({ color: 0x9d8b7e });
        var outerWall = new THREE.Mesh(outerWallGeo, outerWallMat);
        outerWall.position.set(-20, 2, -15);
        scene.add(outerWall);
        objects.push(outerWall);

        // Cathedral ruin - nave
        var naveGeo = new THREE.BoxGeometry(12, 8, 20);
        var naveMat = new THREE.MeshLambertMaterial({ color: 0xa0a0a0 });
        var nave = new THREE.Mesh(naveGeo, naveMat);
        nave.position.set(15, 4, -10);
        scene.add(nave);
        objects.push(nave);

        // Cathedral chapter house
        var chapterGeo = new THREE.BoxGeometry(10, 6, 10);
        var chapterMat = new THREE.MeshLambertMaterial({ color: 0x999999 });
        var chapter = new THREE.Mesh(chapterGeo, chapterMat);
        chapter.position.set(25, 3, -8);
        scene.add(chapter);
        objects.push(chapter);

        // Cathedral bell tower stub
        var bellGeo = new THREE.CylinderGeometry(3, 3.2, 7, 12);
        var bellMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var bell = new THREE.Mesh(bellGeo, bellMat);
        bell.position.set(15, 5, -22);
        scene.add(bell);
        objects.push(bell);

        // Achnacroish terminal building
        var terminalGeo = new THREE.BoxGeometry(14, 5, 10);
        var terminalMat = new THREE.MeshLambertMaterial({ color: 0xb8860b });
        var terminal = new THREE.Mesh(terminalGeo, terminalMat);
        terminal.position.set(-15, 2.5, 20);
        scene.add(terminal);
        objects.push(terminal);

        // Fast patrol boat
        var boatGeo = new THREE.BoxGeometry(6, 2, 12);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x001f3f });
        var boat = new THREE.Mesh(boatGeo, boatMat);
        boat.position.set(-8, 1, 28);
        scene.add(boat);
        objects.push(boat);

        // Quayside crane
        var craneGeo = new THREE.CylinderGeometry(1.5, 1.8, 15, 8);
        var craneMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var crane = new THREE.Mesh(craneGeo, craneMat);
        crane.position.set(-22, 7.5, 22);
        scene.add(crane);
        objects.push(crane);

        // Port Ramsay clifftop post
        var cliffGeo = new THREE.BoxGeometry(6, 4, 6);
        var cliffMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var cliff = new THREE.Mesh(cliffGeo, cliffMat);
        cliff.position.set(28, 2, 15);
        scene.add(cliff);
        objects.push(cliff);

        // Boom across narrows (LineSegments)
        var boomGeo = new THREE.BufferGeometry();
        var boomPoints = [
            new THREE.Vector3(22, 0.5, 10),
            new THREE.Vector3(32, 0.5, 12)
        ];
        boomGeo.setFromPoints(boomPoints);
        var boomMat = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
        var boom = new THREE.LineSegments(boomGeo, boomMat);
        scene.add(boom);
        objects.push(boom);

        // Buoy markers
        var buoyGeo = new THREE.SphereGeometry(1, 8, 8);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xffff00 });
        var buoy1 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy1.position.set(22, 0, 10);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy2.position.set(32, 0, 12);
        scene.add(buoy2);
        objects.push(buoy2);

        // Limestone quarry face
        var quarryFaceGeo = new THREE.BoxGeometry(16, 10, 3);
        var quarryMat = new THREE.MeshLambertMaterial({ color: 0xd3d3d3 });
        var quarryFace = new THREE.Mesh(quarryFaceGeo, quarryMat);
        quarryFace.position.set(-28, 5, -28);
        scene.add(quarryFace);
        objects.push(quarryFace);

        // Magazine storage
        var magGeo = new THREE.BoxGeometry(8, 5, 8);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x556b2f });
        var mag = new THREE.Mesh(magGeo, magMat);
        mag.position.set(-20, 2.5, -30);
        scene.add(mag);
        objects.push(mag);

        // Ventilation pipe
        var ventGeo = new THREE.CylinderGeometry(1, 1.2, 6, 8);
        var ventMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
        var vent = new THREE.Mesh(ventGeo, ventMat);
        vent.position.set(-25, 3, -35);
        scene.add(vent);
        objects.push(vent);

        // Hilltop observation post
        var obsGeo = new THREE.BoxGeometry(7, 4, 7);
        var obsMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var obs = new THREE.Mesh(obsGeo, obsMat);
        obs.position.set(10, 2, -28);
        scene.add(obs);
        objects.push(obs);

        // Fire control mast
        var mastGeo = new THREE.CylinderGeometry(0.8, 1, 14, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(10, 7, -28);
        scene.add(mast);
        objects.push(mast);

        // Ranging wires
        var wireGeo = new THREE.BufferGeometry();
        var wirePoints = [
            new THREE.Vector3(10, 14, -28),
            new THREE.Vector3(15, 12, -22)
        ];
        wireGeo.setFromPoints(wirePoints);
        var wireMat = new THREE.LineBasicMaterial({ color: 0x228b22, linewidth: 1 });
        var wire = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Drove road terrain
        var droveGeo = new THREE.BoxGeometry(4, 0.5, 24);
        var droveMat = new THREE.MeshLambertMaterial({ color: 0x8b7765 });
        var drove = new THREE.Mesh(droveGeo, droveMat);
        drove.position.set(-2, 0.2, 0);
        scene.add(drove);
        objects.push(drove);

        // IED charges buried
        var chargeGeo = new THREE.SphereGeometry(0.8, 8, 8);
        var chargeMat = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var charge1 = new THREE.Mesh(chargeGeo, chargeMat);
        charge1.position.set(-2, 0.5, -5);
        scene.add(charge1);
        objects.push(charge1);

        var charge2 = new THREE.Mesh(chargeGeo, chargeMat);
        charge2.position.set(-2, 0.5, 5);
        scene.add(charge2);
        objects.push(charge2);

        // Command wire
        var cmdWireGeo = new THREE.BufferGeometry();
        var cmdWirePoints = [
            new THREE.Vector3(-2, 0.8, -5),
            new THREE.Vector3(-2, 0.8, 5)
        ];
        cmdWireGeo.setFromPoints(cmdWirePoints);
        var cmdWireMat = new THREE.LineBasicMaterial({ color: 0xff6b6b, linewidth: 2 });
        var cmdWire = new THREE.LineSegments(cmdWireGeo, cmdWireMat);
        scene.add(cmdWire);
        objects.push(cmdWire);
    }

    function update(delta) {
        // Animation frame updates can be added here
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
