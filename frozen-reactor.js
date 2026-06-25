window.FrozenReactor = (function() {
	'use strict';

	var scene;
	var camera;
	var envObjects = [];
	var lights = [];
	var particles = [];
	var iceShards = [];

	function init(sceneParam, cameraParam) {
		scene = sceneParam;
		camera = cameraParam;

		buildCoolingTowers();
		buildReactorDome();
		buildControlRoom();
		buildFrozenWorkers();
		buildEmergencyLights();
		buildIceSpray();
		buildMistCloud();
		buildCorridors();
		setupLighting();
	}

	function buildCoolingTowers() {
		for (var i = 0; i < 3; i++) {
			var tower = new THREE.Mesh(
				new THREE.CylinderGeometry(8, 8, 25, 16),
				new THREE.MeshPhongMaterial({ color: 0x333333, metalness: 0.8 })
			);
			tower.position.set(-15 + i * 15, 12, -20);
			tower.castShadow = true;
			scene.add(tower);
			envObjects.push(tower);

			var iceLayer = new THREE.Mesh(
				new THREE.CylinderGeometry(8.5, 8.5, 25, 16),
				new THREE.MeshPhongMaterial({ color: 0xccddff, transparent: true, opacity: 0.6 })
			);
			iceLayer.position.copy(tower.position);
			iceLayer.position.z += 0.1;
			scene.add(iceLayer);
			envObjects.push(iceLayer);
		}
	}

	function buildReactorDome() {
		var dome = new THREE.Mesh(
			new THREE.SphereGeometry(12, 16, 16),
			new THREE.MeshPhongMaterial({ color: 0x444444, metalness: 0.7 })
		);
		dome.position.set(0, 18, 5);
		dome.castShadow = true;
		scene.add(dome);
		envObjects.push(dome);

		var crackGroup = new THREE.Group();
		var crackLines = [
			[new THREE.Vector3(-10, 15, 5), new THREE.Vector3(10, 15, 5)],
			[new THREE.Vector3(0, 25, 5), new THREE.Vector3(0, 10, 5)],
			[new THREE.Vector3(-5, 20, 5), new THREE.Vector3(5, 20, 5)]
		];

		for (var i = 0; i < crackLines.length; i++) {
			var geometry = new THREE.BufferGeometry();
			geometry.setAttribute('position', new THREE.BufferAttribute(
				new Float32Array([
					crackLines[i][0].x, crackLines[i][0].y, crackLines[i][0].z,
					crackLines[i][1].x, crackLines[i][1].y, crackLines[i][1].z
				]), 3
			));
			var line = new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 3 }));
			crackGroup.add(line);
		}
		crackGroup.position.copy(dome.position);
		scene.add(crackGroup);
		envObjects.push(crackGroup);
	}

	function buildControlRoom() {
		var controlBox = new THREE.Mesh(
			new THREE.BoxGeometry(10, 8, 12),
			new THREE.MeshPhongMaterial({ color: 0x555555, metalness: 0.6 })
		);
		controlBox.position.set(20, 4, 10);
		controlBox.castShadow = true;
		scene.add(controlBox);
		envObjects.push(controlBox);

		var iceOverlay = new THREE.Mesh(
			new THREE.BoxGeometry(10.5, 8.5, 12.5),
			new THREE.MeshPhongMaterial({ color: 0xeeffff, transparent: true, opacity: 0.5 })
		);
		iceOverlay.position.copy(controlBox.position);
		iceOverlay.position.z += 0.05;
		scene.add(iceOverlay);
		envObjects.push(iceOverlay);
	}

	function buildFrozenWorkers() {
		for (var i = 0; i < 2; i++) {
			var body = new THREE.Mesh(
				new THREE.BoxGeometry(1, 3, 0.8),
				new THREE.MeshPhongMaterial({ color: 0x888888 })
			);
			body.position.set(10 + i * 8, 1.5, 15);
			body.castShadow = true;
			scene.add(body);
			envObjects.push(body);

			var head = new THREE.Mesh(
				new THREE.SphereGeometry(0.6, 8, 8),
				new THREE.MeshPhongMaterial({ color: 0xbbeeff, transparent: true, opacity: 0.7 })
			);
			head.position.copy(body.position);
			head.position.y = 3.2;
			head.castShadow = true;
			scene.add(head);
			envObjects.push(head);
		}
	}

	function buildEmergencyLights() {
		for (var i = 0; i < 4; i++) {
			var lightBulb = new THREE.Mesh(
				new THREE.SphereGeometry(0.4, 8, 8),
				new THREE.MeshBasicMaterial({ color: 0xff3333 })
			);
			var xPos = -20 + i * 14;
			lightBulb.position.set(xPos, 22, -10);
			scene.add(lightBulb);
			envObjects.push(lightBulb);

			var pointLight = new THREE.PointLight(0xff3333, 0.5, 30);
			pointLight.position.copy(lightBulb.position);
			scene.add(pointLight);
			lights.push({ light: pointLight, phase: i * 0.5 });
		}
	}

	function buildIceSpray() {
		for (var i = 0; i < 3; i++) {
			var tower = new THREE.Mesh(
				new THREE.CylinderGeometry(1, 1, 4, 6),
				new THREE.MeshPhongMaterial({ color: 0x888888 })
			);
			tower.position.set(-15 + i * 15, 26, -20);
			scene.add(tower);
			envObjects.push(tower);

			for (var j = 0; j < 6; j++) {
				var cone = new THREE.Mesh(
					new THREE.ConeGeometry(0.4, 1.5, 6),
					new THREE.MeshPhongMaterial({ color: 0xccddff, transparent: true, opacity: 0.8 })
				);
				var angle = (j / 6) * Math.PI * 2;
				cone.position.set(
					tower.position.x + Math.cos(angle) * 2,
					tower.position.y - 3,
					tower.position.z + Math.sin(angle) * 2
				);
				cone.rotation.z = Math.PI / 4;
				scene.add(cone);
				envObjects.push(cone);
				iceShards.push({
					mesh: cone,
					vx: Math.cos(angle) * 0.1,
					vy: -0.05,
					vz: Math.sin(angle) * 0.1
				});
			}
		}
	}

	function buildMistCloud() {
		for (var i = 0; i < 12; i++) {
			var sphere = new THREE.Mesh(
				new THREE.SphereGeometry(3 + Math.random() * 2, 8, 8),
				new THREE.MeshPhongMaterial({
					color: 0xffffff,
					transparent: true,
					opacity: 0.3,
					emissive: 0x999999
				})
			);
			sphere.position.set(
				Math.random() * 20 - 10,
				20 + Math.random() * 8,
				8 + Math.random() * 6
			);
			scene.add(sphere);
			envObjects.push(sphere);
			particles.push({
				mesh: sphere,
				startY: sphere.position.y,
				drift: Math.random() * 0.03
			});
		}
	}

	function buildCorridors() {
		for (var i = 0; i < 2; i++) {
			var corridor = new THREE.Mesh(
				new THREE.BoxGeometry(4, 3, 20),
				new THREE.MeshPhongMaterial({ color: 0x444444 })
			);
			corridor.position.set(i * 20 - 10, 1.5, 0);
			corridor.castShadow = true;
			scene.add(corridor);
			envObjects.push(corridor);
		}
	}

	function setupLighting() {
		var ambientLight = new THREE.AmbientLight(0x8899ff, 0.5);
		scene.add(ambientLight);
		lights.push({ light: ambientLight });

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
		directionalLight.position.set(10, 20, 10);
		directionalLight.castShadow = true;
		scene.add(directionalLight);
		lights.push({ light: directionalLight });
	}

	function update(delta) {
		for (var i = 0; i < lights.length; i++) {
			var lightObj = lights[i];
			if (lightObj.phase !== undefined) {
				var intensity = Math.sin((performance.now() * 0.003) + lightObj.phase) * 0.3 + 0.5;
				lightObj.light.intensity = intensity;
			}
		}

		for (var i = 0; i < particles.length; i++) {
			var p = particles[i];
			p.mesh.position.y += Math.sin(performance.now() * 0.001 + i) * 0.002;
			p.mesh.position.x += p.drift;
			p.mesh.rotation.x += 0.001;
			p.mesh.rotation.y += 0.002;
		}

		for (var i = 0; i < iceShards.length; i++) {
			var shard = iceShards[i];
			shard.mesh.position.x += shard.vx;
			shard.mesh.position.y += shard.vy;
			shard.mesh.position.z += shard.vz;
			shard.mesh.rotation.x += 0.02;

			if (shard.mesh.position.y < -5) {
				shard.vy = Math.abs(shard.vy) * 0.7;
				shard.mesh.position.y = -5;
			}
		}
	}

	function reset() {
		for (var i = 0; i < envObjects.length; i++) {
			scene.remove(envObjects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i].light);
		}
		envObjects = [];
		lights = [];
		particles = [];
		iceShards = [];

		init(scene, camera);
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
