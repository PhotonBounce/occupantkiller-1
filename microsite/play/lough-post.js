window.LoughPost = (function() {
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
        buildPost();
    }

    function buildPost() {
        // Crannog island base (large sphere mound in water)
        var crannogGeom = new THREE.SphereGeometry(25, 32, 32);
        var crannogMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var crannog = new THREE.Mesh(crannogGeom, crannogMat);
        crannog.position.set(0, -15, 0);
        scene.add(crannog);
        objects.push(crannog);

        // Wooden palisade ring - cylinder posts
        var postGeom = new THREE.CylinderGeometry(1.5, 1.5, 12, 16);
        var postMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var px = Math.cos(angle) * 28;
            var pz = Math.sin(angle) * 28;
            var post = new THREE.Mesh(postGeom, postMat);
            post.position.set(px, 0, pz);
            scene.add(post);
            objects.push(post);
        }

        // Palisade fence (LineSegments between posts)
        var fenceGeom = new THREE.BufferGeometry();
        var fencePoints = [];
        for (var i = 0; i < 8; i++) {
            var angle = (i / 8) * Math.PI * 2;
            var nextAngle = ((i + 1) / 8) * Math.PI * 2;
            var x1 = Math.cos(angle) * 28;
            var z1 = Math.sin(angle) * 28;
            var x2 = Math.cos(nextAngle) * 28;
            var z2 = Math.sin(nextAngle) * 28;
            fencePoints.push(x1, 4, z1);
            fencePoints.push(x2, 4, z2);
        }
        fenceGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(fencePoints), 3));
        var fenceMat = new THREE.LineBasicMaterial({ color: 0x654321 });
        var fence = new THREE.LineSegments(fenceGeom, fenceMat);
        scene.add(fence);
        objects.push(fence);

        // Elevated timber platform (box floors on cylinder stilts)
        var stiltGeom = new THREE.CylinderGeometry(1, 1, 15, 12);
        var stiltMat = new THREE.MeshLambertMaterial({ color: 0x7a6a4a });
        var stilt1 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt1.position.set(-8, 0, -8);
        scene.add(stilt1);
        objects.push(stilt1);

        var stilt2 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt2.position.set(8, 0, -8);
        scene.add(stilt2);
        objects.push(stilt2);

        var stilt3 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt3.position.set(8, 0, 8);
        scene.add(stilt3);
        objects.push(stilt3);

        var stilt4 = new THREE.Mesh(stiltGeom, stiltMat);
        stilt4.position.set(-8, 0, 8);
        scene.add(stilt4);
        objects.push(stilt4);

        // Platform deck
        var deckGeom = new THREE.BoxGeometry(20, 1.5, 20);
        var deckMat = new THREE.MeshLambertMaterial({ color: 0x9b8b6b });
        var deck = new THREE.Mesh(deckGeom, deckMat);
        deck.position.set(0, 8, 0);
        scene.add(deck);
        objects.push(deck);

        // Signal fire beacon - cylinder column
        var beaconColGeom = new THREE.CylinderGeometry(0.8, 0.8, 16, 12);
        var beaconColMat = new THREE.MeshLambertMaterial({ color: 0x4a3a2a });
        var beaconCol = new THREE.Mesh(beaconColGeom, beaconColMat);
        beaconCol.position.set(0, 16, 0);
        scene.add(beaconCol);
        objects.push(beaconCol);

        // Beacon flame (sphere on top)
        var flameGeom = new THREE.SphereGeometry(3, 16, 16);
        var flameMat = new THREE.MeshLambertMaterial({ color: 0xff6b1a });
        var flame = new THREE.Mesh(flameGeom, flameMat);
        flame.position.set(0, 26, 0);
        scene.add(flame);
        objects.push(flame);

        // Underwater anti-approach spikes (cylinder poles at angles)
        var spikeGeom = new THREE.CylinderGeometry(0.5, 0.5, 8, 8);
        var spikeMat = new THREE.MeshLambertMaterial({ color: 0x3a2a1a });
        for (var i = 0; i < 6; i++) {
            var angle = (i / 6) * Math.PI * 2;
            var sx = Math.cos(angle) * 18;
            var sz = Math.sin(angle) * 18;
            var spike = new THREE.Mesh(spikeGeom, spikeMat);
            spike.position.set(sx, -12, sz);
            spike.rotation.z = Math.PI / 6;
            scene.add(spike);
            objects.push(spike);
        }

        // Hide-covered sniper platform (box hide)
        var hideGeom = new THREE.BoxGeometry(6, 4, 8);
        var hideMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
        var hide = new THREE.Mesh(hideGeom, hideMat);
        hide.position.set(-15, 6, 12);
        scene.add(hide);
        objects.push(hide);

        // Hide thatch (LineSegments)
        var thatchGeom = new THREE.BufferGeometry();
        var thatchPoints = [];
        for (var i = 0; i < 4; i++) {
            var offsetX = -15 + (i - 1.5) * 3;
            thatchPoints.push(offsetX, 8, 8);
            thatchPoints.push(offsetX, 8, 16);
        }
        thatchGeom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(thatchPoints), 3));
        var thatchMat = new THREE.LineBasicMaterial({ color: 0x8b6f47 });
        var thatch = new THREE.LineSegments(thatchGeom, thatchMat);
        scene.add(thatch);
        objects.push(thatch);

        // Fishing boat dock (box dock)
        var dockGeom = new THREE.BoxGeometry(8, 1, 12);
        var dockMat = new THREE.MeshLambertMaterial({ color: 0x9a8a6a });
        var dock = new THREE.Mesh(dockGeom, dockMat);
        dock.position.set(20, -3, -15);
        scene.add(dock);
        objects.push(dock);

        // Mooring posts (cylinder posts)
        var mooringGeom = new THREE.CylinderGeometry(0.8, 0.8, 6, 12);
        var mooringMat = new THREE.MeshLambertMaterial({ color: 0x7b6b4b });
        var mooring1 = new THREE.Mesh(mooringGeom, mooringMat);
        mooring1.position.set(16, -1, -20);
        scene.add(mooring1);
        objects.push(mooring1);

        var mooring2 = new THREE.Mesh(mooringGeom, mooringMat);
        mooring2.position.set(24, -1, -20);
        scene.add(mooring2);
        objects.push(mooring2);

        // Fog horn signal device (cone horn on cylinder post)
        var hornPostGeom = new THREE.CylinderGeometry(1, 1, 10, 12);
        var hornPostMat = new THREE.MeshLambertMaterial({ color: 0x5a4a3a });
        var hornPost = new THREE.Mesh(hornPostGeom, hornPostMat);
        hornPost.position.set(-20, 2, 15);
        scene.add(hornPost);
        objects.push(hornPost);

        // Horn cone
        var hornGeom = new THREE.ConeGeometry(2.5, 5, 16);
        var hornMat = new THREE.MeshLambertMaterial({ color: 0xbbaa88 });
        var horn = new THREE.Mesh(hornGeom, hornMat);
        horn.position.set(-20, 9, 15);
        horn.rotation.x = Math.PI / 6;
        scene.add(horn);
        objects.push(horn);

        // Ambient light
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Directional light for beacon glow
        var dirLight = new THREE.DirectionalLight(0xff8844, 0.8);
        dirLight.position.set(0, 30, 20);
        scene.add(dirLight);
        lights.push(dirLight);
    }

    function update(delta) {
        // Beacon flame pulses
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].geometry instanceof THREE.SphereGeometry) {
                var scale = 1 + Math.sin(Date.now() * 0.003) * 0.15;
                objects[i].scale.set(scale, scale, scale);
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
