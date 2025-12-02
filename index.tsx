
import React, { useState, useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  doc,
  startAfter,
  QueryDocumentSnapshot
} from 'firebase/firestore';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL 
} from 'firebase/storage';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

import { FULL_DECK } from './constants';
import { DrawnCard, ReadingDoc, ViewState } from './types';

// --- Firebase Config ---
const firebaseConfig = {
  apiKey: "AIzaSyBtnDSuiHxfFqslKhUR5lzKZG10QJ_zQPU",
  authDomain: "tarot-journal-ea322.firebaseapp.com",
  projectId: "tarot-journal-ea322",
  storageBucket: "tarot-journal-ea322.firebasestorage.app",
  messagingSenderId: "474929798896",
  appId: "1:474929798896:web:935b452bd614215129ac35"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// --- Gemini API ---
const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Components ---

const Toast = ({ message, type, show, onClose }: { message: string, type: 'success' | 'error', show: boolean, onClose: () => void }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 3000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className={`fixed bottom-5 right-5 px-6 py-3 rounded-lg shadow-xl text-white font-bold transition-all transform duration-500 z-50 ${
      type === 'success' ? 'bg-green-600' : 'bg-red-600'
    } animate-fade-in-up`}>
      {message}
    </div>
  );
};

const Spinner = () => (
  <div className="flex justify-center items-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
  </div>
);

