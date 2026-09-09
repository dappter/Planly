import {
  initializeApp,
  getApps,
  getApp,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "__FIREBASE_API_KEY__",
  authDomain: "meu-app-94c74.firebaseapp.com",
  projectId: "meu-app-94c74",
  storageBucket: "meu-app-94c74.firebasestorage.app",
  messagingSenderId: "711758646512",
  appId: "1:711758646512:web:d9dae94a6d47c8f89a4635",
  measurementId: "G-4BDC95W4VJ",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const rankTiers = [
  { name: "Bronze", minXp: 0, desc: "Primeiros passos na jornada." },
  { name: "Prata", minXp: 200, desc: "Ritmo consistente e firme." },
  { name: "Ouro", minXp: 500, desc: "Produtividade em alta." },
  { name: "Platina", minXp: 900, desc: "Foco acima da média." },
  { name: "Diamante", minXp: 1400, desc: "Elite da disciplina." },
];

function getRankTier(xp) {
  const tier = [...rankTiers].reverse().find((t) => xp >= t.minXp);
  return tier || rankTiers[0];
}

function getDisplayName(user) {
  const storageKey = user?.uid
    ? `planly_display_name_${user.uid}`
    : "planly_display_name";
  return (
    localStorage.getItem(storageKey) ||
    user?.displayName ||
    user?.email?.split("@")[0] ||
    "Usuário"
  );
}

function getLocalStats() {
  try {
    const raw = localStorage.getItem("planly_public_stats");
    if (!raw) return { xp: 0, level: 1, streak: 0 };
    const stats = JSON.parse(raw);
    return {
      xp: Number(stats.xp) || 0,
      level: Number(stats.level) || 1,
      streak: Number(stats.streak) || 0,
    };
  } catch {
    return { xp: 0, level: 1, streak: 0 };
  }
}

function renderRanking(entries, currentUserId) {
  const list = document.getElementById("rankingList");
  if (!list) return;

  if (!entries.length) {
    list.innerHTML =
      "<div class='map-hint'>Sem usuários no ranking ainda.</div>";
    return;
  }

  list.innerHTML = entries
    .map((entry, index) => {
      const tier = getRankTier(entry.xp || 0);
      const isUser = entry.uid === currentUserId;
      return `
        <div class="ranking-row ${isUser ? "me" : ""}">
          <div class="ranking-position">#${index + 1}</div>
          <div class="ranking-name">${entry.displayName || "Usuário"}</div>
          <div class="ranking-tier">${tier.name}</div>
          <div class="ranking-xp">${entry.xp || 0} XP</div>
        </div>
      `;
    })
    .join("");
}

function updateTierCard(xp) {
  const tier = getRankTier(xp);
  const tierName = document.getElementById("rankTierName");
  const tierDesc = document.getElementById("rankTierDesc");
  if (tierName) tierName.textContent = tier.name;
  if (tierDesc) tierDesc.textContent = tier.desc;
}

function subscribeRanking(currentUserId) {
  const rankingRef = collection(db, "rankings");
  const rankingQuery = query(rankingRef, orderBy("xp", "desc"), limit(20));

  return onSnapshot(rankingQuery, (snapshot) => {
    const entries = snapshot.docs.map((docSnap) => docSnap.data());
    renderRanking(entries, currentUserId);
  });
}

let unsubscribeRanking = null;
let lastSyncedXp = null;

function syncUserStats(user) {
  const stats = getLocalStats();
  if (stats.xp === lastSyncedXp) return;
  lastSyncedXp = stats.xp;

  const displayName = getDisplayName(user);
  const ref = doc(db, "rankings", user.uid);
  setDoc(
    ref,
    {
      uid: user.uid,
      displayName,
      xp: stats.xp,
      level: stats.level,
      streak: stats.streak,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
  updateTierCard(stats.xp);
}

onAuthStateChanged(auth, (user) => {
  if (!user) return;

  if (unsubscribeRanking) {
    unsubscribeRanking();
  }

  unsubscribeRanking = subscribeRanking(user.uid);
  syncUserStats(user);

  window.addEventListener("planly-stats-updated", () => {
    syncUserStats(user);
  });

  window.addEventListener("planly-display-name-updated", () => {
    syncUserStats(user);
  });
});
