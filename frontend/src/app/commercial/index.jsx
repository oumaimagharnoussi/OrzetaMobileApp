import React from "react";

import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";

import { router } from "expo-router";

import { useAuth } from "../../context/AuthContext";

export default function CommercialHome() {

  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/auth/login");
  }

  return (
    <View style={styles.container}>

      <Text style={styles.title}>
        Espace Commercial
      </Text>

      <Text style={styles.welcome}>
        Bonjour {user?.prenom} {user?.nom}
      </Text>

      <Text style={styles.email}>
        {user?.email}
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/commercial")
        }
      >
        <Text style={styles.buttonText}>
          Mes visiteurs
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          router.push("/visiteur")
        }
      >
        <Text style={styles.buttonText}>
          Nouveau visiteur
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
  },

  welcome: {
    textAlign: "center",
    fontSize: 20,
    marginTop: 20,
  },

  email: {
    textAlign: "center",
    color: "#777",
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
    marginTop: 20,
    padding: 15,
  },

  logoutText: {
    textAlign: "center",
    color: "red",
  },
});