const getErrorMessage = (code: string) => {
  switch (code) {
    case 'auth/invalid-email': return '電子郵件格式錯誤';
    case 'auth/user-disabled': return '帳號已被停用';
    case 'auth/user-not-found': return '找不到此帳號';
    case 'auth/wrong-password': return '密碼錯誤';
    case 'auth/email-already-in-use': return '此 Email 已被註冊';
    case 'auth/weak-password': return '密碼強度不足';
    default: return '發生錯誤，請稍後再試';
  }
};

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [view, setView] = useState<ViewState>('auth');
  
  // Reading State
  const [question, setQuestion] = useState('');
  const [drawnCards, setDrawnCards] = useState<DrawnCard[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentReadingId, setCurrentReadingId] = useState<string | null>(null);
  const reportRef = useRef<HTMLDivElement>(null);

  // History State
  const [history, setHistory] = useState<ReadingDoc[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);

  // Toast State
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({
    show: false, message: '', type: 'success'
  });

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
      if (currentUser) {
        setView('home');
        loadHistory(currentUser.uid, true);
      } else {
        setView('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const loadHistory = async (uid: string, isRefresh = false) => {
    if (!uid) return;
    if (loadingHistory) return;
    
    setLoadingHistory(true);
    try {
      let q = query(
        collection(db, 'readings'),
        where('userId', '==', uid),
        orderBy('createdAt', 'desc'),
        limit(12)
      );

      if (!isRefresh && lastVisible) {
        q = query(
          collection(db, 'readings'),
          where('userId', '==', uid),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(12)
        );
      }

      const querySnapshot = await getDocs(q);
      const docs: ReadingDoc[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({ 
          id: doc.id, 
          userId: data.userId,
          question: data.question,
          cards: data.cards,
          reportText: data.reportText,
          reportHtml: data.reportHtml,
          downloadUrl: data.downloadUrl,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });

      setLastVisible(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === 12);
      
      if (isRefresh) {
        setHistory(docs);
      } else {
        setHistory(prev => [...prev, ...docs]);
      }
    } catch (error) {
      console.error("Error loading history:", error);
      showToast('載入歷史紀錄失敗', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setAuthError(getErrorMessage(err.code));
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setDrawnCards([]);
    setQuestion('');
    setInterpretation('');
    setCurrentReadingId(null);
    setHistory([]);
  };

  const handleDraw = async () => {
    if (!question.trim()) {
      showToast('請輸入心中疑惑', 'error');
      return;
    }
    setIsGenerating(true);
    setInterpretation('');
    setCurrentReadingId(null);
    setView('reading');

    // 1. Draw 3 unique cards
    const deck = [...FULL_DECK];
    const selected: DrawnCard[] = [];
    const positions = ['Past', 'Present', 'Future'] as const;
    const positionsCN = ['過去', '現在', '未來'];

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * deck.length);
      const card = deck.splice(randomIndex, 1)[0];
      const isReversed = Math.random() < 0.5;
      selected.push({
        card,
        isReversed,
        position: positions[i],
        positionCN: positionsCN[i]
      });
    }
    setDrawnCards(selected);

    // 2. Generate AI Interpretation
    try {
      const prompt = `
        你是一位精通塔羅牌的「福星何大師」。請根據使用者的問題和抽出的三張牌進行解讀。
        
        問題：${question}
        
        抽牌結果：
        1. 過去：${selected[0].card.nameCN} (${selected[0].isReversed ? '逆位' : '正位'}) - ${selected[0].isReversed ? selected[0].card.reversedSummary : selected[0].card.uprightSummary}
        2. 現在：${selected[1].card.nameCN} (${selected[1].isReversed ? '逆位' : '正位'}) - ${selected[1].isReversed ? selected[1].card.reversedSummary : selected[1].card.uprightSummary}
        3. 未來：${selected[2].card.nameCN} (${selected[2].isReversed ? '逆位' : '正位'}) - ${selected[2].isReversed ? selected[2].card.reversedSummary : selected[2].card.uprightSummary}

        請輸出一個 JSON 物件，格式如下：
        {
          "interpretation": "這裡放整體的解牌敘述，將三張牌連結起來回答問題，請使用HTML標籤如<p>分段。",
          "advice": ["建議行動1", "建議行動2", "建議行動3"],
          "closing": "一句充滿智慧與祝福的結語"
        }
        請確保語氣神秘但溫暖，富有洞察力。繁體中文回答。
      `;

      const response = await genAI.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      const text = response.text;
      if (!text) throw new Error("AI response empty");
      
      const result = JSON.parse(text);
      
      const formattedReport = `
<div class="space-y-4">
  <div class="report-section">
    <h3 class="text-xl font-bold text-yellow-500 mb-2 border-b border-yellow-500/30 pb-1">大師解牌</h3>
    <div class="leading-relaxed text-gray-200">${result.interpretation}</div>
  </div>

  <div class="report-section">
    <h3 class="text-xl font-bold text-yellow-500 mb-2 border-b border-yellow-500/30 pb-1">指引與建議</h3>
    <ul class="list-disc list-inside space-y-2 text-gray-200">
      ${result.advice.map((item: string) => `<li>${item}</li>`).join('')}
    </ul>
  </div>

  <div class="report-section pt-4">
    <h3 class="text-xl font-bold text-yellow-500 mb-2">結語</h3>
    <p class="italic text-purple-200 text-lg">"${result.closing}"</p>
  </div>
</div>
      `.trim();

      setInterpretation(formattedReport);
      
    } catch (error) {
      console.error(error);
      setInterpretation("<p class='text-red-400'>大師現在正在冥想中，請稍後再試。（連線錯誤）</p>");
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper: Just save data to Firestore
  const saveToFirestoreOnly = async (): Promise<string | null> => {
    if (!user || !interpretation) return null;
    setIsSaving(true);
    try {
      // Create stripped text for searching/preview
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = interpretation;
      const strippedText = tempDiv.textContent || "";

      const docData = {
        userId: user.uid,
        question,
        cards: drawnCards.map(d => ({
          cardId: d.card.id,
          isReversed: d.isReversed,
          position: d.position
        })),
        reportText: strippedText, 
        reportHtml: interpretation,
        downloadUrl: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'readings'), docData);
      setCurrentReadingId(docRef.id);
      
      // Refresh history to show new item
      loadHistory(user.uid, true);
      showToast('紀錄已保存至歷史', 'success');
      return docRef.id;
    } catch (error) {
      console.error(error);
      showToast('保存失敗', 'error');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    await saveToFirestoreOnly();
  };

  const handleDownloadPDF = async () => {
    if (!reportRef.current || !user) return;
    
    setIsSaving(true);
    try {
      showToast('正在生成 PDF...', 'success');
      
      // 1. Ensure we have a doc ID (save if not saved yet)
      let docId = currentReadingId;
      if (!docId) {
        docId = await saveToFirestoreOnly();
      }
      if (!docId) throw new Error("Failed to create document");

      // 2. Generate PDF
      // Wait a moment for images/fonts
      await new Promise(r => setTimeout(r, 500));
      
      const canvas = await html2canvas(reportRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: '#1a1033',
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // 3. Local Download
      pdf.save(`Tarot_Journal_${docId}.pdf`);
      
      // 4. Upload to Firebase Storage
      const pdfBlob = pdf.output('blob');
      const storageRef = ref(storage, `readings/${user.uid}/${docId}.pdf`);
      
      showToast('正在上傳雲端備份...', 'success');
      await uploadBytes(storageRef, pdfBlob);
      const downloadUrl = await getDownloadURL(storageRef);
      
      // 5. Update Firestore
      await updateDoc(doc(db, 'readings', docId), { 
        downloadUrl,
        updatedAt: serverTimestamp()
      });
      
      // Update local history
      loadHistory(user.uid, true);
      showToast('PDF 下載成功並已備份', 'success');
      
    } catch (error) {
      console.error("PDF Error:", error);
      showToast('PDF 生成或上傳失敗', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const viewHistoryItem = (item: ReadingDoc) => {
    // Reconstruct view state from history item
    setQuestion(item.question);
    
    // Map stored card data back to full card objects
    const restoredCards = item.cards.map(c => {
      const fullCard = FULL_DECK.find(f => f.id === c.cardId) || FULL_DECK[0];
      return {
        card: fullCard,
        isReversed: c.isReversed,
        position: c.position,
        positionCN: c.position === 'Past' ? '過去' : c.position === 'Present' ? '現在' : '未來'
      } as DrawnCard;
    });
    
    setDrawnCards(restoredCards);
    // Prefer HTML report if available, fallback to text
    setInterpretation(item.reportHtml || `<p>${item.reportText}</p>`);
    setCurrentReadingId(item.id || null);
    setView('reading');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Render Functions ---

  if (authLoading) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 text-white">
        <h1 className="text-3xl font-serif text-yellow-500 mb-4 animate-pulse">福星何大師</h1>
        <Spinner />
        <p className="mt-4 text-gray-400">正在連接靈界...</p>
      </div>
    );
  }

  // Auth View
  if (view === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-900 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
        <div className="w-full max-w-md bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-gray-700">
          <div className="p-8">
            <h2 className="text-3xl font-serif text-center text-yellow-500 mb-2">福星何大師</h2>
            <p className="text-center text-purple-300 mb-8 font-light tracking-widest">TAROT JOURNAL</p>
            
            <form onSubmit={handleAuth} className="space-y-6">
              <div>
                <label className="block text-sm text-gray-400 mb-1">電子郵件</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white focus:border-yellow-500 outline-none transition"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">密碼</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-600 rounded px-4 py-2 text-white focus:border-yellow-500 outline-none transition"
                  required
                />
              </div>
              
              {authError && (
                <p className="text-red-400 text-sm text-center bg-red-900/20 p-2 rounded">{authError}</p>
              )}
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-3 rounded transition shadow-lg transform hover:scale-[1.02]"
              >
                {isLoginMode ? '登入' : '註冊'}
              </button>
            </form>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setAuthError('');
                }}
                className="text-gray-400 hover:text-yellow-500 text-sm transition"
              >
                {isLoginMode ? '還沒有帳號？點此註冊' : '已有帳號？點此登入'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main App Structure
  return (
    <div className="min-h-screen flex flex-col bg-[#1a1033] text-gray-100 font-serif bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      {/* Navbar */}
      <nav className="bg-[#2d1b4e]/90 backdrop-blur-md border-b border-purple-900 shadow-lg sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
          <div 
            className="text-xl font-bold text-yellow-500 cursor-pointer flex items-center gap-2 hover:text-yellow-400 transition" 
            onClick={() => setView('home')}
          >
            <span className="text-2xl">🔮</span> <span className="hidden sm:inline">福星何大師</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden md:inline text-purple-200 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm border border-purple-600 rounded hover:bg-purple-800 transition text-purple-200"
            >
              登出
            </button>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 py-6">
        
        {view === 'home' && (
          <div className="space-y-10 animate-fade-in">
            {/* Draw Section */}
            <div className="bg-[#261841] rounded-2xl p-6 md:p-10 shadow-2xl border border-purple-900/50 text-center">
              <h2 className="text-2xl md:text-3xl text-white mb-6 font-bold tracking-wide">您想詢問什麼？</h2>
              <div className="flex flex-col md:flex-row gap-4 max-w-2xl mx-auto">
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="例如：我最近的工作運勢如何？"
                  className="flex-1 bg-[#1a1033] border border-purple-700 rounded-lg px-4 py-3 text-white focus:border-yellow-500 outline-none transition shadow-inner text-lg placeholder-gray-600"
                />
                <button
                  onClick={handleDraw}
                  className="bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-black font-bold px-8 py-3 rounded-lg transition shadow-lg whitespace-nowrap transform hover:scale-105"
                >
                  抽三張牌
                </button>
              </div>
            </div>

            {/* History Section */}
            <div>
              <div className="flex items-center mb-6">
                <h3 className="text-xl text-purple-200 font-bold border-l-4 border-yellow-500 pl-3">歷史占卜紀錄</h3>
                <span className="ml-auto text-xs text-gray-500">僅顯示最近紀錄</span>
              </div>

              {history.length === 0 && !loadingHistory ? (
                <div className="text-center py-12 bg-[#261841]/50 rounded-xl border border-dashed border-purple-800">
                  <p className="text-gray-400 text-lg">尚無紀錄</p>
                  <p className="text-gray-600 text-sm mt-2">請在上方輸入問題，開始您的第一次占卜。</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {history.map((item) => (
                      <div 
                        key={item.id}
                        onClick={() => viewHistoryItem(item)}
                        className="bg-[#2d1b4e] p-5 rounded-xl cursor-pointer hover:bg-[#382260] transition border border-transparent hover:border-yellow-500/30 group shadow-lg relative overflow-hidden"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs text-purple-400">
                            {item.createdAt?.seconds ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : '剛剛'}
                          </span>
                          {item.downloadUrl && (
                            <span className="text-[10px] bg-green-900/50 text-green-300 px-2 py-0.5 rounded border border-green-800">PDF</span>
                          )}
                        </div>
                        <h4 className="font-bold text-lg text-white group-hover:text-yellow-400 transition line-clamp-2 mb-2">
                          {item.question}
                        </h4>
                        <p className="text-sm text-gray-400 line-clamp-3">
                          {item.reportText}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  {hasMore && history.length > 0 && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={() => user && loadHistory(user.uid)}
                        disabled={loadingHistory}
                        className="text-purple-300 hover:text-white border border-purple-700 hover:bg-purple-800 px-6 py-2 rounded-full transition text-sm disabled:opacity-50"
                      >
                        {loadingHistory ? '載入中...' : '載入更多'}
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {view === 'reading' && (
          <div className="animate-fade-in pb-12">
            <button 
              onClick={() => setView('home')} 
              className="mb-4 text-purple-300 hover:text-white flex items-center gap-2 transition group"
            >
              <span className="group-hover:-translate-x-1 transition-transform">←</span> 返回首頁
            </button>
            
            {/* The Report Container (Ref for PDF) */}
            <div ref={reportRef} className="bg-[#261841] p-6 md:p-12 rounded-xl shadow-2xl border border-white/5 relative overflow-hidden">
              {/* Decorative background element for PDF aesthetics */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-600/5 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

              <div className="relative z-10 text-center mb-10 border-b border-white/10 pb-6">
                <p className="text-purple-300 text-xs tracking-[0.2em] uppercase mb-3">The Question</p>
                <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">{question}</h2>
              </div>

              {/* Cards Display */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-12">
                {drawnCards.map((item, idx) => (
                  <div key={idx} className={`flex flex-col items-center animate-fade-in-up`} style={{ animationDelay: `${idx * 150}ms` }}>
                    <span className="text-yellow-500 font-bold mb-4 tracking-widest text-sm uppercase">{item.positionCN}</span>
                    <div className={`relative w-48 h-80 rounded-lg shadow-2xl transition-transform duration-700 ${isGenerating ? 'animate-pulse' : 'hover:scale-105'}`}>
                      <div className={`w-full h-full rounded-lg overflow-hidden border-[3px] ${item.isReversed ? 'border-red-500/50' : 'border-yellow-500/50'} relative bg-black`}>
                        <img 
                          src={item.card.imagePlaceholder} 
                          alt={item.card.name}
                          crossOrigin="anonymous" 
                          className={`w-full h-full object-cover ${item.isReversed ? 'rotate-180' : ''}`}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent pointer-events-none"></div>
                        <div className="absolute bottom-4 left-0 right-0 text-center px-2">
                          <p className={`text-white font-bold text-xl ${item.isReversed ? 'rotate-180' : ''} drop-shadow-md`}>
                            {item.card.nameCN}
                          </p>
                          <p className={`text-[10px] uppercase tracking-wider text-gray-400 mt-1 ${item.isReversed ? 'rotate-180' : ''}`}>
                             {item.card.name}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 text-center">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${item.isReversed ? 'bg-red-900/40 text-red-300 border border-red-800' : 'bg-green-900/40 text-green-300 border border-green-800'}`}>
                        {item.isReversed ? '逆位 (Reversed)' : '正位 (Upright)'}
                      </span>
                      <p className="text-xs text-gray-400 max-w-[180px]">
                         {item.isReversed ? item.card.reversedKeywords.slice(0,3).join(' • ') : item.card.uprightKeywords.slice(0,3).join(' • ')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interpretation Report */}
              <div className="bg-[#1a1033] p-6 md:p-10 rounded-xl border border-purple-800/50 shadow-inner min-h-[200px]">
                {isGenerating ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Spinner />
                    <p className="text-purple-300 animate-pulse text-lg">福星何大師正在觀測星象與牌陣...</p>
                  </div>
                ) : (
                  <div 
                    className="prose prose-invert prose-yellow max-w-none text-gray-300"
                    dangerouslySetInnerHTML={{ __html: interpretation }}
                  />
                )}
              </div>
              
              <div className="mt-10 text-center text-xs text-gray-500 border-t border-white/5 pt-4">
                 福星何大師塔羅占卜 • Tarot Journal • {new Date().toLocaleDateString()}
              </div>
            </div>

            {/* Action Buttons */}
            {!isGenerating && interpretation && (
              <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={handleManualSave}
                  disabled={isSaving}
                  className="bg-purple-700 hover:bg-purple-600 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isSaving ? <Spinner /> : '💾 保存至歷史'}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isSaving}
                  className="bg-yellow-600 hover:bg-yellow-500 disabled:bg-gray-600 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition flex items-center justify-center gap-2"
                >
                  {isSaving ? '生成中...' : '📥 下載 PDF 報告'}
                </button>
              </div>
            )}
          </div>
        )}

      </main>

      <Toast 
        show={toast.show} 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ ...toast, show: false })} 
      />
    </div>
  );
};

const root = createRoot(document.getElementById('root')!);
root.render(<App />);
