window.CampbeltownBase = (function() {
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
        buildBase();
    }

    function buildBase() {
        // Campbeltown Loch naval patrol pier (box stone pier)
        var pierGeo = new THREE.BoxGeometry(20, 2, 8);
        var pierMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var pier = new THREE.Mesh(pierGeo, pierMat);
        pier.position.set(-25, 1, -20);
        scene.add(pier);
        objects.push(pier);

        // Campbeltown Loch patrol boat hull (cylinder)
        var boatGeo = new THREE.CylinderGeometry(3, 3.5, 12, 16);
        var boatMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
        var boat = new THREE.Mesh(boatGeo, boatMat);
        boat.position.set(-20, 2, -15);
        boat.rotation.z = Math.PI / 2;
        scene.add(boat);
        objects.push(boat);

        // Mooring buoys (spheres)
        var buoyGeo = new THREE.SphereGeometry(1.2, 16, 16);
        var buoyMat = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var buoy1 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy1.position.set(-15, 0.5, -18);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoyGeo, buoyMat);
        buoy2.position.set(-28, 0.5, -22);
        scene.add(buoy2);
        objects.push(buoy2);

        // LineSegments net cables
        var cableGeo = new THREE.BufferGeometry();
        var cablePts = new Float32Array([
            -15, 0.5, -18,
            -28, 0.5, -22,
            -20, 2, -15,
            -25, 1, -20
        ]);
        cableGeo.setAttribute('position', new THREE.BufferAttribute(cablePts, 3));
        var cableMat = new THREE.LineBasicMaterial({ color: 0x808080 });
        var cables = new THREE.LineSegments(cableGeo, cableMat);
        scene.add(cables);
        objects.push(cables);

        // RAF Machrihanish airbase perimeter fence (box)
        var fenceGeo = new THREE.BoxGeometry(1.5, 4, 35);
        var fenceMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
        var fence = new THREE.Mesh(fenceGeo, fenceMat);
        fence.position.set(10, 2, 0);
        scene.add(fence);
        objects.push(fence);

        // Guard tower (cylinder)
        var towerGeo = new THREE.CylinderGeometry(2.5, 3, 8, 12);
        var towerMat = new THREE.MeshLambertMaterial({ color: 0x556B2F });
        var tower = new THREE.Mesh(towerGeo, towerMat);
        tower.position.set(15, 4, 5);
        scene.add(tower);
        objects.push(tower);

        // Guard checkpoint (box)
        var checkGeo = new THREE.BoxGeometry(6, 3, 5);
        var checkMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var checkpoint = new THREE.Mesh(checkGeo, checkMat);
        checkpoint.position.set(12, 1.5, -8);
        scene.add(checkpoint);
        objects.push(checkpoint);

        // Campbeltown Cross medieval town cross monument (box)
        var crossGeo = new THREE.BoxGeometry(3, 7, 0.8);
        var crossMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var cross = new THREE.Mesh(crossGeo, crossMat);
        cross.position.set(-5, 3.5, 15);
        scene.add(cross);
        objects.push(cross);

        // Fortified market square (box)
        var squareGeo = new THREE.BoxGeometry(18, 0.5, 18);
        var squareMat = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var square = new THREE.Mesh(squareGeo, squareMat);
        square.position.set(-5, 0.25, 15);
        scene.add(square);
        objects.push(square);

        // Signal mast (cylinder)
        var mastGeo = new THREE.CylinderGeometry(0.8, 0.8, 10, 8);
        var mastMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var mast = new THREE.Mesh(mastGeo, mastMat);
        mast.position.set(-5, 5, 15);
        scene.add(mast);
        objects.push(mast);

        // Davaar Island lighthouse tower (box)
        var lightGeo = new THREE.BoxGeometry(4, 12, 4);
        var lightMat = new THREE.MeshLambertMaterial({ color: 0xFFFFFF });
        var lighthouse = new THREE.Mesh(lightGeo, lightMat);
        lighthouse.position.set(25, 6, 10);
        scene.add(lighthouse);
        objects.push(lighthouse);

        // Fog signal dome (sphere)
        var domeGeo = new THREE.SphereGeometry(2, 16, 16);
        var domeMat = new THREE.MeshLambertMaterial({ color: 0xB22222 });
        var dome = new THREE.Mesh(domeGeo, domeMat);
        dome.position.set(25, 13, 10);
        scene.add(dome);
        objects.push(dome);

        // Cable net (LineSegments)
        var netGeo = new THREE.BufferGeometry();
        var netPts = new Float32Array([
            25, 13, 10,
            25, 6, 10,
            27, 6, 12,
            23, 6, 8
        ]);
        netGeo.setAttribute('position', new THREE.BufferAttribute(netPts, 3));
        var netMat = new THREE.LineBasicMaterial({ color: 0x666666 });
        var net = new THREE.LineSegments(netGeo, netMat);
        scene.add(net);
        objects.push(net);

        // Saddell Castle ruined medieval tower (box)
        var castleGeo = new THREE.BoxGeometry(5, 10, 5);
        var castleMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var castle = new THREE.Mesh(castleGeo, castleMat);
        castle.position.set(-20, 5, 20);
        scene.add(castle);
        objects.push(castle);

        // Castle enclosure wall (box)
        var wallGeo = new THREE.BoxGeometry(1.5, 3.5, 22);
        var wallMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        var wall = new THREE.Mesh(wallGeo, wallMat);
        wall.position.set(-20, 1.75, 20);
        scene.add(wall);
        objects.push(wall);

        // Castle turret cap (cone)
        var turretGeo = new THREE.ConeGeometry(3, 4, 8);
        var turretMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
        var turret = new THREE.Mesh(turretGeo, turretMat);
        turret.position.set(-20, 12, 20);
        scene.add(turret);
        objects.push(turret);

        // Kintyre Way narrow glen track (box)
        var trackGeo = new THREE.BoxGeometry(4, 0.3, 16);
        var trackMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var track = new THREE.Mesh(trackGeo, trackMat);
        track.position.set(0, 0.15, -5);
        scene.add(track);
        objects.push(track);

        // IED charges (spheres)
        var iedGeo = new THREE.SphereGeometry(0.8, 12, 12);
        var iedMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
        var ied1 = new THREE.Mesh(iedGeo, iedMat);
        ied1.position.set(-2, 0.8, -8);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedGeo, iedMat);
        ied2.position.set(3, 0.8, -2);
        scene.add(ied2);
        objects.push(ied2);

        // Tripwire (LineSegments)
        var wireGeo = new THREE.BufferGeometry();
        var wirePts = new Float32Array([
            -2, 0.8, -8,
            3, 0.8, -2,
            0, 0.8, -12
        ]);
        wireGeo.setAttribute('position', new THREE.BufferAttribute(wirePts, 3));
        var wireMat = new THREE.LineBasicMaterial({ color: 0x8B0000 });
        var wire = new THREE.LineSegments(wireGeo, wireMat);
        scene.add(wire);
        objects.push(wire);

        // Southend shore battery clifftop emplacement (box)
        var batteryGeo = new THREE.BoxGeometry(12, 2, 8);
        var batteryMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var battery = new THREE.Mesh(batteryGeo, batteryMat);
        battery.position.set(20, 8, -15);
        scene.add(battery);
        objects.push(battery);

        // Gun barrel (cylinder)
        var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 6, 8);
        var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F2F2F });
        var barrel = new THREE.Mesh(barrelGeo, barrelMat);
        barrel.position.set(20, 10, -12);
        barrel.rotation.z = Math.PI / 4;
        scene.add(barrel);
        objects.push(barrel);

        // Magazine (box)
        var magGeo = new THREE.BoxGeometry(5, 3, 6);
        var magMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
        var magazine = new THREE.Mesh(magGeo, magMat);
        magazine.position.set(20, 1.5, -18);
        scene.add(magazine);
        objects.push(magazine);

        // Campbeltown Museum HQ Victorian building (box)
        var museumGeo = new THREE.BoxGeometry(8, 6, 10);
        var museumMat = new THREE.MeshLambertMaterial({ color: 0xCD853F });
        var museum = new THREE.Mesh(museumGeo, museumMat);
        museum.position.set(-10, 3, -25);
        scene.add(museum);
        objects.push(museum);

        // Secure annexe (box)
        var annexGeo = new THREE.BoxGeometry(5, 4, 6);
        var annexMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var annex = new THREE.Mesh(annexGeo, annexMat);
        annex.position.set(-5, 2, -28);
        scene.add(annex);
        objects.push(annex);

        // Water tower (cylinder)
        var waterGeo = new THREE.CylinderGeometry(2, 2.5, 7, 12);
        var waterMat = new THREE.MeshLambertMaterial({ color: 0x4A7C7E });
        var water = new THREE.Mesh(waterGeo, waterMat);
        water.position.set(-15, 3.5, -30);
        scene.add(water);
        objects.push(water);

        // Add lights
        var ambLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambLight);
        lights.push(ambLight);

        var dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(30, 20, 30);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Animation loop - boats, masts can rotate subtly
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].userData && objects[i].userData.animate) {
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
