import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './index.css';
import './clarity.css';

type Shape = 'sphere' | 'loaf' | 'carton' | 'wedge' | 'fish' | 'capsule' | 'cone' | 'oval' | 'bottle' | 'cup' | 'box';
type Word = { spanish: string; english: string; emoji: string; color: number; shape: Shape; position: [number, number, number] };
type Level = { title: string; words: Word[] };

const positions: [number, number, number][] = [[-3.2, .65, .2], [-1.55, .65, -.2], [0, .75, .25], [1.6, .65, -.2], [3.2, .65, .2]];
const levels: Level[] = [
  { title: 'Market basics', words: [
    { spanish: 'la manzana', english: 'apple', emoji: '🍎', color: 0xe84d3d, shape: 'sphere', position: positions[0] },
    { spanish: 'el pan', english: 'bread', emoji: '🥖', color: 0xdca45c, shape: 'loaf', position: positions[1] },
    { spanish: 'la leche', english: 'milk', emoji: '🥛', color: 0xf5f0dd, shape: 'carton', position: positions[2] },
    { spanish: 'el queso', english: 'cheese', emoji: '🧀', color: 0xf0c93d, shape: 'wedge', position: positions[3] },
    { spanish: 'el pescado', english: 'fish', emoji: '🐟', color: 0x63a9c8, shape: 'fish', position: positions[4] },
  ]},
  { title: 'Fresh produce', words: [
    { spanish: 'el plátano', english: 'banana', emoji: '🍌', color: 0xf2cf45, shape: 'capsule', position: positions[0] },
    { spanish: 'la naranja', english: 'orange', emoji: '🍊', color: 0xf28c28, shape: 'sphere', position: positions[1] },
    { spanish: 'la zanahoria', english: 'carrot', emoji: '🥕', color: 0xe86f2d, shape: 'cone', position: positions[2] },
    { spanish: 'el tomate', english: 'tomato', emoji: '🍅', color: 0xd93c35, shape: 'sphere', position: positions[3] },
    { spanish: 'la papa', english: 'potato', emoji: '🥔', color: 0xa97b50, shape: 'oval', position: positions[4] },
  ]},
  { title: 'Pantry picks', words: [
    { spanish: 'el arroz', english: 'rice', emoji: '🍚', color: 0xf1ead9, shape: 'box', position: positions[0] },
    { spanish: 'el huevo', english: 'egg', emoji: '🥚', color: 0xf3ead0, shape: 'oval', position: positions[1] },
    { spanish: 'el agua', english: 'water', emoji: '💧', color: 0x65bde2, shape: 'bottle', position: positions[2] },
    { spanish: 'el café', english: 'coffee', emoji: '☕', color: 0x8b5a3c, shape: 'cup', position: positions[3] },
    { spanish: 'la sal', english: 'salt', emoji: '🧂', color: 0xe8e8e4, shape: 'box', position: positions[4] },
  ]},
];

function playSound(kind: 'select' | 'wrong' | 'correct' | 'complete', muted: boolean) {
  if (muted) return;
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const context = new AudioContextClass();
  const notes = kind === 'wrong' ? [180, 145] : kind === 'complete' ? [392, 523, 659] : kind === 'correct' ? [440, 660] : [260];
  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator(); const gain = context.createGain();
    oscillator.type = kind === 'wrong' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
    const start = context.currentTime + index * .09; const duration = kind === 'select' ? .07 : .16;
    gain.gain.setValueAtTime(.0001, start); gain.gain.exponentialRampToValueAtTime(kind === 'select' ? .035 : .075, start + .012); gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
    oscillator.connect(gain).connect(context.destination); oscillator.start(start); oscillator.stop(start + duration + .02);
  });
  window.setTimeout(() => void context.close(), 700);
}

const musicTracks = [
  { title: 'Suave Standpipe', src: '/audio/suave-standpipe.mp3' },
  { title: 'Bossa Antigua', src: '/audio/bossa-antigua.mp3' },
  { title: 'Lobby Time', src: '/audio/lobby-time.mp3' },
];

function useBackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndex = useRef(Math.floor(Math.random() * musicTracks.length));
  const failedTracks = useRef(0);
  const [currentTrack, setCurrentTrack] = useState<string | null>(null);
  const [musicStatus, setMusicStatus] = useState<'idle' | 'playing' | 'paused' | 'blocked'>('idle');

  const play = useCallback((replaceTrack = false) => {
    const audio = audioRef.current;
    if (!audio) return;

    const track = musicTracks[trackIndex.current];
    if (replaceTrack || !audio.src) audio.src = track.src;
    audio.volume = .16;
    setCurrentTrack(track.title);
    void audio.play()
      .then(() => setMusicStatus('playing'))
      .catch(() => setMusicStatus('blocked'));
  }, []);
  const pause = useCallback(() => {
    audioRef.current?.pause();
    setMusicStatus('paused');
  }, []);
  const stop = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    setMusicStatus('idle');
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'none';
    audioRef.current = audio;

    const playNextTrack = () => {
      failedTracks.current = 0;
      trackIndex.current = (trackIndex.current + 1) % musicTracks.length;
      play(true);
    };
    const handleTrackError = () => {
      if (failedTracks.current >= musicTracks.length - 1) {
        setMusicStatus('blocked');
        return;
      }
      failedTracks.current += 1;
      trackIndex.current = (trackIndex.current + 1) % musicTracks.length;
      play(true);
    };

    audio.addEventListener('ended', playNextTrack);
    audio.addEventListener('error', handleTrackError);
    return () => {
      audio.removeEventListener('ended', playNextTrack);
      audio.removeEventListener('error', handleTrackError);
      audio.pause();
      audio.removeAttribute('src');
      audio.load();
      audioRef.current = null;
    };
  }, [play]);

  return { currentTrack, musicStatus, pause, play, stop };
}

function MarketScene({ words, onPick, active }: { words: Word[]; onPick: (word: Word) => void; active: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const handler = useRef(onPick);
  handler.current = onPick;

  useEffect(() => {
    const host = mount.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0c);
    scene.fog = new THREE.Fog(0x0a0a0c, 10, 19);
    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, .1, 50);
    camera.position.set(0, 5.1, 10.8);
    camera.lookAt(0, .5, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xdde7ff, 0x111318, 1.8));
    const sun = new THREE.DirectionalLight(0xffffff, 2.1); sun.position.set(-4, 8, 5); sun.castShadow = true; scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), new THREE.MeshStandardMaterial({ color: 0x171a1d }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const stall = new THREE.Group(); scene.add(stall);
    const wood = new THREE.MeshStandardMaterial({ color: 0x5c3528, roughness: .85 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(9, .45, 2.2), wood); counter.position.y = .1; counter.castShadow = true; stall.add(counter);
    [-4.2, 4.2].forEach((x) => { const post = new THREE.Mesh(new THREE.BoxGeometry(.22, 4.4, .22), wood); post.position.set(x, 2.2, -.8); stall.add(post); });
    const canopy = new THREE.Group();
    for (let i = 0; i < 10; i++) { const stripe = new THREE.Mesh(new THREE.BoxGeometry(.9, .18, 2.8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0x292b30 : 0x8f342f })); stripe.position.x = -4.05 + i * .9; canopy.add(stripe); }
    canopy.position.y = 4.1; canopy.rotation.x = -.08; stall.add(canopy);

    const pickables: THREE.Object3D[] = [];
    words.forEach((word, i) => {
      const group = new THREE.Group(); group.position.set(...word.position); group.userData.word = word;
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.25, .32, 1.15), new THREE.MeshStandardMaterial({ color: 0x69452f })); crate.position.y = -.35; crate.castShadow = true; group.add(crate);
      const material = new THREE.MeshStandardMaterial({ color: word.color });
      let item: THREE.Mesh;
      if (word.shape === 'carton') item = new THREE.Mesh(new THREE.BoxGeometry(.58, 1.2, .58), material);
      else if (word.shape === 'loaf' || word.shape === 'capsule') { item = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .9, 6, 12), material); item.rotation.z = Math.PI / 2; }
      else if (word.shape === 'wedge') item = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .55, 3), material);
      else if (word.shape === 'fish') { item = new THREE.Mesh(new THREE.SphereGeometry(.52, 18, 12), material); item.scale.set(1.5, .6, .45); }
      else if (word.shape === 'cone') { item = new THREE.Mesh(new THREE.ConeGeometry(.38, 1.25, 16), material); item.rotation.z = -.2; }
      else if (word.shape === 'oval') { item = new THREE.Mesh(new THREE.SphereGeometry(.48, 20, 16), material); item.scale.set(.82, 1.2, .82); }
      else if (word.shape === 'bottle') item = new THREE.Mesh(new THREE.CylinderGeometry(.23, .34, 1.3, 16), material);
      else if (word.shape === 'cup') item = new THREE.Mesh(new THREE.CylinderGeometry(.42, .34, .72, 18), material);
      else if (word.shape === 'box') item = new THREE.Mesh(new THREE.BoxGeometry(.72, .9, .56), material);
      else item = new THREE.Mesh(new THREE.SphereGeometry(.48, 20, 16), material);
      item.position.y = .35; item.castShadow = true; group.add(item); pickables.push(group); scene.add(group);
      group.rotation.y = i * .12;
    });

    const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
    const click = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect(); pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
      raycaster.setFromCamera(pointer, camera); const hit = raycaster.intersectObjects(pickables, true)[0];
      if (hit) { let object: THREE.Object3D | null = hit.object; while (object && !object.userData.word) object = object.parent; if (object?.userData.word) handler.current(object.userData.word); }
    };
    renderer.domElement.addEventListener('pointerdown', click);
    const resize = () => { camera.aspect = host.clientWidth / host.clientHeight; camera.updateProjectionMatrix(); renderer.setSize(host.clientWidth, host.clientHeight); }; window.addEventListener('resize', resize);
    let frame = 0; const clock = new THREE.Clock();
    const render = () => { frame = requestAnimationFrame(render); const t = clock.getElapsedTime(); pickables.forEach((o, i) => { o.position.y = words[i].position[1] + Math.sin(t * 1.5 + i) * .035; }); renderer.render(scene, camera); }; render();
    return () => { cancelAnimationFrame(frame); window.removeEventListener('resize', resize); renderer.domElement.removeEventListener('pointerdown', click); renderer.dispose(); host.removeChild(renderer.domElement); };
  }, [words]);
  return <div ref={mount} className={active ? 'scene' : 'scene paused'} aria-label="Interactive 3D market stall. Select an object to answer." />;
}

