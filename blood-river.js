window.BloodRiver = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animationData = {
		riverTime: 0,
		crowTime: 0,
		fireTime: 0,
		crowGroups: [],
		waterBoxes: []
	};

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animationData.riverTime = 0;
		animationData.crowTime = 0;
		animationData.fireTime = 0;
		animationData.crowGroups = [];
		animationData.waterBoxes = [];

		buildLighting();
		buildTerrain();
		buildRiver();
		buildBridge();
		buildFortifications();
		buildVillage();
		buildStronghold();
		buildEquipment();
		buildCrows();
		buildRopes();
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x4a1a1a, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var dirLight = new THREE.DirectionalLight(0xaa4444, 0.8);
		dirLight.position.set(100, 80, 50);
		dirLight.castShadow = true;
		dirLight.shadow.mapSize.width = 2048;
		dirLight.shadow.mapSize.height = 2048;
		scene.add(dirLight);
		lights.push(dirLight);

		var pointLight1 = new THREE.PointLight(0xff3333, 2, 150);
		pointLight1.position.set(80, 40, -60);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0xff6600, 1.5, 120);
		pointLight2.position.set(-80, 35, 40);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function buildTerrain() {
		var groundMaterial = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var groundGeom = new THREE.BoxGeometry(400, 2, 300);
		var ground = new THREE.Mesh(groundGeom, groundMaterial);
		ground.position.set(0, -50, 0);
		ground.castShadow = true;
		ground.receiveShadow = true;
		scene.add(ground);
		objects.push(ground);

		var leftCliff = new THREE.BoxGeometry(80, 120, 300);
		var cliffMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var leftCliffMesh = new THREE.Mesh(leftCliff, cliffMat);
		leftCliffMesh.position.set(-140, 10, 0);
		leftCliffMesh.castShadow = true;
		scene.add(leftCliffMesh);
		objects.push(leftCliffMesh);

		var rightCliff = new THREE.BoxGeometry(80, 150, 300);
		var rightCliffMesh = new THREE.Mesh(rightCliff, cliffMat);
		rightCliffMesh.position.set(140, 20, 0);
		rightCliffMesh.castShadow = true;
		scene.add(rightCliffMesh);
		objects.push(rightCliffMesh);

		var leftBank = new THREE.BoxGeometry(60, 3, 300);
		var bankMat = new THREE.MeshLambertMaterial({ color: 0x5a3a2a });
		var leftBankMesh = new THREE.Mesh(leftBank, bankMat);
		leftBankMesh.position.set(-50, -2, 0);
		leftBankMesh.castShadow = true;
		scene.add(leftBankMesh);
		objects.push(leftBankMesh);

		var rightBank = new THREE.BoxGeometry(60, 3, 300);
		var rightBankMesh = new THREE.Mesh(rightBank, bankMat);
		rightBankMesh.position.set(50, -2, 0);
		rightBankMesh.castShadow = true;
		scene.add(rightBankMesh);
		objects.push(rightBankMesh);
	}

	function buildRiver() {
		var waterMat = new THREE.MeshLambertMaterial({ color: 0x8a1a1a });
		var waterGeom = new THREE.BoxGeometry(60, 2, 300);
		var water = new THREE.Mesh(waterGeom, waterMat);
		water.position.set(0, -5, 0);
		water.castShadow = true;
		water.receiveShadow = true;
		scene.add(water);
		objects.push(water);

		for (var i = 0; i < 20; i++) {
			var flowMat = new THREE.MeshLambertMaterial({ color: 0x6a0a0a });
			var flowGeom = new THREE.BoxGeometry(8, 0.5, 15);
			var flowMesh = new THREE.Mesh(flowGeom, flowMat);
			flowMesh.position.set((Math.random() - 0.5) * 50, -3, (Math.random() - 0.5) * 300);
			scene.add(flowMesh);
			objects.push(flowMesh);
			animationData.waterBoxes.push({
				mesh: flowMesh,
				startZ: flowMesh.position.z,
				startX: flowMesh.position.x
			});
		}

		for (var j = 0; j < 8; j++) {
			var bloodMat = new THREE.MeshLambertMaterial({ color: 0xa01010 });
			var bloodGeom = new THREE.SphereGeometry(2, 8, 8);
			var bloodMesh = new THREE.Mesh(bloodGeom, bloodMat);
			bloodMesh.position.set((Math.random() - 0.5) * 40, -2, (Math.random() - 0.5) * 250);
			scene.add(bloodMesh);
			objects.push(bloodMesh);
		}
	}

	function buildBridge() {
		var beamMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var beamGeom = new THREE.CylinderGeometry(4, 4, 100, 16);

		var leftSupport = new THREE.Mesh(beamGeom, beamMat);
		leftSupport.position.set(-35, 5, 0);
		leftSupport.rotation.z = Math.PI / 2;
		leftSupport.castShadow = true;
		scene.add(leftSupport);
		objects.push(leftSupport);

		var rightSupport = new THREE.Mesh(beamGeom, beamMat);
		rightSupport.position.set(35, 5, 0);
		rightSupport.rotation.z = Math.PI / 2;
		rightSupport.castShadow = true;
		scene.add(rightSupport);
		objects.push(rightSupport);

		var archMat = new THREE.MeshLambertMaterial({ color: 0x6a6a6a });
		var archGeom = new THREE.CylinderGeometry(25, 25, 8, 32);
		var arch = new THREE.Mesh(archGeom, archMat);
		arch.position.set(0, 35, 0);
		arch.castShadow = true;
		scene.add(arch);
		objects.push(arch);

		var deckGeom = new THREE.BoxGeometry(20, 2, 30);
		var deckMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var deck = new THREE.Mesh(deckGeom, deckMat);
		deck.position.set(0, 30, 0);
		deck.castShadow = true;
		scene.add(deck);
		objects.push(deck);

		for (var i = 0; i < 12; i++) {
			var railGeom = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
			var railMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var rail = new THREE.Mesh(railGeom, railMat);
			rail.position.set((i - 6) * 3.5, 35, -12);
			rail.castShadow = true;
			scene.add(rail);
			objects.push(rail);

			var rail2 = new THREE.Mesh(railGeom, railMat);
			rail2.position.set((i - 6) * 3.5, 35, 12);
			rail2.castShadow = true;
			scene.add(rail2);
			objects.push(rail2);
		}
	}

	function buildFortifications() {
		var sandbagMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
		var sandbagGeom = new THREE.BoxGeometry(8, 4, 6);

		for (var i = 0; i < 15; i++) {
			var sandbag = new THREE.Mesh(sandbagGeom, sandbagMat);
			sandbag.position.set(-50 + (i % 5) * 10, 0, -80 + Math.floor(i / 5) * 10);
			sandbag.castShadow = true;
			scene.add(sandbag);
			objects.push(sandbag);
		}

		var bunkerGeom = new THREE.BoxGeometry(30, 20, 40);
		var bunkerMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
		bunker.position.set(-50, 5, -100);
		bunker.castShadow = true;
		scene.add(bunker);
		objects.push(bunker);

		var gunportGeom = new THREE.BoxGeometry(5, 5, 3);
		var gunportMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var gunport = new THREE.Mesh(gunportGeom, gunportMat);
		gunport.position.set(-50, 10, -120);
		scene.add(gunport);
		objects.push(gunport);
	}

	function buildVillage() {
		var houseMat = new THREE.MeshLambertMaterial({ color: 0x5a3a2a });
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x8a2a2a });

		for (var i = 0; i < 8; i++) {
			var houseGeom = new THREE.BoxGeometry(25, 25, 25);
			var house = new THREE.Mesh(houseGeom, houseMat);
			house.position.set(-80 + (i % 4) * 35, 5, 100 + Math.floor(i / 4) * 40);
			house.castShadow = true;
			scene.add(house);
			objects.push(house);

			var roofGeom = new THREE.ConeGeometry(20, 20, 4);
			var roof = new THREE.Mesh(roofGeom, roofMat);
			roof.position.set(house.position.x, 32, house.position.z);
			roof.castShadow = true;
			scene.add(roof);
			objects.push(roof);

			var doorGeom = new THREE.BoxGeometry(6, 10, 1);
			var doorMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var door = new THREE.Mesh(doorGeom, doorMat);
			door.position.set(house.position.x, 5, house.position.z - 13);
			scene.add(door);
			objects.push(door);
		}

		var smokeMat = new THREE.MeshLambertMaterial({ color: 0x5a5a5a });
		var smokeGeom = new THREE.CylinderGeometry(8, 8, 40, 12);
		var smoke = new THREE.Mesh(smokeGeom, smokeMat);
		smoke.position.set(-60, 30, 120);
		smoke.castShadow = true;
		scene.add(smoke);
		objects.push(smoke);

		var fireGeom = new THREE.SphereGeometry(12, 8, 8);
		var fireMat = new THREE.MeshLambertMaterial({ color: 0xff4400 });
		var fire = new THREE.Mesh(fireGeom, fireMat);
		fire.position.set(-60, 25, 120);
		fire.castShadow = true;
		scene.add(fire);
		objects.push(fire);
	}

	function buildStronghold() {
		var wallMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
		var wallGeom = new THREE.BoxGeometry(80, 50, 80);
		var mainWall = new THREE.Mesh(wallGeom, wallMat);
		mainWall.position.set(120, 15, 0);
		mainWall.castShadow = true;
		scene.add(mainWall);
		objects.push(mainWall);

		var towerGeom = new THREE.CylinderGeometry(15, 15, 60, 16);
		var towerMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });

		for (var i = 0; i < 4; i++) {
			var angle = (i / 4) * Math.PI * 2;
			var tower = new THREE.Mesh(towerGeom, towerMat);
			tower.position.set(
				120 + Math.cos(angle) * 50,
				20,
				Math.sin(angle) * 50
			);
			tower.castShadow = true;
			scene.add(tower);
			objects.push(tower);

			var torchGeom = new THREE.ConeGeometry(3, 8, 8);
			var torchMat = new THREE.MeshLambertMaterial({ color: 0xff6600 });
			var torch = new THREE.Mesh(torchGeom, torchMat);
			torch.position.set(tower.position.x, tower.position.y + 35, tower.position.z);
			scene.add(torch);
			objects.push(torch);
		}

		var gateGeom = new THREE.BoxGeometry(20, 40, 5);
		var gateMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
		var gate = new THREE.Mesh(gateGeom, gateMat);
		gate.position.set(120, 15, -50);
		gate.castShadow = true;
		scene.add(gate);
		objects.push(gate);

		var flagpoleGeom = new THREE.CylinderGeometry(2, 2, 60, 8);
		var flagpoleMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var flagpole = new THREE.Mesh(flagpoleGeom, flagpoleMat);
		flagpole.position.set(120, 45, 0);
		flagpole.castShadow = true;
		scene.add(flagpole);
		objects.push(flagpole);

		var flagGeom = new THREE.BoxGeometry(15, 10, 1);
		var flagMat = new THREE.MeshLambertMaterial({ color: 0x8a2a2a });
		var flag = new THREE.Mesh(flagGeom, flagMat);
		flag.position.set(135, 50, 0);
		flag.castShadow = true;
		scene.add(flag);
		objects.push(flag);
	}

	function buildEquipment() {
		var gunMat = new THREE.MeshLambertMaterial({ color: 0x3a3a3a });
		var gunGeom = new THREE.CylinderGeometry(1, 1, 15, 8);

		for (var i = 0; i < 10; i++) {
			var gun = new THREE.Mesh(gunGeom, gunMat);
			gun.position.set(-80 + Math.random() * 40, 0, -60 + Math.random() * 40);
			gun.rotation.z = Math.random() * Math.PI;
			gun.castShadow = true;
			scene.add(gun);
			objects.push(gun);
		}

		var helmetMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var helmetGeom = new THREE.SphereGeometry(5, 8, 8);

		for (var j = 0; j < 8; j++) {
			var helmet = new THREE.Mesh(helmetGeom, helmetMat);
			helmet.position.set(-70 + Math.random() * 50, 3, -40 + Math.random() * 50);
			helmet.castShadow = true;
			scene.add(helmet);
			objects.push(helmet);
		}

		var crateMat = new THREE.MeshLambertMaterial({ color: 0x5a5a3a });
		var crateGeom = new THREE.BoxGeometry(10, 10, 10);

		for (var k = 0; k < 6; k++) {
			var crate = new THREE.Mesh(crateGeom, crateMat);
			crate.position.set(-50 + Math.random() * 30, 5, -120 + Math.random() * 40);
			crate.castShadow = true;
			scene.add(crate);
			objects.push(crate);
		}

		var barrierMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
		var barrierGeom = new THREE.BoxGeometry(3, 8, 15);

		for (var m = 0; m < 12; m++) {
			var barrier = new THREE.Mesh(barrierGeom, barrierMat);
			barrier.position.set(-40 + (m % 4) * 15, 2, -100 + Math.floor(m / 4) * 20);
			barrier.castShadow = true;
			scene.add(barrier);
			objects.push(barrier);
		}
	}

	function buildCrows() {
		var crowBodyMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var crowBodyGeom = new THREE.SphereGeometry(3, 6, 6);

		for (var i = 0; i < 6; i++) {
			var crowGroup = [];
			var centerX = -40 + i * 30;
			var centerZ = 50;
			var radius = 40;

			for (var j = 0; j < 4; j++) {
				var crowBody = new THREE.Mesh(crowBodyGeom, crowBodyMat);
				crowBody.position.set(centerX, 60, centerZ);

				var crowHeadGeom = new THREE.SphereGeometry(1.5, 6, 6);
				var crowHeadMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
				var crowHead = new THREE.Mesh(crowHeadGeom, crowHeadMat);
				crowHead.position.set(0, 2, -2);
				crowBody.add(crowHead);

				var crowWingGeom = new THREE.BoxGeometry(2, 4, 8);
				var crowWingMat = new THREE.MeshLambertMaterial({ color: 0x0a0a0a });
				var crowWing = new THREE.Mesh(crowWingGeom, crowWingMat);
				crowWing.position.set(2, 0, 0);
				crowBody.add(crowWing);

				scene.add(crowBody);
				objects.push(crowBody);
				crowGroup.push({
					mesh: crowBody,
					centerX: centerX,
					centerZ: centerZ,
					radius: radius,
					offset: j,
					groupIndex: i
				});
			}
			animationData.crowGroups.push(crowGroup);
		}
	}

	function buildRopes() {
		var ropeMat = new THREE.MeshLambertMaterial({ color: 0x6a5a4a });
		var ropeGeom = new THREE.CylinderGeometry(1, 1, 150, 8);

		var rope1 = new THREE.Mesh(ropeGeom, ropeMat);
		rope1.position.set(-20, 40, -80);
		rope1.rotation.z = -0.3;
		rope1.castShadow = true;
		scene.add(rope1);
		objects.push(rope1);

		var rope2 = new THREE.Mesh(ropeGeom, ropeMat);
		rope2.position.set(20, 40, -80);
		rope2.rotation.z = 0.3;
		rope2.castShadow = true;
		scene.add(rope2);
		objects.push(rope2);

		var ferryGeom = new THREE.BoxGeometry(30, 3, 20);
		var ferryMat = new THREE.MeshLambertMaterial({ color: 0x5a5a4a });
		var ferry = new THREE.Mesh(ferryGeom, ferryMat);
		ferry.position.set(0, 10, -80);
		ferry.castShadow = true;
		scene.add(ferry);
		objects.push(ferry);

		for (var i = 0; i < 8; i++) {
			var postGeom = new THREE.CylinderGeometry(2, 2, 8, 8);
			var postMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var post = new THREE.Mesh(postGeom, postMat);
			post.position.set(-12 + (i % 4) * 8, 8, -80 + Math.floor(i / 4) * 15);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);
		}
	}

	function update(delta) {
		if (!scene || !camera) return;

		animationData.riverTime += delta;
		animationData.crowTime += delta;
		animationData.fireTime += delta;

		updateRiverFlow();
		updateCrowCircles();
		updateFireFlicker();
	}

	function updateRiverFlow() {
		for (var i = 0; i < animationData.waterBoxes.length; i++) {
			var waterBox = animationData.waterBoxes[i];
			var flowSpeed = 30;
			waterBox.mesh.position.z = waterBox.startZ - (animationData.riverTime * flowSpeed) % 300 + 150;
			waterBox.mesh.position.x = waterBox.startX + Math.sin(animationData.riverTime * 0.5 + i) * 8;
		}
	}

	function updateCrowCircles() {
		for (var i = 0; i < animationData.crowGroups.length; i++) {
			var crowGroup = animationData.crowGroups[i];
			for (var j = 0; j < crowGroup.length; j++) {
				var crow = crowGroup[j];
				var angle = (animationData.crowTime * 0.3 + (crow.offset / crowGroup.length) * Math.PI * 2);
				var x = crow.centerX + Math.cos(angle) * crow.radius;
				var z = crow.centerZ + Math.sin(angle) * crow.radius;
				var y = 60 + Math.sin(animationData.crowTime * 0.4 + crow.offset) * 15;

				crow.mesh.position.x = x;
				crow.mesh.position.y = y;
				crow.mesh.position.z = z;

				var lookX = crow.centerX + Math.cos(angle + 0.5) * (crow.radius * 0.8);
				var lookZ = crow.centerZ + Math.sin(angle + 0.5) * (crow.radius * 0.8);
				crow.mesh.lookAt(lookX, y, lookZ);
			}
		}
	}

	function updateFireFlicker() {
		var fireObjects = objects.filter(function(obj) {
			return obj.material && obj.material.color && obj.material.color.getHex() === 0xff4400;
		});

		for (var i = 0; i < fireObjects.length; i++) {
			var baseScale = 1 + Math.sin(animationData.fireTime * 4 + i) * 0.2;
			fireObjects[i].scale.set(baseScale, baseScale, baseScale);

			var hueVariation = Math.sin(animationData.fireTime * 3 + i * 0.5);
			var colorValue = Math.floor(0xff4400 + hueVariation * 0x220000);
			fireObjects[i].material.color.setHex(colorValue);
		}
	}

	function reset() {
		if (scene) {
			for (var i = objects.length - 1; i >= 0; i--) {
				scene.remove(objects[i]);
			}
			for (var j = lights.length - 1; j >= 0; j--) {
				scene.remove(lights[j]);
			}
		}

		scene = null;
		camera = null;
		objects = [];
		lights = [];
		animationData.riverTime = 0;
		animationData.crowTime = 0;
		animationData.fireTime = 0;
		animationData.crowGroups = [];
		animationData.waterBoxes = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
