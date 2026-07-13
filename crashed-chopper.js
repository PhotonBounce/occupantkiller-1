window.CrashedChopper = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var gameObjects = [];
	var fireParticles = [];
	var beaconLight = null;
	var beaconMesh = null;
	var fuelPoolMesh = null;
	var rotorBlades = [];
	var fireTexture = null;
	var time = 0;

	function createMaterial(color, emissive, metalness, roughness) {
		return new THREE.MeshStandardMaterial({
			color: color,
			emissive: emissive || 0x000000,
			metalness: metalness !== undefined ? metalness : 0.6,
			roughness: roughness !== undefined ? roughness : 0.4
		});
	}

	function addToScene(mesh) {
		scene.add(mesh);
		gameObjects.push(mesh);
		return mesh;
	}

	function createMainFuselage() {
		var fuselageGeom = new THREE.BoxGeometry(2.5, 1.8, 12);
		var fuselageMat = createMaterial(0x1a4d2e, 0x0a2015, 0.7, 0.3);
		var fuselage = new THREE.Mesh(fuselageGeom, fuselageMat);
		fuselage.position.set(0, 1.2, 0);
		fuselage.rotation.z = 0.5;
		fuselage.rotation.x = 0.3;
		fuselage.castShadow = true;
		fuselage.receiveShadow = true;
		addToScene(fuselage);

		var damageGeom = new THREE.BoxGeometry(2.6, 0.3, 4);
		var damageMat = createMaterial(0x8b4513, 0x4a2810, 0.8, 0.2);
		var damage = new THREE.Mesh(damageGeom, damageMat);
		damage.position.set(0.3, 2.5, -3);
		damage.rotation.z = 0.6;
		damage.castShadow = true;
		addToScene(damage);
	}

	function createRotorBlades() {
		for (var i = 0; i < 3; i++) {
			var angle = (Math.PI * 2 / 3) * i;
			var bladeGeom = new THREE.BoxGeometry(0.8, 0.05, 4.5);
			var bladeMat = createMaterial(0x2a2a2a, 0x0f0f0f, 0.9, 0.1);
			var blade = new THREE.Mesh(bladeGeom, bladeMat);
			blade.position.set(Math.cos(angle) * 3.5, 0.2, Math.sin(angle) * 3.5);
			blade.rotation.y = angle;
			blade.rotation.z = 0.2;
			blade.castShadow = true;
			blade.receiveShadow = true;
			addToScene(blade);
			rotorBlades.push({ mesh: blade, baseY: blade.position.y });
		}
	}

	function createTailBoom() {
		var tailGeom = new THREE.BoxGeometry(0.6, 0.5, 8);
		var tailMat = createMaterial(0x1a4d2e, 0x0a2015, 0.7, 0.3);
		var tail = new THREE.Mesh(tailGeom, tailMat);
		tail.position.set(-3.5, 0.8, 8);
		tail.rotation.z = -0.4;
		tail.rotation.x = -0.2;
		tail.castShadow = true;
		tail.receiveShadow = true;
		addToScene(tail);

		var tailBrokenGeom = new THREE.BoxGeometry(0.5, 0.4, 3);
		var brokenMat = createMaterial(0x654321, 0x3a2815, 0.8, 0.2);
		var tailBroken = new THREE.Mesh(tailBrokenGeom, brokenMat);
		tailBroken.position.set(-4.2, 1.5, 12);
		tailBroken.rotation.z = -0.7;
		tail.rotation.x = -0.5;
		tailBroken.castShadow = true;
		addToScene(tailBroken);
	}

	function createEngineNacelle() {
		var engineGeom = new THREE.CylinderGeometry(1.2, 1.2, 3.5, 16);
		var engineMat = createMaterial(0x1a1a1a, 0x0a0a0a, 0.95, 0.05);
		var engine = new THREE.Mesh(engineGeom, engineMat);
		engine.position.set(2.8, 1.5, -4);
		engine.rotation.z = 0.4;
		engine.castShadow = true;
		engine.receiveShadow = true;
		addToScene(engine);

		var turbineGeom = new THREE.CylinderGeometry(0.9, 0.9, 2, 8);
		var turbineMat = createMaterial(0x2a2a2a, 0x141414, 0.9, 0.1);
		var turbine = new THREE.Mesh(turbineGeom, turbineMat);
		turbine.position.set(2.8, 1.8, -4);
		turbine.rotation.z = 0.4;
		turbine.rotation.x = Math.random() * 0.3;
		turbine.castShadow = true;
		addToScene(turbine);
	}

	function createScatteredCargo() {
		var positions = [
			{ pos: [-5, 0.3, 3], rot: [0.3, 0.8, -0.2] },
			{ pos: [-4, 0.2, 5], rot: [-0.4, 1.2, 0.1] },
			{ pos: [-6, 0.4, 1], rot: [0.6, -0.5, 0.3] },
			{ pos: [-3, 0.25, 6], rot: [-0.2, 0.3, -0.5] },
			{ pos: [-7, 0.35, 4], rot: [0.4, 1.5, 0.2] }
		];

		for (var i = 0; i < positions.length; i++) {
			var crateGeom = new THREE.BoxGeometry(
				0.8 + Math.random() * 0.4,
				0.6 + Math.random() * 0.3,
				1.2 + Math.random() * 0.5
			);
			var crateMat = createMaterial(0x4a4a4a, 0x222222, 0.6, 0.4);
			var crate = new THREE.Mesh(crateGeom, crateMat);
			crate.position.set(positions[i].pos[0], positions[i].pos[1], positions[i].pos[2]);
			crate.rotation.set(positions[i].rot[0], positions[i].rot[1], positions[i].rot[2]);
			crate.castShadow = true;
			crate.receiveShadow = true;
			addToScene(crate);
		}
	}

	function createSeatCushions() {
		var cushionPositions = [
			[-3.5, 0.2, -5],
			[-2, 0.2, -6],
			[1, 0.15, -7],
			[2.5, 0.25, -4],
			[-1.5, 0.2, 2]
		];

		for (var i = 0; i < cushionPositions.length; i++) {
			var cushionGeom = new THREE.BoxGeometry(0.9, 0.25, 0.6);
			var cushionMat = createMaterial(0x4a4a3a, 0x1a1a0a, 0.3, 0.7);
			var cushion = new THREE.Mesh(cushionGeom, cushionMat);
			cushion.position.set(
				cushionPositions[i][0],
				cushionPositions[i][1],
				cushionPositions[i][2]
			);
			cushion.rotation.z = Math.random() * 0.4 - 0.2;
			cushion.castShadow = true;
			addToScene(cushion);
		}
	}

	function createFuelPool() {
		var poolGeom = new THREE.BoxGeometry(4, 0.1, 3.5);
		var poolMat = createMaterial(0x1a1a1a, 0x0a0a0a, 0.8, 0.2);
		fuelPoolMesh = new THREE.Mesh(poolGeom, poolMat);
		fuelPoolMesh.position.set(-2, 0.05, 2);
		fuelPoolMesh.receiveShadow = true;
		addToScene(fuelPoolMesh);

		var fireGeom = new THREE.SphereGeometry(1.2, 8, 8);
		var fireMat = createMaterial(0xff4500, 0xff6b00, 0.1, 0.8);
		var fire = new THREE.Mesh(fireGeom, fireMat);
		fire.position.set(-2, 0.8, 2);
		fire.castShadow = true;
		addToScene(fire);
		fireParticles.push({ mesh: fire, baseY: 0.8, wobbleTime: Math.random() * Math.PI * 2 });

		var fireGeom2 = new THREE.SphereGeometry(0.9, 8, 8);
		var fireMat2 = createMaterial(0xff6b1a, 0xffaa00, 0.05, 0.9);
		var fire2 = new THREE.Mesh(fireGeom2, fireMat2);
		fire2.position.set(-1, 1.2, 1.5);
		fire2.castShadow = true;
		addToScene(fire2);
		fireParticles.push({ mesh: fire2, baseY: 1.2, wobbleTime: Math.random() * Math.PI * 2 });
	}

	function createCrashFurrow() {
		var furrowGeom = new THREE.BoxGeometry(3, 0.08, 20);
		var furrowMat = createMaterial(0x2a2a1a, 0x0f0f0a, 0.2, 0.8);
		var furrow = new THREE.Mesh(furrowGeom, furrowMat);
		furrow.position.set(0, 0.02, 0);
		furrow.rotation.z = 0.15;
		furrow.receiveShadow = true;
		addToScene(furrow);
	}

	function createShatteredGlass() {
		var glassPositions = [
			[-1.2, 1.8, -8, 0.2, 0.3, 0.15],
			[-0.5, 1.9, -8.2, 0.15, 0.25, 0.1],
			[0.3, 1.85, -8, 0.18, 0.28, 0.12],
			[1, 1.95, -7.8, 0.22, 0.32, 0.16]
		];

		for (var i = 0; i < glassPositions.length; i++) {
			var gp = glassPositions[i];
			var glassGeom = new THREE.BoxGeometry(gp[3], gp[4], gp[5]);
			var glassMat = new THREE.MeshStandardMaterial({
				color: 0x88ccff,
				transparent: true,
				opacity: 0.5,
				metalness: 0.1,
				roughness: 0.1
			});
			var glass = new THREE.Mesh(glassGeom, glassMat);
			glass.position.set(gp[0], gp[1], gp[2]);
			glass.rotation.set(Math.random() * 0.4, Math.random() * 0.4, Math.random() * 0.4);
			glass.castShadow = true;
			addToScene(glass);
		}
	}

	function createCrumpledDoors() {
		var doorGeom = new THREE.BoxGeometry(1.5, 2, 0.2);
		var doorMat = createMaterial(0x1a4d2e, 0x0a2015, 0.7, 0.3);

		var door1 = new THREE.Mesh(doorGeom, doorMat);
		door1.position.set(3.2, 1.5, -5);
		door1.rotation.z = 0.8;
		door1.rotation.x = 0.3;
		door1.castShadow = true;
		addToScene(door1);

		var door2 = new THREE.Mesh(doorGeom, doorMat);
		door2.position.set(-3.5, 1.2, -6);
		door2.rotation.z = -0.9;
		door2.rotation.x = -0.2;
		door2.castShadow = true;
		addToScene(door2);
	}

	function createSkidGear() {
		var skidGeom = new THREE.BoxGeometry(0.3, 0.3, 2.5);
		var skidMat = createMaterial(0x3a3a2a, 0x1a1a0a, 0.7, 0.3);

		var skid1 = new THREE.Mesh(skidGeom, skidMat);
		skid1.position.set(-1.5, 0.1, -2);
		skid1.rotation.z = 0.4;
		skid1.castShadow = true;
		addToScene(skid1);

		var skid2 = new THREE.Mesh(skidGeom, skidMat);
		skid2.position.set(1.8, 0.1, 1);
		skid2.rotation.z = -0.35;
		skid2.castShadow = true;
		addToScene(skid2);
	}

	function createSurvivalKit() {
		var kitGeom = new THREE.BoxGeometry(0.5, 0.6, 0.8);
		var kitMat = createMaterial(0xff9900, 0xff6600, 0.4, 0.6);

		var kit1 = new THREE.Mesh(kitGeom, kitMat);
		kit1.position.set(-4.5, 0.3, -3);
		kit1.castShadow = true;
		addToScene(kit1);

		var kit2 = new THREE.Mesh(kitGeom, kitMat);
		kit2.position.set(2, 0.25, 4);
		kit2.rotation.y = 0.5;
		kit2.castShadow = true;
		addToScene(kit2);
	}

	function createFirstAidPack() {
		var aidGeom = new THREE.BoxGeometry(0.4, 0.5, 0.35);
		var aidMat = createMaterial(0xff3333, 0xff0000, 0.3, 0.7);
		var aid = new THREE.Mesh(aidGeom, aidMat);
		aid.position.set(-3, 0.2, 0);
		aid.castShadow = true;
		addToScene(aid);
	}

	function createRadioEquipment() {
		var radioGeom = new THREE.BoxGeometry(0.6, 0.4, 0.3);
		var radioMat = createMaterial(0x333333, 0x111111, 0.6, 0.4);

		var radio1 = new THREE.Mesh(radioGeom, radioMat);
		radio1.position.set(3.5, 0.25, -2);
		radio1.rotation.z = 0.3;
		radio1.castShadow = true;
		addToScene(radio1);

		var radio2 = new THREE.Mesh(radioGeom, radioMat);
		radio2.position.set(-5, 0.3, 5);
		radio2.castShadow = true;
		addToScene(radio2);
	}

	function createSurvivalBeacon() {
		var beaconGeom = new THREE.SphereGeometry(0.25, 16, 16);
		var beaconMat = new THREE.MeshStandardMaterial({
			color: 0xffff00,
			emissive: 0xff0000,
			metalness: 0.8,
			roughness: 0.2
		});
		beaconMesh = new THREE.Mesh(beaconGeom, beaconMat);
		beaconMesh.position.set(-1.5, 2.5, 3);
		beaconMesh.castShadow = true;
		addToScene(beaconMesh);

		beaconLight = new THREE.PointLight(0xff0000, 1.5, 8);
		beaconLight.position.copy(beaconMesh.position);
		scene.add(beaconLight);
	}

	function createEnemyPositions() {
		var enemySpots = [
			[-8, 0.3, -6],
			[8, 0.3, -5],
			[-7, 0.3, 8],
			[9, 0.3, 7]
		];

		for (var i = 0; i < enemySpots.length; i++) {
			var hideGeom = new THREE.BoxGeometry(1.5, 0.4, 1);
			var hideMat = createMaterial(0x2a4a2a, 0x0f1f0f, 0.5, 0.5);
			var hide = new THREE.Mesh(hideGeom, hideMat);
			hide.position.set(enemySpots[i][0], enemySpots[i][1], enemySpots[i][2]);
			hide.castShadow = true;
			addToScene(hide);
		}
	}

	function createDefensiveHide() {
		var hideGeom = new THREE.BoxGeometry(2.5, 1.2, 2);
		var hideMat = createMaterial(0x4a3a2a, 0x2a1a0a, 0.4, 0.6);
		var hide = new THREE.Mesh(hideGeom, hideMat);
		hide.position.set(5, 0.6, -8);
		hide.rotation.y = 0.3;
		hide.castShadow = true;
		addToScene(hide);
	}

	function createTreeDamage() {
		var treeGeom = new THREE.ConeGeometry(1.2, 5, 8);
		var treeMat = createMaterial(0x3a5a2a, 0x1a2a0a, 0.3, 0.7);

		var tree1 = new THREE.Mesh(treeGeom, treeMat);
		tree1.position.set(-10, 2.5, 2);
		tree1.rotation.z = 0.6;
		tree1.castShadow = true;
		addToScene(tree1);

		var tree2 = new THREE.Mesh(treeGeom, treeMat);
		tree2.position.set(10, 2.8, -4);
		tree2.rotation.z = -0.5;
		tree2.castShadow = true;
		addToScene(tree2);
	}

	function createFireExtinguisher() {
		var extGeom = new THREE.CylinderGeometry(0.2, 0.25, 1.5, 8);
		var extMat = createMaterial(0xcc0000, 0x660000, 0.8, 0.2);
		var ext = new THREE.Mesh(extGeom, extMat);
		ext.position.set(4, 0.8, 2);
		ext.castShadow = true;
		addToScene(ext);

		var nozzleGeom = new THREE.CylinderGeometry(0.08, 0.06, 0.4, 6);
		var nozzleMat = createMaterial(0x1a1a1a, 0x000000, 0.9, 0.1);
		var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
		nozzle.position.set(4, 1.45, 2);
		nozzle.castShadow = true;
		addToScene(nozzle);
	}

	function init(sceneArg, cameraArg) {
		scene = sceneArg;
		camera = cameraArg;
		gameObjects = [];
		fireParticles = [];
		rotorBlades = [];
		time = 0;

		createMainFuselage();
		createRotorBlades();
		createTailBoom();
		createEngineNacelle();
		createScatteredCargo();
		createSeatCushions();
		createFuelPool();
		createCrashFurrow();
		createShatteredGlass();
		createCrumpledDoors();
		createSkidGear();
		createSurvivalKit();
		createFirstAidPack();
		createRadioEquipment();
		createSurvivalBeacon();
		createEnemyPositions();
		createDefensiveHide();
		createTreeDamage();
		createFireExtinguisher();
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < fireParticles.length; i++) {
			var fire = fireParticles[i];
			var wobble = Math.sin(time * 3 + fire.wobbleTime) * 0.15;
			fire.mesh.position.y = fire.baseY + wobble;
			fire.mesh.scale.x = 1 + Math.sin(time * 2.5 + fire.wobbleTime) * 0.1;
			fire.mesh.scale.y = 1 + Math.cos(time * 2.8 + fire.wobbleTime) * 0.1;
			fire.mesh.scale.z = 1 + Math.sin(time * 2.3 + fire.wobbleTime) * 0.1;
		}

		if (beaconLight && beaconMesh) {
			var beaconBrighten = 0.8 + Math.sin(time * 4) * 0.7;
			beaconLight.intensity = beaconBrighten;
			beaconMesh.scale.set(
				1 + Math.sin(time * 4) * 0.15,
				1 + Math.sin(time * 4) * 0.15,
				1 + Math.sin(time * 4) * 0.15
			);
		}

		if (fuelPoolMesh) {
			fuelPoolMesh.material.emissive.setHex(
				parseInt('0a0a0a', 16) + parseInt(Math.floor(Math.sin(time * 2) * 5).toString(16), 16)
			);
		}

		for (var j = 0; j < rotorBlades.length; j++) {
			var blade = rotorBlades[j];
			var spinSpeed = 0.04;
			blade.mesh.rotation.y += spinSpeed;
			blade.mesh.position.y = blade.baseY + Math.sin(time * 1.5) * 0.08;
		}
	}

	function reset() {
		for (var i = 0; i < gameObjects.length; i++) {
			scene.remove(gameObjects[i]);
		}
		if (beaconLight) {
			scene.remove(beaconLight);
		}
		gameObjects = [];
		fireParticles = [];
		rotorBlades = [];
		time = 0;
		scene = null;
		camera = null;
		beaconLight = null;
		beaconMesh = null;
		fuelPoolMesh = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
