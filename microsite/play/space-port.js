window.SpacePort = (function() {
	'use strict';

	var scene;
	var camera;
	var envObjects = [];

	function buildRocket() {
		var rocketGroup = new THREE.Group();

		var bodyGeom = new THREE.CylinderGeometry(8, 8, 40, 16);
		var bodyMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
		var body = new THREE.Mesh(bodyGeom, bodyMat);
		body.position.y = 20;
		body.castShadow = true;
		body.receiveShadow = true;
		rocketGroup.add(body);

		var noseGeom = new THREE.ConeGeometry(8, 12, 16);
		var noseMat = new THREE.MeshPhongMaterial({ color: 0xff6600 });
		var nose = new THREE.Mesh(noseGeom, noseMat);
		nose.position.y = 50;
		nose.castShadow = true;
		rocketGroup.add(nose);

		var finGeom = new THREE.BoxGeometry(2, 8, 10);
		var finMat = new THREE.MeshPhongMaterial({ color: 0x1a1a2e });
		for (var i = 0; i < 3; i++) {
			var fin = new THREE.Mesh(finGeom, finMat);
			fin.position.set(Math.cos(i * Math.PI * 2 / 3) * 10, 8, Math.sin(i * Math.PI * 2 / 3) * 10);
			fin.rotation.z = Math.PI / 6;
			fin.castShadow = true;
			rocketGroup.add(fin);
		}

		var nozzleGeom = new THREE.ConeGeometry(6, 8, 12);
		var nozzleMat = new THREE.MeshPhongMaterial({ color: 0xff4400, emissive: 0xff2200 });
		var nozzle = new THREE.Mesh(nozzleGeom, nozzleMat);
		nozzle.position.y = 2;
		nozzle.rotation.x = Math.PI;
		nozzle.castShadow = true;
		rocketGroup.add(nozzle);

		rocketGroup.position.set(0, 0, 0);
		return rocketGroup;
	}

	function buildLaunchPad() {
		var padGroup = new THREE.Group();

		var platformGeom = new THREE.BoxGeometry(40, 2, 40);
		var platformMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
		var platform = new THREE.Mesh(platformGeom, platformMat);
		platform.position.y = 0.5;
		platform.receiveShadow = true;
		padGroup.add(platform);

		var gantryGeom = new THREE.BoxGeometry(6, 60, 6);
		var gantryMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
		for (var i = 0; i < 4; i++) {
			var gantry = new THREE.Mesh(gantryGeom, gantryMat);
			var angle = i * Math.PI / 2;
			gantry.position.set(Math.cos(angle) * 18, 30, Math.sin(angle) * 18);
			gantry.castShadow = true;
			gantry.receiveShadow = true;
			padGroup.add(gantry);
		}

		var armPoints = [new THREE.Vector3(0, 25, 0), new THREE.Vector3(15, 20, 0)];
		var armGeom = new THREE.BufferGeometry().setFromPoints(armPoints);
		var armMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 3 });
		var armLine = new THREE.LineSegments(armGeom, armMat);
		padGroup.add(armLine);

		return padGroup;
	}

	function buildFuelArms() {
		var armsGroup = new THREE.Group();

		for (var j = 0; j < 2; j++) {
			var pivotGeom = new THREE.CylinderGeometry(2, 2, 2, 8);
			var pivotMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
			var pivot = new THREE.Mesh(pivotGeom, pivotMat);
			pivot.position.set(-15 + j * 30, 15, -20);
			pivot.rotation.z = Math.PI / 2;
			pivot.castShadow = true;
			armsGroup.add(pivot);

			var beamGeom = new THREE.BoxGeometry(1.5, 1.5, 20);
			var beamMat = new THREE.MeshPhongMaterial({ color: 0xffaa00 });
			var beam = new THREE.Mesh(beamGeom, beamMat);
			beam.position.set(-15 + j * 30, 15, 0);
			beam.castShadow = true;
			armsGroup.add(beam);
		}

		return armsGroup;
	}

	function buildBlastDeflector() {
		var deflectorGroup = new THREE.Group();

		var troughGeom = new THREE.BoxGeometry(50, 3, 30);
		var troughMat = new THREE.MeshPhongMaterial({ color: 0x1a1a1a });
		var trough = new THREE.Mesh(troughGeom, troughMat);
		trough.position.set(0, 0.5, -40);
		trough.rotation.z = 0.3;
		trough.receiveShadow = true;
		trough.castShadow = true;
		deflectorGroup.add(trough);

		var wallGeom = new THREE.BoxGeometry(3, 12, 30);
		var wallMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
		for (var k = 0; k < 2; k++) {
			var wall = new THREE.Mesh(wallGeom, wallMat);
			wall.position.set(-26 + k * 52, 6, -40);
			wall.castShadow = true;
			wall.receiveShadow = true;
			deflectorGroup.add(wall);
		}

		return deflectorGroup;
	}

	function buildMissionControl() {
		var controlGroup = new THREE.Group();

		var buildingGeom = new THREE.BoxGeometry(20, 18, 25);
		var buildingMat = new THREE.MeshPhongMaterial({ color: 0x2a2a3e });
		var building = new THREE.Mesh(buildingGeom, buildingMat);
		building.position.set(-50, 9, 0);
		building.castShadow = true;
		building.receiveShadow = true;
		controlGroup.add(building);

		var antennaRodGeom = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
		var antennaMat = new THREE.MeshPhongMaterial({ color: 0xcccccc });
		var rod = new THREE.Mesh(antennaRodGeom, antennaMat);
		rod.position.set(-50, 25, 0);
		rod.castShadow = true;
		controlGroup.add(rod);

		for (var m = 0; m < 3; m++) {
			var dishGeom = new THREE.SphereGeometry(3, 16, 12);
			var dishMat = new THREE.MeshPhongMaterial({ color: 0xaaaaaa });
			var dish = new THREE.Mesh(dishGeom, dishMat);
			dish.scale.set(1, 0.4, 1);
			dish.position.set(-50 + (m - 1) * 8, 22, 5 + m * 2);
			dish.castShadow = true;
			dish.receiveShadow = true;
			controlGroup.add(dish);
		}

		return controlGroup;
	}

	function buildDefenseTowers() {
		var towersGroup = new THREE.Group();

		var positions = [
			{ x: 40, z: 40 },
			{ x: 40, z: -40 },
			{ x: -40, z: 40 },
			{ x: -40, z: -40 }
		];

		for (var t = 0; t < positions.length; t++) {
			var pos = positions[t];
			var towerGeom = new THREE.CylinderGeometry(4, 5, 25, 12);
			var towerMat = new THREE.MeshPhongMaterial({ color: 0x4a4a4a });
			var tower = new THREE.Mesh(towerGeom, towerMat);
			tower.position.set(pos.x, 12, pos.z);
			tower.castShadow = true;
			tower.receiveShadow = true;
			towersGroup.add(tower);

			var radomeGeom = new THREE.SphereGeometry(5, 12, 10);
			var radomeMat = new THREE.MeshPhongMaterial({ color: 0x666666, emissive: 0x222222 });
			var radome = new THREE.Mesh(radomeGeom, radomeMat);
			radome.position.set(pos.x, 27, pos.z);
			radome.castShadow = true;
			towersGroup.add(radome);
		}

		return towersGroup;
	}

	function buildBunkers() {
		var bunkersGroup = new THREE.Group();

		var bunkerPositions = [
			{ x: 20, z: -50 },
			{ x: -20, z: -50 }
		];

		for (var b = 0; b < bunkerPositions.length; b++) {
			var bpos = bunkerPositions[b];
			var outerGeom = new THREE.BoxGeometry(16, 10, 14);
			var outerMat = new THREE.MeshPhongMaterial({ color: 0x555555 });
			var outer = new THREE.Mesh(outerGeom, outerMat);
			outer.position.set(bpos.x, 5, bpos.z);
			outer.castShadow = true;
			outer.receiveShadow = true;
			bunkersGroup.add(outer);

			var innerGeom = new THREE.BoxGeometry(12, 6, 10);
			var innerMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
			var inner = new THREE.Mesh(innerGeom, innerMat);
			inner.position.set(bpos.x, 5, bpos.z);
			bunkersGroup.add(inner);
		}

		return bunkersGroup;
	}

	function buildSatelliteDishes() {
		var dishGroup = new THREE.Group();

		var positions = [
			{ x: 60, z: -20 },
			{ x: 60, z: 20 }
		];

		for (var d = 0; d < positions.length; d++) {
			var dpos = positions[d];
			var pedestalGeom = new THREE.CylinderGeometry(3, 4, 20, 12);
			var pedestalMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
			var pedestal = new THREE.Mesh(pedestalGeom, pedestalMat);
			pedestal.position.set(dpos.x, 10, dpos.z);
			pedestal.castShadow = true;
			pedestal.receiveShadow = true;
			dishGroup.add(pedestal);

			var sphereGeom = new THREE.SphereGeometry(6, 16, 12);
			var sphereMat = new THREE.MeshPhongMaterial({ color: 0xbbbbbb });
			var sphere = new THREE.Mesh(sphereGeom, sphereMat);
			sphere.scale.set(1, 0.3, 1);
			sphere.position.set(dpos.x, 26, dpos.z);
			sphere.castShadow = true;
			sphere.receiveShadow = true;
			dishGroup.add(sphere);
		}

		return dishGroup;
	}

	function buildPerimeterWalls() {
		var wallGroup = new THREE.Group();

		var wallGeom = new THREE.BoxGeometry(100, 8, 2);
		var wallMat = new THREE.MeshPhongMaterial({ color: 0x3a3a4a });

		var positions = [
			{ pos: [0, 4, 65], rot: 0 },
			{ pos: [0, 4, -65], rot: 0 },
			{ pos: [65, 4, 0], rot: Math.PI / 2 },
			{ pos: [-65, 4, 0], rot: Math.PI / 2 }
		];

		for (var w = 0; w < positions.length; w++) {
			var wpos = positions[w];
			var wall = new THREE.Mesh(wallGeom, wallMat);
			wall.position.set(wpos.pos[0], wpos.pos[1], wpos.pos[2]);
			wall.rotation.y = wpos.rot;
			wall.castShadow = true;
			wall.receiveShadow = true;
			wallGroup.add(wall);
		}

		return wallGroup;
	}

	function buildEnvironment() {
		envObjects = [];

		var ground = buildPerimeterWalls();
		scene.add(ground);
		envObjects.push(ground);

		var rocket = buildRocket();
		scene.add(rocket);
		envObjects.push(rocket);

		var pad = buildLaunchPad();
		scene.add(pad);
		envObjects.push(pad);

		var fuel = buildFuelArms();
		scene.add(fuel);
		envObjects.push(fuel);

		var blast = buildBlastDeflector();
		scene.add(blast);
		envObjects.push(blast);

		var control = buildMissionControl();
		scene.add(control);
		envObjects.push(control);

		var towers = buildDefenseTowers();
		scene.add(towers);
		envObjects.push(towers);

		var bunkers = buildBunkers();
		scene.add(bunkers);
		envObjects.push(bunkers);

		var dishes = buildSatelliteDishes();
		scene.add(dishes);
		envObjects.push(dishes);
	}

	function init(sc, cam) {
		scene = sc;
		camera = cam;
		buildEnvironment();
	}

	function update(delta) {
		for (var i = 0; i < envObjects.length; i++) {
			if (envObjects[i].children) {
				for (var j = 0; j < envObjects[i].children.length; j++) {
					var child = envObjects[i].children[j];
					if (child.userData && child.userData.rotating) {
						child.rotation.y += delta * 0.5;
					}
				}
			}
		}
	}

	function reset() {
		for (var i = envObjects.length - 1; i >= 0; i--) {
			scene.remove(envObjects[i]);
		}
		envObjects = [];
		buildEnvironment();
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
