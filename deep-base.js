window.DeepBase = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lights = [];
	var animatedObjects = [];
	var biolumCluster;
	var squidTentacles = [];
	var ventBubbles = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];
		squidTentacles = [];
		ventBubbles = [];
		time = 0;

		buildHull();
		buildSubmersibles();
		buildBiolumCreatures();
		buildHydrothermalVents();
		buildMiningEquipment();
		buildSonarArrays();
		buildTorpedoVaults();
		buildSquidEnemy();
		buildLighting();
		buildStructuralSupports();
	}

	function buildHull() {
		var hullMaterial = new THREE.MeshLambertMaterial({ color: 0x1a3a52 });
		var hullOuterMaterial = new THREE.MeshLambertMaterial({ color: 0x0d1f2d });

		var cylinderGeom = new THREE.CylinderGeometry(40, 40, 120, 16, 8);
		var hullOuter = new THREE.Mesh(cylinderGeom, hullOuterMaterial);
		hullOuter.position.y = 0;
		scene.add(hullOuter);
		objects.push(hullOuter);

		var innerGeom = new THREE.CylinderGeometry(38, 38, 118, 16, 8);
		var hullInner = new THREE.Mesh(innerGeom, hullMaterial);
		hullInner.position.y = 0;
		hullInner.position.z = 0.1;
		scene.add(hullInner);
		objects.push(hullInner);

		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var x = Math.cos(angle) * 39;
			var z = Math.sin(angle) * 39;

			var ribGeom = new THREE.BoxGeometry(0.5, 120, 2);
			var rib = new THREE.Mesh(ribGeom, hullOuterMaterial);
			rib.position.x = x;
			rib.position.z = z;
			scene.add(rib);
			objects.push(rib);
		}

		var floorGeom = new THREE.CylinderGeometry(38, 38, 2, 16, 1);
		var floor = new THREE.Mesh(floorGeom, new THREE.MeshLambertMaterial({ color: 0x2a4a6a }));
		floor.position.y = -59;
		scene.add(floor);
		objects.push(floor);

		var ceilingGeom = new THREE.CylinderGeometry(38, 38, 2, 16, 1);
		var ceiling = new THREE.Mesh(ceilingGeom, new THREE.MeshLambertMaterial({ color: 0x1a3a52 }));
		ceiling.position.y = 59;
		scene.add(ceiling);
		objects.push(ceiling);
	}

	function buildSubmersibles() {
		var dockPositions = [
			{ x: -20, y: -30, z: -30 },
			{ x: 20, y: -30, z: -30 },
			{ x: -20, y: -30, z: 30 },
			{ x: 20, y: -30, z: 30 }
		];

		var subMaterial = new THREE.MeshLambertMaterial({ color: 0x445566 });

		for (var i = 0; i < dockPositions.length; i++) {
			var pos = dockPositions[i];

			var bodyGeom = new THREE.CylinderGeometry(3, 3, 15, 8, 4);
			var body = new THREE.Mesh(bodyGeom, subMaterial);
			body.position.copy(pos);
			body.rotation.z = Math.PI / 2;
			scene.add(body);
			objects.push(body);

			var noseGeom = new THREE.ConeGeometry(3, 4, 8);
			var nose = new THREE.Mesh(noseGeom, subMaterial);
			nose.position.copy(pos);
			nose.position.x += 8;
			nose.rotation.z = Math.PI / 2;
			scene.add(nose);
			objects.push(nose);

			var propellerGeom = new THREE.SphereGeometry(2, 4, 4);
			var propeller = new THREE.Mesh(propellerGeom, new THREE.MeshLambertMaterial({ color: 0x666688 }));
			propeller.position.copy(pos);
			propeller.position.x -= 7;
			scene.add(propeller);
			objects.push(propeller);
		}
	}

	function buildBiolumCreatures() {
		var glowMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff88, emissive: 0x00cc66 });

		var clusterPositions = [
			{ x: -30, y: 20, z: -35 },
			{ x: 30, y: 15, z: -35 },
			{ x: -35, y: -20, z: 25 },
			{ x: 35, y: -15, z: 25 }
		];

		for (var i = 0; i < clusterPositions.length; i++) {
			var pos = clusterPositions[i];

			for (var j = 0; j < 5; j++) {
				var offsetX = (Math.random() - 0.5) * 8;
				var offsetY = (Math.random() - 0.5) * 8;
				var offsetZ = (Math.random() - 0.5) * 8;

				var creatureGeom = new THREE.SphereGeometry(1.2, 6, 6);
				var creature = new THREE.Mesh(creatureGeom, glowMaterial);
				creature.position.x = pos.x + offsetX;
				creature.position.y = pos.y + offsetY;
				creature.position.z = pos.z + offsetZ;
				creature.originalY = creature.position.y;
				scene.add(creature);
				objects.push(creature);
				animatedObjects.push({ mesh: creature, type: 'biolum', phase: j * 0.5 });
			}
		}

		biolumCluster = objects.filter(function(obj) {
			return obj.material && obj.material.emissive;
		});
	}

	function buildHydrothermalVents() {
		var ventMaterial = new THREE.MeshLambertMaterial({ color: 0x664422 });
		var ventPositions = [
			{ x: -25, y: -58, z: -20 },
			{ x: 25, y: -58, z: -20 },
			{ x: 0, y: -58, z: 30 }
		];

		for (var i = 0; i < ventPositions.length; i++) {
			var pos = ventPositions[i];

			var chimney1Geom = new THREE.CylinderGeometry(1.5, 2, 8, 6, 2);
			var chimney1 = new THREE.Mesh(chimney1Geom, ventMaterial);
			chimney1.position.copy(pos);
			scene.add(chimney1);
			objects.push(chimney1);

			var chimney2Geom = new THREE.CylinderGeometry(1, 1.5, 6, 6, 2);
			var chimney2 = new THREE.Mesh(chimney2Geom, ventMaterial);
			chimney2.position.copy(pos);
			chimney2.position.x -= 4;
			scene.add(chimney2);
			objects.push(chimney2);

			for (var j = 0; j < 8; j++) {
				var bubbleGeom = new THREE.SphereGeometry(0.3, 4, 4);
				var bubbleMat = new THREE.MeshLambertMaterial({ color: 0x99ddff, emissive: 0x4488cc });
				var bubble = new THREE.Mesh(bubbleGeom, bubbleMat);
				bubble.position.copy(pos);
				bubble.baseX = pos.x;
				bubble.baseY = pos.y;
				bubble.baseZ = pos.z;
				bubble.delay = j * 0.2;
				bubble.speed = 0.05 + Math.random() * 0.05;
				scene.add(bubble);
				objects.push(bubble);
				ventBubbles.push(bubble);
			}
		}
	}

	function buildMiningEquipment() {
		var miningMaterial = new THREE.MeshLambertMaterial({ color: 0x556677 });
		var drillerMaterial = new THREE.MeshLambertMaterial({ color: 0x444455 });

		var positions = [
			{ x: -30, y: -40, z: 0 },
			{ x: 30, y: -40, z: 0 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];

			var baseGeom = new THREE.BoxGeometry(6, 2, 6);
			var base = new THREE.Mesh(baseGeom, miningMaterial);
			base.position.copy(pos);
			scene.add(base);
			objects.push(base);

			var armGeom = new THREE.CylinderGeometry(0.8, 0.8, 12, 6, 3);
			var arm = new THREE.Mesh(armGeom, drillerMaterial);
			arm.position.copy(pos);
			arm.position.y += 7;
			arm.rotation.z = Math.PI / 6;
			scene.add(arm);
			objects.push(arm);

			var drillGeom = new THREE.ConeGeometry(1, 4, 8);
			var drill = new THREE.Mesh(drillGeom, drillerMaterial);
			drill.position.copy(pos);
			drill.position.y += 14;
			drill.position.x += (pos.x > 0 ? 6 : -6);
			scene.add(drill);
			objects.push(drill);
			animatedObjects.push({ mesh: drill, type: 'spin', axis: 'y' });
		}
	}

	function buildSonarArrays() {
		var arrayMaterial = new THREE.MeshLambertMaterial({ color: 0x335599 });
		var dishMaterial = new THREE.MeshLambertMaterial({ color: 0x4466aa, emissive: 0x223366 });

		var arrayPositions = [
			{ x: -35, y: 40, z: 0 },
			{ x: 35, y: 40, z: 0 }
		];

		for (var i = 0; i < arrayPositions.length; i++) {
			var pos = arrayPositions[i];

			var supportGeom = new THREE.CylinderGeometry(0.5, 0.5, 20, 4, 4);
			var support = new THREE.Mesh(supportGeom, arrayMaterial);
			support.position.copy(pos);
			scene.add(support);
			objects.push(support);

			for (var j = 0; j < 4; j++) {
				var angle = (j / 4) * Math.PI * 2;
				var x = pos.x + Math.cos(angle) * 5;
				var z = pos.z + Math.sin(angle) * 5;

				var dishGeom = new THREE.SphereGeometry(2.5, 6, 6);
				var dish = new THREE.Mesh(dishGeom, dishMaterial);
				dish.position.set(x, pos.y + 8, z);
				dish.scale.set(1, 0.4, 1);
				scene.add(dish);
				objects.push(dish);
			}
		}
	}

	function buildTorpedoVaults() {
		var vaultMaterial = new THREE.MeshLambertMaterial({ color: 0x2a3a4a });
		var torpedoMaterial = new THREE.MeshLambertMaterial({ color: 0x555577 });

		var vaultPositions = [
			{ x: -15, y: 10, z: -35 },
			{ x: 15, y: 10, z: -35 },
			{ x: -15, y: 10, z: 35 },
			{ x: 15, y: 10, z: 35 }
		];

		for (var i = 0; i < vaultPositions.length; i++) {
			var pos = vaultPositions[i];

			var cageGeom = new THREE.BoxGeometry(5, 8, 5);
			var cage = new THREE.Mesh(cageGeom, vaultMaterial);
			cage.position.copy(pos);
			scene.add(cage);
			objects.push(cage);

			for (var j = 0; j < 3; j++) {
				var torpedoGeom = new THREE.CylinderGeometry(0.6, 0.6, 8, 6, 3);
				var torpedo = new THREE.Mesh(torpedoGeom, torpedoMaterial);
				torpedo.position.copy(pos);
				torpedo.position.y -= 1;
				torpedo.position.z += (j - 1) * 2;
				torpedo.rotation.z = Math.PI / 2;
				scene.add(torpedo);
				objects.push(torpedo);

				var noseGeom = new THREE.ConeGeometry(0.6, 2, 6);
				var nose = new THREE.Mesh(noseGeom, torpedoMaterial);
				nose.position.copy(pos);
				nose.position.y -= 1;
				nose.position.z += (j - 1) * 2;
				nose.position.x += 4;
				nose.rotation.z = Math.PI / 2;
				scene.add(nose);
				objects.push(nose);
			}
		}
	}

	function buildSquidEnemy() {
		var squidBodyMat = new THREE.MeshLambertMaterial({ color: 0x552277, emissive: 0x331155 });
		var squidEyeMat = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xffff00 });

		var bodyGeom = new THREE.SphereGeometry(3.5, 8, 8);
		var body = new THREE.Mesh(bodyGeom, squidBodyMat);
		body.position.set(-45, 5, 0);
		scene.add(body);
		objects.push(body);
		animatedObjects.push({ mesh: body, type: 'squid' });

		var eye1Geom = new THREE.SphereGeometry(0.8, 6, 6);
		var eye1 = new THREE.Mesh(eye1Geom, squidEyeMat);
		eye1.position.set(-48, 7, -1.5);
		scene.add(eye1);
		objects.push(eye1);

		var eye2Geom = new THREE.SphereGeometry(0.8, 6, 6);
		var eye2 = new THREE.Mesh(eye2Geom, squidEyeMat);
		eye2.position.set(-48, 7, 1.5);
		scene.add(eye2);
		objects.push(eye2);

		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var startX = -45 + Math.cos(angle) * 3;
			var startZ = Math.sin(angle) * 3;

			var tentacleGeom = new THREE.CylinderGeometry(0.4, 0.2, 15, 4, 6);
			var tentacle = new THREE.Mesh(tentacleGeom, squidBodyMat);
			tentacle.position.set(startX, 0, startZ);
			tentacle.baseX = startX;
			tentacle.baseY = 0;
			tentacle.baseZ = startZ;
			tentacle.angle = angle;
			tentacle.rotation.z = Math.PI / 2 + angle;
			scene.add(tentacle);
			objects.push(tentacle);
			squidTentacles.push(tentacle);
		}
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x001122, 0.3);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var ventLight1 = new THREE.PointLight(0xff8844, 1.5, 30);
		ventLight1.position.set(-25, -50, -20);
		scene.add(ventLight1);
		lights.push(ventLight1);

		var ventLight2 = new THREE.PointLight(0xff8844, 1.5, 30);
		ventLight2.position.set(25, -50, -20);
		scene.add(ventLight2);
		lights.push(ventLight2);

		var ventLight3 = new THREE.PointLight(0xff8844, 1.5, 30);
		ventLight3.position.set(0, -50, 30);
		scene.add(ventLight3);
		lights.push(ventLight3);

		var biolumLight1 = new THREE.PointLight(0x00ff88, 1, 25);
		biolumLight1.position.set(-30, 20, -35);
		scene.add(biolumLight1);
		lights.push(biolumLight1);

		var biolumLight2 = new THREE.PointLight(0x00ff88, 1, 25);
		biolumLight2.position.set(30, 15, -35);
		scene.add(biolumLight2);
		lights.push(biolumLight2);

		var sonarLight = new THREE.PointLight(0x4466aa, 0.8, 40);
		sonarLight.position.set(0, 40, 0);
		scene.add(sonarLight);
		lights.push(sonarLight);
	}

	function buildStructuralSupports() {
		var supportMaterial = new THREE.MeshLambertMaterial({ color: 0x4a5a6a });

		var supportPositions = [
			{ x: -28, y: 0, z: -28 },
			{ x: 28, y: 0, z: -28 },
			{ x: -28, y: 0, z: 28 },
			{ x: 28, y: 0, z: 28 }
		];

		for (var i = 0; i < supportPositions.length; i++) {
			var pos = supportPositions[i];

			var poleGeom = new THREE.CylinderGeometry(1.2, 1.2, 80, 6, 5);
			var pole = new THREE.Mesh(poleGeom, supportMaterial);
			pole.position.copy(pos);
			scene.add(pole);
			objects.push(pole);

			var baseGeom = new THREE.CylinderGeometry(3, 1.2, 2, 6, 1);
			var base = new THREE.Mesh(baseGeom, supportMaterial);
			base.position.copy(pos);
			base.position.y = -58;
			scene.add(base);
			objects.push(base);
		}

		var crossbrace1Geom = new THREE.BoxGeometry(56, 0.8, 0.8);
		var crossbrace1 = new THREE.Mesh(crossbrace1Geom, supportMaterial);
		crossbrace1.position.set(0, 20, 0);
		crossbrace1.rotation.z = Math.PI / 12;
		scene.add(crossbrace1);
		objects.push(crossbrace1);

		var crossbrace2Geom = new THREE.BoxGeometry(56, 0.8, 0.8);
		var crossbrace2 = new THREE.Mesh(crossbrace2Geom, supportMaterial);
		crossbrace2.position.set(0, -20, 0);
		crossbrace2.rotation.z = Math.PI / 12;
		scene.add(crossbrace2);
		objects.push(crossbrace2);

		var crossbrace3Geom = new THREE.BoxGeometry(0.8, 0.8, 56);
		var crossbrace3 = new THREE.Mesh(crossbrace3Geom, supportMaterial);
		crossbrace3.position.set(0, 0, 0);
		crossbrace3.rotation.x = Math.PI / 12;
		scene.add(crossbrace3);
		objects.push(crossbrace3);
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < animatedObjects.length; i++) {
			var anim = animatedObjects[i];

			if (anim.type === 'biolum') {
				var mesh = anim.mesh;
				var glow = Math.sin(time * 2 + anim.phase) * 0.5 + 0.5;
				mesh.material.emissive.setHex(Math.floor(0x00cc66 * glow));
				mesh.position.y = mesh.originalY + Math.sin(time + anim.phase) * 1.5;
			}

			if (anim.type === 'spin') {
				var mesh = anim.mesh;
				if (anim.axis === 'y') {
					mesh.rotation.y += delta * 6;
				}
			}

			if (anim.type === 'squid') {
				var mesh = anim.mesh;
				var squidWave = Math.sin(time * 0.8) * 0.15;
				mesh.position.x = -45 + Math.cos(time * 0.5) * 3;
				mesh.position.z = Math.sin(time * 0.6) * 4;
				mesh.rotation.z = squidWave;
			}
		}

		for (var j = 0; j < squidTentacles.length; j++) {
			var tentacle = squidTentacles[j];
			var waveX = Math.sin(time * 1.2 + tentacle.angle) * 3;
			var waveY = Math.cos(time * 0.9 + tentacle.angle) * 4;
			tentacle.position.x = tentacle.baseX + waveX;
			tentacle.position.y = tentacle.baseY + waveY;
			tentacle.position.z = tentacle.baseZ + Math.sin(time * 1.5 + tentacle.angle) * 2;
		}

		for (var k = 0; k < ventBubbles.length; k++) {
			var bubble = ventBubbles[k];
			var elapsed = time - bubble.delay;
			if (elapsed > 0) {
				var verticalDist = (elapsed * bubble.speed) % 30;
				bubble.position.x = bubble.baseX + Math.sin(time * 0.5 + k) * 1.5;
				bubble.position.y = bubble.baseY + verticalDist;
				bubble.position.z = bubble.baseZ + Math.cos(time * 0.4 + k) * 1.5;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		objects = [];
		lights = [];
		animatedObjects = [];
		squidTentacles = [];
		ventBubbles = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
