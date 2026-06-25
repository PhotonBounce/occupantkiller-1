window.ScarbaCamp = (function() {
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
        // Cruach Scarba summit OP
        var summitBox = new THREE.Mesh(
            new THREE.BoxGeometry(8, 12, 8),
            new THREE.MeshLambertMaterial({ color: 0x4a5f4a })
        );
        summitBox.position.set(0, 6, 0);
        scene.add(summitBox);
        objects.push(summitBox);

        var radioMast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 1.2, 15, 8),
            new THREE.MeshLambertMaterial({ color: 0x333333 })
        );
        radioMast.position.set(2, 16, 1);
        scene.add(radioMast);
        objects.push(radioMast);

        var weatherSensor = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xcccccc })
        );
        weatherSensor.position.set(2, 23, 1);
        scene.add(weatherSensor);
        objects.push(weatherSensor);

        // Gulf of Corryvreckan whirlpool observation post
        var cliftopPost = new THREE.Mesh(
            new THREE.BoxGeometry(6, 10, 6),
            new THREE.MeshLambertMaterial({ color: 0x5a4f4a })
        );
        cliftopPost.position.set(-25, 5, -20);
        scene.add(cliftopPost);
        objects.push(cliftopPost);

        var sonarPod1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2a5a8a })
        );
        sonarPod1.position.set(-28, 2, -18);
        scene.add(sonarPod1);
        objects.push(sonarPod1);

        var sonarPod2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0x2a5a8a })
        );
        sonarPod2.position.set(-22, 2, -22);
        scene.add(sonarPod2);
        objects.push(sonarPod2);

        var detectionCablePoints = [
            new THREE.Vector3(-28, 2, -18),
            new THREE.Vector3(-22, 2, -22)
        ];
        var detectionCableGeometry = new THREE.BufferGeometry().setFromPoints(detectionCablePoints);
        var detectionCable = new THREE.LineSegments(
            detectionCableGeometry,
            new THREE.LineBasicMaterial({ color: 0x00ff00 })
        );
        scene.add(detectionCable);
        objects.push(detectionCable);

        // Crashed aircraft wreck salvage base
        var fuselageSec1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x8a7a6a })
        );
        fuselageSec1.position.set(20, 2, 15);
        scene.add(fuselageSec1);
        objects.push(fuselageSec1);

        var fuselageSec2 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 4, 8),
            new THREE.MeshLambertMaterial({ color: 0x8a7a6a })
        );
        fuselageSec2.position.set(20, 2, 28);
        scene.add(fuselageSec2);
        objects.push(fuselageSec2);

        var engineNacelle = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 3, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x5a5a5a })
        );
        engineNacelle.position.set(24, 3, 22);
        scene.add(engineNacelle);
        objects.push(engineNacelle);

        var equipmentCache = new THREE.Mesh(
            new THREE.BoxGeometry(4, 4, 5),
            new THREE.MeshLambertMaterial({ color: 0x6a6a6a })
        );
        equipmentCache.position.set(25, 2, 10);
        scene.add(equipmentCache);
        objects.push(equipmentCache);

        // Sea-level cave weapons storage
        var caveEntrance = new THREE.Mesh(
            new THREE.BoxGeometry(7, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0x3a3a3a })
        );
        caveEntrance.position.set(-20, 4, 25);
        scene.add(caveEntrance);
        objects.push(caveEntrance);

        var munitionsCrate1 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        munitionsCrate1.position.set(-22, 2, 27);
        scene.add(munitionsCrate1);
        objects.push(munitionsCrate1);

        var munitionsCrate2 = new THREE.Mesh(
            new THREE.BoxGeometry(2, 2, 2),
            new THREE.MeshLambertMaterial({ color: 0x4a4a4a })
        );
        munitionsCrate2.position.set(-18, 2, 27);
        scene.add(munitionsCrate2);
        objects.push(munitionsCrate2);

        var torchPost = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.8, 4, 6),
            new THREE.MeshLambertMaterial({ color: 0xaa8844 })
        );
        torchPost.position.set(-20, 2, 23);
        scene.add(torchPost);
        objects.push(torchPost);

        // Emergency submarine distress beacon
        var signalBuoy = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.8, 3, 8),
            new THREE.MeshLambertMaterial({ color: 0xff6644 })
        );
        signalBuoy.position.set(30, 1, -25);
        scene.add(signalBuoy);
        objects.push(signalBuoy);

        var markerFloat = new THREE.Mesh(
            new THREE.SphereGeometry(1, 8, 8),
            new THREE.MeshLambertMaterial({ color: 0xffaa00 })
        );
        markerFloat.position.set(30, 3, -25);
        scene.add(markerFloat);
        objects.push(markerFloat);

        var anchorCablePoints = [
            new THREE.Vector3(30, 1, -25),
            new THREE.Vector3(30, -5, -25)
        ];
        var anchorCableGeometry = new THREE.BufferGeometry().setFromPoints(anchorCablePoints);
        var anchorCable = new THREE.LineSegments(
            anchorCableGeometry,
            new THREE.LineBasicMaterial({ color: 0x4488ff })
        );
        scene.add(anchorCable);
        objects.push(anchorCable);

        // Deer stalking hide converted sniper nest
        var elevatedHide = new THREE.Mesh(
            new THREE.BoxGeometry(5, 3, 5),
            new THREE.MeshLambertMaterial({ color: 0x6a7a5a })
        );
        elevatedHide.position.set(-10, 8, 10);
        scene.add(elevatedHide);
        objects.push(elevatedHide);

        var camoTop = new THREE.Mesh(
            new THREE.ConeGeometry(3.5, 4, 8),
            new THREE.MeshLambertMaterial({ color: 0x5a6a4a })
        );
        camoTop.position.set(-10, 12, 10);
        scene.add(camoTop);
        objects.push(camoTop);

        var rangingWirePoints = [
            new THREE.Vector3(-10, 9, 10),
            new THREE.Vector3(5, 5, 15)
        ];
        var rangingWireGeometry = new THREE.BufferGeometry().setFromPoints(rangingWirePoints);
        var rangingWire = new THREE.LineSegments(
            rangingWireGeometry,
            new THREE.LineBasicMaterial({ color: 0xffff00 })
        );
        scene.add(rangingWire);
        objects.push(rangingWire);

        // Helicopter landing zone
        var hilltopPad = new THREE.Mesh(
            new THREE.BoxGeometry(12, 1, 12),
            new THREE.MeshLambertMaterial({ color: 0x888888 })
        );
        hilltopPad.position.set(10, 0.5, -10);
        scene.add(hilltopPad);
        objects.push(hilltopPad);

        var windIndicator = new THREE.Mesh(
            new THREE.ConeGeometry(2, 5, 8),
            new THREE.MeshLambertMaterial({ color: 0xffff00 })
        );
        windIndicator.position.set(15, 3, -10);
        scene.add(windIndicator);
        objects.push(windIndicator);

        var hMarkerPoint1 = new THREE.Vector3(5, 1, -10);
        var hMarkerPoint2 = new THREE.Vector3(15, 1, -10);
        var hMarkerGeometry1 = new THREE.BufferGeometry().setFromPoints([hMarkerPoint1, hMarkerPoint2]);
        var hMarker1 = new THREE.LineSegments(
            hMarkerGeometry1,
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        scene.add(hMarker1);
        objects.push(hMarker1);

        var hMarkerPoint3 = new THREE.Vector3(10, 1, -15);
        var hMarkerPoint4 = new THREE.Vector3(10, 1, -5);
        var hMarkerGeometry2 = new THREE.BufferGeometry().setFromPoints([hMarkerPoint3, hMarkerPoint4]);
        var hMarker2 = new THREE.LineSegments(
            hMarkerGeometry2,
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        scene.add(hMarker2);
        objects.push(hMarker2);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 25, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animation can be added here
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
