window.JedburghFort = (function() {
  'use strict';

  var objects = [];
  var lights = [];
  var WX = 2470;
  var WZ = 2200;

  function addJedburghAbbey(scene) {
    // Main nave body - red sandstone ruins 30x16x12
    var naveGeometry = new THREE.BoxGeometry(30, 16, 12);
    var naveMaterial = new THREE.MeshLambertMaterial({ color: 0xB05050 });
    var nave = new THREE.Mesh(naveGeometry, naveMaterial);
    nave.position.set(WX + 0, 8, WZ + 0);
    scene.add(nave);
    objects.push(nave);

    // Roofless choir - shorter eastern arm
    var choirGeometry = new THREE.BoxGeometry(18, 12, 10);
    var choirMaterial = new THREE.MeshLambertMaterial({ color: 0xA84848 });
    var choir = new THREE.Mesh(choirGeometry, choirMaterial);
    choir.position.set(WX + 24, 6, WZ + 0);
    scene.add(choir);
    objects.push(choir);

    // Romanesque arcade pier 1
    var pier1Geometry = new THREE.BoxGeometry(1.5, 14, 1.5);
    var pierMaterial = new THREE.MeshLambertMaterial({ color: 0x983838 });
    var pier1 = new THREE.Mesh(pier1Geometry, pierMaterial);
    pier1.position.set(WX - 10, 7, WZ - 4.5);
    scene.add(pier1);
    objects.push(pier1);

    // Romanesque arcade pier 2
    var pier2Geometry = new THREE.BoxGeometry(1.5, 14, 1.5);
    var pier2 = new THREE.Mesh(pier2Geometry, pierMaterial);
    pier2.position.set(WX - 4, 7, WZ - 4.5);
    scene.add(pier2);
    objects.push(pier2);

    // Romanesque arcade pier 3
    var pier3Geometry = new THREE.BoxGeometry(1.5, 14, 1.5);
    var pier3 = new THREE.Mesh(pier3Geometry, pierMaterial);
    pier3.position.set(WX + 2, 7, WZ - 4.5);
    scene.add(pier3);
    objects.push(pier3);

    // Romanesque arcade pier 4
    var pier4Geometry = new THREE.BoxGeometry(1.5, 14, 1.5);
    var pier4 = new THREE.Mesh(pier4Geometry, pierMaterial);
    pier4.position.set(WX + 8, 7, WZ - 4.5);
    scene.add(pier4);
    objects.push(pier4);

    // West facade wall
    var facadeGeometry = new THREE.BoxGeometry(2, 18, 12);
    var facadeMaterial = new THREE.MeshLambertMaterial({ color: 0xB05050 });
    var facade = new THREE.Mesh(facadeGeometry, facadeMaterial);
    facade.position.set(WX - 15, 9, WZ + 0);
    scene.add(facade);
    objects.push(facade);

    // Rose window cutout box 1 (decorative inset panel upper centre)
    var rose1Geometry = new THREE.BoxGeometry(0.6, 3, 3);
    var roseMaterial = new THREE.MeshLambertMaterial({ color: 0x7A2020 });
    var rose1 = new THREE.Mesh(rose1Geometry, roseMaterial);
    rose1.position.set(WX - 15.7, 15, WZ + 0);
    scene.add(rose1);
    objects.push(rose1);

    // Rose window cutout box 2 (left lancet)
    var rose2Geometry = new THREE.BoxGeometry(0.6, 4, 1.5);
    var rose2 = new THREE.Mesh(rose2Geometry, roseMaterial);
    rose2.position.set(WX - 15.7, 10, WZ - 3);
    scene.add(rose2);
    objects.push(rose2);

    // Rose window cutout box 3 (right lancet)
    var rose3Geometry = new THREE.BoxGeometry(0.6, 4, 1.5);
    var rose3 = new THREE.Mesh(rose3Geometry, roseMaterial);
    rose3.position.set(WX - 15.7, 10, WZ + 3);
    scene.add(rose3);
    objects.push(rose3);

    // North wall standing fragment
    var northWallGeometry = new THREE.BoxGeometry(30, 10, 1.5);
    var northWallMaterial = new THREE.MeshLambertMaterial({ color: 0xB05050 });
    var northWall = new THREE.Mesh(northWallGeometry, northWallMaterial);
    northWall.position.set(WX + 0, 5, WZ + 6.5);
    scene.add(northWall);
    objects.push(northWall);

    // South wall standing fragment
    var southWallGeometry = new THREE.BoxGeometry(30, 8, 1.5);
    var southWallMaterial = new THREE.MeshLambertMaterial({ color: 0xB05050 });
    var southWall = new THREE.Mesh(southWallGeometry, southWallMaterial);
    southWall.position.set(WX + 0, 4, WZ - 6.5);
    scene.add(southWall);
    objects.push(southWall);

    // Tower stump at crossing
    var crossTowerGeometry = new THREE.BoxGeometry(8, 20, 8);
    var crossTowerMaterial = new THREE.MeshLambertMaterial({ color: 0xA04040 });
    var crossTower = new THREE.Mesh(crossTowerGeometry, crossTowerMaterial);
    crossTower.position.set(WX + 12, 10, WZ + 0);
    scene.add(crossTower);
    objects.push(crossTower);
  }

  function addMaryQueenOfScotsHouse(scene) {
    // 16th century tower house main body 8x12x7
    var towerGeometry = new THREE.BoxGeometry(8, 12, 7);
    var towerMaterial = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
    var tower = new THREE.Mesh(towerGeometry, towerMaterial);
    tower.position.set(WX - 30, 6, WZ - 20);
    scene.add(tower);
    objects.push(tower);

    // Corbelled parapet box
    var parapetGeometry = new THREE.BoxGeometry(9, 1.5, 8);
    var parapetMaterial = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
    var parapet = new THREE.Mesh(parapetGeometry, parapetMaterial);
    parapet.position.set(WX - 30, 12.75, WZ - 20);
    scene.add(parapet);
    objects.push(parapet);

    // Stair tower
    var stairGeometry = new THREE.BoxGeometry(3, 12, 3);
    var stairMaterial = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
    var stair = new THREE.Mesh(stairGeometry, stairMaterial);
    stair.position.set(WX - 25.5, 6, WZ - 20);
    scene.add(stair);
    objects.push(stair);

    // Entrance porch
    var porchGeometry = new THREE.BoxGeometry(3, 5, 4);
    var porchMaterial = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });
    var porch = new THREE.Mesh(porchGeometry, porchMaterial);
    porch.position.set(WX - 30, 2.5, WZ - 23.5);
    scene.add(porch);
    objects.push(porch);

    // Chimney stack
    var chimneyGeometry = new THREE.BoxGeometry(1.5, 4, 1.5);
    var chimneyMaterial = new THREE.MeshLambertMaterial({ color: 0x7A6A58 });
    var chimney = new THREE.Mesh(chimneyGeometry, chimneyMaterial);
    chimney.position.set(WX - 33, 16, WZ - 20);
    scene.add(chimney);
    objects.push(chimney);
  }

  function addFerniehirstCastle(scene) {
    // Main tower house 10x14x10
    var mainGeometry = new THREE.BoxGeometry(10, 14, 10);
    var mainMaterial = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
    var mainTower = new THREE.Mesh(mainGeometry, mainMaterial);
    mainTower.position.set(WX + 45, 7, WZ - 40);
    scene.add(mainTower);
    objects.push(mainTower);

    // L-plan wing 12x10x8
    var wingGeometry = new THREE.BoxGeometry(12, 10, 8);
    var wingMaterial = new THREE.MeshLambertMaterial({ color: 0x9A8A78 });
    var wing = new THREE.Mesh(wingGeometry, wingMaterial);
    wing.position.set(WX + 55, 5, WZ - 45);
    scene.add(wing);
    objects.push(wing);

    // Bartizans (corner turrets) - small cylinder on each corner of main tower
    var bartizanGeometry = new THREE.CylinderGeometry(1.2, 1.2, 4, 8);
    var bartizanMaterial = new THREE.MeshLambertMaterial({ color: 0x8A7A68 });

    var bart1 = new THREE.Mesh(bartizanGeometry, bartizanMaterial);
    bart1.position.set(WX + 40, 16, WZ - 35);
    scene.add(bart1);
    objects.push(bart1);

    var bart2 = new THREE.Mesh(bartizanGeometry, bartizanMaterial);
    bart2.position.set(WX + 50, 16, WZ - 35);
    scene.add(bart2);
    objects.push(bart2);

    var bart3 = new THREE.Mesh(bartizanGeometry, bartizanMaterial);
    bart3.position.set(WX + 40, 16, WZ - 45);
    scene.add(bart3);
    objects.push(bart3);

    // Cliff base below castle
    var cliffGeometry = new THREE.BoxGeometry(20, 8, 16);
    var cliffMaterial = new THREE.MeshLambertMaterial({ color: 0x6A7050 });
    var cliff = new THREE.Mesh(cliffGeometry, cliffMaterial);
    cliff.position.set(WX + 45, -4, WZ - 40);
    scene.add(cliff);
    objects.push(cliff);

    // Wooded approach trees (cylinders for trunks, cones for canopy)
    var trunkGeometry = new THREE.CylinderGeometry(0.5, 0.7, 5, 6);
    var trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x4A3020 });
    var canopyGeometry = new THREE.ConeGeometry(3, 6, 6);
    var canopyMaterial = new THREE.MeshLambertMaterial({ color: 0x2A5020 });

    var treePositions = [
      [WX + 35, 0, WZ - 30],
      [WX + 32, 0, WZ - 35],
      [WX + 38, 0, WZ - 28],
      [WX + 60, 0, WZ - 35],
      [WX + 62, 0, WZ - 42]
    ];

    for (var t = 0; t < treePositions.length; t++) {
      var trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.set(treePositions[t][0], treePositions[t][1] + 2.5, treePositions[t][2]);
      scene.add(trunk);
      objects.push(trunk);

      var canopy = new THREE.Mesh(canopyGeometry, canopyMaterial);
      canopy.position.set(treePositions[t][0], treePositions[t][1] + 8, treePositions[t][2]);
      scene.add(canopy);
      objects.push(canopy);
    }
  }

  function addReiversPeelTower(scene) {
    // Main peel tower 6x12x6 grey stone
    var peelGeometry = new THREE.BoxGeometry(6, 12, 6);
    var peelMaterial = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
    var peel = new THREE.Mesh(peelGeometry, peelMaterial);
    peel.position.set(WX - 50, 6, WZ + 30);
    scene.add(peel);
    objects.push(peel);

    // Battlements on top
    var battleGeometry = new THREE.BoxGeometry(7, 2, 7);
    var battleMaterial = new THREE.MeshLambertMaterial({ color: 0x7A7A7A });
    var battlement = new THREE.Mesh(battleGeometry, battleMaterial);
    battlement.position.set(WX - 50, 13, WZ + 30);
    scene.add(battlement);
    objects.push(battlement);

    // Merlons (alternating raised sections)
    var merlonGeometry = new THREE.BoxGeometry(2, 1.5, 1);
    var merlonMaterial = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });

    var merlonOffsets = [-2.5, 0, 2.5];
    for (var m = 0; m < merlonOffsets.length; m++) {
      var merlonN = new THREE.Mesh(merlonGeometry, merlonMaterial);
      merlonN.position.set(WX - 50 + merlonOffsets[m], 15, WZ + 26.5);
      scene.add(merlonN);
      objects.push(merlonN);

      var merlonS = new THREE.Mesh(merlonGeometry, merlonMaterial);
      merlonS.position.set(WX - 50 + merlonOffsets[m], 15, WZ + 33.5);
      scene.add(merlonS);
      objects.push(merlonS);
    }

    // Barmkin defensive wall - north side
    var barmkinNGeometry = new THREE.BoxGeometry(20, 3, 1);
    var barmkinMaterial = new THREE.MeshLambertMaterial({ color: 0x8A8A8A });
    var barmkinN = new THREE.Mesh(barmkinNGeometry, barmkinMaterial);
    barmkinN.position.set(WX - 50, 1.5, WZ + 20);
    scene.add(barmkinN);
    objects.push(barmkinN);

    // Barmkin defensive wall - south side
    var barmkinSGeometry = new THREE.BoxGeometry(20, 3, 1);
    var barmkinS = new THREE.Mesh(barmkinSGeometry, barmkinMaterial);
    barmkinS.position.set(WX - 50, 1.5, WZ + 40);
    scene.add(barmkinS);
    objects.push(barmkinS);

    // Barmkin defensive wall - west side
    var barmkinWGeometry = new THREE.BoxGeometry(1, 3, 20);
    var barmkinW = new THREE.Mesh(barmkinWGeometry, barmkinMaterial);
    barmkinW.position.set(WX - 60, 1.5, WZ + 30);
    scene.add(barmkinW);
    objects.push(barmkinW);

    // Barmkin defensive wall - east side
    var barmkinEGeometry = new THREE.BoxGeometry(1, 3, 20);
    var barmkinE = new THREE.Mesh(barmkinEGeometry, barmkinMaterial);
    barmkinE.position.set(WX - 40, 1.5, WZ + 30);
    scene.add(barmkinE);
    objects.push(barmkinE);

    // Barmkin gateway
    var gatewayGeometry = new THREE.BoxGeometry(4, 4, 1.5);
    var gatewayMaterial = new THREE.MeshLambertMaterial({ color: 0x6A6A6A });
    var gateway = new THREE.Mesh(gatewayGeometry, gatewayMaterial);
    gateway.position.set(WX - 50, 2, WZ + 20);
    scene.add(gateway);
    objects.push(gateway);

    // Farmhouse body attached to barmkin
    var farmGeometry = new THREE.BoxGeometry(8, 4, 6);
    var farmMaterial = new THREE.MeshLambertMaterial({ color: 0x9A9A88 });
    var farm = new THREE.Mesh(farmGeometry, farmMaterial);
    farm.position.set(WX - 55, 2, WZ + 30);
    scene.add(farm);
    objects.push(farm);
  }

  function addJedburghJail(scene) {
    // Georgian circular prison - cylinder r=8 h=12
    var jailGeometry = new THREE.CylinderGeometry(8, 8, 12, 16);
    var jailMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var jail = new THREE.Mesh(jailGeometry, jailMaterial);
    jail.position.set(WX - 20, 6, WZ + 50);
    scene.add(jail);
    objects.push(jail);

    // Roof dome
    var domeGeometry = new THREE.SphereGeometry(8.5, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.4);
    var domeMaterial = new THREE.MeshLambertMaterial({ color: 0x777777 });
    var dome = new THREE.Mesh(domeGeometry, domeMaterial);
    dome.position.set(WX - 20, 12, WZ + 50);
    scene.add(dome);
    objects.push(dome);

    // Radial wing north
    var wingNGeometry = new THREE.BoxGeometry(4, 8, 18);
    var wingMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var wingN = new THREE.Mesh(wingNGeometry, wingMaterial);
    wingN.position.set(WX - 20, 4, WZ + 59);
    scene.add(wingN);
    objects.push(wingN);

    // Radial wing east
    var wingEGeometry = new THREE.BoxGeometry(18, 8, 4);
    var wingE = new THREE.Mesh(wingEGeometry, wingMaterial);
    wingE.position.set(WX - 11, 4, WZ + 50);
    scene.add(wingE);
    objects.push(wingE);

    // Radial wing west
    var wingWGeometry = new THREE.BoxGeometry(18, 8, 4);
    var wingW = new THREE.Mesh(wingWGeometry, wingMaterial);
    wingW.position.set(WX - 29, 4, WZ + 50);
    scene.add(wingW);
    objects.push(wingW);

    // Entrance portico
    var porticoGeometry = new THREE.BoxGeometry(6, 10, 4);
    var porticoMaterial = new THREE.MeshLambertMaterial({ color: 0x999999 });
    var portico = new THREE.Mesh(porticoGeometry, porticoMaterial);
    portico.position.set(WX - 20, 5, WZ + 41);
    scene.add(portico);
    objects.push(portico);

    // Prison wall enclosure
    var prisonWallNGeometry = new THREE.BoxGeometry(30, 4, 1);
    var prisonWallMaterial = new THREE.MeshLambertMaterial({ color: 0x888888 });
    var prisonWallN = new THREE.Mesh(prisonWallNGeometry, prisonWallMaterial);
    prisonWallN.position.set(WX - 20, 2, WZ + 35);
    scene.add(prisonWallN);
    objects.push(prisonWallN);

    var prisonWallSGeometry = new THREE.BoxGeometry(30, 4, 1);
    var prisonWallS = new THREE.Mesh(prisonWallSGeometry, prisonWallMaterial);
    prisonWallS.position.set(WX - 20, 2, WZ + 68);
    scene.add(prisonWallS);
    objects.push(prisonWallS);

    var prisonWallEGeometry = new THREE.BoxGeometry(1, 4, 33);
    var prisonWallE = new THREE.Mesh(prisonWallEGeometry, prisonWallMaterial);
    prisonWallE.position.set(WX - 5, 2, WZ + 51.5);
    scene.add(prisonWallE);
    objects.push(prisonWallE);

    var prisonWallWGeometry = new THREE.BoxGeometry(1, 4, 33);
    var prisonWallW = new THREE.Mesh(prisonWallWGeometry, prisonWallMaterial);
    prisonWallW.position.set(WX - 35, 2, WZ + 51.5);
    scene.add(prisonWallW);
    objects.push(prisonWallW);
  }

  function addRiverJed(scene) {
    // River Jed winding through valley - series of water boxes
    var waterMaterial = new THREE.MeshLambertMaterial({ color: 0x4477AA });

    // Upstream section 1
    var river1Geometry = new THREE.BoxGeometry(6, 0.4, 40);
    var river1 = new THREE.Mesh(river1Geometry, waterMaterial);
    river1.position.set(WX + 20, 0.2, WZ + 20);
    scene.add(river1);
    objects.push(river1);

    // Bend section 1
    var riverB1Geometry = new THREE.BoxGeometry(20, 0.4, 6);
    var riverB1 = new THREE.Mesh(riverB1Geometry, waterMaterial);
    riverB1.position.set(WX + 30, 0.2, WZ + 40);
    scene.add(riverB1);
    objects.push(riverB1);

    // Middle section flowing south
    var river2Geometry = new THREE.BoxGeometry(6, 0.4, 35);
    var river2 = new THREE.Mesh(river2Geometry, waterMaterial);
    river2.position.set(WX + 40, 0.2, WZ + 57);
    scene.add(river2);
    objects.push(river2);

    // Bend section 2 west
    var riverB2Geometry = new THREE.BoxGeometry(25, 0.4, 6);
    var riverB2 = new THREE.Mesh(riverB2Geometry, waterMaterial);
    riverB2.position.set(WX + 28, 0.2, WZ + 74);
    scene.add(riverB2);
    objects.push(riverB2);

    // Downstream section
    var river3Geometry = new THREE.BoxGeometry(6, 0.4, 30);
    var river3 = new THREE.Mesh(river3Geometry, waterMaterial);
    river3.position.set(WX + 15, 0.2, WZ + 88);
    scene.add(river3);
    objects.push(river3);

    // Narrow gorge section upstream of abbey
    var gorgeGeometry = new THREE.BoxGeometry(5, 0.4, 30);
    var gorge = new THREE.Mesh(gorgeGeometry, waterMaterial);
    gorge.position.set(WX + 20, 0.2, WZ - 10);
    scene.add(gorge);
    objects.push(gorge);

    // River bank gravel bar
    var gravel1Geometry = new THREE.BoxGeometry(12, 0.3, 10);
    var gravelMaterial = new THREE.MeshLambertMaterial({ color: 0xCCBB99 });
    var gravel1 = new THREE.Mesh(gravel1Geometry, gravelMaterial);
    gravel1.position.set(WX + 26, 0.15, WZ + 45);
    scene.add(gravel1);
    objects.push(gravel1);

    // River bank gravel bar 2
    var gravel2Geometry = new THREE.BoxGeometry(8, 0.3, 12);
    var gravel2 = new THREE.Mesh(gravel2Geometry, gravelMaterial);
    gravel2.position.set(WX + 44, 0.15, WZ + 65);
    scene.add(gravel2);
    objects.push(gravel2);
  }

  function addTownStreets(scene) {
    // Market place ground - flat box
    var marketGeometry = new THREE.BoxGeometry(30, 0.3, 30);
    var marketMaterial = new THREE.MeshLambertMaterial({ color: 0x999988 });
    var market = new THREE.Mesh(marketGeometry, marketMaterial);
    market.position.set(WX - 15, 0.15, WZ + 15);
    scene.add(market);
    objects.push(market);

    // Market cross monument - cylinder pedestal
    var crossBaseGeometry = new THREE.CylinderGeometry(1.5, 2, 2, 8);
    var crossBaseMaterial = new THREE.MeshLambertMaterial({ color: 0xAAAAAA });
    var crossBase = new THREE.Mesh(crossBaseGeometry, crossBaseMaterial);
    crossBase.position.set(WX - 15, 1, WZ + 15);
    scene.add(crossBase);
    objects.push(crossBase);

    var crossShaftGeometry = new THREE.CylinderGeometry(0.5, 0.5, 5, 6);
    var crossShaftMaterial = new THREE.MeshLambertMaterial({ color: 0xBBBBBB });
    var crossShaft = new THREE.Mesh(crossShaftGeometry, crossShaftMaterial);
    crossShaft.position.set(WX - 15, 4.5, WZ + 15);
    scene.add(crossShaft);
    objects.push(crossShaft);

    // Townhouse row 1
    var house1Geometry = new THREE.BoxGeometry(6, 7, 5);
    var houseMaterial = new THREE.MeshLambertMaterial({ color: 0xBBAA99 });
    var house1 = new THREE.Mesh(house1Geometry, houseMaterial);
    house1.position.set(WX - 20, 3.5, WZ + 5);
    scene.add(house1);
    objects.push(house1);

    var house2Geometry = new THREE.BoxGeometry(6, 6, 5);
    var house2 = new THREE.Mesh(house2Geometry, houseMaterial);
    house2.position.set(WX - 27, 3, WZ + 5);
    scene.add(house2);
    objects.push(house2);

    var house3Geometry = new THREE.BoxGeometry(6, 8, 5);
    var house3 = new THREE.Mesh(house3Geometry, houseMaterial);
    house3.position.set(WX - 13, 4, WZ + 5);
    scene.add(house3);
    objects.push(house3);

    // Road surface running through town
    var roadGeometry = new THREE.BoxGeometry(8, 0.2, 80);
    var roadMaterial = new THREE.MeshLambertMaterial({ color: 0x777766 });
    var road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.position.set(WX - 15, 0.1, WZ + 50);
    scene.add(road);
    objects.push(road);
  }

  function addLights(scene) {
    // Warm afternoon light over the Borders
    var ambientLight = new THREE.AmbientLight(0xFFDDAA, 0.6);
    scene.add(ambientLight);
    lights.push(ambientLight);

    // Sun from south-west, casting shadows on abbey ruins
    var sunLight = new THREE.PointLight(0xFFEE99, 1.2);
    sunLight.position.set(WX - 40, 40, WZ + 60);
    scene.add(sunLight);
    lights.push(sunLight);

    // Abbey interior glow - warm amber
    var abbeyLight = new THREE.PointLight(0xCC8844, 0.8);
    abbeyLight.position.set(WX + 5, 12, WZ + 0);
    scene.add(abbeyLight);
    lights.push(abbeyLight);

    // Jail area cool grey light
    var jailLight = new THREE.PointLight(0xCCCCDD, 0.7);
    jailLight.position.set(WX - 20, 20, WZ + 50);
    scene.add(jailLight);
    lights.push(jailLight);

    // Ferniehirst castle spotlight
    var castleLight = new THREE.PointLight(0xFFDD88, 0.9);
    castleLight.position.set(WX + 45, 25, WZ - 40);
    scene.add(castleLight);
    lights.push(castleLight);
  }

  function buildEnvironment(scene) {
    addJedburghAbbey(scene);
    addMaryQueenOfScotsHouse(scene);
    addFerniehirstCastle(scene);
    addReiversPeelTower(scene);
    addJedburghJail(scene);
    addRiverJed(scene);
    addTownStreets(scene);
    addLights(scene);
  }

  function update(delta) {
    // Static environment - no animated elements
    void delta;
  }

  function reset() {
    for (var i = 0; i < objects.length; i++) {
      objects[i].geometry.dispose();
      objects[i].material.dispose();
    }
    objects.length = 0;

    for (var j = 0; j < lights.length; j++) {
      if (lights[j].dispose) {
        lights[j].dispose();
      }
    }
    lights.length = 0;
  }

  return {
    build: buildEnvironment,
    update: update,
    reset: reset,
    objects: objects,
    lights: lights
  };
}());
