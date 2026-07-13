window.RockBase = (function() {
	'use strict';

	var scene;
	var camera;
	var meshes = [];
	var lights = [];
	var animatedObjects = [];

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		meshes = [];
		lights = [];
		animatedObjects = [];

		buildMainBoulders();
		buildCaveEntrance();
		buildRockBridge();
		buildGunEmplacements();
		buildCamoNetting();
		buildParadeGround();
		buildTunnels();
		buildLightsAndDetails();
	}

	function buildMainBoulders() {
		var geometry = new THREE.BoxGeometry(40, 50, 35);
		var material = new THREE.MeshLambertMaterial({ color: 0x5a5a52 });
		var boulder = new THREE.Mesh(geometry, material);
		boulder.position.set(-30, 25, -50);
		boulder.rotation.set(0.3, 0.5, 0.2);
		boulder.castShadow = true;
		boulder.receiveShadow = true;
		scene.add(boulder);
		meshes.push(boulder);

		var geometry2 = new THREE.BoxGeometry(45, 55, 40);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x6b6b5f });
		var boulder2 = new THREE.Mesh(geometry2, material2);
		boulder2.position.set(35, 28, -45);
		boulder2.rotation.set(0.2, -0.4, 0.15);
		boulder2.castShadow = true;
		boulder2.receiveShadow = true;
		scene.add(boulder2);
		meshes.push(boulder2);

		var geometry3 = new THREE.BoxGeometry(35, 42, 30);
		var material3 = new THREE.MeshLambertMaterial({ color: 0x7a7a6d });
		var boulder3 = new THREE.Mesh(geometry3, material3);
		boulder3.position.set(0, 20, -60);
		boulder3.rotation.set(0.15, 0.3, -0.1);
		boulder3.castShadow = true;
		boulder3.receiveShadow = true;
		scene.add(boulder3);
		meshes.push(boulder3);

		var geometry4 = new THREE.BoxGeometry(32, 38, 28);
		var material4 = new THREE.MeshLambertMaterial({ color: 0x696957 });
		var boulder4 = new THREE.Mesh(geometry4, material4);
		boulder4.position.set(-50, 19, 20);
		boulder4.rotation.set(0.25, -0.6, 0.3);
		boulder4.castShadow = true;
		boulder4.receiveShadow = true;
		scene.add(boulder4);
		meshes.push(boulder4);

		var geometry5 = new THREE.BoxGeometry(38, 44, 33);
		var material5 = new THREE.MeshLambertMaterial({ color: 0x5f5f57 });
		var boulder5 = new THREE.Mesh(geometry5, material5);
		boulder5.position.set(50, 22, 15);
		boulder5.rotation.set(0.35, 0.2, -0.25);
		boulder5.castShadow = true;
		boulder5.receiveShadow = true;
		scene.add(boulder5);
		meshes.push(boulder5);
	}

	function buildCaveEntrance() {
		var geometry = new THREE.SphereGeometry(45, 12, 8);
		var material = new THREE.MeshLambertMaterial({ color: 0x3a3a32 });
		var cave = new THREE.Mesh(geometry, material);
		cave.position.set(0, 35, 80);
		cave.scale.set(1, 1.2, 0.6);
		cave.castShadow = true;
		cave.receiveShadow = true;
		scene.add(cave);
		meshes.push(cave);

		var geometry2 = new THREE.BoxGeometry(70, 50, 8);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x4a4a42 });
		var cavefloor = new THREE.Mesh(geometry2, material2);
		cavefloor.position.set(0, 10, 80);
		cavefloor.castShadow = true;
		cavefloor.receiveShadow = true;
		scene.add(cavefloor);
		meshes.push(cavefloor);

		var geometry3 = new THREE.CylinderGeometry(8, 12, 25, 8);
		var material3 = new THREE.MeshLambertMaterial({ color: 0x2a2a22 });
		var stalactite = new THREE.Mesh(geometry3, material3);
		stalactite.position.set(-15, 55, 80);
		stalactite.castShadow = true;
		stalactite.receiveShadow = true;
		scene.add(stalactite);
		meshes.push(stalactite);
		animatedObjects.push({ mesh: stalactite, type: 'drip', time: 0 });

		var geometry4 = new THREE.CylinderGeometry(6, 10, 20, 8);
		var material4 = new THREE.MeshLambertMaterial({ color: 0x2a2a22 });
		var stalactite2 = new THREE.Mesh(geometry4, material4);
		stalactite2.position.set(15, 58, 80);
		stalactite2.castShadow = true;
		stalactite2.receiveShadow = true;
		scene.add(stalactite2);
		meshes.push(stalactite2);
		animatedObjects.push({ mesh: stalactite2, type: 'drip', time: 1 });
	}

	function buildRockBridge() {
		var geometry = new THREE.BoxGeometry(25, 8, 60);
		var material = new THREE.MeshLambertMaterial({ color: 0x7a6a5a });
		var bridge = new THREE.Mesh(geometry, material);
		bridge.position.set(0, 15, 0);
		bridge.rotation.z = 0.05;
		bridge.castShadow = true;
		bridge.receiveShadow = true;
		scene.add(bridge);
		meshes.push(bridge);

		var geometry2 = new THREE.CylinderGeometry(3, 3, 25, 6);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x696957 });
		var pillar1 = new THREE.Mesh(geometry2, material2);
		pillar1.position.set(-15, 0, -20);
		pillar1.castShadow = true;
		pillar1.receiveShadow = true;
		scene.add(pillar1);
		meshes.push(pillar1);

		var pillar2 = new THREE.Mesh(geometry2, material2);
		pillar2.position.set(15, 0, -20);
		pillar2.castShadow = true;
		pillar2.receiveShadow = true;
		scene.add(pillar2);
		meshes.push(pillar2);

		var pillar3 = new THREE.Mesh(geometry2, material2);
		pillar3.position.set(-15, 0, 20);
		pillar3.castShadow = true;
		pillar3.receiveShadow = true;
		scene.add(pillar3);
		meshes.push(pillar3);

		var pillar4 = new THREE.Mesh(geometry2, material2);
		pillar4.position.set(15, 0, 20);
		pillar4.castShadow = true;
		pillar4.receiveShadow = true;
		scene.add(pillar4);
		meshes.push(pillar4);

		var geometry3 = new THREE.BoxGeometry(40, 2, 2);
		var material3 = new THREE.MeshLambertMaterial({ color: 0x3a3a32 });
		var railing1 = new THREE.Mesh(geometry3, material3);
		railing1.position.set(0, 20, -12);
		railing1.castShadow = true;
		railing1.receiveShadow = true;
		scene.add(railing1);
		meshes.push(railing1);

		var railing2 = new THREE.Mesh(geometry3, material3);
		railing2.position.set(0, 20, 12);
		railing2.castShadow = true;
		railing2.receiveShadow = true;
		scene.add(railing2);
		meshes.push(railing2);
	}

	function buildGunEmplacements() {
		var geometry = new THREE.BoxGeometry(20, 15, 18);
		var material = new THREE.MeshLambertMaterial({ color: 0x5a5a52 });
		var emplacement1 = new THREE.Mesh(geometry, material);
		emplacement1.position.set(-35, 8, -35);
		emplacement1.rotation.y = 0.4;
		emplacement1.castShadow = true;
		emplacement1.receiveShadow = true;
		scene.add(emplacement1);
		meshes.push(emplacement1);

		var geometry2 = new THREE.CylinderGeometry(5, 5, 15, 8);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x4a4a42 });
		var gunbarrel1 = new THREE.Mesh(geometry2, material2);
		gunbarrel1.position.set(-35, 18, -35);
		gunbarrel1.rotation.z = 0.3;
		gunbarrel1.castShadow = true;
		gunbarrel1.receiveShadow = true;
		scene.add(gunbarrel1);
		meshes.push(gunbarrel1);

		var emplacement2 = new THREE.Mesh(geometry, material);
		emplacement2.position.set(40, 10, -30);
		emplacement2.rotation.y = -0.5;
		emplacement2.castShadow = true;
		emplacement2.receiveShadow = true;
		scene.add(emplacement2);
		meshes.push(emplacement2);

		var gunbarrel2 = new THREE.Mesh(geometry2, material2);
		gunbarrel2.position.set(40, 20, -30);
		gunbarrel2.rotation.z = 0.25;
		gunbarrel2.castShadow = true;
		gunbarrel2.receiveShadow = true;
		scene.add(gunbarrel2);
		meshes.push(gunbarrel2);

		var emplacement3 = new THREE.Mesh(geometry, material);
		emplacement3.position.set(-42, 12, 25);
		emplacement3.rotation.y = 0.6;
		emplacement3.castShadow = true;
		emplacement3.receiveShadow = true;
		scene.add(emplacement3);
		meshes.push(emplacement3);

		var gunbarrel3 = new THREE.Mesh(geometry2, material2);
		gunbarrel3.position.set(-42, 22, 25);
		gunbarrel3.rotation.z = 0.2;
		gunbarrel3.castShadow = true;
		gunbarrel3.receiveShadow = true;
		scene.add(gunbarrel3);
		meshes.push(gunbarrel3);

		var emplacement4 = new THREE.Mesh(geometry, material);
		emplacement4.position.set(45, 11, 30);
		emplacement4.rotation.y = -0.4;
		emplacement4.castShadow = true;
		emplacement4.receiveShadow = true;
		scene.add(emplacement4);
		meshes.push(emplacement4);

		var gunbarrel4 = new THREE.Mesh(geometry2, material2);
		gunbarrel4.position.set(45, 21, 30);
		gunbarrel4.rotation.z = 0.28;
		gunbarrel4.castShadow = true;
		gunbarrel4.receiveShadow = true;
		scene.add(gunbarrel4);
		meshes.push(gunbarrel4);
	}

	function buildCamoNetting() {
		var geometry = new THREE.BoxGeometry(50, 1, 40);
		var material = new THREE.MeshLambertMaterial({ color: 0x4a5a3a });
		var netting1 = new THREE.Mesh(geometry, material);
		netting1.position.set(-25, 35, -25);
		netting1.rotation.x = 0.1;
		netting1.castShadow = true;
		netting1.receiveShadow = true;
		scene.add(netting1);
		meshes.push(netting1);
		animatedObjects.push({ mesh: netting1, type: 'sway', time: 0 });

		var netting2 = new THREE.Mesh(geometry, material);
		netting2.position.set(30, 38, 20);
		netting2.rotation.x = 0.12;
		netting2.castShadow = true;
		netting2.receiveShadow = true;
		scene.add(netting2);
		meshes.push(netting2);
		animatedObjects.push({ mesh: netting2, type: 'sway', time: 1.5 });

		var geometry2 = new THREE.CylinderGeometry(2, 2, 35, 6);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x5a6a4a });
		var rockspire1 = new THREE.Mesh(geometry2, material2);
		rockspire1.position.set(-25, 20, -45);
		rockspire1.castShadow = true;
		rockspire1.receiveShadow = true;
		scene.add(rockspire1);
		meshes.push(rockspire1);

		var rockspire2 = new THREE.Mesh(geometry2, material2);
		rockspire2.position.set(30, 22, 35);
		rockspire2.castShadow = true;
		rockspire2.receiveShadow = true;
		scene.add(rockspire2);
		meshes.push(rockspire2);

		var rockspire3 = new THREE.Mesh(geometry2, material2);
		rockspire3.position.set(-40, 21, 10);
		rockspire3.castShadow = true;
		rockspire3.receiveShadow = true;
		scene.add(rockspire3);
		meshes.push(rockspire3);

		var rockspire4 = new THREE.Mesh(geometry2, material2);
		rockspire4.position.set(50, 20, 5);
		rockspire4.castShadow = true;
		rockspire4.receiveShadow = true;
		scene.add(rockspire4);
		meshes.push(rockspire4);
	}

	function buildParadeGround() {
		var geometry = new THREE.BoxGeometry(80, 1, 70);
		var material = new THREE.MeshLambertMaterial({ color: 0x6a6a5a });
		var parade = new THREE.Mesh(geometry, material);
		parade.position.set(0, 0, 0);
		parade.castShadow = true;
		parade.receiveShadow = true;
		scene.add(parade);
		meshes.push(parade);

		var geometry2 = new THREE.BoxGeometry(2, 8, 80);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x7a7a6d });
		var wall1 = new THREE.Mesh(geometry2, material2);
		wall1.position.set(-40, 4, 0);
		wall1.castShadow = true;
		wall1.receiveShadow = true;
		scene.add(wall1);
		meshes.push(wall1);

		var wall2 = new THREE.Mesh(geometry2, material2);
		wall2.position.set(40, 4, 0);
		wall2.castShadow = true;
		wall2.receiveShadow = true;
		scene.add(wall2);
		meshes.push(wall2);

		var geometry3 = new THREE.BoxGeometry(80, 1, 2);
		var material3 = new THREE.MeshLambertMaterial({ color: 0x4a4a42 });
		var wall3 = new THREE.Mesh(geometry3, material3);
		wall3.position.set(0, 4, -35);
		wall3.castShadow = true;
		wall3.receiveShadow = true;
		scene.add(wall3);
		meshes.push(wall3);

		var wall4 = new THREE.Mesh(geometry3, material3);
		wall4.position.set(0, 4, 35);
		wall4.castShadow = true;
		wall4.receiveShadow = true;
		scene.add(wall4);
		meshes.push(wall4);

		var geometry4 = new THREE.CylinderGeometry(4, 4, 12, 8);
		var material4 = new THREE.MeshLambertMaterial({ color: 0x8a7a6a });
		for (var i = -6; i <= 6; i += 3) {
			var pillar = new THREE.Mesh(geometry4, material4);
			pillar.position.set(i * 6, 6, 0);
			pillar.castShadow = true;
			pillar.receiveShadow = true;
			scene.add(pillar);
			meshes.push(pillar);
		}
	}

	function buildTunnels() {
		var geometry = new THREE.CylinderGeometry(15, 15, 50, 8);
		var material = new THREE.MeshLambertMaterial({ color: 0x5a5a52 });
		var tunnel1 = new THREE.Mesh(geometry, material);
		tunnel1.position.set(-60, 15, -20);
		tunnel1.rotation.z = 1.57;
		tunnel1.castShadow = true;
		tunnel1.receiveShadow = true;
		scene.add(tunnel1);
		meshes.push(tunnel1);

		var tunnel2 = new THREE.Mesh(geometry, material);
		tunnel2.position.set(60, 15, 15);
		tunnel2.rotation.z = 1.57;
		tunnel2.castShadow = true;
		tunnel2.receiveShadow = true;
		scene.add(tunnel2);
		meshes.push(tunnel2);

		var geometry2 = new THREE.BoxGeometry(12, 20, 40);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x4a4a42 });
		var barracks1 = new THREE.Mesh(geometry2, material2);
		barracks1.position.set(-65, 10, -20);
		barracks1.castShadow = true;
		barracks1.receiveShadow = true;
		scene.add(barracks1);
		meshes.push(barracks1);

		var barracks2 = new THREE.Mesh(geometry2, material2);
		barracks2.position.set(65, 10, 15);
		barracks2.castShadow = true;
		barracks2.receiveShadow = true;
		scene.add(barracks2);
		meshes.push(barracks2);

		var geometry3 = new THREE.BoxGeometry(18, 16, 25);
		var material3 = new THREE.MeshLambertMaterial({ color: 0x5a5a52 });
		var armory = new THREE.Mesh(geometry3, material3);
		armory.position.set(-55, 8, 40);
		armory.castShadow = true;
		armory.receiveShadow = true;
		scene.add(armory);
		meshes.push(armory);

		var commandcenter = new THREE.Mesh(geometry3, material3);
		commandcenter.position.set(55, 8, -40);
		commandcenter.castShadow = true;
		commandcenter.receiveShadow = true;
		scene.add(commandcenter);
		meshes.push(commandcenter);
	}

	function buildLightsAndDetails() {
		var geometry = new THREE.ConeGeometry(3, 8, 6);
		var material = new THREE.MeshLambertMaterial({ color: 0x3a3a32 });
		var sentrylight = new THREE.Mesh(geometry, material);
		sentrylight.position.set(0, 45, 75);
		sentrylight.castShadow = true;
		sentrylight.receiveShadow = true;
		scene.add(sentrylight);
		meshes.push(sentrylight);
		animatedObjects.push({ mesh: sentrylight, type: 'rotate', time: 0 });

		var geometry2 = new THREE.SphereGeometry(8, 8, 8);
		var material2 = new THREE.MeshLambertMaterial({ color: 0x2a2a22 });
		for (var i = 0; i < 5; i++) {
			var rockdetail = new THREE.Mesh(geometry2, material2);
			rockdetail.position.set(-70 + i * 30, 5, 50 + Math.random() * 20);
			rockdetail.castShadow = true;
			rockdetail.receiveShadow = true;
			scene.add(rockdetail);
			meshes.push(rockdetail);
		}

		var ambientlight = new THREE.AmbientLight(0xffffff, 0.6);
		scene.add(ambientlight);
		lights.push(ambientlight);

		var directionallight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionallight.position.set(50, 60, 50);
		directionallight.castShadow = true;
		directionallight.shadow.mapSize.width = 2048;
		directionallight.shadow.mapSize.height = 2048;
		scene.add(directionallight);
		lights.push(directionallight);

		var sentrypointlight = new THREE.PointLight(0xffcc00, 1, 100);
		sentrypointlight.position.set(0, 48, 75);
		sentrypointlight.castShadow = true;
		scene.add(sentrypointlight);
		lights.push(sentrypointlight);

		var redwarninglight = new THREE.PointLight(0xff3300, 0.5, 80);
		redwarninglight.position.set(-65, 20, -20);
		scene.add(redwarninglight);
		lights.push(redwarninglight);

		var bluelight = new THREE.PointLight(0x0066ff, 0.4, 60);
		bluelight.position.set(65, 20, 15);
		scene.add(bluelight);
		lights.push(bluelight);

		var geometry3 = new THREE.BoxGeometry(2, 15, 2);
		var material3 = new THREE.MeshLambertMaterial({ color: 0x3a3a32 });
		for (var j = 0; j < 8; j++) {
			var rockpillar = new THREE.Mesh(geometry3, material3);
			rockpillar.position.set(-60 + j * 20, 7, -50);
			rockpillar.castShadow = true;
			rockpillar.receiveShadow = true;
			scene.add(rockpillar);
			meshes.push(rockpillar);
		}

		var geometry4 = new THREE.CylinderGeometry(6, 10, 30, 8);
		var material4 = new THREE.MeshLambertMaterial({ color: 0x4a4a42 });
		var watchtower = new THREE.Mesh(geometry4, material4);
		watchtower.position.set(-70, 15, 60);
		watchtower.castShadow = true;
		watchtower.receiveShadow = true;
		scene.add(watchtower);
		meshes.push(watchtower);

		var watchtower2 = new THREE.Mesh(geometry4, material4);
		watchtower2.position.set(70, 15, 60);
		watchtower2.castShadow = true;
		watchtower2.receiveShadow = true;
		scene.add(watchtower2);
		meshes.push(watchtower2);

		var geometry5 = new THREE.BoxGeometry(1, 1, 1);
		var material5 = new THREE.MeshLambertMaterial({ color: 0x5a5a52 });
		for (var k = 0; k < 12; k++) {
			var smallrock = new THREE.Mesh(geometry5, material5);
			smallrock.position.set(Math.random() * 100 - 50, 0.5, Math.random() * 100 - 50);
			smallrock.castShadow = true;
			smallrock.receiveShadow = true;
			scene.add(smallrock);
			meshes.push(smallrock);
		}
	}

	function update(delta) {
		for (var i = 0; i < animatedObjects.length; i++) {
			var obj = animatedObjects[i];
			obj.time += delta;

			if (obj.type === 'sway') {
				var swayoffset = Math.sin(obj.time * 2) * 0.08;
				obj.mesh.rotation.x = 0.1 + swayoffset + (i === 1 ? 0.02 : 0);
			}
			else if (obj.type === 'rotate') {
				obj.mesh.rotation.y += delta * 0.8;
			}
			else if (obj.type === 'drip') {
				var dripscale = Math.sin(obj.time * 3) * 0.05 + 1;
				if (dripscale < 0.8) dripscale = 0.8;
				obj.mesh.scale.y = dripscale;
			}
		}
	}

	function reset() {
		for (var i = 0; i < meshes.length; i++) {
			scene.remove(meshes[i]);
		}
		for (var j = 0; j < lights.length; j++) {
			scene.remove(lights[j]);
		}
		meshes = [];
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
