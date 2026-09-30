import React, { useEffect, useState } from "react";

import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";

import { apiFetch } from "../../services/api";

export default function Commerciaux() {

  const [commerciaux, setCommerciaux] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadCommerciaux() {

    try {

      setLoading(true);

      const data = await apiFetch(
        "/api/admin/commerciaux"
      );

      setCommerciaux(data.commerciaux || []);

    } catch (error) {

      Alert.alert(
        "Erreur",
        error.message
      );

    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommerciaux();
  }, []);

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
        error.message
      );
    }
  }

  function renderCommercial({ item }) {

    return (
      <View style={styles.card}>

        <Text style={styles.name}>
          {item.prenom} {item.nom}
        </Text>

        <Text style={styles.email}>
          {item.email}
        </Text>

        <Text
          style={[
            styles.status,
            {
              color: item.actif
                ? "green"
                : "red",
            },
          ]}
        >
          {item.actif
            ? "Actif"
            : "Désactivé"}
        </Text>

        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: item.actif
                ? "#c62828"
                : "#2e7d32",
            },
          ]}
          onPress={() =>
            toggleCommercial(item)
          }
        >
          <Text style={styles.buttonText}>
            {item.actif
              ? "Désactiver"
              : "Activer"}
          </Text>
        </TouchableOpacity>

      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Commerciaux
      </Text>

      <FlatList
        data={commerciaux}
        keyExtractor={(item) =>
          String(item.id)
        }
        renderItem={renderCommercial}
        refreshing={loading}
        onRefresh={loadCommerciaux}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },

  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 20,
  },

  card: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 15,
    marginBottom: 12,
  },

  name: {
    fontSize: 18,
    fontWeight: "bold",
  },

  email: {
    color: "#666",
    marginTop: 5,
  },

  status: {
    marginTop: 8,
    fontWeight: "bold",
  },

  button: {
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
});