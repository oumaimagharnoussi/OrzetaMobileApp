import React, {
  useCallback,
  useState,
} from "react";

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
import {
  router,
  useFocusEffect,
} from "expo-router";

import { apiFetch } from "../../services/api";

export default function Commerciaux() {
  const [commerciaux, setCommerciaux] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // =====================================================
  // CHARGER LES COMMERCIAUX
  // =====================================================

  const loadCommerciaux = useCallback(
    async (showLoader = true) => {
      try {
        if (showLoader) {
          setLoading(true);
        }

        const data = await apiFetch(
          "/api/admin/commerciaux"
        );

        setCommerciaux(
          Array.isArray(data.commerciaux)
            ? data.commerciaux
            : []
        );

      } catch (error) {
        console.error(
          "❌ ERREUR CHARGEMENT COMMERCIAUX :",
          error
        );

        Alert.alert(
          "Erreur",
          error.message ||
            "Impossible de charger les commerciaux."
        );

      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    },
    []
  );

  // =====================================================
  // CHARGER À CHAQUE RETOUR SUR LA PAGE
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      loadCommerciaux();

      return () => {};
    }, [loadCommerciaux])
  );

  // =====================================================
  // ACTIVER / DESACTIVER
  // =====================================================

  function toggleCommercial(item) {
    const isActive = Number(item.actif) === 1;

    const action = isActive
      ? "désactiver"
      : "activer";

    const endpoint = isActive
      ? `/api/admin/commerciaux/${item.id}/desactiver`
      : `/api/admin/commerciaux/${item.id}/activer`;

    Alert.alert(
      isActive
        ? "Désactiver le commercial"
        : "Activer le commercial",

      isActive
        ? `Voulez-vous désactiver le compte de ${item.prenom || ""} ${item.nom || ""} ?`
        : `Voulez-vous activer le compte de ${item.prenom || ""} ${item.nom || ""} ?`,

      [
        {
          text: "Annuler",
          style: "cancel",
        },

        {
          text:
            isActive
              ? "Désactiver"
              : "Activer",

          style:
            isActive
              ? "destructive"
              : "default",

          onPress: async () => {
            try {
              setActionLoading(item.id);

              await apiFetch(
                endpoint,
                {
                  method: "PUT",
                }
              );

              await loadCommerciaux(false);

            } catch (error) {
              console.error(
                `❌ ERREUR POUR ${action} LE COMMERCIAL :`,
                error
              );

              Alert.alert(
                "Erreur",
                error.message ||
                  `Impossible de ${action} le commercial.`
              );

            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  }

  // =====================================================
  // AJOUTER COMMERCIAL
  // =====================================================

  function handleAddCommercial() {
    router.push(
      "/admin/ajouter-commercial"
    );
  }

  // =====================================================
  // RETOUR ADMIN
  // =====================================================

  function handleBack() {
    router.replace("/admin");
  }

  // =====================================================
  // AFFICHAGE D'UNE LIGNE
  // =====================================================

  function renderCommercial({
    item,
    index,
  }) {
    const isActive =
      Number(item.actif) === 1;

    const isActionLoading =
      actionLoading === item.id;

    return (
      <View
        style={[
          styles.tableRow,

          index % 2 === 0 &&
            styles.tableRowAlternate,
        ]}
      >

        {/* ================================================= */}
        {/* NOM */}
        {/* ================================================= */}

        <View
          style={[
            styles.cell,
            styles.nameCell,
          ]}
        >
          <Text
            style={styles.cellText}
            numberOfLines={1}
          >
            {item.nom || "-"}
          </Text>
        </View>

        {/* ================================================= */}
        {/* PRÉNOM */}
        {/* ================================================= */}

        <View
          style={[
            styles.cell,
            styles.firstNameCell,
          ]}
        >
          <Text
            style={styles.cellText}
            numberOfLines={1}
          >
            {item.prenom || "-"}
          </Text>
        </View>

        {/* ================================================= */}
        {/* EMAIL */}
        {/* ================================================= */}

        <View
          style={[
            styles.cell,
            styles.emailCell,
          ]}
        >
          <Text
            style={styles.cellText}
            numberOfLines={1}
          >
            {item.email || "-"}
          </Text>
        </View>

        {/* ================================================= */}
        {/* STATUT */}
        {/* ================================================= */}

        <View
          style={[
            styles.cell,
            styles.statusCell,
          ]}
        >
          <View
            style={[
              styles.statusBadge,

              isActive
                ? styles.activeBadge
                : styles.inactiveBadge,
            ]}
          >

            <View
              style={[
                styles.statusDot,

                isActive
                  ? styles.activeDot
                  : styles.inactiveDot,
              ]}
            />

            <Text
              style={[
                styles.statusText,

                isActive
                  ? styles.activeText
                  : styles.inactiveText,
              ]}
            >
              {isActive
                ? "Actif"
                : "Inactif"}
            </Text>

          </View>
        </View>

        {/* ================================================= */}
        {/* ACTION */}
        {/* ================================================= */}

        <View
          style={[
            styles.cell,
            styles.actionCell,
          ]}
        >

<TouchableOpacity
  style={[
    styles.actionButton,
    isActive
      ? styles.disableButton
      : styles.enableButton,
    isActionLoading && styles.disabledButton,
  ]}
  onPress={async () => {
    console.log("🟢 BOUTON CLIQUÉ");
    console.log("ID COMMERCIAL :", item.id);
    console.log("ACTIF :", item.actif);

    try {
      setActionLoading(item.id);

      const endpoint = isActive
        ? `/api/admin/commerciaux/${item.id}/desactiver`
        : `/api/admin/commerciaux/${item.id}/activer`;

      console.log("📡 ENVOI :", endpoint);

      const result = await apiFetch(endpoint, {
        method: "PUT",
      });

      console.log("✅ RÉPONSE API :", result);

      await loadCommerciaux(false);

    } catch (error) {
      console.error("❌ ERREUR API :", error);

      Alert.alert(
        "Erreur",
        error.message || "Erreur lors de la modification."
      );

    } finally {
      setActionLoading(null);
    }
  }}
  disabled={isActionLoading}
>
  {isActionLoading ? (
    <ActivityIndicator
      size="small"
      color="#fff"
    />
  ) : (
    <>
      <Ionicons
        name={
          isActive
            ? "close-circle-outline"
            : "checkmark-circle-outline"
        }
        size={18}
        color="#fff"
      />

      <Text style={styles.actionButtonText}>
        {isActive
          ? "Désactiver"
          : "Activer"}
      </Text>
    </>
  )}
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

        {/* RETOUR */}

        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color="#333"
          />
        </TouchableOpacity>

        {/* TITRE */}

        <View
          style={
            styles.headerTitleContainer
          }
        >
          <Text style={styles.title}>
            Commerciaux
          </Text>

          <Text style={styles.subtitle}>
            Gestion des commerciaux
          </Text>
        </View>

        {/* AJOUTER */}

        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCommercial}
        >

          <Ionicons
            name="add"
            size={22}
            color="#fff"
          />

          <Text
            style={styles.addButtonText}
          >
            Ajouter un commercial
          </Text>

        </TouchableOpacity>

      </View>

      {/* ================================================= */}
      {/* TABLEAU */}
      {/* ================================================= */}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator
      >

        <View style={styles.table}>

          {/* ================================================= */}
          {/* EN-TÊTE */}
          {/* ================================================= */}

          <View style={styles.tableHeader}>

            {/* NOM */}

            <View
              style={[
                styles.headerCell,
                styles.nameCell,
              ]}
            >
              <Text
                style={styles.headerText}
              >
                Nom
              </Text>
            </View>

            {/* PRÉNOM */}

            <View
              style={[
                styles.headerCell,
                styles.firstNameCell,
              ]}
            >
              <Text
                style={styles.headerText}
              >
                Prénom
              </Text>
            </View>

            {/* EMAIL */}

            <View
              style={[
                styles.headerCell,
                styles.emailCell,
              ]}
            >
              <Text
                style={styles.headerText}
              >
                Email
              </Text>
            </View>

            {/* STATUT */}

            <View
              style={[
                styles.headerCell,
                styles.statusCell,
              ]}
            >
              <Text
                style={styles.headerText}
              >
                Statut
              </Text>
            </View>

            {/* ACTION */}

            <View
              style={[
                styles.headerCell,
                styles.actionCell,
              ]}
            >
              <Text
                style={styles.headerText}
              >
                Action
              </Text>
            </View>

          </View>

          {/* ================================================= */}
          {/* LISTE */}
          {/* ================================================= */}

          {commerciaux.length === 0 ? (

            <View
              style={
                styles.emptyContainer
              }
            >

              <Ionicons
                name="people-outline"
                size={45}
                color="#aaa"
              />

              <Text
                style={styles.emptyText}
              >
                Aucun commercial trouvé.
              </Text>

              <TouchableOpacity
                style={
                  styles.emptyAddButton
                }
                onPress={
                  handleAddCommercial
                }
              >

                <Ionicons
                  name="add"
                  size={18}
                  color="#fff"
                />

                <Text
                  style={
                    styles.emptyAddButtonText
                  }
                >
                  Ajouter un commercial
                </Text>

              </TouchableOpacity>

            </View>

          ) : (

            <FlatList
              data={commerciaux}
              keyExtractor={(item) =>
                String(item.id)
              }
              renderItem={
                renderCommercial
              }
              showsVerticalScrollIndicator
              refreshing={loading}
              onRefresh={() =>
                loadCommerciaux()
              }
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

  // =====================================================
  // CONTAINER
  // =====================================================

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
    alignItems: "center",
    marginBottom: 25,
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
  // LARGEURS
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

  disabledButton: {
    opacity: 0.7,
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
    height: 300,
    justifyContent: "center",
    alignItems: "center",
  },

  emptyText: {
    marginTop: 10,
    marginBottom: 18,
    color: "#888",
    fontSize: 15,
  },

  emptyAddButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#222",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },

  emptyAddButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
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

});