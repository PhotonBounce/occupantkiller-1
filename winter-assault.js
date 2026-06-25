window.WinterAssault = (function() {
	'use strict';

	var scene;
	var camera;
	var objects = [];
	var lights = [];
	var animations = [];

	// Animation tracking
	var trebuchetArm;
	var siegeTowerPlatform;
	var wagonWheels = [];
	var time = 0;

	function init(sceneRef, cameraRef) {
		scene = sceneRef;
		camera = cameraRef;
		objects = [];
		lights = [];
		animations = [];
		time = 0;

		buildGround();
		buildCastleRuins();
		buildTrebuchets();
		buildHowitzers();
		buildSiegeTowers();
		buildBatteringRams();
		buildKnightTents();
		buildSupplyWagons();
		buildCommandPavilion();
		buildCrossbowTowers();
		buildSniperNests();
		buildPalisades();
		buildLighting();
		buildMiscStructures();
	}

	function buildGround() {
		var groundGeom = new THREE.BoxGeometry(200, 1, 200);
		var groundMat = new THREE.MeshLambertMaterial({ color: 0x4a3728 });
		var groundMesh = new THREE.Mesh(groundGeom, groundMat);
		groundMesh.position.y = -1;
		groundMesh.receiveShadow = true;
		scene.add(groundMesh);
		objects.push(groundMesh);
	}

	function buildCastleRuins() {
		// Castle wall section - partially destroyed
		var wallGeom = new THREE.BoxGeometry(40, 35, 8);
		var stoneMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var wall = new THREE.Mesh(wallGeom, stoneMat);
		wall.position.set(-60, 15, -80);
		wall.castShadow = true;
		wall.receiveShadow = true;
		scene.add(wall);
		objects.push(wall);

		// Ruined tower section
		var ruinGeom = new THREE.CylinderGeometry(12, 15, 40, 8);
		var ruin = new THREE.Mesh(ruinGeom, stoneMat);
		ruin.position.set(-85, 18, -75);
		ruin.castShadow = true;
		ruin.receiveShadow = true;
		scene.add(ruin);
		objects.push(ruin);

		// Collapsed wall piece
		var collapsedGeom = new THREE.BoxGeometry(25, 15, 6);
		var collapsed = new THREE.Mesh(collapsedGeom, stoneMat);
		collapsed.position.set(-50, 7, -95);
		collapsed.rotation.z = 0.3;
		collapsed.castShadow = true;
		scene.add(collapsed);
		objects.push(collapsed);

		// Broken battlement
		for (var i = 0; i < 8; i++) {
			var battleGeom = new THREE.BoxGeometry(3, 8, 3);
			var battle = new THREE.Mesh(battleGeom, stoneMat);
			battle.position.set(-55 + i * 4, 35, -80);
			if (i % 3 === 0) {
				battle.position.y = 15;
			}
			battle.castShadow = true;
			scene.add(battle);
			objects.push(battle);
		}
	}

	function buildTrebuchets() {
		// Trebuchet 1
		var trebuchet1X = -30;
		var trebuchet1Z = -20;

		// Base frame
		var baseGeom = new THREE.BoxGeometry(8, 3, 8);
		var woodMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var base = new THREE.Mesh(baseGeom, woodMat);
		base.position.set(trebuchet1X, 1.5, trebuchet1Z);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		// Upright posts
		for (var j = 0; j < 4; j++) {
			var postGeom = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
			var post = new THREE.Mesh(postGeom, woodMat);
			var offsetX = (j % 2 === 0) ? -2 : 2;
			var offsetZ = (j < 2) ? -2 : 2;
			post.position.set(trebuchet1X + offsetX, 8, trebuchet1Z + offsetZ);
			post.castShadow = true;
			scene.add(post);
			objects.push(post);
		}

		// Swinging arm (animated)
		var armGeom = new THREE.CylinderGeometry(0.6, 0.6, 18, 8);
		trebuchetArm = new THREE.Mesh(armGeom, woodMat);
		trebuchetArm.position.set(trebuchet1X, 16, trebuchet1Z);
		trebuchetArm.rotation.z = 0.4;
		trebuchetArm.castShadow = true;
		scene.add(trebuchetArm);
		objects.push(trebuchetArm);

		// Counterweight
		var weightGeom = new THREE.SphereGeometry(2, 8, 8);
		var stoneMat = new THREE.MeshLambertMaterial({ color: 0x808080 });
		var weight = new THREE.Mesh(weightGeom, stoneMat);
		weight.position.set(trebuchet1X - 6, 12, trebuchet1Z);
		weight.castShadow = true;
		scene.add(weight);
		objects.push(weight);

		// Basket/cup
		var basketGeom = new THREE.CylinderGeometry(2, 2.5, 2, 12);
		var basket = new THREE.Mesh(basketGeom, woodMat);
		basket.position.set(trebuchet1X + 8, 24, trebuchet1Z);
		basket.castShadow = true;
		scene.add(basket);
		objects.push(basket);

		// Trebuchet 2 (simpler placement)
		var trebuchet2X = 20;
		var trebuchet2Z = -30;
		var base2 = new THREE.Mesh(baseGeom, woodMat);
		base2.position.set(trebuchet2X, 1.5, trebuchet2Z);
		base2.castShadow = true;
		scene.add(base2);
		objects.push(base2);

		for (var k = 0; k < 4; k++) {
			var postGeom2 = new THREE.CylinderGeometry(0.5, 0.5, 15, 8);
			var post2 = new THREE.Mesh(postGeom2, woodMat);
			var offsetX2 = (k % 2 === 0) ? -2 : 2;
			var offsetZ2 = (k < 2) ? -2 : 2;
			post2.position.set(trebuchet2X + offsetX2, 8, trebuchet2Z + offsetZ2);
			post2.castShadow = true;
			scene.add(post2);
			objects.push(post2);
		}

		var arm2Geom = new THREE.CylinderGeometry(0.6, 0.6, 18, 8);
		var arm2 = new THREE.Mesh(arm2Geom, woodMat);
		arm2.position.set(trebuchet2X, 16, trebuchet2Z);
		arm2.rotation.z = -0.2;
		arm2.castShadow = true;
		scene.add(arm2);
		objects.push(arm2);
	}

	function buildHowitzers() {
		// Howitzer 1
		var barrelGeom = new THREE.CylinderGeometry(1.2, 1, 12, 12);
		var metalMat = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
		var barrel1 = new THREE.Mesh(barrelGeom, metalMat);
		barrel1.position.set(15, 4, 20);
		barrel1.rotation.z = -0.4;
		barrel1.castShadow = true;
		scene.add(barrel1);
		objects.push(barrel1);

		var breechGeom = new THREE.SphereGeometry(2.5, 8, 8);
		var breech1 = new THREE.Mesh(breechGeom, metalMat);
		breech1.position.set(15, 3, 20);
		breech1.castShadow = true;
		scene.add(breech1);
		objects.push(breech1);

		var carriage1Geom = new THREE.BoxGeometry(6, 3, 8);
		var carriageMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var carriage1 = new THREE.Mesh(carriage1Geom, carriageMat);
		carriage1.position.set(15, 1.5, 20);
		carriage1.castShadow = true;
		scene.add(carriage1);
		objects.push(carriage1);

		// Howitzer 2
		var barrel2 = new THREE.Mesh(barrelGeom, metalMat);
		barrel2.position.set(-15, 4, 25);
		barrel2.rotation.z = -0.3;
		barrel2.castShadow = true;
		scene.add(barrel2);
		objects.push(barrel2);

		var breech2 = new THREE.Mesh(breechGeom, metalMat);
		breech2.position.set(-15, 3, 25);
		breech2.castShadow = true;
		scene.add(breech2);
		objects.push(breech2);

		var carriage2 = new THREE.Mesh(carriage1Geom, carriageMat);
		carriage2.position.set(-15, 1.5, 25);
		carriage2.castShadow = true;
		scene.add(carriage2);
		objects.push(carriage2);
	}

	function buildSiegeTowers() {
		// Main siege tower structure
		var tower1X = 45;
		var tower1Z = -40;

		// Vertical supports
		for (var i = 0; i < 4; i++) {
			var supportGeom = new THREE.CylinderGeometry(1, 1, 30, 8);
			var supportMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
			var support = new THREE.Mesh(supportGeom, supportMat);
			var offsetX = (i % 2 === 0) ? -5 : 5;
			var offsetZ = (i < 2) ? -5 : 5;
			support.position.set(tower1X + offsetX, 15, tower1Z + offsetZ);
			support.castShadow = true;
			scene.add(support);
			objects.push(support);
		}

		// Platforms (4 levels)
		for (var level = 0; level < 4; level++) {
			var platformGeom = new THREE.BoxGeometry(12, 2, 12);
			var platformMat = new THREE.MeshLambertMaterial({ color: 0x8b6914 });
			var platform = new THREE.Mesh(platformGeom, platformMat);
			platform.position.set(tower1X, 8 + level * 8, tower1Z);
			platform.castShadow = true;
			platform.receiveShadow = true;
			scene.add(platform);
			objects.push(platform);

			if (level === 3) {
				siegeTowerPlatform = platform;
			}
		}

		// Ladder segments
		for (var rung = 0; rung < 8; rung++) {
			var ladderGeom = new THREE.BoxGeometry(0.3, 0.3, 10);
			var ladderMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
			var rungMesh = new THREE.Mesh(ladderGeom, ladderMat);
			rungMesh.position.set(tower1X, 2 + rung * 3.5, tower1Z - 5.5);
			rungMesh.castShadow = true;
			scene.add(rungMesh);
			objects.push(rungMesh);
		}

		// Siege tower 2 (scaled version)
		var tower2X = -40;
		var tower2Z = -35;

		for (var j = 0; j < 4; j++) {
			var supportGeom2 = new THREE.CylinderGeometry(0.9, 0.9, 25, 8);
			var support2 = new THREE.Mesh(supportGeom2, supportMat);
			var offsetX2 = (j % 2 === 0) ? -4.5 : 4.5;
			var offsetZ2 = (j < 2) ? -4.5 : 4.5;
			support2.position.set(tower2X + offsetX2, 13, tower2Z + offsetZ2);
			support2.castShadow = true;
			scene.add(support2);
			objects.push(support2);
		}

		for (var level2 = 0; level2 < 3; level2++) {
			var platformGeom2 = new THREE.BoxGeometry(10, 2, 10);
			var platform2 = new THREE.Mesh(platformGeom2, platformMat);
			platform2.position.set(tower2X, 7 + level2 * 8, tower2Z);
			platform2.castShadow = true;
			scene.add(platform2);
			objects.push(platform2);
		}
	}

	function buildBatteringRams() {
		// Battering ram 1
		var ramFrameGeom = new THREE.BoxGeometry(4, 5, 20);
		var frameMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var frame = new THREE.Mesh(ramFrameGeom, frameMat);
		frame.position.set(-70, 3, 10);
		frame.castShadow = true;
		scene.add(frame);
		objects.push(frame);

		var ramHeadGeom = new THREE.CylinderGeometry(2.5, 2.5, 14, 16);
		var metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var ramHead = new THREE.Mesh(ramHeadGeom, metalMat);
		ramHead.position.set(-70, 4, 20);
		ramHead.rotation.z = 0.3;
		ramHead.castShadow = true;
		scene.add(ramHead);
		objects.push(ramHead);

		// Hanging chains representation
		for (var i = 0; i < 3; i++) {
			var chainGeom = new THREE.CylinderGeometry(0.3, 0.3, 6, 6);
			var chain = new THREE.Mesh(chainGeom, metalMat);
			chain.position.set(-70 + (i - 1) * 2, 5, 15);
			chain.castShadow = true;
			scene.add(chain);
			objects.push(chain);
		}

		// Battering ram 2
		var frame2 = new THREE.Mesh(ramFrameGeom, frameMat);
		frame2.position.set(70, 3, -5);
		frame2.castShadow = true;
		scene.add(frame2);
		objects.push(frame2);

		var ramHead2 = new THREE.Mesh(ramHeadGeom, metalMat);
		ramHead2.position.set(70, 4, 5);
		ramHead2.rotation.z = -0.3;
		ramHead2.castShadow = true;
		scene.add(ramHead2);
		objects.push(ramHead2);
	}

	function buildKnightTents() {
		// Medieval tents with modern radios
		for (var tentIdx = 0; tentIdx < 5; tentIdx++) {
			var tentX = -45 + tentIdx * 12;
			var tentZ = 35;

			// Tent pole
			var poleGeom = new THREE.CylinderGeometry(1, 1, 12, 8);
			var poleMat = new THREE.MeshLambertMaterial({ color: 0x3d2817 });
			var pole = new THREE.Mesh(poleGeom, poleMat);
			pole.position.set(tentX, 6, tentZ);
			pole.castShadow = true;
			scene.add(pole);
			objects.push(pole);

			// Tent roof
			var roofGeom = new THREE.ConeGeometry(6, 10, 8);
			var tentMat = new THREE.MeshLambertMaterial({ color: 0xa52a2a });
			var roof = new THREE.Mesh(roofGeom, tentMat);
			roof.position.set(tentX, 11, tentZ);
			roof.castShadow = true;
			scene.add(roof);
			objects.push(roof);

			// Guy lines (using thin cylinders)
			for (var line = 0; line < 4; line++) {
				var guyGeom = new THREE.CylinderGeometry(0.1, 0.1, 8, 4);
				var guy = new THREE.Mesh(guyGeom, poleMat);
				var angle = (line / 4) * Math.PI * 2;
				guy.position.set(tentX + Math.cos(angle) * 5, 1, tentZ + Math.sin(angle) * 5);
				guy.castShadow = true;
				scene.add(guy);
				objects.push(guy);
			}

			// Radio antenna (inside tent)
			var antennaGeom = new THREE.CylinderGeometry(0.2, 0.2, 5, 6);
			var antennaMatBlack = new THREE.MeshLambertMaterial({ color: 0x000000 });
			var antenna = new THREE.Mesh(antennaGeom, antennaMatBlack);
			antenna.position.set(tentX, 8, tentZ - 2);
			antenna.castShadow = true;
			scene.add(antenna);
			objects.push(antenna);
		}
	}

	function buildSupplyWagons() {
		// Supply wagon 1 (converted truck)
		var wagonX = 40;
		var wagonZ = 40;

		var bedGeom = new THREE.BoxGeometry(10, 6, 15);
		var truckMat = new THREE.MeshLambertMaterial({ color: 0x2d5016 });
		var bed = new THREE.Mesh(bedGeom, truckMat);
		bed.position.set(wagonX, 4, wagonZ);
		bed.castShadow = true;
		scene.add(bed);
		objects.push(bed);

		// Wheels (animated)
		for (var wheel = 0; wheel < 4; wheel++) {
			var wheelGeom = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
			var wheelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var wheelMesh = new THREE.Mesh(wheelGeom, wheelMat);
			var isRear = (wheel >= 2) ? true : false;
			var posZ = isRear ? wagonZ - 5 : wagonZ + 5;
			var posX = (wheel % 2 === 0) ? wagonX - 3.5 : wagonX + 3.5;
			wheelMesh.position.set(posX, 2.5, posZ);
			wheelMesh.rotation.z = Math.PI / 2;
			wheelMesh.castShadow = true;
			scene.add(wheelMesh);
			objects.push(wheelMesh);
			wagonWheels.push(wheelMesh);
		}

		// Cabin
		var cabinGeom = new THREE.BoxGeometry(5, 4, 6);
		var cabin = new THREE.Mesh(cabinGeom, truckMat);
		cabin.position.set(wagonX, 4, wagonZ - 10);
		cabin.castShadow = true;
		scene.add(cabin);
		objects.push(cabin);

		// Supply wagon 2
		var wagonX2 = -50;
		var wagonZ2 = 45;

		var bed2 = new THREE.Mesh(bedGeom, truckMat);
		bed2.position.set(wagonX2, 4, wagonZ2);
		bed2.castShadow = true;
		scene.add(bed2);
		objects.push(bed2);

		for (var wheel2 = 0; wheel2 < 4; wheel2++) {
			var wheelGeom2 = new THREE.CylinderGeometry(2.5, 2.5, 1.5, 16);
			var wheelMesh2 = new THREE.Mesh(wheelGeom2, wheelMat);
			var isRear2 = (wheel2 >= 2) ? true : false;
			var posZ2 = isRear2 ? wagonZ2 - 5 : wagonZ2 + 5;
			var posX2 = (wheel2 % 2 === 0) ? wagonX2 - 3.5 : wagonX2 + 3.5;
			wheelMesh2.position.set(posX2, 2.5, posZ2);
			wheelMesh2.rotation.z = Math.PI / 2;
			wheelMesh2.castShadow = true;
			scene.add(wheelMesh2);
			objects.push(wheelMesh2);
			wagonWheels.push(wheelMesh2);
		}

		var cabin2 = new THREE.Mesh(cabinGeom, truckMat);
		cabin2.position.set(wagonX2, 4, wagonZ2 - 10);
		cabin2.castShadow = true;
		scene.add(cabin2);
		objects.push(cabin2);
	}

	function buildCommandPavilion() {
		// Main command pavilion structure
		var pavX = 0;
		var pavZ = -55;

		// Large tent poles
		for (var pole = 0; pole < 6; pole++) {
			var poleGeom = new THREE.CylinderGeometry(2, 2, 16, 12);
			var poleMat = new THREE.MeshLambertMaterial({ color: 0x2d2d2d });
			var pillar = new THREE.Mesh(poleGeom, poleMat);
			var angle = (pole / 6) * Math.PI * 2;
			pillar.position.set(pavX + Math.cos(angle) * 8, 8, pavZ + Math.sin(angle) * 8);
			pillar.castShadow = true;
			scene.add(pillar);
			objects.push(pillar);
		}

		// Roof covering
		var roofGeom = new THREE.ConeGeometry(10, 8, 12);
		var roofMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
		var roof = new THREE.Mesh(roofGeom, roofMat);
		roof.position.set(pavX, 16, pavZ);
		roof.castShadow = true;
		scene.add(roof);
		objects.push(roof);

		// Tactical map table
		var tableGeom = new THREE.BoxGeometry(12, 1.5, 12);
		var tableMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
		var table = new THREE.Mesh(tableGeom, tableMat);
		table.position.set(pavX, 1, pavZ);
		table.receiveShadow = true;
		scene.add(table);
		objects.push(table);

		// Table supports
		for (var sup = 0; sup < 4; sup++) {
			var supGeom = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 8);
			var support = new THREE.Mesh(supGeom, tableMat);
			var supOffsetX = (sup % 2 === 0) ? -5 : 5;
			var supOffsetZ = (sup < 2) ? -5 : 5;
			support.position.set(pavX + supOffsetX, 0.6, pavZ + supOffsetZ);
			support.castShadow = true;
			scene.add(support);
			objects.push(support);
		}

		// Supply racks
		var rackGeom = new THREE.BoxGeometry(4, 8, 3);
		var rackMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var rack = new THREE.Mesh(rackGeom, rackMat);
		rack.position.set(pavX + 10, 4, pavZ);
		rack.castShadow = true;
		scene.add(rack);
		objects.push(rack);
	}

	function buildCrossbowTowers() {
		// Crossbow tower 1
		var tower1X = 55;
		var tower1Z = 15;

		var baseGeom = new THREE.BoxGeometry(6, 2, 6);
		var baseMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var base = new THREE.Mesh(baseGeom, baseMat);
		base.position.set(tower1X, 1, tower1Z);
		base.castShadow = true;
		scene.add(base);
		objects.push(base);

		var postGeom = new THREE.CylinderGeometry(1.5, 1.5, 18, 12);
		var post = new THREE.Mesh(postGeom, baseMat);
		post.position.set(tower1X, 10, tower1Z);
		post.castShadow = true;
		scene.add(post);
		objects.push(post);

		var platformGeom = new THREE.BoxGeometry(8, 2, 8);
		var platform = new THREE.Mesh(platformGeom, baseMat);
		platform.position.set(tower1X, 19, tower1Z);
		platform.castShadow = true;
		scene.add(platform);
		objects.push(platform);

		// Crossbow apparatus
		var boltGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 8);
		var metalMat = new THREE.MeshLambertMaterial({ color: 0x555555 });
		var bolt = new THREE.Mesh(boltGeom, metalMat);
		bolt.position.set(tower1X, 20, tower1Z + 2);
		bolt.rotation.z = 0.2;
		bolt.castShadow = true;
		scene.add(bolt);
		objects.push(bolt);

		// Crossbow tower 2
		var tower2X = -55;
		var tower2Z = 20;

		var base2 = new THREE.Mesh(baseGeom, baseMat);
		base2.position.set(tower2X, 1, tower2Z);
		base2.castShadow = true;
		scene.add(base2);
		objects.push(base2);

		var post2 = new THREE.Mesh(postGeom, baseMat);
		post2.position.set(tower2X, 10, tower2Z);
		post2.castShadow = true;
		scene.add(post2);
		objects.push(post2);

		var platform2 = new THREE.Mesh(platformGeom, baseMat);
		platform2.position.set(tower2X, 19, tower2Z);
		platform2.castShadow = true;
		scene.add(platform2);
		objects.push(platform2);

		var bolt2 = new THREE.Mesh(boltGeom, metalMat);
		bolt2.position.set(tower2X, 20, tower2Z + 2);
		bolt2.rotation.z = -0.2;
		bolt2.castShadow = true;
		scene.add(bolt2);
		objects.push(bolt2);
	}

	function buildSniperNests() {
		// Sniper nest 1 - elevated platform
		var nestX = 60;
		var nestZ = -50;

		var supportGeom = new THREE.CylinderGeometry(2, 2, 20, 12);
		var supportMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
		var support = new THREE.Mesh(supportGeom, supportMat);
		support.position.set(nestX, 10, nestZ);
		support.castShadow = true;
		scene.add(support);
		objects.push(support);

		var platformGeom = new THREE.BoxGeometry(10, 2, 10);
		var platformMat = new THREE.MeshLambertMaterial({ color: 0x8b7355 });
		var platform = new THREE.Mesh(platformGeom, platformMat);
		platform.position.set(nestX, 20, nestZ);
		platform.castShadow = true;
		scene.add(platform);
		objects.push(platform);

		// Sandbag barrier (represented as boxes)
		for (var sb = 0; sb < 6; sb++) {
			var bagGeom = new THREE.BoxGeometry(1.5, 1, 1.5);
			var bagMat = new THREE.MeshLambertMaterial({ color: 0xd2a679 });
			var bag = new THREE.Mesh(bagGeom, bagMat);
			bag.position.set(nestX - 3 + sb, 20.5, nestZ - 4);
			bag.castShadow = true;
			scene.add(bag);
			objects.push(bag);
		}

		// Rifle mount
		var gunGeom = new THREE.CylinderGeometry(0.5, 0.5, 10, 8);
		var gunMat = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
		var gun = new THREE.Mesh(gunGeom, gunMat);
		gun.position.set(nestX, 21, nestZ + 2);
		gun.rotation.z = -0.3;
		gun.castShadow = true;
		scene.add(gun);
		objects.push(gun);

		// Sniper nest 2
		var nestX2 = -60;
		var nestZ2 = -45;

		var support2 = new THREE.Mesh(supportGeom, supportMat);
		support2.position.set(nestX2, 10, nestZ2);
		support2.castShadow = true;
		scene.add(support2);
		objects.push(support2);

		var platform2 = new THREE.Mesh(platformGeom, platformMat);
		platform2.position.set(nestX2, 20, nestZ2);
		platform2.castShadow = true;
		scene.add(platform2);
		objects.push(platform2);

		for (var sb2 = 0; sb2 < 6; sb2++) {
			var bagGeom2 = new THREE.BoxGeometry(1.5, 1, 1.5);
			var bagMat2 = new THREE.MeshLambertMaterial({ color: 0xd2a679 });
			var bag2 = new THREE.Mesh(bagGeom2, bagMat2);
			bag2.position.set(nestX2 - 3 + sb2, 20.5, nestZ2 - 4);
			bag2.castShadow = true;
			scene.add(bag2);
			objects.push(bag2);
		}

		var gun2 = new THREE.Mesh(gunGeom, gunMat);
		gun2.position.set(nestX2, 21, nestZ2 + 2);
		gun2.rotation.z = 0.3;
		gun2.castShadow = true;
		scene.add(gun2);
		objects.push(gun2);
	}

	function buildPalisades() {
		// Defensive wooden palisade wall
		var palisadeStartX = -80;
		var palisadeZ = 60;

		for (var palisadeIdx = 0; palisadeIdx < 20; palisadeIdx++) {
			var stakeGeom = new THREE.CylinderGeometry(0.8, 1, 12, 8);
			var stakeMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
			var stake = new THREE.Mesh(stakeGeom, stakeMat);
			stake.position.set(palisadeStartX + palisadeIdx * 8, 6, palisadeZ);
			stake.castShadow = true;
			scene.add(stake);
			objects.push(stake);

			// Connecting rails
			if (palisadeIdx < 19) {
				var railGeom = new THREE.CylinderGeometry(0.4, 0.4, 8, 6);
				var rail = new THREE.Mesh(railGeom, stakeMat);
				rail.position.set(palisadeStartX + palisadeIdx * 8 + 4, 8, palisadeZ);
				rail.rotation.z = Math.PI / 2;
				rail.castShadow = true;
				scene.add(rail);
				objects.push(rail);
			}
		}
	}

	function buildMiscStructures() {
		// Ammo storage boxes
		for (var ammoBox = 0; ammoBox < 8; ammoBox++) {
			var boxGeom = new THREE.BoxGeometry(3, 2.5, 3);
			var boxMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var box = new THREE.Mesh(boxGeom, boxMat);
			box.position.set(-30 + ammoBox * 6, 1.25, 50);
			box.castShadow = true;
			scene.add(box);
			objects.push(box);
		}

		// Supply crates stacked
		for (var stack = 0; stack < 4; stack++) {
			for (var level = 0; level < 3; level++) {
				var crateGeom = new THREE.BoxGeometry(3, 2.5, 3);
				var crateMat = new THREE.MeshLambertMaterial({ color: 0x8b4513 });
				var crate = new THREE.Mesh(crateGeom, crateMat);
				crate.position.set(50 + stack * 8, 1.25 + level * 2.7, 50);
				crate.castShadow = true;
				scene.add(crate);
				objects.push(crate);
			}
		}

		// Campfire pits
		for (var fire = 0; fire < 3; fire++) {
			var pitGeom = new THREE.CylinderGeometry(2, 2.5, 1, 12);
			var pitMat = new THREE.MeshLambertMaterial({ color: 0x4a4a4a });
			var pit = new THREE.Mesh(pitGeom, pitMat);
			pit.position.set(-20 + fire * 35, 0.5, -60);
			pit.castShadow = true;
			scene.add(pit);
			objects.push(pit);

			// Fire ring
			var ringGeom = new THREE.CylinderGeometry(2.3, 2.3, 0.5, 12);
			var ringMat = new THREE.MeshLambertMaterial({ color: 0x8b0000 });
			var ring = new THREE.Mesh(ringGeom, ringMat);
			ring.position.set(-20 + fire * 35, 0.8, -60);
			ring.castShadow = true;
			scene.add(ring);
			objects.push(ring);
		}

		// Weapon racks
		for (var rackIdx = 0; rackIdx < 3; rackIdx++) {
			var rackFrameGeom = new THREE.BoxGeometry(4, 5, 2);
			var rackMat = new THREE.MeshLambertMaterial({ color: 0x654321 });
			var rackFrame = new THREE.Mesh(rackFrameGeom, rackMat);
			rackFrame.position.set(35 + rackIdx * 10, 2.5, 55);
			rackFrame.castShadow = true;
			scene.add(rackFrame);
			objects.push(rackFrame);
		}

		// Barrel containers
		for (var barrelIdx = 0; barrelIdx < 5; barrelIdx++) {
			var barrelGeom = new THREE.CylinderGeometry(1.2, 1.2, 3, 12);
			var barrelMat = new THREE.MeshLambertMaterial({ color: 0x1a1a1a });
			var barrel = new THREE.Mesh(barrelGeom, barrelMat);
			barrel.position.set(-40 + barrelIdx * 6, 1.5, 60);
			barrel.castShadow = true;
			scene.add(barrel);
			objects.push(barrel);
		}

		// Flag poles
		for (var flagIdx = 0; flagIdx < 2; flagIdx++) {
			var poleGeom = new THREE.CylinderGeometry(0.6, 0.6, 15, 8);
			var poleMat = new THREE.MeshLambertMaterial({ color: 0x2c2c2c });
			var pole = new THREE.Mesh(poleGeom, poleMat);
			pole.position.set(-50 + flagIdx * 100, 7.5, -70);
			pole.castShadow = true;
			scene.add(pole);
			objects.push(pole);

			var flagGeom = new THREE.BoxGeometry(8, 5, 0.5);
			var flagMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });
			var flag = new THREE.Mesh(flagGeom, flagMat);
			flag.position.set(-46 + flagIdx * 100, 12, -70);
			flag.castShadow = true;
			scene.add(flag);
			objects.push(flag);
		}
	}

	function buildLighting() {
		// Ambient light
		var ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
		scene.add(ambientLight);
		lights.push(ambientLight);

		// Directional light (sun)
		var sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
		sunLight.position.set(50, 60, 50);
		sunLight.castShadow = true;
		sunLight.shadow.mapSize.width = 2048;
		sunLight.shadow.mapSize.height = 2048;
		sunLight.shadow.camera.far = 200;
		sunLight.shadow.camera.left = -100;
		sunLight.shadow.camera.right = 100;
		sunLight.shadow.camera.top = 100;
		sunLight.shadow.camera.bottom = -100;
		scene.add(sunLight);
		lights.push(sunLight);

		// Campfire lights
		var campfire1 = new THREE.PointLight(0xff4500, 0.6, 30);
		campfire1.position.set(-20, 2, -60);
		campfire1.castShadow = true;
		scene.add(campfire1);
		lights.push(campfire1);

		var campfire2 = new THREE.PointLight(0xff4500, 0.6, 30);
		campfire2.position.set(15, 2, -60);
		campfire2.castShadow = true;
		scene.add(campfire2);
		lights.push(campfire2);

		var campfire3 = new THREE.PointLight(0xff4500, 0.6, 30);
		campfire3.position.set(50, 2, -60);
		campfire3.castShadow = true;
		scene.add(campfire3);
		lights.push(campfire3);

		// Tent lights
		var tentLight = new THREE.PointLight(0xffffaa, 0.4, 20);
		tentLight.position.set(-45, 5, 35);
		scene.add(tentLight);
		lights.push(tentLight);

		var tentLight2 = new THREE.PointLight(0xffffaa, 0.4, 20);
		tentLight2.position.set(15, 5, 35);
		scene.add(tentLight2);
		lights.push(tentLight2);
	}

	function update(delta) {
		time += delta;

		// Trebuchet arm swinging animation
		if (trebuchetArm) {
			var swingAmount = Math.sin(time * 0.8) * 0.6;
			trebuchetArm.rotation.z = 0.4 + swingAmount;
		}

		// Siege tower platform rising animation
		if (siegeTowerPlatform) {
			var riseAmount = Math.sin(time * 0.5) * 1.5;
			siegeTowerPlatform.position.y = 32 + riseAmount;
		}

		// Supply wagon wheels spinning
		for (var w = 0; w < wagonWheels.length; w++) {
			wagonWheels[w].rotation.x += delta * 2;
		}
	}

	function reset() {
		for (var i = 0; i < objects.length; i++) {
			scene.remove(objects[i]);
		}
		objects = [];

		for (var l = 0; l < lights.length; l++) {
			scene.remove(lights[l]);
		}
		lights = [];

		wagonWheels = [];
		trebuchetArm = null;
		siegeTowerPlatform = null;
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
