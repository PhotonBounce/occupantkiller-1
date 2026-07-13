window.SeilIslandBase = (function() {
	'use strict';

	var objects = [];
	var lights = [];

	function createMaterial(color) {
		return new THREE.MeshLambertMaterial({ color: color });
	}

	function addObject(mesh, scene) {
		objects.push(mesh);
		if (scene) {
			scene.add(mesh);
		}
	}

	function addLight(light, scene) {
		lights.push(light);
		if (scene) {
			scene.add(light);
		}
	}

	function buildBridgeArch(scene) {
		var archMaterial = createMaterial(0x888877);
		var startZ = -4;
		var boxWidth = 3;
		var boxHeight = 0.8;
		var boxDepth = 3;

		var heights = [0.5, 2, 2.5, 0.5];
		var positions = [
			{ x: -6, z: startZ },
			{ x: -2, z: startZ + 3 },
			{ x: 2, z: startZ + 6 },
			{ x: 6, z: startZ + 9 }
		];

		for (var i = 0; i < 4; i++) {
			var boxGeom = new THREE.BoxGeometry(boxWidth, heights[i], boxDepth);
			var archBox = new THREE.Mesh(boxGeom, archMaterial);
			archBox.position.set(positions[i].x, heights[i] / 2, positions[i].z);
			archBox.castShadow = true;
			archBox.receiveShadow = true;
			addObject(archBox, scene);
		}
	}

	function buildAbutmentTowers(scene) {
		var towerMaterial = createMaterial(0x777766);
		var towerWidth = 6;
		var towerHeight = 8;
		var towerDepth = 4;

		var leftTowerGeom = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
		var leftTower = new THREE.Mesh(leftTowerGeom, towerMaterial);
		leftTower.position.set(-10, towerHeight / 2, 0);
		leftTower.castShadow = true;
		leftTower.receiveShadow = true;
		addObject(leftTower, scene);

		var rightTowerGeom = new THREE.BoxGeometry(towerWidth, towerHeight, towerDepth);
		var rightTower = new THREE.Mesh(rightTowerGeom, towerMaterial);
		rightTower.position.set(10, towerHeight / 2, 12);
		rightTower.castShadow = true;
		rightTower.receiveShadow = true;
		addObject(rightTower, scene);
	}

	function buildTollHouse(scene) {
		var tollMaterial = createMaterial(0xEEEEDD);
		var tollGeom = new THREE.BoxGeometry(6, 5, 6);
		var tollHouse = new THREE.Mesh(tollGeom, tollMaterial);
		tollHouse.position.set(0, 2.5, -8);
		tollHouse.castShadow = true;
		tollHouse.receiveShadow = true;
		addObject(tollHouse, scene);
	}

	function buildVehicleBarrier(scene) {
		var barrierBaseMaterial = createMaterial(0x333333);
		var barrierStripeOrange = createMaterial(0xFF8800);
		var barrierStripeWhite = createMaterial(0xFFFFFF);

		var baseGeom = new THREE.BoxGeometry(0.5, 1, 8);
		var barrierBase = new THREE.Mesh(baseGeom, barrierBaseMaterial);
		barrierBase.position.set(0, 0.5, 5);
		barrierBase.castShadow = true;
		addObject(barrierBase, scene);
		scene.add(barrierBase);

		for (var i = 0; i < 4; i++) {
			var stripeGeom = new THREE.BoxGeometry(0.3, 0.5, 1.5);
			var stripeMaterial = (i % 2 === 0) ? barrierStripeOrange : barrierStripeWhite;
			var stripe = new THREE.Mesh(stripeGeom, stripeMaterial);
			stripe.position.set(0.5, 1.2, 1 + i * 1.8);
			stripe.castShadow = true;
			addObject(stripe, scene);
			scene.add(stripe);
		}

		var postMaterial = createMaterial(0x666666);
		for (var j = 0; j < 2; j++) {
			var postGeom = new THREE.CylinderGeometry(0.3, 0.3, 2, 12);
			var post = new THREE.Mesh(postGeom, postMaterial);
			post.position.set(-1.5 + j * 3, 1, 5);
			post.castShadow = true;
			addObject(post, scene);
			scene.add(post);
		}
	}

	function buildSlateQuarryCliff(scene) {
		var cliifMaterial = createMaterial(0x445566);
		var cliffGeom = new THREE.BoxGeometry(30, 20, 3);
		var cliff = new THREE.Mesh(cliffGeom, cliifMaterial);
		cliff.position.set(20, 10, -15);
		cliff.castShadow = true;
		cliff.receiveShadow = true;
		addObject(cliff, scene);
	}

	function buildQuarryMachinery(scene) {
		var machineryMaterial = createMaterial(0x667788);

		var craneBaseGeom = new THREE.BoxGeometry(2, 3, 2);
		var craneBase = new THREE.Mesh(craneBaseGeom, machineryMaterial);
		craneBase.position.set(15, 1.5, -10);
		craneBase.castShadow = true;
		addObject(craneBase, scene);
		scene.add(craneBase);

		var craneArmGeom = new THREE.BoxGeometry(1, 0.5, 8);
		var craneArm = new THREE.Mesh(craneArmGeom, machineryMaterial);
		craneArm.position.set(15, 4, -10);
		craneArm.castShadow = true;
		addObject(craneArm, scene);
		scene.add(craneArm);

		var cylinderGeom = new THREE.CylinderGeometry(0.4, 0.4, 5, 16);
		var cylinder = new THREE.Mesh(cylinderGeom, machineryMaterial);
		cylinder.position.set(25, 2.5, -10);
		cylinder.castShadow = true;
		addObject(cylinder, scene);
		scene.add(cylinder);
	}

	function buildCottageRow(scene) {
		var cottageMaterial = createMaterial(0xEEEEDD);
		var roofMaterial = createMaterial(0x888888);

		for (var i = 0; i < 5; i++) {
			var cottageGeom = new THREE.BoxGeometry(5, 4, 4);
			var cottage = new THREE.Mesh(cottageGeom, cottageMaterial);
			cottage.position.set(-12 + i * 6, 2, 18);
			cottage.castShadow = true;
			cottage.receiveShadow = true;
			addObject(cottage, scene);
			scene.add(cottage);

			var roofGeom = new THREE.ConeGeometry(3.5, 2.5, 8);
			var roof = new THREE.Mesh(roofGeom, roofMaterial);
			roof.position.set(-12 + i * 6, 5.5, 18);
			roof.castShadow = true;
			addObject(roof, scene);
			scene.add(roof);
		}
	}

	function buildPeatStack(scene) {
		var peatMaterial = createMaterial(0x5C3A1E);

		for (var i = 0; i < 3; i++) {
			for (var j = 0; j < 2; j++) {
				var peatGeom = new THREE.BoxGeometry(4, 3, 4);
				var peat = new THREE.Mesh(peatGeom, peatMaterial);
				peat.position.set(-8 + i * 5, 1.5, -20 + j * 5);
				peat.castShadow = true;
				peat.receiveShadow = true;
				addObject(peat, scene);
				scene.add(peat);
			}
		}
	}

	function addCheckpointLight(scene) {
		var checkpointLight = new THREE.PointLight(0xFF8800, 1.0, 50);
		checkpointLight.position.set(0, 6, -8);
		checkpointLight.castShadow = true;
		addLight(checkpointLight, scene);
	}

	function addQuarryFloodlight(scene) {
		var floodlight = new THREE.PointLight(0xFFFFFF, 1.2, 60);
		floodlight.position.set(20, 15, -15);
		floodlight.castShadow = true;
		addLight(floodlight, scene);
	}

	function createScene(scene) {
		if (!scene) {
			scene = new THREE.Scene();
		}

		buildBridgeArch(scene);
		buildAbutmentTowers(scene);
		buildTollHouse(scene);
		buildVehicleBarrier(scene);
		buildSlateQuarryCliff(scene);
		buildQuarryMachinery(scene);
		buildCottageRow(scene);
		buildPeatStack(scene);
		addCheckpointLight(scene);
		addQuarryFloodlight(scene);

		return scene;
	}

	var barrierState = 0;
	var barrierTarget = 0;
	var barrierSpeed = 2;

	function update(delta) {
		if (delta === undefined) {
			delta = 0.016;
		}

		barrierTarget = (Math.sin(Date.now() * 0.001) + 1) / 2;

		if (barrierTarget > 0.5 && barrierState < 1) {
			barrierState = Math.min(barrierState + barrierSpeed * delta, 1);
		} else if (barrierTarget <= 0.5 && barrierState > 0) {
			barrierState = Math.max(barrierState - barrierSpeed * delta, 0);
		}

		for (var i = 0; i < objects.length; i++) {
			var obj = objects[i];
			if (obj && obj.geometry && obj.geometry instanceof THREE.BoxGeometry) {
				if (obj.position.y === 0.5 || (obj.position.y === 1.2 && obj.position.z >= 1 && obj.position.z <= 7.4)) {
					obj.position.y = 0.5 + barrierState * 2;
				}
			}
		}
	}

	function reset() {
		for (var i = objects.length - 1; i >= 0; i--) {
			if (objects[i].parent) {
				objects[i].parent.remove(objects[i]);
			}
		}
		objects = [];

		for (var j = lights.length - 1; j >= 0; j--) {
			if (lights[j].parent) {
				lights[j].parent.remove(lights[j]);
			}
		}
		lights = [];
	}

	function getObjects() {
		return objects;
	}

	function getLights() {
		return lights;
	}

	return {
		create: createScene,
		update: update,
		reset: reset,
		getObjects: getObjects,
		getLights: getLights,
		objects: objects,
		lights: lights
	};
}());
