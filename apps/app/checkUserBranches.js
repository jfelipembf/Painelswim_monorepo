const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

const app = initializeApp({
  apiKey: 'AIzaSyDSBtwhvB-5j5dKqcqADhQdq59ElH63Chw',
  authDomain: 'painelswim.firebaseapp.com',
  projectId: 'painelswim',
  storageBucket: 'painelswim.firebasestorage.app',
  messagingSenderId: '858233804956',
  appId: '1:858233804956:web:afbbb698f249d434393559'
});

const db = getFirestore(app);

(async () => {
  const tenantId = '71Tyxx84WNf4X33pZHUv';
  const branches = [
    { id: 'JsQlAH6gbaDBVNQbM0u1', slug: 'unidade-1' },
    { id: 'TWhJx3PhW6MerE6lkGT8', slug: 'unidade-2' }
  ];
  const userId = 'pm82a44eQBc9jRxPuoyyNKoBW803';

  for (const branch of branches) {
    const membersRef = collection(db, `tenants/${tenantId}/branches/${branch.id}/members`);
    const q = query(membersRef, where('idUser', '==', userId));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`❌ Usuário NÃO tem acesso na branch ${branch.slug}`);
    } else {
      snapshot.forEach((doc) => {
        console.log(`✅ Usuário TEM acesso na branch ${branch.slug}:`, doc.data());
      });
    }
  }

  process.exit(0);
})();
