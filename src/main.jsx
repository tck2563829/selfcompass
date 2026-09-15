import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { ArrowRight, Brain, Check, ChevronRight, CircleHelp, Compass, Flame, Heart, Lightbulb, LogIn, LogOut, Plus, Sparkles, Target, TrendingUp, UserPlus, X } from 'lucide-react';
import './styles.css';
import './auth.css';
import './ai.css';

const categories = [
  { id: 'cooperation', label: '協調性', color: '#e88966', icon: '◌', questions: ['相手の意見を聞いてから、自分の考えを伝える', 'チームの中で困っている人に気づける', '意見がぶつかっても、落とし所を探せる', '誰かの成功を自分のことのように喜べる', '初対面の人とも自然に会話を始められる'] },
  { id: 'curiosity', label: '好奇心', color: '#5f9e90', icon: '✦', questions: ['知らないことを見つけると、調べたくなる', 'いつものやり方に疑問を持てる', '失敗しても新しい方法を試してみる', '異なる分野の話を聞くのが好きだ', '「なぜ？」を深掘りする時間が楽しい'] },
  { id: 'resilience', label: 'メンタル', color: '#d2a94e', icon: '↗', questions: ['うまくいかない時も、次の一歩を考えられる', '気持ちを切り替える自分なりの方法がある', '小さな進歩にも気づくことができる', '助けを求めることをためらわない', '失敗を次に活かす材料として捉えられる'] },
  { id: 'selfDirection', label: '自信', color: '#7696bb', icon: '◎', questions: ['自分が本当に大事にしたいことがわかる', '周りの期待と自分の希望を分けて考えられる', '決めたことを小さな行動に移せる', '「やらないこと」を選ぶ勇気がある', '自分のペースを大切にできる'] },
];
const values = ['人の気持ちを理解できる人', '自分の好奇心を信じられる人', 'しなやかに前へ進める人', '自分の軸で選べる人'];
const goalWeights = {
  '人の気持ちを理解できる人': [1.45, 0.85, 0.85, 0.85],
  '自分の好奇心を信じられる人': [0.85, 1.45, 0.85, 0.85],
  'しなやかに前へ進める人': [0.85, 0.85, 1.45, 0.85],
  '自分の軸で選べる人': [0.85, 0.85, 0.85, 1.45],
};
const initialAnswers = Array(20).fill(null);
const STORAGE_KEY = 'selfcompass-state';
const defaultLogs = [{ text: '朝の会議で、相手の意見を最後まで聞けた', tag: '協調性', date: '今日' }];
const supabase = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY
  ? createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)
  : null;

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved && Array.isArray(saved.answers) && Array.isArray(saved.logs)
      ? saved
      : { answers: initialAnswers, goal: values[3], logs: defaultLogs };
  } catch {
    return { answers: initialAnswers, goal: values[3], logs: defaultLogs };
  }
}

