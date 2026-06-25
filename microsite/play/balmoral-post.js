window.BalmoralPost = (function() {
	'use strict';

	var scene = null;

	function buildMainCastle() {
		var geometry = new THREE.BoxGeometry(12, 8, 8);
		var material = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
		var castle = new THREE.Mesh(geometry, material);
		castle.position.set(560, 4, 610);
		castle.castShadow = true;
		castle.receiveShadow = true;
		scene.add(castle);
	}

	function buildRoundTower() {
		var cylinderGeometry = new THREE.CylinderGeometry(3, 3, 18, 16);
		var material = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
		var tower = new THREE.Mesh(cylinderGeometry, material);
		tower.position.set(570, 9, 620);
		tower.castShadow = true;
		tower.receiveShadow = true;
		scene.add(tower);

		var coneGeometry = new THREE.ConeGeometry(3, 6, 16);
		var roofMaterial = new THREE.MeshLambertMaterial({ color: 0xB0860B });
		var roof = new THREE.Mesh(coneGeometry, roofMaterial);
		roof.position.set(570, 24, 620);
		roof.castShadow = true;
		roof.receiveShadow = true;
		scene.add(roof);
	}

	function buildBattlements() {
		var i;
		for (i = 0; i < 8; i++) {
			var geometry = new THREE.BoxGeometry(1, 2, 1);
			var material = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });
			var battlement = new THREE.Mesh(geometry, material);
			battlement.position.set(552 + (i * 2), 9.5, 614);
			battlement.castShadow = true;
			battlement.receiveShadow = true;
			scene.add(battlement);
		}
	}

	function buildPineForest() {
		var i;
		var positions = [
			[540, 0, 580],
			[535, 0, 600],
			[538, 0, 625],
			[545, 0, 635],
			[555, 0, 640],
			[575, 0, 645],
			[590, 0, 630],
			[595, 0, 610],
			[590, 0, 580],
			[575, 0, 575]
		];

		for (i = 0; i < positions.length; i++) {
			var trunkGeometry = new THREE.CylinderGeometry(0.8, 1.2, 20, 12);
			var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
			var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
			trunk.position.set(positions[i][0], 10, positions[i][2]);
			trunk.castShadow = true;
			trunk.receiveShadow = true;
			scene.add(trunk);

			var crownGeometry = new THREE.ConeGeometry(4, 16, 16);
			var crownMaterial = new THREE.MeshLambertMaterial({ color: 0x1B4620 });
			var crown = new THREE.Mesh(crownGeometry, crownMaterial);
			crown.position.set(positions[i][0], 22, positions[i][2]);
			crown.castShadow = true;
			crown.receiveShadow = true;
			scene.add(crown);
		}
	}

	function buildFlagpole() {
		var poleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 25, 8);
		var poleMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
		var pole = new THREE.Mesh(poleGeometry, poleMaterial);
		pole.position.set(575, 18, 620);
		pole.castShadow = true;
		pole.receiveShadow = true;
		scene.add(pole);

		var flagGeometry = new THREE.BoxGeometry(3, 2, 0.5);
		var flagMaterial = new THREE.MeshLambertMaterial({ color: 0xCC0000 });
		var flag = new THREE.Mesh(flagGeometry, flagMaterial);
		flag.position.set(578, 20, 620);
		flag.castShadow = true;
		flag.receiveShadow = true;
		scene.add(flag);
	}

	function buildSecurityFence() {
		var i;
		var fenceStart = 530;
		var fenceEnd = 600;
		var fenceZ = 570;

		for (i = fenceStart; i <= fenceEnd; i += 5) {
			var postGeometry = new THREE.CylinderGeometry(0.2, 0.2, 3, 8);
			var postMaterial = new THREE.MeshLambertMaterial({ color: 0x404040 });
			var post = new THREE.Mesh(postGeometry, postMaterial);
			post.position.set(i, 1.5, fenceZ);
			post.castShadow = true;
			post.receiveShadow = true;
			scene.add(post);
		}

		var j;
		var segmentCount = (fenceEnd - fenceStart) / 5;
		for (j = 0; j < segmentCount; j++) {
			var x1 = fenceStart + (j * 5);
			var x2 = fenceStart + ((j + 1) * 5);
			var points = [
				new THREE.Vector3(x1, 3, fenceZ),
				new THREE.Vector3(x2, 3, fenceZ)
			];
			var lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
			var lineMaterial = new THREE.LineBasicMaterial({ color: 0x404040, linewidth: 2 });
			var line = new THREE.LineSegments(lineGeometry, lineMaterial);
			scene.add(line);
		}
	}

	function buildMissileBattery() {
		var launcherGeometry = new THREE.BoxGeometry(6, 2, 6);
		var launcherMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
		var launcher = new THREE.Mesh(launcherGeometry, launcherMaterial);
		launcher.position.set(555, 5, 595);
		launcher.castShadow = true;
		launcher.receiveShadow = true;
		scene.add(launcher);

		var positions = [
			[-1.5, 0, -1.5],
			[1.5, 0, -1.5],
			[-1.5, 0, 1.5],
			[1.5, 0, 1.5]
		];

		var i;
		for (i = 0; i < positions.length; i++) {
			var tubeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 12, 12);
			var tubeMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });
			var tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
			tube.position.set(555 + positions[i][0], 11 + positions[i][1], 595 + positions[i][2]);
			tube.rotation.z = 0.3;
			tube.castShadow = true;
			tube.receiveShadow = true;
			scene.add(tube);
		}
	}

	function buildCannonBattery() {
		var platform1Geometry = new THREE.BoxGeometry(4, 1, 4);
		var platformMaterial = new THREE.MeshLambertMaterial({ color: 0x505050 });
		var platform1 = new THREE.Mesh(platform1Geometry, platformMaterial);
		platform1.position.set(545, 4, 625);
		platform1.castShadow = true;
		platform1.receiveShadow = true;
		scene.add(platform1);

		var platform2Geometry = new THREE.BoxGeometry(4, 1, 4);
		var platform2 = new THREE.Mesh(platform2Geometry, platformMaterial);
		platform2.position.set(575, 4, 625);
		platform2.castShadow = true;
		platform2.receiveShadow = true;
		scene.add(platform2);

		var cannon1BarrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
		var cannonMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });
		var cannon1Barrel = new THREE.Mesh(cannon1BarrelGeometry, cannonMaterial);
		cannon1Barrel.position.set(545, 5, 625);
		cannon1Barrel.rotation.z = 0.4;
		cannon1Barrel.castShadow = true;
		cannon1Barrel.receiveShadow = true;
		scene.add(cannon1Barrel);

		var cannon2BarrelGeometry = new THREE.CylinderGeometry(0.5, 0.5, 8, 16);
		var cannon2Barrel = new THREE.Mesh(cannon2BarrelGeometry, cannonMaterial);
		cannon2Barrel.position.set(575, 5, 625);
		cannon2Barrel.rotation.z = 0.4;
		cannon2Barrel.castShadow = true;
		cannon2Barrel.receiveShadow = true;
		scene.add(cannon2Barrel);

		var breechGeometry = new THREE.SphereGeometry(1, 16, 16);
		var breechMaterial = new THREE.MeshLambertMaterial({ color: 0x303030 });
		var breech1 = new THREE.Mesh(breechGeometry, breechMaterial);
		breech1.position.set(545, 4, 625);
		breech1.castShadow = true;
		breech1.receiveShadow = true;
		scene.add(breech1);

		var breech2 = new THREE.Mesh(breechGeometry, breechMaterial);
		breech2.position.set(575, 4, 625);
		breech2.castShadow = true;
		breech2.receiveShadow = true;
		scene.add(breech2);
	}

	function initialize(sceneRef) {
		scene = sceneRef;
		buildMainCastle();
		buildRoundTower();
		buildBattlements();
		buildPineForest();
		buildFlagpole();
		buildSecurityFence();
		buildMissileBattery();
		buildCannonBattery();
	}

	return {
		initialize: initialize
	};
}());
