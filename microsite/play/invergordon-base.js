window.InvergordonBase = (function() {
	'use strict';

	var structures = [];
	var worldOffsetX = 820;
	var worldOffsetZ = 1000;

	function createQuay() {
		var geometry = new THREE.BoxGeometry(40, 2, 8);
		var material = new THREE.MeshLambertMaterial({ color: 0x808080 });
		var quay = new THREE.Mesh(geometry, material);
		quay.position.set(worldOffsetX, 0, worldOffsetZ);
		quay.castShadow = true;
		quay.receiveShadow = true;
		return quay;
	}

	function createDistillery() {
		var group = new THREE.Group();

		var warehouse1Geo = new THREE.BoxGeometry(20, 12, 15);
		var warehouseMat = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
		var warehouse1 = new THREE.Mesh(warehouse1Geo, warehouseMat);
		warehouse1.position.set(-15, 6, 0);
		warehouse1.castShadow = true;
		warehouse1.receiveShadow = true;
		group.add(warehouse1);

		var warehouse2Geo = new THREE.BoxGeometry(20, 12, 15);
		var warehouse2 = new THREE.Mesh(warehouse2Geo, warehouseMat);
		warehouse2.position.set(15, 6, 0);
		warehouse2.castShadow = true;
		warehouse2.receiveShadow = true;
		group.add(warehouse2);

		var stillPositions = [
			[-10, 14, -8],
			[-10, 14, 8],
			[10, 14, -8],
			[10, 14, 8]
		];

		for (var i = 0; i < stillPositions.length; i++) {
			var stillGeo = new THREE.CylinderGeometry(2, 2, 8, 16);
			var stillMat = new THREE.MeshLambertMaterial({ color: 0xC0C0C0 });
			var still = new THREE.Mesh(stillGeo, stillMat);
			still.position.set(stillPositions[i][0], stillPositions[i][1], stillPositions[i][2]);
			still.castShadow = true;
			still.receiveShadow = true;
			group.add(still);
		}

		group.position.set(worldOffsetX - 30, 0, worldOffsetZ + 25);
		return group;
	}

	function createOilRig() {
		var group = new THREE.Group();

		var platformGeo = new THREE.BoxGeometry(25, 3, 20);
		var platformMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
		var platform = new THREE.Mesh(platformGeo, platformMat);
		platform.position.set(0, 1.5, 0);
		platform.castShadow = true;
		platform.receiveShadow = true;
		group.add(platform);

		var craneBaseGeo = new THREE.CylinderGeometry(1.5, 2, 4, 12);
		var craneMat = new THREE.MeshLambertMaterial({ color: 0xFFFF00 });
		var craneBase = new THREE.Mesh(craneBaseGeo, craneMat);
		craneBase.position.set(8, 5, 0);
		craneBase.castShadow = true;
		craneBase.receiveShadow = true;
		group.add(craneBase);

		var craneBoomGeo = new THREE.BoxGeometry(18, 0.8, 0.8);
		var craneBoom = new THREE.Mesh(craneBoomGeo, craneMat);
		craneBoom.position.set(8, 9, 0);
		craneBoom.castShadow = true;
		craneBoom.receiveShadow = true;
		group.add(craneBoom);

		group.position.set(worldOffsetX + 50, 0, worldOffsetZ - 40);
		return group;
	}

	function createCruiseTerminal() {
		var geometry = new THREE.BoxGeometry(10, 5, 4);
		var material = new THREE.MeshLambertMaterial({ color: 0x6688AA });
		var terminal = new THREE.Mesh(geometry, material);
		terminal.position.set(worldOffsetX - 25, 2.5, worldOffsetZ - 35);
		terminal.castShadow = true;
		terminal.receiveShadow = true;
		return terminal;
	}

	function createNavalGun() {
		var group = new THREE.Group();

		var mountGeo = new THREE.BoxGeometry(4, 2, 4);
		var mountMat = new THREE.MeshLambertMaterial({ color: 0x404040 });
		var mount = new THREE.Mesh(mountGeo, mountMat);
		mount.position.set(0, 1, 0);
		mount.castShadow = true;
		mount.receiveShadow = true;
		group.add(mount);

		var barrelGeo = new THREE.CylinderGeometry(0.6, 0.6, 12, 16);
		var barrelMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
		var barrel = new THREE.Mesh(barrelGeo, barrelMat);
		barrel.rotation.z = Math.PI / 6;
		barrel.position.set(0, 3, 0);
		barrel.castShadow = true;
		barrel.receiveShadow = true;
		group.add(barrel);

		group.position.set(worldOffsetX + 20, 0, worldOffsetZ + 15);
		return group;
	}

	function createFuelJetty() {
		var group = new THREE.Group();

		var jettyGeo = new THREE.BoxGeometry(3, 1.5, 20);
		var jettyMat = new THREE.MeshLambertMaterial({ color: 0x696969 });
		var jetty = new THREE.Mesh(jettyGeo, jettyMat);
		jetty.position.set(0, 0.75, 0);
		jetty.castShadow = true;
		jetty.receiveShadow = true;
		group.add(jetty);

		var postPositions = [
			[-1.5, 1, -8],
			[-1.5, 1, 0],
			[-1.5, 1, 8],
			[1.5, 1, -8],
			[1.5, 1, 0],
			[1.5, 1, 8]
		];

		for (var i = 0; i < postPositions.length; i++) {
			var postGeo = new THREE.CylinderGeometry(0.4, 0.4, 2, 8);
			var postMat = new THREE.MeshLambertMaterial({ color: 0xA9A9A9 });
			var post = new THREE.Mesh(postGeo, postMat);
			post.position.set(postPositions[i][0], postPositions[i][1], postPositions[i][2]);
			post.castShadow = true;
			post.receiveShadow = true;
			group.add(post);
		}

		group.position.set(worldOffsetX + 35, 0, worldOffsetZ - 50);
		return group;
	}

	function createSecurityFence() {
		var group = new THREE.Group();

		var fencePoints = [
			[worldOffsetX - 60, 0, worldOffsetZ - 60],
			[worldOffsetX + 60, 0, worldOffsetZ - 60],
			[worldOffsetX + 60, 0, worldOffsetZ + 60],
			[worldOffsetX - 60, 0, worldOffsetZ + 60],
			[worldOffsetX - 60, 0, worldOffsetZ - 60]
		];

		for (var i = 0; i < fencePoints.length - 1; i++) {
			var p1 = fencePoints[i];
			var p2 = fencePoints[i + 1];

			var lineGeo = new THREE.BufferGeometry();
			var positions = new Float32Array([
				p1[0], p1[1] + 2, p1[2],
				p2[0], p2[1] + 2, p2[2]
			]);
			lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
			var lineMat = new THREE.LineBasicMaterial({ color: 0xFF0000 });
			var line = new THREE.LineSegments(lineGeo, lineMat);
			group.add(line);

			var distance = Math.sqrt(
				Math.pow(p2[0] - p1[0], 2) +
				Math.pow(p2[2] - p1[2], 2)
			);
			var segments = Math.floor(distance / 8);

			for (var j = 0; j <= segments; j++) {
				var t = segments > 0 ? j / segments : 0;
				var x = p1[0] + (p2[0] - p1[0]) * t;
				var z = p1[2] + (p2[2] - p1[2]) * t;

				var postGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.5, 8);
				var postMat = new THREE.MeshLambertMaterial({ color: 0x333333 });
				var post = new THREE.Mesh(postGeo, postMat);
				post.position.set(x, 1.25, z);
				post.castShadow = true;
				post.receiveShadow = true;
				group.add(post);
			}
		}

		return group;
	}

	function createPatrolBoat() {
		var group = new THREE.Group();

		var hullGeo = new THREE.BoxGeometry(4, 2, 12);
		var hullMat = new THREE.MeshLambertMaterial({ color: 0x1C1C1C });
		var hull = new THREE.Mesh(hullGeo, hullMat);
		hull.position.set(0, 1, 0);
		hull.castShadow = true;
		hull.receiveShadow = true;
		group.add(hull);

		var gunGeo = new THREE.CylinderGeometry(0.4, 0.4, 6, 12);
		var gunMat = new THREE.MeshLambertMaterial({ color: 0x2F4F4F });
		var gun = new THREE.Mesh(gunGeo, gunMat);
		gun.rotation.z = Math.PI / 8;
		gun.position.set(0, 2.5, -2);
		gun.castShadow = true;
		gun.receiveShadow = true;
		group.add(gun);

		var bridgeGeo = new THREE.BoxGeometry(2, 2.5, 3);
		var bridgeMat = new THREE.MeshLambertMaterial({ color: 0x4472CA });
		var bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
		bridge.position.set(0, 2.5, 2);
		bridge.castShadow = true;
		bridge.receiveShadow = true;
		group.add(bridge);

		group.position.set(worldOffsetX - 20, 0, worldOffsetZ + 50);
		return group;
	}

	function init() {
		structures = [];
		structures.push(createQuay());
		structures.push(createDistillery());
		structures.push(createOilRig());
		structures.push(createCruiseTerminal());
		structures.push(createNavalGun());
		structures.push(createFuelJetty());
		structures.push(createSecurityFence());
		structures.push(createPatrolBoat());
		return structures;
	}

	function getStructures() {
		return structures;
	}

	function reset() {
		structures = [];
	}

	return {
		init: init,
		getStructures: getStructures,
		reset: reset
	};
}());
