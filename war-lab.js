window.WarLab = (function() {
	'use strict';

	var scene, camera;
	var objects = [];
	var centrifuge, mechArm, serverLights;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		centrifuge = null;
		mechArm = null;
		serverLights = [];

		buildWalls();
		buildFloor();
		buildSecurityPanels();
		buildTestChambers();
		buildPrototypeDisplays();
		buildParticleAccelerator();
		buildCentrifuges();
		buildLaboratoryBenches();
		buildAIControlRoom();
		buildMechSuit();
		buildLights();
	}

	function buildWalls() {
		var wallHeight = 8;
		var wallThickness = 0.2;
		var labWidth = 30;
		var labLength = 40;

		var wallGeometryHorizontal = new THREE.BoxGeometry(labWidth, wallHeight, wallThickness);
		var wallGeometryVertical = new THREE.BoxGeometry(wallThickness, wallHeight, labLength);
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0xf5f5f5 });

		var frontWall = new THREE.Mesh(wallGeometryHorizontal, wallMaterial);
		frontWall.position.z = -labLength / 2;
		frontWall.position.y = wallHeight / 2;
		scene.add(frontWall);
		objects.push(frontWall);

		var backWall = new THREE.Mesh(wallGeometryHorizontal, wallMaterial);
		backWall.position.z = labLength / 2;
		backWall.position.y = wallHeight / 2;
		scene.add(backWall);
		objects.push(backWall);

		var leftWall = new THREE.Mesh(wallGeometryVertical, wallMaterial);
		leftWall.position.x = -labWidth / 2;
		leftWall.position.y = wallHeight / 2;
		scene.add(leftWall);
		objects.push(leftWall);

		var rightWall = new THREE.Mesh(wallGeometryVertical, wallMaterial);
		rightWall.position.x = labWidth / 2;
		rightWall.position.y = wallHeight / 2;
		scene.add(rightWall);
		objects.push(rightWall);
	}

	function buildFloor() {
		var floorGeometry = new THREE.BoxGeometry(30, 0.5, 40);
		var floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
		var floor = new THREE.Mesh(floorGeometry, floorMaterial);
		floor.position.y = -0.25;
		scene.add(floor);
		objects.push(floor);

		var gridLines = 0;
		for (var i = -12; i <= 12; i += 3) {
			var lineGeometry = new THREE.BufferGeometry();
			var linePositions = new Float32Array([
				i, 0.1, -20,
				i, 0.1, 20
			]);
			lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0xdddddd });
			var line = new THREE.LineSegments(lineGeometry, lineMaterial);
			scene.add(line);
			objects.push(line);
			gridLines++;
		}

		for (var j = -18; j <= 18; j += 3) {
			var lineGeometry2 = new THREE.BufferGeometry();
			var linePositions2 = new Float32Array([
				-15, 0.1, j,
				15, 0.1, j
			]);
			lineGeometry2.setAttribute('position', new THREE.BufferAttribute(linePositions2, 3));
			var lineMaterial2 = new THREE.LineBasicMaterial({ color: 0xdddddd });
			var line2 = new THREE.LineSegments(lineGeometry2, lineMaterial2);
			scene.add(line2);
			objects.push(line2);
			gridLines++;
		}
	}

	function buildSecurityPanels() {
		var panelGeometry = new THREE.BoxGeometry(1.5, 2, 0.1);
		var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var screenMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

		for (var i = 0; i < 4; i++) {
			var panel = new THREE.Mesh(panelGeometry, panelMaterial);
			panel.position.x = -14 + i * 10;
			panel.position.y = 2;
			panel.position.z = -19.9;
			scene.add(panel);
			objects.push(panel);

			var screenGeometry = new THREE.BoxGeometry(1.3, 1.8, 0.05);
			var screen = new THREE.Mesh(screenGeometry, screenMaterial);
			screen.position.copy(panel.position);
			screen.position.z -= 0.1;
			scene.add(screen);
			objects.push(screen);
		}
	}

	function buildTestChambers() {
		var chamberWidth = 4;
		var chamberHeight = 3;
		var chamberDepth = 4;
		var glassGeometry = new THREE.BoxGeometry(chamberWidth, chamberHeight, chamberDepth);
		var glassMaterial = new THREE.MeshLambertMaterial({
			color: 0x7fbfff,
			transparent: true,
			opacity: 0.3
		});

		for (var i = 0; i < 3; i++) {
			var chamber = new THREE.Mesh(glassGeometry, glassMaterial);
			chamber.position.x = -8 + i * 8;
			chamber.position.y = chamberHeight / 2;
			chamber.position.z = 10;
			scene.add(chamber);
			objects.push(chamber);

			var frameGeometry = new THREE.BoxGeometry(chamberWidth + 0.2, chamberHeight + 0.2, 0.2);
			var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var frame = new THREE.Mesh(frameGeometry, frameMaterial);
			frame.position.copy(chamber.position);
			frame.position.z -= chamberDepth / 2 + 0.1;
			scene.add(frame);
			objects.push(frame);
		}
	}

	function buildPrototypeDisplays() {
		var pedestalGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
		var pedestalMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });

		var weaponMaterial = new THREE.MeshLambertMaterial({ color: 0xff6b35 });
		var cylinderGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 16);

		for (var i = 0; i < 4; i++) {
			var pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial);
			pedestal.position.x = -10 + i * 7;
			pedestal.position.y = 0.5;
			pedestal.position.z = -12;
			scene.add(pedestal);
			objects.push(pedestal);

			var weapon = new THREE.Mesh(cylinderGeometry, weaponMaterial);
			weapon.position.copy(pedestal.position);
			weapon.position.y += 2;
			scene.add(weapon);
			objects.push(weapon);

			var topGeometry = new THREE.SphereGeometry(0.4, 8, 8);
			var topMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var top = new THREE.Mesh(topGeometry, topMaterial);
			top.position.copy(weapon.position);
			top.position.y += 1.2;
			scene.add(top);
			objects.push(top);
		}
	}

	function buildParticleAccelerator() {
		var ringRadius = 6;
		var segmentCount = 12;
		var segmentGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
		var segmentMaterial = new THREE.MeshLambertMaterial({ color: 0x4a90e2 });

		for (var i = 0; i < segmentCount; i++) {
			var angle = (i / segmentCount) * Math.PI * 2;
			var x = Math.cos(angle) * ringRadius;
			var z = Math.sin(angle) * ringRadius;

			var segment = new THREE.Mesh(segmentGeometry, segmentMaterial);
			segment.position.set(x, 2, z);
			segment.position.z += 15;
			segment.rotation.z = angle;
			scene.add(segment);
			objects.push(segment);

			if (i < segmentCount - 1) {
				var nextAngle = ((i + 1) / segmentCount) * Math.PI * 2;
				var nextX = Math.cos(nextAngle) * ringRadius;
				var nextZ = Math.sin(nextAngle) * ringRadius;

				var connectionGeometry = new THREE.BufferGeometry();
				var connectionPositions = new Float32Array([
					x, 2, z + 15,
					nextX, 2, nextZ + 15
				]);
				connectionGeometry.setAttribute('position', new THREE.BufferAttribute(connectionPositions, 3));
				var connectionMaterial = new THREE.LineBasicMaterial({ color: 0x4a90e2 });
				var connection = new THREE.LineSegments(connectionGeometry, connectionMaterial);
				scene.add(connection);
				objects.push(connection);
			}
		}

		var centerGeometry = new THREE.SphereGeometry(0.8, 8, 8);
		var centerMaterial = new THREE.MeshLambertMaterial({ color: 0xff00ff });
		var center = new THREE.Mesh(centerGeometry, centerMaterial);
		center.position.z = 15;
		scene.add(center);
		objects.push(center);
	}

	function buildCentrifuges() {
		var baseGeometry = new THREE.BoxGeometry(2, 0.3, 2);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var spinnerGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 8);
		var spinnerMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333 });

		for (var i = 0; i < 2; i++) {
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.x = -8 + i * 16;
			base.position.y = 0.15;
			base.position.z = -15;
			scene.add(base);
			objects.push(base);

			var spinner = new THREE.Mesh(spinnerGeometry, spinnerMaterial);
			spinner.position.copy(base.position);
			spinner.position.y += 0.5;
			scene.add(spinner);
			objects.push(spinner);

			if (centrifuge === null) {
				centrifuge = spinner;
			}
		}
	}

	function buildLaboratoryBenches() {
		var benchTopGeometry = new THREE.BoxGeometry(4, 0.1, 2);
		var benchTopMaterial = new THREE.MeshLambertMaterial({ color: 0x8b4513 });

		var benchLegGeometry = new THREE.BoxGeometry(0.2, 1, 0.2);
		var benchLegMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		var equipmentGeometry = new THREE.BoxGeometry(0.8, 0.5, 0.8);
		var equipmentMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

		for (var i = 0; i < 3; i++) {
			var benchTop = new THREE.Mesh(benchTopGeometry, benchTopMaterial);
			benchTop.position.x = -10 + i * 10;
			benchTop.position.y = 0.5;
			benchTop.position.z = 5;
			scene.add(benchTop);
			objects.push(benchTop);

			for (var j = 0; j < 4; j++) {
				var leg = new THREE.Mesh(benchLegGeometry, benchLegMaterial);
				leg.position.copy(benchTop.position);
				leg.position.x += (j % 2 === 0 ? -1.8 : 1.8);
				leg.position.z += (j < 2 ? -0.8 : 0.8);
				leg.position.y -= 0.5;
				scene.add(leg);
				objects.push(leg);
			}

			for (var k = 0; k < 3; k++) {
				var equipment = new THREE.Mesh(equipmentGeometry, equipmentMaterial);
				equipment.position.copy(benchTop.position);
				equipment.position.x += -1.2 + k * 1.2;
				equipment.position.y += 0.3;
				scene.add(equipment);
				objects.push(equipment);
			}
		}
	}

	function buildAIControlRoom() {
		var roomGeometry = new THREE.BoxGeometry(6, 4, 4);
		var roomMaterial = new THREE.MeshLambertMaterial({
			color: 0x1a1a2e,
			transparent: true,
			opacity: 0.5
		});
		var room = new THREE.Mesh(roomGeometry, roomMaterial);
		room.position.set(10, 2, -10);
		scene.add(room);
		objects.push(room);

		var towerGeometry = new THREE.BoxGeometry(0.8, 3, 0.8);
		var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		for (var i = 0; i < 6; i++) {
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.x = 7 + (i % 2) * 1.5;
			tower.position.y = 1.5;
			tower.position.z = -10 + Math.floor(i / 2) * 1.5 - 1.5;
			scene.add(tower);
			objects.push(tower);

			for (var j = 0; j < 5; j++) {
				var lightGeometry = new THREE.SphereGeometry(0.15, 4, 4);
				var lightMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
				var light = new THREE.Mesh(lightGeometry, lightMaterial);
				light.position.copy(tower.position);
				light.position.y -= 1 + j * 0.5;
				scene.add(light);
				objects.push(light);
				serverLights.push(light);
			}
		}
	}

	function buildMechSuit() {
		var bodyGeometry = new THREE.BoxGeometry(1.5, 3, 1);
		var bodyMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
		var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
		body.position.set(-12, 1.5, 15);
		scene.add(body);
		objects.push(body);

		var headGeometry = new THREE.SphereGeometry(0.5, 8, 8);
		var headMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
		var head = new THREE.Mesh(headGeometry, headMaterial);
		head.position.copy(body.position);
		head.position.y += 2.2;
		scene.add(head);
		objects.push(head);

		var armGeometry = new THREE.CylinderGeometry(0.3, 0.3, 2, 8);
		var armMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });

		var leftArm = new THREE.Mesh(armGeometry, armMaterial);
		leftArm.position.copy(body.position);
		leftArm.position.x -= 1;
		leftArm.position.y += 0.5;
		scene.add(leftArm);
		objects.push(leftArm);

		var rightArm = new THREE.Mesh(armGeometry, armMaterial);
		rightArm.position.copy(body.position);
		rightArm.position.x += 1;
		rightArm.position.y += 0.5;
		rightArm.position.z += 0.5;
		scene.add(rightArm);
		objects.push(rightArm);
		mechArm = rightArm;

		var handGeometry = new THREE.SphereGeometry(0.25, 6, 6);
		var handMaterial = new THREE.MeshLambertMaterial({ color: 0xff8800 });
		var rightHand = new THREE.Mesh(handGeometry, handMaterial);
		rightHand.position.copy(rightArm.position);
		rightHand.position.y -= 1.2;
		scene.add(rightHand);
		objects.push(rightHand);

		var legGeometry = new THREE.BoxGeometry(0.5, 2, 0.5);
		var legMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		var leftLeg = new THREE.Mesh(legGeometry, legMaterial);
		leftLeg.position.copy(body.position);
		leftLeg.position.x -= 0.5;
		leftLeg.position.y -= 2;
		scene.add(leftLeg);
		objects.push(leftLeg);

		var rightLeg = new THREE.Mesh(legGeometry, legMaterial);
		rightLeg.position.copy(body.position);
		rightLeg.position.x += 0.5;
		rightLeg.position.y -= 2;
		scene.add(rightLeg);
		objects.push(rightLeg);

		var coreGeometry = new THREE.SphereGeometry(0.4, 8, 8);
		var coreMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
		var core = new THREE.Mesh(coreGeometry, coreMaterial);
		core.position.copy(body.position);
		scene.add(core);
		objects.push(core);
	}

	function buildLights() {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientLight);
		objects.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(10, 10, 5);
		scene.add(directionalLight);
		objects.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0x0099ff, 0.5, 30);
		pointLight1.position.set(0, 4, 15);
		scene.add(pointLight1);
		objects.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xff3333, 0.4, 20);
		pointLight2.position.set(-8, 2, -15);
		scene.add(pointLight2);
		objects.push(pointLight2);

		var pointLight3 = new THREE.PointLight(0x00ff00, 0.3, 25);
		pointLight3.position.set(10, 3, -10);
		scene.add(pointLight3);
		objects.push(pointLight3);
	}

	function update(delta) {
		if (centrifuge !== null) {
			centrifuge.rotation.y += delta * 3;
		}

		for (var i = 0; i < serverLights.length; i++) {
			var light = serverLights[i];
			var blink = Math.sin(Date.now() * 0.003 + i * 0.5) > 0;
			light.material.color.setHex(blink ? 0xff0000 : 0x660000);
		}

		if (mechArm !== null) {
			var armSway = Math.sin(Date.now() * 0.001) * 0.3;
			mechArm.rotation.z = armSway;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			if (obj.geometry !== undefined) {
				obj.geometry.dispose();
			}
			if (obj.material !== undefined) {
				if (obj.material.dispose !== undefined) {
					obj.material.dispose();
				}
			}
			scene.remove(obj);
		}

		objects = [];
		centrifuge = null;
		mechArm = null;
		serverLights = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
