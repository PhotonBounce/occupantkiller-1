window.MidnightRaid = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];

	function init(s, c) {
		scene = s;
		camera = c;
		objects = [];
		lights = [];

		scene.background = new THREE.Color(0x0a0a15);
		scene.fog = new THREE.Fog(0x0a0a15, 150, 300);

		var ambientLight = new THREE.AmbientLight(0x1a2a3a, 0.2);
		scene.add(ambientLight);
		lights.push(ambientLight);

		buildCompound();
		buildTowers();
		buildBarracks();
		buildMotorPool();
		buildLandingPad();
		buildAntennaMast();
		buildGate();
		addNightVisionLights();

		camera.position.set(80, 30, 80);
		camera.lookAt(0, 0, 0);
	}

	function buildCompound() {
		var wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
		var outerWall = new THREE.BoxGeometry(200, 20, 200);
		var wallMesh = new THREE.Mesh(outerWall, wallMaterial);
		wallMesh.position.y = 10;
		wallMesh.castShadow = true;
		scene.add(wallMesh);
		objects.push(wallMesh);

		var innerWall = new THREE.BoxGeometry(180, 20, 180);
		var innerMesh = new THREE.Mesh(innerWall, wallMaterial);
		innerMesh.position.y = 10;
		innerMesh.position.z = 5;
		innerMesh.castShadow = true;
		scene.add(innerMesh);
		objects.push(innerMesh);
	}

	function buildTowers() {
		var positions = [
			{ x: 95, z: 95 },
			{ x: -95, z: 95 },
			{ x: 95, z: -95 },
			{ x: -95, z: -95 }
		];

		var baseGeom = new THREE.CylinderGeometry(8, 10, 15, 16);
		var baseMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var turretGeom = new THREE.BoxGeometry(12, 8, 12);
		var turretMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];

			var base = new THREE.Mesh(baseGeom, baseMat);
			base.position.set(pos.x, 7.5, pos.z);
			base.castShadow = true;
			scene.add(base);
			objects.push(base);

			var turret = new THREE.Mesh(turretGeom, turretMat);
			turret.position.set(pos.x, 20, pos.z);
			turret.castShadow = true;
			scene.add(turret);
			objects.push(turret);

			var light = new THREE.PointLight(0x00ff44, 2, 80);
			light.position.set(pos.x, 22, pos.z);
			scene.add(light);
			lights.push(light);
		}
	}

	function buildBarracks() {
		var barracksPositions = [
			{ x: -40, z: 40 },
			{ x: 40, z: 40 },
			{ x: -40, z: -40 }
		];

		var buildingMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var windowMat = new THREE.MeshStandardMaterial({
			color: 0xffff44,
			emissive: 0x88aa00,
			emissiveIntensity: 0.8
		});

		for (var i = 0; i < barracksPositions.length; i++) {
			var pos = barracksPositions[i];

			var buildingGeom = new THREE.BoxGeometry(30, 18, 25);
			var building = new THREE.Mesh(buildingGeom, buildingMat);
			building.position.set(pos.x, 9, pos.z);
			building.castShadow = true;
			scene.add(building);
			objects.push(building);

			for (var j = 0; j < 4; j++) {
				var windowGeom = new THREE.BoxGeometry(3, 3, 0.5);
				var window = new THREE.Mesh(windowGeom, windowMat);
				window.position.set(pos.x - 10 + j * 8, 12, pos.z + 13);
				window.castShadow = true;
				scene.add(window);
				objects.push(window);
			}
		}
	}

	function buildMotorPool() {
		var truckGeom = new THREE.BoxGeometry(8, 5, 15);
		var truckMat = new THREE.MeshStandardMaterial({ color: 0x3a3a2a });

		var truckPositions = [
			{ x: 20, z: -50 },
			{ x: 35, z: -50 },
			{ x: 50, z: -50 },
			{ x: 20, z: -65 }
		];

		for (var i = 0; i < truckPositions.length; i++) {
			var pos = truckPositions[i];
			var truck = new THREE.Mesh(truckGeom, truckMat);
			truck.position.set(pos.x, 2.5, pos.z);
			truck.castShadow = true;
			scene.add(truck);
			objects.push(truck);
		}
	}

	function buildLandingPad() {
		var padGeom = new THREE.BoxGeometry(40, 0.5, 40);
		var padMat = new THREE.MeshStandardMaterial({ color: 0x1a3a1a, emissive: 0x004400 });
		var pad = new THREE.Mesh(padGeom, padMat);
		pad.position.set(0, 0.25, 0);
		pad.castShadow = true;
		scene.add(pad);
		objects.push(pad);

		var xLine = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(-20, 0.3, 0),
				new THREE.Vector3(20, 0.3, 0)
			]),
			new THREE.LineBasicMaterial({ color: 0x00ff44, linewidth: 2 })
		);
		scene.add(xLine);
		objects.push(xLine);

		var zLine = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(0, 0.3, -20),
				new THREE.Vector3(0, 0.3, 20)
			]),
			new THREE.LineBasicMaterial({ color: 0x00ff44, linewidth: 2 })
		);
		scene.add(zLine);
		objects.push(zLine);
	}

	function buildAntennaMast() {
		var mastGeom = new THREE.CylinderGeometry(0.8, 1, 40, 8);
		var mastMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a });
		var mast = new THREE.Mesh(mastGeom, mastMat);
		mast.position.set(60, 20, -70);
		mast.castShadow = true;
		scene.add(mast);
		objects.push(mast);

		var diskGeom = new THREE.CylinderGeometry(3, 0.5, 1, 16);
		var diskMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a });
		var disk = new THREE.Mesh(diskGeom, diskMat);
		disk.position.set(60, 38, -70);
		disk.castShadow = true;
		scene.add(disk);
		objects.push(disk);
	}

	function buildGate() {
		var gateGeom = new THREE.BoxGeometry(20, 15, 1);
		var gateMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a });
		var gate = new THREE.Mesh(gateGeom, gateMat);
		gate.position.set(0, 7.5, -100);
		gate.castShadow = true;
		scene.add(gate);
		objects.push(gate);

		var chargeGeom = new THREE.SphereGeometry(1.2, 8, 8);
		var chargeMat = new THREE.MeshStandardMaterial({
			color: 0xff4400,
			emissive: 0xff2200,
			emissiveIntensity: 0.6
		});

		var chargePositions = [
			{ x: -6, y: 8 },
			{ x: 6, y: 8 },
			{ x: 0, y: 4 }
		];

		for (var i = 0; i < chargePositions.length; i++) {
			var pos = chargePositions[i];
			var charge = new THREE.Mesh(chargeGeom, chargeMat);
			charge.position.set(pos.x, pos.y, -99.5);
			charge.castShadow = true;
			scene.add(charge);
			objects.push(charge);
		}
	}

	function addNightVisionLights() {
		var greenLightPositions = [
			{ x: 0, y: 15, z: 0 },
			{ x: -60, y: 12, z: 60 },
			{ x: 60, y: 12, z: -60 }
		];

		for (var i = 0; i < greenLightPositions.length; i++) {
			var pos = greenLightPositions[i];
			var light = new THREE.PointLight(0x00ff44, 1.5, 120);
			light.position.set(pos.x, pos.y, pos.z);
			scene.add(light);
			lights.push(light);
		}
	}

	function update(delta) {
		if (!scene) return;

		for (var i = 0; i < lights.length; i++) {
			var light = lights[i];
			if (light.intensity > 0) {
				light.intensity += Math.sin(Date.now() * 0.001 + i) * 0.3;
				if (light.intensity < 0.5) light.intensity = 0.5;
				if (light.intensity > 2) light.intensity = 2;
			}
		}

		for (var j = 0; j < objects.length; j++) {
			if (objects[j].rotation) {
				if (objects[j].geometry && objects[j].geometry.type === 'CylinderGeometry') {
					objects[j].rotation.y += delta * 0.3;
				}
			}
		}
	}

	function reset() {
		if (!scene) return;

		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}

		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
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
