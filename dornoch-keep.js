var DornochKeep = (function() {
	'use strict';

	var structures = [];
	var baseX = 860;
	var baseZ = 1060;

	function createDornochCathedral() {
		var group = new THREE.Group();
		var sandstone = 0xD2B48C;

		var naveGeom = new THREE.BoxGeometry(12, 5, 6);
		var naveMat = new THREE.MeshLambertMaterial({ color: sandstone });
		var nave = new THREE.Mesh(naveGeom, naveMat);
		nave.position.set(baseX, 2.5, baseZ);
		group.add(nave);

		var towerGeom = new THREE.CylinderGeometry(2, 2.5, 8, 32);
		var towerMat = new THREE.MeshLambertMaterial({ color: sandstone });
		var tower = new THREE.Mesh(towerGeom, towerMat);
		tower.position.set(baseX, 4, baseZ);
		group.add(tower);

		return group;
	}

	function createBishopsPalace() {
		var group = new THREE.Group();
		var stoneGray = 0x808080;

		var palaceGeom = new THREE.BoxGeometry(6, 5, 5);
		var palaceMat = new THREE.MeshLambertMaterial({ color: stoneGray });
		var palace = new THREE.Mesh(palaceGeom, palaceMat);
		palace.position.set(baseX - 10, 2.5, baseZ + 8);
		group.add(palace);

		var towerGeom = new THREE.CylinderGeometry(1.5, 1.5, 7, 32);
		var towerMat = new THREE.MeshLambertMaterial({ color: stoneGray });
		var cornerTower = new THREE.Mesh(towerGeom, towerMat);
		cornerTower.position.set(baseX - 12, 3.5, baseZ + 10);
		group.add(cornerTower);

		return group;
	}

	function createCathedralTowerMachineGun() {
		var group = new THREE.Group();
		var sandstone = 0xD2B48C;
		var darkIron = 0x2F2F2F;

		var towerGeom = new THREE.CylinderGeometry(1.8, 2, 12, 32);
		var towerMat = new THREE.MeshLambertMaterial({ color: sandstone });
		var tower = new THREE.Mesh(towerGeom, towerMat);
		tower.position.set(baseX + 8, 6, baseZ);
		group.add(tower);

		var battlementGeom = new THREE.BoxGeometry(5, 1.2, 5);
		var battlementMat = new THREE.MeshLambertMaterial({ color: sandstone });
		var battlement = new THREE.Mesh(battlementGeom, battlementMat);
		battlement.position.set(baseX + 8, 12.6, baseZ);
		group.add(battlement);

		var gunGeom = new THREE.CylinderGeometry(0.4, 0.4, 3, 16);
		var gunMat = new THREE.MeshLambertMaterial({ color: darkIron });
		var gun = new THREE.Mesh(gunGeom, gunMat);
		gun.rotation.z = Math.PI / 6;
		gun.position.set(baseX + 8, 13.5, baseZ);
		group.add(gun);

		return group;
	}

	function createGolfCourseDunes() {
		var group = new THREE.Group();
		var sandBeige = 0xF4A460;

		var positions = [
			[baseX - 20, 1, baseZ - 15],
			[baseX + 15, 1.2, baseZ - 18],
			[baseX + 5, 0.9, baseZ + 20],
			[baseX - 15, 1.1, baseZ + 15],
			[baseX + 20, 1, baseZ + 5]
		];

		for (var i = 0; i < positions.length; i++) {
			var bunkerGeom = new THREE.BoxGeometry(4, 1.5, 4);
			var bunkerMat = new THREE.MeshLambertMaterial({ color: sandBeige });
			var bunker = new THREE.Mesh(bunkerGeom, bunkerMat);
			bunker.position.set(positions[i][0], positions[i][1], positions[i][2]);
			group.add(bunker);
		}

		return group;
	}

	function createWitchTrialMemorial() {
		var group = new THREE.Group();
		var darkWood = 0x3D3D3D;

		var stakeGeom = new THREE.CylinderGeometry(0.3, 0.3, 5, 16);
		var stakeMat = new THREE.MeshLambertMaterial({ color: darkWood });
		var stake = new THREE.Mesh(stakeGeom, stakeMat);
		stake.position.set(baseX - 25, 2.5, baseZ - 20);
		group.add(stake);

		var baseGeom = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 32);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x4A4A4A });
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.position.set(baseX - 25, 0.15, baseZ - 20);
		group.add(base);

		return group;
	}

	function createFirthCoastalArtillery() {
		var group = new THREE.Group();
		var darkIron = 0x2F2F2F;
		var concrete = 0xA9A9A9;

		var gun1Geom = new THREE.CylinderGeometry(0.6, 0.8, 4, 16);
		var gunMat = new THREE.MeshLambertMaterial({ color: darkIron });
		var gun1 = new THREE.Mesh(gun1Geom, gunMat);
		gun1.rotation.z = Math.PI / 8;
		gun1.position.set(baseX + 25, 2, baseZ + 25);
		group.add(gun1);

		var gun2Geom = new THREE.CylinderGeometry(0.6, 0.8, 4, 16);
		var gun2 = new THREE.Mesh(gun2Geom, gunMat);
		gun2.rotation.z = -Math.PI / 8;
		gun2.position.set(baseX + 28, 2, baseZ + 28);
		group.add(gun2);

		var emplacementGeom = new THREE.BoxGeometry(6, 1, 6);
		var emplacementMat = new THREE.MeshLambertMaterial({ color: concrete });
		var emplacement = new THREE.Mesh(emplacementGeom, emplacementMat);
		emplacement.position.set(baseX + 26.5, 0.5, baseZ + 26.5);
		group.add(emplacement);

		var shieldGeom = new THREE.BoxGeometry(7, 2, 0.5);
		var shieldMat = new THREE.MeshLambertMaterial({ color: darkIron });
		var shield = new THREE.Mesh(shieldGeom, shieldMat);
		shield.position.set(baseX + 26.5, 1, baseZ + 22);
		group.add(shield);

		return group;
	}

	function createTownSquareBarricade() {
		var group = new THREE.Group();
		var darkWood = 0x5C4033;

		var positions = [
			[baseX - 18, 1.5, baseZ - 12],
			[baseX + 18, 1.5, baseZ - 12],
			[baseX - 18, 1.5, baseZ + 12],
			[baseX + 18, 1.5, baseZ + 12]
		];

		for (var i = 0; i < positions.length; i++) {
			var wallGeom = new THREE.BoxGeometry(3, 2, 0.4);
			var wallMat = new THREE.MeshLambertMaterial({ color: darkWood });
			var wall = new THREE.Mesh(wallGeom, wallMat);
			wall.position.set(positions[i][0], positions[i][1], positions[i][2]);
			group.add(wall);
		}

		return group;
	}

	function createBeachLandingDefenceWire() {
		var group = new THREE.Group();
		var wireColor = 0x333333;

		var wirePoints = [
			new THREE.Vector3(baseX - 30, 0.2, baseZ + 35),
			new THREE.Vector3(baseX + 35, 0.2, baseZ - 30),
			new THREE.Vector3(baseX + 30, 0.2, baseZ + 40),
			new THREE.Vector3(baseX - 35, 0.2, baseZ - 25)
		];

		var wireGeom = new THREE.BufferGeometry().setFromPoints(wirePoints);
		var wireMat = new THREE.LineBasicMaterial({ color: wireColor, linewidth: 2 });
		var wireLines = new THREE.LineSegments(wireGeom, wireMat);
		group.add(wireLines);

		return group;
	}

	function build() {
		structures = [];

		structures.push(createDornochCathedral());
		structures.push(createBishopsPalace());
		structures.push(createCathedralTowerMachineGun());
		structures.push(createGolfCourseDunes());
		structures.push(createWitchTrialMemorial());
		structures.push(createFirthCoastalArtillery());
		structures.push(createTownSquareBarricade());
		structures.push(createBeachLandingDefenceWire());

		return structures;
	}

	function getStructures() {
		return structures;
	}

	function getBasePosition() {
		return {
			x: baseX,
			z: baseZ
		};
	}

	return {
		build: build,
		getStructures: getStructures,
		getBasePosition: getBasePosition
	};
}());
