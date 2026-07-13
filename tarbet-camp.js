window.TarbetCamp = (function() {
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
        var mat1 = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
        var mat2 = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
        var mat3 = new THREE.MeshLambertMaterial({ color: 0x696969 });
        var mat4 = new THREE.MeshLambertMaterial({ color: 0x4CAF50 });
        var mat5 = new THREE.MeshLambertMaterial({ color: 0x1E90FF });
        var mat6 = new THREE.MeshLambertMaterial({ color: 0xFF6347 });
        var mat7 = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        var mat8 = new THREE.MeshLambertMaterial({ color: 0x8B4513 });

        var light1 = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        light1.position.set(20, 30, 20);
        scene.add(light1);
        lights.push(light1);

        var light2 = new THREE.AmbientLight(0xFFFFFF, 0.3);
        scene.add(light2);
        lights.push(light2);

        var stoneHotel = new THREE.Mesh(
            new THREE.BoxGeometry(10, 12, 8),
            mat1
        );
        stoneHotel.position.set(-25, 6, -20);
        scene.add(stoneHotel);
        objects.push(stoneHotel);

        var concreteBarrier1 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 8),
            mat2
        );
        concreteBarrier1.position.set(-18, 1, -15);
        scene.add(concreteBarrier1);
        objects.push(concreteBarrier1);

        var concreteBarrier2 = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 8),
            mat2
        );
        concreteBarrier2.position.set(-18, 1, -5);
        scene.add(concreteBarrier2);
        objects.push(concreteBarrier2);

        var guardTower = new THREE.Mesh(
            new THREE.CylinderGeometry(3, 3, 15, 16),
            mat3
        );
        guardTower.position.set(-20, 7.5, -2);
        scene.add(guardTower);
        objects.push(guardTower);

        var stoneRoof = new THREE.Mesh(
            new THREE.ConeGeometry(3.5, 4, 16),
            mat1
        );
        stoneRoof.position.set(-20, 19.5, -2);
        scene.add(stoneRoof);
        objects.push(stoneRoof);

        var benReochShelter = new THREE.Mesh(
            new THREE.BoxGeometry(12, 5, 6),
            mat1
        );
        benReochShelter.position.set(10, 2.5, -25);
        scene.add(benReochShelter);
        objects.push(benReochShelter);

        var radiomast = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 20, 12),
            mat3
        );
        radiomast.position.set(18, 10, -28);
        scene.add(radiomast);
        objects.push(radiomast);

        var radome = new THREE.Mesh(
            new THREE.SphereGeometry(2, 16, 16),
            mat5
        );
        radome.position.set(18, 21, -28);
        scene.add(radome);
        objects.push(radome);

        var cliffOP = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            mat8
        );
        cliffOP.position.set(25, 2, -8);
        scene.add(cliffOP);
        objects.push(cliffOP);

        var buoy1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            mat5
        );
        buoy1.position.set(28, 0, 5);
        scene.add(buoy1);
        objects.push(buoy1);

        var buoy2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            mat5
        );
        buoy2.position.set(30, 0, 15);
        scene.add(buoy2);
        objects.push(buoy2);

        var sensorCables = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(25, 0, -8),
                new THREE.Vector3(28, 0, 5)
            ]),
            new THREE.LineBasicMaterial({ color: 0xFF0000 })
        );
        scene.add(sensorCables);
        objects.push(sensorCables);

        var prisonKeep = new THREE.Mesh(
            new THREE.BoxGeometry(8, 10, 8),
            mat1
        );
        prisonKeep.position.set(-8, 5, 18);
        scene.add(prisonKeep);
        objects.push(prisonKeep);

        var prisonTower = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.5, 12, 14),
            mat3
        );
        prisonTower.position.set(-3, 6, 22);
        scene.add(prisonTower);
        objects.push(prisonTower);

        var ammunition = new THREE.Mesh(
            new THREE.BoxGeometry(5, 3, 5),
            mat6
        );
        ammunition.position.set(-10, 1.5, 22);
        scene.add(ammunition);
        objects.push(ammunition);

        var turbineHall = new THREE.Mesh(
            new THREE.BoxGeometry(15, 8, 10),
            mat2
        );
        turbineHall.position.set(8, 4, 12);
        scene.add(turbineHall);
        objects.push(turbineHall);

        var penstock1 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 16, 12),
            mat3
        );
        penstock1.position.set(12, 8, 16);
        scene.add(penstock1);
        objects.push(penstock1);

        var penstock2 = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 1.5, 16, 12),
            mat3
        );
        penstock2.position.set(16, 8, 16);
        scene.add(penstock2);
        objects.push(penstock2);

        var controlRoom = new THREE.Mesh(
            new THREE.BoxGeometry(7, 5, 6),
            mat2
        );
        controlRoom.position.set(18, 2.5, 8);
        scene.add(controlRoom);
        objects.push(controlRoom);

        var hvLines = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(8, 12, 12),
                new THREE.Vector3(18, 12, 8)
            ]),
            new THREE.LineBasicMaterial({ color: 0xFFD700, linewidth: 2 })
        );
        scene.add(hvLines);
        objects.push(hvLines);

        var concreteDock = new THREE.Mesh(
            new THREE.BoxGeometry(12, 2, 8),
            mat2
        );
        concreteDock.position.set(-15, 1, -32);
        scene.add(concreteDock);
        objects.push(concreteDock);

        var mine1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 10, 10),
            mat6
        );
        mine1.position.set(-12, -2, -28);
        scene.add(mine1);
        objects.push(mine1);

        var mine2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 10, 10),
            mat6
        );
        mine2.position.set(-18, -2, -30);
        scene.add(mine2);
        objects.push(mine2);

        var netBarrier = new THREE.LineSegments(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-10, 0, -35),
                new THREE.Vector3(-20, 0, -35)
            ]),
            new THREE.LineBasicMaterial({ color: 0x008000, linewidth: 1 })
        );
        scene.add(netBarrier);
        objects.push(netBarrier);

        var switchroad = new THREE.Mesh(
            new THREE.BoxGeometry(3, 0.5, 14),
            mat7
        );
        switchroad.position.set(5, 0.25, 28);
        scene.add(switchroad);
        objects.push(switchroad);

        var boulderField = new THREE.Mesh(
            new THREE.BoxGeometry(20, 2, 10),
            mat8
        );
        boulderField.position.set(-5, 1, 28);
        scene.add(boulderField);
        objects.push(boulderField);

        var iedCharge1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 8, 8),
            mat6
        );
        iedCharge1.position.set(8, 1, 25);
        scene.add(iedCharge1);
        objects.push(iedCharge1);

        var iedCharge2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 8, 8),
            mat6
        );
        iedCharge2.position.set(-2, 1, 35);
        scene.add(iedCharge2);
        objects.push(iedCharge2);

        var stoneJetty = new THREE.Mesh(
            new THREE.BoxGeometry(10, 3, 6),
            mat1
        );
        stoneJetty.position.set(22, 1.5, 5);
        scene.add(stoneJetty);
        objects.push(stoneJetty);

        var patrolBoat = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 8, 12),
            mat2
        );
        patrolBoat.position.set(28, 2, 8);
        scene.add(patrolBoat);
        objects.push(patrolBoat);

        var fuelDepot = new THREE.Mesh(
            new THREE.BoxGeometry(6, 4, 5),
            mat6
        );
        fuelDepot.position.set(20, 2, 18);
        scene.add(fuelDepot);
        objects.push(fuelDepot);
    }

    function update(delta) {
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

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
