window.SootBase = (function() {
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
        var sootBlack = 0x1a1a1a;
        var darkGrey = 0x3a3a3a;
        var charcoal = 0x2a2a2a;
        var ashGrey = 0x4a4a4a;
        var ironGrey = 0x2d2d2d;

        // Furnace complex - central box structure
        var furnaceGeom = new THREE.BoxGeometry(12, 8, 10);
        var furnaceMat = new THREE.MeshLambertMaterial({ color: sootBlack });
        var furnace = new THREE.Mesh(furnaceGeom, furnaceMat);
        furnace.position.set(0, 4, 0);
        scene.add(furnace);
        objects.push(furnace);

        // Large smokestack 1 - tall cylinder
        var stackGeom1 = new THREE.CylinderGeometry(2, 2.2, 20, 16);
        var stackMat = new THREE.MeshLambertMaterial({ color: darkGrey });
        var stack1 = new THREE.Mesh(stackGeom1, stackMat);
        stack1.position.set(-15, 10, -8);
        scene.add(stack1);
        objects.push(stack1);

        // Large smokestack 2 - tall cylinder
        var stackGeom2 = new THREE.CylinderGeometry(1.8, 2, 18, 16);
        var stackMat2 = new THREE.MeshLambertMaterial({ color: charcoal });
        var stack2 = new THREE.Mesh(stackGeom2, stackMat2);
        stack2.position.set(12, 9, 15);
        scene.add(stack2);
        objects.push(stack2);

        // Small smokestack 3 - shorter cylinder
        var stackGeom3 = new THREE.CylinderGeometry(1.2, 1.4, 14, 12);
        var stackMat3 = new THREE.MeshLambertMaterial({ color: ironGrey });
        var stack3 = new THREE.Mesh(stackGeom3, stackMat3);
        stack3.position.set(18, 7, -12);
        scene.add(stack3);
        objects.push(stack3);

        // Coal heap 1 - dark sphere mound
        var coalGeom1 = new THREE.SphereGeometry(4, 12, 8);
        var coalMat = new THREE.MeshLambertMaterial({ color: sootBlack });
        var coal1 = new THREE.Mesh(coalGeom1, coalMat);
        coal1.position.set(-20, 4, 10);
        coal1.scale.set(1, 0.6, 1);
        scene.add(coal1);
        objects.push(coal1);

        // Coal heap 2 - dark sphere mound
        var coalGeom2 = new THREE.SphereGeometry(3.5, 12, 8);
        var coalMat2 = new THREE.MeshLambertMaterial({ color: ashGrey });
        var coal2 = new THREE.Mesh(coalGeom2, coalMat2);
        coal2.position.set(25, 3.5, -15);
        coal2.scale.set(1, 0.5, 1);
        scene.add(coal2);
        objects.push(coal2);

        // Machinery block 1 - cubic structure
        var machineGeom1 = new THREE.BoxGeometry(5, 6, 4);
        var machineMat = new THREE.MeshLambertMaterial({ color: darkGrey });
        var machine1 = new THREE.Mesh(machineGeom1, machineMat);
        machine1.position.set(-10, 3, 18);
        scene.add(machine1);
        objects.push(machine1);

        // Machinery block 2 - another cubic structure
        var machineGeom2 = new THREE.BoxGeometry(6, 5, 5);
        var machineMat2 = new THREE.MeshLambertMaterial({ color: charcoal });
        var machine2 = new THREE.Mesh(machineGeom2, machineMat2);
        machine2.position.set(20, 2.5, 8);
        scene.add(machine2);
        objects.push(machine2);

        // Soot pile 1 - cone shape
        var pileGeom1 = new THREE.ConeGeometry(3, 5, 12);
        var pileMat = new THREE.MeshLambertMaterial({ color: sootBlack });
        var pile1 = new THREE.Mesh(pileGeom1, pileMat);
        pile1.position.set(8, 2.5, -22);
        scene.add(pile1);
        objects.push(pile1);

        // Soot pile 2 - cone shape
        var pileGeom2 = new THREE.ConeGeometry(2.5, 4, 10);
        var pileMat2 = new THREE.MeshLambertMaterial({ color: ironGrey });
        var pile2 = new THREE.Mesh(pileGeom2, pileMat2);
        pile2.position.set(-25, 2, -5);
        scene.add(pile2);
        objects.push(pile2);

        // Industrial pipe 1 - thin cylinder
        var pipeGeom1 = new THREE.CylinderGeometry(0.6, 0.6, 15, 8);
        var pipeMat = new THREE.MeshLambertMaterial({ color: ashGrey });
        var pipe1 = new THREE.Mesh(pipeGeom1, pipeMat);
        pipe1.rotation.z = Math.PI * 0.3;
        pipe1.position.set(-5, 8, 5);
        scene.add(pipe1);
        objects.push(pipe1);

        // Industrial pipe 2 - thin cylinder
        var pipeGeom2 = new THREE.CylinderGeometry(0.5, 0.5, 12, 8);
        var pipeMat2 = new THREE.MeshLambertMaterial({ color: darkGrey });
        var pipe2 = new THREE.Mesh(pipeGeom2, pipeMat2);
        pipe2.rotation.z = Math.PI * 0.4;
        pipe2.position.set(10, 6, -8);
        scene.add(pipe2);
        objects.push(pipe2);

        // Soot sphere 1 - decorative dark sphere
        var sootSphereGeom1 = new THREE.SphereGeometry(2, 10, 10);
        var sootSphereMat = new THREE.MeshLambertMaterial({ color: sootBlack });
        var sootSphere1 = new THREE.Mesh(sootSphereGeom1, sootSphereMat);
        sootSphere1.position.set(0, 8, -20);
        scene.add(sootSphere1);
        objects.push(sootSphere1);

        // Soot sphere 2 - smaller decorative sphere
        var sootSphereGeom2 = new THREE.SphereGeometry(1.5, 8, 8);
        var sootSphereMat2 = new THREE.MeshLambertMaterial({ color: charcoal });
        var sootSphere2 = new THREE.Mesh(sootSphereGeom2, sootSphereMat2);
        sootSphere2.position.set(-30, 6, 20);
        scene.add(sootSphere2);
        objects.push(sootSphere2);

        // Foundation block - large base box
        var foundationGeom = new THREE.BoxGeometry(50, 1, 50);
        var foundationMat = new THREE.MeshLambertMaterial({ color: ironGrey });
        var foundation = new THREE.Mesh(foundationGeom, foundationMat);
        foundation.position.set(0, 0, 0);
        scene.add(foundation);
        objects.push(foundation);

        // Ambient light for general illumination
        var ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);
        lights.push(ambientLight);

        // Point light from furnace glow
        var pointLight = new THREE.PointLight(0xff6600, 1.2, 40);
        pointLight.position.set(0, 6, 0);
        scene.add(pointLight);
        lights.push(pointLight);
    }

    function update(delta) {
        if (objects.length > 0 && objects[0]) {
            objects[0].rotation.y += 0.02 * delta;
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
