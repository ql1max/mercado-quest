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

function MarketScene({ onPick, active }: { onPick: (word: Word) => void; active: boolean }) {
  const mount = useRef<HTMLDivElement>(null);
  const handler = useRef(onPick);
  handler.current = onPick;

  useEffect(() => {
    const host = mount.current!;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0dba5);
    scene.fog = new THREE.Fog(0xf0dba5, 10, 19);
    const camera = new THREE.PerspectiveCamera(38, host.clientWidth / host.clientHeight, .1, 50);
    camera.position.set(0, 5.1, 10.8);
    camera.lookAt(0, .5, 0);
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(host.clientWidth, host.clientHeight);
    renderer.shadowMap.enabled = true;
    host.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight(0xfff4d8, 0x6d8b6d, 2.2));
    const sun = new THREE.DirectionalLight(0xffffff, 2.2); sun.position.set(-4, 8, 5); sun.castShadow = true; scene.add(sun);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), new THREE.MeshStandardMaterial({ color: 0x78966e }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const stall = new THREE.Group(); scene.add(stall);
    const wood = new THREE.MeshStandardMaterial({ color: 0x9a5638, roughness: .85 });
    const counter = new THREE.Mesh(new THREE.BoxGeometry(9, .45, 2.2), wood); counter.position.y = .1; counter.castShadow = true; stall.add(counter);
    [-4.2, 4.2].forEach((x) => { const post = new THREE.Mesh(new THREE.BoxGeometry(.22, 4.4, .22), wood); post.position.set(x, 2.2, -.8); stall.add(post); });
    const canopy = new THREE.Group();
    for (let i = 0; i < 10; i++) { const stripe = new THREE.Mesh(new THREE.BoxGeometry(.9, .18, 2.8), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf8edcf : 0xe0573f })); stripe.position.x = -4.05 + i * .9; canopy.add(stripe); }
    canopy.position.y = 4.1; canopy.rotation.x = -.08; stall.add(canopy);

    const pickables: THREE.Object3D[] = [];
    words.forEach((word, i) => {
      const group = new THREE.Group(); group.position.set(...word.position); group.userData.word = word;
      const crate = new THREE.Mesh(new THREE.BoxGeometry(1.25, .32, 1.15), new THREE.MeshStandardMaterial({ color: 0xb97948 })); crate.position.y = -.35; crate.castShadow = true; group.add(crate);
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
  const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [started, setStarted] = useState(false); const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const order = useRef([...words].sort(() => Math.random() - .5)); const target = order.current[round % words.length]; const finished = round >= words.length;
  const pick = useCallback((word: Word) => {
    if (!started || feedback?.correct || finished) return;
    if (word.english === target.english) { setScore((s) => s + 100 + streak * 25); setStreak((s) => s + 1); setFeedback({ correct: true, message: `¡Muy bien! ${target.spanish} means ${target.english}.` }); }
    else { setStreak(0); setFeedback({ correct: false, message: `${word.emoji} is ${word.english}. Look again for ${target.spanish}.` }); }
  }, [started, feedback, finished, streak, target]);
  const next = () => { setFeedback(null); setRound((r) => r + 1); };
  const restart = () => { order.current = [...words].sort(() => Math.random() - .5); setRound(0); setScore(0); setStreak(0); setFeedback(null); setStarted(true); };
  return <main><header><a href="/" className="logo">Mercado <b>Quest</b></a><div className="stats"><span>Score <b>{score}</b></span><span>Streak <b>×{streak}</b></span></div></header>
    <section className="game"><MarketScene onPick={pick} active={started && !finished}/>
      {started && !finished && <div className="choice-bar" aria-label="Market choices">{words.map((w) => <button key={w.english} onClick={() => pick(w)} disabled={feedback?.correct}><span>{w.emoji}</span><b>{feedback?.correct && w.english === target.english ? w.english : 'Choose'}</b></button>)}</div>}
      {!started && <div className="card start"><p className="eyebrow">A tiny language adventure · ES → EN</p><h1>Learn English<br/>at the market.</h1><ol><li><b>Read</b> the Spanish shopping mission.</li><li><b>Choose</b> the matching market item.</li><li><b>Learn</b> its English name and build a streak.</li></ol><p className="round-note">5 words · about 1 minute · no timer</p><button onClick={() => setStarted(true)}>Start first mission →</button></div>}
      {started && !finished && <div className="mission"><div className="progress"><i style={{ width: `${((round + 1) / words.length) * 100}%` }}/></div><p>Shopping mission {round + 1} of {words.length}</p><small>Your list says</small><h2>{target.spanish}</h2><strong>Which item matches?</strong></div>}
      {feedback?.correct && <div className="card feedback correct"><span>✓</span><p className="eyebrow">New English word</p><h2>{target.emoji} {target.english}</h2><p><b>{target.spanish}</b> means <b>{target.english}</b>.</p><button onClick={next}>{round === words.length - 1 ? 'See my results →' : 'Next mission →'}</button></div>}
      {feedback && !feedback.correct && <div className="try-again" role="status"><span>Not quite</span><p>{feedback.message}</p><button onClick={() => setFeedback(null)}>Try again</button></div>}
      {finished && <div className="card finish"><p className="eyebrow">Market complete</p><h2>{score} points</h2><p>You matched {words.length} everyday market words. Play again to reinforce them in a new order.</p><button onClick={restart}>Play another round ↻</button></div>}
    </section><footer><span>Tip</span><p>Tap a 3D object or its illustrated choice card. Wrong guesses do not end the mission.</p></footer></main>;
}
export default App;