function App() {
  const [levelIndex, setLevelIndex] = useState(0); const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [started, setStarted] = useState(false); const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null); const [muted, setMuted] = useState(false);
  const level = levels[levelIndex]; const words = level.words;
  const order = useRef([...levels[0].words].sort(() => Math.random() - .5)); const target = order.current[round % words.length]; const levelFinished = round >= words.length; const gameComplete = levelFinished && levelIndex === levels.length - 1;
  const { currentTrack, musicStatus, pause: pauseMusic, play: playMusic, stop: stopMusic } = useBackgroundMusic();
  const pick = useCallback((word: Word) => {
    if (!started || feedback?.correct || levelFinished) return;
    if (word.english === target.english) { playSound(round === words.length - 1 ? 'complete' : 'correct', muted); setScore((s) => s + 100 + streak * 25); setStreak((s) => s + 1); setFeedback({ correct: true, message: `Correct! ${target.english} is ${target.spanish} in Spanish.` }); }
    else { playSound('wrong', muted); setStreak(0); setFeedback({ correct: false, message: `${word.emoji} is ${word.english}. Look again for ${target.english}.` }); }
  }, [started, feedback, levelFinished, streak, target, muted, round, words.length]);
  const next = () => { setFeedback(null); setRound((r) => r + 1); };
  const start = () => { setStarted(true); if (!muted) playMusic(); };
  const advanceLevel = () => { const nextLevel = levelIndex + 1; order.current = [...levels[nextLevel].words].sort(() => Math.random() - .5); setLevelIndex(nextLevel); setRound(0); setFeedback(null); };
  const restart = () => { order.current = [...levels[0].words].sort(() => Math.random() - .5); setLevelIndex(0); setRound(0); setScore(0); setStreak(0); setFeedback(null); setStarted(true); if (!muted) playMusic(); };
  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (nextMuted) pauseMusic();
    else if (started && !gameComplete) playMusic();
  };
  useEffect(() => { if (gameComplete) stopMusic(); }, [gameComplete, stopMusic]);
  return <main><header><a href="/" className="logo">Mercado <b>Quest</b></a><div className="header-tools"><div className="stats"><span>Score <b key={score} className="score-pop">{score}</b></span><span>Streak <b>×{streak}</b></span></div><button className="sound-toggle" onClick={toggleSound} aria-pressed={muted} aria-label={muted ? 'Turn sound on' : 'Mute sound'}>{muted ? 'Sound off' : 'Sound on'} <i>{muted ? '×' : '♪'}</i></button></div></header>
    <section className="game"><MarketScene key={levelIndex} words={words} onPick={pick} active={started && !levelFinished}/>
      {started && !levelFinished && <div className="choice-bar" aria-label="Market choices">{words.map((w, index) => <button key={w.english} style={{ '--delay': `${index * 45}ms` } as React.CSSProperties} onClick={() => { playSound('select', muted); pick(w); }} disabled={feedback?.correct}><span>{w.emoji}</span><b>{feedback?.correct && w.english === target.english ? w.english : 'Choose'}</b></button>)}</div>}
      {!started && <div className="card start"><p className="eyebrow">A three-level English vocabulary game</p><h1>Learn English<br/>at the market.</h1><ol><li><span><b>Read</b> the English word in your shopping mission.</span></li><li><span><b>Choose</b> the market item it names.</span></li><li><span><b>Check</b> the Spanish translation and unlock the next level.</span></li></ol><p className="round-note">3 levels · 15 English words · no timer</p><button onClick={start}>Start level 1 →</button></div>}
      {started && !levelFinished && <div className="mission" key={`${levelIndex}-${round}`}><div className="progress"><i style={{ width: `${((round + 1) / words.length) * 100}%` }}/></div><p>Level {levelIndex + 1} of {levels.length} · {level.title}</p><small>Find this English word</small><h2>{target.english}</h2><strong>Mission {round + 1} of {words.length}</strong></div>}
      {feedback?.correct && <div className="card feedback correct"><div className="sparkles" aria-hidden="true">✦ <i>●</i> ✦ <i>●</i></div><span>✓</span><p className="eyebrow">English word</p><h2>{target.emoji} {target.english}</h2><p><b>{target.english}</b> is <b>{target.spanish}</b> in Spanish.</p><button onClick={next}>{round === words.length - 1 ? (levelIndex === levels.length - 1 ? 'See my results →' : 'Finish level →') : 'Next mission →'}</button></div>}
      {feedback && !feedback.correct && <div className="try-again" role="status"><span>Not quite</span><p>{feedback.message}</p><button onClick={() => setFeedback(null)}>Try again</button></div>}
      {levelFinished && !gameComplete && <div className="card finish"><p className="eyebrow">Level {levelIndex + 1} complete</p><h2>{level.title}</h2><p>You learned {words.length} English words. Next up: <b>{levels[levelIndex + 1].title}</b>.</p><button onClick={advanceLevel}>Start level {levelIndex + 2} →</button></div>}
      {gameComplete && <div className="card finish"><p className="eyebrow">All levels complete</p><h2>{score} points</h2><p>You matched all 15 everyday market words. Play again to reinforce them in a new order.</p><button onClick={restart}>Play all levels again ↻</button></div>}
    </section><footer><span>Tip</span><p>Tap a 3D object or its illustrated choice card. Wrong guesses do not end the mission.</p>{started && !gameComplete && !muted && currentTrack && <small className="now-playing">{musicStatus === 'blocked' ? 'Music unavailable' : `♫ ${currentTrack}`}</small>}<details className="music-credits"><summary>Music credits</summary><div><p><a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500078" target="_blank" rel="noreferrer">Suave Standpipe</a>, <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700069" target="_blank" rel="noreferrer">Bossa Antigua</a>, and <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600054" target="_blank" rel="noreferrer">Lobby Time</a> by Kevin MacLeod.</p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noreferrer">CC BY 4.0</a></div></details></footer></main>;
}
export default App;
