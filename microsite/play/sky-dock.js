window.SkyDock = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var clouds = [];
	var beacon = null;
	var beaconLight = null;
	var gantryArms = [];
	var cranes = [];

	function buildMast() {
		var mast = new THREE.Mesh(
			new THREE.CylinderGeometry(8, 8, 120, 16),
			new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.7 })
		);
		mast.position.set(0, 40, 0);
		scene.add(mast);
		objects.push(mast);
		return mast;
	}

	function buildDeckPlatforms() {
		var deckA = new THREE.Mesh(
			new THREE.BoxGeometry(180, 8, 160),
			new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.6 })
		);
		deckA.position.set(0, 0, 0);
		scene.add(deckA);
		objects.push(deckA);

		var deckB = new THREE.Mesh(
			new THREE.BoxGeometry(160, 6, 140),
			new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5 })
		);
		deckB.position.set(0, 12, 20);
		scene.add(deckB);
		objects.push(deckB);
	}

	function buildAirshipHull() {
		var hull = new THREE.Mesh(
			new THREE.BoxGeometry(50, 28, 140),
			new THREE.MeshStandardMaterial({ color: 0x4a4a4a, metalness: 0.4 })
		);
		hull.position.set(0, 50, -40);
		scene.add(hull);
		objects.push(hull);

		var nose = new THREE.Mesh(
			new THREE.ConeGeometry(16, 35, 12),
			new THREE.MeshStandardMaterial({ color: 0x3a3a3a, metalness: 0.5 })
		);
		nose.position.set(0, 50, -110);
		nose.rotation.z = Math.PI / 2;
		scene.add(nose);
		objects.push(nose);
	}

	function buildGantryArms() {
		for (var i = 0; i < 3; i++) {
			var xPos = (i - 1) * 70;
			var armBeam = new THREE.Mesh(
				new THREE.BoxGeometry(12, 12, 120),
				new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8 })
			);
			armBeam.position.set(xPos, 35, 0);
			armBeam.rotation.z = Math.PI / 12;
			scene.add(armBeam);
			gantryArms.push(armBeam);

			var cableA = new THREE.BufferGeometry();
			cableA.setAttribute('position', new THREE.BufferAttribute(
				new Float32Array([xPos, 35, 60, xPos + 40, 20, 50]), 3
			));
			var cableMeshA = new THREE.LineSegments(cableA, new THREE.LineBasicMaterial({ color: 0xcccccc }));
			scene.add(cableMeshA);

			var cableB = new THREE.BufferGeometry();
			cableB.setAttribute('position', new THREE.BufferAttribute(
				new Float32Array([xPos, 35, -60, xPos - 40, 15, -50]), 3
			));
			var cableMeshB = new THREE.LineSegments(cableB, new THREE.LineBasicMaterial({ color: 0xcccccc }));
			scene.add(cableMeshB);
		}
	}

	function buildSupplyCranes() {
		for (var i = 0; i < 2; i++) {
			var craneX = (i === 0) ? -60 : 60;
			var craneBase = new THREE.Mesh(
				new THREE.CylinderGeometry(6, 8, 25, 8),
				new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.5 })
			);
			craneBase.position.set(craneX, 8, 50);
			scene.add(craneBase);
			cranes.push(craneBase);

			var craneBoom = new THREE.Mesh(
				new THREE.BoxGeometry(8, 8, 70),
				new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6 })
			);
			craneBoom.position.set(craneX, 32, 85);
			scene.add(craneBoom);
			cranes.push(craneBoom);
		}
	}

	function buildFuelLines() {
		var positions = [
			[0, 5, -80, 35, 8, -60],
			[0, 5, 80, -35, 8, 60],
			[-90, 10, 0, -70, 12, 40]
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(
				new Float32Array(pos), 3
			));
			var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xff6600, linewidth: 2 }));
			scene.add(line);
		}
	}

	function buildAAGuns() {
		var gunPositions = [[85, 15, 60], [-85, 15, 60], [85, 15, -70], [-85, 15, -70]];

		for (var i = 0; i < gunPositions.length; i++) {
			var pos = gunPositions[i];
			var gunBase = new THREE.Mesh(
				new THREE.CylinderGeometry(4, 6, 3, 8),
				new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.7 })
			);
			gunBase.position.set(pos[0], pos[1], pos[2]);
			scene.add(gunBase);

			var gunBarrel = new THREE.Mesh(
				new THREE.CylinderGeometry(1.5, 1.5, 20, 6),
				new THREE.MeshStandardMaterial({ color: 0x0a0a0a, metalness: 0.9 })
			);
			gunBarrel.position.set(pos[0], pos[1] + 12, pos[2]);
			gunBarrel.rotation.z = Math.PI / 6;
			scene.add(gunBarrel);
		}
	}

	function buildControlTower() {
		var towerBase = new THREE.Mesh(
			new THREE.BoxGeometry(16, 35, 16),
			new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 })
		);
		towerBase.position.set(0, 30, 75);
		scene.add(towerBase);

		var towerTop = new THREE.Mesh(
			new THREE.CylinderGeometry(10, 12, 8, 8),
			new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.6 })
		);
		towerTop.position.set(0, 63, 75);
		scene.add(towerTop);

		var beaconMast = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1, 15, 6),
			new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 })
		);
		beaconMast.position.set(0, 75, 75);
		scene.add(beaconMast);

		beacon = new THREE.Mesh(
			new THREE.SphereGeometry(2, 8, 8),
			new THREE.MeshStandardMaterial({ color: 0xffff00, emissive: 0xff8800, emissiveIntensity: 1.2 })
		);
		beacon.position.set(0, 83, 75);
		scene.add(beacon);

		beaconLight = new THREE.PointLight(0xff8800, 1.5, 200);
		beaconLight.position.set(0, 83, 75);
		scene.add(beaconLight);
	}

	function buildCloudLayer() {
		for (var i = 0; i < 20; i++) {
			var cloudX = (Math.random() - 0.5) * 600;
			var cloudZ = (Math.random() - 0.5) * 500 - 150;
			var cloudScale = 1 + Math.random() * 1.5;

			var cloud = new THREE.Mesh(
				new THREE.SphereGeometry(12 * cloudScale, 8, 8),
				new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xcccccc })
			);
			cloud.position.set(cloudX, -80 - Math.random() * 40, cloudZ);
			scene.add(cloud);
			clouds.push({ mesh: cloud, startX: cloudX });
		}
	}

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		clouds = [];
		gantryArms = [];
		cranes = [];

		var skyLight = new THREE.HemisphereLight(0x87ceeb, 0x444444, 1.2);
		scene.add(skyLight);

		var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
		sunLight.position.set(100, 100, 100);
		scene.add(sunLight);

		buildMast();
		buildDeckPlatforms();
		buildAirshipHull();
		buildGantryArms();
		buildSupplyCranes();
		buildFuelLines();
		buildAAGuns();
		buildControlTower();
		buildCloudLayer();
	}

	function update(delta) {
		if (beacon) {
			beacon.rotation.y += delta * 2;
		}

		for (var i = 0; i < clouds.length; i++) {
			var cloud = clouds[i];
			cloud.mesh.position.x += delta * 8;
			if (cloud.mesh.position.x > 350) {
				cloud.mesh.position.x = -350;
			}
		}

		if (beaconLight) {
			beaconLight.intensity = 1.5 + Math.sin(Date.now() * 0.003) * 0.5;
		}
	}

	function reset() {
		objects.length = 0;
		clouds.length = 0;
		gantryArms.length = 0;
		cranes.length = 0;
		beacon = null;
		beaconLight = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
