import { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import './index.css';
import './clarity.css';

type Word = { spanish: string; english: string; emoji: string; color: number; position: [number, number, number] };
const words: Word[] = [
  { spanish: 'la manzana', english: 'apple', emoji: '🍎', color: 0xe84d3d, position: [-3.2, .65, .2] },
  { spanish: 'el pan', english: 'bread', emoji: '🥖', color: 0xdca45c, position: [-1.55, .65, -.2] },
  { spanish: 'la leche', english: 'milk', emoji: '🥛', color: 0xf5f0dd, position: [0, .75, .25] },
  { spanish: 'el queso', english: 'cheese', emoji: '🧀', color: 0xf0c93d, position: [1.6, .65, -.2] },
  { spanish: 'el pescado', english: 'fish', emoji: '🐟', color: 0x63a9c8, position: [3.2, .65, .2] },
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

function MarketScene({ onPick, active }: { onPick: (word: Word) => void; active: boolean }) {
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
      let item: THREE.Mesh;
      if (word.english === 'milk') item = new THREE.Mesh(new THREE.BoxGeometry(.58, 1.2, .58), new THREE.MeshStandardMaterial({ color: word.color }));
      else if (word.english === 'bread') { item = new THREE.Mesh(new THREE.CapsuleGeometry(.32, .9, 6, 12), new THREE.MeshStandardMaterial({ color: word.color })); item.rotation.z = Math.PI / 2; }
      else if (word.english === 'cheese') item = new THREE.Mesh(new THREE.CylinderGeometry(.55, .55, .55, 3), new THREE.MeshStandardMaterial({ color: word.color }));
      else if (word.english === 'fish') { item = new THREE.Mesh(new THREE.SphereGeometry(.52, 18, 12), new THREE.MeshStandardMaterial({ color: word.color })); item.scale.set(1.5, .6, .45); }
      else item = new THREE.Mesh(new THREE.SphereGeometry(.48, 20, 16), new THREE.MeshStandardMaterial({ color: word.color }));
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
  }, []);
  return <div ref={mount} className={active ? 'scene' : 'scene paused'} aria-label="Interactive 3D market stall. Select an object to answer." />;
}

function App() {
  const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [started, setStarted] = useState(false); const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null); const [muted, setMuted] = useState(false);
  const order = useRef([...words].sort(() => Math.random() - .5)); const target = order.current[round % words.length]; const finished = round >= words.length;
  const { currentTrack, musicStatus, pause: pauseMusic, play: playMusic, stop: stopMusic } = useBackgroundMusic();
  const pick = useCallback((word: Word) => {
    if (!started || feedback?.correct || finished) return;
    if (word.english === target.english) { playSound(round === words.length - 1 ? 'complete' : 'correct', muted); setScore((s) => s + 100 + streak * 25); setStreak((s) => s + 1); setFeedback({ correct: true, message: `Correct! ${target.english} is ${target.spanish} in Spanish.` }); }
    else { playSound('wrong', muted); setStreak(0); setFeedback({ correct: false, message: `${word.emoji} is ${word.english}. Look again for ${target.english}.` }); }
  }, [started, feedback, finished, streak, target, muted, round]);
  const next = () => { setFeedback(null); setRound((r) => r + 1); };
  const start = () => { setStarted(true); if (!muted) playMusic(); };
  const restart = () => { order.current = [...words].sort(() => Math.random() - .5); setRound(0); setScore(0); setStreak(0); setFeedback(null); setStarted(true); if (!muted) playMusic(); };
  const toggleSound = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    if (nextMuted) pauseMusic();
    else if (started && !finished) playMusic();
  };
  useEffect(() => { if (finished) stopMusic(); }, [finished, stopMusic]);
  return <main><header><a href="/" className="logo">Mercado <b>Quest</b></a><div className="header-tools"><div className="stats"><span>Score <b key={score} className="score-pop">{score}</b></span><span>Streak <b>×{streak}</b></span></div><button className="sound-toggle" onClick={toggleSound} aria-pressed={muted} aria-label={muted ? 'Turn sound on' : 'Mute sound'}>{muted ? 'Sound off' : 'Sound on'} <i>{muted ? '×' : '♪'}</i></button></div></header>
    <section className="game"><MarketScene onPick={pick} active={started && !finished}/>
      {started && !finished && <div className="choice-bar" aria-label="Market choices">{words.map((w, index) => <button key={w.english} style={{ '--delay': `${index * 45}ms` } as React.CSSProperties} onClick={() => { playSound('select', muted); pick(w); }} disabled={feedback?.correct}><span>{w.emoji}</span><b>{feedback?.correct && w.english === target.english ? w.english : 'Choose'}</b></button>)}</div>}
      {!started && <div className="card start"><p className="eyebrow">A quick English vocabulary game</p><h1>Learn English<br/>at the market.</h1><ol><li><span><b>Read</b> the English word in your shopping mission.</span></li><li><span><b>Choose</b> the market item it names.</span></li><li><span><b>Check</b> the Spanish translation and build a streak.</span></li></ol><p className="round-note">5 English words · about 1 minute · no timer</p><button onClick={start}>Start first mission →</button></div>}
      {started && !finished && <div className="mission" key={round}><div className="progress"><i style={{ width: `${((round + 1) / words.length) * 100}%` }}/></div><p>English mission {round + 1} of {words.length}</p><small>Find this English word</small><h2>{target.english}</h2><strong>Which item is it?</strong></div>}
      {feedback?.correct && <div className="card feedback correct"><div className="sparkles" aria-hidden="true">✦ <i>●</i> ✦ <i>●</i></div><span>✓</span><p className="eyebrow">English word</p><h2>{target.emoji} {target.english}</h2><p><b>{target.english}</b> is <b>{target.spanish}</b> in Spanish.</p><button onClick={next}>{round === words.length - 1 ? 'See my results →' : 'Next mission →'}</button></div>}
      {feedback && !feedback.correct && <div className="try-again" role="status"><span>Not quite</span><p>{feedback.message}</p><button onClick={() => setFeedback(null)}>Try again</button></div>}
      {finished && <div className="card finish"><p className="eyebrow">Market complete</p><h2>{score} points</h2><p>You matched {words.length} everyday market words. Play again to reinforce them in a new order.</p><button onClick={restart}>Play another round ↻</button></div>}
    </section><footer><span>Tip</span><p>Tap a 3D object or its illustrated choice card. Wrong guesses do not end the mission.</p>{started && !finished && !muted && currentTrack && <small className="now-playing">{musicStatus === 'blocked' ? 'Music unavailable' : `♫ ${currentTrack}`}</small>}<details className="music-credits"><summary>Music credits</summary><div><p><a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500078" target="_blank" rel="noreferrer">Suave Standpipe</a>, <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700069" target="_blank" rel="noreferrer">Bossa Antigua</a>, and <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600054" target="_blank" rel="noreferrer">Lobby Time</a> by Kevin MacLeod.</p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noreferrer">CC BY 4.0</a></div></details></footer></main>;
}
export default App;
