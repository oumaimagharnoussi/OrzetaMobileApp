import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { apiFetch } from "../../services/api";

export default function Commerciaux() {
  const [commerciaux, setCommerciaux] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // CHARGER LES COMMERCIAUX
  // =====================================================

  async function loadCommerciaux() {
    try {
      setLoading(true);

      const data = await apiFetch(
        "/api/admin/commerciaux"
      );

      setCommerciaux(data.commerciaux || []);

    } catch (error) {
      console.error(
        "Erreur chargement commerciaux :",
        error
      );

      Alert.alert(
        "Erreur",
        error.message || "Impossible de charger les commerciaux."
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommerciaux();
  }, []);

  // =====================================================
  // ACTIVER / DESACTIVER
  // =====================================================

  async function toggleCommercial(item) {
    try {
      const endpoint = item.actif
        ? `/api/admin/commerciaux/${item.id}/desactiver`
        : `/api/admin/commerciaux/${item.id}/activer`;

      await apiFetch(endpoint, {
        method: "PUT",
      });

      await loadCommerciaux();

    } catch (error) {
      Alert.alert(
        "Erreur",
        error.message || "Une erreur est survenue."
      );
    }
  }

  // =====================================================
  // AJOUTER COMMERCIAL
  // =====================================================

  function handleAddCommercial() {
    router.push("/admin/ajouter-commercial");
  }

  // =====================================================
  // AFFICHAGE D'UNE LIGNE
  // =====================================================

  function renderCommercial({ item, index }) {
    return (
      <View
        style={[
          styles.tableRow,
          index % 2 === 0 && styles.tableRowAlternate,
        ]}
      >

        {/* NOM */}
        <View style={[styles.cell, styles.nameCell]}>
          <Text style={styles.cellText}>
            {item.nom || "-"}
          </Text>
        </View>

        {/* PRÉNOM */}
        <View style={[styles.cell, styles.firstNameCell]}>
          <Text style={styles.cellText}>
            {item.prenom || "-"}
          </Text>
        </View>

        {/* EMAIL */}
        <View style={[styles.cell, styles.emailCell]}>
          <Text
            style={styles.cellText}
            numberOfLines={1}
          >
            {item.email || "-"}
          </Text>
        </View>

        {/* STATUT */}
        <View style={[styles.cell, styles.statusCell]}>
          <View
            style={[
              styles.statusBadge,
              item.actif
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                item.actif
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,
                item.actif
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {item.actif
                ? "Actif"
                : "Désactivé"}
            </Text>
          </View>
        </View>

        {/* ACTION */}
        <View style={[styles.cell, styles.actionCell]}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              item.actif
                ? styles.disableButton
                : styles.enableButton,
            ]}
            onPress={() =>
              toggleCommercial(item)
            }
          >
            <Ionicons
              name={
                item.actif
                  ? "close-circle-outline"
                  : "checkmark-circle-outline"
              }
              size={18}
              color="#fff"
            />

            <Text style={styles.actionButtonText}>
              {item.actif
                ? "Désactiver"
                : "Activer"}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    );
  }

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator
          size="large"
          color="#222"
        />

        <Text style={styles.loadingText}>
          Chargement des commerciaux...
        </Text>
      </View>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <View style={styles.container}>

{/* ================================================= */}
{/* HEADER */}
{/* ================================================= */}

<View style={styles.header}>

  {/* Retour vers Admin */}
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

  {/* Titre */}
  <View style={styles.headerTitleContainer}>
    <Text style={styles.title}>
      Commerciaux
    </Text>

    <Text style={styles.subtitle}>
      Gestion des commerciaux
    </Text>
  </View>

  {/* Ajouter un commercial */}
  <TouchableOpacity
    style={styles.addButton}
    onPress={handleAddCommercial}
  >
    <Ionicons
      name="add"
      size={22}
      color="#fff"
    />

    <Text style={styles.addButtonText}>
      Ajouter un commercial
    </Text>
  </TouchableOpacity>

</View>

      {/* ================================================= */}
      {/* TABLEAU */}
      {/* ================================================= */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={true}
      >

        <View style={styles.table}>

          {/* EN-TÊTE DU TABLEAU */}

          <View style={styles.tableHeader}>

            <View
              style={[
                styles.headerCell,
                styles.nameCell,
              ]}
            >
              <Text style={styles.headerText}>
                Nom
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.firstNameCell,
              ]}
            >
              <Text style={styles.headerText}>
                Prénom
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.emailCell,
              ]}
            >
              <Text style={styles.headerText}>
                Email
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.statusCell,
              ]}
            >
              <Text style={styles.headerText}>
                Statut
              </Text>
            </View>

            <View
              style={[
                styles.headerCell,
                styles.actionCell,
              ]}
            >
              <Text style={styles.headerText}>
                Action
              </Text>
            </View>

          </View>

          {/* LIGNES */}

          {commerciaux.length === 0 ? (

            <View style={styles.emptyContainer}>

              <Ionicons
                name="people-outline"
                size={45}
                color="#aaa"
              />

              <Text style={styles.emptyText}>
                Aucun commercial trouvé.
              </Text>

            </View>

          ) : (

            <FlatList
              data={commerciaux}
              keyExtractor={(item) =>
                String(item.id)
              }
              renderItem={renderCommercial}
              refreshing={loading}
              onRefresh={loadCommerciaux}
              showsVerticalScrollIndicator={true}
            />

          )}

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
    padding: 25,
  },

  // =====================================================
  // HEADER
  // =====================================================

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 25,
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#222",
  },

  subtitle: {
    fontSize: 14,
    color: "#777",
    marginTop: 4,
  },

  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 7,
  },

  addButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },

  // =====================================================
  // TABLEAU
  // =====================================================

  table: {
    minWidth: 950,
    backgroundColor: "#fff",
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#ddd",
  },

  // =====================================================
  // HEADER TABLEAU
  // =====================================================

  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#222",
    minHeight: 55,
    alignItems: "center",
  },

  headerCell: {
    paddingHorizontal: 15,
    justifyContent: "center",
  },

  headerText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // =====================================================
  // LIGNES
  // =====================================================

  tableRow: {
    flexDirection: "row",
    minHeight: 65,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  tableRowAlternate: {
    backgroundColor: "#fafafa",
  },

  cell: {
    paddingHorizontal: 15,
    justifyContent: "center",
  },

  cellText: {
    fontSize: 14,
    color: "#333",
  },

  // =====================================================
  // LARGEURS DES COLONNES
  // =====================================================

  nameCell: {
    width: 150,
  },

  firstNameCell: {
    width: 150,
  },

  emailCell: {
    width: 280,
  },

  statusCell: {
    width: 160,
  },

  actionCell: {
    width: 210,
  },

  // =====================================================
  // STATUT
  // =====================================================

  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },

  activeBadge: {
    backgroundColor: "#E8F5E9",
  },

  inactiveBadge: {
    backgroundColor: "#FFEBEE",
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 7,
  },

  activeDot: {
    backgroundColor: "#2e7d32",
  },

  inactiveDot: {
    backgroundColor: "#c62828",
  },

  statusText: {
    fontSize: 13,
    fontWeight: "600",
  },

  activeText: {
    color: "#2e7d32",
  },

  inactiveText: {
    color: "#c62828",
  },

  // =====================================================
  // BOUTON ACTION
  // =====================================================

  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 7,
    width: 150,
    gap: 6,
  },

  disableButton: {
    backgroundColor: "#c62828",
  },

  enableButton: {
    backgroundColor: "#2e7d32",
  },

  actionButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },

  // =====================================================
  // EMPTY
  // =====================================================

  emptyContainer: {
    height: 250,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    marginTop: 10,
    color: "#888",
    fontSize: 15,
  },

  // =====================================================
  // LOADING
  // =====================================================

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
  },

  loadingText: {
    marginTop: 10,
    color: "#666",
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f1f1f1",
    marginRight: 15,
  },
  
  headerTitleContainer: {
    flex: 1,
  },
});