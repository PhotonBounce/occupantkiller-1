window.SligachanCamp = (function() {
	'use strict';

	var scene = null;
	var baseX = 1440;
	var baseZ = 1930;

	function initialize(threeScene) {
		scene = threeScene;
		buildHotel();
		buildBridge();
		buildCuillinBackdrop();
		buildJunctionCheckpoint();
		buildMinefield();
		buildMountaineeringHQ();
		buildRiverCrossing();
		buildCommunicationsRelay();
	}

	function buildHotel() {
		var materialStone = new THREE.MeshLambertMaterial({ color: 0xF5F0E8 });

		var mainBody = new THREE.BoxGeometry(12, 5, 6);
		var mainMesh = new THREE.Mesh(mainBody, materialStone);
		mainMesh.position.set(baseX, 2.5, baseZ);
		scene.add(mainMesh);

		var leftWing = new THREE.BoxGeometry(4, 5, 5);
		var leftMesh = new THREE.Mesh(leftWing, materialStone);
		leftMesh.position.set(baseX - 9, 2.5, baseZ + 3);
		scene.add(leftMesh);

		var rightWing = new THREE.BoxGeometry(4, 5, 5);
		var rightMesh = new THREE.Mesh(rightWing, materialStone);
		rightMesh.position.set(baseX + 9, 2.5, baseZ - 3);
		scene.add(rightMesh);

		var roofMain = new THREE.BoxGeometry(12, 1, 6);
		var roofMesh = new THREE.Mesh(roofMain, new THREE.MeshLambertMaterial({ color: 0x8B4513 }));
		roofMesh.position.set(baseX, 5.5, baseZ);
		scene.add(roofMesh);
	}

	function buildBridge() {
		var materialBridge = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var materialArch = new THREE.MeshLambertMaterial({ color: 0x505050 });

		var arch1 = new THREE.CylinderGeometry(2, 2, 1, 32);
		var archMesh1 = new THREE.Mesh(arch1, materialArch);
		archMesh1.position.set(baseX - 15, 3, baseZ - 20);
		archMesh1.rotation.z = Math.PI / 2;
		scene.add(archMesh1);

		var arch2 = new THREE.CylinderGeometry(2.5, 2.5, 1, 32);
		var archMesh2 = new THREE.Mesh(arch2, materialArch);
		archMesh2.position.set(baseX, 4, baseZ - 20);
		archMesh2.rotation.z = Math.PI / 2;
		scene.add(archMesh2);

		var arch3 = new THREE.CylinderGeometry(2, 2, 1, 32);
		var archMesh3 = new THREE.Mesh(arch3, materialArch);
		archMesh3.position.set(baseX + 15, 3, baseZ - 20);
		archMesh3.rotation.z = Math.PI / 2;
		scene.add(archMesh3);

		var deck = new THREE.BoxGeometry(35, 0.5, 3);
		var deckMesh = new THREE.Mesh(deck, materialBridge);
		deckMesh.position.set(baseX, 3.5, baseZ - 20);
		scene.add(deckMesh);

		var support1 = new THREE.BoxGeometry(1, 3, 1);
		var supportMesh1 = new THREE.Mesh(support1, materialBridge);
		supportMesh1.position.set(baseX - 15, 1.5, baseZ - 20);
		scene.add(supportMesh1);

		var support2 = new THREE.BoxGeometry(1, 4, 1);
		var supportMesh2 = new THREE.Mesh(support2, materialBridge);
		supportMesh2.position.set(baseX, 2, baseZ - 20);
		scene.add(supportMesh2);

		var support3 = new THREE.BoxGeometry(1, 3, 1);
		var supportMesh3 = new THREE.Mesh(support3, materialBridge);
		supportMesh3.position.set(baseX + 15, 1.5, baseZ - 20);
		scene.add(supportMesh3);
	}

	function buildCuillinBackdrop() {
		var materialDark = new THREE.MeshLambertMaterial({ color: 0x2A2A2A });

		var peak1 = new THREE.BoxGeometry(6, 45, 4);
		var peakMesh1 = new THREE.Mesh(peak1, materialDark);
		peakMesh1.position.set(baseX - 40, 22.5, baseZ + 100);
		scene.add(peakMesh1);

		var peak2 = new THREE.BoxGeometry(5, 52, 3);
		var peakMesh2 = new THREE.Mesh(peak2, materialDark);
		peakMesh2.position.set(baseX - 20, 26, baseZ + 110);
		scene.add(peakMesh2);

		var peak3 = new THREE.BoxGeometry(4, 48, 2);
		var peakMesh3 = new THREE.Mesh(peak3, materialDark);
		peakMesh3.position.set(baseX, 24, baseZ + 115);
		scene.add(peakMesh3);

		var peak4 = new THREE.BoxGeometry(5, 50, 3);
		var peakMesh4 = new THREE.Mesh(peak4, materialDark);
		peakMesh4.position.set(baseX + 20, 25, baseZ + 110);
		scene.add(peakMesh4);

		var peak5 = new THREE.BoxGeometry(6, 46, 4);
		var peakMesh5 = new THREE.Mesh(peak5, materialDark);
		peakMesh5.position.set(baseX + 40, 23, baseZ + 105);
		scene.add(peakMesh5);
	}

	function buildJunctionCheckpoint() {
		var materialMetal = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var materialRed = new THREE.MeshLambertMaterial({ color: 0xFF0000 });

		var barrier = new THREE.BoxGeometry(20, 2, 1);
		var barrierMesh = new THREE.Mesh(barrier, materialRed);
		barrierMesh.position.set(baseX + 30, 1, baseZ - 10);
		scene.add(barrierMesh);

		var guard1 = new THREE.BoxGeometry(2, 3, 2);
		var guardMesh1 = new THREE.Mesh(guard1, materialMetal);
		guardMesh1.position.set(baseX + 20, 1.5, baseZ - 5);
		scene.add(guardMesh1);

		var guard2 = new THREE.BoxGeometry(2, 3, 2);
		var guardMesh2 = new THREE.Mesh(guard2, materialMetal);
		guardMesh2.position.set(baseX + 40, 1.5, baseZ - 15);
		scene.add(guardMesh2);

		var roofGuard1 = new THREE.BoxGeometry(3, 0.5, 3);
		var roofMesh1 = new THREE.Mesh(roofGuard1, new THREE.MeshLambertMaterial({ color: 0x333333 }));
		roofMesh1.position.set(baseX + 20, 3.5, baseZ - 5);
		scene.add(roofMesh1);

		var roofGuard2 = new THREE.BoxGeometry(3, 0.5, 3);
		var roofMesh2 = new THREE.Mesh(roofGuard2, new THREE.MeshLambertMaterial({ color: 0x333333 }));
		roofMesh2.position.set(baseX + 40, 3.5, baseZ - 15);
		scene.add(roofMesh2);
	}

	function buildMinefield() {
		var materialStake = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

		var positions = [
			[baseX - 30, baseZ + 30],
			[baseX - 15, baseZ + 35],
			[baseX, baseZ + 40],
			[baseX + 15, baseZ + 35],
			[baseX + 30, baseZ + 30],
			[baseX - 25, baseZ + 50],
			[baseX, baseZ + 55],
			[baseX + 25, baseZ + 50],
			[baseX - 20, baseZ + 70],
			[baseX + 20, baseZ + 70]
		];

		var i = 0;
		while (i < positions.length) {
			var stake = new THREE.ConeGeometry(0.5, 1.5, 8);
			var stakeMesh = new THREE.Mesh(stake, materialStake);
			stakeMesh.position.set(positions[i][0], 0.75, positions[i][1]);
			scene.add(stakeMesh);
			i = i + 1;
		}
	}

	function buildMountaineeringHQ() {
		var materialOps = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var materialTent = new THREE.MeshLambertMaterial({ color: 0xDEB887 });

		var opsCenter = new THREE.BoxGeometry(5, 4, 4);
		var opsMesh = new THREE.Mesh(opsCenter, materialOps);
		opsMesh.position.set(baseX - 35, 2, baseZ + 20);
		scene.add(opsMesh);

		var roofOps = new THREE.BoxGeometry(5, 1, 4);
		var roofOpsMesh = new THREE.Mesh(roofOps, new THREE.MeshLambertMaterial({ color: 0x556B2F }));
		roofOpsMesh.position.set(baseX - 35, 4.5, baseZ + 20);
		scene.add(roofOpsMesh);

		var tentPositions = [
			[baseX - 25, baseZ + 15],
			[baseX - 15, baseZ + 15],
			[baseX - 5, baseZ + 15],
			[baseX - 25, baseZ + 30],
			[baseX - 15, baseZ + 30],
			[baseX - 5, baseZ + 30]
		];

		var j = 0;
		while (j < tentPositions.length) {
			var tent = new THREE.BoxGeometry(3, 2.5, 3);
			var tentMesh = new THREE.Mesh(tent, materialTent);
			tentMesh.position.set(tentPositions[j][0], 1.25, tentPositions[j][1]);
			scene.add(tentMesh);
			j = j + 1;
		}
	}

	function buildRiverCrossing() {
		var materialWater = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
		var materialWarn = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });

		var barrier = new THREE.BoxGeometry(15, 0.8, 2);
		var barrierMesh = new THREE.Mesh(barrier, materialWater);
		barrierMesh.position.set(baseX - 50, -0.5, baseZ - 5);
		scene.add(barrierMesh);

		var post1 = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
		var postMesh1 = new THREE.Mesh(post1, materialWarn);
		postMesh1.position.set(baseX - 60, 1.5, baseZ - 5);
		scene.add(postMesh1);

		var post2 = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
		var postMesh2 = new THREE.Mesh(post2, materialWarn);
		postMesh2.position.set(baseX - 40, 1.5, baseZ - 5);
		scene.add(postMesh2);

		var post3 = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
		var postMesh3 = new THREE.Mesh(post3, materialWarn);
		postMesh3.position.set(baseX - 50, 1.5, baseZ - 15);
		scene.add(postMesh3);

		var post4 = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
		var postMesh4 = new THREE.Mesh(post4, materialWarn);
		postMesh4.position.set(baseX - 50, 1.5, baseZ + 5);
		scene.add(postMesh4);
	}

	function buildCommunicationsRelay() {
		var materialMountain = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var materialMast = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });

		var mountain = new THREE.BoxGeometry(15, 8, 15);
		var mountainMesh = new THREE.Mesh(mountain, materialMountain);
		mountainMesh.position.set(baseX - 60, 4, baseZ + 80);
		scene.add(mountainMesh);

		var mast = new THREE.CylinderGeometry(0.3, 0.3, 20, 16);
		var mastMesh = new THREE.Mesh(mast, materialMast);
		mastMesh.position.set(baseX - 60, 18, baseZ + 80);
		scene.add(mastMesh);

		var dish = new THREE.SphereGeometry(1, 16, 16);
		var dishMesh = new THREE.Mesh(dish, new THREE.MeshLambertMaterial({ color: 0xA9A9A9 }));
		dishMesh.position.set(baseX - 60, 22, baseZ + 80);
		scene.add(dishMesh);

		var antenna = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
		var antennaMesh = new THREE.Mesh(antenna, materialMast);
		antennaMesh.position.set(baseX - 60, 24.5, baseZ + 80);
		scene.add(antennaMesh);
	}

	return {
		initialize: initialize
	};
}());
