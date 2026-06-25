window.CommandShip = (function() {
	'use strict';

	var scene;
	var meshes = [];
	var lights = [];
	var materials = {};

	function createMaterial(color, emissive) {
		emissive = emissive || 0x000000;
		return new THREE.MeshStandardMaterial({
			color: color,
			emissive: emissive,
			metalness: 0.7,
			roughness: 0.3
		});
	}

	function buildBridge() {
		var floor = new THREE.Mesh(
			new THREE.BoxGeometry(40, 1, 50),
			createMaterial(0x1a1a2e)
		);
		floor.position.y = 0;
		floor.castShadow = true;
		scene.add(floor);
		meshes.push(floor);

		var wallN = new THREE.Mesh(
			new THREE.BoxGeometry(40, 12, 1),
			createMaterial(0x0f3460)
		);
		wallN.position.set(0, 6, 25);
		wallN.castShadow = true;
		scene.add(wallN);
		meshes.push(wallN);

		var wallS = new THREE.Mesh(
			new THREE.BoxGeometry(40, 12, 1),
			createMaterial(0x0f3460)
		);
		wallS.position.set(0, 6, -25);
		wallS.castShadow = true;
		scene.add(wallS);
		meshes.push(wallS);

		var wallE = new THREE.Mesh(
			new THREE.BoxGeometry(1, 12, 50),
			createMaterial(0x0f3460)
		);
		wallE.position.set(20, 6, 0);
		wallE.castShadow = true;
		scene.add(wallE);
		meshes.push(wallE);

		var wallW = new THREE.Mesh(
			new THREE.BoxGeometry(1, 12, 50),
			createMaterial(0x0f3460)
		);
		wallW.position.set(-20, 6, 0);
		wallW.castShadow = true;
		scene.add(wallW);
		meshes.push(wallW);

		var ceiling = new THREE.Mesh(
			new THREE.BoxGeometry(40, 1, 50),
			createMaterial(0x16213e)
		);
		ceiling.position.y = 12;
		scene.add(ceiling);
		meshes.push(ceiling);
	}

	function buildConsoles() {
		var positions = [
			[-15, 0, 20], [-15, 0, -20],
			[15, 0, 20], [15, 0, -20]
		];

		positions.forEach(function(pos) {
			var console = new THREE.Mesh(
				new THREE.BoxGeometry(4, 3, 2),
				createMaterial(0x1a1a2e)
			);
			console.position.set(pos[0], pos[1] + 1.5, pos[2]);
			console.castShadow = true;
			scene.add(console);
			meshes.push(console);

			var screen = new THREE.Mesh(
				new THREE.BoxGeometry(3.5, 2.5, 0.2),
				createMaterial(0x00ff00, 0x00ff00)
			);
			screen.position.set(pos[0], pos[1] + 2, pos[2] + 1.2);
			scene.add(screen);
			meshes.push(screen);
		});
	}

	function buildHologram() {
		var table = new THREE.Mesh(
			new THREE.BoxGeometry(8, 1.5, 8),
			createMaterial(0x0a0a1a)
		);
		table.position.set(0, 3, 0);
		table.castShadow = true;
		scene.add(table);
		meshes.push(table);

		var orb = new THREE.Mesh(
			new THREE.SphereGeometry(2, 32, 32),
			createMaterial(0x0099ff, 0x0066ff)
		);
		orb.position.set(0, 6, 0);
		orb.castShadow = true;
		scene.add(orb);
		meshes.push(orb);
	}

	function buildWindows() {
		var positions = [
			[-18, 6, 24.5], [18, 6, 24.5],
			[-18, 6, -24.5], [18, 6, -24.5]
		];

		positions.forEach(function(pos) {
			var frame = new THREE.Mesh(
				new THREE.BoxGeometry(5, 5, 0.5),
				createMaterial(0x1a1a2e)
			);
			frame.position.set(pos[0], pos[1], pos[2]);
			scene.add(frame);
			meshes.push(frame);

			var viewport = new THREE.Mesh(
				new THREE.BoxGeometry(4.5, 4.5, 0.1),
				createMaterial(0x001a4d, 0x000d33)
			);
			viewport.position.set(pos[0], pos[1], pos[2] + 0.3);
			scene.add(viewport);
			meshes.push(viewport);
		});
	}

	function buildEngineRoom() {
		var corridor = new THREE.Mesh(
			new THREE.BoxGeometry(8, 8, 15),
			createMaterial(0x2d2d44)
		);
		corridor.position.set(-18, 4, 0);
		scene.add(corridor);
		meshes.push(corridor);

		for (var i = 0; i < 3; i++) {
			var pod = new THREE.Mesh(
				new THREE.CylinderGeometry(1.5, 1.5, 4, 16),
				createMaterial(0xff6600, 0xff4400)
			);
			pod.rotation.z = Math.PI / 2;
			pod.position.set(-18, 3 + i * 2.5, -4 + i * 2);
			pod.castShadow = true;
			scene.add(pod);
			meshes.push(pod);
		}
	}

	function buildWeapons() {
		var platform = new THREE.Mesh(
			new THREE.BoxGeometry(6, 1, 6),
			createMaterial(0x1a2a3a)
		);
		platform.position.set(15, 3, 0);
		platform.castShadow = true;
		scene.add(platform);
		meshes.push(platform);

		var targeting = new THREE.Mesh(
			new THREE.CylinderGeometry(1, 1.5, 3, 12),
			createMaterial(0xffaa00)
		);
		targeting.position.set(15, 5.5, 0);
		targeting.castShadow = true;
		scene.add(targeting);
		meshes.push(targeting);
	}

	function buildComms() {
		var dish1 = new THREE.Mesh(
			new THREE.CylinderGeometry(2, 2, 0.5, 16),
			createMaterial(0xcccccc)
		);
		dish1.position.set(-10, 11, 22);
		scene.add(dish1);
		meshes.push(dish1);

		var mast1 = new THREE.Mesh(
			new THREE.CylinderGeometry(0.3, 0.3, 3, 8),
			createMaterial(0x666666)
		);
		mast1.position.set(-10, 9, 22);
		scene.add(mast1);
		meshes.push(mast1);

		var cables = new THREE.LineSegments(
			new THREE.BufferGeometry().setFromPoints([
				new THREE.Vector3(-10, 11, 22),
				new THREE.Vector3(-8, 10, 20),
				new THREE.Vector3(-10, 11, 22),
				new THREE.Vector3(-12, 10, 20)
			]),
			new THREE.LineBasicMaterial({ color: 0x0099ff, linewidth: 2 })
		);
		scene.add(cables);
		meshes.push(cables);
	}

	function buildDoors() {
		var positions = [
			[-18, 6, 0], [18, 6, 0]
		];

		positions.forEach(function(pos) {
			var frame = new THREE.Mesh(
				new THREE.BoxGeometry(3, 6, 0.3),
				createMaterial(0x0a0a0a)
			);
			frame.position.set(pos[0], pos[1], pos[2]);
			scene.add(frame);
			meshes.push(frame);

			var panel = new THREE.Mesh(
				new THREE.BoxGeometry(2.8, 5.8, 0.2),
				createMaterial(0x1a1a1a, 0xff0000)
			);
			panel.position.set(pos[0], pos[1], pos[2] + 0.15);
			scene.add(panel);
			meshes.push(panel);
		});
	}

	function buildMedical() {
		for (var i = 0; i < 2; i++) {
			var cryopod = new THREE.Mesh(
				new THREE.CylinderGeometry(1.2, 1.2, 2.5, 12),
				createMaterial(0x00ffff, 0x0099ff)
			);
			cryopod.position.set(10 + i * 3, 1.25, -22);
			cryopod.castShadow = true;
			scene.add(cryopod);
			meshes.push(cryopod);

			var cryoTop = new THREE.Mesh(
				new THREE.SphereGeometry(1.2, 16, 16),
				createMaterial(0x0066ff, 0x0044ff)
			);
			cryoTop.position.set(10 + i * 3, 2.7, -22);
			scene.add(cryoTop);
			meshes.push(cryoTop);
		}
	}

	function buildArmory() {
		var rack = new THREE.Mesh(
			new THREE.BoxGeometry(3, 5, 1),
			createMaterial(0x2a2a2a)
		);
		rack.position.set(-15, 2.5, -15);
		scene.add(rack);
		meshes.push(rack);

		for (var i = 0; i < 4; i++) {
			var weapon = new THREE.Mesh(
				new THREE.ConeGeometry(0.3, 1.5, 8),
				createMaterial(0x333333)
			);
			weapon.position.set(-15, 1 + i * 1.2, -15);
			scene.add(weapon);
			meshes.push(weapon);
		}
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x4488ff, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var holo1 = new THREE.PointLight(0x0099ff, 1.5, 20);
		holo1.position.set(0, 6, 0);
		holo1.castShadow = true;
		scene.add(holo1);
		lights.push(holo1);

		var engine = new THREE.PointLight(0xff6600, 1.2, 15);
		engine.position.set(-18, 4, 0);
		scene.add(engine);
		lights.push(engine);

		var weapons = new THREE.PointLight(0xffaa00, 1.0, 15);
		weapons.position.set(15, 5.5, 0);
		scene.add(weapons);
		lights.push(weapons);
	}

	function init(initScene, camera) {
		scene = initScene;
		camera.position.set(0, 2, 5);
		camera.lookAt(0, 3, 0);

		buildBridge();
		buildConsoles();
		buildHologram();
		buildWindows();
		buildEngineRoom();
		buildWeapons();
		buildComms();
		buildDoors();
		buildMedical();
		buildArmory();
		buildLighting();
	}

	function update(delta) {
		meshes.forEach(function(mesh) {
			if (mesh.geometry instanceof THREE.SphereGeometry && mesh.position.z === 0) {
				mesh.rotation.x += delta * 0.3;
				mesh.rotation.y += delta * 0.4;
			}
		});

		lights.forEach(function(light) {
			if (light instanceof THREE.PointLight) {
				light.intensity += Math.sin(Date.now() * 0.001) * 0.1;
			}
		});
	}

	function reset() {
		meshes.forEach(function(mesh) {
			scene.remove(mesh);
			if (mesh.geometry) {
				mesh.geometry.dispose();
			}
			if (mesh.material) {
				if (Array.isArray(mesh.material)) {
					mesh.material.forEach(function(mat) { mat.dispose(); });
				} else {
					mesh.material.dispose();
				}
			}
		});
		meshes = [];

		lights.forEach(function(light) {
			scene.remove(light);
		});
		lights = [];
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
