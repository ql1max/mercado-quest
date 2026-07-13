import { useCallback, useEffect, useRef, useState } from 'react';
import './index.css';
import './clarity.css';

type Location = 'market' | 'airport' | 'street';
type Word = { spanish: string; english: string; emoji: string; position: [number, number] };
type Level = { title: string; location: Location; words: Word[] };
type Decoration = { emoji: string; position: [number, number]; size?: number };

const levels: Level[] = [
  { title: 'Día de mercado', location: 'market', words: [
    { spanish: 'manzana', english: 'apple', emoji: '🍎', position: [14, 62] },
    { spanish: 'pan', english: 'bread', emoji: '🥖', position: [32, 46] },
    { spanish: 'leche', english: 'milk', emoji: '🥛', position: [51, 68] },
    { spanish: 'queso', english: 'cheese', emoji: '🧀', position: [70, 43] },
    { spanish: 'pescado', english: 'fish', emoji: '🐟', position: [86, 63] },
  ]},
  { title: 'En el aeropuerto', location: 'airport', words: [
    { spanish: 'maleta', english: 'suitcase', emoji: '🧳', position: [13, 68] },
    { spanish: 'pasaporte', english: 'passport', emoji: '📕', position: [31, 43] },
    { spanish: 'boleto', english: 'ticket', emoji: '🎫', position: [50, 66] },
    { spanish: 'avión', english: 'airplane', emoji: '✈️', position: [70, 29] },
    { spanish: 'audífonos', english: 'headphones', emoji: '🎧', position: [87, 53] },
  ]},
  { title: 'Paseo por la ciudad', location: 'street', words: [
    { spanish: 'bicicleta', english: 'bicycle', emoji: '🚲', position: [14, 64] },
    { spanish: 'autobús', english: 'bus', emoji: '🚌', position: [32, 48] },
    { spanish: 'perro', english: 'dog', emoji: '🐕', position: [51, 70] },
    { spanish: 'banco', english: 'bench', emoji: '🪑', position: [69, 57] },
    { spanish: 'semáforo', english: 'traffic light', emoji: '🚦', position: [86, 36] },
  ]},
];

const decorations: Record<Location, Decoration[]> = {
  market: [
    { emoji: '🧺', position: [8, 40], size: 38 }, { emoji: '🌽', position: [24, 65] }, { emoji: '🍇', position: [41, 42] },
    { emoji: '🥬', position: [60, 59] }, { emoji: '🌻', position: [78, 67] }, { emoji: '📦', position: [93, 44], size: 42 },
    { emoji: '🧑🏽‍🌾', position: [20, 28], size: 48 }, { emoji: '🛍️', position: [80, 31], size: 38 },
  ],
  airport: [
    { emoji: '💺', position: [8, 45], size: 42 }, { emoji: '☕', position: [22, 62] }, { emoji: '🕐', position: [41, 25], size: 38 },
    { emoji: '🪴', position: [60, 64], size: 42 }, { emoji: '🛄', position: [78, 43], size: 38 }, { emoji: '🚪', position: [94, 66], size: 42 },
    { emoji: '👩🏽‍✈️', position: [20, 29], size: 48 }, { emoji: '🧍🏻', position: [81, 68], size: 46 },
  ],
  street: [
    { emoji: '🌳', position: [8, 41], size: 50 }, { emoji: '🚕', position: [23, 69], size: 46 }, { emoji: '🛴', position: [42, 41] },
    { emoji: '🗞️', position: [59, 66] }, { emoji: '🐦', position: [77, 27] }, { emoji: '🚧', position: [94, 67], size: 42 },
    { emoji: '🚶🏽‍♀️', position: [21, 31], size: 48 }, { emoji: '🏪', position: [80, 49], size: 48 },
  ],
};

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

function QuestScene({ location, words, onPick, active }: { location: Location; words: Word[]; onPick: (word: Word) => void; active: boolean }) {
  const locationName = location === 'market' ? 'mercado' : location === 'airport' ? 'aeropuerto' : 'ciudad';
  return <div className={`scene location-${location}${active ? '' : ' paused'}`} role="group" aria-label={`Escena de objetos escondidos: ${locationName}`}>
    <div className="scene-landmark" aria-hidden="true" />
    <div className="scene-label" aria-hidden="true">{locationName}</div>
    {decorations[location].map((decoration, index) => <span className="scene-decoration" key={`${decoration.emoji}-${index}`} style={{ left: `${decoration.position[0]}%`, top: `${decoration.position[1]}%`, fontSize: `${decoration.size ?? 32}px` }} aria-hidden="true">{decoration.emoji}</span>)}
    {words.map((word, index) => <button className="scene-item" key={word.english} style={{ left: `${word.position[0]}%`, top: `${word.position[1]}%`, '--item-delay': `${index * 60}ms` } as React.CSSProperties} onClick={() => onPick(word)} disabled={!active} aria-label={`Elegir objeto ${index + 1}`}><span aria-hidden="true">{word.emoji}</span></button>)}
  </div>;
}

