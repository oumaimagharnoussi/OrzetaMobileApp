import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "../../context/AuthContext";

export default function AdminHome() {

  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Administration
      </Text>

      <Text style={styles.welcome}>
        Bonjour {user?.prenom} {user?.nom}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/admin/commerciaux")
        }
      >
        <Text style={styles.buttonText}>
          Gestion des commerciaux
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/admin/visiteurs")
        }
      >
        <Text style={styles.buttonText}>
          Tous les visiteurs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/admin/moteur")
        }
      >
        <Text style={styles.buttonText}>
          Fiche MOTEUR (coûts & prix)
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/archives")
        }
      >
        <Text style={styles.buttonText}>
          Fiches PDF validées
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logout}
        onPress={handleLogout}
      >
        <Text style={styles.logoutText}>
          Déconnexion
        </Text>
      </TouchableOpacity>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 25,
    justifyContent: "center",
  },

  title: {
    fontSize: 30,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },

  welcome: {
    textAlign: "center",
    marginBottom: 30,
  },

  button: {
    backgroundColor: "#222",
    padding: 16,
    borderRadius: 10,
    marginBottom: 15,
  },

  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },

  logout: {
    padding: 15,
    marginTop: 20,
  },

  logoutText: {
    color: "red",
    textAlign: "center",
  },
});