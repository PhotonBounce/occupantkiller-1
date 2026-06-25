window.VoltBase = (function() {
	'use strict';

	var scene = null;
	var camera = null;
	var objects = [];
	var lights = [];
	var animatedObjects = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animatedObjects = [];
		time = 0;

		buildground();
		buildboundary();
		buildteslacoils();
		buildcapacitorbanks();
		buildempcanon();
		buildblastwalls();
		buildtransformers();
		buildplasmacontainment();
		buildreactorcore();
		buildcontrolroom();
		buildlighting();
	}

	function buildground() {
		var geometry = new THREE.BoxGeometry(200, 1, 200);
		var material = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
		var ground = new THREE.Mesh(geometry, material);
		ground.position.y = -0.5;
		ground.castShadow = true;
		ground.receiveShadow = true;
		scene.add(ground);
		objects.push(ground);
	}

	function buildboundary() {
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x0f3460 });
		var positions = [
			{ x: 100, z: 0, w: 200, h: 30, d: 2 },
			{ x: -100, z: 0, w: 200, h: 30, d: 2 },
			{ x: 0, z: 100, w: 2, h: 30, d: 200 },
			{ x: 0, z: -100, w: 2, h: 30, d: 200 }
		];
		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var geometry = new THREE.BoxGeometry(pos.w, pos.h, pos.d);
			var wall = new THREE.Mesh(geometry, wallMaterial);
			wall.position.set(pos.x, pos.h / 2, pos.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			scene.add(wall);
			objects.push(wall);
		}
	}

	function buildteslacoils() {
		var positions = [
			{ x: 50, z: 50 },
			{ x: -50, z: 50 },
			{ x: 50, z: -50 },
			{ x: -50, z: -50 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var baseGeometry = new THREE.BoxGeometry(8, 2, 8);
			var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a4e });
			var base = new THREE.Mesh(baseGeometry, baseMaterial);
			base.position.set(pos.x, 1, pos.z);
			base.castShadow = true;
			scene.add(base);
			objects.push(base);

			var towerGeometry = new THREE.CylinderGeometry(3, 3, 40, 8);
			var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
			var tower = new THREE.Mesh(towerGeometry, towerMaterial);
			tower.position.set(pos.x, 21, pos.z);
			tower.castShadow = true;
			scene.add(tower);
			objects.push(tower);

			var topCoilGeometry = new THREE.SphereGeometry(4, 8, 8);
			var topCoilMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff, emissive: 0x00a8cc });
			var topCoil = new THREE.Mesh(topCoilGeometry, topCoilMaterial);
			topCoil.position.set(pos.x, 43, pos.z);
			topCoil.castShadow = true;
			scene.add(topCoil);
			objects.push(topCoil);

			var ringGeometry = new THREE.CylinderGeometry(5, 5, 1, 16);
			var ringMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			var ring = new THREE.Mesh(ringGeometry, ringMaterial);
			ring.position.set(pos.x, 38, pos.z);
			scene.add(ring);
			objects.push(ring);
		}

		var lightningGroup = {
			coil1: { x: 50, z: 50 },
			coil2: { x: -50, z: 50 },
			object: null,
			visible: false
		};
		animatedObjects.push(lightningGroup);
		createlightningbolt(lightningGroup);
	}

	function createlightningbolt(group) {
		var points = [];
		var segments = 8;
		for (var i = 0; i <= segments; i++) {
			var t = i / segments;
			var x = group.coil1.x + (group.coil2.x - group.coil1.x) * t;
			var y = 43 + Math.random() * 4 - 2;
			var z = group.coil1.z + (group.coil2.z - group.coil1.z) * t;
			points.push(new THREE.Vector3(x, y, z));
		}
		var geometry = new THREE.BufferGeometry().setFromPoints(points);
		var material = new THREE.LineBasicMaterial({ color: 0x00ffff, linewidth: 3 });
		var lightning = new THREE.LineSegments(geometry, material);
		scene.add(lightning);
		group.object = lightning;
		group.visible = false;
	}

	function buildcapacitorbanks() {
		var positions = [
			{ x: 30, z: -40 },
			{ x: -30, z: -40 },
			{ x: 30, z: -60 },
			{ x: -30, z: -60 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			for (var j = 0; j < 3; j++) {
				var cylinderGeometry = new THREE.CylinderGeometry(2, 2, 15, 8);
				var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
				var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
				cylinder.position.set(pos.x + (j - 1) * 5, 8, pos.z);
				cylinder.castShadow = true;
				scene.add(cylinder);
				objects.push(cylinder);

				var capGeometry = new THREE.SphereGeometry(2.2, 6, 6);
				var capMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff, emissive: 0x004466 });
				var cap = new THREE.Mesh(capGeometry, capMaterial);
				cap.position.set(pos.x + (j - 1) * 5, 15.5, pos.z);
				cap.castShadow = true;
				scene.add(cap);
				objects.push(cap);
			}

			var frameGeometry = new THREE.BoxGeometry(20, 18, 4);
			var frameMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a4e });
			var frame = new THREE.Mesh(frameGeometry, frameMaterial);
			frame.position.set(pos.x, 9, pos.z - 5);
			frame.castShadow = true;
			scene.add(frame);
			objects.push(frame);
		}
	}

	function buildempcanon() {
		var baseGeometry = new THREE.BoxGeometry(12, 4, 12);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(0, 2, 70);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var pedestal1Geometry = new THREE.BoxGeometry(10, 6, 10);
		var pedestalMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a4e });
		var pedestal1 = new THREE.Mesh(pedestal1Geometry, pedestalMaterial);
		pedestal1.position.set(0, 8, 70);
		pedestal1.castShadow = true;
		scene.add(pedestal1);
		objects.push(pedestal1);

		var pedestal2Geometry = new THREE.BoxGeometry(8, 6, 8);
		var pedestal2 = new THREE.Mesh(pedestal2Geometry, pedestalMaterial);
		pedestal2.position.set(0, 14, 70);
		pedestal2.castShadow = true;
		scene.add(pedestal2);
		objects.push(pedestal2);

		var coilGeometry = new THREE.CylinderGeometry(6, 6, 3, 12);
		var coilMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff });
		var coil = new THREE.Mesh(coilGeometry, coilMaterial);
		coil.position.set(0, 18, 70);
		coil.castShadow = true;
		scene.add(coil);
		objects.push(coil);

		var chargeGlobe = {
			mesh: null,
			intensity: 0,
			direction: 0.05
		};
		var globeGeometry = new THREE.SphereGeometry(5, 8, 8);
		var globeMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xffff00 });
		chargeGlobe.mesh = new THREE.Mesh(globeGeometry, globeMaterial);
		chargeGlobe.mesh.position.set(0, 25, 70);
		scene.add(chargeGlobe.mesh);
		objects.push(chargeGlobe.mesh);
		animatedObjects.push(chargeGlobe);

		var barrelGeometry = new THREE.CylinderGeometry(4, 4, 25, 8);
		var barrelMaterial = new THREE.MeshLambertMaterial({ color: 0x0f3460 });
		var barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
		barrel.position.set(0, 30, 85);
		barrel.rotation.z = Math.PI / 3;
		barrel.castShadow = true;
		scene.add(barrel);
		objects.push(barrel);
	}

	function buildblastwalls() {
		var positions = [
			{ x: 70, z: 0, rx: 0, rz: 0 },
			{ x: -70, z: 0, rx: 0, rz: 0 },
			{ x: 0, z: 70, rx: 0, rz: Math.PI / 2 },
			{ x: 0, z: -70, rx: 0, rz: Math.PI / 2 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var geometry = new THREE.BoxGeometry(4, 25, 50);
			var material = new THREE.MeshLambertMaterial({ color: 0x0f3460 });
			var wall = new THREE.Mesh(geometry, material);
			wall.position.set(pos.x, 12.5, pos.z);
			wall.rotation.z = pos.rz;
			wall.castShadow = true;
			scene.add(wall);
			objects.push(wall);

			for (var j = 0; j < 5; j++) {
				var reinforcementGeometry = new THREE.BoxGeometry(5, 2, 8);
				var reinforcementMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
				var reinforcement = new THREE.Mesh(reinforcementGeometry, reinforcementMaterial);
				var offsetZ = (j - 2) * 10;
				if (Math.abs(pos.x) > Math.abs(pos.z)) {
					reinforcement.position.set(pos.x, 6 + j * 4, offsetZ);
				} else {
					reinforcement.position.set(offsetZ, 6 + j * 4, pos.z);
				}
				scene.add(reinforcement);
				objects.push(reinforcement);
			}
		}
	}

	function buildtransformers() {
		var positions = [
			{ x: 40, z: 20 },
			{ x: -40, z: 20 },
			{ x: 40, z: -20 },
			{ x: -40, z: -20 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var mainGeometry = new THREE.BoxGeometry(6, 10, 6);
			var mainMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
			var main = new THREE.Mesh(mainGeometry, mainMaterial);
			main.position.set(pos.x, 5, pos.z);
			main.castShadow = true;
			scene.add(main);
			objects.push(main);

			var coolerGeometry = new THREE.CylinderGeometry(2.5, 2.5, 8, 8);
			var coolerMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff });
			var cooler = new THREE.Mesh(coolerGeometry, coolerMaterial);
			cooler.position.set(pos.x, 12, pos.z);
			cooler.castShadow = true;
			scene.add(cooler);
			objects.push(cooler);

			var connectorGeometry = new THREE.BoxGeometry(1, 3, 1);
			var connectorMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
			for (var j = 0; j < 2; j++) {
				var connector = new THREE.Mesh(connectorGeometry, connectorMaterial);
				connector.position.set(pos.x - 3 + j * 6, 8, pos.z + 3);
				scene.add(connector);
				objects.push(connector);
			}
		}
	}

	function buildplasmacontainment() {
		var positions = [
			{ x: 0, z: 0 },
			{ x: 40, z: 40 },
			{ x: -40, z: 40 }
		];

		for (var i = 0; i < positions.length; i++) {
			var pos = positions[i];
			var cylinderGeometry = new THREE.CylinderGeometry(8, 8, 20, 12);
			var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
			var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
			cylinder.position.set(pos.x, 10, pos.z);
			cylinder.castShadow = true;
			scene.add(cylinder);
			objects.push(cylinder);

			var topCapGeometry = new THREE.SphereGeometry(8.2, 12, 8);
			var topCapMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff, emissive: 0x004466 });
			var topCap = new THREE.Mesh(topCapGeometry, topCapMaterial);
			topCap.position.set(pos.x, 21, pos.z);
			topCap.castShadow = true;
			scene.add(topCap);
			objects.push(topCap);

			var bottomCapGeometry = new THREE.ConeGeometry(8.2, 4, 12);
			var bottomCap = new THREE.Mesh(bottomCapGeometry, topCapMaterial);
			bottomCap.position.set(pos.x, -1, pos.z);
			bottomCap.castShadow = true;
			scene.add(bottomCap);
			objects.push(bottomCap);

			var glowSphere = {
				mesh: null,
				intensity: 0.5,
				direction: 0.03
			};
			var glowGeometry = new THREE.SphereGeometry(7.5, 8, 8);
			var glowMaterial = new THREE.MeshLambertMaterial({ color: 0x00ffff, emissive: 0x0088ff });
			glowSphere.mesh = new THREE.Mesh(glowGeometry, glowMaterial);
			glowSphere.mesh.position.set(pos.x, 10, pos.z);
			scene.add(glowSphere.mesh);
			objects.push(glowSphere.mesh);
			animatedObjects.push(glowSphere);
		}
	}

	function buildreactorcore() {
		var baseGeometry = new THREE.BoxGeometry(30, 2, 30);
		var baseMaterial = new THREE.MeshLambertMaterial({ color: 0x0f3460 });
		var base = new THREE.Mesh(baseGeometry, baseMaterial);
		base.position.set(0, 1, 0);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var cylinderGeometry = new THREE.CylinderGeometry(12, 12, 25, 16);
		var cylinderMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
		var cylinder = new THREE.Mesh(cylinderGeometry, cylinderMaterial);
		cylinder.position.set(0, 14.5, 0);
		cylinder.castShadow = true;
		scene.add(cylinder);
		objects.push(cylinder);

		var outerRingGeometry = new THREE.CylinderGeometry(14, 14, 2, 16);
		var outerRingMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00 });
		var outerRing = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
		outerRing.position.set(0, 12, 0);
		scene.add(outerRing);
		objects.push(outerRing);

		var middleRingGeometry = new THREE.CylinderGeometry(10, 10, 1.5, 16);
		var middleRingMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff });
		var middleRing = new THREE.Mesh(middleRingGeometry, middleRingMaterial);
		middleRing.position.set(0, 18, 0);
		scene.add(middleRing);
		objects.push(middleRing);

		var coreGeometry = new THREE.SphereGeometry(8, 10, 10);
		var coreMaterial = new THREE.MeshLambertMaterial({ color: 0xffff00, emissive: 0xffff00 });
		var core = new THREE.Mesh(coreGeometry, coreMaterial);
		core.position.set(0, 14.5, 0);
		core.castShadow = true;
		scene.add(core);
		objects.push(core);

		var pulsing = {
			mesh: core,
			scale: 1,
			direction: 0.015
		};
		animatedObjects.push(pulsing);

		for (var i = 0; i < 6; i++) {
			var angle = (i / 6) * Math.PI * 2;
			var rodGeometry = new THREE.CylinderGeometry(1.5, 1.5, 20, 6);
			var rodMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff });
			var rod = new THREE.Mesh(rodGeometry, rodMaterial);
			rod.position.set(Math.cos(angle) * 12, 14.5, Math.sin(angle) * 12);
			rod.castShadow = true;
			scene.add(rod);
			objects.push(rod);
		}

		var topCapGeometry = new THREE.SphereGeometry(12.5, 12, 8);
		var topCapMaterial = new THREE.MeshLambertMaterial({ color: 0x004466, emissive: 0x002233 });
		var topCap = new THREE.Mesh(topCapGeometry, topCapMaterial);
		topCap.position.set(0, 28, 0);
		topCap.castShadow = true;
		scene.add(topCap);
		objects.push(topCap);
	}

	function buildcontrolroom() {
		var wallGeometry = new THREE.BoxGeometry(25, 15, 20);
		var wallMaterial = new THREE.MeshLambertMaterial({ color: 0x0f3460 });
		var wall = new THREE.Mesh(wallGeometry, wallMaterial);
		wall.position.set(0, 7.5, -70);
		wall.castShadow = true;
		scene.add(wall);
		objects.push(wall);

		var roofGeometry = new THREE.BoxGeometry(25, 2, 20);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0x1a1a2e });
		var roof = new THREE.Mesh(roofGeometry, roofMaterial);
		roof.position.set(0, 16, -70);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);

		for (var i = 0; i < 8; i++) {
			var panelGeometry = new THREE.BoxGeometry(2.5, 2.5, 1);
			var panelMaterial = new THREE.MeshLambertMaterial({ color: 0x00d4ff });
			var panel = new THREE.Mesh(panelGeometry, panelMaterial);
			var xPos = -10 + (i % 4) * 6.5;
			var yPos = 6 + Math.floor(i / 4) * 4;
			panel.position.set(xPos, yPos, -69);
			scene.add(panel);
			objects.push(panel);
		}

		for (var j = 0; j < 4; j++) {
			var doorGeometry = new THREE.BoxGeometry(4, 6, 1);
			var doorMaterial = new THREE.MeshLambertMaterial({ color: 0x2a2a4e });
			var door = new THREE.Mesh(doorGeometry, doorMaterial);
			door.position.set(-7 + j * 5, 3, -69);
			scene.add(door);
			objects.push(door);
		}
	}

	function buildlighting() {
		var ambientGeometry = new THREE.SphereGeometry(0.1, 4, 4);
		var ambientMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });

		var ambientLight = new THREE.AmbientLight(0x333333, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
		directionalLight.position.set(50, 60, 50);
		directionalLight.castShadow = true;
		directionalLight.shadow.mapSize.width = 2048;
		directionalLight.shadow.mapSize.height = 2048;
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0x00d4ff, 1, 150);
		pointLight1.position.set(50, 45, 50);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x00d4ff, 1, 150);
		pointLight2.position.set(-50, 45, 50);
		scene.add(pointLight2);
		lights.push(pointLight2);

		var pointLight3 = new THREE.PointLight(0xffff00, 1.5, 100);
		pointLight3.position.set(0, 14.5, 0);
		scene.add(pointLight3);
		lights.push(pointLight3);

		var pointLight4 = new THREE.PointLight(0xffff00, 1, 80);
		pointLight4.position.set(0, 25, 70);
		scene.add(pointLight4);
		lights.push(pointLight4);
	}

	function update(delta) {
		time += delta;

		for (var i = 0; i < animatedObjects.length; i++) {
			var obj = animatedObjects[i];

			if (obj.direction !== undefined && obj.mesh !== undefined) {
				if (obj.intensity !== undefined) {
					obj.intensity += obj.direction;
					if (obj.intensity > 1 || obj.intensity < 0.3) {
						obj.direction = -obj.direction;
					}
					if (obj.mesh.material) {
						obj.mesh.material.emissive.setHex(0x004466);
						obj.mesh.material.emissive.multiplyScalar(obj.intensity * 2);
					}
				}

				if (obj.scale !== undefined) {
					obj.scale += obj.direction;
					if (obj.scale > 1.15 || obj.scale < 0.85) {
						obj.direction = -obj.direction;
					}
					obj.mesh.scale.set(obj.scale, obj.scale, obj.scale);
				}
			}

			if (obj.coil1 !== undefined && obj.object !== undefined) {
				var flashChance = Math.random();
				if (flashChance < 0.02) {
					obj.visible = true;
					obj.object.visible = true;
				} else if (obj.visible && flashChance < 0.1) {
					obj.visible = false;
					obj.object.visible = false;
				}

				if (obj.object.visible) {
					var points = [];
					var segments = 8;
					for (var j = 0; j <= segments; j++) {
						var t = j / segments;
						var x = obj.coil1.x + (obj.coil2.x - obj.coil1.x) * t;
						var y = 43 + Math.sin(time * 15 + j) * 2;
						var z = obj.coil1.z + (obj.coil2.z - obj.coil1.z) * t;
						points.push(new THREE.Vector3(x, y, z));
					}
					obj.object.geometry.dispose();
					obj.object.geometry = new THREE.BufferGeometry().setFromPoints(points);
				}
			}
		}
	}

	function reset() {
		if (scene) {
			for (var i = 0; i < objects.length; i++) {
				if (objects[i]) {
					scene.remove(objects[i]);
					if (objects[i].geometry) {
						objects[i].geometry.dispose();
					}
					if (objects[i].material) {
						objects[i].material.dispose();
					}
				}
			}
			for (var j = 0; j < lights.length; j++) {
				if (lights[j]) {
					scene.remove(lights[j]);
				}
			}
		}
		objects = [];
		lights = [];
		animatedObjects = [];
		scene = null;
		camera = null;
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