function App() {
  const [levelIndex, setLevelIndex] = useState(0); const [round, setRound] = useState(0); const [score, setScore] = useState(0); const [streak, setStreak] = useState(0); const [started, setStarted] = useState(false); const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null); const [muted, setMuted] = useState(false);
  const level = levels[levelIndex]; const words = level.words;
  const order = useRef([...levels[0].words].sort(() => Math.random() - .5)); const target = order.current[round % words.length]; const levelFinished = round >= words.length; const gameComplete = levelFinished && levelIndex === levels.length - 1;
  const { currentTrack, musicStatus, pause: pauseMusic, play: playMusic, stop: stopMusic } = useBackgroundMusic();
  const pick = useCallback((word: Word) => {
    if (!started || feedback?.correct || levelFinished) return;
    if (word.english === target.english) { playSound(round === words.length - 1 ? 'complete' : 'correct', muted); setScore((s) => s + 100 + streak * 25); setStreak((s) => s + 1); setFeedback({ correct: true, message: `¡Correcto! ${target.english} significa ${target.spanish}.` }); }
    else { playSound('wrong', muted); setStreak(0); setFeedback({ correct: false, message: `${word.emoji} es ${word.english}. Busca otra vez ${target.english}.` }); }
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
  return <main><header><a href="/" className="logo">Word <b>Quest</b></a><div className="header-tools"><div className="stats"><span>Puntaje <b key={score} className="score-pop">{score}</b></span><span>Racha <b>×{streak}</b></span></div><button className="sound-toggle" onClick={toggleSound} aria-pressed={muted} aria-label={muted ? 'Activar sonido' : 'Silenciar'}>{muted ? 'Sin sonido' : 'Sonido'} <i>{muted ? '×' : '♪'}</i></button></div></header>
    <section className="game"><QuestScene key={levelIndex} location={level.location} words={words} onPick={pick} active={started && !levelFinished}/>
      {started && !levelFinished && <div className="choice-bar" aria-label="Objetos disponibles">{words.map((w, index) => <button key={w.english} style={{ '--delay': `${index * 45}ms` } as React.CSSProperties} onClick={() => { playSound('select', muted); pick(w); }} disabled={feedback?.correct}><span>{w.emoji}</span><b>{feedback?.correct && w.english === target.english ? w.english : 'Elegir'}</b></button>)}</div>}
      {!started && <div className="card start"><p className="eyebrow">Una aventura de vocabulario inglés</p><h1>Aprende inglés<br/>explorando.</h1><ol><li><span><b>Lee</b> la palabra en inglés de cada reto.</span></li><li><span><b>Busca</b> el objeto escondido en la escena.</span></li><li><span><b>Confirma</b> su significado en español y avanza.</span></li></ol><p className="round-note">3 lugares · 15 palabras en inglés · sin límite de tiempo</p><button onClick={start}>Empezar nivel 1 →</button></div>}
      {started && !levelFinished && <div className="mission" key={`${levelIndex}-${round}`}><div className="progress"><i style={{ width: `${((round + 1) / words.length) * 100}%` }}/></div><p>Nivel {levelIndex + 1} de {levels.length} · {level.title}</p><small>Encuentra esta palabra en inglés</small><h2>{target.english}</h2><strong>Reto {round + 1} de {words.length}</strong></div>}
      {feedback?.correct && <div className="card feedback correct"><div className="sparkles" aria-hidden="true">✦ <i>●</i> ✦ <i>●</i></div><span>✓</span><p className="eyebrow">Palabra en inglés</p><h2>{target.emoji} {target.english}</h2><p><b>{target.english}</b> significa <b>{target.spanish}</b>.</p><button onClick={next}>{round === words.length - 1 ? (levelIndex === levels.length - 1 ? 'Ver mis resultados →' : 'Terminar nivel →') : 'Siguiente reto →'}</button></div>}
      {feedback && !feedback.correct && <div className="try-again" role="status"><span>Casi</span><p>{feedback.message}</p><button onClick={() => setFeedback(null)}>Intentar de nuevo</button></div>}
      {levelFinished && !gameComplete && <div className="card finish"><p className="eyebrow">Nivel {levelIndex + 1} completado</p><h2>{level.title}</h2><p>Aprendiste {words.length} palabras en inglés. Siguiente lugar: <b>{levels[levelIndex + 1].title}</b>.</p><button onClick={advanceLevel}>Empezar nivel {levelIndex + 2} →</button></div>}
      {gameComplete && <div className="card finish"><p className="eyebrow">Completaste todos los niveles</p><h2>{score} puntos</h2><p>Encontraste las 15 palabras en inglés. Juega otra vez para practicarlas en un orden nuevo.</p><button onClick={restart}>Jugar todos los niveles otra vez ↻</button></div>}
    </section><footer><span>Consejo</span><p>Toca un objeto escondido o su tarjeta ilustrada. Los intentos incorrectos no terminan el reto.</p>{started && !gameComplete && !muted && currentTrack && <small className="now-playing">{musicStatus === 'blocked' ? 'Música no disponible' : `♫ ${currentTrack}`}</small>}<details className="music-credits"><summary>Créditos de música</summary><div><p><a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1500078" target="_blank" rel="noreferrer">Suave Standpipe</a>, <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1700069" target="_blank" rel="noreferrer">Bossa Antigua</a> y <a href="https://incompetech.com/music/royalty-free/index.html?isrc=USUAN1600054" target="_blank" rel="noreferrer">Lobby Time</a>, de Kevin MacLeod.</p><a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="license noreferrer">CC BY 4.0</a></div></details></footer></main>;
}
export default App;
