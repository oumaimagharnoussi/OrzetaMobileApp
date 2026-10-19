import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { apiFetch } from "../../services/api";

export default function AdminVisiteurs() {
  const [visiteurs, setVisiteurs] = useState([]);
  const [filteredVisiteurs, setFilteredVisiteurs] = useState([]);

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("Tous");
  const [suppressionId, setSuppressionId] = useState(null);

  // =====================================================
  // CHARGER LES VISITEURS
  // =====================================================

  async function loadVisiteurs() {
    try {
      setLoading(true);

      const data = await apiFetch("/api/visiteurs");

      console.log("VISITEURS ADMIN :", data);

      const liste = data.visiteurs || [];

      setVisiteurs(liste);
      setFilteredVisiteurs(liste);
    } catch (error) {
      console.error("Erreur visiteurs :", error);

      Alert.alert(
        "Erreur",
        error.message || "Impossible de charger les visiteurs."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadVisiteurs();
  }, []);

  // =====================================================
  // SUPPRIMER UN VISITEUR
  // =====================================================

  // Alert.alert ne s'affiche pas sur le web
  function confirmer(titre, message, onConfirm) {
    if (Platform.OS === "web") {
      if (window.confirm(`${titre}

${message}`)) onConfirm();
      return;
    }

    Alert.alert(titre, message, [
      { text: "Annuler", style: "cancel" },
      { text: "Supprimer", style: "destructive", onPress: onConfirm },
    ]);
  }

  function informer(titre, message) {
    if (Platform.OS === "web") {
      window.alert(`${titre}

${message}`);
    } else {
      Alert.alert(titre, message);
    }
  }

  function demanderSuppression(item) {
    confirmer(
      "Supprimer le visiteur",
      `Voulez-vous vraiment supprimer « ${item.nom || "ce visiteur"} » ?

` +
        "Ses commandes et sa carte de visite seront aussi supprimées. " +
        "Cette action est définitive.",
      () => supprimerVisiteur(item)
    );
  }

  async function supprimerVisiteur(item) {
    try {
      setSuppressionId(item.id);

      await apiFetch(`/api/visiteurs/${item.id}`, {
        method: "DELETE",
      });

      setVisiteurs((liste) =>
        liste.filter((v) => v.id !== item.id)
      );

      informer("Supprimé", "Le visiteur a été supprimé.");
    } catch (error) {
      console.error("Erreur suppression visiteur :", error);

      informer(
        "Erreur",
        error.message || "Impossible de supprimer le visiteur."
      );
    } finally {
      setSuppressionId(null);
    }
  }

  // =====================================================
  // RECHERCHE + FILTRE
  // =====================================================

  useEffect(() => {
    let result = [...visiteurs];

    // Recherche
    if (search.trim() !== "") {
      const text = search.toLowerCase();

      result = result.filter((item) => {
        const nom = `${item.nom || ""} ${item.prenom || ""}`.toLowerCase();
        const email = (item.email || "").toLowerCase();
        const nom_entreprise = (item.nom_entreprise || "").toLowerCase();
        const telephone = (item.telephone || "").toLowerCase();

        return (
          nom.includes(text) ||
          email.includes(text) ||
          nom_entreprise.includes(text) ||
          telephone.includes(text)
        );
      });
    }

    // Filtre type commande
    if (filterType !== "Tous") {
      result = result.filter(
        (item) =>
          (item.type_commande || "").toLowerCase() ===
          filterType.toLowerCase()
      );
    }

    setFilteredVisiteurs(result);
  }, [search, filterType, visiteurs]);

  // =====================================================
  // FORMAT DATE
  // =====================================================

  function formatDate(date) {
    if (!date) return "-";

    try {
      return new Date(date).toLocaleDateString("fr-FR");
    } catch {
      return date;
    }
  }

  // =====================================================
  // AFFICHER TYPE
  // =====================================================

  function getTypeLabel(type) {
    if (!type) return "-";

    if (type.toLowerCase() === "vrac") {
      return "Vrac";
    }

    if (type.toLowerCase() === "conditionné") {
      return "Conditionné";
    }

    return type;
  }

  // =====================================================
  // CARTE VISITEUR MOBILE
  // =====================================================

  function renderMobileCard(item, index) {
    return (
      <View style={styles.mobileCard} key={item.id || index}>

        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.prenom?.[0] || "").toUpperCase()}
              {(item.nom?.[0] || "").toUpperCase()}
            </Text>
          </View>

          <View style={styles.cardHeaderInfo}>
            <Text style={styles.cardName}>
              {item.prenom || ""} {item.nom || ""}
            </Text>

            <Text style={styles.cardEmail}>
              {item.email || "-"}
            </Text>
          </View>
        </View>

        <View style={styles.cardSeparator} />

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Entreprise</Text>
          <Text style={styles.infoValue}>
            {item.nom_entreprise || "-"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Téléphone</Text>
          <Text style={styles.infoValue}>
            {item.telephone || "-"}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Type commande</Text>

          <View
            style={[
              styles.typeBadge,
              item.type_commande === "vrac"
                ? styles.vracBadge
                : styles.conditionneBadge,
            ]}
          >
            <Text style={styles.typeBadgeText}>
              {getTypeLabel(item.type_commande)}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Date</Text>

          <Text style={styles.infoValue}>
            {formatDate(item.created_at || item.date_creation)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => {
            router.push({
              pathname: "/admin/visiteurs",
              params: {
                id: item.id,
              },
            });
          }}
        >
          <Ionicons
            name="eye-outline"
            size={18}
            color="#fff"
          />

          <Text style={styles.detailsButtonText}>
            Voir détails
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color="#333"
        />

        <Text style={styles.loadingText}>
          Chargement des visiteurs...
        </Text>
      </View>
    );
  }

  // =====================================================
  // INTERFACE
  // =====================================================

  return (
    <View style={styles.container}>

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <View style={styles.header}>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace("/admin")}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#333"
          />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Text style={styles.title}>
            Visiteurs
          </Text>

          <Text style={styles.subtitle}>
            Gestion et suivi des visiteurs
          </Text>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadVisiteurs}
        >
          <Ionicons
            name="refresh-outline"
            size={21}
            color="#333"
          />
        </TouchableOpacity>

      </View>

      {/* ================================================= */}
      {/* STATISTIQUES */}
      {/* ================================================= */}

      <View style={styles.statsContainer}>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="people-outline"
              size={23}
              color="#333"
            />
          </View>

          <View>
            <Text style={styles.statValue}>
              {visiteurs.length}
            </Text>

            <Text style={styles.statLabel}>
              Total visiteurs
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="water-outline"
              size={23}
              color="#333"
            />
          </View>

          <View>
            <Text style={styles.statValue}>
              {
                visiteurs.filter(
                  (v) =>
                    (v.type_commande || "").toLowerCase() ===
                    "vrac"
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Commandes vrac
            </Text>
          </View>
        </View>

        <View style={styles.statCard}>
          <View style={styles.statIcon}>
            <Ionicons
              name="cube-outline"
              size={23}
              color="#333"
            />
          </View>

          <View>
            <Text style={styles.statValue}>
              {
                visiteurs.filter(
                  (v) =>
                    (v.type_commande || "").toLowerCase() ===
                    "conditionné"
                ).length
              }
            </Text>

            <Text style={styles.statLabel}>
              Commandes conditionnées
            </Text>
          </View>
        </View>

      </View>

      {/* ================================================= */}
      {/* RECHERCHE + FILTRES */}
      {/* ================================================= */}

      <View style={styles.filtersContainer}>

        <View style={styles.searchContainer}>

          <Ionicons
            name="search-outline"
            size={21}
            color="#777"
          />

          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un visiteur..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />

          {search.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearch("")}
            >
              <Ionicons
                name="close-circle"
                size={20}
                color="#999"
              />
            </TouchableOpacity>
          )}

        </View>

        <View style={styles.filterButtons}>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "Tous" &&
                styles.filterButtonActive,
            ]}
            onPress={() => setFilterType("Tous")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "Tous" &&
                  styles.filterTextActive,
              ]}
            >
              Tous
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "vrac" &&
                styles.filterButtonActive,
            ]}
            onPress={() => setFilterType("vrac")}
          >
            <Text
              style={[
                styles.filterText,
                filterType === "vrac" &&
                  styles.filterTextActive,
              ]}
            >
              Vrac
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.filterButton,
              filterType === "conditionné" &&
                styles.filterButtonActive,
            ]}
            onPress={() =>
              setFilterType("conditionné")
            }
          >
            <Text
              style={[
                styles.filterText,
                filterType === "conditionné" &&
                  styles.filterTextActive,
              ]}
            >
              Conditionné
            </Text>
          </TouchableOpacity>

        </View>

      </View>

      {/* ================================================= */}
      {/* TABLE */}
      {/* ================================================= */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
      >
        <View style={styles.tableContainer}>

          {/* HEADER TABLE */}

          <View style={styles.tableHeader}>

            <Text style={[styles.headerCell, styles.colId]}>
              #
            </Text>

            <Text style={[styles.headerCell, styles.colNom]}>
              Nom et Prénom
            </Text>

            

            <Text style={[styles.headerCell, styles.colEmail]}>
              Email
            </Text>

            <Text style={[styles.headerCell, styles.colEntreprise]}>
              Entreprise
            </Text>

            <Text style={[styles.headerCell, styles.colTelephone]}>
              Téléphone
            </Text>

            <Text style={[styles.headerCell, styles.colType]}>
              Type
            </Text>

            <Text style={[styles.headerCell, styles.colDate]}>
              Date
            </Text>

            <Text style={[styles.headerCell, styles.colAction]}>
              Action
            </Text>

          </View>

          {/* LIGNES */}

          <ScrollView
            style={styles.tableBody}
            showsVerticalScrollIndicator
          >
            {filteredVisiteurs.length === 0 ? (

              <View style={styles.emptyContainer}>
                <Ionicons
                  name="people-outline"
                  size={50}
                  color="#bbb"
                />

                <Text style={styles.emptyTitle}>
                  Aucun visiteur trouvé
                </Text>

                <Text style={styles.emptyText}>
                  Aucun visiteur ne correspond à votre recherche.
                </Text>
              </View>

            ) : (

              filteredVisiteurs.map((item, index) => (

                <View
                  key={item.id || index}
                  style={[
                    styles.tableRow,
                    index % 2 === 0 &&
                      styles.tableRowAlternate,
                  ]}
                >

                  <Text style={[styles.cell, styles.colId]}>
                    {index + 1}
                  </Text>

                  <Text style={[styles.cell, styles.colNom]}>
                    {item.nom || "-"}
                  </Text>

                  
                  <Text style={[styles.cell, styles.colEmail]}>
                    {item.email || "-"}
                  </Text>

                  <Text style={[styles.cell, styles.colEntreprise]}>
                    {item.nom_entreprise || "-"}
                  </Text>

                  <Text style={[styles.cell, styles.colTelephone]}>
                    {item.telephone || "-"}
                  </Text>

                  <View
                    style={[
                      styles.typeCell,
                      styles.colType,
                    ]}
                  >
                    <View
                      style={[
                        styles.typeBadge,
                        item.type_commande === "vrac"
                          ? styles.vracBadge
                          : styles.conditionneBadge,
                      ]}
                    >
                      <Text style={styles.typeBadgeText}>
                        {getTypeLabel(item.type_commande)}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cell, styles.colDate]}>
                    {formatDate(
                      item.created_at ||
                        item.date_creation
                    )}
                  </Text>

                  <View style={[styles.actionCell, styles.colAction]}>
                    {suppressionId === item.id ? (
                      <ActivityIndicator color="#c62828" />
                    ) : (
                      <TouchableOpacity
                        onPress={() => demanderSuppression(item)}
                        disabled={suppressionId !== null}
                        accessibilityLabel="Supprimer ce visiteur"
                      >
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color="#c62828"
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                </View>

              ))

            )}
          </ScrollView>

        </View>
      </ScrollView>

    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: "#f7f7f7",
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: "#666",
  },

  // =====================================================
  // HEADER
  // =====================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },

  headerTitle: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#222",
  },

  subtitle: {
    marginTop: 3,
    fontSize: 14,
    color: "#777",
  },

  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
  },

  // =====================================================
  // STATISTIQUES
  // =====================================================

  statsContainer: {
    flexDirection: "row",
    gap: 15,
    padding: 20,
    paddingBottom: 10,
  },

  statCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },

  statIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#f1f1f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  statValue: {
    fontSize: 23,
    fontWeight: "700",
    color: "#222",
  },

  statLabel: {
    fontSize: 13,
    color: "#777",
    marginTop: 2,
  },

  // =====================================================
  // FILTRES
  // =====================================================

  filtersContainer: {
    backgroundColor: "#fff",
    marginHorizontal: 20,
    marginBottom: 15,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  searchContainer: {
    height: 45,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
  },

  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: "#222",
  },

  filterButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },

  filterButton: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: "#f1f1f1",
  },

  filterButtonActive: {
    backgroundColor: "#333",
  },

  filterText: {
    fontSize: 14,
    color: "#555",
    fontWeight: "500",
  },

  filterTextActive: {
    color: "#fff",
  },

  // =====================================================
  // TABLE
  // =====================================================

  tableContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    backgroundColor: "#fff",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e1e1e1",
    minWidth: 1300,
  },

  tableHeader: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#333",
  },

  tableBody: {
    maxHeight: 500,
  },

  tableRow: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  tableRowAlternate: {
    backgroundColor: "#fafafa",
  },

  headerCell: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
    paddingHorizontal: 12,
  },

  cell: {
    fontSize: 14,
    color: "#333",
    paddingHorizontal: 12,
  },

  typeCell: {
    paddingHorizontal: 12,
    justifyContent: "center",
  },

  // =====================================================
  // LARGEURS COLONNES
  // =====================================================

  colId: {
    width: 60,
  },

  colNom: {
    width: 150,
  },

 

  colEmail: {
    width: 260,
  },

  colEntreprise: {
    width: 200,
  },

  colTelephone: {
    width: 150,
  },

  colType: {
    width: 150,
  },

  colDate: {
    width: 130,
  },

  colAction: {
    width: 80,
  },

  actionCell: {
    alignItems: "center",
    justifyContent: "center",
  },

  // =====================================================
  // BADGES
  // =====================================================

  typeBadge: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },

  vracBadge: {
    backgroundColor: "#e8f5e9",
  },

  conditionneBadge: {
    backgroundColor: "#fff3e0",
  },

  typeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#444",
  },

  // =====================================================
  // EMPTY
  // =====================================================

  emptyContainer: {
    width: 1300,
    paddingVertical: 70,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyTitle: {
    marginTop: 15,
    fontSize: 17,
    fontWeight: "600",
    color: "#555",
  },

  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: "#999",
  },

  // =====================================================
  // MOBILE CARD
  // =====================================================

  mobileCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e5e5",
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: "#333",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  avatarText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },

  cardHeaderInfo: {
    flex: 1,
  },

  cardName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
  },

  cardEmail: {
    fontSize: 13,
    color: "#777",
    marginTop: 3,
  },

  cardSeparator: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 14,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  infoLabel: {
    fontSize: 13,
    color: "#777",
  },

  infoValue: {
    fontSize: 14,
    color: "#333",
    fontWeight: "500",
  },

  detailsButton: {
    marginTop: 8,
    backgroundColor: "#333",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  detailsButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 7,
  },
});