window.CrinanFort = (function() {
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
        // Crinan Harbour Sea-Lock
        var lockChamber = new THREE.Mesh(
            new THREE.BoxGeometry(12, 8, 20),
            new THREE.MeshLambertMaterial({ color: 0x404040 })
        );
        lockChamber.position.set(-25, 4, -20);
        scene.add(lockChamber);
        objects.push(lockChamber);

        var lockGate = new THREE.Mesh(
            new THREE.CylinderGeometry(2, 2, 10, 16),
            new THREE.MeshLambertMaterial({ color: 0x606060 })
        );
        lockGate.position.set(-25, 5, -8);
        lockGate.rotation.z = Math.PI / 2;
        scene.add(lockGate);
        objects.push(lockGate);

        var controlBuilding = new THREE.Mesh(
            new THREE.BoxGeometry(8, 6, 8),
            new THREE.MeshLambertMaterial({ color: 0x8B4513 })
        );
        controlBuilding.position.set(-25, 3, 0);
        scene.add(controlBuilding);
        objects.push(controlBuilding);

        // Crinan Hotel Command Post
        var victorianHotel = new THREE.Mesh(
            new THREE.BoxGeometry(16, 12, 14),
            new THREE.MeshLambertMaterial({ color: 0xD2B48C })
        );
        victorianHotel.position.set(0, 6, -15);
        scene.add(victorianHotel);
        objects.push(victorianHotel);

        var terraceFortification = new THREE.Mesh(
            new THREE.BoxGeometry(20, 3, 6),
            new THREE.MeshLambertMaterial({ color: 0xA0826D })
        );
        terraceFortification.position.set(0, 3, -22);
        scene.add(terraceFortification);
        objects.push(terraceFortification);

        var signalMast = new THREE.Mesh(
            new THREE.CylinderGeometry(1, 1, 18, 12),
            new THREE.MeshLambertMaterial({ color: 0x4A4A4A })
        );
        signalMast.position.set(8, 12, -15);
        scene.add(signalMast);
        objects.push(signalMast);

        // Sound of Jura Naval Patrol
        var patrolBoatHull = new THREE.Mesh(
            new THREE.CylinderGeometry(2.5, 2.5, 14, 16),
            new THREE.MeshLambertMaterial({ color: 0x2F4F4F })
        );
        patrolBoatHull.position.set(25, 2, -10);
        patrolBoatHull.rotation.z = Math.PI / 2;
        scene.add(patrolBoatHull);
        objects.push(patrolBoatHull);

        var sonarBuoy1 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        sonarBuoy1.position.set(20, 1, -5);
        scene.add(sonarBuoy1);
        objects.push(sonarBuoy1);

        var sonarBuoy2 = new THREE.Mesh(
            new THREE.SphereGeometry(1.5, 12, 12),
            new THREE.MeshLambertMaterial({ color: 0xFFD700 })
        );
        sonarBuoy2.position.set(30, 1, -12);
        scene.add(sonarBuoy2);
        objects.push(sonarBuoy2);

        var netCable = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    20, 1, -5,
                    30, 1, -12,
                    25, 0.5, -8,
                    20, 1, -5
                ]), 3)
            ),
            new THREE.LineBasicMaterial({ color: 0x808080, linewidth: 2 })
        );
        scene.add(netCable);
        objects.push(netCable);

        // Duntrune Castle Stronghold
        var medievalCastle = new THREE.Mesh(
            new THREE.BoxGeometry(18, 14, 16),
            new THREE.MeshLambertMaterial({ color: 0x654321 })
        );
        medievalCastle.position.set(-10, 7, 15);
        scene.add(medievalCastle);
        objects.push(medievalCastle);

        var courtyardWall = new THREE.Mesh(
            new THREE.BoxGeometry(22, 6, 4),
            new THREE.MeshLambertMaterial({ color: 0x8B6914 })
        );
        courtyardWall.position.set(-10, 3, 25);
        scene.add(courtyardWall);
        objects.push(courtyardWall);

        var turretCap = new THREE.Mesh(
            new THREE.ConeGeometry(2.5, 5, 12),
            new THREE.MeshLambertMaterial({ color: 0x4A2511 })
        );
        turretCap.position.set(-18, 16, 15);
        scene.add(turretCap);
        objects.push(turretCap);

        // Crinan Moss Peat Bog Ambush
        var raisedBogTrack = new THREE.Mesh(
            new THREE.BoxGeometry(6, 1, 16),
            new THREE.MeshLambertMaterial({ color: 0x556B2F })
        );
        raisedBogTrack.position.set(15, 0.5, 5);
        scene.add(raisedBogTrack);
        objects.push(raisedBogTrack);

        var iedCharge1 = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0xFF4500 })
        );
        iedCharge1.position.set(12, 1, 0);
        scene.add(iedCharge1);
        objects.push(iedCharge1);

        var iedCharge2 = new THREE.Mesh(
            new THREE.SphereGeometry(0.8, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0xFF4500 })
        );
        iedCharge2.position.set(18, 1, 10);
        scene.add(iedCharge2);
        objects.push(iedCharge2);

        var tripwire = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    12, 1.5, 0,
                    18, 1.5, 10,
                    12, 1.2, 5,
                    18, 1.2, 5
                ]), 3)
            ),
            new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 1 })
        );
        scene.add(tripwire);
        objects.push(tripwire);

        // Bellanoch Bridge Demolition
        var stoneBridge = new THREE.Mesh(
            new THREE.BoxGeometry(10, 4, 20),
            new THREE.MeshLambertMaterial({ color: 0x696969 })
        );
        stoneBridge.position.set(-5, 2, 25);
        scene.add(stoneBridge);
        objects.push(stoneBridge);

        var explosiveCharge1 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        explosiveCharge1.position.set(-8, 4, 20);
        scene.add(explosiveCharge1);
        objects.push(explosiveCharge1);

        var explosiveCharge2 = new THREE.Mesh(
            new THREE.SphereGeometry(1, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0xFF6347 })
        );
        explosiveCharge2.position.set(-2, 4, 30);
        scene.add(explosiveCharge2);
        objects.push(explosiveCharge2);

        var detonatorWire = new THREE.LineSegments(
            new THREE.BufferGeometry().setAttribute('position',
                new THREE.BufferAttribute(new Float32Array([
                    -8, 5, 20,
                    -2, 5, 30,
                    -5, 5, 25,
                    -8, 5, 20
                ]), 3)
            ),
            new THREE.LineBasicMaterial({ color: 0xFF0000, linewidth: 2 })
        );
        scene.add(detonatorWire);
        objects.push(detonatorWire);

        // Knapdale Forest OP
        var forestOp = new THREE.Mesh(
            new THREE.BoxGeometry(6, 8, 6),
            new THREE.MeshLambertMaterial({ color: 0x3D5A3D })
        );
        forestOp.position.set(10, 4, 28);
        scene.add(forestOp);
        objects.push(forestOp);

        var forestMast = new THREE.Mesh(
            new THREE.CylinderGeometry(0.8, 0.8, 12, 10),
            new THREE.MeshLambertMaterial({ color: 0x2F2F2F })
        );
        forestMast.position.set(10, 10, 28);
        scene.add(forestMast);
        objects.push(forestMast);

        var radome = new THREE.Mesh(
            new THREE.SphereGeometry(2, 14, 14),
            new THREE.MeshLambertMaterial({ color: 0xFAFAFA })
        );
        radome.position.set(10, 18, 28);
        scene.add(radome);
        objects.push(radome);

        // Tayvallich Shore Battery
        var clifftopEmplacement = new THREE.Mesh(
            new THREE.BoxGeometry(14, 5, 10),
            new THREE.MeshLambertMaterial({ color: 0x5C4033 })
        );
        clifftopEmplacement.position.set(28, 2.5, 10);
        scene.add(clifftopEmplacement);
        objects.push(clifftopEmplacement);

        var gunBarrel = new THREE.Mesh(
            new THREE.CylinderGeometry(0.6, 0.6, 10, 10),
            new THREE.MeshLambertMaterial({ color: 0x1C1C1C })
        );
        gunBarrel.position.set(28, 6, 10);
        gunBarrel.rotation.z = Math.PI / 6;
        scene.add(gunBarrel);
        objects.push(gunBarrel);

        var magazine = new THREE.Mesh(
            new THREE.BoxGeometry(8, 4, 6),
            new THREE.MeshLambertMaterial({ color: 0x4A3C28 })
        );
        magazine.position.set(28, 2, 20);
        scene.add(magazine);
        objects.push(magazine);

        // Lighting
        var ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.6);
        scene.add(ambientLight);
        lights.push(ambientLight);

        var directionalLight = new THREE.DirectionalLight(0xFFFFFF, 0.8);
        directionalLight.position.set(30, 30, 20);
        scene.add(directionalLight);
        lights.push(directionalLight);
    }

    function update(delta) {
        // Animate patrol boat
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].position.x > 20 && objects[i].position.x < 30 &&
                objects[i].position.z > -12 && objects[i].position.z < -8) {
                objects[i].position.x += delta * 2;
                if (objects[i].position.x > 32) {
                    objects[i].position.x = 18;
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
