import React, { useContext, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, FlatList } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { ContainerTopTitle } from "../../components/containers";
import { getFirestore, firebaseApp, collection, query, getDocs } from "firebase/firestore";
import { DonorContext } from "../../contexts/donor/context";
import { getDatabase, ref, onValue } from "firebase/database";
import { Colors, Theme } from "../../constants/setting";

// Função auxiliar para calcular pontos (necessária para o ranking)
const calculateTotalPoints = (collections) => {
  let points = 0;
  collections.forEach(item => {
    const typesArray = (typeof item.types === 'string' && item.types) ? item.types.split(',').map(type => type.trim()) : [];
    const weightMatch = String(item.weight).match(/\d+/);
    const weight = parseInt(weightMatch?.[0] ?? '0', 10);
    if (weight > 0 && typesArray.length > 0) {
      typesArray.forEach(type => {
        if (type === "plastico") points += weight * 80;
        if (type === "metal") points += weight * 12;
        if (type === "eletronico") points += weight * 15;
        if (type === "papel") points += weight * 50;
        if (type === "oil") points += weight * 10;
        if (type === "vidro") points += weight * 30;
      });
    }
  });
  return points;
};

export const Rewards = () => {
  const { donorState } = useContext(DonorContext);
  const [tarefas, setTarefas] = useState({});
  const [donorData, setDonorData] = useState([]);
  const [rankingPosition, setRankingPosition] = useState('-'); // Estado para a posição dinâmica
  const yourdonorId = donorState?.id;

  // Efeito que busca dados e calcula a posição do usuário no ranking
  useEffect(() => {
    if (!yourdonorId) return;
    
    const firestore = getFirestore(firebaseApp);
    const realtimeDB = getDatabase(firebaseApp);

    const firestoreDonorsRef = collection(firestore, 'donor');
    const rtdbInfoRef = ref(realtimeDB, 'recyclable/');

    const fetchNamesAndListen = async () => {
      const donorNamesMap = {};
      try {
        const snapshot = await getDocs(query(firestoreDonorsRef));
        snapshot.forEach((doc) => {
          donorNamesMap[doc.id] = doc.data().name || 'Doador Anônimo';
        });
      } catch (e) {
        console.error("Erro ao buscar nomes do Firestore:", e);
      }

      const unsubscribe = onValue(rtdbInfoRef, (snapshot) => {
        if (!snapshot.exists()) {
          setDonorData([]);
          setRankingPosition('-');
          return;
        }
        
        const data = snapshot.val();
        const allDonorsCollections = {};
        for (const id in data) {
          const donorInfo = data[id];
          const currentDonorId = donorInfo?.donor?.id;
          if (currentDonorId) {
            if (!allDonorsCollections[currentDonorId]) {
              allDonorsCollections[currentDonorId] = [];
            }
            allDonorsCollections[currentDonorId].push({
              types: donorInfo.types ?? '',
              weight: donorInfo.weight ?? '0 KG',
            });
          }
        }

        const donorScores = Object.keys(allDonorsCollections).map(donorId => ({
          donorId: donorId,
          score: calculateTotalPoints(allDonorsCollections[donorId]),
          name: donorNamesMap[donorId] || 'Doador Anônimo'
        }));

        donorScores.sort((a, b) => b.score - a.score);
        
        const myRankIndex = donorScores.findIndex(d => d.donorId === yourdonorId);
        setRankingPosition(myRankIndex !== -1 ? `${myRankIndex + 1}º` : '-');

        const currentUserCollections = allDonorsCollections[yourdonorId] || [];
        setDonorData(currentUserCollections);
      });

      return unsubscribe;
    };

    let unsubscribeFromRTDB;
    fetchNamesAndListen().then(unsub => unsubscribeFromRTDB = unsub);

    return () => {
      if (unsubscribeFromRTDB) unsubscribeFromRTDB();
    };
  }, [yourdonorId]);

  // Efeito para calcular KGs do usuário atual
  useEffect(() => {
    const typesWeight = {};
    donorData.forEach(item => {
      const typesArray = (typeof item.types === 'string' && item.types) ? item.types.split(',').map(type => type.trim()) : [];
      const weightMatch = String(item.weight).match(/\d+/);
      const weight = parseInt(weightMatch?.[0] ?? '0', 10);
      if (weight > 0 && typesArray.length > 0) {
        typesArray.forEach(type => {
          typesWeight[type] = (typesWeight[type] || 0) + weight;
        });
      }
    });
    setTarefas({
      collectionsCompleted: donorData.length,
      eletronicKg: typesWeight["eletronico"] || 0,
      glassKg: typesWeight["vidro"] || 0,
      metalKg: typesWeight["metal"] || 0,
      oilKg: typesWeight["oil"] || 0,
      paperKg: typesWeight["papel"] || 0,
      plasticKg: typesWeight["plastico"] || 0
    });
  }, [donorData]);

  // Cálculos para exibição na UI
  const { plasticKg, metalKg, eletronicKg, paperKg, oilKg, glassKg } = tarefas;
  const quantidadetotal = plasticKg + metalKg + eletronicKg + paperKg + oilKg + glassKg;
  const pontuacaototal = calculateTotalPoints(donorData);
  const max = Math.max(plasticKg, metalKg, eletronicKg, paperKg, oilKg, glassKg) || 1;

  const barData = [
    { height: (plasticKg / max) * 100, value: plasticKg, label: 'Plástico' },
    { height: (metalKg / max) * 100, value: metalKg, label: 'Metal' },
    { height: (eletronicKg / max) * 100, value: eletronicKg, label: 'Eletrônico' },
    { height: (paperKg / max) * 100, value: paperKg, label: 'Papel' },
    { height: (oilKg / max) * 100, value: oilKg, label: 'Óleo' },
    { height: (glassKg / max) * 100, value: glassKg, label: 'Vidro' },
  ];
  
  // Cards de estatísticas com o valor do ranking dinâmico
  const stats = [
    { title: 'Resíduos reciclados', value: `${quantidadetotal} kg`, icon: 'recycle' },
    { title: 'Pontos ganhos', value: pontuacaototal, icon: 'star' },
    { title: 'Sua Posição', value: rankingPosition, icon: 'trophy' }, // CORRIGIDO: Usa o estado dinâmico
  ];

  return (
    <ScrollView contentContainerStyle={styles.dashboardContainer}>
      <ContainerTopTitle title={"Estatísticas"}/>
      <View style={styles.cardsContainer}>
        {stats.map((item, i) => (
          <View key={i} style={styles.card}>
            <View style={styles.iconContainer}>
              <FontAwesome name={item.icon} size={30} />
            </View>
            <View style={styles.info}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.wasteSection}>
        <Text style={styles.subheader}>Seus Resíduos Coletados</Text>
        <FlatList
          data={barData}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={({ item }) => (
            <View style={styles.wasteItem}>
              <Text style={styles.wasteType}>{item.label}</Text>
              <View style={styles.wasteBarContainer}>
                <View style={[styles.wasteBar, { backgroundColor: Colors[Theme][2], width: `${Math.min(item.height, 100)}%` }]} />
              </View>
              <Text style={styles.wasteAmount}>{item.value} kg</Text>
            </View>
          )}
        />
      </View>
      
      {}

    </ScrollView>
  );
};

// Estilos (sem os estilos do ranking geral)
const styles = StyleSheet.create({
    dashboardContainer: { padding: 20, backgroundColor: '#fff' },
    cardsContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', padding: 20, backgroundColor: '#fff', borderRadius: 10, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    card: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', backgroundColor: '#fff', borderRadius: 12, width: 200, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    iconContainer: { width: 60, height: 60, backgroundColor: 'rgb(204,253,195)', borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 15 },
    info: { flex: 1 },
    cardTitle: { fontSize: 16, color: '#555' },
    cardValue: { fontSize: 20, fontWeight: 'bold', marginTop: 5, color: '#000' },
    wasteSection: { marginTop: 20, padding: 20, backgroundColor: '#fff', borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 2 },
    subheader: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#333' },
    wasteItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
    wasteType: { flex: 1.5, fontSize: 16, color: '#555' },
    wasteBarContainer: { flex: 4, height: 20, backgroundColor: '#f0f0f0', borderRadius: 5, overflow: 'hidden', marginHorizontal: 15 },
    wasteBar: { height: '100%', borderRadius: 5 },
    wasteAmount: { flex: 1, textAlign: 'right', fontSize: 16, fontWeight: 'bold', color: '#555' },
});