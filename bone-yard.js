window.BoneYard = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var elements = [];
	var dustParticles = null;
	var crane = null;
	var beacons = [];
	var time = 0;

	var materialRust = new THREE.MeshPhongMaterial({ color: 0x8B4513, emissive: 0x3d2817 });
	var materialMetal = new THREE.MeshPhongMaterial({ color: 0x888888, emissive: 0x444444 });
	var materialConcrete = new THREE.MeshPhongMaterial({ color: 0x555555, emissive: 0x222222 });
	var materialFaded = new THREE.MeshPhongMaterial({ color: 0x6B5344, emissive: 0x3d2817 });

	function init(_scene, _camera) {
		scene = _scene;
		camera = _camera;
		time = 0;
		elements = [];
		beacons = [];

		scene.background = new THREE.Color(0xD4B896);
		scene.fog = new THREE.Fog(0xD4B896, 120, 200);

		var light1 = new THREE.DirectionalLight(0xffffff, 0.8);
		light1.position.set(50, 40, 50);
		light1.castShadow = true;
		light1.shadow.mapSize.width = 2048;
		light1.shadow.mapSize.height = 2048;
		light1.shadow.camera.left = -80;
		light1.shadow.camera.right = 80;
		light1.shadow.camera.top = 80;
		light1.shadow.camera.bottom = -80;
		light1.shadow.camera.far = 200;
		scene.add(light1);

		var light2 = new THREE.AmbientLight(0xffffff, 0.4);
		scene.add(light2);

		buildGround();
		buildFuselages();
		buildWings();
		buildEngines();
		buildCockpits();
		buildHangars();
		buildCrane();
		buildFence();
		buildFuelDump();
		buildPartsSortingFacility();
		buildBeacons();
		buildDustParticles();
	}

	function buildGround() {
		var groundGeom = new THREE.BoxGeometry(80, 1, 80);
		var groundMat = new THREE.MeshPhongMaterial({ color: 0xC4A76A });
		var ground = new THREE.Mesh(groundGeom, groundMat);
		ground.position.y = -0.5;
		ground.receiveShadow = true;
		ground.castShadow = false;
		scene.add(ground);
		elements.push(ground);
	}

	function buildFuselages() {
		var positions = [
			{ x: -20, z: -15, rot: 0.2 },
			{ x: 10, z: -25, rot: -0.3 },
			{ x: 25, z: -5, rot: 0.1 },
			{ x: -35, z: 10, rot: 0.4 },
			{ x: 5, z: 20, rot: -0.15 }
		];

		for (var i = 0; i < positions.Length; i++) {
			var p = positions[i];
			var geom = new THREE.CylinderGeometry(3, 3.5, 30, 12, 6);
			var fuselage = new THREE.Mesh(geom, materialRust);
			fuselage.position.set(p.x, 5, p.z);
			fuselage.rotation.z = p.rot;
			fuselage.castShadow = true;
			fuselage.receiveShadow = true;
			scene.add(fuselage);
			elements.push(fuselage);
		}
	}

	function buildWings() {
		var wingPositions = [
			{ x: -15, z: -10 },
			{ x: 20, z: 5 },
			{ x: -30, z: 25 },
			{ x: 35, z: -20 }
		];

		for (var i = 0; i < wingPositions.length; i++) {
			var wp = wingPositions[i];
			var geom = new THREE.BoxGeometry(25, 0.8, 5);
			var wing = new THREE.Mesh(geom, materialFaded);
			wing.position.set(wp.x, 8, wp.z);
			wing.rotation.x = 0.1;
			wing.castShadow = true;
			wing.receiveShadow = true;
			scene.add(wing);
			elements.push(wing);
		}
	}

	function buildEngines() {
		var enginePositions = [
			{ x: -25, z: -20, stack: 1 },
			{ x: 15, z: 15, stack: 2 },
			{ x: 30, z: -10, stack: 1 },
			{ x: -10, z: 30, stack: 3 },
			{ x: 40, z: 20, stack: 2 }
		];

		for (var i = 0; i < enginePositions.length; i++) {
			var ep = enginePositions[i];
			for (var j = 0; j < ep.stack; j++) {
				var geom = new THREE.CylinderGeometry(2.5, 2.8, 3.5, 16, 2);
				var engine = new THREE.Mesh(geom, materialMetal);
				engine.position.set(ep.x + j * 1.2, 1.75 + j * 3.5, ep.z);
				engine.castShadow = true;
				engine.receiveShadow = true;
				scene.add(engine);
				elements.push(engine);
			}
		}
	}

	function buildCockpits() {
		var cockpitPositions = [
			{ x: -22, z: -8 },
			{ x: 12, z: -28 },
			{ x: 32, z: 2 }
		];

		for (var i = 0; i < cockpitPositions.length; i++) {
			var cp = cockpitPositions[i];
			var geom = new THREE.BoxGeometry(4, 3.5, 6);
			var cockpit = new THREE.Mesh(geom, materialRust);
			cockpit.position.set(cp.x, 12, cp.z);
			cockpit.castShadow = true;
			cockpit.receiveShadow = true;
			scene.add(cockpit);
			elements.push(cockpit);
		}
	}

	function buildHangars() {
		var hangarPositions = [
			{ x: -50, z: -30, scaleZ: 1.2 },
			{ x: 50, z: 35, scaleZ: 0.9 }
		];

		for (var i = 0; i < hangarPositions.length; i++) {
			var hp = hangarPositions[i];
			var geom = new THREE.BoxGeometry(20, 15, 30 * hp.scaleZ);
			var hangar = new THREE.Mesh(geom, materialConcrete);
			hangar.position.set(hp.x, 7.5, hp.z);
			hangar.castShadow = true;
			hangar.receiveShadow = true;
			scene.add(hangar);
			elements.push(hangar);

			var roofGeom = new THREE.BoxGeometry(20.5, 1, 30 * hp.scaleZ + 0.5);
			var roof = new THREE.Mesh(roofGeom, new THREE.MeshPhongMaterial({ color: 0x444444 }));
			roof.position.set(hp.x, 15.5, hp.z);
			roof.castShadow = true;
			roof.receiveShadow = true;
			scene.add(roof);
			elements.push(roof);
		}
	}

	function buildCrane() {
		var baseGeom = new THREE.BoxGeometry(3, 1, 3);
		var base = new THREE.Mesh(baseGeom, materialMetal);
		base.position.set(-40, 0.5, -40);
		base.castShadow = true;
		scene.add(base);
		elements.push(base);

		var poleGeom = new THREE.CylinderGeometry(0.4, 0.4, 20, 8, 1);
		var pole = new THREE.Mesh(poleGeom, materialMetal);
		pole.position.set(-40, 10, -40);
		pole.castShadow = true;
		scene.add(pole);
		elements.push(pole);

		var jibGeom = new THREE.BoxGeometry(30, 0.6, 0.8);
		var jib = new THREE.Mesh(jibGeom, materialMetal);
		jib.position.set(-25, 19, -40);
		jib.castShadow = true;
		scene.add(jib);
		elements.push(jib);

		var hookGeom = new THREE.SphereGeometry(0.5, 8, 8);
		var hook = new THREE.Mesh(hookGeom, new THREE.MeshPhongMaterial({ color: 0xffcc00 }));
		hook.position.set(-25, 18.5, -40);
		hook.castShadow = true;
		scene.add(hook);

		crane = {
			jib: jib,
			hook: hook,
			baseX: -25,
			baseZ: -40,
			phase: 0
		};
	}

	function buildFence() {
		var fencePositions = [
			{ x1: -39, z1: 39, x2: 39, z2: 39 },
			{ x1: 39, z1: 39, x2: 39, z2: -39 },
			{ x1: -39, z1: -39, x2: -39, z2: 39 }
		];

		for (var i = 0; i < fencePositions.length; i++) {
			var fp = fencePositions[i];
			var geom = new THREE.BoxGeometry(Math.abs(fp.x2 - fp.x1) + 0.2, 2.5, 0.4);
			var fence = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({ color: 0x3d3d3d }));
			fence.position.set((fp.x1 + fp.x2) / 2, 1.25, (fp.z1 + fp.z2) / 2);
			fence.castShadow = true;
			fence.receiveShadow = true;
			scene.add(fence);
			elements.push(fence);
		}

		var gapGeom = new THREE.BoxGeometry(6, 2.5, 0.4);
		var gapFence = new THREE.Mesh(gapGeom, new THREE.MeshPhongMaterial({ color: 0x3d3d3d }));
		gapFence.position.set(10, 1.25, 39);
		gapFence.castShadow = true;
		scene.add(gapFence);
		elements.push(gapFence);
	}

	function buildFuelDump() {
		var tankPositions = [
			{ x: 45, z: -30 },
			{ x: 50, z: -20 },
			{ x: 48, z: -10 }
		];

		for (var i = 0; i < tankPositions.length; i++) {
			var tp = tankPositions[i];
			var geom = new THREE.CylinderGeometry(2.2, 2.2, 6, 12, 2);
			var tank = new THREE.Mesh(geom, new THREE.MeshPhongMaterial({ color: 0x8B0000 }));
			tank.position.set(tp.x, 3, tp.z);
			tank.castShadow = true;
			tank.receiveShadow = true;
			scene.add(tank);
			elements.push(tank);
		}

		var pipeStartX = 45;
		var pipeStartZ = -30;
		for (var i = 0; i < 8; i++) {
			var geom = new THREE.CylinderGeometry(0.3, 0.3, 5, 6, 1);
			var pipe = new THREE.Mesh(geom, materialMetal);
			pipe.position.set(pipeStartX + i * 1.5, 0.5, pipeStartZ);
			pipe.rotation.z = Math.PI / 2;
			pipe.castShadow = true;
			scene.add(pipe);
			elements.push(pipe);
		}
	}

	function buildPartsSortingFacility() {
		var platformGeom = new THREE.BoxGeometry(18, 0.8, 18);
		var platform = new THREE.Mesh(platformGeom, materialConcrete);
		platform.position.set(35, 0.4, 0);
		platform.receiveShadow = true;
		scene.add(platform);
		elements.push(platform);

		var shelfPositions = [
			{ x: 28, z: -7 },
			{ x: 28, z: 0 },
			{ x: 28, z: 7 },
			{ x: 42, z: -7 },
			{ x: 42, z: 7 }
		];

		for (var i = 0; i < shelfPositions.length; i++) {
			var sp = shelfPositions[i];
			var geom = new THREE.BoxGeometry(3, 4, 3);
			var shelf = new THREE.Mesh(geom, materialFaded);
			shelf.position.set(sp.x, 2, sp.z);
			shelf.castShadow = true;
			shelf.receiveShadow = true;
			scene.add(shelf);
			elements.push(shelf);
		}
	}

	function buildBeacons() {
		var beaconPositions = [
			{ x: -38, z: -35, color: 0xff0000 },
			{ x: 35, z: 35, color: 0x00ff00 },
			{ x: -45, z: 40, color: 0xffff00 }
		];

		for (var i = 0; i < beaconPositions.length; i++) {
			var bp = beaconPositions[i];
			var postGeom = new THREE.CylinderGeometry(0.3, 0.3, 8, 8, 1);
			var post = new THREE.Mesh(postGeom, materialMetal);
			post.position.set(bp.x, 4, bp.z);
			post.castShadow = true;
			scene.add(post);
			elements.push(post);

			var lightGeom = new THREE.SphereGeometry(0.6, 8, 8);
			var lightMat = new THREE.MeshBasicMaterial({ color: bp.color });
			var light = new THREE.Mesh(lightGeom, lightMat);
			light.position.set(bp.x, 8.5, bp.z);
			scene.add(light);

			beacons.push({
				light: light,
				color: bp.color,
				phase: Math.random() * Math.PI * 2
			});
		}
	}

	function buildDustParticles() {
		var particleCount = 800;
		var geometry = new THREE.BufferGeometry();
		var positions = new Float32Array(particleCount * 3);
		var velocities = new Float32Array(particleCount * 3);

		for (var i = 0; i < particleCount; i++) {
			positions[i * 3] = (Math.random() - 0.5) * 80;
			positions[i * 3 + 1] = Math.random() * 25;
			positions[i * 3 + 2] = (Math.random() - 0.5) * 80;

			velocities[i * 3] = (Math.random() - 0.5) * 0.02;
			velocities[i * 3 + 1] = -Math.random() * 0.005;
			velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
		}

		geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
		geometry.userData.velocities = velocities;

		var material = new THREE.PointsMaterial({
			color: 0xD4A574,
			size: 0.1,
			sizeAttenuation: true,
			transparent: true,
			opacity: 0.3
		});

		dustParticles = new THREE.Points(geometry, material);
		scene.add(dustParticles);
	}

	function update(delta) {
		time += delta;

		updateCrane();
		updateBeacons();
		updateDust();
	}

	function updateCrane() {
		if (!crane) return;

		var phase = time * 0.3;
		crane.hook.position.x = crane.baseX + Math.sin(phase) * 8;
		crane.hook.position.z = crane.baseZ + Math.cos(phase) * 6;
	}

	function updateBeacons() {
		for (var i = 0; i < beacons.length; i++) {
			var beacon = beacons[i];
			var intensity = Math.abs(Math.sin(time * 2 + beacon.phase));
			beacon.light.material.opacity = 0.3 + intensity * 0.7;
		}
	}

	function updateDust() {
		if (!dustParticles) return;

		var positions = dustParticles.geometry.attributes.position.array;
		var velocities = dustParticles.geometry.userData.velocities;

		for (var i = 0; i < positions.length; i += 3) {
			positions[i] += velocities[i];
			positions[i + 1] += velocities[i + 1];
			positions[i + 2] += velocities[i + 2];

			if (positions[i] > 40) positions[i] = -40;
			if (positions[i] < -40) positions[i] = 40;

			if (positions[i + 1] < 0) {
				positions[i + 1] = 25;
			}

			if (positions[i + 2] > 40) positions[i + 2] = -40;
			if (positions[i + 2] < -40) positions[i + 2] = 40;
		}

		dustParticles.geometry.attributes.position.needsUpdate = true;
	}

	function reset() {
		time = 0;

		for (var i = 0; i < elements.length; i++) {
			scene.remove(elements[i]);
		}
		elements = [];

		if (dustParticles) {
			scene.remove(dustParticles);
			dustParticles = null;
		}

		beacons = [];

		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
