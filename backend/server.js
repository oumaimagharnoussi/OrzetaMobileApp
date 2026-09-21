const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");

console.log("=================================");
console.log("SERVER.JS DEMARRE");
console.log("=================================");

const app = express();
const PORT = 5000;

// ==================================================
// MIDDLEWARES
// ==================================================

app.use(cors());
app.use(express.json());

// ==================================================
// MYSQL
// ==================================================

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "visiteurs_db",
};

let db;

// ==================================================
// CONNEXION MYSQL
// ==================================================

async function connectDatabase() {

    console.log("Connexion à MySQL...");

    db = await mysql.createPool({
        ...dbConfig,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    // Test connexion
    const connection = await db.getConnection();
    connection.release();

    console.log("MYSQL CONNECTÉ");
    console.log("Base :", dbConfig.database);
}

// ==================================================
// VÉRIFIER TABLE
// ==================================================

async function checkTable() {

    console.log("Vérification de la table visiteurs...");

    const sql = `
        CREATE TABLE IF NOT EXISTS visiteurs (

            id INT AUTO_INCREMENT PRIMARY KEY,

            nom VARCHAR(100) NOT NULL,
            email VARCHAR(150),
            sexe VARCHAR(50),
            origine VARCHAR(100),
            indicatif VARCHAR(10),
            telephone VARCHAR(50),
            societe VARCHAR(150),
            adresse_societe VARCHAR(255),
            type_commande VARCHAR(100),
            fonction VARCHAR(100),
            langue_communication VARCHAR(100),

            qualite_grade VARCHAR(150),
            volume_estime DECIMAL(15,2),
            destination VARCHAR(255),
            incoterm VARCHAR(50),
            format_livraison VARCHAR(100),
            frequence_commande VARCHAR(100),
            exigences_specifiques TEXT,
            informations_complementaires TEXT,

            pays_conditionne VARCHAR(150),
            canal_distribution VARCHAR(100),
            volumes_estimes VARCHAR(150),
            formats_souhaites VARCHAR(150),
            type_marque VARCHAR(100),
            certifications_requises TEXT,
            nom_entreprise VARCHAR(150),
            site_web VARCHAR(255),
            contact_professionnel VARCHAR(150),

            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    await db.query(sql);

    console.log("TABLE visiteurs OK");
}

// ==================================================
// ROUTE TEST
// ==================================================

app.get("/", (req, res) => {

    console.log("GET /");

    res.json({
        success: true,
        message: "API My App fonctionne correctement",
    });
});

// ==================================================
// GET VISITEURS
// ==================================================

app.get("/api/visiteurs", async (req, res) => {

    console.log("GET /api/visiteurs");

    try {

        const [rows] = await db.query(`
            SELECT *
            FROM visiteurs
            ORDER BY id DESC
        `);

        console.log(
            "Nombre de visiteurs :",
            rows.length
        );

        res.json({
            success: true,
            visiteurs: rows,
        });

    } catch (error) {

        console.error(
            "ERREUR GET :",
            error.message
        );

        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
});

// ==================================================
// POST VISITEUR
// ==================================================

app.post("/api/visiteurs", async (req, res) => {

    console.log("");
    console.log("=================================");
    console.log("POST /api/visiteurs");
    console.log("=================================");

    console.log(
        "BODY :",
        JSON.stringify(req.body, null, 2)
    );

    try {

        const {
            nom,
            email,
            sexe,
            origine,
            indicatif,
            telephone,
            societe,
            adresse_societe,
            type_commande,
            fonction,
            langue_communication,

            // VRAC
            qualite_grade,
            volume_estime,
            destination,
            incoterm,
            format_livraison,
            frequence_commande,
            exigences_specifiques,
            informations_complementaires,

            // CONDITIONNÉ
            pays_conditionne,
            canal_distribution,
            volumes_estimes,
            formats_souhaites,
            type_marque,
            certifications_requises,
            nom_entreprise,
            site_web,
            contact_professionnel,

        } = req.body;

        // ==================================================
        // VALIDATION
        // ==================================================

        if (!nom || !email || !telephone) {

            return res.status(400).json({
                success: false,
                message:
                    "Nom, email et téléphone sont obligatoires.",
            });
        }

        if (!type_commande) {

            return res.status(400).json({
                success: false,
                message:
                    "Le type de commande est obligatoire.",
            });
        }

        // ==================================================
        // VRAC
        // ==================================================

        let qualiteGradeValue = null;
        let volumeEstimeValue = null;
        let destinationValue = null;
        let incotermValue = null;
        let formatLivraisonValue = null;
        let frequenceCommandeValue = null;
        let exigencesSpecifiquesValue = null;
        let informationsComplementairesValue = null;

        if (type_commande === "vrac") {

            qualiteGradeValue =
                qualite_grade || null;

            if (
                volume_estime !== undefined &&
                volume_estime !== null &&
                volume_estime !== ""
            ) {

                volumeEstimeValue =
                    Number(volume_estime);

                if (
                    Number.isNaN(volumeEstimeValue)
                ) {

                    return res.status(400).json({
                        success: false,
                        message:
                            "Le volume estimé doit être un nombre.",
                    });
                }
            }

            destinationValue =
                destination || null;

            incotermValue =
                incoterm || null;

            formatLivraisonValue =
                format_livraison || null;

            frequenceCommandeValue =
                frequence_commande || null;

            if (
                Array.isArray(
                    exigences_specifiques
                )
            ) {

                exigencesSpecifiquesValue =
                    JSON.stringify(
                        exigences_specifiques
                    );

            } else {

                exigencesSpecifiquesValue =
                    exigences_specifiques || null;
            }

            informationsComplementairesValue =
                informations_complementaires || null;
        }

        // ==================================================
        // CONDITIONNÉ
        // ==================================================

        let paysConditionneValue = null;
        let canalDistributionValue = null;
        let volumesEstimesValue = null;
        let formatsSouhaitesValue = null;
        let typeMarqueValue = null;
        let certificationsRequisesValue = null;
        let nomEntrepriseValue = null;
        let siteWebValue = null;
        let contactProfessionnelValue = null;

        if (
            type_commande === "conditionne"
        ) {

            paysConditionneValue =
                pays_conditionne || null;

            canalDistributionValue =
                canal_distribution || null;

            volumesEstimesValue =
                volumes_estimes || null;

            formatsSouhaitesValue =
                formats_souhaites || null;

            typeMarqueValue =
                type_marque || null;

            if (
                Array.isArray(
                    certifications_requises
                )
            ) {

                certificationsRequisesValue =
                    JSON.stringify(
                        certifications_requises
                    );

            } else {

                certificationsRequisesValue =
                    certifications_requises || null;
            }

            nomEntrepriseValue =
                nom_entreprise || null;

            siteWebValue =
                site_web || null;

            contactProfessionnelValue =
                contact_professionnel || null;
        }

        // ==================================================
        // VALEURS MYSQL
        // ==================================================

        const values = [

            nom || null,
            email || null,
            sexe || null,
            origine || null,
            indicatif || null,
            telephone || null,
            societe || null,
            adresse_societe || null,
            type_commande || null,
            fonction || null,
            langue_communication || null,

            qualiteGradeValue,
            volumeEstimeValue,
            destinationValue,
            incotermValue,
            formatLivraisonValue,
            frequenceCommandeValue,
            exigencesSpecifiquesValue,
            informationsComplementairesValue,

            paysConditionneValue,
            canalDistributionValue,
            volumesEstimesValue,
            formatsSouhaitesValue,
            typeMarqueValue,
            certificationsRequisesValue,
            nomEntrepriseValue,
            siteWebValue,
            contactProfessionnelValue,
        ];

        console.log(
            "Nombre de valeurs :",
            values.length
        );

        // ==================================================
        // INSERT
        // ==================================================

        const sql = `
            INSERT INTO visiteurs (

                nom,
                email,
                sexe,
                origine,
                indicatif,
                telephone,
                societe,
                adresse_societe,
                type_commande,
                fonction,
                langue_communication,

                qualite_grade,
                volume_estime,
                destination,
                incoterm,
                format_livraison,
                frequence_commande,
                exigences_specifiques,
                informations_complementaires,

                pays_conditionne,
                canal_distribution,
                volumes_estimes,
                formats_souhaites,
                type_marque,
                certifications_requises,
                nom_entreprise,
                site_web,
                contact_professionnel

            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        `;

        console.log("Insertion MySQL...");

        const [result] =
            await db.query(sql, values);

        console.log(
            "VISITEUR ENREGISTRÉ ! ID =",
            result.insertId
        );

        res.status(201).json({

            success: true,

            message:
                "Visiteur ajouté avec succès",

            id:
                result.insertId,
        });

    } catch (error) {

        console.error("");
        console.error(
            "================================="
        );
        console.error(
            "ERREUR MYSQL / POST"
        );
        console.error(
            "================================="
        );

        console.error(error);

        res.status(500).json({

            success: false,

            message:
                "Erreur lors de l'enregistrement",

            error:
                error.message,
        });
    }
});

// ==================================================
// DELETE
// ==================================================

app.delete(
    "/api/visiteurs/:id",
    async (req, res) => {

        try {

            const { id } = req.params;

            const [result] =
                await db.query(
                    `
                    DELETE FROM visiteurs
                    WHERE id = ?
                    `,
                    [id]
                );

            if (
                result.affectedRows === 0
            ) {

                return res.status(404).json({
                    success: false,
                    message:
                        "Visiteur introuvable",
                });
            }

            res.json({
                success: true,
                message:
                    "Visiteur supprimé",
            });

        } catch (error) {

            console.error(
                "ERREUR DELETE :",
                error
            );

            res.status(500).json({
                success: false,
                message:
                    error.message,
            });
        }
    }
);

// ==================================================
// DÉMARRAGE
// ==================================================

async function startServer() {

    try {

        await connectDatabase();

        await checkTable();

        const server =
            app.listen(
                PORT,
                "0.0.0.0",
                () => {

                    console.log("");
                    console.log(
                        "================================="
                    );
                    console.log(
                        "SERVEUR NODE.JS DÉMARRÉ"
                    );
                    console.log(
                        "================================="
                    );

                    console.log(
                        "Local : http://localhost:5000"
                    );

                    console.log(
                        "Réseau : http://192.168.1.146:5000"
                    );

                    console.log("");
                    console.log(
                        "API : http://localhost:5000/api/visiteurs"
                    );

                    console.log("");
                    console.log(
                        "SERVEUR EN ÉCOUTE..."
                    );

                    console.log(
                        "================================="
                    );
                }
            );

        // Garder une référence au serveur
        server.on("error", (error) => {

            console.error(
                "ERREUR SERVEUR :",
                error
            );

        });

    } catch (error) {

        console.error("");
        console.error(
            "================================="
        );
        console.error(
            "ERREUR DÉMARRAGE"
        );
        console.error(
            "================================="
        );

        console.error(error);

        process.exit(1);
    }
}

startServer();
