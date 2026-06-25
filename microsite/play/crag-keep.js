window.CragKeep = (function() {
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
        buildKeep();
    }

    function buildKeep() {
        // Sheer cliff face - tall stacked box layers with offset/jagged edges
        var cliffMat1 = new THREE.MeshLambertMaterial({ color: 0x6b5a47 });
        var cliffMat2 = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var cliffMat3 = new THREE.MeshLambertMaterial({ color: 0x7a6655 });

        // Base cliff layer 1
        var cliff1Geo = new THREE.BoxGeometry(60, 20, 40);
        var cliff1 = new THREE.Mesh(cliff1Geo, cliffMat1);
        cliff1.position.set(0, 10, 0);
        cliff1.castShadow = true;
        cliff1.receiveShadow = true;
        scene.add(cliff1);
        objects.push(cliff1);

        // Cliff layer 2 - offset to create jagged edge
        var cliff2Geo = new THREE.BoxGeometry(50, 25, 35);
        var cliff2 = new THREE.Mesh(cliff2Geo, cliffMat2);
        cliff2.position.set(5, 35, -3);
        cliff2.castShadow = true;
        cliff2.receiveShadow = true;
        scene.add(cliff2);
        objects.push(cliff2);

        // Cliff layer 3 - further offset
        var cliff3Geo = new THREE.BoxGeometry(45, 22, 32);
        var cliff3 = new THREE.Mesh(cliff3Geo, cliffMat3);
        cliff3.position.set(-8, 58, 4);
        cliff3.castShadow = true;
        cliff3.receiveShadow = true;
        scene.add(cliff3);
        objects.push(cliff3);

        // Cliff layer 4 - summit
        var cliff4Geo = new THREE.BoxGeometry(40, 18, 28);
        var cliff4 = new THREE.Mesh(cliff4Geo, cliffMat1);
        cliff4.position.set(6, 78, -5);
        cliff4.castShadow = true;
        cliff4.receiveShadow = true;
        scene.add(cliff4);
        objects.push(cliff4);

        // Mountain goat path switchbacks - thin box ledges
        var ledgeMat = new THREE.MeshLambertMaterial({ color: 0x9a8a7a });

        var ledge1Geo = new THREE.BoxGeometry(12, 2, 25);
        var ledge1 = new THREE.Mesh(ledge1Geo, ledgeMat);
        ledge1.position.set(-20, 30, -10);
        ledge1.castShadow = true;
        ledge1.receiveShadow = true;
        scene.add(ledge1);
        objects.push(ledge1);

        var ledge2Geo = new THREE.BoxGeometry(12, 2, 25);
        var ledge2 = new THREE.Mesh(ledge2Geo, ledgeMat);
        ledge2.position.set(18, 50, 8);
        ledge2.castShadow = true;
        ledge2.receiveShadow = true;
        scene.add(ledge2);
        objects.push(ledge2);

        var ledge3Geo = new THREE.BoxGeometry(12, 2, 25);
        var ledge3 = new THREE.Mesh(ledge3Geo, ledgeMat);
        ledge3.position.set(-22, 65, -12);
        ledge3.castShadow = true;
        ledge3.receiveShadow = true;
        scene.add(ledge3);
        objects.push(ledge3);

        // Iron-reinforced gate portcullis - box grid with LineSegments bars
        var portcullisMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

        // Portcullis frame - top horizontal
        var topFrameGeo = new THREE.BoxGeometry(30, 3, 3);
        var topFrame = new THREE.Mesh(topFrameGeo, portcullisMat);
        topFrame.position.set(0, 25, -18);
        topFrame.castShadow = true;
        scene.add(topFrame);
        objects.push(topFrame);

        // Portcullis frame - bottom horizontal
        var botFrameGeo = new THREE.BoxGeometry(30, 3, 3);
        var botFrame = new THREE.Mesh(botFrameGeo, portcullisMat);
        botFrame.position.set(0, 5, -18);
        botFrame.castShadow = true;
        scene.add(botFrame);
        objects.push(botFrame);

        // Portcullis frame - left vertical
        var leftFrameGeo = new THREE.BoxGeometry(3, 20, 3);
        var leftFrame = new THREE.Mesh(leftFrameGeo, portcullisMat);
        leftFrame.position.set(-15, 15, -18);
        leftFrame.castShadow = true;
        scene.add(leftFrame);
        objects.push(leftFrame);

        // Portcullis frame - right vertical
        var rightFrameGeo = new THREE.BoxGeometry(3, 20, 3);
        var rightFrame = new THREE.Mesh(rightFrameGeo, portcullisMat);
        rightFrame.position.set(15, 15, -18);
        rightFrame.castShadow = true;
        scene.add(rightFrame);
        objects.push(rightFrame);

        // Portcullis bars - vertical bars using LineSegments
        var barMat = new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 2 });
        var barPoints = [];
        for (var i = 0; i < 7; i++) {
            var xPos = -14 + (i * 4.67);
            barPoints.push(new THREE.Vector3(xPos, 5, -18));
            barPoints.push(new THREE.Vector3(xPos, 25, -18));
        }
        var barGeo = new THREE.BufferGeometry().setFromPoints(barPoints);
        var bars = new THREE.LineSegments(barGeo, barMat);
        scene.add(bars);
        objects.push(bars);

        // Trebuchet on summit - simple structure with BoxGeometry
        var trebuchetMat = new THREE.MeshLambertMaterial({ color: 0x654321 });

        // Trebuchet base
        var trebBaseGeo = new THREE.BoxGeometry(12, 2, 12);
        var trebBase = new THREE.Mesh(trebBaseGeo, trebuchetMat);
        trebBase.position.set(-5, 85, 0);
        trebBase.castShadow = true;
        scene.add(trebBase);
        objects.push(trebBase);

        // Trebuchet arm support - cylinder
        var trebSupportGeo = new THREE.CylinderGeometry(1, 1, 8, 16);
        var trebSupport = new THREE.Mesh(trebSupportGeo, trebuchetMat);
        trebSupport.position.set(-5, 90, 0);
        trebSupport.castShadow = true;
        scene.add(trebSupport);
        objects.push(trebSupport);

        // Trebuchet arm head - sphere
        var trebHeadGeo = new THREE.SphereGeometry(2, 8, 8);
        var trebHead = new THREE.Mesh(trebHeadGeo, trebuchetMat);
        trebHead.position.set(-5, 97, 0);
        trebHead.castShadow = true;
        scene.add(trebHead);
        objects.push(trebHead);

        // Cave tunnel entrance carved into cliff - large cone tunnel
        var caveMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
        var caveGeo = new THREE.ConeGeometry(8, 12, 8);
        var cave = new THREE.Mesh(caveGeo, caveMat);
        cave.position.set(25, 20, -15);
        cave.rotation.z = Math.PI / 2;
        cave.castShadow = true;
        cave.receiveShadow = true;
        scene.add(cave);
        objects.push(cave);

        // Lights
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(20, 40, 15);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate trebuchet arm rotation
        if (objects.length > 14) {
            var trebHead = objects[14];
            if (trebHead) {
                trebHead.rotation.z += delta * 0.3;
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
