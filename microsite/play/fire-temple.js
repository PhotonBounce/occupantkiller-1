window.FireTemple = (function() {
	'use strict';

	var sceneRef;
	var cameraRef;
	var allObjects = [];
	var fires = [];
	var embers = [];
	var wallJets = [];
	var time = 0;

	function createFireColor() {
		var colors = [
			0xFF4500,
			0xFF6347,
			0xFF8C00,
			0xFFD700,
			0xDC143C,
			0xFF1744
		];
		return colors[Math.floor(Math.random() * colors.length)];
	}

	function addToScene(object) {
		sceneRef.add(object);
		allObjects.push(object);
		return object;
	}

	function createMainHall() {
		var hallGeo = new THREE.BoxGeometry(80, 45, 60);
		var hallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
		var hall = new THREE.Mesh(hallGeo, hallMat);
		hall.position.y = 22.5;
		hall.castShadow = true;
		hall.receiveShadow = true;
		addToScene(hall);

		var trimGeo = new THREE.BoxGeometry(82, 2, 62);
		var trimMat = new THREE.MeshStandardMaterial({ color: 0xFF6347, emissive: 0xFF4500, emissiveIntensity: 0.4 });
		var trimTop = new THREE.Mesh(trimGeo, trimMat);
		trimTop.position.y = 47;
		trimTop.castShadow = true;
		addToScene(trimTop);

		var trimBottom = new THREE.Mesh(trimGeo, trimMat);
		trimBottom.position.y = 0.5;
		trimBottom.castShadow = true;
		addToScene(trimBottom);

		var trimFront = new THREE.BoxGeometry(82, 45, 3);
		var trimFrontMesh = new THREE.Mesh(trimFront, trimMat);
		trimFrontMesh.position.z = -31.5;
		trimFrontMesh.position.y = 22.5;
		trimFrontMesh.castShadow = true;
		addToScene(trimFrontMesh);

		var trimBack = new THREE.Mesh(trimFront, trimMat);
		trimBack.position.z = 31.5;
		trimBack.position.y = 22.5;
		trimBack.castShadow = true;
		addToScene(trimBack);

		var trimLeft = new THREE.BoxGeometry(3, 45, 60);
		var trimLeftMesh = new THREE.Mesh(trimLeft, trimMat);
		trimLeftMesh.position.x = -41.5;
		trimLeftMesh.position.y = 22.5;
		trimLeftMesh.castShadow = true;
		addToScene(trimLeftMesh);

		var trimRight = new THREE.Mesh(trimLeft, trimMat);
		trimRight.position.x = 41.5;
		trimRight.position.y = 22.5;
		trimRight.castShadow = true;
		addToScene(trimRight);
	}

	function createEternalFlamePillar(x, z) {
		var pillarGeo = new THREE.CylinderGeometry(3, 3.5, 25, 8);
		var pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
		var pillar = new THREE.Mesh(pillarGeo, pillarMat);
		pillar.position.set(x, 12.5, z);
		pillar.castShadow = true;
		pillar.receiveShadow = true;
		addToScene(pillar);

		var fireGeo = new THREE.SphereGeometry(4, 8, 8);
		var fireMat = new THREE.MeshStandardMaterial({
			color: 0xFF4500,
			emissive: 0xFF6347,
			emissiveIntensity: 0.8,
			roughness: 0.4
		});
		var fire = new THREE.Mesh(fireGeo, fireMat);
		fire.position.set(x, 28, z);
		fire.castShadow = true;
		addToScene(fire);

		fires.push({
			mesh: fire,
			baseScale: 1,
			initialPos: { x: x, y: 28, z: z }
		});

		var pillarCapGeo = new THREE.CylinderGeometry(3.5, 3, 1, 8);
		var pillarCapMat = new THREE.MeshStandardMaterial({ color: 0xFF8C00, emissive: 0xFF4500, emissiveIntensity: 0.3 });
		var pillarCap = new THREE.Mesh(pillarCapGeo, pillarCapMat);
		pillarCap.position.set(x, 25.5, z);
		pillarCap.castShadow = true;
		addToScene(pillarCap);
	}

	function createFireMoat() {
		var moatOuterGeo = new THREE.BoxGeometry(90, 4, 70);
		var moatMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, emissive: 0xFF4500, emissiveIntensity: 0.3 });
		var moatOuter = new THREE.Mesh(moatOuterGeo, moatMat);
		moatOuter.position.y = 2;
		moatOuter.castShadow = true;
		moatOuter.receiveShadow = true;
		addToScene(moatOuter);

		var moatInnerGeo = new THREE.BoxGeometry(86, 2, 66);
		var moatInnerMat = new THREE.MeshStandardMaterial({ color: 0xFF4500, emissive: 0xFF6347, emissiveIntensity: 0.5 });
		var moatInner = new THREE.Mesh(moatInnerGeo, moatInnerMat);
		moatInner.position.y = 2;
		moatInner.castShadow = true;
		addToScene(moatInner);

		for (var i = 0; i < 12; i++) {
			var angle = (i / 12) * Math.PI * 2;
			var radius = 47;
			var x = Math.cos(angle) * radius;
			var z = Math.sin(angle) * radius;

			var fireGeo = new THREE.SphereGeometry(2, 6, 6);
			var fireMat = new THREE.MeshStandardMaterial({
				color: 0xFF6347,
				emissive: 0xFFD700,
				emissiveIntensity: 0.6
			});
			var fire = new THREE.Mesh(fireGeo, fireMat);
			fire.position.set(x, 4, z);
			fire.castShadow = true;
			addToScene(fire);

			fires.push({
				mesh: fire,
				baseScale: 1,
				initialPos: { x: x, y: 4, z: z }
			});
		}
	}

	function createPhoenixGate() {
		var gateFrameGeo = new THREE.BoxGeometry(30, 40, 2);
		var gateMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
		var gateFrame = new THREE.Mesh(gateFrameGeo, gateMat);
		gateFrame.position.set(0, 20, -35);
		gateFrame.castShadow = true;
		gateFrame.receiveShadow = true;
		addToScene(gateFrame);

		var gateTrimGeo = new THREE.BoxGeometry(32, 42, 2.5);
		var gateTrimMat = new THREE.MeshStandardMaterial({ color: 0xFF8C00, emissive: 0xFF4500, emissiveIntensity: 0.5 });
		var gateTrim = new THREE.Mesh(gateTrimGeo, gateTrimMat);
		gateTrim.position.set(0, 20, -36);
		gateTrim.castShadow = true;
		addToScene(gateTrim);

		var wingGeo = new THREE.ConeGeometry(6, 15, 8);
		var wingMat = new THREE.MeshStandardMaterial({ color: 0xFF6347, emissive: 0xFF4500, emissiveIntensity: 0.4 });

		var leftWing = new THREE.Mesh(wingGeo, wingMat);
		leftWing.position.set(-18, 28, -35);
		leftWing.rotation.z = Math.PI * 0.3;
		leftWing.castShadow = true;
		addToScene(leftWing);

		var rightWing = new THREE.Mesh(wingGeo, wingMat);
		rightWing.position.set(18, 28, -35);
		rightWing.rotation.z = -Math.PI * 0.3;
		rightWing.castShadow = true;
		addToScene(rightWing);

		var topWing = new THREE.Mesh(wingGeo, wingMat);
		topWing.position.set(0, 38, -35);
		topWing.rotation.x = Math.PI * 0.2;
		topWing.castShadow = true;
		addToScene(topWing);

		var fireGeo = new THREE.SphereGeometry(5, 8, 8);
		var fireMat = new THREE.MeshStandardMaterial({
			color: 0xFFD700,
			emissive: 0xFF6347,
			emissiveIntensity: 0.7
		});
		var phoenixFire = new THREE.Mesh(fireGeo, fireMat);
		phoenixFire.position.set(0, 35, -35);
		phoenixFire.castShadow = true;
		addToScene(phoenixFire);

		fires.push({
			mesh: phoenixFire,
			baseScale: 1,
			initialPos: { x: 0, y: 35, z: -35 }
		});
	}

	function createAltarRoom() {
		var altarFloorGeo = new THREE.BoxGeometry(25, 1, 25);
		var altarFloorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
		var altarFloor = new THREE.Mesh(altarFloorGeo, altarFloorMat);
		altarFloor.position.set(0, 0.5, 20);
		altarFloor.castShadow = true;
		altarFloor.receiveShadow = true;
		addToScene(altarFloor);

		var altarPlatformGeo = new THREE.BoxGeometry(15, 2, 15);
		var altarPlatformMat = new THREE.MeshStandardMaterial({ color: 0x8B0000, emissive: 0xFF4500, emissiveIntensity: 0.3 });
		var altarPlatform = new THREE.Mesh(altarPlatformGeo, altarPlatformMat);
		altarPlatform.position.set(0, 2, 20);
		altarPlatform.castShadow = true;
		addToScene(altarPlatform);

		var cornerOffsets = [
			{ x: -6.5, z: -6.5 },
			{ x: 6.5, z: -6.5 },
			{ x: -6.5, z: 6.5 },
			{ x: 6.5, z: 6.5 }
		];

		cornerOffsets.forEach(function(offset) {
			var fireGeo = new THREE.SphereGeometry(3, 8, 8);
			var fireMat = new THREE.MeshStandardMaterial({
				color: 0xFF4500,
				emissive: 0xFFD700,
				emissiveIntensity: 0.7
			});
			var fire = new THREE.Mesh(fireGeo, fireMat);
			fire.position.set(offset.x, 6, 20 + offset.z);
			fire.castShadow = true;
			addToScene(fire);

			fires.push({
				mesh: fire,
				baseScale: 1,
				initialPos: { x: offset.x, y: 6, z: 20 + offset.z }
			});
		});

		var altarCenterGeo = new THREE.BoxGeometry(4, 3, 4);
		var altarCenterMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
		var altarCenter = new THREE.Mesh(altarCenterGeo, altarCenterMat);
		altarCenter.position.set(0, 3.5, 20);
		altarCenter.castShadow = true;
		addToScene(altarCenter);
	}

	function createFireWallTraps() {
		var trapPositions = [
			{ x: -30, z: 0 },
			{ x: 30, z: 0 },
			{ x: 0, z: 25 }
		];

		trapPositions.forEach(function(pos) {
			var wallGeo = new THREE.BoxGeometry(8, 20, 3);
			var wallMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
			var wall = new THREE.Mesh(wallGeo, wallMat);
			wall.position.set(pos.x, 10, pos.z);
			wall.castShadow = true;
			wall.receiveShadow = true;
			addToScene(wall);

			for (var i = 0; i < 4; i++) {
				var jetGeo = new THREE.SphereGeometry(1.5, 6, 6);
				var jetMat = new THREE.MeshStandardMaterial({
					color: 0xFF6347,
					emissive: 0xFFD700,
					emissiveIntensity: 0.6
				});
				var jet = new THREE.Mesh(jetGeo, jetMat);
				var jetY = 3 + i * 5;
				jet.position.set(pos.x, jetY, pos.z + 2);
				jet.castShadow = true;
				addToScene(jet);

				wallJets.push({
					mesh: jet,
					baseY: jetY,
					baseScale: 1,
					active: false,
					timer: 0,
					basePos: { x: pos.x, y: jetY, z: pos.z + 2 }
				});
			}
		});
	}

	function createEmberCascade() {
		for (var i = 0; i < 40; i++) {
			var emberGeo = new THREE.SphereGeometry(0.3, 4, 4);
			var emberMat = new THREE.MeshStandardMaterial({
				color: 0xFF8C00,
				emissive: 0xFFD700,
				emissiveIntensity: 0.8
			});
			var ember = new THREE.Mesh(emberGeo, emberMat);
			var startX = (Math.random() - 0.5) * 80;
			var startZ = (Math.random() - 0.5) * 60;
			ember.position.set(startX, 40 + Math.random() * 10, startZ);
			ember.castShadow = true;
			addToScene(ember);

			embers.push({
				mesh: ember,
				velocity: (Math.random() + 0.5) * 3,
				swaySpeed: Math.random() * 2 + 1,
				swayAmount: Math.random() * 3 + 2,
				startX: startX,
				currentSway: Math.random() * Math.PI * 2
			});
		}
	}

	function createHeatShimmerPanels() {
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			var radius = 45;
			var x = Math.cos(angle) * radius;
			var z = Math.sin(angle) * radius;

			var panelGeo = new THREE.BoxGeometry(8, 25, 0.5);
			var panelMat = new THREE.MeshStandardMaterial({
				color: 0xFF8C00,
				transparent: true,
				opacity: 0.3,
				emissive: 0xFF6347,
				emissiveIntensity: 0.4
			});
			var panel = new THREE.Mesh(panelGeo, panelMat);
			panel.position.set(x, 12.5, z);
			panel.rotation.y = angle;
			panel.castShadow = false;
			panel.receiveShadow = true;
			addToScene(panel);
		}
	}

	function createFireRuneFloor() {
		var floorTiles = 10;
		var tileSize = 8;

		for (var tx = 0; tx < floorTiles; tx++) {
			for (var tz = 0; tz < floorTiles; tz++) {
				var tileGeo = new THREE.BoxGeometry(tileSize, 0.2, tileSize);
				var tileColor = (tx + tz) % 2 === 0 ? 0x1a1a1a : 0x2a2a2a;
				var tileMat = new THREE.MeshStandardMaterial({ color: tileColor, roughness: 0.7 });
				var tile = new THREE.Mesh(tileGeo, tileMat);
				var startX = -40 + tx * tileSize;
				var startZ = -30 + tz * tileSize;
				tile.position.set(startX + tileSize / 2, 0, startZ + tileSize / 2);
				tile.castShadow = true;
				tile.receiveShadow = true;
				addToScene(tile);

				if (tx > 1 && tx < floorTiles - 2 && tz > 1 && tz < floorTiles - 2) {
					var runeGeometry = new THREE.BufferGeometry();
					var runePoints = [];

					for (var r = 0; r < 4; r++) {
						var angle = (r / 4) * Math.PI * 2;
						runePoints.push(
							new THREE.Vector3(
								Math.cos(angle) * 2,
								0.1,
								Math.sin(angle) * 2
							)
						);
						runePoints.push(
							new THREE.Vector3(
								Math.cos(angle + Math.PI / 4) * 3,
								0.1,
								Math.sin(angle + Math.PI / 4) * 3
							)
						);
					}

					runeGeometry.setFromPoints(runePoints);
					var runeMat = new THREE.LineBasicMaterial({ color: 0xFFD700, linewidth: 2 });
					var rune = new THREE.LineSegments(runeGeometry, runeMat);
					rune.position.set(startX + tileSize / 2, 0.15, startZ + tileSize / 2);
					addToScene(rune);
				}
			}
		}
	}

	function createBrazierChainNetwork() {
		var chainPositions = [
			{ x: -25, z: -15 },
			{ x: 25, z: -15 },
			{ x: -25, z: 15 },
			{ x: 25, z: 15 },
			{ x: 0, z: -20 },
			{ x: 0, z: 20 }
		];

		chainPositions.forEach(function(pos) {
			var brazierGeo = new THREE.CylinderGeometry(2, 2.5, 3, 8);
			var brazierMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
			var brazier = new THREE.Mesh(brazierGeo, brazierMat);
			brazier.position.set(pos.x, 8, pos.z);
			brazier.castShadow = true;
			addToScene(brazier);

			var chainGeo = new THREE.BufferGeometry();
			var chainPoints = [];
			for (var i = 0; i <= 10; i++) {
				var y = 15 - (i / 10) * 7;
				chainPoints.push(new THREE.Vector3(
					pos.x + Math.sin(i * 0.3) * 2,
					y,
					pos.z + Math.cos(i * 0.3) * 2
				));
			}
			chainGeo.setFromPoints(chainPoints);
			var chainMat = new THREE.LineBasicMaterial({ color: 0x4a4a4a, linewidth: 3 });
			var chain = new THREE.LineSegments(chainGeo, chainMat);
			addToScene(chain);

			var fireGeo = new THREE.SphereGeometry(2.5, 8, 8);
			var fireMat = new THREE.MeshStandardMaterial({
				color: 0xFF4500,
				emissive: 0xFFD700,
				emissiveIntensity: 0.7
			});
			var fire = new THREE.Mesh(fireGeo, fireMat);
			fire.position.set(pos.x, 10, pos.z);
			fire.castShadow = true;
			addToScene(fire);

			fires.push({
				mesh: fire,
				baseScale: 1,
				initialPos: { x: pos.x, y: 10, z: pos.z }
			});
		});
	}

	function createInnerSanctum() {
		var innerSize = 20;
		var octagonPoints = [];
		for (var i = 0; i < 8; i++) {
			var angle = (i / 8) * Math.PI * 2;
			octagonPoints.push({
				x: Math.cos(angle) * innerSize,
				z: Math.sin(angle) * innerSize
			});
		}

		for (var op = 0; op < 8; op++) {
			var p1 = octagonPoints[op];
			var p2 = octagonPoints[(op + 1) % 8];

			var wallGeo = new THREE.BoxGeometry(
				Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.z - p1.z, 2)),
				18,
				2
			);
			var wallMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
			var wall = new THREE.Mesh(wallGeo, wallMat);
			var midX = (p1.x + p2.x) / 2;
			var midZ = (p1.z + p2.z) / 2;
			wall.position.set(midX, 9, midZ);
			var angle = Math.atan2(p2.z - p1.z, p2.x - p1.x);
			wall.rotation.y = angle;
			wall.castShadow = true;
			wall.receiveShadow = true;
			addToScene(wall);

			var pillarGeo = new THREE.CylinderGeometry(1.5, 1.5, 20, 8);
			var pillarMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.9 });
			var pillar = new THREE.Mesh(pillarGeo, pillarMat);
			pillar.position.set(p1.x, 10, p1.z);
			pillar.castShadow = true;
			pillar.receiveShadow = true;
			addToScene(pillar);

			var fireGeo = new THREE.SphereGeometry(2, 6, 6);
			var fireMat = new THREE.MeshStandardMaterial({
				color: 0xFF6347,
				emissive: 0xFFD700,
				emissiveIntensity: 0.7
			});
			var fire = new THREE.Mesh(fireGeo, fireMat);
			fire.position.set(p1.x, 22, p1.z);
			fire.castShadow = true;
			addToScene(fire);

			fires.push({
				mesh: fire,
				baseScale: 1,
				initialPos: { x: p1.x, y: 22, z: p1.z }
			});
		}

		var sanctumFloorGeo = new THREE.BoxGeometry(38, 0.5, 38);
		var sanctumFloorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
		var sanctumFloor = new THREE.Mesh(sanctumFloorGeo, sanctumFloorMat);
		sanctumFloor.position.y = 0.25;
		sanctumFloor.castShadow = true;
		sanctumFloor.receiveShadow = true;
		addToScene(sanctumFloor);
	}

	function createPhoenixStatue() {
		var bodyGeo = new THREE.BoxGeometry(8, 12, 6);
		var bodyMat = new THREE.MeshStandardMaterial({ color: 0x3a3a3a, roughness: 0.8 });
		var body = new THREE.Mesh(bodyGeo, bodyMat);
		body.position.set(0, 6, -25);
		body.castShadow = true;
		body.receiveShadow = true;
		addToScene(body);

		var leftWingGeo = new THREE.ConeGeometry(5, 10, 8);
		var wingMat = new THREE.MeshStandardMaterial({ color: 0xFF6347, emissive: 0xFF4500, emissiveIntensity: 0.4 });
		var leftWing = new THREE.Mesh(leftWingGeo, wingMat);
		leftWing.position.set(-8, 8, -25);
		leftWing.rotation.z = Math.PI * 0.4;
		leftWing.castShadow = true;
		addToScene(leftWing);

		var rightWing = new THREE.Mesh(leftWingGeo, wingMat);
		rightWing.position.set(8, 8, -25);
		rightWing.rotation.z = -Math.PI * 0.4;
		rightWing.castShadow = true;
		addToScene(rightWing);

		var headGeo = new THREE.SphereGeometry(4, 8, 8);
		var headMat = new THREE.MeshStandardMaterial({
			color: 0xFFD700,
			emissive: 0xFF6347,
			emissiveIntensity: 0.8
		});
		var head = new THREE.Mesh(headGeo, headMat);
		head.position.set(0, 16, -25);
		head.castShadow = true;
		addToScene(head);

		fires.push({
			mesh: head,
			baseScale: 1,
			initialPos: { x: 0, y: 16, z: -25 }
		});

		var neckGeo = new THREE.CylinderGeometry(2, 3, 2, 8);
		var neckMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.7 });
		var neck = new THREE.Mesh(neckGeo, neckMat);
		neck.position.set(0, 14, -25);
		neck.castShadow = true;
		addToScene(neck);
	}

	function createExitTunnel() {
		var tunnelGeo = new THREE.BoxGeometry(15, 15, 30);
		var tunnelMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.8 });
		var tunnel = new THREE.Mesh(tunnelGeo, tunnelMat);
		tunnel.position.set(0, 7.5, 40);
		tunnel.castShadow = true;
		tunnel.receiveShadow = true;
		addToScene(tunnel);

		var trapWall1Geo = new THREE.BoxGeometry(3, 15, 10);
		var trapMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
		var trapWall1 = new THREE.Mesh(trapWall1Geo, trapMat);
		trapWall1.position.set(-7, 7.5, 30);
		trapWall1.castShadow = true;
		addToScene(trapWall1);

		var trapWall2 = new THREE.Mesh(trapWall1Geo, trapMat);
		trapWall2.position.set(7, 7.5, 45);
		trapWall2.castShadow = true;
		addToScene(trapWall2);

		for (var t = 0; t < 4; t++) {
			var fireGeo = new THREE.SphereGeometry(1.5, 6, 6);
			var fireMat = new THREE.MeshStandardMaterial({
				color: 0xFF4500,
				emissive: 0xFFD700,
				emissiveIntensity: 0.6
			});
			var fire = new THREE.Mesh(fireGeo, fireMat);
			fire.position.set(-7, 3 + t * 3, 30);
			fire.castShadow = true;
			addToScene(fire);

			wallJets.push({
				mesh: fire,
				baseY: 3 + t * 3,
				baseScale: 1,
				active: false,
				timer: 0,
				basePos: { x: -7, y: 3 + t * 3, z: 30 }
			});

			var fire2Geo = new THREE.SphereGeometry(1.5, 6, 6);
			var fire2 = new THREE.Mesh(fire2Geo, fireMat);
			fire2.position.set(7, 3 + t * 3, 45);
			fire2.castShadow = true;
			addToScene(fire2);

			wallJets.push({
				mesh: fire2,
				baseY: 3 + t * 3,
				baseScale: 1,
				active: false,
				timer: 0,
				basePos: { x: 7, y: 3 + t * 3, z: 45 }
			});
		}
	}

	function init(scene, camera) {
		sceneRef = scene;
		cameraRef = camera;
		allObjects = [];
		fires = [];
		embers = [];
		wallJets = [];
		time = 0;

		createMainHall();
		createEternalFlamePillar(-20, -20);
		createEternalFlamePillar(20, -20);
		createEternalFlamePillar(-20, 20);
		createEternalFlamePillar(20, 20);
		createFireMoat();
		createPhoenixGate();
		createAltarRoom();
		createFireWallTraps();
		createEmberCascade();
		createHeatShimmerPanels();
		createFireRuneFloor();
		createBrazierChainNetwork();
		createInnerSanctum();
		createPhoenixStatue();
		createExitTunnel();
	}

	function update(delta) {
		time += delta;

		fires.forEach(function(fireObj) {
			var pulse = Math.sin(time * 3 + Math.random() * Math.PI) * 0.3 + 0.7;
			fireObj.mesh.scale.set(
				fireObj.baseScale * pulse,
				fireObj.baseScale * pulse,
				fireObj.baseScale * pulse
			);

			var wobble = Math.sin(time * 2.5 + Math.random() * Math.PI * 2) * 0.5;
			fireObj.mesh.position.y = fireObj.initialPos.y + wobble;
		});

		embers.forEach(function(ember) {
			ember.mesh.position.y -= ember.velocity * delta;
			ember.currentSway += embed.swaySpeed * delta;
			ember.mesh.position.x = ember.startX + Math.sin(ember.currentSway) * ember.swayAmount;

			if (ember.mesh.position.y < -10) {
				ember.mesh.position.y = 50 + Math.random() * 10;
				ember.currentSway = Math.random() * Math.PI * 2;
			}
		});

		wallJets.forEach(function(jet) {
			jet.timer += delta;
			if (jet.timer > 2) {
				jet.active = !jet.active;
				jet.timer = 0;
			}

			if (jet.active) {
				var jetPulse = Math.sin(time * 8) * 0.4 + 0.6;
				jet.mesh.scale.set(
					jet.baseScale * jetPulse,
					jet.baseScale * jetPulse,
					jet.baseScale * jetPulse
				);
			} else {
				jet.mesh.scale.set(jet.baseScale * 0.3, jet.baseScale * 0.3, jet.baseScale * 0.3);
			}
		});
	}

	function reset() {
		allObjects.forEach(function(obj) {
			sceneRef.remove(obj);
		});
		allObjects = [];
		fires = [];
		embers = [];
		wallJets = [];
		time = 0;
	}

	return {
		init: init,
		update: update,
		reset: reset
	};
}());
