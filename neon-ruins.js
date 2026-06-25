window.NeonRuins = (function() {
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

		buildneonskyscrapers();
		buildcollapsedways();
		buildholograms();
		buildhovervehicles();
		buildrubblewall();
		buildnightclub();
		builddroneswreckage();
		buildmercenarycamp();
		buildambientlighting();
	}

	function buildneonskyscrapers() {
		var colors = [0xFF1493, 0x00CED1, 0xDA70D6, 0xFF69B4, 0x00FFFF, 0xFF00FF];
		var positions = [
			{x: -20, y: 15, z: -30},
			{x: 0, y: 12, z: -35},
			{x: 20, y: 18, z: -25},
			{x: -15, y: 14, z: -45},
			{x: 25, y: 16, z: -40}
		];

		positions.forEach(function(pos, idx) {
			var skyscraperColor = colors[idx % colors.length];
			var height = 20 + Math.random() * 15;
			var width = 6 + Math.random() * 4;
			var depth = 5 + Math.random() * 3;

			var geometry = new THREE.BoxGeometry(width, height, depth);
			var material = new THREE.MeshLambertMaterial({
				color: skyscraperColor,
				emissive: skyscraperColor,
				emissiveIntensity: 0.6
			});
			var skyscraper = new THREE.Mesh(geometry, material);
			skyscraper.position.set(pos.x, pos.y, pos.z);
			scene.add(skyscraper);
			objects.push(skyscraper);

			var toplight = new THREE.PointLight(skyscraperColor, 1.5, 30);
			toplight.position.set(pos.x, pos.y + height / 2 + 3, pos.z);
			scene.add(toplight);
			lights.push(toplight);
		});
	}

	function buildcollapsedways() {
		var waySegments = [
			{x: -15, y: 8, z: -40, w: 25, h: 2, d: 4},
			{x: 10, y: 6, z: -50, w: 20, h: 2, d: 4},
			{x: -5, y: 5, z: -35, w: 18, h: 2.5, d: 4}
		];

		waySegments.forEach(function(seg) {
			var geometry = new THREE.BoxGeometry(seg.w, seg.h, seg.d);
			var material = new THREE.MeshLambertMaterial({
				color: 0x444444,
				emissive: 0x111111
			});
			var way = new THREE.Mesh(geometry, material);
			way.position.set(seg.x, seg.y, seg.z);
			way.rotation.z = (Math.random() - 0.5) * 0.3;
			scene.add(way);
			objects.push(way);

			var sparksCount = 3;
			for (var i = 0; i < sparksCount; i++) {
				var sparkLight = new THREE.PointLight(0xFF6600, 0.8, 8);
				sparkLight.position.set(
					seg.x + (Math.random() - 0.5) * seg.w,
					seg.y + 1,
					seg.z + (Math.random() - 0.5) * seg.d
				);
				scene.add(sparkLight);
				lights.push(sparkLight);
			}
		});
	}

	function buildholograms() {
		var hologramPositions = [
			{x: -25, y: 12, z: -20},
			{x: 15, y: 10, z: -30},
			{x: 0, y: 8, z: -45}
		];

		hologramPositions.forEach(function(pos) {
			var geometry = new THREE.BoxGeometry(8, 5, 0.3);
			var material = new THREE.MeshLambertMaterial({
				color: 0x00FFFF,
				emissive: 0x00FFFF,
				emissiveIntensity: 0.8
			});
			var hologram = new THREE.Mesh(geometry, material);
			hologram.position.set(pos.x, pos.y, pos.z);
			scene.add(hologram);
			objects.push(hologram);
			animatedObjects.push({
				obj: hologram,
				type: 'hologram',
				scale: 1.0
			});

			var hlight = new THREE.PointLight(0x00FFFF, 1.2, 25);
			hlight.position.set(pos.x, pos.y, pos.z + 2);
			scene.add(hlight);
			lights.push(hlight);
		});
	}

	function buildhovervehicles() {
		var vehiclePositions = [
			{x: -18, y: 3, z: -15},
			{x: 12, y: 2, z: -25},
			{x: 5, y: 3.5, z: -45},
			{x: -8, y: 2.5, z: -35}
		];

		vehiclePositions.forEach(function(pos) {
			var hullGeometry = new THREE.BoxGeometry(6, 2.5, 3);
			var hullColor = [0xFF1493, 0x00CED1, 0xDA70D6][Math.floor(Math.random() * 3)];
			var hullMaterial = new THREE.MeshLambertMaterial({
				color: hullColor,
				emissive: hullColor,
				emissiveIntensity: 0.4
			});
			var hull = new THREE.Mesh(hullGeometry, hullMaterial);
			hull.position.set(pos.x, pos.y, pos.z);
			scene.add(hull);
			objects.push(hull);

			var cockpitGeometry = new THREE.BoxGeometry(2, 1, 1.5);
			var cockpitMaterial = new THREE.MeshLambertMaterial({
				color: 0x00FFFF,
				emissive: 0x00FFFF,
				emissiveIntensity: 0.6
			});
			var cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
			cockpit.position.set(pos.x, pos.y + 1.5, pos.z);
			scene.add(cockpit);
			objects.push(cockpit);

			var wingGeometry = new THREE.BoxGeometry(0.8, 0.5, 2);
			var wingMaterial = new THREE.MeshLambertMaterial({
				color: 0x444444,
				emissive: 0x222222
			});
			var leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
			leftWing.position.set(pos.x - 4, pos.y, pos.z);
			scene.add(leftWing);
			objects.push(leftWing);

			var rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
			rightWing.position.set(pos.x + 4, pos.y, pos.z);
			scene.add(rightWing);
			objects.push(rightWing);
		});
	}

	function buildrubblewall() {
		var rubbleX = 30;
		var rubbleZ = -40;
		var rubbleCount = 25;

		for (var i = 0; i < rubbleCount; i++) {
			var size = 1 + Math.random() * 2.5;
			var geometry = new THREE.BoxGeometry(size, size, size);
			var rubbleColor = 0x333333 + Math.floor(Math.random() * 0x111111);
			var material = new THREE.MeshLambertMaterial({
				color: rubbleColor,
				emissive: 0x0A0A0A
			});
			var rubble = new THREE.Mesh(geometry, material);

			var row = Math.floor(i / 5);
			var col = i % 5;
			rubble.position.set(
				rubbleX - col * 3 + (Math.random() - 0.5) * 0.8,
				2 + row * 2.2 + (Math.random() - 0.5) * 1,
				rubbleZ + (Math.random() - 0.5) * 2
			);
			rubble.rotation.x = Math.random() * Math.PI;
			rubble.rotation.y = Math.random() * Math.PI;
			scene.add(rubble);
			objects.push(rubble);
		}

		var graffiti = new THREE.BoxGeometry(18, 15, 0.1);
		var graffitiMaterial = new THREE.MeshLambertMaterial({
			color: 0x00FF00,
			emissive: 0x00FF00,
			emissiveIntensity: 0.5
		});
		var graffitiMesh = new THREE.Mesh(graffiti, graffitiMaterial);
		graffitiMesh.position.set(rubbleX - 7, 8, rubbleZ - 1.5);
		scene.add(graffitiMesh);
		objects.push(graffitiMesh);

		var graffitiLight = new THREE.PointLight(0x00FF00, 1, 20);
		graffitiLight.position.set(rubbleX - 7, 8, rubbleZ + 2);
		scene.add(graffitiLight);
		lights.push(graffitiLight);
	}

	function buildnightclub() {
		var clubX = -35;
		var clubY = 2;
		var clubZ = -25;

		var buildingGeometry = new THREE.BoxGeometry(12, 8, 10);
		var buildingMaterial = new THREE.MeshLambertMaterial({
			color: 0x1a0033,
			emissive: 0x330066
		});
		var building = new THREE.Mesh(buildingGeometry, buildingMaterial);
		building.position.set(clubX, clubY, clubZ);
		scene.add(building);
		objects.push(building);

		var roofGeometry = new THREE.ConeGeometry(7, 4, 4);
		var roofMaterial = new THREE.MeshLambertMaterial({
			color: 0xFF1493,
			emissive: 0xFF1493,
			emissiveIntensity: 0.7
		});
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(clubX, clubY + 6, clubZ);
		scene.add(roof);
		objects.push(roof);
		animatedObjects.push({
			obj: roof,
			type: 'beacon',
			angle: 0
		});

		var signGeometry = new THREE.BoxGeometry(10, 2, 0.2);
		var signMaterial = new THREE.MeshLambertMaterial({
			color: 0xFFFF00,
			emissive: 0xFFFF00,
			emissiveIntensity: 0.9
		});
		var sign = new THREE.Mesh(signGeometry, signMaterial);
		sign.position.set(clubX, clubY + 5, clubZ + 5.5);
		scene.add(sign);
		objects.push(sign);
		animatedObjects.push({
			obj: sign,
			type: 'flicker',
			intensity: 0.9,
			phase: 0
		});

		var beaconLight = new THREE.PointLight(0xFF1493, 2, 40);
		beaconLight.position.set(clubX, clubY + 8, clubZ);
		scene.add(beaconLight);
		lights.push(beaconLight);
		animatedObjects.push({
			obj: beaconLight,
			type: 'beaconlight',
			intensity: 2
		});

		var entranceGeometry = new THREE.BoxGeometry(3, 4, 0.5);
		var entranceMaterial = new THREE.MeshLambertMaterial({
			color: 0x00FFFF,
			emissive: 0x00FFFF,
			emissiveIntensity: 0.8
		});
		var entrance = new THREE.Mesh(entranceGeometry, entranceMaterial);
		entrance.position.set(clubX - 2, clubY + 2, clubZ + 5.4);
		scene.add(entrance);
		objects.push(entrance);

		var doorLight = new THREE.PointLight(0x00FFFF, 1.5, 15);
		doorLight.position.set(clubX - 2, clubY + 2, clubZ + 6);
		scene.add(doorLight);
		lights.push(doorLight);
	}

	function builddroneswreckage() {
		var wreckSites = [
			{x: 8, y: 4, z: -55},
			{x: -22, y: 3, z: -48},
			{x: 18, y: 3.5, z: -38}
		];

		wreckSites.forEach(function(site) {
			var bodyGeometry = new THREE.BoxGeometry(3, 1.5, 3);
			var bodyMaterial = new THREE.MeshLambertMaterial({
				color: 0xFF6600,
				emissive: 0xFF3300,
				emissiveIntensity: 0.5
			});
			var body = new THREE.Mesh(bodyGeometry, bodyMaterial);
			body.position.set(site.x, site.y, site.z);
			body.rotation.z = (Math.random() - 0.5) * 1;
			scene.add(body);
			objects.push(body);

			var rotorCount = 4;
			for (var i = 0; i < rotorCount; i++) {
				var rotorGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.1, 16);
				var rotorMaterial = new THREE.MeshLambertMaterial({
					color: 0xFF00FF,
					emissive: 0x990099
				});
				var rotor = new THREE.Mesh(rotorGeometry, rotorMaterial);
				var angle = (i / rotorCount) * Math.PI * 2;
				rotor.position.set(
					site.x + Math.cos(angle) * 2,
					site.y + 1,
					site.z + Math.sin(angle) * 2
				);
				scene.add(rotor);
				objects.push(rotor);
			}

			var debrisCount = 5;
			for (var j = 0; j < debrisCount; j++) {
				var debrisSize = 0.3 + Math.random() * 0.8;
				var debrisGeometry = new THREE.BoxGeometry(debrisSize, debrisSize, debrisSize);
				var debrisMaterial = new THREE.MeshLambertMaterial({
					color: 0x555555,
					emissive: 0x111111
				});
				var debris = new THREE.Mesh(debrisGeometry, debrisMaterial);
				debris.position.set(
					site.x + (Math.random() - 0.5) * 5,
					site.y + 0.5 + Math.random() * 2,
					site.z + (Math.random() - 0.5) * 5
				);
				scene.add(debris);
				objects.push(debris);
			}
		});
	}

	function buildmercenarycamp() {
		var campX = 25;
		var campZ = -15;

		var tentCount = 4;
		for (var i = 0; i < tentCount; i++) {
			var tentGeometry = new THREE.ConeGeometry(2.5, 3, 8);
			var tentColor = [0xFF1493, 0x00CED1, 0xDA70D6, 0xFF69B4][i];
			var tentMaterial = new THREE.MeshLambertMaterial({
				color: tentColor,
				emissive: tentColor,
				emissiveIntensity: 0.4
			});
			var tent = new THREE.Mesh(tentGeometry, tentMaterial);
			var row = Math.floor(i / 2);
			var col = i % 2;
			tent.position.set(
				campX - col * 6,
				1.5,
				campZ - row * 8
			);
			scene.add(tent);
			objects.push(tent);

			var tentLight = new THREE.PointLight(tentColor, 0.8, 15);
			tentLight.position.set(
				campX - col * 6,
				2.5,
				campZ - row * 8
			);
			scene.add(tentLight);
			lights.push(tentLight);
		}

		var fencePostCount = 8;
		for (var j = 0; j < fencePostCount; j++) {
			var postGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 8);
			var postMaterial = new THREE.MeshLambertMaterial({
				color: 0x222222,
				emissive: 0x0A0A0A
			});
			var post = new THREE.Mesh(postGeometry, postMaterial);
			var angle = (j / fencePostCount) * Math.PI * 2;
			post.position.set(
				campX + Math.cos(angle) * 12,
				1.5,
				campZ + Math.sin(angle) * 12
			);
			scene.add(post);
			objects.push(post);
		}

		var vehicleGeometry = new THREE.BoxGeometry(8, 2, 4);
		var vehicleMaterial = new THREE.MeshLambertMaterial({
			color: 0x332200,
			emissive: 0x110000
		});
		var vehicle = new THREE.Mesh(vehicleGeometry, vehicleMaterial);
		vehicle.position.set(campX + 10, 1, campZ + 10);
		scene.add(vehicle);
		objects.push(vehicle);

		var turretGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.8, 16);
		var turretMaterial = new THREE.MeshLambertMaterial({
			color: 0xFF6600,
			emissive: 0xFF3300,
			emissiveIntensity: 0.5
		});
		var turret = new THREE.Mesh(turretGeometry, turretMaterial);
		turret.position.set(campX + 10, 2, campZ + 10);
		scene.add(turret);
		objects.push(turret);
		animatedObjects.push({
			obj: turret,
			type: 'spin',
			angle: 0
		});

		var torchCount = 6;
		for (var k = 0; k < torchCount; k++) {
			var torchLight = new THREE.PointLight(0xFFAA00, 1.2, 20);
			torchLight.position.set(
				campX + (Math.random() - 0.5) * 20,
				3,
				campZ + (Math.random() - 0.5) * 20
			);
			scene.add(torchLight);
			lights.push(torchLight);
		}
	}

	function buildambientlighting() {
		var sunLight = new THREE.DirectionalLight(0x222222, 0.4);
		sunLight.position.set(10, 20, 10);
		scene.add(sunLight);
		lights.push(sunLight);

		var ambientLight = new THREE.AmbientLight(0x1a1a2e, 0.3);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var scannerGeometry = new THREE.CylinderGeometry(25, 25, 0.05, 32);
		var scannerMaterial = new THREE.MeshLambertMaterial({
			color: 0x00FF00,
			emissive: 0x00FF00,
			emissiveIntensity: 0.15
		});
		var scanner = new THREE.Mesh(scannerGeometry, scannerMaterial);
		scanner.position.set(0, 0.5, -30);
		scene.add(scanner);
		objects.push(scanner);
		animatedObjects.push({
			obj: scanner,
			type: 'pulse',
			scale: 1.0
		});
	}

	function update(delta) {
		animatedObjects.forEach(function(anim) {
			if (anim.type === 'hologram') {
				anim.scale += delta * 0.5;
				if (anim.scale > 1.3 || anim.scale < 0.7) {
					anim.scale = anim.scale > 1.0 ? 1.3 : 0.7;
					delta = -delta * 0.5;
				}
				anim.obj.scale.x = anim.scale;
				anim.obj.scale.y = anim.scale;
			} else if (anim.type === 'flicker') {
				anim.phase += delta * 6;
				var flicker = Math.abs(Math.sin(anim.phase)) * 0.5 + 0.5;
				anim.obj.material.emissiveIntensity = flicker * 0.9;
				anim.obj.material.opacity = flicker * 0.8 + 0.2;
			} else if (anim.type === 'beaconlight') {
				anim.intensity += delta * 2;
				if (anim.intensity > 2.5 || anim.intensity < 1) {
					anim.intensity = anim.intensity > 1.75 ? 2.5 : 1;
				}
				anim.obj.intensity = anim.intensity;
			} else if (anim.type === 'beacon') {
				anim.obj.rotation.y += delta * 0.8;
			} else if (anim.type === 'spin') {
				anim.angle += delta * 1.5;
				anim.obj.rotation.y = anim.angle;
			} else if (anim.type === 'pulse') {
				anim.scale += delta * 0.3;
				if (anim.scale > 1.2 || anim.scale < 0.8) {
					anim.scale = anim.scale > 1.0 ? 1.2 : 0.8;
				}
				anim.obj.scale.x = anim.scale;
				anim.obj.scale.z = anim.scale;
			}
		});
	}

	function reset() {
		objects.forEach(function(obj) {
			scene.remove(obj);
		});
		lights.forEach(function(light) {
			scene.remove(light);
		});
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