function App() {
  const savedState = loadSavedState();
  const [onboardingCompleted, setOnboardingCompleted] = useState(Boolean(savedState.onboardingCompleted));
  const [diagnosisLocked, setDiagnosisLocked] = useState(Boolean(savedState.diagnosisCompleted));
  const [active, setActive] = useState(diagnosisLocked ? 'result' : onboardingCompleted ? 'diagnosis' : 'goal');
  const [answers, setAnswers] = useState(savedState.answers);
  const [goal, setGoal] = useState(savedState.goal);
  const [note, setNote] = useState('');
  const [logs, setLogs] = useState(savedState.logs);
  const [user, setUser] = useState(null);
  const [cloudReady, setCloudReady] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authMessage, setAuthMessage] = useState('');
  const [scoreOverrides, setScoreOverrides] = useState(savedState.aiScores || null);
  const [aiInsight, setAiInsight] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!supabase || !user) return;
    supabase.from('profiles').select('goal, answers, logs, ai_scores').eq('id', user.id).maybeSingle().then(({ data }) => {
      if (data) {
        if (Array.isArray(data.answers)) setAnswers(data.answers);
        if (data.goal) setGoal(data.goal);
        if (Array.isArray(data.logs)) setLogs(data.logs);
        if (Array.isArray(data.ai_scores)) setScoreOverrides(data.ai_scores);
      }
      setCloudReady(true);
    });
  }, [user]);
  useEffect(() => {
    if (!supabase || !user || !cloudReady) return;
    supabase.from('profiles').upsert({ id: user.id, goal, answers, logs, ai_scores: scoreOverrides, updated_at: new Date().toISOString() }).then();
  }, [answers, goal, logs, scoreOverrides, user, cloudReady]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ answers, goal, logs, aiScores: scoreOverrides, onboardingCompleted, diagnosisCompleted: diagnosisLocked }));
  }, [answers, goal, logs, scoreOverrides, onboardingCompleted, diagnosisLocked]);
  const calculatedScores = categories.map((category, index) => {
    const categoryAnswers = answers.slice(index * 5, index * 5 + 5);
    const answered = categoryAnswers.filter((value) => value !== null);
    return answered.length ? Math.round(answered.reduce((sum, value) => sum + value, 0) / 5 * 20) : 0;
  });
  const scores = scoreOverrides || calculatedScores;
  const weights = goalWeights[goal] || [1, 1, 1, 1];
  const average = Math.round(scores.reduce((sum, score, index) => sum + score * weights[index], 0) / weights.reduce((sum, weight) => sum + weight, 0));
  const goalCategory = categories.find((category) => category.label === goal.replace('自分の軸で選べる人', '自信').replace('人の気持ちを理解できる人', '協調性').replace('自分の好奇心を信じられる人', '好奇心').replace('しなやかに前へ進める人', 'メンタル')) || categories[3];
  const updateAnswer = (index, value) => {
    if (diagnosisLocked) return;
    setScoreOverrides(null);
    setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? value : answer));
  };
  const openAuth = () => {
    setAuthMode('signup');
    setAuthMessage('診断結果を保存するため、アカウントを作成してください。');
    setAuthOpen(true);
  };
  const continueToGrowth = () => setActive('growth');
  const completeDiagnosis = () => {
    if (answers.some((answer) => answer === null)) return;
    setDiagnosisLocked(true);
    setOnboardingCompleted(true);
    setActive('result');
  };
  const retakeDiagnosis = () => {
    setAnswers(initialAnswers);
    setScoreOverrides(null);
    setDiagnosisLocked(false);
    setActive('diagnosis');
  };
  const addLog = async () => {
    if (!note.trim() || analyzing) return;
    const newLog = { text: note.trim(), tag: goalCategory.label, date: 'たった今' };
    setLogs((current) => [newLog, ...current]);
    setNote('');
    setAnalyzing(true);
    try {
      const response = await fetch('/api/analyze', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ note: newLog.text, logs, scores, goal }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || '分析に失敗しました');
      setAiInsight(result);
      setScoreOverrides(result.scores);
    } catch (error) {
      setAiInsight({ error: error.message });
    } finally {
      setAnalyzing(false);
    }
  };

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><div className="brand-mark"><Compass size={21} strokeWidth={2.5} /></div><div><strong>self<span>compass</span></strong><small>自分を知り、育てる</small></div></div>
      <button className="profile-chip" onClick={() => setAuthOpen(true)}><div className="avatar">{user ? (user.email?.[0] || 'U').toUpperCase() : 'あ'}</div><div><b>{user ? user.email : 'ゲストモード'}</b><small>{user ? 'アカウントに保存中' : 'ログインすると端末間で同期'}</small></div><ChevronRight size={16} /></button>
      {onboardingCompleted && <nav><p className="nav-label">MY JOURNEY</p><NavItem icon={<Target size={18} />} label="なりたい自分" active={active === 'goal'} onClick={() => setActive('goal')} /><NavItem icon={<Brain size={18} />} label="性格診断" active={active === 'diagnosis'} onClick={() => setActive('diagnosis')} /><NavItem icon={<TrendingUp size={18} />} label="成長の記録" active={active === 'growth'} onClick={() => setActive('growth')} /></nav>}
      <div className="side-bottom"><div className="streak"><Flame size={17} fill="#d2a94e" color="#d2a94e" /><span><b>3日</b> 続けています</span></div><div className="help-link"><CircleHelp size={17} />使い方を見る</div>{user && <button className="help-link logout-button" onClick={() => supabase.auth.signOut()}><LogOut size={17} />ログアウト</button>}</div>
    </aside>
    <main className="main-content">
      <header className="topbar"><div><span className="eyebrow">WEDNESDAY, JUNE 12</span><h1>自分の現在地を、<em>やさしく知る。</em></h1></div><button className="icon-button" aria-label="通知"><span className="notification-dot" />♡</button></header>
      {active === 'diagnosis' && <Diagnosis scores={scores} average={average} answers={answers} goal={goal} locked={diagnosisLocked} weakestCategory={categories[scores.indexOf(Math.min(...scores))]} updateAnswer={updateAnswer} onComplete={completeDiagnosis} onRetake={retakeDiagnosis} onOpenAuth={openAuth} />}
      {active === 'result' && <ResultsView scores={scores} average={average} goal={goal} weakestCategory={categories[scores.indexOf(Math.min(...scores))]} onRetake={retakeDiagnosis} onOpenAuth={openAuth} onContinueAsGuest={continueToGrowth} />}
      {active === 'goal' && <GoalView goal={goal} setGoal={setGoal} onGoDiagnosis={() => setActive('diagnosis')} />}
      {active === 'growth' && <GrowthView scores={scores} average={average} logs={logs} note={note} setNote={setNote} addLog={addLog} analyzing={analyzing} aiInsight={aiInsight} />}
    </main>
    {onboardingCompleted && <aside className="insight-panel"><div className="panel-kicker"><Sparkles size={15} />今日のインサイト</div><div className="insight-heading"><span>01</span><h2>あなたは、<br /><strong>{goalCategory.label}</strong>を育てる途中。</h2></div><p className="insight-copy">今のあなたには、考えてから動く丁寧さがあります。その丁寧さを、ほんの少しだけ早い一歩につなげてみましょう。</p><div className="tip-box"><div className="tip-icon"><Lightbulb size={17} /></div><div><b>今日の小さなヒント</b><p>会話の中で一度だけ、「私はこう感じた」と自分の言葉を足してみる。</p></div></div><div className="progress-block"><div className="progress-title"><span>今月の成長</span><b>{Math.min(100, average + 8)}%</b></div><div className="progress-bar"><span style={{ width: `${Math.min(100, average + 8)}%` }} /></div><small>先月より <strong>+8%</strong> 自分の理解が深まりました</small></div><div className="quote"><span>“</span><p>変わることは、<br />自分を否定することじゃない。</p></div></aside>}
    {authOpen && <AuthModal mode={authMode} setMode={setAuthMode} message={authMessage} setMessage={setAuthMessage} onSuccess={continueToGrowth} onClose={() => setAuthOpen(false)} />}
  </div>;
}
function AuthModal({ mode, setMode, message, setMessage, onSuccess, onClose }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = async (event) => {
    event.preventDefault();
    if (!supabase) { setMessage('管理者がSupabaseの環境変数を設定するとログインできます。'); return; }
    const result = mode === 'login' ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password });
    if (result.error) setMessage(result.error.message);
    else { setMessage(mode === 'login' ? 'ログインしました。' : '確認メールを送信しました。'); setTimeout(() => { onSuccess(); onClose(); }, 700); }
  };
  return <div className="modal-backdrop" onClick={onClose}><div className="auth-modal" onClick={(event) => event.stopPropagation()}><button className="modal-close" onClick={onClose} aria-label="閉じる"><X size={18} /></button><div className="modal-symbol">{mode === 'login' ? <LogIn size={20} /> : <UserPlus size={20} />}</div><h2>{mode === 'login' ? 'おかえりなさい' : 'コンパスを作る'}</h2><p>ログインすると、どの端末からでもあなたの記録を続きから使えます。</p><form onSubmit={submit}><label>メールアドレス<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label><label>パスワード<input type="password" minLength="6" value={password} onChange={(event) => setPassword(event.target.value)} required /></label><button className="primary-button auth-submit" type="submit">{mode === 'login' ? 'ログイン' : 'アカウントを作成'}</button></form>{message && <div className="auth-message">{message}</div>}<button className="mode-switch" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setMessage(''); }}>{mode === 'login' ? 'はじめて使う方はこちら' : 'ログインはこちら'}</button></div></div>;
}
function NavItem({ icon, label, active, onClick }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>{icon}<span>{label}</span>{active && <i />}</button>; }
function ResultsView({ scores, average, goal, weakestCategory, onRetake, onOpenAuth, onContinueAsGuest }) { return <section className="page-section simple-view result-view"><span className="eyebrow">STEP 02 / 03</span><h2>あなたの現在地が<br /><em>見えてきました。</em></h2><p className="lead">アンケートから見えた、今のあなたの特徴です。</p><div className="score-overview"><div className="score-number"><strong>{average}</strong><span>/ 100</span><small>あなたの現在の総合スコア</small></div><Radar scores={scores} /></div><div className="result-summary"><span className="eyebrow">YOUR NEXT STEP</span><h3>{weakestCategory.label}を、もう少し育ててみよう。</h3><p>あなたが目指す「{goal}」に向けて、今は<strong>{weakestCategory.label}</strong>が伸びしろです。足りないのではなく、これから育てられる部分として見てみましょう。</p><button className="primary-button" onClick={onOpenAuth}><LogIn size={17} />結果を保存するためにログイン</button><button className="guest-continue" onClick={onContinueAsGuest}>ゲストモードで続ける</button></div><div className="diagnosis-actions"><span>回答内容は保存されています</span><button className="secondary-button" onClick={onRetake}>アンケートを受け直す</button></div></section>; }
function Diagnosis({ scores, average, answers, goal, locked, weakestCategory, updateAnswer, onComplete, onRetake, onOpenAuth }) { const answeredCount = answers.filter((answer) => answer !== null).length; const complete = answeredCount === answers.length; return <section className="page-section"><div className="section-intro"><div><span className="eyebrow">STEP 02 / 03</span><h2>{locked ? <>あなたの現在地が<br /><em>見えてきました。</em></> : <>性格のアンケートに<br /><em>答えてみよう。</em></>}</h2></div><span className="completion">{answeredCount} / 20 <small>answered</small></span></div>{locked && <><div className="score-overview"><div className="score-number"><strong>{average}</strong><span>/ 100</span><small>あなたの現在の総合スコア</small></div><Radar scores={scores} /></div><div className="result-summary"><span className="eyebrow">YOUR NEXT STEP</span><h3>{weakestCategory.label}を、もう少し育ててみよう。</h3><p>あなたが目指す「{goal}」に向けて、今は<strong>{weakestCategory.label}</strong>が伸びしろです。足りないのではなく、これから育てられる部分として見てみましょう。</p><button className="primary-button" onClick={onOpenAuth}><LogIn size={17} />結果を保存するためにログイン</button></div></>}<div className="category-list">{categories.map((category, categoryIndex) => <div className="category-card" key={category.id}><div className="category-title"><span className="category-icon" style={{ color: category.color }}>{category.icon}</span><b>{category.label}</b>{locked && <span className="category-score" style={{ color: category.color }}>{scores[categoryIndex]}<small>/100</small></span>}</div>{locked && <div className="mini-bar"><span style={{ width: `${scores[categoryIndex]}%`, background: category.color }} /></div>}<div className="questions">{category.questions.map((question, questionIndex) => { const index = categoryIndex * 5 + questionIndex; return <div className="question" key={question}><span>{question}</span><div className="scale">{[1, 2, 3, 4, 5].map((value) => <button key={value} disabled={locked} className={answers[index] === value ? 'selected' : ''} onClick={() => updateAnswer(index, value)} aria-label={`${value}点`}>{value}</button>)}</div></div>; })}</div></div>)}</div><div className="diagnosis-actions">{locked ? <><span>診断結果は保存されています</span><button className="secondary-button" onClick={onRetake}>アンケートを受け直す</button></> : <button className="primary-button" disabled={!complete} onClick={onComplete}>診断を完了して結果を見る <ArrowRight size={17} /></button>}</div></section>; }
function Radar({ scores }) { const points = scores.map((score, index) => { const angle = -Math.PI / 2 + (Math.PI * 2 * index) / 4; const radius = 75 * (score / 100); return `${100 + Math.cos(angle) * radius},${100 + Math.sin(angle) * radius}`; }).join(' '); return <div className="radar-wrap"><svg viewBox="0 0 200 200" className="radar"><polygon points="100,25 175,100 100,175 25,100" fill="none" stroke="#d9ded8" /><polygon points="100,50 150,100 100,150 50,100" fill="none" stroke="#e6eae4" /><polygon points="100,75 125,100 100,125 75,100" fill="none" stroke="#e6eae4" /><line x1="100" y1="25" x2="100" y2="175" stroke="#e6eae4" /><line x1="25" y1="100" x2="175" y2="100" stroke="#e6eae4" /><polygon points={points} fill="rgba(95,158,144,.2)" stroke="#5f9e90" strokeWidth="2" /></svg><span className="radar-label top">協調性</span><span className="radar-label right">好奇心</span><span className="radar-label bottom">メンタル</span><span className="radar-label left">自信</span></div>; }
function GoalView({ goal, setGoal, onGoDiagnosis }) { return <section className="page-section simple-view"><span className="eyebrow">STEP 01 / 03</span><h2>どんな自分に、<br /><em>近づきたい？</em></h2><p className="lead">正解を選ぶ必要はありません。今のあなたが、少し心惹かれる言葉を選んでください。</p><div className="goal-grid">{values.map((value, index) => <button className={`goal-option ${goal === value ? 'chosen' : ''}`} key={value} onClick={() => setGoal(value)}><span>0{index + 1}</span><b>{value}</b>{goal === value && <Check size={18} />}</button>)}</div><div className="goal-footer"><span><Heart size={16} />選んだ目標はいつでも変えられます</span><button className="primary-button" onClick={onGoDiagnosis}>診断へ進む <ArrowRight size={17} /></button></div></section>; }
function GrowthView({ scores, average, logs, note, setNote, addLog, analyzing, aiInsight }) { return <section className="page-section simple-view growth-view"><span className="eyebrow">STEP 03 / 03</span><h2>今日は何した？<br /><em>小さな変化を残そう。</em></h2><p className="lead">今日できたことや感じたことを記録すると、あなたの成長が見えてきます。</p><div className="score-overview growth-score"><div className="score-number"><strong>{average}</strong><span>/ 100</span><small>あなたの現在の総合スコア</small></div><Radar scores={scores} /></div><div className="log-composer"><textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="今日は何した？できたことを書いてみる..." /><div className="composer-footer"><span>例：苦手な人にも、まず挨拶できた</span><button className="primary-button" onClick={addLog} disabled={analyzing}>{analyzing ? 'AIが分析中...' : <><Plus size={17} />記録して分析</>}</button></div></div>{aiInsight && <div className={`ai-result ${aiInsight.error ? 'error' : ''}`}><div className="ai-result-title"><Sparkles size={16} /><b>{aiInsight.error ? 'AI分析を利用できませんでした' : `${aiInsight.category}の進歩を発見`}</b></div><p>{aiInsight.error || aiInsight.progress}</p>{!aiInsight.error && <small>次の一歩：{aiInsight.tip}</small>}</div>}<div className="log-list"><div className="list-heading"><b>あなたの成長ログ</b><span>{logs.length} records</span></div>{logs.map((log, index) => <div className="log-item" key={`${log.text}-${index}`}><div className="log-check"><Check size={15} /></div><div><p>{log.text}</p><span>{log.date} · <b>{log.tag}</b></span></div></div>)}</div></section>; }
createRoot(document.getElementById('root')).render(<App />);
