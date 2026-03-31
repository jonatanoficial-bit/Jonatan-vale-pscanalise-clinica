
const LAND_POLYS = [
  [[110,120],[250,80],[330,120],[360,230],[300,330],[230,300],[160,240],[100,180]],
  [[280,340],[360,330],[410,400],[400,530],[340,690],[270,620],[250,500]],
  [[560,120],[690,90],[760,130],[750,220],[640,220],[590,170]],
  [[620,230],[720,250],[770,330],[760,470],[710,620],[640,610],[600,500],[590,380]],
  [[760,120],[1010,130],[1120,220],[1110,320],[1020,350],[950,300],[850,320],[800,250]],
  [[980,520],[1090,540],[1140,620],[1040,670],[950,620]],
  [[460,650],[530,640],[560,690],[500,720],[440,700]]
];

(() => {
  const qs = s => document.querySelector(s);
  const qsa = s => [...document.querySelectorAll(s)];
  const saveKey = 'submarineCommanderV220';

  const avatars = [
    { id:'captain', name:'Captain', real:true, src:'./assets/images/avatars/captain.png', desc:'Perfil principal de liderança.' },
    { id:'navigator', name:'Navigator', real:true, src:'./assets/images/avatars/navigator.png', desc:'Perfil estratégico com leitura tática.' },
    { id:'placeholder1', name:'Avatar 3', real:false, desc:'Placeholder provisório.' },
    { id:'placeholder2', name:'Avatar 4', real:false, desc:'Placeholder provisório.' },
    { id:'placeholder3', name:'Avatar 5', real:false, desc:'Placeholder provisório.' }
  ];
  const missions = [
    { id:'atlantic', name:'Batalha do Atlântico', brief:'Intercepte um comboio e sobreviva ao contra-ataque das escoltas.' },
    { id:'mediterranean', name:'Teatro do Mediterrâneo', brief:'Infiltre-se em águas apertadas, detecte contatos e recue vivo.' },
    { id:'pacific', name:'Frente do Pacífico', brief:'Patrulha longa com encontro imprevisível de alvos militares.' }
  ];
  const worlds = [
    { id:'north', name:'Atlântico Norte', brief:'Comboios e escoltas frequentes.' },
    { id:'med', name:'Mediterrâneo', brief:'Rotas estreitas e contato rápido.' },
    { id:'norway', name:'Mar da Noruega', brief:'Águas frias, visibilidade irregular.' }
  ];
  const storeItems = [
    { id:'torpedoes', name:'Torpedos extras', cost:90, effect:'+2 torpedos' },
    { id:'hull', name:'Blindagem de casco', cost:180, effect:'+15 casco' },
    { id:'sonar', name:'Sonar refinado', cost:150, effect:'+15 sonar' }
  ];
  const assetPaths = {
    playerSub:'./assets/images/vessels/player_sub.png',
    escort:'./assets/images/vessels/escort.png',
    cargo:'./assets/images/vessels/cargo.png',
    enemySub:'./assets/images/vessels/enemy_sub.png',
    torpedo:'./assets/images/effects/torpedo.png',
    explosion:'./assets/images/effects/explosion.png',
    sonar:'./assets/images/effects/sonar.png'
  };
  const assets = {};

  const state = {
    avatar:'captain',
    mission:'atlantic',
    world:'north',
    tab:'overview',
    mode:'start',
    career:{ xp:0, credits:240, upgrades:[], completed:0, rank:'Cadete' },
    nav:{
      title:'', subtitle:'',
      zoom:1, panX:0, panY:0,
      heading:0, speed:0, noise:0,
      player:{ x:520, y:210 },
      pulse:0,
      feed:'Pronto para navegar.',
      encounterCooldown:0
    },
    battle:{
      title:'', subtitle:'',
      heading:0, targetHeading:0,
      speed:0, targetSpeed:0,
      depth:0, targetDepth:0,
      hull:100, engine:100, sonarSys:100, torpedoes:6,
      pulse:0,
      player:{x:260,y:380,w:280,h:120},
      enemies:[], contacts:[], torps:[], explosions:[]
    }
  };

  function saveState(){
    localStorage.setItem(saveKey, JSON.stringify({ avatar:state.avatar, mission:state.mission, world:state.world, career:state.career }));
  }
  function loadState(){
    try{
      const raw = localStorage.getItem(saveKey);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (data.avatar) state.avatar = data.avatar;
      if (data.mission) state.mission = data.mission;
      if (data.world) state.world = data.world;
      if (data.career) state.career = data.career;
      return true;
    }catch(e){ return false; }
  }
  function rankFromXP(xp){
    if (xp >= 1200) return 'Capitão';
    if (xp >= 700) return 'Comandante';
    if (xp >= 350) return 'Tenente Comandante';
    if (xp >= 120) return 'Tenente';
    return 'Cadete';
  }
  function selectedAvatar(){ return avatars.find(a => a.id===state.avatar) || avatars[0]; }
  function selectedMission(){ return missions.find(m => m.id===state.mission) || missions[0]; }
  function selectedWorld(){ return worlds.find(w => w.id===state.world) || worlds[0]; }
  function avatarSrc(){ return selectedAvatar().real ? selectedAvatar().src : './assets/images/avatars/captain.png'; }

  function show(screen){
    qsa('.screen').forEach(el => el.classList.remove('active'));
    qs('#screen-' + screen).classList.add('active');
    state.mode = screen;
  }

  function loadImage(key, src){
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve({key,img,ok:true});
      img.onerror = () => resolve({key,img:null,ok:false});
      img.src = src;
    });
  }

  function pointInPoly(x, y, poly){
    let inside = false;
    for (let i=0,j=poly.length-1;i<poly.length;j=i++){
      const xi = poly[i][0], yi = poly[i][1];
      const xj = poly[j][0], yj = poly[j][1];
      const intersect = ((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }
  function isLand(x, y){
    return LAND_POLYS.some(poly => pointInPoly(x, y, poly));
  }

  function renderAvatarGrid(){
    const grid = qs('#avatarGrid');
    grid.innerHTML = '';
    avatars.forEach(a => {
      const btn = document.createElement('button');
      btn.className = 'avatar-btn' + (a.id===state.avatar ? ' selected' : '');
      btn.innerHTML = a.real ? `<img src="${a.src}" alt="${a.name}"><span>${a.name}</span>` : `<div class="avatar-placeholder">PROVISÓRIO</div><span>${a.name}</span>`;
      btn.onclick = () => { state.avatar = a.id; renderAvatarGrid(); };
      grid.appendChild(btn);
    });
  }

  function applyUpgrades(){
    state.battle.torpedoes = 6 + (state.career.upgrades.includes('torpedoes') ? 2 : 0);
    state.battle.hull = 100 + (state.career.upgrades.includes('hull') ? 15 : 0);
    state.battle.sonarSys = 100 + (state.career.upgrades.includes('sonar') ? 15 : 0);
    state.battle.engine = 100;
  }

  function renderLobby(){
    state.career.rank = rankFromXP(state.career.xp);
    qs('#profileAvatar').src = avatarSrc();
    qs('#profileRank').textContent = `${state.career.rank} • ${selectedAvatar().name}`;
    qs('#profileStats').textContent = `XP ${state.career.xp} • Créditos ${state.career.credits} • Missões ${state.career.completed}`;
    const subInfo = [
      ['Classe','Atlântico Mk.I'],
      ['Casco', Math.round(state.battle.hull) + '%'],
      ['Motor', Math.round(state.battle.engine) + '%'],
      ['Sonar', Math.round(state.battle.sonarSys) + '%'],
      ['Torpedos', state.battle.torpedoes]
    ];
    qs('#subInfo').innerHTML = subInfo.map(([l,v]) => `<div class="stat-card"><div class="label">${l}</div><div class="value">${v}</div></div>`).join('');

    qs('#careerSummary').innerHTML = [
      `Patente atual: ${state.career.rank}`,
      `Avatar ativo: ${selectedAvatar().name}`,
      `Créditos: ${state.career.credits}`,
      `Melhorias: ${state.career.upgrades.length}`,
      `Dano por sistemas já integrado nesta fase`
    ].join('<br>');
    qs('#lastReport').innerHTML = [
      'Mapa mundi navegável com zoom.',
      'Movimento só na água e bloqueio por terra.',
      'Sonar com contatos imperfeitos.',
      'Dano por casco, motor e sonar.',
      'Profundidade crítica e ruído operacional.'
    ].join('<br>');

    qsa('.lobby-tab').forEach(el => el.classList.remove('active'));
    qs('#tab-' + state.tab).classList.add('active');
    qsa('.tab-btn').forEach(btn => btn.classList.toggle('active', btn.dataset.tab === state.tab));

    const missionList = qs('#missionList');
    missionList.innerHTML = '';
    missions.forEach(m => {
      const d = document.createElement('div');
      d.className = 'mission-item' + (m.id===state.mission ? ' active' : '');
      d.innerHTML = `<strong>${m.name}</strong><div class="muted">${m.brief}</div>`;
      d.onclick = () => { state.mission = m.id; renderLobby(); };
      missionList.appendChild(d);
    });
    qs('#missionBrief').innerHTML = `<strong>${selectedMission().name}</strong><br><br>${selectedMission().brief}`;

    const worldList = qs('#worldList');
    worldList.innerHTML = '';
    worlds.forEach(w => {
      const d = document.createElement('div');
      d.className = 'world-item' + (w.id===state.world ? ' active' : '');
      d.innerHTML = `<strong>${w.name}</strong><div class="muted">${w.brief}</div>`;
      d.onclick = () => { state.world = w.id; renderLobby(); };
      worldList.appendChild(d);
    });

    const storeList = qs('#storeList');
    storeList.innerHTML = '';
    storeItems.forEach(i => {
      const owned = state.career.upgrades.includes(i.id);
      const d = document.createElement('div');
      d.className = 'store-item' + (owned ? ' active' : '');
      d.innerHTML = `<strong>${i.name}</strong><div class="muted">${i.effect}</div><div class="muted">Custo: ${i.cost} ${owned ? '• comprado' : ''}</div>`;
      d.onclick = () => {
        if (owned || state.career.credits < i.cost) return;
        state.career.credits -= i.cost;
        state.career.upgrades.push(i.id);
        applyUpgrades();
        renderLobby();
        saveState();
      };
      storeList.appendChild(d);
    });
  }

  function startNav(mode){
    state.nav.title = mode === 'mission' ? selectedMission().name : `Patrulha: ${selectedWorld().name}`;
    state.nav.subtitle = mode === 'mission' ? selectedMission().brief : selectedWorld().brief;
    state.nav.zoom = 1;
    state.nav.heading = 0;
    state.nav.speed = 0;
    state.nav.noise = 0;
    state.nav.pulse = 0;
    state.nav.feed = 'Navegação iniciada. Mantenha curso em águas abertas.';
    state.nav.encounterCooldown = 240;
    state.nav.player = mode === 'mission' ? { x: 520, y: 210 } : (state.world === 'med' ? { x: 680, y: 240 } : state.world === 'norway' ? { x: 610, y: 100 } : { x: 360, y: 160 });
    qs('#navTitle').textContent = state.nav.title;
    qs('#navSub').textContent = state.nav.subtitle;
    show('navmap');
  }

  function startBattleFromEncounter(encounterType){
    applyUpgrades();
    state.battle.title = encounterType === 'enemySub' ? 'Contato submarino hostil' : encounterType === 'escort' ? 'Escolta detectada' : 'Contato naval';
    state.battle.subtitle = 'IA tática reage por distância, profundidade, ruído e tipo de alvo.';
    state.battle.heading = 0; state.battle.targetHeading = 0;
    state.battle.speed = 0; state.battle.targetSpeed = 0;
    state.battle.depth = 0; state.battle.targetDepth = 0;
    state.battle.player = {x:260,y:380,w:280,h:120};
    state.battle.pulse = 0;
    state.battle.contacts = [];
    state.battle.torps = [];
    state.battle.explosions = [];
    state.battle.enemies = [
      { type:'escort', x:980, y:180, w:250, h:110, hp:100, speed:0.3, alive:true, state:'patrol', detect:0.2 },
      { type:'cargo', x:1050, y:390, w:260, h:120, hp:90, speed:0.2, alive:true, state:'patrol', detect:0.15 },
      { type:'enemySub', x:990, y:600, w:250, h:105, hp:85, speed:0.24, alive:true, state:'silent', detect:0.1 },
    ];
    if (encounterType === 'enemySub') state.battle.enemies = [state.battle.enemies[2]];
    if (encounterType === 'escort') state.battle.enemies = [state.battle.enemies[0], state.battle.enemies[1]];
    qs('#battleTitle').textContent = state.battle.title;
    qs('#battleSub').textContent = state.battle.subtitle;
    qs('#officerFeed').textContent = 'Oficiais aguardando ordens.';
    qs('#tacticalFeed').textContent = 'Nenhum contato confirmado.';
    updateBattleInstruments();
    show('battle');
  }

  function updateBattleInstruments(){
    qs('#depthValue').textContent = `${Math.round(state.battle.depth)} m`;
    qs('#headingValue').textContent = `${String((Math.round(state.battle.heading)%360+360)%360).padStart(3,'0')}°`;
    qs('#speedValue').textContent = `${Math.round(state.battle.speed)} nós`;
    qs('#hullValue').textContent = `${Math.max(0, Math.round(state.battle.hull))}%`;
    qs('#engineValue').textContent = `${Math.max(0, Math.round(state.battle.engine))}%`;
    qs('#sonarValue').textContent = `${Math.max(0, Math.round(state.battle.sonarSys))}%`;
    qs('#depthFill').style.width = Math.min(100, state.battle.depth / 3) + '%';
    qs('#headingFill').style.width = ((state.battle.heading % 360 + 360) % 360) / 3.6 + '%';
    qs('#speedFill').style.width = Math.min(100, state.battle.speed * 10) + '%';
    const mapFill = [
      ['hullFill', state.battle.hull],
      ['engineFill', state.battle.engine],
      ['sonarSysFill', state.battle.sonarSys]
    ];
    mapFill.forEach(([id,val]) => {
      const pct = Math.max(0, Math.min(100, val));
      const fill = qs('#' + id);
      fill.style.width = pct + '%';
      fill.className = 'fill ' + (pct > 60 ? 'safe' : pct > 30 ? 'warn' : 'danger');
    });
  }

  function drawImageSafe(ctx, img, x, y, w, h, fallback){
    if (img && img.complete && img.naturalWidth > 0) ctx.drawImage(img, x - w/2, y - h/2, w, h);
    else fallback();
  }
  function fallbackSub(ctx, x, y, w, h, color){
    ctx.save(); ctx.translate(x,y); ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(-w*0.45,0); ctx.lineTo(w*0.22,-h*0.26); ctx.lineTo(w*0.48,0); ctx.lineTo(w*0.22,h*0.26); ctx.closePath(); ctx.fill();
    ctx.fillRect(-12,-16,24,32); ctx.restore();
  }

  function worldLoop(){
    const canvas = qs('#worldCanvas');
    const ctx = canvas.getContext('2d');
    function step(){
      if (!qs('#screen-navmap').classList.contains('active')) { requestAnimationFrame(step); return; }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle = '#0d3151';
      ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      for (let x=0;x<canvas.width;x+=80){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
      for (let y=0;y<canvas.height;y+=80){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

      const z = state.nav.zoom;
      const vpW = canvas.width / z;
      const vpH = canvas.height / z;
      state.nav.panX = Math.max(0, Math.min(1280 - vpW, state.nav.player.x - vpW/2));
      state.nav.panY = Math.max(0, Math.min(760 - vpH, state.nav.player.y - vpH/2));

      ctx.save();
      ctx.scale(z, z);
      ctx.translate(-state.nav.panX, -state.nav.panY);

      ctx.fillStyle = '#2e3f2b';
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      LAND_POLYS.forEach(poly => {
        ctx.beginPath();
        ctx.moveTo(poly[0][0], poly[0][1]);
        poly.slice(1).forEach(p => ctx.lineTo(p[0], p[1]));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      });

      const rad = (state.nav.heading - 90) * Math.PI / 180;
      const candidateX = state.nav.player.x + Math.cos(rad) * state.nav.speed * 0.35;
      const candidateY = state.nav.player.y + Math.sin(rad) * state.nav.speed * 0.35;
      if (!isLand(candidateX, candidateY)) {
        state.nav.player.x = Math.max(20, Math.min(1260, candidateX));
        state.nav.player.y = Math.max(20, Math.min(740, candidateY));
      } else {
        state.nav.feed = 'Rota bloqueada por terra. Ajuste o curso.';
        state.nav.speed = 0;
      }

      state.nav.noise = state.nav.speed * 8 + (state.nav.pulse > 0 ? 15 : 0);

      if (state.nav.pulse > 0){
        const size = 140 + state.nav.pulse * 2.6;
        ctx.save();
        ctx.globalAlpha = Math.min(0.45, state.nav.pulse / 100);
        if (assets.sonar && assets.sonar.naturalWidth > 0) ctx.drawImage(assets.sonar, state.nav.player.x - size/2, state.nav.player.y - size/2, size, size);
        ctx.restore();
        state.nav.pulse -= 1;
      }

      drawImageSafe(ctx, assets.playerSub, state.nav.player.x, state.nav.player.y, 110, 48, () => fallbackSub(ctx, state.nav.player.x, state.nav.player.y, 110, 48, '#55c8ff'));
      ctx.restore();

      if (state.nav.encounterCooldown > 0) state.nav.encounterCooldown -= 1;
      if (state.nav.speed > 0 && state.nav.encounterCooldown === 0){
        const chance = Math.min(0.03, 0.004 + state.nav.noise / 1200);
        if (Math.random() < chance){
          const roll = Math.random();
          const encounter = roll < 0.34 ? 'cargo' : roll < 0.67 ? 'escort' : 'enemySub';
          state.nav.feed = encounter === 'enemySub' ? 'Contato submarino detectado.' : encounter === 'escort' ? 'Escolta hostil no setor.' : 'Tráfego naval identificado.';
          state.nav.encounterCooldown = 600;
          startBattleFromEncounter(encounter);
        }
      }

      qs('#mapNameValue').textContent = state.nav.title;
      qs('#zoomValue').textContent = state.nav.zoom.toFixed(1) + 'x';
      qs('#courseValue').textContent = `${String((Math.round(state.nav.heading)%360+360)%360).padStart(3,'0')}°`;
      qs('#mapSpeedValue').textContent = Math.round(state.nav.speed) + ' nós';
      qs('#mapFeed').textContent = `${state.nav.feed} | Ruído: ${Math.round(state.nav.noise)}`;

      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function updateContacts(){
    const player = state.battle.player;
    const noise = state.battle.speed * 8 + (state.battle.depth < 20 ? 10 : state.battle.depth < 80 ? 5 : 2);
    state.battle.contacts = state.battle.enemies.filter(e => e.alive).map(e => {
      const dx = e.x - player.x;
      const dy = e.y - player.y;
      const dist = Math.hypot(dx, dy);
      const bearing = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
      const detectBase = (state.battle.sonarSys / 100) * 100 - dist / 6 + noise / 4 + (state.battle.pulse > 0 ? 18 : 0);
      const certainty = Math.max(0, Math.min(100, detectBase + (Math.random() * 16 - 8)));
      return {
        id:e.type,
        type:e.type,
        distance:dist,
        bearing:Math.round(bearing),
        certainty,
        approxDistance: Math.round(dist + (Math.random() * 100 - 50)),
        status: certainty > 60 ? 'confirmado' : certainty > 30 ? 'suspeito' : 'fraco'
      };
    }).filter(c => c.certainty > 15).sort((a,b) => b.certainty - a.certainty);
  }

  function battleLoop(){
    const canvas = qs('#battleCanvas');
    const ctx = canvas.getContext('2d');
    function step(){
      if (!qs('#screen-battle').classList.contains('active')) { requestAnimationFrame(step); return; }
      ctx.clearRect(0,0,canvas.width,canvas.height);
      const g = ctx.createLinearGradient(0,0,0,canvas.height);
      g.addColorStop(0,'#0e314d'); g.addColorStop(0.45,'#08253a'); g.addColorStop(1,'#04101b');
      ctx.fillStyle = g; ctx.fillRect(0,0,canvas.width,canvas.height);
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      for(let x=0;x<canvas.width;x+=90){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
      for(let y=0;y<canvas.height;y+=90){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

      state.battle.heading += (state.battle.targetHeading - state.battle.heading) * 0.08;
      state.battle.speed += (state.battle.targetSpeed - state.battle.speed) * 0.06;
      state.battle.depth += (state.battle.targetDepth - state.battle.depth) * 0.05;
      if (state.battle.pulse > 0) state.battle.pulse -= 1;

      const player = state.battle.player;
      const move = state.battle.speed * 0.22 * Math.max(0.35, state.battle.engine / 100);
      player.x = Math.max(160, Math.min(500, player.x + Math.cos((state.battle.heading - 90) * Math.PI/180) * move));
      player.y = Math.max(120, Math.min(640, player.y + Math.sin((state.battle.heading - 90) * Math.PI/180) * move));

      if (state.battle.depth > 220 && Math.random() < 0.04){
        state.battle.hull -= 0.8;
        qs('#officerFeed').textContent = 'Profundidade crítica. Estrutura do casco sob pressão.';
      }

      if (state.battle.pulse > 0){
        const size = 220 + state.battle.pulse * 3;
        ctx.save(); ctx.globalAlpha = Math.min(0.55, state.battle.pulse / 100);
        drawImageSafe(ctx, assets.sonar, player.x, player.y, size, size, () => {
          ctx.strokeStyle = 'rgba(110,240,255,0.35)';
          for(let r=60;r<size/2;r+=40){ ctx.beginPath(); ctx.arc(player.x, player.y, r, 0, Math.PI*2); ctx.stroke(); }
        });
        ctx.restore();
      }

      let feed = [];
      state.battle.enemies.forEach(e => {
        if (!e.alive) return;
        const dx = player.x - e.x, dy = player.y - e.y;
        const dist = Math.hypot(dx, dy);
        const playerNoise = state.battle.speed * 8 + (state.battle.depth < 20 ? 10 : state.battle.depth < 80 ? 5 : 2);
        const detectFactor = (playerNoise / 20) + (state.battle.depth < 30 ? 0.8 : state.battle.depth < 100 ? 0.45 : 0.2);

        if (e.type === 'escort'){
          if (dist < 380 + detectFactor * 120) e.state = 'attack';
          else if (dist < 520) e.state = 'search';
          else e.state = 'patrol';
        }
        if (e.type === 'enemySub'){
          if (dist < 320 + detectFactor * 100 && state.battle.depth > 15) e.state = 'shadow';
          else if (dist < 500) e.state = 'search';
          else e.state = 'silent';
        }
        if (e.type === 'cargo'){
          e.state = dist < 300 ? 'evade' : 'patrol';
        }

        if (e.state === 'attack'){
          e.x -= e.speed * 0.20;
          e.y += (dy > 0 ? 0.18 : -0.18);
        } else if (e.state === 'search'){
          e.x -= e.speed * 0.12;
        } else if (e.state === 'shadow'){
          e.x -= e.speed * 0.16;
          e.y += (dy > 0 ? 0.1 : -0.1);
        } else if (e.state === 'evade'){
          e.x += 0.14;
        } else {
          e.x -= e.speed * 0.08;
        }

        if (dist < 200 && Math.random() < (e.type === 'escort' ? 0.012 : e.type === 'enemySub' ? 0.010 : 0.002)){
          const damage = e.type === 'escort' ? 4 + Math.random()*2 : e.type === 'enemySub' ? 5 + Math.random()*3 : 2;
          const roll = Math.random();
          if (roll < 0.5) state.battle.hull -= damage;
          else if (roll < 0.75) state.battle.engine -= damage;
          else state.battle.sonarSys -= damage;
          qs('#tacticalFeed').textContent = `Ataque recebido de ${e.type}. Danos em sistemas.`;
        }

        feed.push(`${e.type} • ${Math.round(dist)}m • ${e.state}`);

        const color = e.type === 'escort' ? '#ff8e8e' : e.type === 'cargo' ? '#ffbd8a' : '#b695ff';
        drawImageSafe(ctx, assets[e.type], e.x, e.y, e.w, e.h, () => fallbackSub(ctx, e.x, e.y, e.w, e.h, color));
        ctx.fillStyle = 'rgba(0,0,0,0.45)';
        ctx.fillRect(e.x - 52, e.y - e.h/2 - 18, 104, 8);
        ctx.fillStyle = '#67e29a';
        ctx.fillRect(e.x - 52, e.y - e.h/2 - 18, 104 * (e.hp/100), 8);
      });

      updateContacts();

      state.battle.torps.forEach(t => { t.x += t.vx; t.y += t.vy; });
      state.battle.explosions.forEach(ex => { ex.life -= 1; });
      state.battle.torps = state.battle.torps.filter(t => t.x < canvas.width + 150 && t.y > -100 && t.y < canvas.height + 100);
      state.battle.explosions = state.battle.explosions.filter(ex => ex.life > 0);

      state.battle.torps.forEach(t => {
        drawImageSafe(ctx, assets.torpedo, t.x, t.y, 110, 40, () => {
          ctx.fillStyle = '#ddd';
          ctx.fillRect(t.x - 45, t.y - 6, 90, 12);
        });
        state.battle.enemies.forEach(e => {
          if (!e.alive) return;
          const hit = Math.abs(t.x - e.x) < 80 && Math.abs(t.y - e.y) < 46;
          if (hit){
            e.hp -= 55;
            t.x = canvas.width + 999;
            state.battle.explosions.push({ x:e.x, y:e.y, size:180, life:28, maxLife:28 });
            if (e.hp <= 0){
              e.alive = false;
              state.career.xp += 80;
              state.career.credits += 55;
              state.career.completed += 1;
              state.career.rank = rankFromXP(state.career.xp);
              saveState();
            }
          }
        });
      });

      state.battle.explosions.forEach(ex => {
        ctx.save(); ctx.globalAlpha = ex.life / ex.maxLife;
        drawImageSafe(ctx, assets.explosion, ex.x, ex.y, ex.size, ex.size, () => {
          ctx.fillStyle = 'rgba(255,120,50,0.7)';
          ctx.beginPath(); ctx.arc(ex.x, ex.y, ex.size/4, 0, Math.PI*2); ctx.fill();
        });
        ctx.restore();
      });

      drawImageSafe(ctx, assets.playerSub, player.x, player.y, player.w, player.h, () => fallbackSub(ctx, player.x, player.y, player.w, player.h, state.battle.depth > 20 ? '#8fe9ff' : '#55c8ff'));

      ctx.fillStyle = 'rgba(0,0,0,0.26)';
      ctx.fillRect(canvas.width - 310, 20, 280, 160);
      ctx.fillStyle = '#d6f3ff';
      ctx.font = '16px Arial';
      ctx.fillText(`Avatar: ${selectedAvatar().name}`, canvas.width - 292, 48);
      ctx.fillText(`Torpedos: ${state.battle.torpedoes}`, canvas.width - 292, 74);
      ctx.fillText(`Profundidade alvo: ${Math.round(state.battle.targetDepth)}m`, canvas.width - 292, 100);
      ctx.fillText(`Contatos: ${state.battle.contacts.length}`, canvas.width - 292, 126);
      if (state.battle.contacts[0]) {
        const c = state.battle.contacts[0];
        ctx.fillText(`Top contato: ${c.type}`, canvas.width - 292, 152);
        ctx.fillText(`${c.status} • ${c.bearing}° • ~${c.approxDistance}m`, canvas.width - 292, 176);
      }

      const contactText = state.battle.contacts.map(c => `${c.type} • ${c.status} • bearing ${c.bearing}° • ~${c.approxDistance}m`).join(' | ');
      qs('#tacticalFeed').textContent = contactText || 'Nenhum contato confirmado.';
      updateBattleInstruments();
      state.battle.hull = Math.max(0, state.battle.hull);
      state.battle.engine = Math.max(0, state.battle.engine);
      state.battle.sonarSys = Math.max(0, state.battle.sonarSys);
      if (state.battle.hull <= 0){
        qs('#officerFeed').textContent = 'Casco crítico. Naufrágio provável.';
      }
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function initUI(){
    renderAvatarGrid();
    renderLobby();

    qs('#newGameBtn').onclick = () => show('avatar');
    qs('#continueBtn').onclick = () => { loadState(); renderAvatarGrid(); renderLobby(); show('lobby'); };
    qs('#avatarBackBtn').onclick = () => show('start');
    qs('#avatarNextBtn').onclick = () => { renderLobby(); saveState(); show('lobby'); };

    qsa('.tab-btn').forEach(btn => btn.onclick = () => { state.tab = btn.dataset.tab; renderLobby(); });
    qs('#launchMissionBtn').onclick = () => { saveState(); startNav('mission'); };
    qs('#launchWorldBtn').onclick = () => { saveState(); startNav('openworld'); };

    qs('#backLobbyFromMapBtn').onclick = () => { renderLobby(); show('lobby'); };
    qs('#backMapBtn').onclick = () => show('navmap');

    qs('#zoomInBtn').onclick = () => { state.nav.zoom = Math.min(2.4, state.nav.zoom + 0.2); };
    qs('#zoomOutBtn').onclick = () => { state.nav.zoom = Math.max(0.8, state.nav.zoom - 0.2); };
    qs('#mapSonarBtn').onclick = () => { state.nav.pulse = 100; state.nav.feed = 'Pulso de sonar emitido.'; };
    qs('#forceEncounterBtn').onclick = () => startBattleFromEncounter(Math.random() < 0.5 ? 'escort' : 'enemySub');
    qsa('[data-mapdir]').forEach(btn => btn.onclick = () => {
      const d = btn.dataset.mapdir;
      if (d === 'left') state.nav.heading -= 15;
      if (d === 'right') state.nav.heading += 15;
      if (d === 'up') state.nav.speed = Math.min(10, state.nav.speed + 2);
      if (d === 'down') state.nav.speed = Math.max(0, state.nav.speed - 2);
      if (d === 'stop') state.nav.speed = 0;
    });

    qs('#sonarBtn').onclick = () => { state.battle.pulse = 100; };
    qs('#diveBtn').onclick = () => { state.battle.targetDepth = state.battle.targetDepth > 20 ? 0 : 120; };
    qs('#torpedoBtn').onclick = () => {
      if (state.battle.torpedoes <= 0) return;
      state.battle.torpedoes -= 1;
      const angle = (state.battle.heading - 90) * Math.PI / 180;
      state.battle.torps.push({ x: state.battle.player.x + Math.cos(angle) * 100, y: state.battle.player.y + Math.sin(angle) * 100, vx: Math.cos(angle) * 8.0, vy: Math.sin(angle) * 8.0 });
    };
    qs('#repairBtn').onclick = () => {
      state.battle.hull = Math.min(100, state.battle.hull + 6);
      state.battle.engine = Math.min(100, state.battle.engine + 4);
      state.battle.sonarSys = Math.min(100, state.battle.sonarSys + 4);
      qs('#officerFeed').textContent = 'Equipe de reparo mobilizada. Reparos parciais concluídos.';
    };

    qsa('.officerBtn').forEach(btn => btn.onclick = () => {
      const type = btn.dataset.officer;
      const map = {
        mechanic: 'Mecânico: priorizando casco e motor. Reparos em andamento.',
        sonar: 'Sonarista: múltiplos retornos. Leitura ainda imperfeita, manter silêncio.',
        weapons: 'Oficial de armas: solução de tiro aceitável, aguardar melhor ângulo e distância.'
      };
      qs('#officerFeed').textContent = map[type];
      if (type === 'mechanic') {
        state.battle.hull = Math.min(100, state.battle.hull + 8);
        state.battle.engine = Math.min(100, state.battle.engine + 5);
      }
      if (type === 'sonar') state.battle.pulse = 100;
      if (type === 'weapons') qs('#tacticalFeed').textContent = 'Oficial de armas recomenda disparo quando alvo cruzar proa em menor distância.';
    });

    qsa('[data-dir]').forEach(btn => btn.onclick = () => {
      const dir = btn.dataset.dir;
      if (dir === 'left') state.battle.targetHeading -= 15;
      if (dir === 'right') state.battle.targetHeading += 15;
      if (dir === 'up') state.battle.targetSpeed = Math.min(10, state.battle.targetSpeed + 2);
      if (dir === 'down') state.battle.targetSpeed = Math.max(0, state.battle.targetSpeed - 2);
      if (dir === 'stop') state.battle.targetSpeed = 0;
    });

    document.addEventListener('keydown', (e) => {
      if (qs('#screen-navmap').classList.contains('active')){
        if (e.key === 'ArrowLeft') state.nav.heading -= 10;
        if (e.key === 'ArrowRight') state.nav.heading += 10;
        if (e.key === 'ArrowUp') state.nav.speed = Math.min(10, state.nav.speed + 2);
        if (e.key === 'ArrowDown') state.nav.speed = Math.max(0, state.nav.speed - 2);
        if (e.key === '+') state.nav.zoom = Math.min(2.4, state.nav.zoom + 0.2);
        if (e.key === '-') state.nav.zoom = Math.max(0.8, state.nav.zoom - 0.2);
      }
      if (qs('#screen-battle').classList.contains('active')){
        if (e.key === 'ArrowLeft') state.battle.targetHeading -= 10;
        if (e.key === 'ArrowRight') state.battle.targetHeading += 10;
        if (e.key === 'ArrowUp') state.battle.targetSpeed = Math.min(10, state.battle.targetSpeed + 2);
        if (e.key === 'ArrowDown') state.battle.targetSpeed = Math.max(0, state.battle.targetSpeed - 2);
        if (e.key === ' ') { e.preventDefault(); qs('#torpedoBtn').click(); }
        if (e.key.toLowerCase() === 's') qs('#sonarBtn').click();
        if (e.key.toLowerCase() === 'd') qs('#diveBtn').click();
      }
    });
  }

  Promise.all(Object.entries(assetPaths).map(([k,src]) => loadImage(k,src))).then(results => {
    let ok = 0;
    results.forEach(r => { assets[r.key] = r.img; if (r.ok) ok += 1; });
    qs('#statusChip').textContent = ok === results.length ? 'Assets carregados' : `Assets ${ok}/${results.length}`;
    initUI();
    worldLoop();
    battleLoop();
  });
})();
