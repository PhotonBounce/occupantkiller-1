var TrainStation = (function() {
    'use strict';

    var scene, camera;
    var objects = [];
    var rotatingParts = [];
    var pulsingParts = [];
    var blinkingParts = [];
    var animatingParts = [];

    function init(_scene, _camera) {
        scene = _scene;
        camera = _camera;
        objects = [];
        rotatingParts = [];
        pulsingParts = [];
        blinkingParts = [];
        animatingParts = [];

        // Grand hall base - marble floor
        var floorGeometry = new THREE.BoxGeometry(80, 1, 120);
        var floorMaterial = new THREE.MeshStandardMaterial({ color: 0xCCBB99 });
        var floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.y = -0.5;
        floor.receiveShadow = true;
        scene.add(floor);
        objects.push(floor);

        // Grand hall ceiling structure - arched frame with box ribs
        var ceilingHeight = 35;
        var ribMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });

        // Ceiling main frame ribs (horizontal supporting structure)
        for (var i = 0; i < 5; i++) {
            var ribGeometry = new THREE.BoxGeometry(80, 1, 4);
            var rib = new THREE.Mesh(ribGeometry, ribMaterial);
            rib.position.set(0, ceilingHeight - (i * 6), 0);
            rib.castShadow = true;
            scene.add(rib);
            objects.push(rib);
        }

        // Ceiling vertical support columns
        for (var j = 0; j < 8; j++) {
            var columnGeometry = new THREE.CylinderGeometry(1.5, 1.5, ceilingHeight, 16);
            var columnMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
            var column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set((j - 3.5) * 12, ceilingHeight / 2, 0);
            column.castShadow = true;
            scene.add(column);
            objects.push(column);
        }

        // Glass ceiling (represented as transparent grid)
        var glassFrameMaterial = new THREE.LineBasicMaterial({ color: 0xAABBCC, linewidth: 2 });
        var glassPoints = [];
        for (var gx = -40; gx <= 40; gx += 10) {
            for (var gz = -60; gz <= 60; gz += 15) {
                glassPoints.push(new THREE.Vector3(gx, ceilingHeight, gz));
            }
        }

        // Platform 1 concrete slabs with yellow safety strips
        for (var p = 0; p < 3; p++) {
            var platformZ = -40 + (p * 40);
            var platformGeometry = new THREE.BoxGeometry(70, 1, 8);
            var platformMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
            var platform = new THREE.Mesh(platformGeometry, platformMaterial);
            platform.position.set(0, 0.5, platformZ);
            platform.receiveShadow = true;
            scene.add(platform);
            objects.push(platform);

            // Yellow safety edge strips
            var stripGeometry = new THREE.BoxGeometry(70, 0.3, 0.5);
            var stripMaterial = new THREE.MeshStandardMaterial({ color: 0xFFDD00 });
            var frontStrip = new THREE.Mesh(stripGeometry, stripMaterial);
            frontStrip.position.set(0, 1.5, platformZ + 4.2);
            scene.add(frontStrip);
            objects.push(frontStrip);

            var backStrip = new THREE.Mesh(stripGeometry, stripMaterial);
            backStrip.position.set(0, 1.5, platformZ - 4.2);
            scene.add(backStrip);
            objects.push(backStrip);
        }

        // Parked trains on platforms
        createTrain(15, 1.5, -40, 0x8888AA);
        createTrain(-15, 1.5, 0, 0x8888AA);

        // Armored military train on siding (different color, special handling)
        var armoredTrain = createTrain(-35, 1.5, 40, 0x555555);
        animatingParts.push({
            object: armoredTrain,
            property: 'position',
            axis: 'z',
            min: 38,
            max: 42,
            speed: 0.5
        });

        // Clock tower structure
        var towerBaseGeometry = new THREE.CylinderGeometry(3, 3.5, 8, 12);
        var towerMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        var towerBase = new THREE.Mesh(towerBaseGeometry, towerMaterial);
        towerBase.position.set(-25, 4, -55);
        towerBase.castShadow = true;
        scene.add(towerBase);
        objects.push(towerBase);

        // Clock tower top (cone)
        var towerTopGeometry = new THREE.ConeGeometry(3.2, 6, 12);
        var towerTop = new THREE.Mesh(towerTopGeometry, towerMaterial);
        towerTop.position.set(-25, 12, -55);
        towerTop.castShadow = true;
        scene.add(towerTop);
        objects.push(towerTop);

        // Clock face (circular board)
        var clockFaceGeometry = new THREE.CylinderGeometry(2.5, 2.5, 0.3, 32);
        var clockMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
        var clockFace = new THREE.Mesh(clockFaceGeometry, clockMaterial);
        clockFace.position.set(-25, 9, -53);
        clockFace.rotation.x = Math.PI / 2.2;
        clockFace.receiveShadow = true;
        scene.add(clockFace);
        objects.push(clockFace);

        // Clock hour hand
        var hourHandGeometry = new THREE.BoxGeometry(0.2, 0, 1.2);
        var handMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
        var hourHand = new THREE.Mesh(hourHandGeometry, handMaterial);
        hourHand.position.set(-25, 9, -52.5);
        hourHand.castShadow = true;
        scene.add(hourHand);
        rotatingParts.push({ object: hourHand, speed: 0.01 });

        // Clock minute hand
        var minuteHandGeometry = new THREE.BoxGeometry(0.15, 0, 1.8);
        var minuteHand = new THREE.Mesh(minuteHandGeometry, handMaterial);
        minuteHand.position.set(-25, 9.1, -52.5);
        minuteHand.castShadow = true;
        scene.add(minuteHand);
        rotatingParts.push({ object: minuteHand, speed: 0.05 });

        // Ticket booths (small boxes)
        for (var tb = 0; tb < 4; tb++) {
            var boothGeometry = new THREE.BoxGeometry(3, 4, 2.5);
            var boothMaterial = new THREE.MeshStandardMaterial({ color: 0x775544 });
            var booth = new THREE.Mesh(boothGeometry, boothMaterial);
            booth.position.set(-30 + (tb * 8), 2, 55);
            booth.castShadow = true;
            scene.add(booth);
            objects.push(booth);
        }

        // Underground access stairs
        var stairWidth = 3;
        var stairDepth = 0.5;
        for (var s = 0; s < 8; s++) {
            var stairGeometry = new THREE.BoxGeometry(stairWidth, 0.4, stairDepth);
            var stairMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
            var stair = new THREE.Mesh(stairGeometry, stairMaterial);
            stair.position.set(30, -0.5 - (s * 0.5), 50 - (s * 0.6));
            stair.castShadow = true;
            scene.add(stair);
            objects.push(stair);
        }

        // Platform barriers (red and white striped)
        for (var br = 0; br < 6; br++) {
            var barrierGeometry = new THREE.BoxGeometry(0.2, 1.2, 2);
            var barrierMaterial = new THREE.MeshStandardMaterial({ color: br % 2 === 0 ? 0xFF0000 : 0xFFFFFF });
            var barrier = new THREE.Mesh(barrierGeometry, barrierMaterial);
            barrier.position.set(-35 + (br * 3), 0.6, -25);
            barrier.castShadow = true;
            scene.add(barrier);
            objects.push(barrier);
        }

        // Passenger benches
        for (var bn = 0; bn < 3; bn++) {
            var benchGeometry = new THREE.BoxGeometry(8, 0.5, 1.5);
            var benchMaterial = new THREE.MeshStandardMaterial({ color: 0x884422 });
            var bench = new THREE.Mesh(benchGeometry, benchMaterial);
            bench.position.set(-20 + (bn * 20), 0.7, -10);
            bench.castShadow = true;
            scene.add(bench);
            objects.push(bench);
        }

        // Baggage trolleys
        for (var bt = 0; bt < 3; bt++) {
            var trolleyGroup = new THREE.Group();
            var trolleyBaseGeometry = new THREE.BoxGeometry(2, 0.4, 2.5);
            var trolleyMaterial = new THREE.MeshStandardMaterial({ color: 0xAA5500 });
            var trolleyBase = new THREE.Mesh(trolleyBaseGeometry, trolleyMaterial);
            trolleyGroup.add(trolleyBase);

            // Trolley wheels
            for (var w = 0; w < 4; w++) {
                var wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
                var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                var wheelX = w < 2 ? -0.8 : 0.8;
                var wheelZ = w % 2 === 0 ? -1 : 1;
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(wheelX, -0.3, wheelZ);
                trolleyGroup.add(wheel);
            }

            trolleyGroup.position.set(10 + (bt * 15), 0.5, 20);
            trolleyGroup.castShadow = true;
            scene.add(trolleyGroup);

            animatingParts.push({
                object: trolleyGroup,
                property: 'position',
                axis: 'x',
                min: 8 + (bt * 15),
                max: 12 + (bt * 15),
                speed: 0.3
            });
            objects.push(trolleyGroup);
        }

        // LED departure boards
        for (var db = 0; db < 3; db++) {
            var boardGeometry = new THREE.BoxGeometry(15, 6, 0.5);
            var boardMaterial = new THREE.MeshStandardMaterial({ color: 0x001100 });
            var board = new THREE.Mesh(boardGeometry, boardMaterial);
            board.position.set(-35 + (db * 35), 8, 58);
            board.castShadow = true;
            scene.add(board);
            blinkingParts.push({ object: board, material: boardMaterial });
            objects.push(board);
        }

        // Signal gantry
        var gantryVerticalGeometry = new THREE.CylinderGeometry(1, 1, 25, 12);
        var gantryMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 });
        var gantryV1 = new THREE.Mesh(gantryVerticalGeometry, gantryMaterial);
        gantryV1.position.set(-20, 12.5, -60);
        gantryV1.castShadow = true;
        scene.add(gantryV1);
        objects.push(gantryV1);

        var gantryV2 = new THREE.Mesh(gantryVerticalGeometry, gantryMaterial);
        gantryV2.position.set(20, 12.5, -60);
        gantryV2.castShadow = true;
        scene.add(gantryV2);
        objects.push(gantryV2);

        // Gantry horizontal beam
        var gantryBeamGeometry = new THREE.BoxGeometry(40, 2, 2);
        var gantryBeam = new THREE.Mesh(gantryBeamGeometry, gantryMaterial);
        gantryBeam.position.set(0, 26, -60);
        gantryBeam.castShadow = true;
        scene.add(gantryBeam);
        objects.push(gantryBeam);

        // Signal lights on gantry
        for (var sg = 0; sg < 3; sg++) {
            var signalGeometry = new THREE.SphereGeometry(0.6, 16, 16);
            var signalMaterial = new THREE.MeshStandardMaterial({ color: 0xFF0000, emissive: 0x990000 });
            var signal = new THREE.Mesh(signalGeometry, signalMaterial);
            signal.position.set(-15 + (sg * 15), 25, -58);
            signal.castShadow = true;
            scene.add(signal);
            pulsingParts.push({ object: signal, material: signalMaterial, baseColor: 0xFF0000 });
            objects.push(signal);
        }

        // Hanging platform signs
        for (var ps = 0; ps < 2; ps++) {
            var signGeometry = new THREE.BoxGeometry(6, 2, 0.3);
            var signMaterial = new THREE.MeshStandardMaterial({ color: 0x2244AA });
            var sign = new THREE.Mesh(signGeometry, signMaterial);
            sign.position.set(-30 + (ps * 60), 18, -40);
            sign.castShadow = true;
            scene.add(sign);
            objects.push(sign);
        }

        // Platform announcement lights (round, mounted high)
        for (var al = 0; al < 5; al++) {
            var lightGeometry = new THREE.SphereGeometry(0.5, 12, 12);
            var lightMaterial = new THREE.MeshStandardMaterial({ color: 0x00FF00, emissive: 0x00AA00 });
            var light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(-30 + (al * 15), 30, -50);
            light.castShadow = true;
            scene.add(light);
            blinkingParts.push({ object: light, material: lightMaterial });
            objects.push(light);
        }

        // Train lights (dynamic)
        var trainLightGeometry = new THREE.SphereGeometry(0.4, 12, 12);
        var trainLightMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFF00, emissive: 0xFFAA00 });
        var trainLight1 = new THREE.Mesh(trainLightGeometry, trainLightMaterial);
        trainLight1.position.set(15, 3.5, -40);
        scene.add(trainLight1);
        pulsingParts.push({ object: trainLight1, material: trainLightMaterial, baseColor: 0xFFFF00 });
        objects.push(trainLight1);

        var trainLight2 = new THREE.Mesh(trainLightGeometry, trainLightMaterial);
        trainLight2.position.set(-15, 3.5, 0);
        scene.add(trainLight2);
        pulsingParts.push({ object: trainLight2, material: trainLightMaterial, baseColor: 0xFFFF00 });
        objects.push(trainLight2);

        return objects;
    }

    function createTrain(x, y, z, color) {
        var trainGroup = new THREE.Group();

        // Locomotive
        var locomotiveGeometry = new THREE.BoxGeometry(3, 3, 8);
        var locomotiveMaterial = new THREE.MeshStandardMaterial({ color: color });
        var locomotive = new THREE.Mesh(locomotiveGeometry, locomotiveMaterial);
        locomotive.position.set(x, y, z);
        locomotive.castShadow = true;
        trainGroup.add(locomotive);

        // Locomotive cabin (smaller box on top)
        var cabinGeometry = new THREE.BoxGeometry(2.5, 2, 2.5);
        var cabin = new THREE.Mesh(cabinGeometry, locomotiveMaterial);
        cabin.position.set(x, y + 2, z + 2);
        cabin.castShadow = true;
        trainGroup.add(cabin);

        // Locomotive wheels
        for (var lw = 0; lw < 4; lw++) {
            var wheelGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.4, 16);
            var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
            var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.rotation.z = Math.PI / 2;
            wheel.position.set(x - 1 + (lw < 2 ? 0 : 2), y - 1.3, z - 3 + (lw % 2 === 0 ? 0 : 6));
            trainGroup.add(wheel);
        }

        // Carriages
        for (var c = 0; c < 3; c++) {
            var carriageGeometry = new THREE.BoxGeometry(2.8, 3, 6);
            var carriageMaterial = new THREE.MeshStandardMaterial({ color: color });
            var carriage = new THREE.Mesh(carriageGeometry, carriageMaterial);
            carriage.position.set(x, y, z + 8 + (c * 6.5));
            carriage.castShadow = true;
            trainGroup.add(carriage);

            // Carriage windows
            for (var cw = 0; cw < 2; cw++) {
                var windowGeometry = new THREE.BoxGeometry(1.2, 1.2, 0.2);
                var windowMaterial = new THREE.MeshStandardMaterial({ color: 0x4488FF });
                var window = new THREE.Mesh(windowGeometry, windowMaterial);
                window.position.set(x - 1.3, y + 0.5, z + 8 + (c * 6.5) + (cw === 0 ? -1.5 : 1.5));
                trainGroup.add(window);
            }

            // Carriage wheels
            for (var cwr = 0; cwr < 4; cwr++) {
                var wheelGeometry = new THREE.CylinderGeometry(0.55, 0.55, 0.4, 16);
                var wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
                var wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
                wheel.rotation.z = Math.PI / 2;
                wheel.position.set(x - 1 + (cwr < 2 ? 0 : 2), y - 1.3, z + 8 + (c * 6.5) - 2 + (cwr % 2 === 0 ? 0 : 4));
                trainGroup.add(wheel);
            }
        }

        scene.add(trainGroup);
        objects.push(trainGroup);
        return trainGroup;
    }

    function update(delta) {
        // Update rotating parts (clock hands)
        for (var i = 0; i < rotatingParts.length; i++) {
            rotatingParts[i].object.rotation.z += rotatingParts[i].speed;
        }

        // Update pulsing parts (train lights, signal lights)
        for (var j = 0; j < pulsingParts.length; j++) {
            var part = pulsingParts[j];
            var pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            var baseColor = part.baseColor;
            var r = ((baseColor >> 16) & 255) / 255;
            var g = ((baseColor >> 8) & 255) / 255;
            var b = (baseColor & 255) / 255;
            part.material.emissive.setRGB(r * pulse, g * pulse, b * pulse);
        }

        // Update blinking parts (departure boards, announcement lights)
        for (var k = 0; k < blinkingParts.length; k++) {
            var blinker = blinkingParts[k];
            var blink = (Math.floor(Date.now() * 0.002) % 2) === 0 ? 1 : 0.3;
            blinker.material.emissive.multiplyScalar(blink);
        }

        // Update animating parts (trolleys, armored train)
        for (var m = 0; m < animatingParts.length; m++) {
            var anim = animatingParts[m];
            var pos = anim.object.position[anim.axis];
            var newPos = pos + anim.speed * (anim.direction === undefined ? 1 : anim.direction);

            if (newPos >= anim.max) {
                anim.direction = -1;
                newPos = anim.max;
            } else if (newPos <= anim.min) {
                anim.direction = 1;
                newPos = anim.min;
            }

            anim.object.position[anim.axis] = newPos;
        }
    }

    function reset() {
        for (var i = objects.length - 1; i >= 0; i--) {
            if (objects[i].geometry) {
                objects[i].geometry.dispose();
            }
            if (objects[i].material) {
                if (Array.isArray(objects[i].material)) {
                    for (var m = 0; m < objects[i].material.length; m++) {
                        objects[i].material[m].dispose();
                    }
                } else {
                    objects[i].material.dispose();
                }
            }
            if (objects[i].parent) {
                objects[i].parent.remove(objects[i]);
            }
        }
        objects = [];
        rotatingParts = [];
        pulsingParts = [];
        blinkingParts = [];
        animatingParts = [];
    }

    return {
        init: init,
        update: update,
        reset: reset
    };
}());
