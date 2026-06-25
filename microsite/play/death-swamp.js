window.DeathSwamp = (function() {
	'use strict';

	var scene, camera;
	var objects = [];
	var materials = [];
	var lights = [];
	var animatedObjects = [];
	var particleSystem = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		materials = [];
		lights = [];
		animatedObjects = [];
		particleSystem = [];

		buildMaterials();
		buildLighting();
		buildTerrainBase();
		buildWaterFeatures();
		buildMilitaryVehicles();
		buildMangroves();
		buildBoobytrapWires();
		buildEnemyCamp();
		buildToxicVents();
		buildBridges();
		buildWarningMarkers();
	}

	function buildMaterials() {
		var swampGreen = new THREE.MeshLambertMaterial({ color: 0x3d5c3d });
		var darkGreen = new THREE.MeshLambertMaterial({ color: 0x2d4a2d });
		var brownSoil = new THREE.MeshLambertMaterial({ color: 0x5c4033 });
		var rustMetal = new THREE.MeshLambertMaterial({ color: 0x8b5a3c });
		var gunMetal = new THREE.MeshLambertMaterial({ color: 0x454545 });
		var woodBrown = new THREE.MeshLambertMaterial({ color: 0x6b4423 });
		var khakiTent = new THREE.MeshLambertMaterial({ color: 0x9a9f62 });
		var waterGreen = new THREE.MeshLambertMaterial({ color: 0x2b5a4a });

		materials = [swampGreen, darkGreen, brownSoil, rustMetal, gunMetal, woodBrown, khakiTent, waterGreen];
	}

	function buildLighting() {
		var ambientLight = new THREE.AmbientLight(0x5a6c5a, 0.6);
		scene.add(ambientLight);
		lights.push(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0x9a9a7a, 0.7);
		directionalLight.position.set(100, 150, 50);
		scene.add(directionalLight);
		lights.push(directionalLight);

		var pointLight1 = new THREE.PointLight(0x7aff6a, 1, 200);
		pointLight1.position.set(80, 80, 60);
		scene.add(pointLight1);
		lights.push(pointLight1);

		var pointLight2 = new THREE.PointLight(0x7aff6a, 0.8, 180);
		pointLight2.position.set(-90, 70, -70);
		scene.add(pointLight2);
		lights.push(pointLight2);
	}

	function buildTerrainBase() {
		var groundMaterial = materials[0];

		for (var i = 0; i < 15; i++) {
			var geometry = new THREE.BoxGeometry(60, 3, 60);
			var mesh = new THREE.Mesh(geometry, groundMaterial);
			mesh.position.set(Math.random() * 300 - 150, -5, Math.random() * 300 - 150);
			mesh.castShadow = true;
			mesh.receiveShadow = true;
			scene.add(mesh);
			objects.push(mesh);
		}

		for (var i = 0; i < 20; i++) {
			var mudGeometry = new THREE.BoxGeometry(40, 2, 40);
			var mudMaterial = materials[2];
			var mudMesh = new THREE.Mesh(mudGeometry, mudMaterial);
			mudMesh.position.set(Math.random() * 250 - 125, -4, Math.random() * 250 - 125);
			scene.add(mudMesh);
			objects.push(mudMesh);
		}
	}

	function buildWaterFeatures() {
		var waterMaterial = materials[7];

		for (var i = 0; i < 12; i++) {
			var poolGeometry = new THREE.CylinderGeometry(25 + Math.random() * 15, 25 + Math.random() * 15, 4, 32);
			var poolMesh = new THREE.Mesh(poolGeometry, waterMaterial);
			poolMesh.position.set(Math.random() * 280 - 140, -2, Math.random() * 280 - 140);
			scene.add(poolMesh);
			objects.push(poolMesh);

			var rippleGeometry = new THREE.BoxGeometry(50, 0.5, 50);
			var rippleMaterial = materials[1];
			var rippleMesh = new THREE.Mesh(rippleGeometry, rippleMaterial);
			rippleMesh.position.set(poolMesh.position.x, poolMesh.position.y + 2, poolMesh.position.z);
			rippleMesh.userData.baseY = rippleMesh.position.y;
			scene.add(rippleMesh);
			objects.push(rippleMesh);
			animatedObjects.push(rippleMesh);
		}
	}

	function buildMilitaryVehicles() {
		var gunmetalMaterial = materials[4];
		var rustMaterial = materials[3];

		for (var i = 0; i < 3; i++) {
			var tankBodyGeometry = new THREE.BoxGeometry(20, 12, 35);
			var tankBody = new THREE.Mesh(tankBodyGeometry, rustMaterial);
			tankBody.position.set(Math.random() * 200 - 100, 8, Math.random() * 200 - 100);
			tankBody.rotation.y = Math.random() * Math.PI;
			scene.add(tankBody);
			objects.push(tankBody);

			var turretGeometry = new THREE.CylinderGeometry(8, 8, 6, 16);
			var turret = new THREE.Mesh(turretGeometry, gunmetalMaterial);
			turret.position.set(tankBody.position.x, tankBody.position.y + 10, tankBody.position.z);
			scene.add(turret);
			objects.push(turret);

			var cannonGeometry = new THREE.CylinderGeometry(2, 2, 25, 8);
			var cannon = new THREE.Mesh(cannonGeometry, gunmetalMaterial);
			cannon.position.set(tankBody.position.x + 12, tankBody.position.y + 12, tankBody.position.z);
			cannon.rotation.z = 0.3;
			scene.add(cannon);
			objects.push(cannon);

			for (var t = 0; t < 2; t++) {
				var wheelGeometry = new THREE.CylinderGeometry(5, 5, 6, 16);
				var wheel = new THREE.Mesh(wheelGeometry, gunmetalMaterial);
				wheel.position.set(tankBody.position.x - 8, tankBody.position.y + 2, tankBody.position.z + (t * 20 - 10));
				scene.add(wheel);
				objects.push(wheel);
			}
		}

		for (var i = 0; i < 2; i++) {
			var jeepBodyGeometry = new THREE.BoxGeometry(12, 10, 22);
			var jeepBody = new THREE.Mesh(jeepBodyGeometry, rustMaterial);
			jeepBody.position.set(Math.random() * 200 - 100, 6, Math.random() * 200 - 100);
			scene.add(jeepBody);
			objects.push(jeepBody);

			for (var w = 0; w < 4; w++) {
				var wheelGeo = new THREE.CylinderGeometry(4, 4, 5, 12);
				var wheelMat = new THREE.Mesh(wheelGeo, gunmetalMaterial);
				var xOffset = (w % 2) * 8 - 4;
				var zOffset = Math.floor(w / 2) * 15 - 7.5;
				wheelMat.position.set(jeepBody.position.x + xOffset, jeepBody.position.y + 2, jeepBody.position.z + zOffset);
				scene.add(wheelMat);
				objects.push(wheelMat);
			}
		}
	}

	function buildMangroves() {
		for (var i = 0; i < 18; i++) {
			var trunkGeometry = new THREE.CylinderGeometry(3 + Math.random() * 2, 4 + Math.random() * 2, 40 + Math.random() * 20, 8);
			var trunkMaterial = materials[5];
			var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
			trunk.position.set(Math.random() * 250 - 125, 12, Math.random() * 250 - 125);
			trunk.rotation.z = (Math.random() - 0.5) * 0.4;
			scene.add(trunk);
			objects.push(trunk);

			var crownGeometry = new THREE.SphereGeometry(18 + Math.random() * 10, 8, 8);
			var crownMaterial = materials[1];
			var crown = new THREE.Mesh(crownGeometry, crownMaterial);
			crown.position.set(trunk.position.x, trunk.position.y + 25, trunk.position.z);
			crown.scale.set(1 + Math.random() * 0.3, 1 + Math.random() * 0.4, 1 + Math.random() * 0.3);
			scene.add(crown);
			objects.push(crown);

			for (var r = 0; r < 4; r++) {
				var rootGeometry = new THREE.CylinderGeometry(1.5, 2.5, 15, 6);
				var rootMaterial = materials[2];
				var root = new THREE.Mesh(rootGeometry, rootMaterial);
				var angle = (r / 4) * Math.PI * 2;
				root.position.set(
					trunk.position.x + Math.cos(angle) * 8,
					trunk.position.y - 8,
					trunk.position.z + Math.sin(angle) * 8
				);
				root.rotation.z = angle + Math.PI / 2;
				scene.add(root);
				objects.push(root);
			}
		}
	}

	function buildBoobytrapWires() {
		for (var i = 0; i < 15; i++) {
			var wire1Geometry = new THREE.BoxGeometry(1, 0.2, 25);
			var wireMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
			var wire1 = new THREE.Mesh(wire1Geometry, wireMaterial);
			wire1.position.set(Math.random() * 280 - 140, 1.5 + Math.random() * 2, Math.random() * 280 - 140);
			wire1.rotation.y = Math.random() * Math.PI;
			scene.add(wire1);
			objects.push(wire1);

			var alertGeometry = new THREE.SphereGeometry(0.8, 6, 6);
			var alertMaterial = new THREE.MeshLambertMaterial({ color: 0xff4400 });
			var alert1 = new THREE.Mesh(alertGeometry, alertMaterial);
			alert1.position.set(wire1.position.x - 10, wire1.position.y, wire1.position.z);
			scene.add(alert1);
			objects.push(alert1);

			var alert2 = new THREE.Mesh(alertGeometry, alertMaterial);
			alert2.position.set(wire1.position.x + 10, wire1.position.y, wire1.position.z);
			scene.add(alert2);
			objects.push(alert2);
		}
	}

	function buildEnemyCamp() {
		var platformMaterial = materials[5];
		var tentMaterial = materials[6];
		var postMaterial = materials[2];

		for (var p = 0; p < 3; p++) {
			var platformX = -80 + (p * 80);
			var platformZ = 80;

			var platformGeometry = new THREE.BoxGeometry(80, 3, 60);
			var platform = new THREE.Mesh(platformGeometry, platformMaterial);
			platform.position.set(platformX, 15, platformZ);
			platform.userData.baseY = platform.position.y;
			platform.userData.swayAmount = 0.3 + Math.random() * 0.2;
			platform.userData.swaySpeed = 0.5 + Math.random() * 0.3;
			platform.userData.swayPhase = Math.random() * Math.PI * 2;
			scene.add(platform);
			objects.push(platform);
			animatedObjects.push(platform);

			for (var s = 0; s < 4; s++) {
				var supportGeometry = new THREE.CylinderGeometry(2, 2, 20, 8);
				var support = new THREE.Mesh(supportGeometry, postMaterial);
				var xOff = (s % 2) * 30 - 15;
				var zOff = Math.floor(s / 2) * 25 - 12.5;
				support.position.set(platformX + xOff, 5, platformZ + zOff);
				scene.add(support);
				objects.push(support);
			}

			for (var t = 0; t < 3; t++) {
				var tentGeometry = new THREE.ConeGeometry(12, 18, 8);
				var tent = new THREE.Mesh(tentGeometry, tentMaterial);
				tent.position.set(platformX - 30 + (t * 30), platformGeometry.parameters.height + 18, platformZ);
				scene.add(tent);
				objects.push(tent);
			}

			for (var f = 0; f < 4; f++) {
				var fireGeometry = new THREE.ConeGeometry(1.5, 4, 6);
				var fireMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
				var fire = new THREE.Mesh(fireGeometry, fireMaterial);
				fire.position.set(platformX - 25 + (f * 15), platform.position.y + 5, platformZ - 20);
				scene.add(fire);
				objects.push(fire);
			}
		}
	}

	function buildToxicVents() {
		for (var i = 0; i < 10; i++) {
			var ventPipeGeometry = new THREE.CylinderGeometry(3, 3, 8, 12);
			var ventPipeMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
			var ventPipe = new THREE.Mesh(ventPipeGeometry, ventPipeMaterial);
			ventPipe.position.set(Math.random() * 200 - 100, 2, Math.random() * 200 - 100);
			scene.add(ventPipe);
			objects.push(ventPipe);

			for (var b = 0; b < 5; b++) {
				var bubbleGeometry = new THREE.SphereGeometry(1.5 + Math.random() * 1, 6, 6);
				var bubbleMaterial = new THREE.MeshLambertMaterial({ color: 0x7aff6a });
				var bubble = new THREE.Mesh(bubbleGeometry, bubbleMaterial);
				bubble.position.set(ventPipe.position.x, ventPipe.position.y + 8, ventPipe.position.z);
				bubble.userData.startY = bubble.position.y;
				bubble.userData.riseSpeed = 15 + Math.random() * 20;
				bubble.userData.driftX = (Math.random() - 0.5) * 40;
				bubble.userData.driftZ = (Math.random() - 0.5) * 40;
				scene.add(bubble);
				objects.push(bubble);
				particleSystem.push(bubble);
				animatedObjects.push(bubble);
			}
		}
	}

	function buildBridges() {
		var bridgeDecking = materials[5];
		var bridgeRail = new THREE.MeshLambertMaterial({ color: 0x4a3728 });

		for (var i = 0; i < 4; i++) {
			var bridgeX1 = -100 + (i * 70);
			var bridgeZ1 = -80 + (i % 2) * 40;
			var bridgeX2 = bridgeX1 + 60;
			var bridgeZ2 = bridgeZ1 + 40;

			var deckGeometry = new THREE.BoxGeometry(60, 2, 25);
			var deck = new THREE.Mesh(deckGeometry, bridgeDecking);
			deck.position.set((bridgeX1 + bridgeX2) / 2, 12, (bridgeZ1 + bridgeZ2) / 2);
			var dx = bridgeX2 - bridgeX1;
			var dz = bridgeZ2 - bridgeZ1;
			deck.rotation.y = Math.atan2(dz, dx);
			scene.add(deck);
			objects.push(deck);

			for (var r = 0; r < 2; r++) {
				var railGeometry = new THREE.BoxGeometry(2, 8, 60);
				var rail = new THREE.Mesh(railGeometry, bridgeRail);
				var yOff = (r - 0.5) * 8;
				rail.position.set((bridgeX1 + bridgeX2) / 2 + yOff, 14, (bridgeZ1 + bridgeZ2) / 2);
				rail.rotation.y = Math.atan2(dz, dx);
				scene.add(rail);
				objects.push(rail);
			}

			for (var p = 0; p < 3; p++) {
				var postGeometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 8);
				var post = new THREE.Mesh(postGeometry, new THREE.MeshLambertMaterial({ color: 0x5c4033 }));
				var interpX = bridgeX1 + (p / 2) * dx;
				var interpZ = bridgeZ1 + (p / 2) * dz;
				post.position.set(interpX, 5, interpZ);
				scene.add(post);
				objects.push(post);
			}
		}
	}

	function buildWarningMarkers() {
		var signMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
		var postMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });

		for (var i = 0; i < 12; i++) {
			var postGeometry = new THREE.CylinderGeometry(1, 1, 12, 8);
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(Math.random() * 250 - 125, 6, Math.random() * 250 - 125);
			scene.add(post);
			objects.push(post);

			var signGeometry = new THREE.BoxGeometry(12, 12, 0.5);
			var sign = new THREE.Mesh(signGeometry, signMaterial);
			sign.position.set(post.position.x, post.position.y + 8, post.position.z);
			sign.rotation.y = Math.random() * Math.PI;
			scene.add(sign);
			objects.push(sign);

			var skullGeometry = new THREE.SphereGeometry(2, 6, 6);
			var skullMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
			var skull = new THREE.Mesh(skullGeometry, skullMaterial);
			skull.position.set(sign.position.x, sign.position.y, sign.position.z + 1);
			scene.add(skull);
			objects.push(skull);
		}
	}

	function update(delta) {
		for (var i = 0; i < animatedObjects.length; i++) {
			var obj = animatedObjects[i];

			if (obj.userData.baseY !== undefined && obj.userData.swayAmount !== undefined) {
				obj.userData.swayPhase += obj.userData.swaySpeed * delta;
				obj.position.y = obj.userData.baseY + Math.sin(obj.userData.swayPhase) * obj.userData.swayAmount;
			}

			if (obj.userData.riseSpeed !== undefined) {
				obj.position.y += obj.userData.riseSpeed * delta;
				obj.position.x += (obj.userData.driftX / obj.userData.riseSpeed) * delta;
				obj.position.z += (obj.userData.driftZ / obj.userData.riseSpeed) * delta;

				if (obj.position.y > obj.userData.startY + 80) {
					obj.position.y = obj.userData.startY;
					obj.position.x -= obj.userData.driftX;
					obj.position.z -= obj.userData.driftZ;
				}
			}

			if (obj.userData.baseY !== undefined && obj.userData.swayAmount === undefined) {
				obj.position.y = obj.userData.baseY + Math.sin(Date.now() * 0.001 + i) * 0.3;
			}
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		for (var i = 0; i < lights.length; i++) {
			scene.remove(lights[i]);
		}
		for (var i = 0; i < particleSystem.length; i++) {
			scene.remove(particleSystem[i]);
		}

		objects = [];
		materials = [];
		lights = [];
		animatedObjects = [];
		particleSystem = [];
		scene = null;
		camera = null;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
})();
