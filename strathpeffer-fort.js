window.StrathpefferFort = (function() {
	'use strict';

	var scene = null;
	var worldX = 780;
	var worldZ = 940;

	function init(threeScene) {
		scene = threeScene;
		buildStructures();
	}

	function buildStructures() {
		buildGrandSpaaPavilion();
		buildMineralSpringPumpHouse();
		buildVictorianHotelCompound();
		buildEagleStoneReplica();
		buildPOWCompound();
		buildIntelligenceInterrogationBlock();
		buildGuardBarracks();
		buildValleyEntranceCheckpoint();
	}

	function buildGrandSpaaPavilion() {
		var material = new THREE.MeshLambertMaterial({ color: 0xF5F5DC });

		var mainBody = new THREE.Mesh(
			new THREE.BoxGeometry(10, 5, 6),
			material
		);
		mainBody.position.set(worldX, 2.5, worldZ);
		scene.add(mainBody);

		var columnPositions = [
			[-4, 0, -2.5],
			[-4, 0, 2.5],
			[4, 0, -2.5],
			[4, 0, 2.5],
			[-2, 0, -3],
			[2, 0, -3],
			[-2, 0, 3],
			[2, 0, 3]
		];

		var columnMaterial = new THREE.MeshLambertMaterial({ color: 0xFAF0E6 });
		var i = 0;
		var len = columnPositions.length;
		while (i < len) {
			var pos = columnPositions[i];
			var column = new THREE.Mesh(
				new THREE.CylinderGeometry(0.4, 0.4, 5, 12),
				columnMaterial
			);
			column.position.set(worldX + pos[0], 2.5, worldZ + pos[2]);
			scene.add(column);
			i = i + 1;
		}
	}

	function buildMineralSpringPumpHouse() {
		var material = new THREE.MeshLambertMaterial({ color: 0xA0826D });

		var mainBuilding = new THREE.Mesh(
			new THREE.BoxGeometry(6, 3, 4),
			material
		);
		mainBuilding.position.set(worldX - 15, 1.5, worldZ + 12);
		scene.add(mainBuilding);

		var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var chimney = new THREE.Mesh(
			new THREE.CylinderGeometry(0.5, 0.6, 4, 8),
			chimneyMaterial
		);
		chimney.position.set(worldX - 12, 4, worldZ + 12);
		scene.add(chimney);
	}

	function buildVictorianHotelCompound() {
		var material = new THREE.MeshLambertMaterial({ color: 0x808080 });

		var hotelBlock1 = new THREE.Mesh(
			new THREE.BoxGeometry(8, 4, 6),
			material
		);
		hotelBlock1.position.set(worldX + 20, 2, worldZ - 15);
		scene.add(hotelBlock1);

		var hotelBlock2 = new THREE.Mesh(
			new THREE.BoxGeometry(7, 3.5, 5),
			material
		);
		hotelBlock2.position.set(worldX + 30, 1.75, worldZ - 8);
		scene.add(hotelBlock2);

		var hotelBlock3 = new THREE.Mesh(
			new THREE.BoxGeometry(6, 3, 5),
			material
		);
		hotelBlock3.position.set(worldX + 25, 1.5, worldZ - 2);
		scene.add(hotelBlock3);
	}

	function buildEagleStoneReplica() {
		var postMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var post = new THREE.Mesh(
			new THREE.CylinderGeometry(0.6, 0.8, 3, 8),
			postMaterial
		);
		post.position.set(worldX - 30, 1.5, worldZ + 25);
		scene.add(post);

		var stoneMaterial = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
		var stoneTab = new THREE.Mesh(
			new THREE.BoxGeometry(2, 3, 0.3),
			stoneMaterial
		);
		stoneTab.position.set(worldX - 30, 3, worldZ + 25);
		scene.add(stoneTab);
	}

	function buildPOWCompound() {
		var fenceHeight = 3;
		var compoundX = worldX + 50;
		var compoundZ = worldZ - 30;
		var compoundWidth = 25;
		var compoundDepth = 20;

		var fenceLineMaterial = new THREE.LineBasicMaterial({ color: 0x808080, linewidth: 2 });

		var fencePoints = [];
		fencePoints[0] = new THREE.Vector3(compoundX - compoundWidth / 2, fenceHeight, compoundZ - compoundDepth / 2);
		fencePoints[1] = new THREE.Vector3(compoundX + compoundWidth / 2, fenceHeight, compoundZ - compoundDepth / 2);
		fencePoints[2] = new THREE.Vector3(compoundX + compoundWidth / 2, fenceHeight, compoundZ + compoundDepth / 2);
		fencePoints[3] = new THREE.Vector3(compoundX - compoundWidth / 2, fenceHeight, compoundZ + compoundDepth / 2);
		fencePoints[4] = new THREE.Vector3(compoundX - compoundWidth / 2, fenceHeight, compoundZ - compoundDepth / 2);

		var fenceGeometry = new THREE.BufferGeometry().setFromPoints(fencePoints);
		var fence = new THREE.LineSegments(fenceGeometry, fenceLineMaterial);
		scene.add(fence);

		var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var towerPositions = [
			[compoundX - compoundWidth / 2, compoundZ - compoundDepth / 2],
			[compoundX + compoundWidth / 2, compoundZ - compoundDepth / 2],
			[compoundX + compoundWidth / 2, compoundZ + compoundDepth / 2],
			[compoundX - compoundWidth / 2, compoundZ + compoundDepth / 2]
		];

		var j = 0;
		var towerLen = towerPositions.length;
		while (j < towerLen) {
			var towerPos = towerPositions[j];
			var tower = new THREE.Mesh(
				new THREE.CylinderGeometry(1.2, 1.5, 5, 8),
				towerMaterial
			);
			tower.position.set(towerPos[0], 2.5, towerPos[1]);
			scene.add(tower);
			j = j + 1;
		}
	}

	function buildIntelligenceInterrogationBlock() {
		var material = new THREE.MeshLambertMaterial({ color: 0x404040 });

		var interrogationBlock = new THREE.Mesh(
			new THREE.BoxGeometry(4, 3, 3),
			material
		);
		interrogationBlock.position.set(worldX - 25, 1.5, worldZ - 40);
		scene.add(interrogationBlock);
	}

	function buildGuardBarracks() {
		var material = new THREE.MeshLambertMaterial({ color: 0x556B2F });

		var barracksBlock1 = new THREE.Mesh(
			new THREE.BoxGeometry(8, 3, 4),
			material
		);
		barracksBlock1.position.set(worldX + 45, 1.5, worldZ + 10);
		scene.add(barracksBlock1);

		var barracksBlock2 = new THREE.Mesh(
			new THREE.BoxGeometry(7, 3, 4),
			material
		);
		barracksBlock2.position.set(worldX + 35, 1.5, worldZ + 5);
		scene.add(barracksBlock2);

		var barracksBlock3 = new THREE.Mesh(
			new THREE.BoxGeometry(6, 3, 4),
			material
		);
		barracksBlock3.position.set(worldX + 40, 1.5, worldZ - 5);
		scene.add(barracksBlock3);
	}

	function buildValleyEntranceCheckpoint() {
		var material = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });

		var barrierLeft = new THREE.Mesh(
			new THREE.BoxGeometry(2, 2.5, 1),
			material
		);
		barrierLeft.position.set(worldX - 35, 1.25, worldZ - 50);
		scene.add(barrierLeft);

		var barrierRight = new THREE.Mesh(
			new THREE.BoxGeometry(2, 2.5, 1),
			material
		);
		barrierRight.position.set(worldX + 35, 1.25, worldZ - 50);
		scene.add(barrierRight);

		var barrierCross = new THREE.Mesh(
			new THREE.BoxGeometry(60, 0.5, 3),
			material
		);
		barrierCross.position.set(worldX, 2.5, worldZ - 50);
		scene.add(barrierCross);
	}

	return {
		init: init
	};

}());
