window.InvernessKeep = (function() {
	'use strict';

	var structures = [];
	var scene = null;
	var worldX = 720;
	var worldZ = 850;

	function build() {
		var group = new THREE.Group();
		group.position.set(worldX, 0, worldZ);

		var castleKeep = castle();
		group.add(castleKeep);

		var towers = twins();
		group.add(towers);

		var bridge = river();
		group.add(bridge);

		var townBlock = victorian();
		group.add(townBlock);

		var checkpoint = glen();
		group.add(checkpoint);

		var hq = military();
		group.add(hq);

		var battery = floating();
		group.add(battery);

		var wall = perimeter();
		group.add(wall);

		structures.push(group);
		return group;
	}

	function castle() {
		var keep = new THREE.Group();

		var cliffGeom = new THREE.BoxGeometry(12, 6, 10);
		var sandstone = new THREE.MeshLambertMaterial({ color: 0xB5651D });
		var cliffMesh = new THREE.Mesh(cliffGeom, sandstone);
		cliffMesh.position.set(0, 3, 0);
		keep.add(cliffMesh);

		var keepGeom = new THREE.BoxGeometry(10, 8, 8);
		var keepMesh = new THREE.Mesh(keepGeom, sandstone);
		keepMesh.position.set(0, 11, 0);
		keep.add(keepMesh);

		var crenelGeom = new THREE.BoxGeometry(0.8, 1.2, 10);
		var crenelMat = new THREE.MeshLambertMaterial({ color: 0xA0522D });
		var crenels = [
			new THREE.Mesh(crenelGeom, crenelMat),
			new THREE.Mesh(crenelGeom, crenelMat),
			new THREE.Mesh(crenelGeom, crenelMat),
			new THREE.Mesh(crenelGeom, crenelMat)
		];
		crenels[0].position.set(-4, 15.5, 0);
		crenels[1].position.set(4, 15.5, 0);
		crenels[2].position.set(0, 15.5, -4);
		crenels[3].position.set(0, 15.5, 4);
		var i;
		for (i = 0; i < 4; i++) {
			keep.add(crenels[i]);
		}

		return keep;
	}

	function twins() {
		var group = new THREE.Group();
		var sandstone = new THREE.MeshLambertMaterial({ color: 0xB5651D });

		var towerGeom = new THREE.CylinderGeometry(2, 2.2, 12, 8);
		var tower1 = new THREE.Mesh(towerGeom, sandstone);
		tower1.position.set(-8, 6, 0);
		group.add(tower1);

		var tower2 = new THREE.Mesh(towerGeom, sandstone);
		tower2.position.set(8, 6, 0);
		group.add(tower2);

		var capGeom = new THREE.ConeGeometry(2.3, 2, 8);
		var capMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var cap1 = new THREE.Mesh(capGeom, capMat);
		cap1.position.set(-8, 13, 0);
		group.add(cap1);

		var cap2 = new THREE.Mesh(capGeom, capMat);
		cap2.position.set(8, 13, 0);
		group.add(cap2);

		return group;
	}

	function river() {
		var group = new THREE.Group();
		var sandstone = new THREE.MeshLambertMaterial({ color: 0xB5651D });
		var gray = new THREE.MeshLambertMaterial({ color: 0x808080 });

		var bridgeGeom = new THREE.BoxGeometry(14, 1.5, 4);
		var bridge = new THREE.Mesh(bridgeGeom, sandstone);
		bridge.position.set(-20, 2, -15);
		group.add(bridge);

		var postGeom = new THREE.BoxGeometry(1.5, 5, 1.5);
		var post1 = new THREE.Mesh(postGeom, gray);
		post1.position.set(-27, 2.5, -15);
		group.add(post1);

		var post2 = new THREE.Mesh(postGeom, gray);
		post2.position.set(-13, 2.5, -15);
		group.add(post2);

		var post3 = new THREE.Mesh(postGeom, gray);
		post3.position.set(-27, 2.5, -13);
		group.add(post3);

		var post4 = new THREE.Mesh(postGeom, gray);
		post4.position.set(-13, 2.5, -13);
		group.add(post4);

		return group;
	}

	function victorian() {
		var group = new THREE.Group();
		var sandstone = new THREE.MeshLambertMaterial({ color: 0xB5651D });

		var bldgGeom = new THREE.BoxGeometry(5, 6, 5);
		var bldg1 = new THREE.Mesh(bldgGeom, sandstone);
		bldg1.position.set(12, 3, 8);
		group.add(bldg1);

		var bldg2 = new THREE.Mesh(bldgGeom, sandstone);
		bldg2.position.set(12, 3, -2);
		group.add(bldg2);

		var bldg3 = new THREE.Mesh(bldgGeom, sandstone);
		bldg3.position.set(22, 3, 8);
		group.add(bldg3);

		var bldg4 = new THREE.Mesh(bldgGeom, sandstone);
		bldg4.position.set(22, 3, -2);
		group.add(bldg4);

		return group;
	}

	function glen() {
		var group = new THREE.Group();
		var gray = new THREE.MeshLambertMaterial({ color: 0x808080 });
		var steel = new THREE.MeshLambertMaterial({ color: 0x606060 });

		var barrierGeom = new THREE.BoxGeometry(18, 2.5, 1.5);
		var barrier = new THREE.Mesh(barrierGeom, gray);
		barrier.position.set(-15, 1.25, 20);
		group.add(barrier);

		var postGeom = new THREE.BoxGeometry(2, 4, 2);
		var post1 = new THREE.Mesh(postGeom, steel);
		post1.position.set(-24, 2, 20);
		group.add(post1);

		var post2 = new THREE.Mesh(postGeom, steel);
		post2.position.set(-6, 2, 20);
		group.add(post2);

		var guardGeom = new THREE.BoxGeometry(4, 3, 4);
		var guard = new THREE.Mesh(guardGeom, gray);
		guard.position.set(-15, 1.5, 26);
		group.add(guard);

		return group;
	}

	function military() {
		var group = new THREE.Group();
		var gray = new THREE.MeshLambertMaterial({ color: 0x707070 });

		var hqGeom = new THREE.BoxGeometry(8, 5, 6);
		var hq = new THREE.Mesh(hqGeom, gray);
		hq.position.set(25, 2.5, 15);
		group.add(hq);

		var roofGeom = new THREE.BoxGeometry(8.2, 0.5, 6.2);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x505050 });
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.set(25, 5.3, 15);
		group.add(roof);

		return group;
	}

	function floating() {
		var group = new THREE.Group();
		var wood = new THREE.MeshLambertMaterial({ color: 0x8B7355 });
		var steel = new THREE.MeshLambertMaterial({ color: 0x404040 });

		var bargeGeom = new THREE.BoxGeometry(12, 2, 6);
		var barge = new THREE.Mesh(bargeGeom, wood);
		barge.position.set(-35, 4, -25);
		group.add(barge);

		var gunGeom = new THREE.CylinderGeometry(0.8, 0.8, 8, 12);
		var gun1 = new THREE.Mesh(gunGeom, steel);
		gun1.rotation.z = Math.PI / 6;
		gun1.position.set(-39, 6, -25);
		group.add(gun1);

		var gun2 = new THREE.Mesh(gunGeom, steel);
		gun2.rotation.z = Math.PI / 6;
		gun2.position.set(-31, 6, -25);
		group.add(gun2);

		var breechGeom = new THREE.SphereGeometry(1.2, 8, 8);
		var breechMat = new THREE.MeshLambertMaterial({ color: 0x303030 });
		var breech1 = new THREE.Mesh(breechGeom, breechMat);
		breech1.position.set(-39, 5, -25);
		group.add(breech1);

		var breech2 = new THREE.Mesh(breechGeom, breechMat);
		breech2.position.set(-31, 5, -25);
		group.add(breech2);

		return group;
	}

	function perimeter() {
		var group = new THREE.Group();

		var lineMat = new THREE.LineBasicMaterial({ color: 0x404040, linewidth: 3 });
		var points = [
			new THREE.Vector3(-50, 0, 35),
			new THREE.Vector3(50, 0, 35),
			new THREE.Vector3(50, 0, -40),
			new THREE.Vector3(-50, 0, -40),
			new THREE.Vector3(-50, 0, 35)
		];
		var geom = new THREE.BufferGeometry().setFromPoints(points);
		var line = new THREE.LineSegments(geom, lineMat);
		group.add(line);

		var blockGeom = new THREE.BoxGeometry(3, 2.5, 1);
		var blockMat = new THREE.MeshLambertMaterial({ color: 0x606060 });

		var positions = [
			[-48, 1.25, 35],
			[-40, 1.25, 35],
			[-32, 1.25, 35],
			[-24, 1.25, 35],
			[48, 1.25, 35],
			[40, 1.25, 35],
			[32, 1.25, 35],
			[48, 1.25, -40],
			[40, 1.25, -40],
			[32, 1.25, -40],
			[-48, 1.25, -40],
			[-40, 1.25, -40]
		];

		var j;
		for (j = 0; j < positions.length; j++) {
			var block = new THREE.Mesh(blockGeom, blockMat);
			block.position.set(positions[j][0], positions[j][1], positions[j][2]);
			group.add(block);
		}

		return group;
	}

	function mount(s) {
		scene = s;
		var group = build();
		scene.add(group);
		return group;
	}

	function light(s) {
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
		s.add(ambientLight);

		var directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
		directionalLight.position.set(100, 80, 100);
		directionalLight.castShadow = true;
		s.add(directionalLight);

		var hemisphereLight = new THREE.HemisphereLight(0x87CEEB, 0x8B7355, 0.5);
		s.add(hemisphereLight);
	}

	function get(index) {
		if (index >= 0 && index < structures.length) {
			return structures[index];
		}
		return null;
	}

	function count() {
		return structures.length;
	}

	function clear() {
		var k;
		for (k = 0; k < structures.length; k++) {
			scene.remove(structures[k]);
		}
		structures = [];
	}

	return {
		mount: mount,
		light: light,
		get: get,
		count: count,
		clear: clear,
		worldX: worldX,
		worldZ: worldZ
	};
}());
