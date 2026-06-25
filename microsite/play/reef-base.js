window.ReefBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];

		buildlights();
		buildcorals();
		buildconcretestructures();
		buildbunkers();
		buildsubmarinepen();
		buildnavalmines();
		buildseaweedtowers();
		buildunderwaterdrones();
		buildscubaunits();
		buildsunkendestroyerweaponscache();
	}

	function buildlights() {
		var ambientLight = new THREE.AmbientLight(0x4488aa, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0x88ccff, 0.5);
		directionalLight.position.set(50, 100, 50);
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0x00ff88, 1.2, 100);
		pointLight1.position.set(-30, 20, -30);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x0088ff, 1.0, 80);
		pointLight2.position.set(40, -10, 40);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function buildcorals() {
		var coralPositions = [
			[-40, -20, -50],
			[-35, -15, -45],
			[-25, -25, -40],
			[30, -18, -35],
			[35, -22, -30],
			[45, -20, -25],
			[-50, -28, 20],
			[-45, -30, 25],
			[-55, -25, 30],
			[50, -32, 10],
			[55, -28, 15],
			[45, -35, 5],
			[-20, -30, 50],
			[-10, -32, 55],
			[0, -28, 50],
			[15, -30, 45],
			[25, -28, 48]
		];

		var coralColors = [0xff6b35, 0xff8c42, 0xffa500, 0xff7f50, 0xff69b4, 0xff1493, 0xda70d6, 0xba55d3];

		for (var i = 0; i < coralPositions.length; i++) {
			var pos = coralPositions[i];
			var colorIdx = i % coralColors.length;
			var color = coralColors[colorIdx];

			var geometry = new THREE.ConeGeometry(8 + Math.random() * 4, 15 + Math.random() * 8, 8);
			var material = new THREE.MeshLambertMaterial({ color: color });
			var coral = new THREE.Mesh(geometry, material);
			coral.position.set(pos[0], pos[1], pos[2]);
			coral.rotation.x = Math.random() * 0.3;
			coral.rotation.z = Math.random() * 0.3;
			coral.castShadow = true;
			coral.receiveShadow = true;
			scene.add(coral);
			objects.push(coral);
		}

		for (var i = 0; i < 15; i++) {
			var sphereGeometry = new THREE.SphereGeometry(5 + Math.random() * 3, 8, 8);
			var sphereColor = coralColors[Math.floor(Math.random() * coralColors.length)];
			var sphereMaterial = new THREE.MeshLambertMaterial({ color: sphereColor });
			var coralSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
			coralSphere.position.set(
				-60 + Math.random() * 120,
				-35 + Math.random() * 15,
				-60 + Math.random() * 120
			);
			coralSphere.castShadow = true;
			coralSphere.receiveShadow = true;
			scene.add(coralSphere);
			objects.push(coralSphere);
		}
	}

	function buildconcretestructures() {
		for (var i = 0; i < 8; i++) {
			var concreteBox = new THREE.BoxGeometry(12, 8, 15);
			var concreteMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
			var concreteWall = new THREE.Mesh(concreteBox, concreteMaterial);
			concreteWall.position.set(
				-70 + i * 20,
				-15,
				-60
			);
			concreteWall.castShadow = true;
			concreteWall.receiveShadow = true;
			scene.add(concreteWall);
			objects.push(concreteWall);
		}
	}

	function buildbunkers() {
		for (var i = 0; i < 5; i++) {
			var bunkerBox = new THREE.BoxGeometry(25, 10, 20);
			var bunkerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var bunker = new THREE.Mesh(bunkerBox, bunkerMaterial);
			bunker.position.set(
				-30 + i * 35,
				-5,
				30
			);
			bunker.castShadow = true;
			bunker.receiveShadow = true;
			scene.add(bunker);
			objects.push(bunker);

			for (var p = 0; p < 3; p++) {
				var porthole = new THREE.SphereGeometry(3, 16, 16);
				var portholeMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
				var portholeWindow = new THREE.Mesh(porthole, portholeMaterial);
				portholeWindow.position.set(
					bunker.position.x - 8 + p * 8,
					bunker.position.y,
					bunker.position.z + 11
				);
				portholeWindow.castShadow = true;
				scene.add(portholeWindow);
				objects.push(portholeWindow);
			}
		}
	}

	function buildsubmarinepen() {
		var caveWall1 = new THREE.BoxGeometry(50, 20, 8);
		var caveMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var wall1 = new THREE.Mesh(caveWall1, caveMaterial);
		wall1.position.set(0, 5, 60);
		wall1.castShadow = true;
		scene.add(wall1);
		objects.push(wall1);

		var caveWall2 = new THREE.BoxGeometry(8, 20, 40);
		var wall2 = new THREE.Mesh(caveWall2, caveMaterial);
		wall2.position.set(-25, 5, 40);
		wall2.castShadow = true;
		scene.add(wall2);
		objects.push(wall2);

		var caveWall3 = new THREE.BoxGeometry(8, 20, 40);
		var wall3 = new THREE.Mesh(caveWall3, caveMaterial);
		wall3.position.set(25, 5, 40);
		wall3.castShadow = true;
		scene.add(wall3);
		objects.push(wall3);

		var submarine = new THREE.CylinderGeometry(8, 8, 35, 16);
		var submarineMaterial = new THREE.MeshLambertMaterial({ color: 0x2c3e50 });
		var submarineBody = new THREE.Mesh(submarine, submarineMaterial);
		submarineBody.position.set(0, 0, 50);
		submarineBody.rotation.z = Math.PI / 2;
		submarineBody.castShadow = true;
		scene.add(submarineBody);
		objects.push(submarineBody);

		var conningTower = new THREE.CylinderGeometry(4, 4, 6, 8);
		var tower = new THREE.Mesh(conningTower, submarineMaterial);
		tower.position.set(0, 8, 50);
		tower.castShadow = true;
		scene.add(tower);
		objects.push(tower);
	}

	function buildnavalmines() {
		var minePositions = [
			[-50, -25, -20],
			[-30, -30, -10],
			[20, -28, 10],
			[40, -30, 5],
			[0, -32, -50],
			[-70, -28, 30],
			[60, -26, -40],
			[10, -35, 40]
		];

		for (var i = 0; i < minePositions.length; i++) {
			var pos = minePositions[i];

			var mineBody = new THREE.SphereGeometry(6, 8, 8);
			var mineMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var mine = new THREE.Mesh(mineBody, mineMaterial);
			mine.position.set(pos[0], pos[1], pos[2]);
			mine.castShadow = true;
			scene.add(mine);
			objects.push(mine);
			animatedObjects.push({ mesh: mine, type: 'bobbing', baseY: pos[1], speed: 0.5 + Math.random() * 0.5 });

			for (var p = 0; p < 6; p++) {
				var spike = new THREE.ConeGeometry(2, 8, 4);
				var spikeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
				var mineSpike = new THREE.Mesh(spike, spikeMaterial);
				var angle = (p / 6) * Math.PI * 2;
				mineSpike.position.set(
					mine.position.x + Math.cos(angle) * 8,
					mine.position.y + Math.sin(angle) * 8,
					mine.position.z
				);
				mineSpike.rotation.x = Math.random() * Math.PI * 2;
				mineSpike.rotation.y = Math.random() * Math.PI * 2;
				mineSpike.castShadow = true;
				scene.add(mineSpike);
				objects.push(mineSpike);
			}
		}
	}

	function buildseaweedtowers() {
		var seaweedPositions = [
			[-60, -30, -30],
			[-40, -32, 20],
			[50, -28, -50],
			[30, -35, 40],
			[-10, -30, -20],
			[15, -32, 0]
		];

		for (var i = 0; i < seaweedPositions.length; i++) {
			var pos = seaweedPositions[i];
			var seaweed = new THREE.CylinderGeometry(2.5, 2.5, 40 + Math.random() * 20, 6);
			var seaweedMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 + Math.floor(Math.random() * 0x112200) });
			var seaweedTower = new THREE.Mesh(seaweed, seaweedMaterial);
			seaweedTower.position.set(pos[0], pos[1], pos[2]);
			seaweedTower.castShadow = true;
			scene.add(seaweedTower);
			objects.push(seaweedTower);
			animatedObjects.push({ mesh: seaweedTower, type: 'swaying', baseX: pos[0], baseZ: pos[2], speed: 0.3 + Math.random() * 0.4 });
		}
	}

	function buildunderwaterdrones() {
		var dronePatrols = [
			{ start: [-70, 0, -70], end: [70, 0, -70] },
			{ start: [-70, 10, 0], end: [70, 10, 0] },
			{ start: [-70, -15, 70], end: [70, -15, 70] }
		];

		for (var d = 0; d < dronePatrols.length; d++) {
			var droneBody = new THREE.SphereGeometry(4, 8, 8);
			var droneMaterial = new THREE.MeshLambertMaterial({ color: 0xffcc00 });
			var drone = new THREE.Mesh(droneBody, droneMaterial);
			drone.position.copy(new THREE.Vector3(dronePatrols[d].start[0], dronePatrols[d].start[1], dronePatrols[d].start[2]));
			drone.castShadow = true;
			scene.add(drone);
			objects.push(drone);
			animatedObjects.push({
				mesh: drone,
				type: 'patrolling',
				start: new THREE.Vector3(dronePatrols[d].start[0], dronePatrols[d].start[1], dronePatrols[d].start[2]),
				end: new THREE.Vector3(dronePatrols[d].end[0], dronePatrols[d].end[1], dronePatrols[d].end[2]),
				speed: 8 + Math.random() * 4,
				progress: 0
			});

			var propeller1 = new THREE.CylinderGeometry(6, 6, 1, 8);
			var propellerMaterial = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
			var prop1 = new THREE.Mesh(propeller1, propellerMaterial);
			prop1.position.set(drone.position.x - 6, drone.position.y + 5, drone.position.z);
			prop1.rotation.x = Math.PI / 2;
			prop1.castShadow = true;
			scene.add(prop1);
			objects.push(prop1);

			var propeller2 = new THREE.CylinderGeometry(6, 6, 1, 8);
			var prop2 = new THREE.Mesh(propeller2, propellerMaterial);
			prop2.position.set(drone.position.x + 6, drone.position.y + 5, drone.position.z);
			prop2.rotation.x = Math.PI / 2;
			prop2.castShadow = true;
			scene.add(prop2);
			objects.push(prop2);
		}
	}

	function buildscubaunits() {
		var scubaPositions = [
			[-50, -10, 0],
			[0, -8, -40],
			[40, -12, 20],
			[-25, -6, 50],
			[35, -10, -60]
		];

		for (var s = 0; s < scubaPositions.length; s++) {
			var pos = scubaPositions[s];

			var torso = new THREE.SphereGeometry(3, 8, 8);
			var scubaMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
			var body = new THREE.Mesh(torso, scubaMaterial);
			body.position.set(pos[0], pos[1], pos[2]);
			body.castShadow = true;
			scene.add(body);
			objects.push(body);

			var helmet = new THREE.SphereGeometry(2.5, 8, 8);
			var helmetMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var head = new THREE.Mesh(helmet, helmetMaterial);
			head.position.set(pos[0], pos[1] + 5, pos[2]);
			head.castShadow = true;
			scene.add(head);
			objects.push(head);

			var tank = new THREE.CylinderGeometry(1.5, 1.5, 8, 6);
			var tankMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
			var airTank = new THREE.Mesh(tank, tankMaterial);
			airTank.position.set(pos[0] + 4, pos[1] - 1, pos[2]);
			airTank.castShadow = true;
			scene.add(airTank);
			objects.push(airTank);

			var leg1 = new THREE.BoxGeometry(1.5, 6, 1.5);
			var legMaterial = new THREE.MeshLambertMaterial({ color: 0x0000aa });
			var leftLeg = new THREE.Mesh(leg1, legMaterial);
			leftLeg.position.set(pos[0] - 2, pos[1] - 8, pos[2]);
			leftLeg.castShadow = true;
			scene.add(leftLeg);
			objects.push(leftLeg);

			var leg2 = new THREE.BoxGeometry(1.5, 6, 1.5);
			var rightLeg = new THREE.Mesh(leg2, legMaterial);
			rightLeg.position.set(pos[0] + 2, pos[1] - 8, pos[2]);
			rightLeg.castShadow = true;
			scene.add(rightLeg);
			objects.push(rightLeg);
		}
	}

	function buildsunkendestroyerweaponscache() {
		var hullLower = new THREE.BoxGeometry(80, 12, 25);
		var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var hull = new THREE.Mesh(hullLower, hullMaterial);
		hull.position.set(-10, -35, -30);
		hull.rotation.z = 0.15;
		hull.castShadow = true;
		scene.add(hull);
		objects.push(hull);

		var superstructure = new THREE.BoxGeometry(40, 15, 20);
		var superMaterial = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var superStruct = new THREE.Mesh(superstructure, superMaterial);
		superStruct.position.set(-15, -20, -30);
		superStruct.castShadow = true;
		scene.add(superStruct);
		objects.push(superStruct);

		for (var g = 0; g < 2; g++) {
			var gunBarrel = new THREE.CylinderGeometry(2, 2, 20, 6);
			var gunMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
			var gun = new THREE.Mesh(gunBarrel, gunMaterial);
			gun.position.set(-20 + g * 40, -15, -30);
			gun.rotation.z = Math.PI / 6;
			gun.castShadow = true;
			scene.add(gun);
			objects.push(gun);
		}

		for (var t = 0; t < 4; t++) {
			var torpedo = new THREE.CylinderGeometry(2, 2, 12, 8);
			var torpedoMaterial = new THREE.MeshLambertMaterial({ color: 0x888800 });
			var torp = new THREE.Mesh(torpedo, torpedoMaterial);
			torp.position.set(-30 + t * 20, -30, -30);
			torp.rotation.z = Math.PI / 2;
			torp.castShadow = true;
			scene.add(torp);
			objects.push(torp);
		}

		var bridgeStructure = new THREE.ConeGeometry(10, 20, 8);
		var bridgeMaterial = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
		var bridge = new THREE.Mesh(bridgeStructure, bridgeMaterial);
		bridge.position.set(-10, -10, -30);
		bridge.castShadow = true;
		scene.add(bridge);
		objects.push(bridge);

		for (var c = 0; c < 6; c++) {
			var containerBox = new THREE.BoxGeometry(15, 8, 10);
			var containerMaterial = new THREE.MeshLambertMaterial({ color: 0xcc8800 });
			var container = new THREE.Mesh(containerBox, containerMaterial);
			container.position.set(-50 + c * 20, -40, -30);
			container.castShadow = true;
			scene.add(container);
			objects.push(container);
		}
	}

	function update(delta) {
		for (var i = 0; i < animatedObjects.length; i++) {
			var animated = animatedObjects[i];

			if (animated.type === 'bobbing') {
				animated.mesh.position.y = animated.baseY + Math.sin(performance.now() * 0.001 * animated.speed) * 2;
			}

			if (animated.type === 'swaying') {
				var sway = Math.sin(performance.now() * 0.0008 * animated.speed) * 3;
				var sway2 = Math.cos(performance.now() * 0.0006 * animated.speed) * 2;
				animated.mesh.position.x = animated.baseX + sway;
				animated.mesh.position.z = animated.baseZ + sway2;
			}

			if (animated.type === 'patrolling') {
				animated.progress += delta * animated.speed / 140;
				if (animated.progress > 1) {
					animated.progress = 0;
				}
				var currentPos = new THREE.Vector3();
				currentPos.lerpVectors(animated.start, animated.end, animated.progress);
				animated.mesh.position.copy(currentPos);
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
		animatedObjects = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
