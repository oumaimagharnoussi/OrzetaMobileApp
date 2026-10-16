import React, { useCallback, useEffect, useState } from "react";

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert as AlertNatif,
  Platform,
  RefreshControl,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";

import {
  listerArchives,
  ouvrirArchive,
  LIBELLES_SOURCE,
  formatTaille,
  formatDate,
} from "../services/pdfArchives";

// Alert.alert n'affiche rien sur le web : on utilise window.alert
const Alert = {
  alert: (titre, message) =>
    Platform.OS === "web"
      ? window.alert(`${titre}\n\n${message}`)
      : AlertNatif.alert(titre, message),
};

// =====================================================
// FICHES PDF VALIDÉES
// /archives               → toutes les fiches (admin : tout,
//                           commercial : ses visiteurs)
// /archives?visiteur=12   → fiches d'un visiteur
// =====================================================

export default function Archives() {
  const { visiteur } = useLocalSearchParams();
  const visiteurId = Array.isArray(visiteur) ? visiteur[0] : visiteur;

  const [archives, setArchives] = useState([]);
  const [recherche, setRecherche] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const charger = useCallback(async (q) => {
    try {
      setArchives(await listerArchives({ visiteurId, q }));
    } catch (error) {
      Alert.alert("Erreur", error.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [visiteurId]);

  useEffect(() => {
    const minuterie = setTimeout(() => charger(recherche.trim()), 300);
    return () => clearTimeout(minuterie);
  }, [recherche, charger]);

  async function ouvrir(id, telecharger) {
    try {
      await ouvrirArchive(id, { telecharger });
    } catch (error) {
      Alert.alert("Erreur", error.message);
    }
  }

  function renderArchive({ item }) {
    const client =
      [item.prenom, item.nom].filter(Boolean).join(" ") || `Visiteur ${item.visiteur_id}`;

    return (
      <View style={styles.carte}>
        <View style={{ flex: 1 }}>
          <Text style={styles.reference}>
            {item.reference || "Sans référence"}
            <Text style={styles.version}>  · v{item.version}</Text>
          </Text>

          <Text style={styles.client}>
            {client}
            {item.societe ? ` · ${item.societe}` : ""}
          </Text>

          <Text style={styles.details}>
            {formatDate(item.created_at)} · {LIBELLES_SOURCE[item.source] || item.source}
            {" "}· {formatTaille(item.taille)}
          </Text>
        </View>

        <TouchableOpacity style={styles.bouton} onPress={() => ouvrir(item.id, false)}>
          <Ionicons name="eye-outline" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.bouton, styles.boutonSecondaire]}
          onPress={() => ouvrir(item.id, true)}
        >
          <Ionicons name="download-outline" size={20} color="#556b2f" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.title}>Fiches PDF validées</Text>
          <Text style={styles.sousTitre}>
            {visiteurId ? "Fiches de ce visiteur" : "Toutes les fiches"} · {archives.length} fiche(s)
          </Text>
        </View>
      </View>

      <View style={styles.rechercheZone}>
        <Ionicons name="search" size={18} color="#777" />
        <TextInput
          style={styles.recherche}
          placeholder="Référence, nom ou société"
          value={recherche}
          onChangeText={setRecherche}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
        </View>
      ) : (
        <FlatList
          data={archives}
          keyExtractor={(a) => String(a.id)}
          renderItem={renderArchive}
          contentContainerStyle={{ padding: 12, paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                charger(recherche.trim());
              }}
            />
          }
          ListEmptyComponent={
            <Text style={styles.vide}>
              Aucune fiche validée. Une fiche est enregistrée
              automatiquement dès qu'elle est validée.
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  title: { fontSize: 22, fontWeight: "bold" },
  sousTitre: { color: "#666", fontSize: 12, marginTop: 2 },

  rechercheZone: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    margin: 12,
    marginBottom: 0,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  recherche: { flex: 1, padding: 10 },

  carte: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  reference: { fontSize: 16, fontWeight: "bold", color: "#222" },
  version: { fontSize: 13, fontWeight: "normal", color: "#666" },
  client: { fontSize: 13, color: "#333", marginTop: 2 },
  details: { fontSize: 12, color: "#777", marginTop: 4 },

  bouton: {
    backgroundColor: "#556b2f",
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  boutonSecondaire: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#556b2f",
  },

  vide: { textAlign: "center", color: "#777", marginTop: 40, paddingHorizontal: 20 },
});
