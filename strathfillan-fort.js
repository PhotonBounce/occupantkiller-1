window.StrathfillanFort = (function() {
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
        // River Fillan glen terrain
        var glenmaterial = new THREE.MeshLambertMaterial({ color: 0x4a5d23 });
        var glengeom = new THREE.BoxGeometry(60, 2, 50);
        var glenmesh = new THREE.Mesh(glengeom, glenmaterial);
        glenmesh.position.set(0, -1, 0);
        scene.add(glenmesh);
        objects.push(glenmesh);

        // St Fillan's Priory ruins - chapel walls
        var chapelmaterial = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
        var chapelgeom = new THREE.BoxGeometry(20, 12, 18);
        var chapelmesh = new THREE.Mesh(chapelgeom, chapelmaterial);
        chapelmesh.position.set(-25, 6, 15);
        scene.add(chapelmesh);
        objects.push(chapelmesh);

        // Priory tower
        var towermaterial = new THREE.MeshLambertMaterial({ color: 0x6b5344 });
        var towergeom = new THREE.CylinderGeometry(5, 6, 18, 16);
        var towermesh = new THREE.Mesh(towergeom, towermaterial);
        towermesh.position.set(-20, 9, 20);
        scene.add(towermesh);
        objects.push(towermesh);

        // Graveyard enclosure
        var gravematerial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
        var gravegeom = new THREE.BoxGeometry(16, 0.5, 16);
        var gravemesh = new THREE.Mesh(gravegeom, gravematerial);
        gravemesh.position.set(-30, 0.2, 8);
        scene.add(gravemesh);
        objects.push(gravemesh);

        // Kirkton farm - farmhouse
        var housematerial = new THREE.MeshLambertMaterial({ color: 0xcd853f });
        var housegeom = new THREE.BoxGeometry(14, 8, 12);
        var housemesh = new THREE.Mesh(housegeom, housematerial);
        housemesh.position.set(15, 4, 12);
        scene.add(housemesh);
        objects.push(housemesh);

        // Hay barn
        var barnmaterial = new THREE.MeshLambertMaterial({ color: 0xdaa520 });
        var barngeom = new THREE.BoxGeometry(18, 6, 10);
        var barnmesh = new THREE.Mesh(barngeom, barnmaterial);
        barnmesh.position.set(25, 3, 22);
        scene.add(barnmesh);
        objects.push(barnmesh);

        // Silo
        var silomaterial = new THREE.MeshLambertMaterial({ color: 0x708090 });
        var silogeom = new THREE.CylinderGeometry(3, 3.5, 15, 12);
        var silomesh = new THREE.Mesh(silogeom, silomaterial);
        silomesh.position.set(28, 7.5, 8);
        scene.add(silomesh);
        objects.push(silomesh);

        // Green Loch - clifftop hide
        var hidematerial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var hidegeom = new THREE.BoxGeometry(12, 5, 10);
        var hidemesh = new THREE.Mesh(hidegeom, hidematerial);
        hidemesh.position.set(8, 2.5, -20);
        scene.add(hidemesh);
        objects.push(hidemesh);

        // Decoy buoys
        var buoymaterial = new THREE.MeshLambertMaterial({ color: 0xff6347 });
        var buoygeom = new THREE.SphereGeometry(2, 16, 12);
        var buoy1 = new THREE.Mesh(buoygeom, buoymaterial);
        buoy1.position.set(12, 0.5, -25);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(buoygeom, buoymaterial);
        buoy2.position.set(4, 0.5, -27);
        scene.add(buoy2);
        objects.push(buoy2);

        // Tripwire grid (LineSegments)
        var wiregeometry = new THREE.BufferGeometry();
        var wirepositions = new Float32Array([
            6, 1, -18, 14, 1, -18,
            6, 1, -22, 14, 1, -22,
            6, 1, -18, 6, 1, -22,
            14, 1, -18, 14, 1, -22
        ]);
        wiregeometry.setAttribute('position', new THREE.BufferAttribute(wirepositions, 3));
        var wirematerial = new THREE.LineBasicMaterial({ color: 0x00ff00 });
        var wirelines = new THREE.LineSegments(wiregeometry, wirematerial);
        scene.add(wirelines);
        objects.push(wirelines);

        // Auchtertyre ridge - sandbag emplacement
        var sandbagmaterial = new THREE.MeshLambertMaterial({ color: 0xb8860b });
        var sandbaggeom = new THREE.BoxGeometry(16, 4, 14);
        var sandbagmesh = new THREE.Mesh(sandbaggeom, sandbagmaterial);
        sandbagmesh.position.set(-15, 2, -8);
        scene.add(sandbagmesh);
        objects.push(sandbagmesh);

        // Howitzer barrel
        var howitzermaterial = new THREE.MeshLambertMaterial({ color: 0x2f4f4f });
        var howitzergeom = new THREE.CylinderGeometry(1.5, 1.8, 20, 12);
        var howitzermesh = new THREE.Mesh(howitzergeom, howitzermaterial);
        howitzermesh.rotation.z = Math.PI / 6;
        howitzermesh.position.set(-12, 6, -5);
        scene.add(howitzermesh);
        objects.push(howitzermesh);

        // Ammo dump
        var ammomaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
        var ammogeom = new THREE.BoxGeometry(10, 5, 8);
        var ammomesh = new THREE.Mesh(ammogeom, ammomaterial);
        ammomesh.position.set(-22, 2.5, -12);
        scene.add(ammomesh);
        objects.push(ammomesh);

        // Derrydaroch river - stepping stones
        var stonematerial = new THREE.MeshLambertMaterial({ color: 0xa9a9a9 });
        var stonegeom = new THREE.BoxGeometry(6, 1, 6);
        var stone1 = new THREE.Mesh(stonegeom, stonematerial);
        stone1.position.set(-8, 0.5, -15);
        scene.add(stone1);
        objects.push(stone1);

        var stone2 = new THREE.Mesh(stonegeom, stonematerial);
        stone2.position.set(0, 0.5, -15);
        scene.add(stone2);
        objects.push(stone2);

        var stone3 = new THREE.Mesh(stonegeom, stonematerial);
        stone3.position.set(8, 0.5, -15);
        scene.add(stone3);
        objects.push(stone3);

        // Ford sandbag positions
        var fordmaterial = new THREE.MeshLambertMaterial({ color: 0xbc8f8f });
        var fordgeom = new THREE.BoxGeometry(8, 3, 6);
        var ford1 = new THREE.Mesh(fordgeom, fordmaterial);
        ford1.position.set(-5, 1.5, -10);
        scene.add(ford1);
        objects.push(ford1);

        var ford2 = new THREE.Mesh(fordgeom, fordmaterial);
        ford2.position.set(6, 1.5, -10);
        scene.add(ford2);
        objects.push(ford2);

        // IED charges
        var iedmaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
        var iedgeom = new THREE.SphereGeometry(1.5, 12, 10);
        var ied1 = new THREE.Mesh(iedgeom, iedmaterial);
        ied1.position.set(-2, 0.5, -12);
        scene.add(ied1);
        objects.push(ied1);

        var ied2 = new THREE.Mesh(iedgeom, iedmaterial);
        ied2.position.set(3, 0.5, -13);
        scene.add(ied2);
        objects.push(ied2);

        // Inverhaggernie summit - stone shelter
        var sheltermaterial = new THREE.MeshLambertMaterial({ color: 0x808080 });
        var sheltergeom = new THREE.BoxGeometry(11, 6, 9);
        var sheltermesh = new THREE.Mesh(sheltergeom, sheltermaterial);
        sheltermesh.position.set(20, 3, -18);
        scene.add(sheltermesh);
        objects.push(sheltermesh);

        // Radio mast
        var mastmaterial = new THREE.MeshLambertMaterial({ color: 0x1c1c1c });
        var mastgeom = new THREE.CylinderGeometry(0.8, 0.8, 22, 8);
        var mastmesh = new THREE.Mesh(mastgeom, mastmaterial);
        mastmesh.position.set(25, 11, -20);
        scene.add(mastmesh);
        objects.push(mastmesh);

        // Radome
        var radeommaterial = new THREE.MeshLambertMaterial({ color: 0xfffacd });
        var radomegeom = new THREE.SphereGeometry(3, 16, 12);
        var rademesh = new THREE.Mesh(radomegeom, radeommaterial);
        rademesh.position.set(25, 18, -20);
        scene.add(rademesh);
        objects.push(rademesh);

        // Bogle Glen - tree line cover
        var treematerial = new THREE.MeshLambertMaterial({ color: 0x228b22 });
        var treegeom = new THREE.BoxGeometry(22, 14, 8);
        var treemesh = new THREE.Mesh(treegeom, treematerial);
        treemesh.position.set(0, 7, 25);
        scene.add(treemesh);
        objects.push(treemesh);

        // Sunken track
        var trackmaterial = new THREE.MeshLambertMaterial({ color: 0x654321 });
        var trackgeom = new THREE.BoxGeometry(28, 2, 6);
        var trackmesh = new THREE.Mesh(trackgeom, trackmaterial);
        trackmesh.position.set(0, 0.8, 30);
        scene.add(trackmesh);
        objects.push(trackmesh);

        // Command wire network (LineSegments)
        var cmdgeometry = new THREE.BufferGeometry();
        var cmdpositions = new Float32Array([
            -8, 2, 28, 8, 2, 28,
            -8, 2, 32, 8, 2, 32,
            -8, 2, 28, -8, 2, 32,
            8, 2, 28, 8, 2, 32,
            0, 2, 28, 0, 2, 32
        ]);
        cmdgeometry.setAttribute('position', new THREE.BufferAttribute(cmdpositions, 3));
        var cmdmaterial = new THREE.LineBasicMaterial({ color: 0xff0000 });
        var cmdlines = new THREE.LineSegments(cmdgeometry, cmdmaterial);
        scene.add(cmdlines);
        objects.push(cmdlines);

        // Add lights
        var amblight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(amblight);
        lights.push(amblight);

        var dirlight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirlight.position.set(30, 40, 30);
        scene.add(dirlight);
        lights.push(dirlight);
    }

    function update(delta) {
        // Animation updates can go here
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
